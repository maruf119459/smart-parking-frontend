import { useEffect, useState } from "react";
import axios from "axios";
import { auth } from "../firebase";
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential,updateProfile } from "firebase/auth";
import { toast, ToastContainer } from "react-toastify";
import logo from "../assets/loading_img.png";
import { BounceLoader } from "react-spinners";
import { Eye, EyeOff, User, CheckCircle2, Phone, Lock, ShieldCheck } from "lucide-react";
import { Helmet } from "react-helmet-async";

export default function Profile() {
  const user = auth.currentUser;

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({});
  const [stats, setStats] = useState({});

  // Profile Form States
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [updateNameChecked, setUpdateNameChecked] = useState(false);
  const [updatePhoneChecked, setUpdatePhoneChecked] = useState(false);

  // Password Form States
  const [oldPassword, setOldPassword] = useState(" ");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // UI States
  const [showOldPass, setShowOldPass] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passStrength, setPassStrength] = useState(0);

  const BASE_URL = "https://smart-parking-backend-u47b.onrender.com";

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    try {
      const [profRes, statRes] = await Promise.all([
        axios.get(`${BASE_URL}/api/users/${user.uid}`),
        axios.get(`${BASE_URL}/api/parking/stats/${user.uid}`)
      ]);
      console.log("Stats Data:", statRes.data);
      setProfile(profRes.data);
      setName(profRes.data.name);
      setPhone(profRes.data.phone);
      setStats(statRes.data);
    } catch (err) {
      toast.error("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  // Password Strength Logic
  useEffect(() => {
    let strength = 0;
    if (newPassword.length >= 8) strength += 25;
    if (/[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword)) strength += 25;
    if (/[0-9]/.test(newPassword)) strength += 25;
    if (/[^A-Za-z0-9]/.test(newPassword)) strength += 25;
    setPassStrength(strength);
  }, [newPassword]);

  const getStrengthText = () => {
    if (passStrength === 0) return "";
    if (passStrength <= 25) return "Weak (Use 8+ chars)";
    if (passStrength <= 50) return "Fair (Add Uppercase)";
    if (passStrength <= 75) return "Good (Add Numbers)";
    return "Strong Password";
  };


const handleUpdateProfile = async () => {
  const updates = {};
  if (updateNameChecked) updates.name = name;
  
  if (updatePhoneChecked) {
    if (!/^01\d{9}$/.test(phone)) return toast.error("Invalid phone format");
    updates.phone = phone;
  }

  if (Object.keys(updates).length === 0) return toast.warn("Nothing to update");

  try {
    if (updateNameChecked && user) {
      await updateProfile(user, {
        displayName: name,
      });
    }

    await axios.patch(`${BASE_URL}/api/users/update-profile`, { uid: user.uid, ...updates });

    toast.success("Profile updated!");
    loadData();
    setUpdateNameChecked(false);
    setUpdatePhoneChecked(false);
  } catch (err) {
    toast.error("Update failed");
  }
};

  const handleUpdatePassword = async () => {
    if (!oldPassword) return toast.error("Please enter your current password");
    if (passStrength < 100) return toast.error("New password is not strong enough");
    if (newPassword !== confirmPassword) return toast.error("Passwords do not match");

    try {
      // Step 1: Re-authenticate the user
      const credential = EmailAuthProvider.credential(user.email, oldPassword);
      await reauthenticateWithCredential(user, credential);

      // Step 2: Update the password
      await updatePassword(user, newPassword);

      toast.success("Password changed successfully!");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      if (err.code === "auth/wrong-password") {
        toast.error("Incorrect old password");
      } else {
        toast.error(err.message);
      }
    }
  };

  if (loading) {
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
        <title>City Parking | Profile</title>
      </Helmet>
      <div className="container py-5">
        <ToastContainer position="top-center" autoClose={3000} />

        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6">
            <div className="text-center mb-4">
              <h2 className="fw-bold display-6 text-center">My Profile</h2>
              <p className="small fw-bold text-muted" >Your Unique ID: {profile.uid}</p>
            </div>

            {/* Stats Section */}
            <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '20px', background: '#f8faff' }}>
              <div className="card-body p-4 text-center">
                <h6 className="text-muted small fw-bold mb-3 text-uppercase">Parking Summary</h6>
                <div className="row">
                  <div className="col-4 border-end">
                    <h4 className="fw-bold text-success mb-0">{stats.completed || 0}</h4>
                    <span className="small text-muted">Completed</span>
                  </div>
                  <div className="col-4 border-end">
                    <h4 className="fw-bold text-primary mb-0">{stats.running || 0}</h4>
                    <span className="small text-muted">Running</span>
                  </div>
                  <div className="col-4">
                    <h4 className="fw-bold text-danger mb-0">{stats.canceled || 0}</h4>
                    <span className="small text-muted">Canceled</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Settings Card */}
            <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '20px' }}>
              <div className="card-body p-4">
                <label className="form-label fw-bold small text-muted text-uppercase mb-3">General Settings</label>

                <div className="input-group mb-3 border rounded-3 shadow-sm bg-light overflow-hidden">
                  <span className="input-group-text bg-transparent border-0"><User size={18} className="text-primary" /></span>
                  <input className="form-control border-0 bg-transparent py-2" value={name} onChange={(e) => setName(e.target.value)} disabled={!updateNameChecked} placeholder="Full Name" />
                  <div className="input-group-text bg-transparent border-0">
                    <input type="checkbox" checked={updateNameChecked} onChange={() => setUpdateNameChecked(!updateNameChecked)} />
                  </div>
                </div>

                <div className="input-group mb-4 border rounded-3 shadow-sm bg-light overflow-hidden">
                  <span className="input-group-text bg-transparent border-0"><Phone size={18} className="text-primary" /></span>
                  <input className="form-control border-0 bg-transparent py-2" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={!updatePhoneChecked} placeholder="Phone Number" />
                  <div className="input-group-text bg-transparent border-0">
                    <input type="checkbox" checked={updatePhoneChecked} onChange={() => setUpdatePhoneChecked(!updatePhoneChecked)} />
                  </div>
                </div>

                <button className="btn btn-primary w-100 py-3 fw-bold mb-4" style={{ borderRadius: '12px', backgroundColor: '#6199ff', border: 'none' }} onClick={handleUpdateProfile} disabled={!updateNameChecked && !updatePhoneChecked}>
                  Save Profile Changes
                </button>

                <hr className="my-4 opacity-25" />

                {/* Password Section */}
                <label className="form-label fw-bold small text-muted text-uppercase mb-3">Security & Password</label>

                {/* Old Password */}
                <div className="position-relative mb-3">
                  <span className="position-absolute start-0 top-50 translate-middle-y ms-3 text-muted"><ShieldCheck size={18} /></span>
                  <input type={showOldPass ? "text" : "password"} className="form-control form-control-lg border shadow-sm ps-5" placeholder="Current Password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} />
                  <span className="position-absolute end-0 top-50 translate-middle-y me-3 cursor-pointer text-muted" onClick={() => setShowOldPass(!showOldPass)}>
                    {showOldPass ? <EyeOff size={20} /> : <Eye size={20} />}
                  </span>
                </div>

                {/* New Password */}
                <div className="d-flex justify-content-between align-items-center mb-1 px-1">
                  <span className="small fw-bold" style={{ fontSize: '11px', color: passStrength < 100 ? '#ff4d4d' : '#00cc66' }}>{getStrengthText()}</span>
                  <div style={{ width: "60px", height: "5px", backgroundColor: "#eee", borderRadius: "10px" }}>
                    <div style={{ width: `${passStrength}%`, height: "100%", borderRadius: "10px", transition: "0.4s", backgroundColor: passStrength < 50 ? "#ff4d4d" : passStrength < 100 ? "#ffcc00" : "#00cc66" }}></div>
                  </div>
                </div>

                <div className="position-relative mb-3">
                  <span className="position-absolute start-0 top-50 translate-middle-y ms-3 text-muted"><Lock size={18} /></span>
                  <input type={showPass ? "text" : "password"} className="form-control form-control-lg border shadow-sm ps-5" placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                  <span className="position-absolute end-0 top-50 translate-middle-y me-3 cursor-pointer text-muted" onClick={() => setShowPass(!showPass)}>
                    {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
                  </span>
                </div>

                {/* Confirm Password */}
                <div className="position-relative mb-4">
                  <span className="position-absolute start-0 top-50 translate-middle-y ms-3 text-muted"><CheckCircle2 size={18} /></span>
                  <input type={showConfirmPass ? "text" : "password"} className="form-control form-control-lg border shadow-sm ps-5" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                  <span className="position-absolute end-0 top-50 translate-middle-y me-3 cursor-pointer text-muted" onClick={() => setShowConfirmPass(!showConfirmPass)}>
                    {showConfirmPass ? <EyeOff size={20} /> : <Eye size={20} />}
                  </span>
                </div>

                <button className="btn btn-dark w-100 py-3 fw-bold" style={{ borderRadius: '12px' }} onClick={handleUpdatePassword} disabled={passStrength < 100 || !oldPassword}>
                  Update Password
                </button>
              </div>
            </div>

            <div className="text-center mt-3">
              <p className="text-muted small mb-1">Signed in as</p>
              <p className="fw-bold">{user.email}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}