import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./AuthContext";
import Navbar from "./components/Navbar";

import Register from "./pages/Register";
import Login from "./pages/Login";
import Booking from "./pages/Booking";

import PrivateRoute from "./route/PrivateRoute";
import PublicRoute from "./route/PublicRoute";
import ForgotPassword from "./pages/ForgotPassword";
import History from "./pages/History";
import Profile from "./pages/Profile";
import Home from "./pages/Home";

// Import your CSS file where you will put the styles below
import "./App.css"; 

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        {/* Outer container for the repeating background */}
        <div className="app-container">
          {/* Inner container for the white centered content */}
          <div className="main-content">
            <Navbar />

            <Routes>
              <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
              <Route path="/forgot" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
              <Route path="/" element={<Home />} />
              <Route path="/history" element={<PrivateRoute><History /></PrivateRoute>} />
              <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
              <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
              <Route path="/booking" element={<PrivateRoute><Booking /></PrivateRoute>} />
            </Routes>
          </div>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}