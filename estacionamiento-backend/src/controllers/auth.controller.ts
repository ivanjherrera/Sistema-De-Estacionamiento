import type{ Request, Response } from "express";
import bcrypt from "bcryptjs";
import prisma from "../prisma/client.ts";
import { generateToken } from "../utils/generateToken.ts";

export const register = async (req: Request, res: Response) => {
  try {
    const { username, password, role } = req.body;

    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) return res.status(400).json({ message: "Usuario ya existe" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { username, password: hashedPassword, role },
    });

    res.status(201).json({ message: "Usuario creado", user });
  } catch (error) {
    res.status(500).json({ message: "Error en el servidor", error });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: "Credenciales incorrectas" });

    const token = generateToken({ id: user.id, role: user.role });

    res.json({
      message: "Inicio de sesión exitoso",
      token,
      user: { id: user.id, username: user.username, role: user.role },
    });
  } catch (error) {
    res.status(500).json({ message: "Error en el servidor", error });
  }
};
