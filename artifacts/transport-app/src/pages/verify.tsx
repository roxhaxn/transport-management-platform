import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useRequestPhotoOtp, useVerifyPhotoOtp } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { ShieldCheck, ArrowLeft, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function Verify() {
  const { photoId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [sentTo, setSentTo] = useState("");

  const requestOtp = useRequestPhotoOtp();
  const verifyOtp = useVerifyPhotoOtp();

  const handleRequestOtp = () => {
    if (!photoId) return;
    
    requestOtp.mutate(
      { photoId: Number(photoId) },
      {
        onSuccess: (data) => {
          setOtpSent(true);
          setSentTo(data.otpSentTo);
          toast({
            title: "OTP Sent",
            description: data.message,
          });
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to request OTP. Please try again.",
            variant: "destructive"
          });
        }
      }
    );
  };

  const handleVerify = () => {
    if (!photoId || otp.length !== 6) return;

    verifyOtp.mutate(
      { 
        photoId: Number(photoId),
        data: { otp }
      },
      {
        onSuccess: () => {
          toast({
            title: "Verification Successful",
            description: "The photo has been securely verified.",
          });
          // Invalidate trips/photos queries
          queryClient.invalidateQueries();
          setLocation("/");
        },
        onError: () => {
          toast({
            title: "Verification Failed",
            description: "Invalid or expired OTP. Please try again.",
            variant: "destructive"
          });
        }
      }
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Button variant="ghost" onClick={() => setLocation("/")} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>

        <Card className="border-t-4 border-t-primary shadow-lg">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-2">
              <ShieldCheck className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Verify Sealed Photo</CardTitle>
            <CardDescription>
              Owner verification required for photo ID #{photoId}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 flex flex-col items-center">
            
            {!otpSent ? (
              <div className="text-center space-y-4 w-full">
                <p className="text-sm text-muted-foreground">
                  Click the button below to request a 6-digit OTP code to verify this photo.
                </p>
                <Button 
                  className="w-full" 
                  size="lg" 
                  onClick={handleRequestOtp}
                  disabled={requestOtp.isPending}
                >
                  {requestOtp.isPending ? "Requesting..." : "Request OTP Code"}
                </Button>
              </div>
            ) : (
              <div className="space-y-6 w-full flex flex-col items-center">
                <div className="flex items-center text-sm text-amber-600 bg-amber-50 px-4 py-2 rounded-full font-medium">
                  <Mail className="h-4 w-4 mr-2" /> Code sent to {sentTo}
                </div>
                
                <div className="space-y-2">
                  <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <Button 
                  className="w-full" 
                  size="lg" 
                  onClick={handleVerify}
                  disabled={otp.length !== 6 || verifyOtp.isPending}
                >
                  {verifyOtp.isPending ? "Verifying..." : "Verify Photo"}
                </Button>
                
                <Button 
                  variant="link" 
                  size="sm" 
                  onClick={handleRequestOtp}
                  disabled={requestOtp.isPending}
                  className="text-muted-foreground"
                >
                  Resend Code
                </Button>
              </div>
            )}
            
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
