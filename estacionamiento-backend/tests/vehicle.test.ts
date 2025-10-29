import request from "supertest";
import express from "express";
import { registerEntry } from "../src/controllers/vehicle.controller";
import prisma from "../src/prisma/client";

// Simulamos middleware de auth
const mockUser = { id: 1 };
const app = express();
app.use(express.json());
app.post("/api/vehicles/entry", (req, res, next) => {
  (req as any).user = mockUser;
  next();
}, registerEntry);

jest.mock("../src/prisma/client", () => ({
  parkingRecord: {
    findFirst: jest.fn(),
    create: jest.fn(),
  },
  vehicle: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
}));

describe("Controlador de Vehículos", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("debe registrar correctamente la entrada de un nuevo vehículo", async () => {
    (prisma.parkingRecord.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.vehicle.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.vehicle.create as jest.Mock).mockResolvedValue({
      id: 10,
      plate: "ABC1234",
      type: "NORMAL",
    });
    (prisma.parkingRecord.create as jest.Mock).mockResolvedValue({
      id: 1,
      entryTime: new Date(),
      vehicle: { plate: "ABC1234", type: "NORMAL" },
      user: { username: "guard1" },
    });

    const response = await request(app)
      .post("/api/vehicles/entry")
      .send({ plate: "ABC1234", type: "NORMAL" });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe("Entrada registrada exitosamente");
    expect(response.body.record.plate).toBe("ABC1234");

    // Verificamos que Prisma haya sido llamado correctamente
    expect(prisma.vehicle.create).toHaveBeenCalledWith({
      data: { plate: "ABC1234", type: "NORMAL" },
    });
    expect(prisma.parkingRecord.create).toHaveBeenCalled();
  });
});
