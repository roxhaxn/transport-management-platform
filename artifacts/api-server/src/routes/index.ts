import { Router, type IRouter } from "express";
import healthRouter from "./health";
import trucksRouter from "./trucks";
import driversRouter from "./drivers";
import tripsRouter from "./trips";
import photosRouter from "./photos";
import billingRouter from "./billing";
import dashboardRouter from "./dashboard";
import clientsRouter from "./clients";
import authRouter from "./auth";

const router: IRouter = Router();

router.use(healthRouter);
router.use(trucksRouter);
router.use(driversRouter);
router.use(tripsRouter);
router.use(photosRouter);
router.use(billingRouter);
router.use(dashboardRouter);
router.use(clientsRouter);
router.use(authRouter);

export default router;
