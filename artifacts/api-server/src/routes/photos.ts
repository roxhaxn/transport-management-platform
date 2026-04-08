import { Router } from "express";
import { db, tripPhotosTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { UploadTripPhotoBody, VerifyPhotoOtpBody } from "@workspace/api-zod";

const router = Router();

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function formatPhoto(p: typeof tripPhotosTable.$inferSelect) {
  return {
    ...p,
    verifiedAt: p.verifiedAt ? p.verifiedAt.toISOString() : null,
    otpExpiry: p.otpExpiry ? p.otpExpiry.toISOString() : null,
    createdAt: p.createdAt.toISOString(),
  };
}

router.get("/trips/:id/photos", async (req, res) => {
  const tripId = Number(req.params.id);
  try {
    const photos = await db.select().from(tripPhotosTable).where(eq(tripPhotosTable.tripId, tripId)).orderBy(tripPhotosTable.id);
    res.json(photos.map(formatPhoto));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to list photos" });
  }
});

router.post("/trips/:id/photos", async (req, res) => {
  const tripId = Number(req.params.id);
  const parsed = UploadTripPhotoBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  try {
    const photoUrl = `/api/photos/data/${Date.now()}`;
    const [photo] = await db.insert(tripPhotosTable).values({
      tripId,
      photoType: parsed.data.photoType,
      photoUrl,
      photoDataUrl: parsed.data.photoDataUrl,
      uploadedBy: parsed.data.uploadedBy,
      verified: false,
    }).returning();
    res.status(201).json(formatPhoto(photo));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to upload photo" });
  }
});

router.post("/photos/:photoId/request-otp", async (req, res) => {
  const photoId = Number(req.params.photoId);
  try {
    const [photo] = await db.select().from(tripPhotosTable).where(eq(tripPhotosTable.id, photoId));
    if (!photo) {
      res.status(404).json({ error: "Photo not found" });
      return;
    }
    const otp = generateOtp();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await db.update(tripPhotosTable).set({ otpCode: otp, otpExpiry }).where(eq(tripPhotosTable.id, photoId));
    req.log.info({ photoId, otp }, "OTP generated for photo verification");
    res.json({
      message: `OTP sent successfully. For demo purposes, your OTP is: ${otp}`,
      otpSentTo: "owner@transport.com",
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to request OTP" });
  }
});

router.post("/photos/:photoId/verify-otp", async (req, res) => {
  const photoId = Number(req.params.photoId);
  const parsed = VerifyPhotoOtpBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  try {
    const [photo] = await db.select().from(tripPhotosTable).where(eq(tripPhotosTable.id, photoId));
    if (!photo) {
      res.status(404).json({ error: "Photo not found" });
      return;
    }
    if (!photo.otpCode || !photo.otpExpiry) {
      res.status(400).json({ error: "No OTP requested for this photo" });
      return;
    }
    if (new Date() > photo.otpExpiry) {
      res.status(400).json({ error: "OTP has expired" });
      return;
    }
    if (photo.otpCode !== parsed.data.otp) {
      res.status(400).json({ error: "Invalid OTP" });
      return;
    }
    const [verified] = await db.update(tripPhotosTable).set({
      verified: true,
      verifiedAt: new Date(),
      otpCode: null,
      otpExpiry: null,
    }).where(eq(tripPhotosTable.id, photoId)).returning();
    res.json(formatPhoto(verified));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to verify OTP" });
  }
});

export default router;
