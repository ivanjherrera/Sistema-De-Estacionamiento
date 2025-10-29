import { z } from "zod";

export const usernameSchema = z.object({
  username: z
    .string()
    .min(3, "Debe tener al menos 3 caracteres")
    .max(20, "Máximo 20 caracteres")
    .regex(/^[a-zA-Z0-9_]+$/, "Solo letras, números y guiones bajos"),
});

export type UsernameSchema = z.infer<typeof usernameSchema>;
