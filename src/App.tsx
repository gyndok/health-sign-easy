import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";
import { useAuth } from "@/hooks/useAuth";
import { MFAChallenge } from "@/components/auth/MFAChallenge";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import PatientDashboard from "./pages/PatientDashboard";
import PatientSettings from "./pages/PatientSettings";
import Modules from "./pages/Modules";
import ModuleEditor from "./pages/ModuleEditor";
import Invitations from "./pages/Invitations";
import NewInvitation from "./pages/NewInvitation";
import ConsentSigning from "./pages/ConsentSigning";
import Settings from "./pages/Settings";
import Patients from "./pages/Patients";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import AuditLog from "./pages/AuditLog";
import NotFound from "./pages/NotFound";

function SessionTimeoutWrapper({ children }: { children: React.ReactNode }) {
  useSessionTimeout();
  return <>{children}</>;
}

function MFAGate({ children }: { children: React.ReactNode }) {
  const { mfaRequired, refreshMFAStatus } = useAuth();

  if (mfaRequired) {
    return <MFAChallenge onVerified={refreshMFAStatus} />;
  }

  return <>{children}</>;
}

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <SessionTimeoutWrapper>
            <MFAGate>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/patient-dashboard" element={<PatientDashboard />} />
                <Route path="/patient-settings" element={<PatientSettings />} />
                <Route path="/modules" element={<Modules />} />
                <Route path="/modules/new" element={<ModuleEditor />} />
                <Route path="/modules/:id/edit" element={<ModuleEditor />} />
                <Route path="/invitations" element={<Invitations />} />
                <Route path="/invitations/new" element={<NewInvitation />} />
                <Route path="/consent/:token" element={<ConsentSigning />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/patients" element={<Patients />} />
                <Route path="/audit-log" element={<AuditLog />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsOfService />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </MFAGate>
          </SessionTimeoutWrapper>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
