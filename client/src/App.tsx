import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { ClientSessionProvider } from "@/contexts/ClientSessionContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { MaintenanceMode } from "@/components/MaintenanceMode";
import { lazy, Suspense } from "react";

// Lazy load all pages for better performance
const NotFound = lazy(() => import("@/pages/not-found"));
const Landing = lazy(() => import("@/pages/landing"));
const Login = lazy(() => import("@/pages/login"));
const ForgotPassword = lazy(() => import("@/pages/forgot-password"));
const ResetPassword = lazy(() => import("@/pages/reset-password"));
const Home = lazy(() => import("@/pages/home"));
const OfficerInfo = lazy(() => import("@/pages/officer"));
const ComplaintForm = lazy(() => import("@/pages/complaint-form"));
const ComplaintDetail = lazy(() => import("@/pages/complaint-detail"));
const LawsuitForm = lazy(() => import("@/pages/lawsuit-form"));
const LawsuitDetail = lazy(() => import("@/pages/lawsuit-detail"));
const PetitionForm = lazy(() => import("@/pages/petition-form"));
const PetitionDetail = lazy(() => import("@/pages/petition-detail"));
const Petitions = lazy(() => import("@/pages/petitions"));
const FOIARequestForm = lazy(() => import("@/pages/foia-request-form"));
const AdminPetitions = lazy(() => import("@/pages/admin-petitions"));
const AdminLawsuits = lazy(() => import("@/pages/admin-lawsuits"));
const AdminComplaints = lazy(() => import("@/pages/admin-complaints"));
const AdminFOIA = lazy(() => import("@/pages/admin-foia"));
const AdminSubAgent = lazy(() => import("@/pages/admin-subagent"));
const AdminEmail = lazy(() => import("@/pages/admin-email"));
const AdminWorkerLogs = lazy(() => import("@/pages/admin-worker-logs"));
const AdminSubscriptions = lazy(() => import("@/pages/admin-subscriptions"));
const AdminEvidenceHub = lazy(() => import("@/pages/admin-evidence-hub"));
const PetitionEdit = lazy(() => import("@/pages/petition-edit"));
const Complaints = lazy(() => import("@/pages/complaints"));
const History = lazy(() => import("@/pages/history"));
const Contact = lazy(() => import("@/pages/contact"));
const Confirmation = lazy(() => import("@/pages/confirmation"));
const EvidenceHub = lazy(() => import("@/pages/evidence-hub"));

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-lg">Loading...</div>
  </div>
);

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  
  // Check for maintenance mode every 30 seconds
  const { data: maintenanceStatus } = useQuery<{ maintenanceMode: boolean }>({
    queryKey: ['/api/maintenance-status'],
    refetchInterval: 30000, // Check every 30 seconds
    refetchIntervalInBackground: true,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }
  
  // Show maintenance mode screen if system is under maintenance
  if (maintenanceStatus?.maintenanceMode) {
    return <MaintenanceMode />;
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        {/* Public routes */}
        <Route path="/landing" component={Landing} />
        <Route path="/login" component={Login} />
        <Route path="/forgot-password" component={ForgotPassword} />
        <Route path="/reset-password" component={ResetPassword} />
        <Route path="/contact" component={Contact} />
        <Route path="/support" component={Contact} />
        
        {/* Public petition page - accessible without authentication */}
        <Route path="/petition/:slug" component={PetitionDetail} />

        {/* Protected routes - only accessible when authenticated */}
        {isAuthenticated ? (
          <>
            <Route path="/" component={Home} />
            <Route path="/home" component={Home} />
            <Route path="/dashboard" component={Home} />
            <Route path="/officer/:id" component={OfficerInfo} />
            <Route path="/complaints" component={Complaints} />
            <Route path="/complaint-form" component={ComplaintForm} />
            <Route path="/complaint" component={ComplaintForm} />
            <Route path="/complaint/:id" component={ComplaintDetail} />
            <Route path="/lawsuit-form" component={LawsuitForm} />
            <Route path="/lawsuit" component={LawsuitForm} />
            <Route path="/lawsuit/:id" component={LawsuitDetail} />
            <Route path="/petition-form" component={PetitionForm} />
            <Route path="/petition" component={PetitionForm} />
            <Route path="/petitions" component={Petitions} />
            <Route path="/foia-request" component={FOIARequestForm} />
            <Route path="/foia" component={FOIARequestForm} />
            <Route path="/admin-petitions" component={AdminPetitions} />
            <Route path="/admin-lawsuits" component={AdminLawsuits} />
            <Route path="/admin-complaints" component={AdminComplaints} />
            <Route path="/admin-foia" component={AdminFOIA} />
            <Route path="/admin-email" component={AdminEmail} />
            <Route path="/admin-worker-logs" component={AdminWorkerLogs} />
            <Route path="/admin-subagent" component={AdminSubAgent} />
            <Route path="/ai-subagent" component={AdminSubAgent} />
            <Route path="/admin-subscriptions" component={AdminSubscriptions} />
            <Route path="/admin-evidence-hub" component={AdminEvidenceHub} />
            <Route path="/petition-edit/:id" component={PetitionEdit} />
            <Route path="/confirmation/:type/:id" component={Confirmation} />
            <Route path="/history" component={History} />
            <Route path="/evidence-hub" component={EvidenceHub} />
          </>
        ) : (
          <Route path="/" component={Landing} />
        )}

        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <ClientSessionProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </ClientSessionProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}