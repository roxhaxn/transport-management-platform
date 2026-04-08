import { useGetDashboardSummary, getGetDashboardSummaryQueryKey, useGetRecentTrips, getGetRecentTripsQueryKey, useGetPendingPhotos, getGetPendingPhotosQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck, Users, MapPin, DollarSign, AlertCircle, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const { data: summary, isLoading: loadingSummary } = useGetDashboardSummary({
    query: { queryKey: getGetDashboardSummaryQueryKey() }
  });

  const { data: recentTrips, isLoading: loadingTrips } = useGetRecentTrips({
    query: { queryKey: getGetRecentTripsQueryKey() }
  });

  const { data: pendingPhotos, isLoading: loadingPhotos } = useGetPendingPhotos({
    query: { queryKey: getGetPendingPhotosQueryKey() }
  });

  if (loadingSummary || loadingTrips || loadingPhotos) {
    return <div className="space-y-4 animate-pulse">
      <div className="h-8 w-64 bg-gray-200 rounded"></div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-gray-200 rounded"></div>)}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="h-64 bg-gray-200 rounded"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    </div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Trucks</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalTrucks || 0}</div>
            <p className="text-xs text-muted-foreground">
              {summary?.activeTrucks || 0} active
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Drivers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalDrivers || 0}</div>
            <p className="text-xs text-muted-foreground">
              Registered drivers
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Trips</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.activeTrips || 0}</div>
            <p className="text-xs text-muted-foreground">
              {summary?.completedTripsThisMonth || 0} completed this month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue (MTD)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${summary?.totalRevenueThisMonth?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">
              {summary?.pendingBills || 0} pending bills
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Trips</CardTitle>
          </CardHeader>
          <CardContent>
            {recentTrips && recentTrips.length > 0 ? (
              <div className="space-y-4">
                {recentTrips.map(trip => (
                  <div key={trip.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium">{trip.origin} → {trip.destination}</p>
                      <p className="text-sm text-muted-foreground">{trip.clientCompany}</p>
                    </div>
                    <Badge variant={trip.status === 'completed' ? 'default' : 'secondary'}>
                      {trip.status.replace('_', ' ')}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">No recent trips</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Pending Verifications</CardTitle>
            {summary && summary.pendingPhotoVerifications > 0 && (
              <Badge variant="destructive">{summary.pendingPhotoVerifications} Pending</Badge>
            )}
          </CardHeader>
          <CardContent>
            {pendingPhotos && pendingPhotos.length > 0 ? (
              <div className="space-y-4">
                {pendingPhotos.map(photo => (
                  <div key={photo.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center gap-4">
                      {photo.photoDataUrl || photo.photoUrl ? (
                        <div className="h-12 w-12 rounded bg-gray-100 overflow-hidden">
                          <img src={photo.photoDataUrl || photo.photoUrl} alt="Trip photo" className="h-full w-full object-cover" />
                        </div>
                      ) : (
                        <div className="h-12 w-12 rounded bg-gray-100 flex items-center justify-center">
                          <AlertCircle className="h-5 w-5 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-sm">Trip #{photo.tripId} - {photo.photoType}</p>
                        <p className="text-xs text-muted-foreground">Uploaded by {photo.uploadedBy}</p>
                      </div>
                    </div>
                    <Link href={`/verify/${photo.id}`} className="text-sm text-primary hover:underline font-medium">
                      Verify OTP
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle2 className="h-10 w-10 text-green-500 mb-2" />
                <p className="text-muted-foreground">All caught up!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
