import { Router } from "express";
import { db, driversTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreateDriverBody } from "@workspace/api-zod";

const router = Router();

router.get("/drivers", async (req, res) => {
  try {
    const drivers = await db.select().from(driversTable).orderBy(driversTable.id);
    res.json(drivers.map((d) => ({
      ...d,
      createdAt: d.createdAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
    })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to list drivers" });
  }
});

router.post("/drivers", async (req, res) => {
  const parsed = CreateDriverBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  try {
    const [driver] = await db.insert(driversTable).values({
      name: parsed.data.name,
      phone: parsed.data.phone,
      licenseNumber: parsed.data.licenseNumber,
      status: parsed.data.status ?? "active",
    }).returning();
    res.status(201).json({
      ...driver,
      createdAt: driver.createdAt.toISOString(),
      updatedAt: driver.updatedAt.toISOString(),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to create driver" });
  }
});

router.get("/drivers/:id", async (req, res) => {
  const id = Number(req.params.id);
  try {
    const [driver] = await db.select().from(driversTable).where(eq(driversTable.id, id));
    if (!driver) {
      res.status(404).json({ error: "Driver not found" });
      return;
    }
    res.json({
      ...driver,
      createdAt: driver.createdAt.toISOString(),
      updatedAt: driver.updatedAt.toISOString(),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get driver" });
  }
});

export default router;
