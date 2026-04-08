import { Router } from "express";
import { db, tripsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { CreateTripBody, UpdateTripBody, ListTripsQueryParams } from "@workspace/api-zod";

const router = Router();

function formatTrip(t: typeof tripsTable.$inferSelect) {
  return {
    ...t,
    startDate: t.startDate ? t.startDate.toISOString() : null,
    endDate: t.endDate ? t.endDate.toISOString() : null,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  };
}

router.get("/trips", async (req, res) => {
  try {
    const params = ListTripsQueryParams.safeParse(req.query);
    const conditions = [];
    if (params.success) {
      if (params.data.status) conditions.push(eq(tripsTable.status, params.data.status));
      if (params.data.truckId) conditions.push(eq(tripsTable.truckId, params.data.truckId));
      if (params.data.driverId) conditions.push(eq(tripsTable.driverId, params.data.driverId));
    }
    const trips = conditions.length > 0
      ? await db.select().from(tripsTable).where(and(...conditions)).orderBy(tripsTable.id)
      : await db.select().from(tripsTable).orderBy(tripsTable.id);
    res.json(trips.map(formatTrip));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to list trips" });
  }
});

router.post("/trips", async (req, res) => {
  const parsed = CreateTripBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  try {
    const [trip] = await db.insert(tripsTable).values({
      truckId: parsed.data.truckId,
      driverId: parsed.data.driverId,
      origin: parsed.data.origin,
      destination: parsed.data.destination,
      clientCompany: parsed.data.clientCompany,
      cargoDescription: parsed.data.cargoDescription,
      startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : null,
      notes: parsed.data.notes ?? null,
      status: "scheduled",
    }).returning();
    res.status(201).json(formatTrip(trip));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to create trip" });
  }
});

router.get("/trips/:id", async (req, res) => {
  const id = Number(req.params.id);
  try {
    const [trip] = await db.select().from(tripsTable).where(eq(tripsTable.id, id));
    if (!trip) {
      res.status(404).json({ error: "Trip not found" });
      return;
    }
    res.json(formatTrip(trip));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get trip" });
  }
});

router.patch("/trips/:id", async (req, res) => {
  const id = Number(req.params.id);
  const parsed = UpdateTripBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  try {
    const updates: Partial<typeof tripsTable.$inferInsert> = {};
    if (parsed.data.status !== undefined) updates.status = parsed.data.status;
    if (parsed.data.endDate !== undefined) updates.endDate = new Date(parsed.data.endDate);
    if (parsed.data.notes !== undefined) updates.notes = parsed.data.notes;
    if (parsed.data.cargoDescription !== undefined) updates.cargoDescription = parsed.data.cargoDescription;

    const [trip] = await db.update(tripsTable).set(updates).where(eq(tripsTable.id, id)).returning();
    if (!trip) {
      res.status(404).json({ error: "Trip not found" });
      return;
    }
    res.json(formatTrip(trip));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to update trip" });
  }
});

export default router;
