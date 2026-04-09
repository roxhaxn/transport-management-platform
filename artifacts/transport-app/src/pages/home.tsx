import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Truck, ShieldCheck } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="text-center max-w-md space-y-6">
        <Truck className="h-16 w-16 text-primary mx-auto" />
        <h1 className="text-4xl font-bold text-gray-900 tracking-tight">TransPort Platform</h1>
        <p className="text-lg text-gray-600">
          Manage your transport business efficiently. Track trips, drivers, trucks, and billing in one place.
        </p>
        <div className="pt-4 space-y-3">
          <Link href="/sign-in">
            <Button size="lg" className="w-full">Sign In</Button>
          </Link>
          <Link href="/sign-up">
            <Button size="lg" variant="outline" className="w-full">Create Account</Button>
          </Link>
        </div>
        <div className="pt-2 border-t border-gray-200">
          <p className="text-xs text-gray-400 mb-2">Setting up for the first time?</p>
          <Link href="/setup">
            <Button variant="ghost" size="sm" className="text-xs text-gray-500 gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" />
              Claim Owner Account
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
