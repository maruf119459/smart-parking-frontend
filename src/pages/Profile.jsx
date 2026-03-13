import { useEffect, useState } from "react";
import axios from "axios";
import { auth } from "../firebase";
import { updateEmail, updatePassword } from "firebase/auth";

export default function Profile() {
  const user = auth.currentUser;
  const uid = user.uid;

  const [profile, setProfile] = useState({});
  const [stats, setStats] = useState({});

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [updateNameChecked, setUpdateNameChecked] = useState(false);
  const [updatePhoneChecked, setUpdatePhoneChecked] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadProfile();
    loadStats();
  }, []);

  const loadProfile = async () => {
    const res = await axios.get(`http://localhost:5000/api/users/${uid}`);
    setProfile(res.data);
    setName(res.data.name);
    setPhone(res.data.phone);
  };

  const loadStats = async () => {
    const res = await axios.get(
      `http://localhost:5000/api/parking/stats/${uid}`
    );
    setStats(res.data);
  };

  // 🔹 Update Name / Phone
  const updateProfile = async () => {
    setError("");
    setSuccess("");

    const updates = {};

    if (updateNameChecked) {
      if (!name) return setError("Name cannot be empty");
      updates.name = name;
    }

    if (updatePhoneChecked) {
      const phoneRegex = /^01\d{9}$/;
      if (!phoneRegex.test(phone))
        return setError("Invalid phone number format");
      updates.phone = phone;
    }

    if (Object.keys(updates).length === 0)
      return setError("Select at least one field to update");

    try {
      await axios.patch("http://localhost:5000/api/users/update-profile", {
        uid,
        ...updates,
      });

      setSuccess("Profile updated successfully");
      loadProfile();
    } catch (err) {
      setError(err.message);
    }
  };

  // 🔹 Update Password
  const updateUserPassword = async () => {
    setError("");
    setSuccess("");

    if (!newPassword || !confirmPassword)
      return setError("Password fields cannot be empty");

    if (newPassword !== confirmPassword)
      return setError("Passwords do not match");

    if (newPassword.length < 6)
      return setError("Password must be at least 6 characters");

    try {
      await updatePassword(user, newPassword);
      setSuccess("Password updated successfully");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      if (err.code === "auth/weak-password") {
        setError("Password must be at least 6 characters");
      } else {
        setError(err.message);
      }
    }
  };

  return (
    <div style={{ width: "60%", margin: "auto" }}>
      <h2>My Profile</h2>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {success && <p style={{ color: "green" }}>{success}</p>}

      <p><b>User ID:</b> {uid}</p>
      <p><b>Name:</b> {profile.name}</p>
      <p><b>Email:</b> {profile.email} <b>Email can not change.</b></p>
      <p><b>Phone:</b> {profile.phone}</p>

      <hr />

      <h3>Update Name / Phone</h3>

      <label>
        <input
          type="checkbox"
          checked={updateNameChecked}
          onChange={() => setUpdateNameChecked(!updateNameChecked)}
        />
        Update Name
      </label>

      <input
        placeholder="Name"
        value={name}
        disabled={!updateNameChecked}
        onChange={(e) => setName(e.target.value)}
      />

      <br />

      <label>
        <input
          type="checkbox"
          checked={updatePhoneChecked}
          onChange={() => setUpdatePhoneChecked(!updatePhoneChecked)}
        />
        Update Phone
      </label>

      <input
        placeholder="Phone"
        value={phone}
        disabled={!updatePhoneChecked}
        onChange={(e) => setPhone(e.target.value)}
      />

      <button onClick={updateProfile}>Update Profile</button>

      <hr />

      <h3>Update Password</h3>
      <input
        type="password"
        placeholder="New Password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
      />
      <input
        type="password"
        placeholder="Confirm Password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
      />
      <button onClick={updateUserPassword}>Update Password</button>

      <hr />

      <h3>Parking Summary</h3>
      <table border="1" width="100%">
        <thead>
          <tr>
            <th>Completed</th>
            <th>Running</th>
            <th>Entrance Error</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{stats.completed}</td>
            <td>{stats.running}</td>
            <td>{stats.entranceError}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
