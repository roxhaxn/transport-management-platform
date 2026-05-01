import { Router } from "express";
import { requireAuth } from "../middlewares/auth";

const router = Router();

router.post("/auth/setup-owner", requireAuth, async (_req, res) => {
  res.json({ success: true, message: "Owner role active (demo mode)" });
});

router.get("/auth/me", requireAuth, async (req, res) => {
  res.json({ userId: req.userId, role: req.userRole ?? "owner", email: "owner@transport.demo" });
});

router.post("/auth/set-role", requireAuth, async (req, res) => {
  res.json({ success: true, message: "Role updated (demo mode)" });
});

export default router;
