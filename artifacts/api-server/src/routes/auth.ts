import { Router } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import { requireAuth } from "../middlewares/auth";
import { SetUserRoleBody } from "@workspace/api-zod";

const router = Router();

router.get("/auth/me", requireAuth, async (req, res) => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const user = await clerkClient().users.getUser(userId);
    const role = (user.publicMetadata?.role as string) ?? "driver";
    const email = user.emailAddresses?.[0]?.emailAddress ?? null;
    res.json({ userId, role, email });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get user info" });
  }
});

router.post("/auth/set-role", requireAuth, async (req, res) => {
  const callerId = req.userId!;
  const parsed = SetUserRoleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  try {
    const callerUser = await clerkClient().users.getUser(callerId);
    const callerRole = (callerUser.publicMetadata?.role as string) ?? "driver";
    if (callerRole !== "owner") {
      res.status(403).json({ error: "Only owners can assign roles" });
      return;
    }
    await clerkClient().users.updateUserMetadata(parsed.data.targetUserId, {
      publicMetadata: { role: parsed.data.role },
    });
    res.json({ success: true, message: "Role updated" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to set role" });
  }
});

export default router;
