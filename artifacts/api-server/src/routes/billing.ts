import { Router } from "express";
import { db, billsTable, tripsTable, clientsTable, trucksTable, driversTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { CreateBillBody, UpdateBillBody, ListBillsQueryParams, RecordPaymentBody } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";

const router = Router();

function formatBill(b: typeof billsTable.$inferSelect) {
  return {
    ...b,
    baseAmount: Number(b.baseAmount),
    fuelSurcharge: Number(b.fuelSurcharge),
    tollCharges: Number(b.tollCharges),
    otherCharges: Number(b.otherCharges),
    totalAmount: Number(b.totalAmount),
    amountPaid: Number(b.amountPaid),
    paymentMethod: b.paymentMethod ?? null,
    issuedDate: b.issuedDate ? b.issuedDate.toISOString() : null,
    dueDate: b.dueDate ? b.dueDate.toISOString() : null,
    paidDate: b.paidDate ? b.paidDate.toISOString() : null,
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
  };
}

function generateBillNumber() {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const random = Math.floor(1000 + Math.random() * 9000);
  return `BILL-${year}${month}-${random}`;
}

router.get("/billing", requireAuth, async (req, res) => {
  try {
    const params = ListBillsQueryParams.safeParse(req.query);
    const conditions = [];
    if (params.success) {
      if (params.data.tripId) conditions.push(eq(billsTable.tripId, params.data.tripId));
      if (params.data.status) conditions.push(eq(billsTable.status, params.data.status));
    }
    const bills = conditions.length > 0
      ? await db.select().from(billsTable).where(and(...conditions)).orderBy(billsTable.id)
      : await db.select().from(billsTable).orderBy(billsTable.id);
    res.json(bills.map(formatBill));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to list bills" });
  }
});

router.post("/billing", requireAuth, async (req, res) => {
  const parsed = CreateBillBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  try {
    const base = parsed.data.baseAmount;
    const fuel = parsed.data.fuelSurcharge ?? 0;
    const toll = parsed.data.tollCharges ?? 0;
    const other = parsed.data.otherCharges ?? 0;
    const total = base + fuel + toll + other;

    const [bill] = await db.insert(billsTable).values({
      tripId: parsed.data.tripId,
      billNumber: generateBillNumber(),
      baseAmount: String(base),
      fuelSurcharge: String(fuel),
      tollCharges: String(toll),
      otherCharges: String(other),
      totalAmount: String(total),
      amountPaid: "0",
      status: "draft",
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
      issuedDate: new Date(),
      notes: parsed.data.notes ?? null,
    }).returning();
    res.status(201).json(formatBill(bill));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to create bill" });
  }
});

router.get("/billing/export/csv", requireAuth, async (req, res) => {
  try {
    const bills = await db.select({
      bill: billsTable,
      trip: tripsTable,
    }).from(billsTable).leftJoin(tripsTable, eq(billsTable.tripId, tripsTable.id)).orderBy(billsTable.id);

    const headers = ["Bill Number", "Client Company", "Origin", "Destination", "Base Amount", "Fuel Surcharge", "Toll Charges", "Other Charges", "Total Amount", "Amount Paid", "Payment Method", "Status", "Issued Date", "Due Date", "Paid Date", "Notes"];
    const rows = bills.map(({ bill, trip }) => [
      bill.billNumber,
      trip?.clientCompany ?? "",
      trip?.origin ?? "",
      trip?.destination ?? "",
      String(Number(bill.baseAmount)),
      String(Number(bill.fuelSurcharge)),
      String(Number(bill.tollCharges)),
      String(Number(bill.otherCharges)),
      String(Number(bill.totalAmount)),
      String(Number(bill.amountPaid)),
      bill.paymentMethod ?? "",
      bill.status,
      bill.issuedDate ? bill.issuedDate.toISOString().split("T")[0] : "",
      bill.dueDate ? bill.dueDate.toISOString().split("T")[0] : "",
      bill.paidDate ? bill.paidDate.toISOString().split("T")[0] : "",
      bill.notes ?? "",
    ]);

    res.json({ headers, rows });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to export bills" });
  }
});

router.get("/billing/:id/invoice-data", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  try {
    const [bill] = await db.select().from(billsTable).where(eq(billsTable.id, id));
    if (!bill) {
      res.status(404).json({ error: "Bill not found" });
      return;
    }
    const [trip] = await db.select().from(tripsTable).where(eq(tripsTable.id, bill.tripId));
    if (!trip) {
      res.status(404).json({ error: "Trip not found" });
      return;
    }
    const [truck] = await db.select().from(trucksTable).where(eq(trucksTable.id, trip.truckId));
    const [driver] = await db.select().from(driversTable).where(eq(driversTable.id, trip.driverId));
    const client = trip.clientId
      ? (await db.select().from(clientsTable).where(eq(clientsTable.id, trip.clientId)))[0] ?? null
      : null;

    const formatTrip = (t: typeof tripsTable.$inferSelect) => ({
      ...t,
      startDate: t.startDate ? t.startDate.toISOString() : null,
      endDate: t.endDate ? t.endDate.toISOString() : null,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    });
    const formatTruck = (t: typeof trucksTable.$inferSelect) => ({
      ...t,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    });
    const formatDriver = (d: typeof driversTable.$inferSelect) => ({
      ...d,
      createdAt: d.createdAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
    });
    const formatClient = (c: typeof clientsTable.$inferSelect) => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    });

    res.json({
      bill: formatBill(bill),
      trip: formatTrip(trip),
      client: client ? formatClient(client) : null,
      truck: truck ? formatTruck(truck) : null,
      driver: driver ? formatDriver(driver) : null,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get invoice data" });
  }
});

router.post("/billing/:id/payment", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const parsed = RecordPaymentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  try {
    const [bill] = await db.select().from(billsTable).where(eq(billsTable.id, id));
    if (!bill) {
      res.status(404).json({ error: "Bill not found" });
      return;
    }

    const newAmountPaid = Number(bill.amountPaid) + parsed.data.amount;
    const isFullyPaid = newAmountPaid >= Number(bill.totalAmount);
    const newStatus = isFullyPaid ? "paid" : "issued";

    const [updated] = await db.update(billsTable).set({
      amountPaid: String(newAmountPaid),
      paymentMethod: parsed.data.paymentMethod,
      status: newStatus,
      paidDate: isFullyPaid ? (parsed.data.paymentDate ? new Date(parsed.data.paymentDate) : new Date()) : bill.paidDate,
    }).where(eq(billsTable.id, id)).returning();

    res.json(formatBill(updated));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to record payment" });
  }
});

router.get("/billing/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  try {
    const [bill] = await db.select().from(billsTable).where(eq(billsTable.id, id));
    if (!bill) {
      res.status(404).json({ error: "Bill not found" });
      return;
    }
    res.json(formatBill(bill));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get bill" });
  }
});

router.patch("/billing/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const parsed = UpdateBillBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  try {
    const updates: Partial<typeof billsTable.$inferInsert> = {};
    if (parsed.data.status !== undefined) updates.status = parsed.data.status;
    if (parsed.data.paidDate !== undefined) updates.paidDate = new Date(parsed.data.paidDate);
    if (parsed.data.notes !== undefined) updates.notes = parsed.data.notes;
    if (parsed.data.dueDate !== undefined) updates.dueDate = new Date(parsed.data.dueDate);
    if (parsed.data.fuelSurcharge !== undefined) updates.fuelSurcharge = String(parsed.data.fuelSurcharge);
    if (parsed.data.tollCharges !== undefined) updates.tollCharges = String(parsed.data.tollCharges);
    if (parsed.data.otherCharges !== undefined) updates.otherCharges = String(parsed.data.otherCharges);
    if (parsed.data.paymentMethod !== undefined) updates.paymentMethod = parsed.data.paymentMethod;

    const [bill] = await db.select().from(billsTable).where(eq(billsTable.id, id));
    if (!bill) {
      res.status(404).json({ error: "Bill not found" });
      return;
    }

    if (parsed.data.fuelSurcharge !== undefined || parsed.data.tollCharges !== undefined || parsed.data.otherCharges !== undefined) {
      const newFuel = parsed.data.fuelSurcharge !== undefined ? parsed.data.fuelSurcharge : Number(bill.fuelSurcharge);
      const newToll = parsed.data.tollCharges !== undefined ? parsed.data.tollCharges : Number(bill.tollCharges);
      const newOther = parsed.data.otherCharges !== undefined ? parsed.data.otherCharges : Number(bill.otherCharges);
      updates.totalAmount = String(Number(bill.baseAmount) + newFuel + newToll + newOther);
    }

    const [updated] = await db.update(billsTable).set(updates).where(eq(billsTable.id, id)).returning();
    res.json(formatBill(updated));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to update bill" });
  }
});

export default router;
