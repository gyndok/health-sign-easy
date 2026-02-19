import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface DemoModeContextType {
  isDemoMode: boolean;
  demoView: "provider" | "patient";
  enableDemo: () => void;
  disableDemo: () => void;
  setDemoView: (view: "provider" | "patient") => void;
}

const DemoModeContext = createContext<DemoModeContextType | undefined>(undefined);

export function DemoModeProvider({ children }: { children: ReactNode }) {
  const [isDemoMode, setIsDemoMode] = useState(() =>
    localStorage.getItem("clearconsent_demo_mode") === "true"
  );
  const [demoView, setDemoView] = useState<"provider" | "patient">("provider");

  const enableDemo = useCallback(() => {
    setIsDemoMode(true);
    setDemoView("provider");
    localStorage.setItem("clearconsent_demo_mode", "true");
  }, []);

  const disableDemo = useCallback(() => {
    setIsDemoMode(false);
    setDemoView("provider");
    localStorage.removeItem("clearconsent_demo_mode");
  }, []);

  return (
    <DemoModeContext.Provider value={{ isDemoMode, demoView, enableDemo, disableDemo, setDemoView }}>
      {children}
    </DemoModeContext.Provider>
  );
}

export function useDemoMode() {
  const context = useContext(DemoModeContext);
  if (!context) {
    throw new Error("useDemoMode must be used within a DemoModeProvider");
  }
  return context;
}
