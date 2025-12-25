import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import AdminPage from "@/pages/admin-page";
import TermsPage from "@/pages/terms-page";
import PrivacyPage from "@/pages/privacy-page";
import NotFound from "@/pages/not-found";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";
import { CookieConsent } from "@/components/cookie-consent";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/admin" component={AdminPage} />
      <Route path="/terms" component={TermsPage} />
      <Route path="/privacy" component={PrivacyPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function Header() {
  const { user } = useAuth();
  return user?.role === 'admin' ? (
    <div className="border-b">
      <div className="max-w-7xl mx-auto px-4 py-2">
        <Link href="/admin" asChild>
          <Button variant="ghost" size="sm" className="gap-2" data-testid="button-admin-panel">
            <Shield className="w-4 h-4" />
            Admin Panel
          </Button>
        </Link>
      </div>
    </div>
  ) : null;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Header />
          <Router />
          <CookieConsent />
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
