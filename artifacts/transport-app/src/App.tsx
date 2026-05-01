import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from 'wouter';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";
import { AuthProvider, useAuth } from "@/context/auth-context";

import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Trucks from "@/pages/trucks";
import Drivers from "@/pages/drivers";
import Trips from "@/pages/trips";
import TripDetail from "@/pages/trip-detail";
import Billing from "@/pages/billing";
import Clients from "@/pages/clients";
import DriverPortal from "@/pages/driver-portal";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function OwnerRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Redirect to="/login" />;
  if (user.role !== "owner") return <Redirect to="/driver-portal" />;
  return <>{children}</>;
}

function DriverRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Redirect to="/login" />;
  return <>{children}</>;
}

function Router() {
  const { user } = useAuth();

  return (
    <Switch>
      <Route path="/">
        {user ? <Redirect to={user.role === "owner" ? "/dashboard" : "/driver-portal"} /> : <Redirect to="/login" />}
      </Route>

      <Route path="/login">
        {user ? <Redirect to={user.role === "owner" ? "/dashboard" : "/driver-portal"} /> : <Login />}
      </Route>

      <Route path="/dashboard">
        <OwnerRoute><Layout><Dashboard /></Layout></OwnerRoute>
      </Route>
      <Route path="/trucks">
        <OwnerRoute><Layout><Trucks /></Layout></OwnerRoute>
      </Route>
      <Route path="/drivers">
        <OwnerRoute><Layout><Drivers /></Layout></OwnerRoute>
      </Route>
      <Route path="/clients">
        <OwnerRoute><Layout><Clients /></Layout></OwnerRoute>
      </Route>
      <Route path="/trips">
        <OwnerRoute><Layout><Trips /></Layout></OwnerRoute>
      </Route>
      <Route path="/trips/:id">
        <OwnerRoute><Layout><TripDetail /></Layout></OwnerRoute>
      </Route>
      <Route path="/billing">
        <OwnerRoute><Layout><Billing /></Layout></OwnerRoute>
      </Route>

      <Route path="/driver-portal">
        <DriverRoute><DriverPortal /></DriverRoute>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Router />
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </WouterRouter>
  );
}

export default App;
