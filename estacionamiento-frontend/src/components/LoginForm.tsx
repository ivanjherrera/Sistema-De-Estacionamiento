import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "../validation/loginSchema";
import type { LoginSchema } from "../validation/loginSchema";
import axios from "axios";
import { useAuth } from "../context/UseAuth";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import "../output.css"

export default function LoginForm() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
  });

  const onSubmit = async (data: LoginSchema) => {
    setServerError("");

    try {
      console.log("Enviando datos de inicio de sesión:", data);
      const res = await axios.post("http://localhost:4000/api/auth/login", data);
      console.log("Respuesta exitosa:", res.data);
      
      const { token, user: userInfo } = res.data;
      
      // 🔥 SOLUCIÓN: Guardar el token en localStorage AQUÍ
      localStorage.setItem("token", token);
      
      const userData = {
        id: userInfo.id,
        username: userInfo.username,
        role: userInfo.role,
        token: token
      };
      
      login(userData);
      console.log("Usuario logueado:", userData.username);
      console.log("Token guardado en localStorage:", token);
      
      if (userData.role === "ADMIN") {
        navigate("/admin");
      } else {
        navigate("/user");
      }
    } catch (error: any) {
      setServerError(
        error.response?.data?.message || "Error en las credenciales"
      );
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="p-8 rounded-2xl shadow-lg w-80"
      >
        <h2 className="text-2xl font-bold mb-6 text-center">Iniciar Sesión</h2>

        <div className="mb-4">
          <input
            {...register("username")}
            placeholder="Usuario"
            className="w-full p-2 border rounded"
          />
          {errors.username && (
            <p className="text-sm text-red-500 mt-1">
              {errors.username.message}
            </p>
          )}
        </div>

        <div className="mb-4">
          <input
            {...register("password")}
            type="password"
            placeholder="Contraseña"
            className="w-full p-2 border rounded"
          />
          {errors.password && (
            <p className="text-sm text-red-500 mt-1">
              {errors.password.message}
            </p>
          )}
        </div>

        {serverError && (
          <p className="text-red-500 text-sm mb-3">{serverError}</p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
        >
          {isSubmitting ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}