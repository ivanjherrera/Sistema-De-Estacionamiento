import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

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
