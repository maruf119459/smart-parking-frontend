import { createUserWithEmailAndPassword, sendEmailVerification, updateProfile } from "firebase/auth";
import { auth } from "../firebase";
import { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import logo from "../assets/loading_img.png";
import { BounceLoader } from "react-spinners";
import { Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { Helmet } from "react-helmet-async";

export default function Register() {
  // Page Control
  const [step, setStep] = useState(1);
  const [initialPageLoad, setInitialPageLoad] = useState(true);
  const [loading, setLoading] = useState(false);

  // Form Data
  const [formData, setFormData] = useState({
    name: "", email: "", phone: "", password: "", confirmPassword: ""
  });

  // UI State
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passStrength, setPassStrength] = useState(0);
  const [agreed, setAgreed] = useState(false);
  const [terms, setTerms] = useState([]);
  const { password } = formData;

  const BASE_URL = "https://smart-parking-backend-u47b.onrender.com";


  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => setInitialPageLoad(false), 800);
    fetchTerms();
    return () => clearTimeout(timer);
  }, []);

  const fetchTerms = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/terms-and-conditions`);
      setTerms(res.data.sort((a, b) => a.sl - b.sl));
    } catch (err) {
      console.error("Error fetching terms", err);
    }
  };

  // Password Strength Logic
  useEffect(() => {
    const pass = formData.password;
    let strength = 0;
    if (pass.length >= 8) strength += 25;
    if (/[a-zA-Z]/.test(pass)) strength += 25;
    if (/[0-9]/.test(pass)) strength += 25;
    if (/[^A-Za-z0-9]/.test(pass)) strength += 25;
    setPassStrength(strength);
  }, [formData.password]);

  const handleInput = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const isStep1Valid =
    formData.name &&
    /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(formData.email) &&
    /^01\d{9}$/.test(formData.phone) &&
    passStrength === 100 &&
    formData.password === formData.confirmPassword;

  const handleRegister = async () => {
    setLoading(true);
    try {
      // 1. Create User in Firebase
      const res = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = res.user;

      // 2. Update displayName in Firebase
      await updateProfile(user, {
        displayName: formData.name
      });

      // 2. Send Email Verification
      await sendEmailVerification(user);

      // 3. Save to Backend (Including Terms Agreement)
      await axios.post(`${BASE_URL}/api/users/register`, {
        uid: user.uid,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        agreedToTerms: agreed
      });

      toast.success("Registration successful!");

      // Navigate to login so they can sign in after verifying
      setTimeout(() => navigate("/login"), 3000);

    } catch (err) {
      console.error(err);
      if (err.code === "auth/email-already-in-use") {
        toast.error("Email already exists.");
      } else {
        toast.error("Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (initialPageLoad) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center" style={{ height: "80vh" }}>
        <img src={logo} alt="Logo" style={{ width: "220px", marginBottom: "20px" }} />
        <BounceLoader color="#6199ff" size={50} />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>City Parking | Sign Up</title>
      </Helmet>
      <div className="d-flex flex-column align-items-center pt-4 pb-5">
        <ToastContainer position="top-center" autoClose={3000} />

        <div style={{ width: "100%", maxWidth: "450px" }} className="px-4">
          <div className="text-center mb-4">
            <h3 className="fw-bold mb-2"> {step === 1 ? "Sign Up" : "Terms and Conditions"}</h3>
            <img src={logo} alt="Logo" style={{ width: "150px" }} className="" />
          </div>

          {step === 1 ? (
            <div className="animate__animated animate__fadeIn">
              {/* Name */}
              <div className="mb-3">
                <label className="form-label fw-bold small">Name</label>
                <div className="position-relative">
                  <input name="name" className="form-control form-control-lg border shadow-sm" placeholder="Full Name" onChange={handleInput} value={formData.name} />
                  {formData.name && <CheckCircle2 className="position-absolute end-0 top-50 translate-middle-y me-3 text-success" size={18} />}
                </div>
              </div>

              {/* Email */}
              <div className="mb-3">
                <label className="form-label fw-bold small d-flex justify-content-between">
                  E - Mail {formData.email && !/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(formData.email) && <span className="text-danger small">Invalid e-mail address</span>}
                </label>
                <input name="email" className="form-control form-control-lg border shadow-sm" placeholder="example@mail.com" onChange={handleInput} value={formData.email} />
              </div>

              {/* Phone */}
              <div className="mb-3">
                <label className="form-label fw-bold small d-flex justify-content-between">
                  Phone {formData.phone && !/^01\d{9}$/.test(formData.phone) && <span className="text-danger small">Invalid mobile number</span>}
                </label>
                <input name="phone" className="form-control form-control-lg border shadow-sm" placeholder="017XXXXXXXX" onChange={handleInput} value={formData.phone} />
              </div>

              {/* Password */}
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <label className="form-label fw-bold small mb-0">Password</label>
                  <div style={{ width: "80px", height: "6px", backgroundColor: "#e0e0e0", borderRadius: "10px" }}>
                    <div style={{ width: `${passStrength}%`, height: "100%", borderRadius: "10px", transition: "0.3s", backgroundColor: passStrength < 50 ? "#ff4d4d" : passStrength < 100 ? "#ffcc00" : "#00cc66" }}></div>
                  </div>
                </div>
                <div className="position-relative">
                  <input name="password" type={showPass ? "text" : "password"} className="form-control form-control-lg border shadow-sm" placeholder="********" onChange={handleInput} value={formData.password} />
                  <span className="position-absolute end-0 top-50 translate-middle-y me-3 cursor-pointer z-3" onClick={() => setShowPass(!showPass)}>
                    {showPass ? <EyeOff size={20} className="text-muted" /> : <Eye size={20} className="text-muted" />}
                  </span>
                </div>
                {passStrength < 100 && password.length > 0 && (
                  <span className="text-muted x-small" style={{ fontSize: '11px' }}>
                    Must be 8+ chars, include letters, numbers, & symbols.
                  </span>
                )}
              </div>

              {/* Confirm Password */}
              <div className="mb-4">
                <label className="form-label fw-bold small">Confirm Password</label>
                <div className="position-relative">
                  <input name="confirmPassword" type={showConfirmPass ? "text" : "password"} className="form-control form-control-lg border shadow-sm" placeholder="********" onChange={handleInput} value={formData.confirmPassword} />
                  <span className="position-absolute end-0 top-50 translate-middle-y me-3 cursor-pointer z-3" onClick={() => setShowConfirmPass(!showConfirmPass)}>
                    {showConfirmPass ? <EyeOff size={20} className="text-muted" /> : <Eye size={20} className="text-muted" />}
                  </span>
                </div>
                {formData.confirmPassword && formData.password !== formData.confirmPassword && <span className="text-danger small">Passwords do not match</span>}
              </div>

              <button
                className="btn btn-primary w-100 py-3 fw-bold shadow-sm"
                style={{ borderRadius: '12px', backgroundColor: isStep1Valid ? '#6199ff' : '#a0c4ff', border: 'none' }}
                disabled={!isStep1Valid}
                onClick={() => setStep(2)}
              >
                Next
              </button>
            </div>
          ) : (
            <div className="animate__animated animate__fadeIn text-center">
              {/* Terms Box */}
              <div className="terms-scroll-box mb-4 shadow-sm">
                <p className="fw-bold mb-3 text-center text-primary">City Parking ® - Terms & Conditions</p>
                <hr />
                {terms.map((t) => (
                  <div key={t._id} className="mb-4">
                    <p className="fw-bold mb-2 text-dark">{t.sl}. {t.section_title}</p>
                    <p className="mb-2 text-secondary">{t.message}</p>
                    {t.point && Object.values(t.point).map((p, idx) => (
                      <div key={idx} className="ms-4 mb-2 d-flex">
                        <span className="me-2 text-primary">•</span>
                        <span>{p}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* Agreement Checkbox */}
              <div className="form-check mb-4 d-flex justify-content-center align-items-center gap-2">
                <input className="form-check-input mt-0" type="checkbox" id="agree" checked={agreed} onChange={() => setAgreed(!agreed)} />
                <label className="form-check-label small" htmlFor="agree">
                  I agree to the terms and conditions
                </label>
              </div>

              <button
                className="btn btn-primary w-100 py-3 fw-bold shadow-sm"
                style={{ borderRadius: '12px', backgroundColor: agreed ? '#6199ff' : '#a0c4ff', border: 'none' }}
                disabled={!agreed || loading}
                onClick={handleRegister}
              >
                {loading ? "Creating Account..." : "Sign Up"}
              </button>
              <button className="btn btn-link w-100 mt-2 text-decoration-none text-muted small" onClick={() => setStep(1)}>Back to Details</button>
            </div>
          )}

          <p className="text-center mt-4 text-muted">
            Already have an account? <Link to="/login" className="text-primary text-decoration-none fw-bold">Login</Link>
          </p>
        </div>
      </div>
    </>
  );
}