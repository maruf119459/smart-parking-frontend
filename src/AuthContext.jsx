import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "./firebase";
import { onAuthStateChanged, signOut, sendEmailVerification, reload } from "firebase/auth";
import { BounceLoader } from "react-spinners"; 
import { toast, ToastContainer } from "react-toastify";
import { ShieldCheck, Mail, RefreshCw } from "lucide-react";
import loadingImg from "./assets/loading_img.png"; 

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setIsVerified(currentUser.emailVerified);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  // Function to refresh user data and check if they verified their email
  const checkEmailStatus = async () => {
    if (auth.currentUser) {
      await reload(auth.currentUser);
      setIsVerified(auth.currentUser.emailVerified);
      if (auth.currentUser.emailVerified) {
        toast.success("Email verified successfully!");
      } else {
        toast.info("Email is still not verified.");
      }
    }
  };

  const resendVerification = async () => {
    try {
      await sendEmailVerification(auth.currentUser);
      toast.success("Verification email sent! Check your inbox.");
    } catch (err) {
      toast.error("Please wait a moment before trying again.");
    }
  };

  const logout = () => signOut(auth);

  if (loading) {
    return (
      <div style={{ height: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
        <img src={loadingImg} alt="City Parking Logo" style={{ width: "250px", marginBottom: "20px" }} />
        <BounceLoader color="#6199ff" size={60} />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, logout, isVerified }}>
      <ToastContainer position="top-center" style={{ zIndex: 10001 }} />

      {/* Global Email Verification Blocker Overlay */}
      {user && !isVerified && (
        <div 
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(255, 255, 255, 0.98)", 
            zIndex: 10000, 
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
            padding: "20px",
            backdropFilter: "blur(5px)" 
          }}
          className="animate__animated animate__fadeIn"
        >
          <img src={loadingImg} alt="Logo" style={{ width: "180px", marginBottom: "30px" }} />
          
          <div className="card border-0 shadow-lg p-5" style={{ borderRadius: "25px", maxWidth: "500px" }}>
            <ShieldCheck size={70} color="#6199ff" className="mb-3 mx-auto" />
            <h3 className="fw-bold mb-3" style={{ color: "#4a4a8a" }}>Verify Your Account</h3>
            <p className="text-muted mb-4">
              We've sent a verification link to <br />
              <strong className="text-dark">{user.email}</strong>. <br />
              Please verify your email to access your profile and parking features.
            </p>

            <div className="d-grid gap-3">
              <button 
                className="btn btn-primary py-3 fw-bold shadow-sm" 
                style={{ borderRadius: "12px", backgroundColor: "#6199ff", border: "none" }}
                onClick={checkEmailStatus}
              >
                <RefreshCw size={18} className="me-2" /> I have verified my email
              </button>
              
              <button 
                className="btn btn-outline-secondary py-2" 
                style={{ borderRadius: "12px" }}
                onClick={resendVerification}
              >
                <Mail size={18} className="me-2" /> Resend Verification Email
              </button>

              <button 
                className="btn btn-link text-muted small mt-2" 
                onClick={logout}
              >
                Sign out and use another account
              </button>
            </div>
          </div>
        </div>
      )}

      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);