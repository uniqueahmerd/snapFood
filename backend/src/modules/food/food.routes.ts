import { Router } from "express";

// local imports
import { adminScans, analyze, mealHistory } from "./food.controller";
import { authenticate, authorize } from "../../shared/midddleware/auth.middleware";
import { Role } from "../../shared/types/types";

const foodRouter: Router = Router();

foodRouter.post("/analyze", authenticate, analyze);
foodRouter.get("/history", authenticate, mealHistory);
foodRouter.get("/admin/scans", authenticate, authorize(Role.ADMIN), adminScans);

export default foodRouter;
