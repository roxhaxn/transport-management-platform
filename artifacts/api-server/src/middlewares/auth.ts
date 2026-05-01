import type { Request, Response, NextFunction } from "express";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userRole?: string;
    }
  }
}

export const requireAuth = (req: Request, _res: Response, next: NextFunction) => {
  req.userId = "demo-user";
  req.userRole = "owner";
  next();
};

export const requireOwner = (req: Request, _res: Response, next: NextFunction) => {
  req.userId = "demo-user";
  req.userRole = "owner";
  next();
};
