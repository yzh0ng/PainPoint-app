export type BodyRegion = {
  id: string;
  label: string;
  // SVG path or circle coords on a 200x420 figure
  shape:
    | { kind: "circle"; cx: number; cy: number; r: number }
    | { kind: "rect"; x: number; y: number; w: number; h: number; rx?: number };
  side?: "left" | "right" | "center";
};

// A simplified front-only body map. Coordinates target a 200x420 viewBox.
export const BODY_REGIONS: BodyRegion[] = [
  { id: "head", label: "Head", side: "center", shape: { kind: "circle", cx: 100, cy: 36, r: 24 } },
  { id: "neck", label: "Neck", side: "center", shape: { kind: "rect", x: 88, y: 60, w: 24, h: 16, rx: 6 } },
  { id: "left_shoulder", label: "Left shoulder", side: "left", shape: { kind: "circle", cx: 64, cy: 92, r: 14 } },
  { id: "right_shoulder", label: "Right shoulder", side: "right", shape: { kind: "circle", cx: 136, cy: 92, r: 14 } },
  { id: "chest", label: "Chest", side: "center", shape: { kind: "rect", x: 76, y: 88, w: 48, h: 36, rx: 12 } },
  { id: "left_arm", label: "Left arm", side: "left", shape: { kind: "rect", x: 44, y: 108, w: 18, h: 70, rx: 9 } },
  { id: "right_arm", label: "Right arm", side: "right", shape: { kind: "rect", x: 138, y: 108, w: 18, h: 70, rx: 9 } },
  { id: "abdomen", label: "Abdomen", side: "center", shape: { kind: "rect", x: 78, y: 128, w: 44, h: 38, rx: 10 } },
  { id: "lower_back", label: "Lower back", side: "center", shape: { kind: "rect", x: 78, y: 168, w: 44, h: 22, rx: 8 } },
  { id: "left_hip", label: "Left hip", side: "left", shape: { kind: "circle", cx: 80, cy: 200, r: 14 } },
  { id: "right_hip", label: "Right hip", side: "right", shape: { kind: "circle", cx: 120, cy: 200, r: 14 } },
  { id: "left_hand", label: "Left hand", side: "left", shape: { kind: "circle", cx: 38, cy: 192, r: 10 } },
  { id: "right_hand", label: "Right hand", side: "right", shape: { kind: "circle", cx: 162, cy: 192, r: 10 } },
  { id: "left_thigh", label: "Left thigh", side: "left", shape: { kind: "rect", x: 72, y: 218, w: 22, h: 70, rx: 10 } },
  { id: "right_thigh", label: "Right thigh", side: "right", shape: { kind: "rect", x: 106, y: 218, w: 22, h: 70, rx: 10 } },
  { id: "left_knee", label: "Left knee", side: "left", shape: { kind: "circle", cx: 83, cy: 296, r: 11 } },
  { id: "right_knee", label: "Right knee", side: "right", shape: { kind: "circle", cx: 117, cy: 296, r: 11 } },
  { id: "left_calf", label: "Left calf", side: "left", shape: { kind: "rect", x: 73, y: 308, w: 20, h: 70, rx: 9 } },
  { id: "right_calf", label: "Right calf", side: "right", shape: { kind: "rect", x: 107, y: 308, w: 20, h: 70, rx: 9 } },
  { id: "left_foot", label: "Left foot", side: "left", shape: { kind: "rect", x: 70, y: 380, w: 26, h: 16, rx: 8 } },
  { id: "right_foot", label: "Right foot", side: "right", shape: { kind: "rect", x: 104, y: 380, w: 26, h: 16, rx: 8 } },
];

export const regionLabel = (id: string) =>
  BODY_REGIONS.find((r) => r.id === id)?.label ?? id.replace(/_/g, " ");

export const PAIN_TYPES = [
  { value: "sharp", label: "Sharp" },
  { value: "dull", label: "Dull" },
  { value: "burning", label: "Burning" },
  { value: "throbbing", label: "Throbbing" },
  { value: "aching", label: "Aching" },
  { value: "stabbing", label: "Stabbing" },
  { value: "cramping", label: "Cramping" },
  { value: "tingling", label: "Tingling" },
  { value: "pressure", label: "Pressure" },
  { value: "other", label: "Other" },
] as const;

export const TRIGGERS = [
  { value: "none", label: "None" },
  { value: "stress", label: "Stress" },
  { value: "sleep", label: "Sleep" },
  { value: "exercise", label: "Exercise" },
  { value: "weather", label: "Weather" },
  { value: "food", label: "Food" },
  { value: "menstrual", label: "Menstrual" },
  { value: "posture", label: "Posture" },
  { value: "work", label: "Work" },
  { value: "other", label: "Other" },
] as const;

export const CONDITIONS = [
  { value: "unspecified", label: "I'd rather not say" },
  { value: "endometriosis", label: "Endometriosis" },
  { value: "fibromyalgia", label: "Fibromyalgia" },
  { value: "lower_back", label: "Lower back pain" },
  { value: "migraine", label: "Migraine" },
  { value: "post_surgical", label: "Post-surgical" },
  { value: "arthritis", label: "Arthritis" },
  { value: "other", label: "Other" },
] as const;

export function intensityColor(value: number) {
  if (value <= 0) return "hsl(var(--pain-0))";
  if (value <= 3) return "hsl(var(--pain-low))";
  if (value <= 5) return "hsl(var(--pain-mid))";
  if (value <= 7) return "hsl(var(--pain-high))";
  return "hsl(var(--pain-max))";
}

export function intensityLabel(value: number) {
  if (value <= 0) return "None";
  if (value <= 2) return "Mild";
  if (value <= 4) return "Noticeable";
  if (value <= 6) return "Moderate";
  if (value <= 8) return "Severe";
  return "Worst";
}
