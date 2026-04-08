import { useState } from "react";
import { useListTrips, getListTripsQueryKey, useUploadTripPhoto } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, Upload, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function DriverPortal() {
  const { toast } = useToast();
  const [selectedTrip, setSelectedTrip] = useState<string>("");
  const [arrivalPhoto, setArrivalPhoto] = useState<string | null>(null);
  const [sealedPhoto, setSealedPhoto] = useState<string | null>(null);
  const [driverName, setDriverName] = useState<string>("Driver"); // simplified

  const { data: trips, isLoading: loadingTrips } = useListTrips({ status: 'in_transit' }, {
    query: { queryKey: getListTripsQueryKey({ status: 'in_transit' }) }
  });

  const uploadPhoto = useUploadTripPhoto();

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>, type: 'arrival' | 'sealed') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'arrival') {
          setArrivalPhoto(reader.result as string);
        } else {
          setSealedPhoto(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = (type: 'arrival' | 'sealed') => {
    const photoDataUrl = type === 'arrival' ? arrivalPhoto : sealedPhoto;
    
    if (!selectedTrip || !photoDataUrl) return;

    uploadPhoto.mutate(
      { 
        id: Number(selectedTrip), 
        data: { 
          photoType: type, 
          photoDataUrl, 
          uploadedBy: driverName 
        } 
      },
      {
        onSuccess: () => {
          toast({
            title: "Photo Uploaded",
            description: `Successfully uploaded ${type} photo.`,
          });
          if (type === 'arrival') setArrivalPhoto(null);
          else setSealedPhoto(null);
        },
        onError: () => {
          toast({
            title: "Upload Failed",
            description: "Failed to upload photo. Please try again.",
            variant: "destructive"
          });
        }
      }
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Driver Portal</h1>
          <p className="text-sm text-gray-500 mt-1">Upload required photos for your active trip</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Trip Selection</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Select Active Trip</Label>
                <Select value={selectedTrip} onValueChange={setSelectedTrip}>
                  <SelectTrigger>
                    <SelectValue placeholder={loadingTrips ? "Loading..." : "Select a trip"} />
                  </SelectTrigger>
                  <SelectContent>
                    {trips?.map(trip => (
                      <SelectItem key={trip.id} value={trip.id.toString()}>
                        {trip.origin} → {trip.destination}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {selectedTrip && (
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  Arrival Photo
                  {arrivalPhoto && <span className="text-xs font-normal text-green-600 bg-green-50 px-2 py-1 rounded">Ready to upload</span>}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {arrivalPhoto ? (
                  <div className="relative aspect-video rounded-md overflow-hidden bg-gray-100 border">
                    <img src={arrivalPhoto} alt="Arrival" className="w-full h-full object-cover" />
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                      onClick={() => setArrivalPhoto(null)}
                    >
                      Retake
                    </Button>
                  </div>
                ) : (
                  <div className="relative">
                    <Input 
                      type="file" 
                      accept="image/*" 
                      capture="environment" 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      onChange={(e) => handlePhotoCapture(e, 'arrival')}
                    />
                    <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors">
                      <Camera className="h-8 w-8 mb-2" />
                      <p className="text-sm font-medium">Tap to open camera</p>
                    </div>
                  </div>
                )}
                
                <Button 
                  className="w-full" 
                  disabled={!arrivalPhoto || uploadPhoto.isPending}
                  onClick={() => handleUpload('arrival')}
                >
                  <Upload className="h-4 w-4 mr-2" /> Upload Arrival Photo
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  Sealed/Loaded Photo
                  {sealedPhoto && <span className="text-xs font-normal text-green-600 bg-green-50 px-2 py-1 rounded">Ready to upload</span>}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs p-3 rounded-md flex items-start">
                  <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5" />
                  <p>Take a clear photo of the truck seal after loading. This will require owner OTP verification.</p>
                </div>

                {sealedPhoto ? (
                  <div className="relative aspect-video rounded-md overflow-hidden bg-gray-100 border">
                    <img src={sealedPhoto} alt="Sealed" className="w-full h-full object-cover" />
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                      onClick={() => setSealedPhoto(null)}
                    >
                      Retake
                    </Button>
                  </div>
                ) : (
                  <div className="relative">
                    <Input 
                      type="file" 
                      accept="image/*" 
                      capture="environment" 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      onChange={(e) => handlePhotoCapture(e, 'sealed')}
                    />
                    <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors">
                      <Camera className="h-8 w-8 mb-2" />
                      <p className="text-sm font-medium">Tap to open camera</p>
                    </div>
                  </div>
                )}

                <Button 
                  className="w-full" 
                  disabled={!sealedPhoto || uploadPhoto.isPending}
                  onClick={() => handleUpload('sealed')}
                >
                  <Upload className="h-4 w-4 mr-2" /> Upload Sealed Photo
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
