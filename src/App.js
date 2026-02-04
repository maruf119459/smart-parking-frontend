import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./AuthContext";
import Navbar from "./components/Navbar";

import Register from "./pages/Register";
import Login from "./pages/Login";
import Booking from "./pages/Booking";


import PrivateRoute from "./route/PrivateRoute";
import PublicRoute from "./route/PublicRoute";
import ForgotPassword from "./pages/ForgotPassword";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />

        <Routes>
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/forgot" element={<PublicRoute><ForgotPassword /></PublicRoute>} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}