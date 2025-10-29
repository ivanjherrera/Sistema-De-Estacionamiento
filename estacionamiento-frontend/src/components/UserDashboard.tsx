import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { usernameSchema } from "../validation/usernameSchema";
import type { UsernameSchema } from "../validation/usernameSchema";
import { useAuth } from "../context/UseAuth";
import axios from "axios";
import "../output.css"

export default function UserDashboard() {
  const { user, logout, login } = useAuth();
  const [serverMessage, setServerMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("error");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<UsernameSchema>({
    resolver: zodResolver(usernameSchema),
    defaultValues: { username: user?.username || "" },
  });

  const onSubmit = async (data: UsernameSchema) => {
    if (!user) return;
    setServerMessage("");

    try {
      console.log("Actualizando username a:", data.username);
      console.log("User ID:", user.id);
      console.log("Token:", user.token);
      
      const res = await axios.patch(
        `http://localhost:4000/api/users/${user.id}`,
        { username: data.username },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Respuesta exitosa:", res.data);
      setServerMessage("Nombre de usuario actualizado correctamente");
      setMessageType("success");
      
      // Actualizar el contexto con el nuevo username
      login({
        ...user,
        username: data.username,
      });
      
      reset({ username: data.username });
    } catch (error: any) {
      console.error("Error completo:", error);
      console.error("Respuesta del servidor:", error?.response?.data);
      const errorMessage =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        "Error al actualizar el nombre de usuario";
      setServerMessage(errorMessage);
      setMessageType("error");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className=" p-8 rounded-2xl shadow-lg w-96">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-center mb-2">
            Panel de Usuario
          </h1>
        
         
        </div>

        <div className="border-t pt-6">
          <h2 className="text-lg font-semibold mb-4">
            Editar nombre de usuario
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium mb-1">
                Nuevo nombre de usuario
              </label>
              <input
                id="username"
                {...register("username")}
                placeholder="Ingresa tu nuevo nombre"
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="h-5 mt-1">
                {errors.username && (
                  <p className="text-red-500 text-sm">
                    {errors.username.message}
                  </p>
                )}
              </div>
            </div>

            {serverMessage && (
              <div
                className={`px-4 py-3 rounded ${
                  messageType === "success"
                    ? "bg-green-50 border border-green-200 text-green-700"
                    : "bg-red-50 border border-red-200 text-red-700"
                }`}
              >
                {serverMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full text-white py-2 rounded font-medium transition-colors ${
                isSubmitting
                  ? "bg-blue-300 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isSubmitting ? "Actualizando..." : "Actualizar"}
            </button>
          </form>
        </div>

        <div className="mt-6 pt-6 border-t">
          <button
            onClick={logout}
            className="w-full bg-red-500 text-white py-2 rounded hover:bg-red-600 transition font-medium"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}