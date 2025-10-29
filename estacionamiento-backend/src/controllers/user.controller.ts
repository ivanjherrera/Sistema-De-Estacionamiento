import { Request, Response } from "express";
import prisma from "../prisma/client";

// 1. OBTENER TODOS LOS USUARIOS (solo admin)
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { records: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      message: "Usuarios obtenidos exitosamente",
      count: users.length,
      users
    });

  } catch (error: any) {
    console.error("Error al obtener usuarios:", error);
    res.status(500).json({ 
      error: "Error al obtener usuarios",
      details: error.message 
    });
  }
};

// 2. OBTENER UN USUARIO POR ID
export const getUserById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id ?? "");

    if (isNaN(id)) {
      return res.status(400).json({ error: "ID inválido" });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { records: true }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json({
      message: "Usuario encontrado",
      user
    });

  } catch (error: any) {
    console.error("Error al obtener usuario:", error);
    res.status(500).json({ 
      error: "Error al obtener usuario",
      details: error.message 
    });
  }
};

// 3. ACTUALIZAR NOMBRE DE USUARIO
export const updateUsername = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id ?? "");
    const { username } = req.body;
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;

    if (isNaN(id)) {
      return res.status(400).json({ error: "ID inválido" });
    }

    // Usuario común solo puede editar su propio nombre
    if (userRole !== "ADMIN" && userId !== id) {
      return res.status(403).json({ 
        error: "No tienes permiso para editar este usuario" 
      });
    }

    if (!username || username.trim() === "") {
      return res.status(400).json({ 
        error: "El nombre de usuario es requerido" 
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const usernameExists = await prisma.user.findFirst({
      where: {
        username,
        id: { not: id }
      }
    });

    if (usernameExists) {
      return res.status(400).json({ 
        error: "El nombre de usuario ya está en uso" 
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { username },
      select: {
        id: true,
        username: true,
        role: true,
        isActive: true,
        updatedAt: true
      }
    });

    res.json({
      message: "Nombre de usuario actualizado exitosamente",
      user: updatedUser
    });

  } catch (error: any) {
    console.error("Error al actualizar usuario:", error);
    res.status(500).json({ 
      error: "Error al actualizar usuario",
      details: error.message 
    });
  }
};

// 4. BLOQUEAR USUARIO (solo admin)
export const blockUser = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id ?? "");

    if (isNaN(id)) {
      return res.status(400).json({ error: "ID inválido" });
    }

    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    if (user.role === "ADMIN") {
      return res.status(400).json({ 
        error: "No se puede bloquear a un administrador" 
      });
    }

    if (!user.isActive) {
      return res.status(400).json({ 
        error: "El usuario ya está bloqueado" 
      });
    }

    const blockedUser = await prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: {
        id: true,
        username: true,
        role: true,
        isActive: true
      }
    });

    res.json({
      message: "Usuario bloqueado exitosamente",
      user: blockedUser
    });

  } catch (error: any) {
    console.error("Error al bloquear usuario:", error);
    res.status(500).json({ 
      error: "Error al bloquear usuario",
      details: error.message 
    });
  }
};

// 5. DESBLOQUEAR USUARIO (solo admin)
export const unblockUser = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id ?? "");

    if (isNaN(id)) {
      return res.status(400).json({ error: "ID inválido" });
    }

    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    if (user.isActive) {
      return res.status(400).json({ 
        error: "El usuario ya está activo" 
      });
    }

    const unblockedUser = await prisma.user.update({
      where: { id },
      data: { isActive: true },
      select: {
        id: true,
        username: true,
        role: true,
        isActive: true
      }
    });

    res.json({
      message: "Usuario desbloqueado exitosamente",
      user: unblockedUser
    });

  } catch (error: any) {
    console.error("Error al desbloquear usuario:", error);
    res.status(500).json({ 
      error: "Error al desbloquear usuario",
      details: error.message 
    });
  }
};

// 6. ELIMINAR USUARIO (solo admin)
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id ?? "");

    if (isNaN(id)) {
      return res.status(400).json({ error: "ID inválido" });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: { records: true }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    if (user.role === "ADMIN") {
      return res.status(400).json({ 
        error: "No se puede eliminar a un administrador" 
      });
    }

    if (user._count.records > 0) {
      return res.status(400).json({ 
        error: `No se puede eliminar el usuario porque tiene ${user._count.records} registros asociados. Considera bloquearlo en su lugar.` 
      });
    }

    await prisma.user.delete({
      where: { id }
    });

    res.json({
      message: "Usuario eliminado exitosamente",
      deletedUser: {
        id: user.id,
        username: user.username
      }
    });

  } catch (error: any) {
    console.error("Error al eliminar usuario:", error);
    res.status(500).json({ 
      error: "Error al eliminar usuario",
      details: error.message 
    });
  }
};

// 7. OBTENER PERFIL DEL USUARIO AUTENTICADO
export const getMyProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { records: true }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json({
      message: "Perfil obtenido exitosamente",
      user
    });

  } catch (error: any) {
    console.error("Error al obtener perfil:", error);
    res.status(500).json({ 
      error: "Error al obtener perfil",
      details: error.message 
    });
  }
};