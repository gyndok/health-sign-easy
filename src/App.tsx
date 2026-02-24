import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { DemoModeProvider } from "@/hooks/useDemoMode";
import { DemoToolbar } from "@/components/demo/DemoToolbar";
import { TourTooltip } from "@/components/demo/TourTooltip";
import { DemoTourProvider } from "@/hooks/useDemoTour";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
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
import Submissions from "./pages/Submissions";
import DemoPatientView from "./pages/DemoPatientView";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <DemoModeProvider>
        <DemoTourProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/consent/:token" element={<ConsentSigning />} />
                <Route path="/demo/patient" element={<DemoPatientView />} />

                {/* Provider routes */}
                <Route path="/dashboard" element={
                  <ProtectedRoute allowedRoles={["provider", "org_admin", "super_admin"]}>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="/modules" element={
                  <ProtectedRoute allowedRoles={["provider", "org_admin", "super_admin"]}>
                    <Modules />
                  </ProtectedRoute>
                } />
                <Route path="/modules/new" element={
                  <ProtectedRoute allowedRoles={["provider", "org_admin", "super_admin"]}>
                    <ModuleEditor />
                  </ProtectedRoute>
                } />
                <Route path="/modules/:id/edit" element={
                  <ProtectedRoute allowedRoles={["provider", "org_admin", "super_admin"]}>
                    <ModuleEditor />
                  </ProtectedRoute>
                } />
                <Route path="/invitations" element={
                  <ProtectedRoute allowedRoles={["provider", "org_admin", "super_admin"]}>
                    <Invitations />
                  </ProtectedRoute>
                } />
                <Route path="/invitations/new" element={
                  <ProtectedRoute allowedRoles={["provider", "org_admin", "super_admin"]}>
                    <NewInvitation />
                  </ProtectedRoute>
                } />
                <Route path="/settings" element={
                  <ProtectedRoute allowedRoles={["provider", "org_admin", "super_admin"]}>
                    <Settings />
                  </ProtectedRoute>
                } />
                <Route path="/patients" element={
                  <ProtectedRoute allowedRoles={["provider", "org_admin", "super_admin"]}>
                    <Patients />
                  </ProtectedRoute>
                } />
                <Route path="/submissions" element={
                  <ProtectedRoute allowedRoles={["provider", "org_admin", "super_admin"]}>
                    <Submissions />
                  </ProtectedRoute>
                } />

                {/* Patient routes */}
                <Route path="/patient-dashboard" element={
                  <ProtectedRoute allowedRoles={["patient"]}>
                    <PatientDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/patient-settings" element={
                  <ProtectedRoute allowedRoles={["patient"]}>
                    <PatientSettings />
                  </ProtectedRoute>
                } />

                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              <TourTooltip />
              <DemoToolbar />
            </BrowserRouter>
          </TooltipProvider>
        </DemoTourProvider>
      </DemoModeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
