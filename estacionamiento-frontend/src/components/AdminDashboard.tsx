import { useAuth } from "../context/UseAuth";
import { useNavigate } from "react-router-dom";
import CreateUserForm from "./CreateUserForm";
import UserTable from "./UserTable";
import "../output.css"

export default function AdminDashboard() {
  const { logout } = useAuth();
    const navigate = useNavigate();

  const handleUserCreated = () => {
    // Recargar la página o forzar actualización de la tabla
    window.location.reload();
  };

  return (
    <div className="p-10 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Panel de Administración</h1>
        <button
            onClick={() => navigate("/admin/vehiculos")}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
          >
            Gestión de Estacionamiento
          </button>
        <button
          onClick={logout}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Cerrar sesión
        </button>
      </div>

      {/* Formulario de creación de usuario */}
      <div className="mb-8">
        <CreateUserForm onCreated={handleUserCreated} />
      </div>

      {/* Tabla de usuarios */}
      <div className=" p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">Lista de Usuarios</h2>
        <UserTable />
      </div>
    </div>
  );
}