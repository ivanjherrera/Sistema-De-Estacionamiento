import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "../pages/Login";


export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        
      </Routes>
    </BrowserRouter>
  );
}
