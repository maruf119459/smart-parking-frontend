// pages/ForgotPassword.jsx
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase";
import { useState } from "react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");

  const reset = async () => {
    await sendPasswordResetEmail(auth, email);
    alert("Reset email sent");
  };

  return (
    <>
      <h3>Forgot Password</h3>
      <input placeholder="Email" onChange={e => setEmail(e.target.value)} />
      <button onClick={reset}>Reset</button>
    </>
  );
}
