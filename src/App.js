import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./AuthContext";
import Navbar from "./components/Navbar";

import Register from "./pages/Register";

import PrivateRoute from "./route/PrivateRoute";
import PublicRoute from "./route/PublicRoute";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />

        <Routes>
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />-
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}