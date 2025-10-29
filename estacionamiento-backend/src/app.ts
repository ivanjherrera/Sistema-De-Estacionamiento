import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import vehicleRoutes from "./routes/vehicle.routes";
import parkingRoutes from "./routes/parking.routes";

dotenv.config();

const app = express();

// Middlewares
app.use(cors({
  origin: 'http://localhost:5173', 
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ruta de prueba raíz
app.get("/", (req, res) => {
  res.json({ message: "API del sistema de estacionamiento funcionando " });
});

// Ruta de prueba API
app.get("/api/test", (req, res) => {
  res.json({ message: "Ruta API funcionando" });
});

// Rutas de autenticación
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/parking", parkingRoutes);

// Manejo de rutas no encontradas (404)
app.use((req, res) => {
  res.status(404).json({ 
    error: "Ruta no encontrada",
    path: req.path,
    method: req.method
  });
});




export default app;