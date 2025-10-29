import { Request, Response } from "express";
import prisma from "../prisma/client";

type VehicleType = "NORMAL" | "ESPECIAL" | "MOTOCICLETA";

// 1. REGISTRAR ENTRADA DE VEHÍCULO
export const registerEntry = async (req: Request, res: Response) => {
  try {
    const { plate, type } = req.body;
    const userId = (req as any).user.id;

    // Validaciones
    if (!plate || !type) {
      return res.status(400).json({ 
        error: "Placa y tipo de vehículo son requeridos" 
      });
    }

    // Validar tipo de vehículo
    const validTypes: VehicleType[] = ["NORMAL", "ESPECIAL", "MOTOCICLETA"];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ 
        error: "Tipo de vehículo inválido. Usa: NORMAL, ESPECIAL o MOTOCICLETA" 
      });
    }

    // Normalizar placa (mayúsculas, sin espacios)
    const normalizedPlate = plate.trim().toUpperCase();

    // Verificar si el vehículo ya está estacionado
    const activeParking = await prisma.parkingRecord.findFirst({
      where: {
        vehicle: { plate: normalizedPlate },
        exitTime: null
      },
      include: {
        vehicle: true
      }
    });

    if (activeParking) {
      return res.status(400).json({ 
        error: "Este vehículo ya está estacionado",
        details: {
          plate: activeParking.vehicle.plate,
          entryTime: activeParking.entryTime
        }
      });
    }

    // Buscar o crear vehículo
    let vehicle = await prisma.vehicle.findUnique({
      where: { plate: normalizedPlate }
    });

    if (!vehicle) {
      vehicle = await prisma.vehicle.create({
        data: {
          plate: normalizedPlate,
          type
        }
      });
    } else {
      // Actualizar tipo si cambió
      if (vehicle.type !== type) {
        vehicle = await prisma.vehicle.update({
          where: { id: vehicle.id },
          data: { type }
        });
      }
    }

    // Crear registro de entrada
    const parkingRecord = await prisma.parkingRecord.create({
      data: {
        vehicleId: vehicle.id,
        userId: userId,
        entryTime: new Date()
      },
      include: {
        vehicle: true,
        user: {
          select: {
            id: true,
            username: true
          }
        }
      }
    });

    console.log(`Entrada registrada: ${vehicle.plate} - ${vehicle.type}`);

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
    console.error("Error al registrar entrada:", error);
    res.status(500).json({ 
      error: "Error al registrar entrada",
      details: error.message 
    });
  }
};

// 2. REGISTRAR SALIDA DE VEHÍCULO Y CALCULAR COBRO
export const registerExit = async (req: Request, res: Response) => {
  try {
    const { plate } = req.body;

    if (!plate) {
      return res.status(400).json({ 
        error: "La placa es requerida" 
      });
    }

    const normalizedPlate = plate.trim().toUpperCase();

    // Buscar registro activo
    const activeRecord = await prisma.parkingRecord.findFirst({
      where: {
        vehicle: { plate: normalizedPlate },
        exitTime: null
      },
      include: {
        vehicle: true
      }
    });

    if (!activeRecord) {
      return res.status(404).json({ 
        error: "No se encontró un registro activo para este vehículo",
        plate: normalizedPlate
      });
    }

    // Calcular tiempo y cobro
    const exitTime = new Date();
    const entryTime = new Date(activeRecord.entryTime);
    const durationMs = exitTime.getTime() - entryTime.getTime();
    const durationMinutes = Math.floor(durationMs / (1000 * 60));
    const durationHours = Math.floor(durationMinutes / 60);
    const remainingMinutes = durationMinutes % 60;

    // Calcular horas a cobrar según reglas de negocio
    let hoursToCharge = durationHours;
    
    // Si hay minutos restantes, se cobra hora completa
    if (remainingMinutes > 0) {
      hoursToCharge += 1;
    }

    // Si el tiempo total es 0 horas (menos de 1 hora pero tiene minutos), cobrar 1 hora
    if (hoursToCharge === 0 && durationMinutes > 0) {
      hoursToCharge = 1;
    }

    // Calcular tarifa según tipo de vehículo
    let totalFee = 0;
    const vehicleType = activeRecord.vehicle.type;

    if (vehicleType === "MOTOCICLETA") {
      totalFee = 0; // Motocicletas están exentas
    } else if (vehicleType === "ESPECIAL") {
      totalFee = hoursToCharge * 5; // $5 USD por hora
    } else {
      totalFee = hoursToCharge * 15; // $15 USD por hora
    }

    // Actualizar registro con salida y cobro
    const updatedRecord = await prisma.parkingRecord.update({
      where: { id: activeRecord.id },
      data: {
        exitTime,
        totalFee
      },
      include: {
        vehicle: true,
        user: {
          select: {
            id: true,
            username: true
          }
        }
      }
    });

    console.log(`Salida registrada: ${activeRecord.vehicle.plate} - $${totalFee}`);

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
    console.error("Error al registrar salida:", error);
    res.status(500).json({ 
      error: "Error al registrar salida",
      details: error.message 
    });
  }
};

// 3. OBTENER VEHÍCULOS ACTUALMENTE ESTACIONADOS
export const getActiveVehicles = async (req: Request, res: Response) => {
  try {
    const activeRecords = await prisma.parkingRecord.findMany({
      where: {
        exitTime: null
      },
      include: {
        vehicle: true,
        user: {
          select: {
            id: true,
            username: true
          }
        }
      },
      orderBy: {
        entryTime: 'desc'
      }
    });

    // Calcular duración actual para cada vehículo
    const now = new Date();
    const vehiclesWithDuration = activeRecords.map(record => {
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
      message: "Vehículos activos obtenidos exitosamente",
      count: vehiclesWithDuration.length,
      vehicles: vehiclesWithDuration
    });

  } catch (error: any) {
    console.error("Error al obtener vehículos activos:", error);
    res.status(500).json({ 
      error: "Error al obtener vehículos activos",
      details: error.message 
    });
  }
};

// 4. OBTENER HISTORIAL COMPLETO DE REGISTROS
export const getParkingHistory = async (req: Request, res: Response) => {
  try {
    const { page = "1", limit = "10", startDate, endDate, plate, type } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Construir filtros
    const filters: any = {};

    if (startDate || endDate) {
      filters.entryTime = {};
      if (startDate) {
        filters.entryTime.gte = new Date(startDate as string);
      }
      if (endDate) {
        filters.entryTime.lte = new Date(endDate as string);
      }
    }

    if (plate) {
      filters.vehicle = {
        plate: {
          contains: (plate as string).toUpperCase()
        }
      };
    }

    if (type) {
      filters.vehicle = {
        ...filters.vehicle,
        type: type as VehicleType
      };
    }

    // Obtener registros con paginación
    const [records, total] = await Promise.all([
      prisma.parkingRecord.findMany({
        where: filters,
        include: {
          vehicle: true,
          user: {
            select: {
              id: true,
              username: true
            }
          }
        },
        orderBy: {
          entryTime: 'desc'
        },
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

        duration = {
          hours,
          minutes,
          totalMinutes: durationMinutes
        };
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
      message: "Historial obtenido exitosamente",
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      },
      records: formattedRecords
    });

  } catch (error: any) {
    console.error("Error al obtener historial:", error);
    res.status(500).json({ 
      error: "Error al obtener historial",
      details: error.message 
    });
  }
};

// 5. BUSCAR VEHÍCULO POR PLACA
export const getVehicleByPlate = async (req: Request, res: Response) => {
  try {
    const { plate } = req.params;

    if (!plate) {
      return res.status(400).json({ error: "La placa es requerida" });
    }

    const normalizedPlate = plate.trim().toUpperCase();

    const vehicle = await prisma.vehicle.findUnique({
      where: { plate: normalizedPlate },
      include: {
        records: {
          orderBy: {
            entryTime: 'desc'
          },
          take: 10, // Últimos 10 registros
          include: {
            user: {
              select: {
                id: true,
                username: true
              }
            }
          }
        }
      }
    });

    if (!vehicle) {
      return res.status(404).json({ 
        error: "Vehículo no encontrado",
        plate: normalizedPlate
      });
    }

    // Verificar si está actualmente estacionado
    const activeRecord = vehicle.records.find(r => r.exitTime === null);

    const formattedRecords = vehicle.records.map(record => {
      let duration: { hours: number; minutes: number; totalMinutes: number } | null = null;
      if (record.exitTime) {
        const entryTime = new Date(record.entryTime);
        const exitTime = new Date(record.exitTime);
        const durationMs = exitTime.getTime() - entryTime.getTime();
        const durationMinutes = Math.floor(durationMs / (1000 * 60));
        const hours = Math.floor(durationMinutes / 60);
        const minutes = durationMinutes % 60;

        duration  = {
          hours,
          minutes,
          totalMinutes: durationMinutes
        };
      }

      return {
        id: record.id,
        entryTime: record.entryTime,
        exitTime: record.exitTime,
        duration,
        totalFee: record.totalFee,
        registeredBy: record.user?.username,
        status: record.exitTime ? "completed" : "active"
      };
    });

    res.json({
      message: "Vehículo encontrado",
      vehicle: {
        id: vehicle.id,
        plate: vehicle.plate,
        type: vehicle.type,
        currentStatus: activeRecord ? "parked" : "not_parked",
        totalVisits: vehicle.records.length,
        recentRecords: formattedRecords
      }
    });

  } catch (error: any) {
    console.error("Error al buscar vehículo:", error);
    res.status(500).json({ 
      error: "Error al buscar vehículo",
      details: error.message 
    });
  }
};

// 6. OBTENER TODOS LOS VEHÍCULOS REGISTRADOS
export const getAllVehicles = async (req: Request, res: Response) => {
  try {
    const vehicles = await prisma.vehicle.findMany({
      include: {
        _count: {
          select: { records: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const vehiclesWithStatus = await Promise.all(
      vehicles.map(async (vehicle) => {
        const activeRecord = await prisma.parkingRecord.findFirst({
          where: {
            vehicleId: vehicle.id,
            exitTime: null
          }
        });

        return {
          id: vehicle.id,
          plate: vehicle.plate,
          type: vehicle.type,
          totalVisits: vehicle._count.records,
          currentStatus: activeRecord ? "parked" : "not_parked",
          createdAt: vehicle.createdAt
        };
      })
    );

    res.json({
      message: "Vehículos obtenidos exitosamente",
      count: vehiclesWithStatus.length,
      vehicles: vehiclesWithStatus
    });

  } catch (error: any) {
    console.error("Error al obtener vehículos:", error);
    res.status(500).json({ 
      error: "Error al obtener vehículos",
      details: error.message 
    });
  }
};

// 7. OBTENER ESTADÍSTICAS
export const getStatistics = async (req: Request, res: Response) => {
  try {
    const [
      totalVehicles,
      activeVehicles,
      totalRecords,
      completedRecords,
      totalRevenue
    ] = await Promise.all([
      prisma.vehicle.count(),
      prisma.parkingRecord.count({ where: { exitTime: null } }),
      prisma.parkingRecord.count(),
      prisma.parkingRecord.count({ where: { exitTime: { not: null } } }),
      prisma.parkingRecord.aggregate({
        where: { exitTime: { not: null } },
        _sum: { totalFee: true }
      })
    ]);

    // Estadísticas por tipo de vehículo
    const vehiclesByType = await prisma.vehicle.groupBy({
      by: ['type'],
      _count: true
    });

    res.json({
      message: "Estadísticas obtenidas exitosamente",
      statistics: {
        totalVehicles,
        activeVehicles,
        totalRecords,
        completedRecords,
        totalRevenue: totalRevenue._sum.totalFee || 0,
        vehiclesByType: vehiclesByType.map(v  => ({
          type: v.type,
          count: v._count
        }))
      }
    });

  } catch (error: any) {
    console.error("Error al obtener estadísticas:", error);
    res.status(500).json({ 
      error: "Error al obtener estadísticas",
      details: error.message 
    });
  }
};
