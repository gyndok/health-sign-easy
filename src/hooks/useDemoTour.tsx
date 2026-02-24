import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export interface TourStep {
  id: string;
  target: string;
  title: string;
  description: string;
  placement: "top" | "bottom" | "left" | "right";
}

interface DemoTourContextType {
  isActive: boolean;
  currentStep: number;
  totalSteps: number;
  currentStepData: TourStep | null;
  startTour: () => void;
  endTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
}

const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    target: "[data-tour='dashboard-header']",
    title: "Welcome to ClearConsent",
    description: "This is your provider dashboard. Let's take a quick tour of the key features.",
    placement: "bottom",
  },
  {
    id: "stats",
    target: "[data-tour='stats-grid']",
    title: "At-a-Glance Metrics",
    description: "Monitor pending consents, completions, total modules, patient count, and withdrawals in real time.",
    placement: "bottom",
  },
  {
    id: "submissions",
    target: "[data-tour='recent-submissions']",
    title: "Recent Submissions",
    description: "View all signed consent forms with patient details, module names, dates, and instant PDF downloads.",
    placement: "top",
  },
  {
    id: "quick-actions",
    target: "[data-tour='quick-actions']",
    title: "Quick Actions",
    description: "Create new consent modules, send patient invitations, and manage your practice with one click.",
    placement: "left",
  },
  {
    id: "withdrawals",
    target: "[data-tour='recent-withdrawals']",
    title: "Withdrawal Alerts",
    description: "Instantly see when a patient withdraws consent, with their reasons and timestamps.",
    placement: "left",
  },
  {
    id: "navigation",
    target: "[data-tour='provider-nav']",
    title: "Explore the Platform",
    description: "Navigate to Modules, Invitations, Patients, and Settings. Try creating a module or sending an invite!",
    placement: "bottom",
  },
];

const TOUR_COMPLETED_KEY = "clearconsent_tour_completed";

const DemoTourContext = createContext<DemoTourContextType | null>(null);

export function DemoTourProvider({ children }: { children: ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const startTour = useCallback(() => {
    setCurrentStep(0);
    setIsActive(true);
  }, []);

  const endTour = useCallback(() => {
    setIsActive(false);
    setCurrentStep(0);
    localStorage.setItem(TOUR_COMPLETED_KEY, "true");
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      endTour();
    }
  }, [currentStep, endTour]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  return (
    <DemoTourContext.Provider
      value={{
        isActive,
        currentStep,
        totalSteps: TOUR_STEPS.length,
        currentStepData: isActive ? TOUR_STEPS[currentStep] : null,
        startTour,
        endTour,
        nextStep,
        prevStep,
      }}
    >
      {children}
    </DemoTourContext.Provider>
  );
}

export function useDemoTour() {
  const context = useContext(DemoTourContext);
  if (!context) {
    throw new Error("useDemoTour must be used within a DemoTourProvider");
  }
  return context;
}
