import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const tripPhotosTable = pgTable("trip_photos", {
  id: serial("id").primaryKey(),
  tripId: integer("trip_id").notNull(),
  photoType: text("photo_type").notNull(),
  photoUrl: text("photo_url").notNull(),
  photoDataUrl: text("photo_data_url"),
  verified: boolean("verified").notNull().default(false),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  otpCode: text("otp_code"),
  otpExpiry: timestamp("otp_expiry", { withTimezone: true }),
  uploadedBy: text("uploaded_by").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertTripPhotoSchema = createInsertSchema(tripPhotosTable).omit({ id: true, createdAt: true });
export type InsertTripPhoto = z.infer<typeof insertTripPhotoSchema>;
export type TripPhoto = typeof tripPhotosTable.$inferSelect;
