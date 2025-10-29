import axios from "axios";

const API_URL = "http://localhost:4000/api";

interface CreateUserData {
  username: string;
  password: string;
  role: "ADMIN" | "USER";
}

// Obtener todos los usuarios
export const getUsers = async (token: string) => {
  const response = await axios.get(`${API_URL}/users`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data.users || response.data;
};

// Crear nuevo usuario
export const createUser = async (token: string, userData: CreateUserData) => {
  const response = await axios.post(`${API_URL}/users`, userData, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  return response.data;
};

// Eliminar usuario
export const deleteUser = async (token: string, userId: number) => {
  const response = await axios.delete(`${API_URL}/users/${userId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};