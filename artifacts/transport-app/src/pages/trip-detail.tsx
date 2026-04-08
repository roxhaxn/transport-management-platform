import { useParams } from "wouter";
import { useGetTrip, getGetTripQueryKey, useListTripPhotos, getListTripPhotosQueryKey, useGetTruck, useGetDriver } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { Link } from "wouter";

export default function TripDetail() {
  const { id } = useParams();
  const tripId = Number(id);

  const { data: trip, isLoading: loadingTrip } = useGetTrip(tripId, {
    query: { enabled: !!tripId, queryKey: getGetTripQueryKey(tripId) }
  });

  const { data: photos, isLoading: loadingPhotos } = useListTripPhotos(tripId, {
    query: { enabled: !!tripId, queryKey: getListTripPhotosQueryKey(tripId) }
  });

  const { data: truck } = useGetTruck(trip?.truckId || 0, {
    query: { enabled: !!trip?.truckId }
  });

  const { data: driver } = useGetDriver(trip?.driverId || 0, {
    query: { enabled: !!trip?.driverId }
  });

  if (loadingTrip || loadingPhotos) {
    return <div className="p-8 text-center text-muted-foreground">Loading trip details...</div>;
  }

  if (!trip) {
    return <div className="p-8 text-center text-muted-foreground">Trip not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Trip #{trip.id}</h1>
          <p className="text-muted-foreground mt-1">
            {trip.origin} to {trip.destination}
          </p>
        </div>
        <Badge className="text-sm px-3 py-1" variant={
          trip.status === 'completed' ? 'default' : 
          trip.status === 'in_transit' ? 'secondary' : 'outline'
        }>
          {trip.status.replace('_', ' ').toUpperCase()}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Trip Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Client Company</p>
                <p className="font-medium">{trip.clientCompany}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Cargo Description</p>
                <p className="font-medium">{trip.cargoDescription}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Origin</p>
                <p className="font-medium">{trip.origin}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Destination</p>
                <p className="font-medium">{trip.destination}</p>
              </div>
              {trip.notes && (
                <div className="col-span-2">
                  <p className="text-sm font-medium text-muted-foreground">Notes</p>
                  <p className="font-medium bg-gray-50 p-3 rounded-md mt-1">{trip.notes}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Assignment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Driver</p>
                <p className="font-medium">{driver ? driver.name : `Driver #${trip.driverId}`}</p>
                {driver && <p className="text-xs text-muted-foreground">{driver.phone}</p>}
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Truck</p>
                <p className="font-medium">{truck ? truck.registrationNumber : `Truck #${trip.truckId}`}</p>
                {truck && <p className="text-xs text-muted-foreground">{truck.model}</p>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Photo Verification</CardTitle>
        </CardHeader>
        <CardContent>
          {photos && photos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {photos.map(photo => (
                <div key={photo.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold capitalize">{photo.photoType} Photo</h3>
                      <p className="text-xs text-muted-foreground">Uploaded by {photo.uploadedBy}</p>
                    </div>
                    {photo.verified ? (
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100 flex items-center">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Verified
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="flex items-center">
                        <AlertCircle className="w-3 h-3 mr-1" /> Pending Verification
                      </Badge>
                    )}
                  </div>
                  
                  <div className="aspect-video w-full bg-gray-100 rounded-md overflow-hidden relative">
                    {(photo.photoDataUrl || photo.photoUrl) ? (
                      <img src={photo.photoDataUrl || photo.photoUrl} alt={photo.photoType} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex items-center justify-center w-full h-full text-muted-foreground">
                        No image available
                      </div>
                    )}
                  </div>

                  {!photo.verified && (
                    <div className="pt-2 border-t flex justify-end">
                      <Link href={`/verify/${photo.id}`} className="text-primary text-sm font-medium hover:underline flex items-center">
                        Proceed to Verification OTP →
                      </Link>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border rounded-lg bg-gray-50 border-dashed">
              <Clock className="w-8 h-8 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900">No photos uploaded yet</h3>
              <p className="text-sm text-gray-500 max-w-sm mx-auto mt-1">
                The driver has not uploaded any arrival or sealed photos for this trip yet.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
