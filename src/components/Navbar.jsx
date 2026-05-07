import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext"; // Adjusted path to your context
import { 
  Menu, X, LogOut, Home, 
  CalendarCheck, History, User, 
  LogIn, UserPlus, QrCode
} from "lucide-react";
import logo from "../assets/loading_img.png";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
    setIsOpen(false);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navLinkStyle = "nav-item-custom text-decoration-none px-3 py-2 d-flex align-items-center gap-2";

  return (
    <>
      <nav className="navbar-fixed-top shadow-sm border-bottom bg-white w-100" ref={menuRef}>
        <div className="container-fluid d-flex justify-content-between align-items-center px-3 px-md-4 py-2">
          
          {/* LEFT SIDE: Logo */}
          <div className="navbar-logo">
            <Link className="navbar-brand" to="/" onClick={() => setIsOpen(false)}>
              <img src={logo} alt="Logo" height="35" />
            </Link>
          </div>

          {/* RIGHT SIDE: Navigation Options */}
          <div className="d-flex align-items-center">
            {user ? (
              <>
                {/* Desktop Nav Links */}
                <div className="d-none d-md-flex align-items-center gap-2">
                  <Link to="/" className={navLinkStyle}><Home size={18} /> Home</Link>
                  <Link to="/booking" className={navLinkStyle}><CalendarCheck size={18} /> Booking</Link>
                  <Link to="/history" className={navLinkStyle}><History size={18} /> History</Link>
                  <Link to="/profile" className={navLinkStyle}><User size={18} /> Profile</Link>
                  <button 
                    onClick={handleLogout} 
                    className="btn btn-link text-danger text-decoration-none d-flex align-items-center gap-1 ms-2 fw-bold"
                  >
                    <LogOut size={18} /> Logout
                  </button>
                </div>

                {/* Mobile Toggle Button */}
                <button
                  className="d-md-none border-0 bg-transparent p-1"
                  onClick={() => setIsOpen(!isOpen)}
                >
                  {isOpen ? <X size={28} className="text-primary" /> : <Menu size={28} />}
                </button>
              </>
            ) : (
              /* Public Links (Login/Signup) - Updated for Mobile Visibility */
              <div className="d-flex align-items-center gap-2 gap-sm-3">
                <Link to="/" className="text-decoration-none text-dark d-none d-md-block me-2">Home</Link>
                <Link to="/login" className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1 px-2 px-sm-3">
                  <LogIn size={16} /> Login
                </Link>
                <Link to="/qrcodedecode" className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1 px-2 px-sm-3">
                  <QrCode size={16} /> QR Decode
                </Link>
                <Link to="/register" className="btn btn-primary btn-sm d-flex align-items-center gap-1 px-2 px-sm-3">
                  <UserPlus size={16} /> <span className="d-inline">Sign Up</span>
                </Link>
              </div>
            )}
          </div>

          {/* MOBILE DROPDOWN MENU (Only for Logged In Users) */}
          {user && (
            <div className={`mobile-menu shadow-lg d-md-none ${isOpen ? "open" : ""}`}>
              <div className="p-3 d-flex flex-column gap-2">
                <Link to="/" onClick={() => setIsOpen(false)} className={navLinkStyle}>
                  <Home size={20} /> Home
                </Link>
                <Link to="/booking" onClick={() => setIsOpen(false)} className={navLinkStyle}>
                  <CalendarCheck size={20} /> Booking
                </Link>
                <Link to="/history" onClick={() => setIsOpen(false)} className={navLinkStyle}>
                  <History size={20} /> History
                </Link>
                <Link to="/profile" onClick={() => setIsOpen(false)} className={navLinkStyle}>
                  <User size={20} /> Profile
                </Link>
                <hr className="my-1" />
                <button 
                  onClick={handleLogout} 
                  className="btn btn-danger w-100 d-flex align-items-center justify-content-center gap-2 mt-2"
                >
                  <LogOut size={20} /> Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Spacer to prevent content from going under the fixed navbar */}
      <div style={{ height: "65px" }}></div>

      <style>{`
        .navbar-fixed-top {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          z-index: 1050;
          background: white;
        }
        .nav-item-custom {
          color: #444;
          font-weight: 500;
          transition: all 0.2s;
          border-radius: 8px;
        }
        .nav-item-custom:hover {
          background-color: #f0f7ff;
          color: #0d6efd;
        }
        .mobile-menu {
          position: absolute;
          top: 100%;
          left: 0;
          width: 100%;
          background: white;
          overflow: hidden;
          max-height: 0;
          transition: max-height 0.4s ease-in-out, opacity 0.3s;
          opacity: 0;
          border-bottom: 3px solid #0d6efd;
        }
        .mobile-menu.open {
          max-height: 450px;
          opacity: 1;
        }
        /* Extra fix for very small screens to prevent button squishing */
        @media (max-width: 350px) {
          .btn-sm {
            padding-left: 8px !important;
            padding-right: 8px !important;
            font-size: 12px;
          }
        }
      `}</style>
    </>
  );
}