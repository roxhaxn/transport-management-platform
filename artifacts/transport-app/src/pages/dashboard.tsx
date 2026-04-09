import {
  useGetDashboardSummary, getGetDashboardSummaryQueryKey,
  useGetRecentTrips, getGetRecentTripsQueryKey,
  useGetPendingPhotos, getGetPendingPhotosQueryKey,
  useGetDriverActivity, getGetDriverActivityQueryKey,
  useListBills, getListBillsQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck, Users, MapPin, IndianRupee, AlertCircle, CheckCircle2, Clock, Activity, Building, Camera, FileText, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    scheduled: "bg-blue-100 text-blue-800",
    in_transit: "bg-yellow-100 text-yellow-800",
    loaded: "bg-orange-100 text-orange-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-gray-100 text-gray-600",
    draft: "bg-gray-100 text-gray-600",
    issued: "bg-blue-100 text-blue-800",
    paid: "bg-green-100 text-green-800",
    overdue: "bg-red-100 text-red-800",
    active: "bg-green-100 text-green-800",
    inactive: "bg-gray-100 text-gray-600",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${map[status] ?? "bg-gray-100 text-gray-600"}`}>
      {status.replace("_", " ")}
    </span>
  );
}

export default function Dashboard() {
  const { data: summary, isLoading: loadingSummary } = useGetDashboardSummary({
    query: { queryKey: getGetDashboardSummaryQueryKey() }
  });
  const { data: recentTrips } = useGetRecentTrips({
    query: { queryKey: getGetRecentTripsQueryKey() }
  });
  const { data: pendingPhotos } = useGetPendingPhotos({
    query: { queryKey: getGetPendingPhotosQueryKey() }
  });
  const { data: driverActivity } = useGetDriverActivity({
    query: { queryKey: getGetDriverActivityQueryKey() }
  });
  const { data: bills } = useListBills({
    query: { queryKey: getListBillsQueryKey() }
  });

  const attentionBills = bills?.filter(b => b.status === "overdue" || (b.status === "issued" && b.dueDate && new Date(b.dueDate) < new Date())) ?? [];
  const draftBills = bills?.filter(b => b.status === "draft") ?? [];

  if (loadingSummary) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-64 bg-gray-200 rounded"></div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-gray-200 rounded-lg"></div>)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="h-64 bg-gray-200 rounded-lg"></div>
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Owner Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Live overview of your fleet, drivers, and billing</p>
        </div>
        <div className="flex gap-2">
          <Link href="/trips">
            <Button size="sm" variant="outline">
              <MapPin className="h-4 w-4 mr-1.5" /> New Trip
            </Button>
          </Link>
          <Link href="/billing">
            <Button size="sm">
              <FileText className="h-4 w-4 mr-1.5" /> New Bill
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Fleet</CardTitle>
            <Truck className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalTrucks ?? 0}</div>
            <p className="text-xs text-gray-500">{summary?.activeTrucks ?? 0} active trucks</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Drivers</CardTitle>
            <Users className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalDrivers ?? 0}</div>
            <p className="text-xs text-gray-500">{summary?.activeTrips ?? 0} on active trips</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Trips</CardTitle>
            <Activity className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.activeTrips ?? 0}</div>
            <p className="text-xs text-gray-500">{summary?.completedTripsThisMonth ?? 0} done this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Revenue (MTD)</CardTitle>
            <IndianRupee className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              &#8377;{(summary?.totalRevenueThisMonth ?? 0).toLocaleString("en-IN")}
            </div>
            <p className="text-xs text-gray-500">{summary?.pendingBills ?? 0} pending bills</p>
          </CardContent>
        </Card>
      </div>

      {/* Alert row */}
      {((summary?.pendingPhotoVerifications ?? 0) > 0 || attentionBills.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(summary?.pendingPhotoVerifications ?? 0) > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-3">
              <Camera className="h-5 w-5 text-amber-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-800">
                  {summary?.pendingPhotoVerifications} sealed photo{(summary?.pendingPhotoVerifications ?? 0) > 1 ? "s" : ""} need OTP verification
                </p>
              </div>
              <Link href="/dashboard#verifications">
                <Button size="sm" variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-100 text-xs">
                  Review
                </Button>
              </Link>
            </div>
          )}
          {attentionBills.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">
                  {attentionBills.length} bill{attentionBills.length > 1 ? "s" : ""} overdue or past due date
                </p>
              </div>
              <Link href="/billing">
                <Button size="sm" variant="outline" className="border-red-300 text-red-700 hover:bg-red-100 text-xs">
                  View
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Driver Activity Monitor */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-gray-400" />
            Driver Activity
          </CardTitle>
          <Link href="/drivers">
            <Button variant="ghost" size="sm" className="text-xs text-gray-500 gap-1">
              Manage Drivers <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {driverActivity && driverActivity.length > 0 ? (
            <div className="divide-y">
              {driverActivity.map(({ driver, currentTrip, truck }) => (
                <div key={driver.id} className="py-3 flex items-center gap-4">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-semibold text-primary">
                      {driver.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900">{driver.name}</p>
                    {currentTrip ? (
                      <p className="text-xs text-gray-500 truncate">
                        {currentTrip.origin} &#8594; {currentTrip.destination}
                        {truck ? ` · ${truck.registrationNumber}` : ""}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-400">No active trip</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {currentTrip ? (
                      <>
                        <StatusBadge status={currentTrip.status} />
                        <Link href={`/trips/${currentTrip.id}`}>
                          <Button variant="ghost" size="sm" className="h-7 text-xs px-2">View</Button>
                        </Link>
                      </>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500">
                        idle
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-6">No drivers found</p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Trips */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-gray-400" />
              Recent Trips
            </CardTitle>
            <Link href="/trips">
              <Button variant="ghost" size="sm" className="text-xs text-gray-500 gap-1">
                All Trips <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentTrips && recentTrips.length > 0 ? (
              <div className="divide-y">
                {recentTrips.slice(0, 6).map(trip => (
                  <div key={trip.id} className="py-3 flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {trip.origin} &#8594; {trip.destination}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{trip.clientCompany}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <StatusBadge status={trip.status} />
                      <Link href={`/trips/${trip.id}`}>
                        <Button variant="ghost" size="sm" className="h-7 text-xs px-2">View</Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-6">No trips yet</p>
            )}
          </CardContent>
        </Card>

        {/* Pending Photo Verifications */}
        <Card id="verifications">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-gray-400" />
              Pending Verifications
              {(summary?.pendingPhotoVerifications ?? 0) > 0 && (
                <span className="ml-1 bg-red-100 text-red-700 text-xs font-semibold px-1.5 py-0.5 rounded-full">
                  {summary?.pendingPhotoVerifications}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingPhotos && pendingPhotos.length > 0 ? (
              <div className="divide-y">
                {pendingPhotos.map(photo => (
                  <div key={photo.id} className="py-3 flex items-center gap-3">
                    <div className="h-12 w-12 rounded-md bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-200">
                      {photo.photoDataUrl || photo.photoUrl ? (
                        <img
                          src={photo.photoDataUrl ?? photo.photoUrl}
                          alt="Sealed photo"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full flex items-center justify-center">
                          <Camera className="h-5 w-5 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">Trip #{photo.tripId}</p>
                      <p className="text-xs text-gray-500">
                        Uploaded by {photo.uploadedBy} · {photo.photoType}
                      </p>
                    </div>
                    <Link href={`/verify/${photo.id}`}>
                      <Button size="sm" variant="outline" className="h-7 text-xs px-2 border-amber-300 text-amber-700 hover:bg-amber-50">
                        Verify OTP
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle2 className="h-10 w-10 text-green-500 mb-2" />
                <p className="text-sm font-medium text-gray-700">All caught up</p>
                <p className="text-xs text-gray-400 mt-1">No pending photo verifications</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bills needing attention */}
      {(attentionBills.length > 0 || draftBills.length > 0) && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-gray-400" />
              Bills Needing Attention
            </CardTitle>
            <Link href="/billing">
              <Button variant="ghost" size="sm" className="text-xs text-gray-500 gap-1">
                All Bills <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {[...attentionBills, ...draftBills].slice(0, 8).map(bill => {
                const balance = Number(bill.totalAmount) - Number(bill.amountPaid);
                return (
                  <div key={bill.id} className="py-3 flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900">{bill.billNumber}</p>
                      <p className="text-xs text-gray-500">
                        Balance: <span className="font-medium text-gray-700">&#8377;{balance.toLocaleString("en-IN")}</span>
                        {bill.dueDate ? ` · Due ${new Date(bill.dueDate).toLocaleDateString("en-IN")}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <StatusBadge status={bill.status} />
                      <Link href="/billing">
                        <Button variant="ghost" size="sm" className="h-7 text-xs px-2">Manage</Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick links bottom */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Manage Fleet", href: "/trucks", icon: Truck, color: "bg-blue-50 text-blue-700 border-blue-200" },
          { label: "Manage Drivers", href: "/drivers", icon: Users, color: "bg-purple-50 text-purple-700 border-purple-200" },
          { label: "Clients", href: "/clients", icon: Building, color: "bg-green-50 text-green-700 border-green-200" },
          { label: "Billing", href: "/billing", icon: FileText, color: "bg-orange-50 text-orange-700 border-orange-200" },
        ].map(item => (
          <Link key={item.href} href={item.href}>
            <div className={`border rounded-lg p-4 flex flex-col items-center gap-2 cursor-pointer hover:shadow-sm transition-shadow ${item.color}`}>
              <item.icon className="h-6 w-6" />
              <span className="text-sm font-medium">{item.label}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
