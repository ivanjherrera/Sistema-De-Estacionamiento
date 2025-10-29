import { Router } from "express";
import {
  createParkingRecord,
  finalizeParkingRecord,
  getAllParkingRecords,
  getParkingRecordById,
  getActiveRecords,
  deleteParkingRecord,
  getRevenueReport
} from "../controllers/parking.controller";
import { authMiddleware, adminMiddleware } from "../middleware/auth.middleware";

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// RUTAS PARA USUARIOS AUTENTICADOS
router.post("/", createParkingRecord);                    // Crear entrada
router.patch("/:id/exit", finalizeParkingRecord);        // Registrar salida
router.get("/", getAllParkingRecords);                   // Obtener todos los registros
router.get("/active", getActiveRecords);                 // Obtener registros activos
router.get("/:id", getParkingRecordById);                // Obtener registro por ID

// RUTAS SOLO PARA ADMIN
router.delete("/:id", adminMiddleware, deleteParkingRecord);  // Eliminar registro
router.get("/reports/revenue", adminMiddleware, getRevenueReport);  // Reporte de ingresos

export default router