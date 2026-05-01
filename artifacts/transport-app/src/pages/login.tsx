import { useState } from "react";
import { useLocation } from "wouter";
import { Truck, ShieldCheck, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth, type Role } from "@/context/auth-context";

export default function Login() {
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const [selected, setSelected] = useState<Role | null>(null);

  const handleEnter = () => {
    if (!selected) return;
    const email = selected === "owner" ? "owner@transport.demo" : "driver@transport.demo";
    login(selected, email);
    setLocation(selected === "owner" ? "/dashboard" : "/driver-portal");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Truck className="h-12 w-12 text-primary mx-auto" />
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">TransPort Platform</h1>
          <p className="text-gray-500 text-sm">P2P Truck Transport Management</p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Choose your role to continue</CardTitle>
            <CardDescription>Select how you want to access the platform</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <button
              onClick={() => setSelected("owner")}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                selected === "owner"
                  ? "border-primary bg-primary/5"
                  : "border-gray-200 hover:border-gray-300 bg-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${selected === "owner" ? "bg-primary/10" : "bg-gray-100"}`}>
                  <ShieldCheck className={`h-5 w-5 ${selected === "owner" ? "text-primary" : "text-gray-500"}`} />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Owner / Admin</div>
                  <div className="text-sm text-gray-500">Access full dashboard — fleet, trips, billing, clients</div>
                </div>
              </div>
            </button>

            <button
              onClick={() => setSelected("driver")}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                selected === "driver"
                  ? "border-primary bg-primary/5"
                  : "border-gray-200 hover:border-gray-300 bg-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${selected === "driver" ? "bg-primary/10" : "bg-gray-100"}`}>
                  <Smartphone className={`h-5 w-5 ${selected === "driver" ? "text-primary" : "text-gray-500"}`} />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Driver</div>
                  <div className="text-sm text-gray-500">Upload trip photos and update delivery status</div>
                </div>
              </div>
            </button>

            <Button
              className="w-full mt-2"
              size="lg"
              disabled={!selected}
              onClick={handleEnter}
            >
              Enter Platform
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
