import { BrowserRouter, Routes, Route, Navigate  } from "react-router-dom";
import LoginForm from "../components/LoginForm";
import AdminDashboard from "../components/AdminDashboard";
import UserDashboard from "../components/UserDashboard";
import { useAuth } from "../context/UseAuth";
import type { JSX } from "react/jsx-dev-runtime";
import VehicleLogs from "../components/VehicleLogs";

function PrivateRoute({
  children,
  role,
}: {
  children: JSX.Element;
  role: "ADMIN" | "USER";
}) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/" replace />;
  if (user.role !== role) return <Navigate to="/" replace />;

  return children;
}



export default function AppRouter() {
  return (
     <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginForm />} />
       
        <Route
          path="/admin"
          element={
            <PrivateRoute role="ADMIN">
              <AdminDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/vehiculos"
          element={
            <PrivateRoute role="ADMIN">
              <VehicleLogs />
            </PrivateRoute>
          }
        />

        <Route
          path="/user"
          element={
            <PrivateRoute role="USER">
              <UserDashboard />
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
