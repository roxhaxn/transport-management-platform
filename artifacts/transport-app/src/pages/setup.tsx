import { useState } from "react";
import { useSetupOwner } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ShieldCheck, AlertCircle, Loader2, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function Setup() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const setupOwner = useSetupOwner();

  const handleClaim = () => {
    setErrorMsg(null);
    setupOwner.mutate(undefined, {
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        setDone(true);
        setTimeout(() => setLocation("/dashboard"), 1500);
      },
      onError: (err: any) => {
        const msg = err?.response?.data?.error ?? "Something went wrong. Please try again.";
        setErrorMsg(msg);
      },
    });
  };

  if (done) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-10 pb-10 space-y-3">
            <ShieldCheck className="h-14 w-14 text-green-500 mx-auto" />
            <h2 className="text-xl font-bold text-gray-900">Owner role activated</h2>
            <p className="text-gray-500 text-sm">Redirecting you to the dashboard...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="bg-primary/10 rounded-full p-4">
              <Truck className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Owner Setup</CardTitle>
          <CardDescription className="text-base mt-2">
            This is a one-time setup. Claim the owner role to unlock the full management dashboard — trucks, drivers, trips, and billing.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 pt-4">
          <div className="bg-amber-50 border border-amber-200 rounded-md p-3 flex gap-2 text-sm text-amber-800">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>Only one owner account is allowed. This button will stop working once an owner is set.</span>
          </div>

          {errorMsg && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 flex gap-2 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <Button
            className="w-full"
            size="lg"
            onClick={handleClaim}
            disabled={setupOwner.isPending}
          >
            {setupOwner.isPending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Claiming...</>
            ) : (
              <><ShieldCheck className="mr-2 h-4 w-4" /> Claim Owner Role</>
            )}
          </Button>

          <p className="text-center text-xs text-gray-400">
            Already an owner? <a href="/sign-in" className="underline">Sign in</a> to access your dashboard.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
