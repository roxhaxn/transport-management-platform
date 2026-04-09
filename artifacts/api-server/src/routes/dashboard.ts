import { Router } from "express";
import { db, trucksTable, driversTable, tripsTable, billsTable, tripPhotosTable, clientsTable } from "@workspace/db";
import { eq, and, gte, count, sum, sql, inArray } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router = Router();

router.get("/dashboard/summary", requireAuth, async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalTrucksRow] = await db.select({ count: count() }).from(trucksTable);
    const [activeTrucksRow] = await db.select({ count: count() }).from(trucksTable).where(eq(trucksTable.status, "active"));
    const [totalDriversRow] = await db.select({ count: count() }).from(driversTable);
    const [activeTripsRow] = await db.select({ count: count() }).from(tripsTable).where(
      sql`${tripsTable.status} IN ('scheduled', 'in_transit', 'loaded')`
    );
    const [completedThisMonthRow] = await db.select({ count: count() }).from(tripsTable).where(
      and(eq(tripsTable.status, "completed"), gte(tripsTable.updatedAt, startOfMonth))
    );
    const [revenueRow] = await db.select({ total: sum(billsTable.totalAmount) }).from(billsTable).where(
      and(eq(billsTable.status, "paid"), gte(billsTable.paidDate, startOfMonth))
    );
    const [pendingBillsRow] = await db.select({ count: count() }).from(billsTable).where(
      sql`${billsTable.status} IN ('draft', 'issued', 'overdue')`
    );
    const [pendingPhotosRow] = await db.select({ count: count() }).from(tripPhotosTable).where(
      and(eq(tripPhotosTable.verified, false), eq(tripPhotosTable.photoType, "sealed"))
    );
    const [totalClientsRow] = await db.select({ count: count() }).from(clientsTable);

    res.json({
      totalTrucks: totalTrucksRow.count,
      activeTrucks: activeTrucksRow.count,
      totalDrivers: totalDriversRow.count,
      activeTrips: activeTripsRow.count,
      completedTripsThisMonth: completedThisMonthRow.count,
      totalRevenueThisMonth: Number(revenueRow.total ?? 0),
      pendingBills: pendingBillsRow.count,
      pendingPhotoVerifications: pendingPhotosRow.count,
      totalClients: totalClientsRow.count,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get dashboard summary" });
  }
});

router.get("/dashboard/recent-trips", requireAuth, async (req, res) => {
  try {
    const trips = await db.select().from(tripsTable).orderBy(sql`${tripsTable.createdAt} DESC`).limit(10);
    res.json(trips.map((t) => ({
      ...t,
      startDate: t.startDate ? t.startDate.toISOString() : null,
      endDate: t.endDate ? t.endDate.toISOString() : null,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get recent trips" });
  }
});

router.get("/dashboard/pending-photos", requireAuth, async (req, res) => {
  try {
    const photos = await db.select().from(tripPhotosTable).where(
      and(eq(tripPhotosTable.verified, false), eq(tripPhotosTable.photoType, "sealed"))
    ).orderBy(tripPhotosTable.id);
    res.json(photos.map((p) => ({
      ...p,
      verifiedAt: p.verifiedAt ? p.verifiedAt.toISOString() : null,
      otpExpiry: p.otpExpiry ? p.otpExpiry.toISOString() : null,
      createdAt: p.createdAt.toISOString(),
    })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get pending photos" });
  }
});

router.get("/dashboard/driver-activity", requireAuth, async (req, res) => {
  try {
    const drivers = await db.select().from(driversTable).orderBy(driversTable.name);
    const activeTrips = await db.select().from(tripsTable).where(
      sql`${tripsTable.status} IN ('scheduled', 'in_transit', 'loaded')`
    );

    const truckIds = [...new Set(activeTrips.map(t => t.truckId).filter(Boolean))];
    const trucks = truckIds.length > 0
      ? await db.select().from(trucksTable).where(inArray(trucksTable.id, truckIds))
      : [];

    const activity = drivers.map((driver) => {
      const currentTrip = activeTrips.find((t) => t.driverId === driver.id) ?? null;
      const truck = currentTrip ? trucks.find((t) => t.id === currentTrip.truckId) ?? null : null;
      return {
        driver: {
          ...driver,
          createdAt: driver.createdAt.toISOString(),
          updatedAt: driver.updatedAt.toISOString(),
        },
        currentTrip: currentTrip
          ? {
              ...currentTrip,
              startDate: currentTrip.startDate ? currentTrip.startDate.toISOString() : null,
              endDate: currentTrip.endDate ? currentTrip.endDate.toISOString() : null,
              createdAt: currentTrip.createdAt.toISOString(),
              updatedAt: currentTrip.updatedAt.toISOString(),
            }
          : null,
        truck: truck
          ? {
              ...truck,
              createdAt: truck.createdAt.toISOString(),
              updatedAt: truck.updatedAt.toISOString(),
            }
          : null,
      };
    });

    res.json(activity);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get driver activity" });
  }
});

export default router;
