import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Truck,
  Users,
  MapPin,
  FileText,
  Smartphone,
  Building,
  LogOut,
  ShieldAlert
} from "lucide-react";
import { Show, useClerk } from "@clerk/react";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { signOut } = useClerk();
  const { data: user, isLoading } = useGetMe({
    query: { queryKey: getGetMeQueryKey(), retry: false }
  });

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Trucks", href: "/trucks", icon: Truck },
    { name: "Drivers", href: "/drivers", icon: Users },
    { name: "Clients", href: "/clients", icon: Building },
    { name: "Trips", href: "/trips", icon: MapPin },
    { name: "Billing", href: "/billing", icon: FileText },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (user && user.role !== "owner") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm border p-6 text-center space-y-4">
          <ShieldAlert className="h-12 w-12 text-destructive mx-auto" />
          <h2 className="text-xl font-bold">Access Denied</h2>
          <p className="text-gray-500">You do not have owner permissions to view this section.</p>
          <Button onClick={() => signOut()} variant="default" className="w-full">
            Sign Out
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Show when="signed-in">
      <div className="min-h-screen bg-gray-50 flex">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 flex-shrink-0 fixed inset-y-0 left-0 flex flex-col">
          <div className="h-16 flex items-center px-6 border-b border-gray-200">
            <Truck className="h-6 w-6 text-primary mr-2" />
            <span className="text-lg font-bold text-gray-900 tracking-tight">TransPort</span>
          </div>
          
          {user && (
            <div className="px-6 py-4 border-b border-gray-100 flex flex-col gap-1">
              <div className="text-sm font-medium truncate" title={user.email || ""}>
                {user.email}
              </div>
              <div>
                <Badge variant="outline" className="text-xs uppercase bg-primary/5 text-primary border-primary/20">
                  {user.role}
                </Badge>
              </div>
            </div>
          )}

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = location === item.href || location.startsWith(item.href + "/");
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <item.icon
                    className={`flex-shrink-0 mr-3 h-5 w-5 ${
                      isActive ? "text-primary" : "text-gray-400 group-hover:text-gray-500"
                    }`}
                  />
                  {item.name}
                </Link>
              );
            })}

            <div className="pt-8">
              <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">External</p>
              <Link
                href="/driver-portal"
                className="flex items-center px-3 py-2.5 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <Smartphone className="flex-shrink-0 mr-3 h-5 w-5 text-gray-400" />
                Driver Portal
              </Link>
            </div>
          </nav>
          
          <div className="p-4 border-t border-gray-200">
            <Button 
              variant="ghost" 
              className="w-full justify-start text-gray-600 hover:text-gray-900 hover:bg-gray-100" 
              onClick={() => signOut()}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 ml-64">
          <main className="max-w-7xl mx-auto p-8">{children}</main>
        </div>
      </div>
    </Show>
  );
}
