import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-3 w-3 animate-pulse-soft rounded-full bg-primary" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  return children;
}
