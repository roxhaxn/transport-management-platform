import { getAuth, clerkClient } from "@clerk/express";
import type { Request, Response, NextFunction } from "express";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userRole?: string;
    }
  }
}

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  req.userId = userId;
  next();
};

export const requireOwner = async (req: Request, res: Response, next: NextFunction) => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const user = await clerkClient().users.getUser(userId);
    const role = (user.publicMetadata?.role as string) ?? "driver";
    if (role !== "owner") {
      res.status(403).json({ error: "Forbidden: owner access required" });
      return;
    }
    req.userId = userId;
    req.userRole = role;
    next();
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
};
