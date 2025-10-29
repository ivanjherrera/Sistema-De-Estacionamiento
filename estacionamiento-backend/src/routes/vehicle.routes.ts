import { Router } from "express";
import {
  registerEntry,
  registerExit,
  getActiveVehicles,
  getParkingHistory,
  getVehicleByPlate,
  getAllVehicles,
  getStatistics
} from "../controllers/vehicle.controller";
import { authMiddleware, adminMiddleware } from "../middleware/auth.middleware";

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// RUTAS PARA REGISTRAR ENTRADA/SALIDA (cualquier usuario autenticado)
router.post("/entry", registerEntry);
router.post("/exit", registerExit);

// CONSULTAS (cualquier usuario autenticado)
router.get("/active", getActiveVehicles);
router.get("/history", getParkingHistory);
router.get("/plate/:plate", getVehicleByPlate);

// RUTAS ADMINISTRATIVAS (solo admin)
router.get("/all", adminMiddleware, getAllVehicles);
router.get("/statistics", adminMiddleware, getStatistics);

export default router;
