import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axios from "axios";
import { useAuth } from "../context/UseAuth";

// Schema de validación con Zod
const createUserSchema = z.object({
  username: z
    .string()
    .min(3, "El usuario debe tener al menos 3 caracteres")
    .max(50, "El usuario no puede exceder 50 caracteres")
    .regex(/^[a-zA-Z0-9_]+$/, "Solo se permiten letras, números y guiones bajos"),
  password: z
    .string()
    .min(6, "La contraseña debe tener al menos 6 caracteres")
    .max(100, "La contraseña no puede exceder 100 caracteres"),
  role: z.enum(["ADMIN", "USER"], {
    message: "Selecciona un rol válido",
  }),
});

type CreateUserFormData = z.infer<typeof createUserSchema>;

interface CreateUserFormProps {
  onCreated: () => void;
}

export default function CreateUserForm({ onCreated }: CreateUserFormProps) {
  const { user } = useAuth();
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    mode: "onChange", // Valida mientras escribe
    defaultValues: {
      username: "",
      password: "",
      role: "USER",
    },
  });

  const onSubmit = async (data: CreateUserFormData) => {
    if (!user) return;

    setSubmitError("");
    setSubmitSuccess("");

    try {
      console.log("Enviando datos de nuevo usuario:", data);
      const res = await axios.post("http://localhost:4000/api/auth/register", data, {
        headers: {
          Authorization: `Bearer ${user.token}`,
          "Content-Type": "application/json",
        },
      });
      console.log("Respuesta exitosa:", res.data);
      
      setSubmitSuccess("Usuario creado exitosamente");
      reset();
      setTimeout(() => {
        setSubmitSuccess("");
        onCreated();
      }, 1500);
    } catch (error: any) {
      console.error("Error al crear usuario:", error);
      const errorMessage =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        "Error al crear el usuario";
      setSubmitError(errorMessage);
    }
  };

  return (
    <div className=" p-6 rounded-lg shadow-md max-w-md">
      <h2 className="text-2xl font-bold mb-4">Crear Nuevo Usuario</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Campo Username */}
        <div>
          <label htmlFor="username" className="block text-sm font-medium mb-1">
            Usuario
          </label>
          <input
            id="username"
            type="text"
            {...register("username")}
            className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 ${
              errors.username
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:ring-blue-500"
            }`}
            placeholder="Ingresa el nombre de usuario"
          />
          <div className="h-5 mt-1">
            {errors.username && (
              <p className="text-red-500 text-sm">{errors.username.message}</p>
            )}
          </div>
        </div>

        {/* Campo Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            {...register("password")}
            className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 ${
              errors.password
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:ring-blue-500"
            }`}
            placeholder="Ingresa la contraseña"
          />
          <div className="h-5 mt-1">
            {errors.password && (
              <p className="text-red-500 text-sm">{errors.password.message}</p>
            )}
          </div>
        </div>

        {/* Campo Role */}
        <div>
          <label htmlFor="role" className="block text-sm font-medium mb-1">
            Rol
          </label>
          <select
            id="role"
            {...register("role")}
            className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 ${
              errors.role
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:ring-blue-500"
            }`}
          >
            <option value="USER">Usuario</option>
            <option value="ADMIN">Administrador</option>
          </select>
          <div className="h-5 mt-1">
            {errors.role && (
              <p className="text-red-500 text-sm">{errors.role.message}</p>
            )}
          </div>
        </div>

        {/* Mensajes de error/éxito del servidor */}
        {submitError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {submitError}
          </div>
        )}

        {submitSuccess && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            {submitSuccess}
          </div>
        )}

        {/* Botón Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full text-white px-4 py-2 rounded font-medium transition-colors ${
            isSubmitting
              ? "bg-blue-300 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-600"
          }`}
        >
          {isSubmitting ? "Creando..." : "Crear Usuario"}
        </button>
      </form>
    </div>
  );
}