import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import prisma from "../prisma/client";


export interface AuthRequest extends Request {
  user?: any;
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ message: "Token requerido" });

  const token = header.split(" ")[1];
  const secret = process.env.JWT_SECRET || "supersecretkey";

  try {
    const decoded = jwt.verify(token ?? "Default", secret);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: "Token inválido o expirado" });
  }
}


// USER
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        username: string;
        role: "ADMIN" | "USER";
      };
    }
  }
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ 
        error: "Token no proporcionado. Inicia sesión primero." 
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ 
        error: "Formato de token inválido" 
      });
    }

    const secret = process.env.JWT_SECRET || "tu_secreto_super_seguro";
    const decoded = jwt.verify(token, secret) as {
      id: number;
      role: "ADMIN" | "USER";
    };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        username: true,
        role: true,
        isActive: true
      }
    });

    if (!user) {
      return res.status(401).json({ 
        error: "Usuario no encontrado" 
      });
    }

    if (!user.isActive) {
      return res.status(403).json({ 
        error: "Tu cuenta ha sido bloqueada. Contacta al administrador." 
      });
    }

    req.user = {
      id: user.id,
      username: user.username,
      role: user.role
    };

    next();

  } catch (error: any) {
    console.error("❌ Error en authMiddleware:", error.message);

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ 
        error: "Token expirado. Por favor inicia sesión nuevamente." 
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ 
        error: "Token inválido" 
      });
    }

    return res.status(500).json({ 
      error: "Error al verificar autenticación" 
    });
  }
};

export const adminMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user || req.user.role !== "ADMIN") {
      return res.status(403).json({ 
        error: "Acceso denegado. Solo administradores pueden realizar esta acción." 
      });
    }

    next();

  } catch (error: any) {
    console.error("❌ Error en adminMiddleware:", error);
    return res.status(500).json({ 
      error: "Error al verificar permisos de administrador" 
    });
  }
};

