import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";

import Dashboard from "@/pages/dashboard";
import Trucks from "@/pages/trucks";
import Drivers from "@/pages/drivers";
import Trips from "@/pages/trips";
import TripDetail from "@/pages/trip-detail";
import Billing from "@/pages/billing";
import DriverPortal from "@/pages/driver-portal";
import Verify from "@/pages/verify";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/driver-portal" component={DriverPortal} />
      <Route path="/verify/:photoId" component={Verify} />
      
      <Route path="/trucks" component={() => <Layout><Trucks /></Layout>} />
      <Route path="/drivers" component={() => <Layout><Drivers /></Layout>} />
      <Route path="/trips" component={() => <Layout><Trips /></Layout>} />
      <Route path="/trips/:id" component={() => <Layout><TripDetail /></Layout>} />
      <Route path="/billing" component={() => <Layout><Billing /></Layout>} />
      <Route path="/" component={() => <Layout><Dashboard /></Layout>} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
