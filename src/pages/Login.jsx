import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import logo from "../assets/loading_img.png";
import { BounceLoader } from "react-spinners";
import { Eye, EyeOff } from "lucide-react";
import { Helmet } from "react-helmet-async";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [initialPageLoad, setInitialPageLoad] = useState(true);
  const [showPass, setShowPass] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialPageLoad(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("Login Successful!");
      navigate("/");
    } catch (error) {
      toast.error("Invalid user name or password");
    } finally {
      setLoginLoading(false);
    }
  };

  if (initialPageLoad) {
    return (
      <div style={{ height: "80vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
        <img src={logo} alt="City Parking Logo" style={{ width: "220px", marginBottom: "20px" }} />
        <BounceLoader color="#6199ff" size={50} />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>City Parking | Login</title>
      </Helmet>
      <div className="d-flex flex-column align-items-center pt-5">
        <ToastContainer position="top-center" autoClose={2000} />

        <div style={{ width: "100%", maxWidth: "450px" }} className="px-4">
          <div className="text-center mb-4">
            <h3 className="fw-bold mb-2">Login</h3>
            <img src={logo} alt="Logo" style={{ width: "150px" }} className="" />
          </div>

          <form onSubmit={handleLogin}>
            <div className="mb-3">
              <label className="form-label fw-bold">Enter your User Name</label>
              <input
                type="email"
                className="form-control form-control-lg border shadow-sm"
                placeholder="Enter your email"
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="mb-4">
              <label className="form-label fw-bold">Enter your password</label>

              <div className="position-relative">
                <input
                  type={showPass ? "text" : "password"}
                  className="form-control form-control-lg"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <span className="position-absolute end-0 top-50 translate-middle-y me-3 cursor-pointer" onClick={() => setShowPass(!showPass)}>
                  {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
                </span>
              </div>
              <div className="text-end mt-2">
                <Link to="/forgot-password" className="text-decoration-none small fw-bold">Forgot password?</Link>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100 py-3 fw-bold shadow-sm"
              style={{ borderRadius: '12px', backgroundColor: '#6199ff', border: 'none' }}
              disabled={loginLoading}
            >
              {loginLoading ? "Processing..." : "Sing In"}
            </button>
          </form>

          <p className="text-center mt-4 text-muted">
            Don't have an account? <Link to="/register" className="text-primary text-decoration-none fw-bold">Sign Up</Link>
          </p>
        </div>
      </div>
    </>
  );
}