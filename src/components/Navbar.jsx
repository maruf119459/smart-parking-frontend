import { Link } from "react-router-dom";
import { useAuth } from "../AuthContext";
import logo from "../assets/loading_img.png";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="border-bottom py-2 bg-white">
      <div className="container d-flex justify-content-between align-items-center">
        <Link className="navbar-brand" to="/">
          <img src={logo} alt="Logo" height="35" />
        </Link>
        
        <div className="d-flex align-items-center gap-1">
          {!user ? (
            <>
              <Link className="nav-link-custom" to="/login">Login</Link>
              <Link className="nav-link-custom" to="/register">Sign up</Link>
            </>
          ) : (
            <>
              <Link className="nav-link-custom" to="/booking">Booking</Link>
              <Link className="nav-link-custom" to="/history">History</Link>
              <Link className="nav-link-custom" to="/profile">Profile</Link>
              <button className="nav-link-custom border-0 bg-transparent" onClick={logout}>
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}