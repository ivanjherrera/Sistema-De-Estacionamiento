# 🚗 Sistema de Control de Estacionamiento

> **Prueba técnica – CRUD completo con autenticación, control de vehículos y tarifas.**

---

## 🧾 Descripción General

Este proyecto implementa un sistema para **gestionar el control de entrada y salida de vehículos en un estacionamiento.**  
Incluye autenticación por roles, cálculo automático de tarifas, registro histórico y estadísticas.

El sistema fue desarrollado con **Node.js**, **Express**, **TypeScript**, **Prisma** y **PostgreSQL**, aplicando una **arquitectura limpia tipo MVC**, validaciones robustas y pruebas unitarias.

---

### 📌 Patrón aplicado
**MVC (Model–View–Controller)**

### 📌 Buenas prácticas
- Tipado estricto con TypeScript.  
- Validación de entrada con **Zod**.  
- Manejo centralizado de errores (`try/catch` + middlewares).  
- Uso de variables de entorno seguras (`.env`).  
- Código modular, mantenible y escalable.

---

## ⚙️ Tecnologías Principales

| Capa                    | Tecnología                     |
| ------------------------ | ------------------------------ |
| **Backend**             | Node.js + Express + TypeScript |
| **ORM / BD**            | Prisma ORM + PostgreSQL        |
| **Autenticación**       | JWT (JSON Web Token)           |
| **Validaciones**        | Zod                            |
| **Pruebas**             | Jest + Supertest               |
| **Frontend (opcional)** | React + TailwindCSS            |

---

## 🚀 Ejecución del Proyecto

### 1️⃣ Clonar el repositorio

```bash
git clone https://github.com/ivanjherrera/Sistema-De-Estacionamiento.git
cd Sistema-De-Estacionamiento
cd estacionamiento-backend
npm install
En una nueva consola:

bash
Copiar código
cd estacionamiento-frontend
npm install
2️⃣ Configurar variables de entorno
Copiar los archivos .env en sus respectivos directorios:

estacionamiento-backend/.env

estacionamiento-frontend/.env

Desde la carpeta del backend ejecutar:

bash
Copiar código
npx prisma migrate dev --name init
Esto inicializa Prisma y crea las tablas en la base de datos.

3️⃣ Ejecutar los servidores
Ejecutar ambos proyectos (backend y frontend):

bash
Copiar código
npm run dev
Backend: http://localhost:4000/

Frontend: http://localhost:5173/

📜 Scripts disponibles
Comando	Descripción
npm run dev	Ejecuta el servidor en modo desarrollo (nodemon / ts-node-dev).
npm run build	Compila TypeScript a JavaScript en dist/.
npm start	Inicia el servidor en producción.
npm test	Ejecuta las pruebas unitarias.
npx prisma migrate dev	Crea las tablas y aplica migraciones.
npx prisma studio	Abre el panel visual de la base de datos.

📡 Endpoints Principales (API CRUD)
🔐 Autenticación
Método	Endpoint	Descripción
POST	/api/auth/register	Registrar un nuevo usuario (admin).
POST	/api/auth/login	Iniciar sesión y obtener token JWT.

🚗 Vehículos
Método	Endpoint	Descripción
POST	/api/vehicles/entry	Registrar la entrada de un vehículo.
POST	/api/vehicles/exit	Registrar la salida y calcular el cobro.
GET	/api/vehicles/active	Obtener vehículos actualmente estacionados.
GET	/api/vehicles/history	Obtener historial completo de entradas/salidas.
GET	/api/vehicles/:plate	Buscar un vehículo por su placa.
GET	/api/vehicles	Listar todos los vehículos registrados.

💵 Reglas de negocio implementadas
Tarifa: $15 USD por hora.

Redondeo: siempre hacia arriba para fracciones ≥ 30 minutos.

Motocicletas: exentas de pago.

Vehículos especiales: $5 USD por hora.

Cálculo automático de tiempo y monto al registrar la salida.

🧪 Pruebas Unitarias
El proyecto incluye pruebas unitarias con Jest y Supertest.

📁 Archivo de ejemplo
bash
Copiar código
tests/vehicle.test.ts
🔍 Flujo probado
Registro de entrada (registerEntry)

Crea vehículo si no existe.

Crea registro de entrada (parkingRecord).

Devuelve respuesta 201 con datos del vehículo.

▶️ Ejecutar pruebas
Desde la carpeta del backend:

bash
Copiar código
npm test
🧱 Scripts de creación de tablas (Prisma)
prisma
Copiar código
// ==========================================
// Sistema de Control de Estacionamiento
// ==========================================

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ==========================================
// ENUMS
// ==========================================

enum Role {
  ADMIN
  USER
}

enum VehicleType {
  NORMAL
  ESPECIAL
  MOTOCICLETA
}

// ==========================================
// MODELOS PRINCIPALES
// ==========================================

model User {
  id        Int       @id @default(autoincrement())
  username  String    @unique
  password  String
  role      Role      @default(USER)
  isActive  Boolean   @default(true)
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  records   ParkingRecord[]
}

model Vehicle {
  id        Int             @id @default(autoincrement())
  plate     String          @unique
  type      VehicleType
  createdAt DateTime        @default(now())
  records   ParkingRecord[]
}

model ParkingRecord {
  id          Int       @id @default(autoincrement())
  entryTime   DateTime
  exitTime    DateTime?
  totalFee    Float?
  vehicleId   Int
  userId      Int?
  vehicle     Vehicle   @relation(fields: [vehicleId], references: [id])
  user        User?     @relation(fields: [userId], references: [id])
  createdAt   DateTime  @default(now())
}

📘 Autor:
Iván Herrera
Desarrollador Full Stack
