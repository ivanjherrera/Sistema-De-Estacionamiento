import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes"; // Importar rutas específicas

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ruta de prueba raíz
app.get("/", (req, res) => {
  res.json({ message: "API del sistema de estacionamiento funcionando 🚗" });
});

// Ruta de prueba API
app.get("/api/test", (req, res) => {
  res.json({ message: "Ruta API funcionando ✅" });
});

// Rutas de autenticación
app.use("/api/auth", authRoutes);

// Manejo de rutas no encontradas (404)
app.use((req, res) => {
  res.status(404).json({ 
    error: "Ruta no encontrada 🚫",
    path: req.path,
    method: req.method
  });
});

// Manejo de errores
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Error:", err);
  res.status(500).json({ 
    error: "Error interno del servidor",
    details: err.message 
  });
});

export default app;