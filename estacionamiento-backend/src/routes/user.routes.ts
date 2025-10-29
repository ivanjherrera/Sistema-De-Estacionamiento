import { Router } from "express";
import {
  getAllUsers,
  getUserById,
  updateUsername,
  blockUser,
  unblockUser,
  deleteUser,
  getMyProfile
} from "../controllers/user.controller";
import { authMiddleware, adminMiddleware } from "../middleware/auth.middleware";

const router = Router();

// RUTAS PROTEGIDAS (requieren autenticación)
router.get("/me", authMiddleware, getMyProfile);
router.put("/:id", authMiddleware, updateUsername);

// RUTAS SOLO PARA ADMIN
router.get("/", authMiddleware, adminMiddleware, getAllUsers);
router.get("/:id", authMiddleware, adminMiddleware, getUserById);
router.patch("/:id/block", authMiddleware, adminMiddleware, blockUser);
router.patch("/:id/unblock", authMiddleware, adminMiddleware, unblockUser);
router.delete("/:id", authMiddleware, adminMiddleware, deleteUser);

export default router;