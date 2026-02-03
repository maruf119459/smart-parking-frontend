import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const register = async () => {
    try {
      setError("");

      if (!name || !email || !phone || !password || !confirmPassword) {
        setError("All fields are required");
        return;
      }

      if (password !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }

      if (password.length < 6) {
        setError("Password must be at least 6 characters");
        return;
      }

      const isValidPhone = /^01\d{9}$/.test(phone);
      if (!isValidPhone) {
        setError("Phone number must start with 01 and be exactly 11 digits");
        return;
      }

      const res = await createUserWithEmailAndPassword(auth, email, password);
      const user = res.user;

      await axios.post("http://localhost:5000/api/users/register", {
        uid: user.uid,
        name,
        email,
        phone
      });

      navigate("/booking");

    } catch (err) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      }
      else if (err.code === "auth/email-already-in-use") {
        setError("Email already registered");
      }
      else if (err.code === "auth/weak-password") {
        setError("Password must be at least 6 characters");
      }
      else {
        setError("Something went wrong. Please try again.");
      }
    }
  };

  return (
    <div style={{ textAlign: "center" }}>
      <h3>Create Account</h3>

      <input
        placeholder="Full Name"
        value={name}
        onChange={e => setName(e.target.value)}
      />
      <br />

      <input
        placeholder="Email"
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />
      <br />

      <input
        placeholder="Emergency Phone Number"
        value={phone}
        onChange={e => setPhone(e.target.value)}
      />
      <br />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
      />
      <br />

      <input
        type="password"
        placeholder="Confirm Password"
        value={confirmPassword}
        onChange={e => setConfirmPassword(e.target.value)}
      />
      <br />

      {error && (
        <p style={{ color: "red", marginTop: "10px" }}>
          {error}
        </p>
      )}

      <br />
      <button onClick={register}>Register</button>
    </div>
  );
}
