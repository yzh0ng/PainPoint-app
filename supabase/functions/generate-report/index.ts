// Generates a clinical-grade pain summary + advocacy questions via Lovable AI.
// Uses tool-calling for structured output so the response shape is reliable.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type IncomingLog = {
  at: string;
  region: string;
  side: string | null;
  type: string;
  intensity: number;
  trigger: string | null;
  note: string | null;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { condition, range_days, logs } = (await req.json()) as {
      condition?: string;
      range_days?: number;
      logs?: IncomingLog[];
    };

    if (!Array.isArray(logs) || logs.length === 0) {
      return new Response(JSON.stringify({ error: "No logs provided." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Compact log digest to keep the prompt small.
    const compact = logs
      .slice(-300)
      .map(
        (l) =>
          `${new Date(l.at).toISOString().slice(0, 16).replace("T", " ")} | ${l.region} | ${l.type} | ${l.intensity}/10 | trig=${l.trigger ?? "-"}${l.note ? ` | "${l.note.slice(0, 120)}"` : ""}`,
      )
      .join("\n");

    const system = `You are an experienced clinician's scribe writing a concise, factual pain summary for a primary care or pain specialist appointment. 
- Tone: matter-of-fact, neutral, no diagnosis, no treatment advice, no anxious language.
- Use the patient's data only. Do not invent numbers.
- Patterns must be statistically meaningful (>= 3 data points). If there isn't enough data, say so briefly.
- Red flags only when objectively warranted: intensity >= 8 sustained, sudden new region, rapid worsening trend.
- The advocacy questions are for the patient to ask their doctor. They should be specific to the patient's pattern, not generic ("Have you tried yoga?" is bad). Use a calm, matter-of-fact tone. 4–7 questions.`;

    const user = `Patient self-reported condition: ${condition ?? "unspecified"}.
Tracking window: last ${range_days ?? "?"} days. ${logs.length} logs.

Pain log entries (UTC, region, type, intensity 0-10, trigger, optional note):
${compact}

Produce the structured report.`;

    const tools = [
      {
        type: "function",
        function: {
          name: "emit_report",
          description: "Return the structured doctor-ready pain report.",
          parameters: {
            type: "object",
            properties: {
              chief_complaint: {
                type: "string",
                description:
                  "One sentence in plain language summarizing the dominant complaint based on the data.",
              },
              summary_paragraph: {
                type: "string",
                description:
                  "120-200 word factual clinical summary: timeline, dominant regions, types, intensity pattern, triggers if clear.",
              },
              pattern_callouts: {
                type: "array",
                items: { type: "string" },
                description:
                  "0-5 short, specific patterns. Empty if data is insufficient. e.g. 'Worse mornings (avg 6.2 vs 4.1 evenings, n=18)'.",
              },
              red_flags: {
                type: "array",
                items: { type: "string" },
                description:
                  "0-3 items. Only objectively warranted (sustained intensity >= 8, rapid worsening, new regions).",
              },
              questions: {
                type: "array",
                items: { type: "string" },
                minItems: 4,
                maxItems: 7,
                description:
                  "Specific questions the patient should ask the doctor, anchored in their own data.",
              },
            },
            required: [
              "chief_complaint",
              "summary_paragraph",
              "pattern_callouts",
              "red_flags",
              "questions",
            ],
            additionalProperties: false,
          },
        },
      },
    ];

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        tools,
        tool_choice: { type: "function", function: { name: "emit_report" } },
      }),
    });

    if (aiRes.status === 429) {
      return new Response(
        JSON.stringify({ error: "Too many requests right now. Please try again in a minute." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (aiRes.status === 402) {
      return new Response(
        JSON.stringify({
          error: "AI credits exhausted. Add credits in Settings → Workspace → Usage.",
        }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (!aiRes.ok) {
      const txt = await aiRes.text();
      console.error("AI gateway error", aiRes.status, txt);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = await aiRes.json();
    const call =
      payload?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments ??
      payload?.choices?.[0]?.message?.content;

    let report: unknown;
    try {
      report = typeof call === "string" ? JSON.parse(call) : call;
    } catch (e) {
      console.error("Failed to parse AI tool args", e, call);
      return new Response(JSON.stringify({ error: "AI returned malformed report" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(report), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-report error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
