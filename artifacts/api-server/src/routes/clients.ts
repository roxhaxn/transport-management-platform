import { Router } from "express";
import { db, clientsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreateClientBody, UpdateClientBody } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";

const router = Router();

function formatClient(c: typeof clientsTable.$inferSelect) {
  return {
    ...c,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

router.get("/clients", requireAuth, async (req, res) => {
  try {
    const clients = await db.select().from(clientsTable).orderBy(clientsTable.name);
    res.json(clients.map(formatClient));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to list clients" });
  }
});

router.post("/clients", requireAuth, async (req, res) => {
  const parsed = CreateClientBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  try {
    const [client] = await db.insert(clientsTable).values({
      name: parsed.data.name,
      contactName: parsed.data.contactName ?? null,
      phone: parsed.data.phone,
      email: parsed.data.email ?? null,
      address: parsed.data.address ?? null,
      gstNumber: parsed.data.gstNumber ?? null,
      notes: parsed.data.notes ?? null,
    }).returning();
    res.status(201).json(formatClient(client));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to create client" });
  }
});

router.get("/clients/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  try {
    const [client] = await db.select().from(clientsTable).where(eq(clientsTable.id, id));
    if (!client) {
      res.status(404).json({ error: "Client not found" });
      return;
    }
    res.json(formatClient(client));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get client" });
  }
});

router.patch("/clients/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const parsed = UpdateClientBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  try {
    const updates: Partial<typeof clientsTable.$inferInsert> = {};
    if (parsed.data.name !== undefined) updates.name = parsed.data.name;
    if (parsed.data.contactName !== undefined) updates.contactName = parsed.data.contactName;
    if (parsed.data.phone !== undefined) updates.phone = parsed.data.phone;
    if (parsed.data.email !== undefined) updates.email = parsed.data.email;
    if (parsed.data.address !== undefined) updates.address = parsed.data.address;
    if (parsed.data.gstNumber !== undefined) updates.gstNumber = parsed.data.gstNumber;
    if (parsed.data.notes !== undefined) updates.notes = parsed.data.notes;

    const [client] = await db.update(clientsTable).set(updates).where(eq(clientsTable.id, id)).returning();
    if (!client) {
      res.status(404).json({ error: "Client not found" });
      return;
    }
    res.json(formatClient(client));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to update client" });
  }
});

router.delete("/clients/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  try {
    await db.delete(clientsTable).where(eq(clientsTable.id, id));
    res.json({ success: true, message: "Client deleted" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to delete client" });
  }
});

export default router;
