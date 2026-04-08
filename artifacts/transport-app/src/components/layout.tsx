import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Truck,
  Users,
  MapPin,
  FileText,
  Smartphone,
} from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Trucks", href: "/trucks", icon: Truck },
    { name: "Drivers", href: "/drivers", icon: Users },
    { name: "Trips", href: "/trips", icon: MapPin },
    { name: "Billing", href: "/billing", icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex-shrink-0 fixed inset-y-0 left-0">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <Truck className="h-6 w-6 text-primary mr-2" />
          <span className="text-lg font-bold text-gray-900 tracking-tight">TransPort</span>
        </div>
        <nav className="p-4 space-y-1">
          {navigation.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
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
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-64">
        <main className="max-w-7xl mx-auto p-8">{children}</main>
      </div>
    </div>
  );
}
