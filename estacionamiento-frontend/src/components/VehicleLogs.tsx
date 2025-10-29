import React, { useState, useEffect } from "react";
import axios from "axios";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// ============================
// TIPOS Y VALIDACIÓN
// ============================
export const VehicleTypeConst = {
  NORMAL: "NORMAL",
  ESPECIAL: "ESPECIAL",
  MOTOCICLETA: "MOTOCICLETA",
} as const;

export type VehicleType = (typeof VehicleTypeConst)[keyof typeof VehicleTypeConst];

const vehicleSchema = z.object({
  plate: z
    .string()
    .min(1, "La placa es requerida")
    .regex(/^[A-Za-z]{3}\d{4}$/, "Formato inválido. Usa 3 letras seguidas de 4 números (ej: ABC1234)")
    .transform((s) => s.trim().toUpperCase()),
  type: z.enum(["NORMAL", "ESPECIAL", "MOTOCICLETA"]),
});

type VehicleFormValues = z.infer<typeof vehicleSchema>;

interface Vehicle {
  id: number;
  plate: string;
  type: VehicleType;
  totalVisits: number;
  currentStatus: "parked" | "not_parked";
  createdAt: string;
}

// ============================
// COMPONENTE
// ============================
const VehicleLogs: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [searchPlate, setSearchPlate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
    reset,
    watch,
  } = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
    mode: "onChange",
    defaultValues: { plate: "", type: "NORMAL" },
  });

  const plateValue = watch("plate");

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      
      if (!token) {
        setError("No hay sesión activa. Por favor inicia sesión.");
        setLoading(false);
        return;
      }
      
      const response = await axios.get("http://localhost:4000/api/vehicles/all", {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
      });

      setVehicles(response.data.vehicles || []);
    } catch (err: any) {
      console.error("Error al cargar vehículos:", err);
      const errorMsg = err?.response?.data?.error || "Error al cargar la lista de vehículos";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: VehicleFormValues) => {
    try {
      const token = localStorage.getItem("token");
      
      if (!token) {
        alert("No hay sesión activa. Por favor inicia sesión.");
        return;
      }
      
      const response = await axios.post("http://localhost:4000/api/vehicles/entry", data, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
      });
      
      alert(response.data?.message ?? "Entrada registrada correctamente");
      reset();
      await fetchVehicles();
    } catch (err: any) {
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        "Ocurrió un error al registrar la entrada";
      alert(`Error: ${msg}`);
      console.error("Error completo:", err.response?.data || err);
    }
  };

  const handleExit = async (plate: string) => {
    const confirmExit = window.confirm(
      `¿Registrar salida del vehículo ${plate}?`
    );

    if (!confirmExit) return;

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        alert("No hay sesión activa. Por favor inicia sesión.");
        return;
      }

      const response = await axios.post(
        "http://localhost:4000/api/vehicles/exit",
        { plate },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const { record } = response.data;

      const message = `
SALIDA REGISTRADA EXITOSAMENTE

Placa: ${record.plate}
Tipo: ${getVehicleTypeLabel(record.type)}

Entrada: ${new Date(record.entryTime).toLocaleString("es-HN")}
Salida: ${new Date(record.exitTime).toLocaleString("es-HN")}

Tiempo: ${record.duration.hours}h ${record.duration.minutes}min
Horas cobradas: ${record.hoursCharged}

TOTAL A PAGAR: $${record.totalFee.toFixed(2)} USD
      `.trim();

      alert(message);
      await fetchVehicles();
    } catch (err: any) {
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        "Ocurrió un error al registrar la salida";
      alert(`Error: ${msg}`);
      console.error("Error completo:", err.response?.data || err);
    }
  };

  const getVehicleTypeLabel = (type: VehicleType) => {
    const labels = {
      NORMAL: "Normal",
      ESPECIAL: "Especial",
      MOTOCICLETA: "Motocicleta",
    };
    return labels[type] || type;
  };

  const getVehicleTypeBadge = (type: VehicleType) => {
    const styles = {
      NORMAL: "bg-blue-100 text-blue-800",
      ESPECIAL: "bg-purple-100 text-purple-800",
      MOTOCICLETA: "bg-green-100 text-green-800",
    };
    return styles[type] || "bg-gray-100 text-gray-800";
  };

  const getStatusBadge = (status: string) => {
    return status === "parked"
      ? "bg-green-100 text-green-800"
      : "bg-gray-100 text-gray-600";
  };

  const getStatusLabel = (status: string) => {
    return status === "parked" ? "Estacionado" : "Fuera";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-HN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredVehicles = vehicles.filter((vehicle) =>
    vehicle.plate.toLowerCase().includes(searchPlate.toLowerCase())
  );

  const sortedVehicles = [...filteredVehicles].sort((a, b) => {
    if (a.currentStatus === "parked" && b.currentStatus !== "parked") {
      return -1;
    }
    if (a.currentStatus !== "parked" && b.currentStatus === "parked") {
      return 1;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className=" shadow-lg rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Registrar Entrada de Vehículo
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-medium mb-1">
                  Placa
                </label>
                <input
                  type="text"
                  {...register("plate")}
                  placeholder="ABC1234"
                  className={`w-full border rounded-lg p-2 focus:ring ${
                    errors.plate
                      ? "border-red-500 focus:ring-red-200"
                      : plateValue
                      ? "border-green-500 focus:ring-green-200"
                      : "border-gray-300 focus:ring-blue-200"
                  }`}
                />
                {errors.plate ? (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.plate.message}
                  </p>
                ) : plateValue ? (
                  <p className="mt-1 text-sm text-green-600">Formato válido</p>
                ) : (
                  <p className="mt-1 text-xs text-gray-500">
                    Formato: 3 letras + 4 números (ej: ABC1234)
                  </p>
                )}
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">
                  Tipo de vehículo
                </label>
                <select
                  {...register("type")}
                  className={`w-full border rounded-lg p-2 focus:ring ${
                    errors.type
                      ? "border-red-500 focus:ring-red-200"
                      : "border-gray-300 focus:ring-blue-200"
                  }`}
                >
                  <option value="NORMAL">Normal ($15/hora)</option>
                  <option value="ESPECIAL">Especial ($5/hora)</option>
                  <option value="MOTOCICLETA">Motocicleta (Gratis)</option>
                </select>
                {errors.type && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.type.message}
                  </p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="w-full bg-blue-600 text-white rounded-lg py-2 hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Registrando..." : "Registrar Entrada"}
            </button>
          </form>
        </div>

        <div className=" rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">
            Registro de Vehículos
          </h1>

          <div className="mb-6">
            <div className="relative">
              
              <input
                type="text"
                placeholder="Buscar por placa..."
                value={searchPlate}
                onChange={(e) => setSearchPlate(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5  placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              />
            </div>
          </div>

          {loading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-sm text-gray-600">
                Cargando vehículos...
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {!loading && !error && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Placa
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Visitas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha Registro
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className=" divide-y divide-gray-200">
                  {sortedVehicles.length > 0 ? (
                    sortedVehicles.map((vehicle) => (
                      <tr key={vehicle.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-900">
                            {vehicle.plate}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getVehicleTypeBadge(
                              vehicle.type
                            )}`}
                          >
                            {getVehicleTypeLabel(vehicle.type)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(
                              vehicle.currentStatus
                            )}`}
                          >
                            {getStatusLabel(vehicle.currentStatus)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {vehicle.totalVisits}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(vehicle.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {vehicle.currentStatus === "parked" ? (
                            <button
                              onClick={() => handleExit(vehicle.plate)}
                              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition"
                            >
                              Registrar Salida
                            </button>
                          ) : (
                            <span className="text-gray-400 italic">
                              No está estacionado
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-8 text-center text-sm text-gray-500"
                      >
                        {searchPlate
                          ? `No se encontraron vehículos con la placa "${searchPlate}"`
                          : "No hay vehículos registrados"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {!loading && !error && (
            <div className="mt-4 text-sm text-gray-600">
              Mostrando {sortedVehicles.length} de {vehicles.length} vehículos
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VehicleLogs;