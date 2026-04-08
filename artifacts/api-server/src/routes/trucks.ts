import { Router } from "express";
import { db, trucksTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreateTruckBody, UpdateTruckBody } from "@workspace/api-zod";

const router = Router();

router.get("/trucks", async (req, res) => {
  try {
    const trucks = await db.select().from(trucksTable).orderBy(trucksTable.id);
    const result = trucks.map((t) => ({
      ...t,
      capacity: Number(t.capacity),
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    }));
    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to list trucks" });
  }
});

router.post("/trucks", async (req, res) => {
  const parsed = CreateTruckBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  try {
    const [truck] = await db.insert(trucksTable).values({
      registrationNumber: parsed.data.registrationNumber,
      model: parsed.data.model,
      capacity: String(parsed.data.capacity),
      status: parsed.data.status ?? "active",
      driverId: parsed.data.driverId ?? null,
    }).returning();
    res.status(201).json({
      ...truck,
      capacity: Number(truck.capacity),
      createdAt: truck.createdAt.toISOString(),
      updatedAt: truck.updatedAt.toISOString(),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to create truck" });
  }
});

router.get("/trucks/:id", async (req, res) => {
  const id = Number(req.params.id);
  try {
    const [truck] = await db.select().from(trucksTable).where(eq(trucksTable.id, id));
    if (!truck) {
      res.status(404).json({ error: "Truck not found" });
      return;
    }
    res.json({
      ...truck,
      capacity: Number(truck.capacity),
      createdAt: truck.createdAt.toISOString(),
      updatedAt: truck.updatedAt.toISOString(),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get truck" });
  }
});

router.patch("/trucks/:id", async (req, res) => {
  const id = Number(req.params.id);
  const parsed = UpdateTruckBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  try {
    const updates: Partial<typeof trucksTable.$inferInsert> = {};
    if (parsed.data.registrationNumber !== undefined) updates.registrationNumber = parsed.data.registrationNumber;
    if (parsed.data.model !== undefined) updates.model = parsed.data.model;
    if (parsed.data.capacity !== undefined) updates.capacity = String(parsed.data.capacity);
    if (parsed.data.status !== undefined) updates.status = parsed.data.status;
    if (parsed.data.driverId !== undefined) updates.driverId = parsed.data.driverId ?? null;

    const [truck] = await db.update(trucksTable).set(updates).where(eq(trucksTable.id, id)).returning();
    if (!truck) {
      res.status(404).json({ error: "Truck not found" });
      return;
    }
    res.json({
      ...truck,
      capacity: Number(truck.capacity),
      createdAt: truck.createdAt.toISOString(),
      updatedAt: truck.updatedAt.toISOString(),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to update truck" });
  }
});

export default router;
