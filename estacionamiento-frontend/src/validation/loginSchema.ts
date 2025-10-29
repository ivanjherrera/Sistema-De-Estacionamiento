import { z } from "zod";

export const loginSchema = z.object({
  username: z
    .string()
    .min(4, "El nombre de usuario debe tener al menos 4 caracteres"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

export type LoginSchema = z.infer<typeof loginSchema>;
