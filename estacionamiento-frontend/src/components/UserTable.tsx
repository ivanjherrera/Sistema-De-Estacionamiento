import { useState, useEffect } from "react";
import axios from "axios";
import { getUsers, deleteUser } from "../api/users";
import { useAuth } from "../context/UseAuth";

interface User {
  id: number;
  username: string;
  role: string;
  isActive: boolean;
}

export default function UserTable() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadUsers = async () => {
    if (!user) return;
    try {
      const data = await getUsers(user.token);
      
      // Verificar si la respuesta es un array o un objeto con propiedad users/data
      if (Array.isArray(data)) {
        setUsers(data);
      } else if (data && Array.isArray(data.users)) {
        setUsers(data.users);
      } else if (data && Array.isArray(data.data)) {
        setUsers(data.data);
      } else {
        console.error("Formato de respuesta inesperado:", data);
        setUsers([]);
        setError("Formato de datos no válido");
      }
    } catch (err) {
      console.error("Error al cargar usuarios:", err);
      setError("Error al cargar usuarios");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBlock = async (id: number) => {
    if (!user) return;
    try {
      const targetUser = users.find(u => u.id === id);
      if (!targetUser) return;

      const endpoint = targetUser.isActive
        ? `http://localhost:4000/api/users/${id}/block`
        : `http://localhost:4000/api/users/${id}/unblock`;

      await axios.patch(
        endpoint,
        {},
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );
      alert("Exito al cambiar estado del usuario");
      loadUsers();
    } catch (err) {
      console.error("Error al cambiar estado del usuario:", err);
      alert("Error al cambiar estado del usuario");
    }
  };

  const handleDelete = async (id: number) => {
    if (!user) return;
    if (confirm("¿Seguro que deseas eliminar este usuario?")) {
      try {
        await deleteUser(user.token, id);
        loadUsers();
      } catch (err) {
        console.error("Error al eliminar usuario:", err);
        alert("Error al eliminar usuario");
      }
    }
  };

  useEffect(() => {
    loadUsers();
  }, [user]);

  if (loading) return <p>Cargando usuarios...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <table className="w-full border-collapse border border-gray-300 mt-6">
      <thead>
        <tr className="bg-gray-100">
          <th className="border p-2">ID</th>
          <th className="border p-2">Usuario</th>
          <th className="border p-2">Rol</th>
          <th className="border p-2">Estado</th>
          <th className="border p-2">Acciones</th>
        </tr>
      </thead>
      <tbody>
        {users.length === 0 ? (
          <tr>
            <td colSpan={5} className="border p-4 text-center text-gray-500">
              No hay usuarios para mostrar
            </td>
          </tr>
        ) : (
          users.map((u) => (
            <tr key={u.id}>
              <td className="border p-2 text-center">{u.id}</td>
              <td className="border p-2">{u.username}</td>
              <td className="border p-2 text-center">{u.role}</td>
              <td className="border p-2 text-center">
                {u.isActive ? "Activo" : "Bloqueado"}
              </td>
              <td className="border p-2 flex justify-center gap-2">
                <button
                  onClick={() => handleBlock(u.id)}
                  className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                >
                  {u.isActive ? "Bloquear" : "Desbloquear"}
                </button>
                <button
                  onClick={() => handleDelete(u.id)}
                  className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}