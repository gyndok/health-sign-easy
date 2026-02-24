import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDemoMode } from "@/hooks/useDemoMode";
import { useDemoTour } from "@/hooks/useDemoTour";
import { Button } from "@/components/ui/button";
import { Monitor, User, X, Play, HelpCircle, Database, Loader2 } from "lucide-react";
import { seedDemoData, hasDemoData } from "@/services/demoSeedService";
import { toast } from "sonner";

export function DemoToolbar() {
  const { isDemoMode, demoView, setDemoView, disableDemo } = useDemoMode();
  const { startTour, isActive: isTourActive } = useDemoTour();
  const navigate = useNavigate();
  const location = useLocation();
  const [demoDataExists, setDemoDataExists] = useState<boolean | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);

  const isOnDashboard = location.pathname === "/dashboard";

  useEffect(() => {
    if (isDemoMode) {
      hasDemoData().then(setDemoDataExists);
    }
  }, [isDemoMode, location.pathname]);

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

  const handleSeedData = async () => {
    setIsSeeding(true);
    try {
      const result = await seedDemoData();
      if (result.status === "already_seeded") {
        toast.info("Demo data is already loaded");
      } else {
        toast.success("Demo data populated!");
      }
      setDemoDataExists(true);
      if (!isOnDashboard) {
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Error seeding:", error);
      toast.error("Failed to populate demo data");
    }
    setIsSeeding(false);
  };

  const handleStartTour = () => {
    if (!isOnDashboard) {
      navigate("/dashboard?tour=start");
    } else {
      startTour();
    }
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

      {demoDataExists === false && (
        <Button
          size="sm"
          variant="ghost"
          className="h-8 gap-1.5 text-xs rounded-full"
          onClick={handleSeedData}
          disabled={isSeeding}
        >
          {isSeeding ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Database className="h-3.5 w-3.5" />
          )}
          Seed Data
        </Button>
      )}

      {!isTourActive && (
        <Button
          size="sm"
          variant="ghost"
          className="h-8 gap-1.5 text-xs rounded-full"
          onClick={handleStartTour}
        >
          <HelpCircle className="h-3.5 w-3.5" />
          Tour
        </Button>
      )}

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
