import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase";
import { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import logo from "../assets/loading_img.png";
import { BounceLoader } from "react-spinners"; 

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialPageLoad, setInitialPageLoad] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialPageLoad(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const reset = async (e) => {
    e.preventDefault();
    
    if (!email) {
      toast.error("Please enter your email address.");
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success("Password reset email sent! Check your inbox.");
      setTimeout(() => navigate("/login"), 3000);
    } catch (error) {
      console.error(error);
      if (error.code === "auth/user-not-found") {
        toast.error("No account found with this email.");
      } else {
        toast.error("Failed to send reset email. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (initialPageLoad) {
    return (
      <div 
        style={{
          height: "80vh", 
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <img 
          src={logo} 
          alt="City Parking Logo" 
          style={{ width: "220px", marginBottom: "20px" }} 
        />
        <BounceLoader color="#6199ff" size={50} />
      </div>
    );
  }

  return (
    <div className="container d-flex justify-content-center align-items-center pt-5">
      <ToastContainer position="top-center" autoClose={3000} />
      
      <div className=" p-4 rounded-4 border-0" style={{ maxWidth: "450px", width: "100%" }}>
        {loading ? (
          <div className="text-center py-5">
            <img src={logo} alt="Loading..." className="img-fluid mb-3" style={{ width: "80px" }} />
            <p className="text-muted fw-bold">Sending reset link...</p>
          </div>
        ) : (
          <div className="px-2">
            <div className="text-center mb-4">
              <h2 style={{ fontFamily: 'serif', fontStyle: 'italic' }}>Forgot Password?</h2>
              <img src={logo} alt="City Parking" className="img-fluid my-4" style={{ width: "200px" }} />
              <p className="text-muted small">Enter your email to receive a password reset link.</p>
            </div>

            <form onSubmit={reset}>
              <div className="mb-4">
                <label className="form-label fw-bold">Enter your Email</label>
                <input 
                  type="email" 
                  className="form-control form-control-lg border shadow-sm" 
                  placeholder="Enter your email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary w-100 rounded-3 fw-bold py-2 shadow-sm"
              >
                Send Reset Link
              </button>
            </form>
              
            <div className="text-center mt-4">
              <button 
                onClick={() => navigate("/login")} 
                className="btn btn-link text-decoration-none small text-muted"
              >
                Back to Login
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}