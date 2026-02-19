import { useNavigate, useLocation } from "react-router-dom";
import { useDemoMode } from "@/hooks/useDemoMode";
import { Button } from "@/components/ui/button";
import { Monitor, User, X, Play } from "lucide-react";

export function DemoToolbar() {
  const { isDemoMode, demoView, setDemoView, disableDemo } = useDemoMode();
  const navigate = useNavigate();
  const location = useLocation();

  if (!isDemoMode) return null;

  const switchToProvider = () => {
    setDemoView("provider");
    if (location.pathname.startsWith("/demo")) {
      navigate("/dashboard");
    }
  };

  const switchToPatient = () => {
    setDemoView("patient");
    navigate("/demo/patient");
  };

  const handleExit = () => {
    disableDemo();
    navigate("/settings");
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 rounded-full border border-border bg-background/95 backdrop-blur shadow-lg px-2 py-1.5">
      <div className="flex items-center gap-1.5 px-2">
        <Play className="h-3.5 w-3.5 text-primary animate-pulse" />
        <span className="text-xs font-semibold text-primary uppercase tracking-wider">Demo</span>
      </div>

      <div className="h-5 w-px bg-border" />

      <Button
        size="sm"
        variant={demoView === "provider" ? "default" : "ghost"}
        className="h-8 gap-1.5 text-xs rounded-full"
        onClick={switchToProvider}
      >
        <Monitor className="h-3.5 w-3.5" />
        Provider
      </Button>

      <Button
        size="sm"
        variant={demoView === "patient" ? "default" : "ghost"}
        className="h-8 gap-1.5 text-xs rounded-full"
        onClick={switchToPatient}
      >
        <User className="h-3.5 w-3.5" />
        Patient
      </Button>

      <div className="h-5 w-px bg-border" />

      <Button
        size="icon"
        variant="ghost"
        className="h-7 w-7 rounded-full"
        onClick={handleExit}
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
