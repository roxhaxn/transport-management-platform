import { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from '@clerk/react';
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from 'wouter';
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";

import Home from "@/pages/home";
import Dashboard from "@/pages/dashboard";
import Trucks from "@/pages/trucks";
import Drivers from "@/pages/drivers";
import Trips from "@/pages/trips";
import TripDetail from "@/pages/trip-detail";
import Billing from "@/pages/billing";
import Clients from "@/pages/clients";
import DriverPortal from "@/pages/driver-portal";
import Verify from "@/pages/verify";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath) ? path.slice(basePath.length) || "/" : path;
}

if (!clerkPubKey) throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY');

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);
  return null;
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/dashboard" />
      </Show>
      <Show when="signed-out">
        <Home />
      </Show>
    </>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomeRedirect} />
      
      <Route path="/sign-in/*?">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
        </div>
      </Route>
      <Route path="/sign-up/*?">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
        </div>
      </Route>

      <Route path="/driver-portal">
        <Show when="signed-in" fallback={<Redirect to="/sign-in" />}>
          <DriverPortal />
        </Show>
      </Route>
      
      <Route path="/verify/:photoId">
        <Show when="signed-in" fallback={<Redirect to="/sign-in" />}>
          <Verify />
        </Show>
      </Route>
      
      {/* Owner routes */}
      <Route path="/dashboard" component={() => <Layout><Dashboard /></Layout>} />
      <Route path="/trucks" component={() => <Layout><Trucks /></Layout>} />
      <Route path="/drivers" component={() => <Layout><Drivers /></Layout>} />
      <Route path="/trips" component={() => <Layout><Trips /></Layout>} />
      <Route path="/trips/:id" component={() => <Layout><TripDetail /></Layout>} />
      <Route path="/billing" component={() => <Layout><Billing /></Layout>} />
      <Route path="/clients" component={() => <Layout><Clients /></Layout>} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();
  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
