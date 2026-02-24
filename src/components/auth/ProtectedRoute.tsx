import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Array<"provider" | "patient" | "org_admin" | "super_admin">;
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, role, profile, isLoading, profileLoaded } = useAuth();
  const location = useLocation();

  // Wait for initial auth check
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Wait for profile to load after authentication before making routing decisions
  if (!profileLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Onboarding redirect: if profile has no onboarding_completed_at,
  // redirect to onboarding (unless already on an onboarding page)
  const isOnboardingPage = location.pathname.startsWith("/onboarding");
  if (!isOnboardingPage && (!profile || !profile.onboarding_completed_at)) {
    const onboardingPath = role === "patient" ? "/onboarding/patient" : "/onboarding/provider";
    return <Navigate to={onboardingPath} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && role && !allowedRoles.includes(role)) {
    const redirectPath = role === "patient" ? "/patient-dashboard" : "/dashboard";
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
}
