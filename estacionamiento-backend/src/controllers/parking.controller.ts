import { Request, Response } from "express";
import prisma from "../prisma/client";

type VehicleType = "NORMAL" | "ESPECIAL" | "MOTOCICLETA";

// 1. CREAR REGISTRO DE PARKING (ENTRADA)
export const createParkingRecord = async (req: Request, res: Response) => {
  try {
    const { plate, type } = req.body;
    const userId = (req as any).user.id;

    if (!plate || !type) {
      return res.status(400).json({ 
        error: "Placa y tipo de vehículo son requeridos" 
      });
    }

    const validTypes: VehicleType[] = ["NORMAL", "ESPECIAL", "MOTOCICLETA"];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ 
        error: "Tipo de vehículo inválido. Usa: NORMAL, ESPECIAL o MOTOCICLETA" 
      });
    }

    const normalizedPlate = plate.trim().toUpperCase();

    // Verificar si ya está estacionado
    const activeParking = await prisma.parkingRecord.findFirst({
      where: {
        vehicle: { plate: normalizedPlate },
        exitTime: null
      }
    });

    if (activeParking) {
      return res.status(400).json({ 
        error: "Este vehículo ya está estacionado" 
      });
    }

    // Buscar o crear vehículo
    let vehicle = await prisma.vehicle.findUnique({
      where: { plate: normalizedPlate }
    });

    if (!vehicle) {
      vehicle = await prisma.vehicle.create({
        data: { plate: normalizedPlate, type }
      });
    } else if (vehicle.type !== type) {
      vehicle = await prisma.vehicle.update({
        where: { id: vehicle.id },
        data: { type }
      });
    }

    // Crear registro
    const parkingRecord = await prisma.parkingRecord.create({
      data: {
        vehicleId: vehicle.id,
        userId: userId,
        entryTime: new Date()
      },
      include: {
        vehicle: true,
        user: {
          select: { id: true, username: true }
        }
      }
    });

    console.log(`Entrada registrada: ${vehicle.plate}`);

    res.status(201).json({
      message: "Entrada registrada exitosamente",
      record: {
        id: parkingRecord.id,
        plate: vehicle.plate,
        type: vehicle.type,
        entryTime: parkingRecord.entryTime,
        registeredBy: parkingRecord.user?.username
      }
    });

  } catch (error: any) {
    console.error("Error al crear registro:", error);
    res.status(500).json({ 
      error: "Error al crear registro de parking",
      details: error.message 
    });
  }
};

// 2. FINALIZAR REGISTRO DE PARKING (SALIDA)
export const finalizeParkingRecord = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const recordId = parseInt(id ?? "");

    if (isNaN(recordId)) {
      return res.status(400).json({ error: "ID inválido" });
    }

    const record = await prisma.parkingRecord.findUnique({
      where: { id: recordId },
      include: { vehicle: true }
    });

    if (!record) {
      return res.status(404).json({ error: "Registro no encontrado" });
    }

    if (record.exitTime) {
      return res.status(400).json({ 
        error: "Este registro ya tiene una salida registrada" 
      });
    }

    // Calcular cobro
    const exitTime = new Date();
    const entryTime = new Date(record.entryTime);
    const durationMs = exitTime.getTime() - entryTime.getTime();
    const durationMinutes = Math.floor(durationMs / (1000 * 60));
    const durationHours = Math.floor(durationMinutes / 60);
    const remainingMinutes = durationMinutes % 60;

    let hoursToCharge = durationHours;
    if (remainingMinutes > 0) {
      hoursToCharge += 1;
    }
    if (hoursToCharge === 0 && durationMinutes > 0) {
      hoursToCharge = 1;
    }

    let totalFee = 0;
    const vehicleType = record.vehicle.type;

    if (vehicleType === "MOTOCICLETA") {
      totalFee = 0;
    } else if (vehicleType === "ESPECIAL") {
      totalFee = hoursToCharge * 5;
    } else {
      totalFee = hoursToCharge * 15;
    }

    // Actualizar registro
    const updatedRecord = await prisma.parkingRecord.update({
      where: { id: recordId },
      data: { exitTime, totalFee },
      include: {
        vehicle: true,
        user: {
          select: { id: true, username: true }
        }
      }
    });

    console.log(`Salida registrada: ${record.vehicle.plate} - $${totalFee}`);

    res.json({
      message: "Salida registrada exitosamente",
      record: {
        id: updatedRecord.id,
        plate: updatedRecord.vehicle.plate,
        type: updatedRecord.vehicle.type,
        entryTime: updatedRecord.entryTime,
        exitTime: updatedRecord.exitTime,
        duration: {
          hours: durationHours,
          minutes: remainingMinutes,
          totalMinutes: durationMinutes
        },
        hoursCharged: hoursToCharge,
        totalFee: totalFee,
        registeredBy: updatedRecord.user?.username
      }
    });

  } catch (error: any) {
    console.error("Error al finalizar registro:", error);
    res.status(500).json({ 
      error: "Error al finalizar registro",
      details: error.message 
    });
  }
};

// 3. OBTENER TODOS LOS REGISTROS DE PARKING
export const getAllParkingRecords = async (req: Request, res: Response) => {
  try {
    const { page = "1", limit = "20", status, startDate, endDate } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const filters: any = {};

    // Filtro por estado
    if (status === "active") {
      filters.exitTime = null;
    } else if (status === "completed") {
      filters.exitTime = { not: null };
    }

    // Filtro por fechas
    if (startDate || endDate) {
      filters.entryTime = {};
      if (startDate) {
        filters.entryTime.gte = new Date(startDate as string);
      }
      if (endDate) {
        filters.entryTime.lte = new Date(endDate as string);
      }
    }

    const [records, total] = await Promise.all([
      prisma.parkingRecord.findMany({
        where: filters,
        include: {
          vehicle: true,
          user: {
            select: { id: true, username: true }
          }
        },
        orderBy: { entryTime: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.parkingRecord.count({ where: filters })
    ]);

    const formattedRecords = records.map(record => {
      let duration: { hours: number; minutes: number; totalMinutes: number } | null = null;
      
      if (record.exitTime) {
        const entryTime = new Date(record.entryTime);
        const exitTime = new Date(record.exitTime);
        const durationMs = exitTime.getTime() - entryTime.getTime();
        const durationMinutes = Math.floor(durationMs / (1000 * 60));
        const hours = Math.floor(durationMinutes / 60);
        const minutes = durationMinutes % 60;

        duration = { hours, minutes, totalMinutes: durationMinutes };
      } else {
        // Calcular duración actual para registros activos
        const entryTime = new Date(record.entryTime);
        const now = new Date();
        const durationMs = now.getTime() - entryTime.getTime();
        const durationMinutes = Math.floor(durationMs / (1000 * 60));
        const hours = Math.floor(durationMinutes / 60);
        const minutes = durationMinutes % 60;

        duration = { hours, minutes, totalMinutes: durationMinutes };
      }

      return {
        id: record.id,
        plate: record.vehicle.plate,
        type: record.vehicle.type,
        entryTime: record.entryTime,
        exitTime: record.exitTime,
        duration,
        totalFee: record.totalFee,
        registeredBy: record.user?.username,
        status: record.exitTime ? "completed" : "active"
      };
    });

    res.json({
      message: "Registros obtenidos exitosamente",
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      },
      records: formattedRecords
    });

  } catch (error: any) {
    console.error("Error al obtener registros:", error);
    res.status(500).json({ 
      error: "Error al obtener registros",
      details: error.message 
    });
  }
};

// 4. OBTENER UN REGISTRO POR ID
export const getParkingRecordById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const recordId = parseInt(id ?? "");

    if (isNaN(recordId)) {
      return res.status(400).json({ error: "ID inválido" });
    }

    const record = await prisma.parkingRecord.findUnique({
      where: { id: recordId },
      include: {
        vehicle: true,
        user: {
          select: { id: true, username: true }
        }
      }
    });

    if (!record) {
      return res.status(404).json({ error: "Registro no encontrado" });
    }

    let duration: { hours: number; minutes: number; totalMinutes: number } | null = null;
    
    if (record.exitTime) {
      const entryTime = new Date(record.entryTime);
      const exitTime = new Date(record.exitTime);
      const durationMs = exitTime.getTime() - entryTime.getTime();
      const durationMinutes = Math.floor(durationMs / (1000 * 60));
      const hours = Math.floor(durationMinutes / 60);
      const minutes = durationMinutes % 60;

      duration = { hours, minutes, totalMinutes: durationMinutes };
    } else {
      const entryTime = new Date(record.entryTime);
      const now = new Date();
      const durationMs = now.getTime() - entryTime.getTime();
      const durationMinutes = Math.floor(durationMs / (1000 * 60));
      const hours = Math.floor(durationMinutes / 60);
      const minutes = durationMinutes % 60;

      duration = { hours, minutes, totalMinutes: durationMinutes };
    }

    res.json({
      message: "Registro encontrado",
      record: {
        id: record.id,
        plate: record.vehicle.plate,
        type: record.vehicle.type,
        entryTime: record.entryTime,
        exitTime: record.exitTime,
        duration,
        totalFee: record.totalFee,
        registeredBy: record.user?.username,
        status: record.exitTime ? "completed" : "active"
      }
    });

  } catch (error: any) {
    console.error("Error al obtener registro:", error);
    res.status(500).json({ 
      error: "Error al obtener registro",
      details: error.message 
    });
  }
};

// 5. OBTENER REGISTROS ACTIVOS (VEHÍCULOS ESTACIONADOS)
export const getActiveRecords = async (req: Request, res: Response) => {
  try {
    const activeRecords = await prisma.parkingRecord.findMany({
      where: { exitTime: null },
      include: {
        vehicle: true,
        user: {
          select: { id: true, username: true }
        }
      },
      orderBy: { entryTime: 'desc' }
    });

    const now = new Date();
    const formattedRecords = activeRecords.map(record => {
      const entryTime = new Date(record.entryTime);
      const durationMs = now.getTime() - entryTime.getTime();
      const durationMinutes = Math.floor(durationMs / (1000 * 60));
      const hours = Math.floor(durationMinutes / 60);
      const minutes = durationMinutes % 60;

      return {
        id: record.id,
        plate: record.vehicle.plate,
        type: record.vehicle.type,
        entryTime: record.entryTime,
        duration: {
          hours,
          minutes,
          totalMinutes: durationMinutes
        },
        registeredBy: record.user?.username
      };
    });

    res.json({
      message: "Registros activos obtenidos exitosamente",
      count: formattedRecords.length,
      records: formattedRecords
    });

  } catch (error: any) {
    console.error("Error al obtener registros activos:", error);
    res.status(500).json({ 
      error: "Error al obtener registros activos",
      details: error.message 
    });
  }
};

// 6. ELIMINAR REGISTRO (solo admin)
export const deleteParkingRecord = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const recordId = parseInt(id ?? "");

    if (isNaN(recordId)) {
      return res.status(400).json({ error: "ID inválido" });
    }

    const record = await prisma.parkingRecord.findUnique({
      where: { id: recordId },
      include: { vehicle: true }
    });

    if (!record) {
      return res.status(404).json({ error: "Registro no encontrado" });
    }

    await prisma.parkingRecord.delete({
      where: { id: recordId }
    });

    console.log(`Registro eliminado: ID ${recordId}`);

    res.json({
      message: "Registro eliminado exitosamente",
      deletedRecord: {
        id: record.id,
        plate: record.vehicle.plate
      }
    });

  } catch (error: any) {
    console.error("Error al eliminar registro:", error);
    res.status(500).json({ 
      error: "Error al eliminar registro",
      details: error.message 
    });
  }
};

// 7. OBTENER REPORTE DE INGRESOS (solo admin)
export const getRevenueReport = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const filters: any = { exitTime: { not: null } };

    if (startDate || endDate) {
      filters.entryTime = {};
      if (startDate) {
        filters.entryTime.gte = new Date(startDate as string);
      }
      if (endDate) {
        filters.entryTime.lte = new Date(endDate as string);
      }
    }

    const [totalRevenue, recordsByType] = await Promise.all([
      prisma.parkingRecord.aggregate({
        where: filters,
        _sum: { totalFee: true },
        _count: true
      }),
      prisma.parkingRecord.groupBy({
        by: ['vehicleId'],
        where: filters,
        _sum: { totalFee: true },
        _count: true
      })
    ]);

    // Obtener detalles de vehículos
    const vehicleIds = recordsByType.map(r => r.vehicleId);
    const vehicles = await prisma.vehicle.findMany({
      where: { id: { in: vehicleIds } }
    });

    const revenueByType = {
      NORMAL: 0,
      ESPECIAL: 0,
      MOTOCICLETA: 0
    };

    recordsByType.forEach(record => {
      const vehicle = vehicles.find(v => v.id === record.vehicleId);
      if (vehicle) {
        revenueByType[vehicle.type] += record._sum.totalFee || 0;
      }
    });

    res.json({
      message: "Reporte de ingresos generado",
      report: {
        totalRevenue: totalRevenue._sum.totalFee || 0,
        totalRecords: totalRevenue._count,
        revenueByType,
        period: {
          startDate: startDate || "Inicio",
          endDate: endDate || "Ahora"
        }
      }
    });

  } catch (error: any) {
    console.error("Error al generar reporte:", error);
    res.status(500).json({ 
      error: "Error al generar reporte de ingresos",
      details: error.message 
    });
  }
};