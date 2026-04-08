import { pgTable, text, serial, timestamp, integer, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const billsTable = pgTable("bills", {
  id: serial("id").primaryKey(),
  tripId: integer("trip_id").notNull(),
  billNumber: text("bill_number").notNull().unique(),
  baseAmount: numeric("base_amount", { precision: 12, scale: 2 }).notNull(),
  fuelSurcharge: numeric("fuel_surcharge", { precision: 12, scale: 2 }).notNull().default("0"),
  tollCharges: numeric("toll_charges", { precision: 12, scale: 2 }).notNull().default("0"),
  otherCharges: numeric("other_charges", { precision: 12, scale: 2 }).notNull().default("0"),
  totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull(),
  status: text("status").notNull().default("draft"),
  issuedDate: timestamp("issued_date", { withTimezone: true }),
  dueDate: timestamp("due_date", { withTimezone: true }),
  paidDate: timestamp("paid_date", { withTimezone: true }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertBillSchema = createInsertSchema(billsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBill = z.infer<typeof insertBillSchema>;
export type Bill = typeof billsTable.$inferSelect;
