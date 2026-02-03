import { Link } from "react-router-dom";
import { useAuth } from "../AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav style={{ textAlign: "center", marginBottom: "20px" }}>
      {!user && (
        <>
          <Link to="/login">Login</Link> |{" "}
          <Link to="/register">Create Account</Link> |{" "}
          <Link to="/qrcodedecode">QR Decode</Link>
        </>
      )}

      {user && (
        <>
          <Link to="/booking">Booking</Link> |{" "}
          <Link to="/history">History</Link> |{" "}
          <Link to="/profile">Profile</Link> |{" "}
          <button onClick={logout}>Logout</button>
        </>
      )}
    </nav>
  );
}
