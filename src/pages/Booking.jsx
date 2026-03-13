import { useEffect, useState } from "react";
import axios from "axios";
import { socket } from "../socket";
import ParkingCard from "../components/ParkingCard";
import { useAuth } from "../AuthContext";

export default function Booking() {
  const { user } = useAuth();

  const [sessions, setSessions] = useState([]);
  const [vehicleType, setVehicleType] = useState("default");
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [slotAvailability, setSlotAvailability] = useState({}); // 🔥 key change

  // Load slot availability + user sessions
  const loadData = async () => {
    // 🔹 Load all free slots (dynamic)
    const slotsRes = await axios.get(
      "http://localhost:5000/api/slots/available"
    );

    const availabilityMap = {};
    slotsRes.data.forEach(item => {
      availabilityMap[item.vehicleType.toLowerCase()] = item.available;
    });

    setSlotAvailability(availabilityMap);

    // 🔹 Active parking sessions
    const parkingRes = await axios.get(
      `http://localhost:5000/api/parking/user-current-parking?uid=${user.uid}`
    );

    setSessions(parkingRes.data);
  };

  // Load vehicle types
  const loadVehicleTypes = async () => {
    const res = await axios.get(
      "http://localhost:5000/api/vehicle-types"
    );

    // normalize to lowercase for consistency
    setVehicleTypes(res.data.map(v => v.toLowerCase()));
  };

  useEffect(() => {
    if (!user) return;

    loadData();
    loadVehicleTypes();

    socket.on("db_update", loadData);
    return () => socket.off("db_update");
  }, [user]);

  const book = async () => {
    if (vehicleType === "default") return;

    const res = await axios.get(`http://localhost:5000/api/users/${user.uid}`);
    await axios.post("http://localhost:5000/api/parking/book", {
      uid: user.uid,
      vehicleType,
      name:res.data.name,
      email:user.email,
      phone: res.data.phone
    });
  };

  // 🔥 Fully dynamic disable logic
  const isBookDisabled =
    vehicleType === "default" ||
    !slotAvailability[vehicleType] ||
    slotAvailability[vehicleType] === 0;

  return (
    <div style={{ textAlign: "center", marginTop: "10px" }}>
      <h2><b>Available Slots</b></h2>

      {/* 🔹 Dynamic slot display */}
      {vehicleTypes.map(type => (
        <p key={type}>
          {type.toUpperCase()} : {slotAvailability[type] || 0}
        </p>
      ))}

      <select
        value={vehicleType}
        onChange={e => setVehicleType(e.target.value)}
      >
        <option value="default">Select Vehicle Type</option>

        {vehicleTypes.map(type => (
          <option key={type} value={type}>
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </option>
        ))}
      </select>

      <br /><br />

      <button onClick={book} disabled={isBookDisabled}>
        Book
      </button>

      <hr />

      {sessions.map(s => (
        <ParkingCard key={s._id} data={s} />
      ))}
    </div>
  );
}
