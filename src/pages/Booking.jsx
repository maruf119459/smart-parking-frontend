import { useEffect, useState } from "react";
import axios from "axios";
import { socket } from "../socket";
import ParkingCard from "../components/ParkingCard";
import { useAuth } from "../AuthContext";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Car, Loader2 } from "lucide-react";
import { BounceLoader } from "react-spinners";
import loadingImg from "../assets/loading_img.png";

export default function Booking() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [vehicleType, setVehicleType] = useState("default");
  const [vehicleTypesData, setVehicleTypesData] = useState([]);
  const [slotAvailability, setSlotAvailability] = useState({});
  const [loading, setLoading] = useState(true);
  const [bookingLoad, setBookingLoad] = useState(false);
  const [dbUser, setDbUser] = useState(null);

  const loadData = async () => {
    try {
      const slotsRes = await axios.get("http://localhost:5000/api/slots/available");
      const availabilityMap = {};
      slotsRes.data.forEach(item => {
        availabilityMap[item.vehicleType.toLowerCase()] = item.available;
      });
      setSlotAvailability(availabilityMap);

      const parkingRes = await axios.get(
        `http://localhost:5000/api/parking/user-current-parking?uid=${user.uid}`
      );
      setSessions(parkingRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadVehicleTypes = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/vehicle-types-and-charges");
      setVehicleTypesData(res.data);
    } catch (err) {
      toast.error("Failed to load vehicle rates");
    }
  };

  const loadUserData = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/users/${user.uid}`);   
      setDbUser(res.data);
    } catch (err) {
      toast.error("Failed to load user data");
    }
  };

  useEffect(() => {
    if (!user) return;
    loadData();
    loadVehicleTypes();
    loadUserData();
    socket.on("db_update", loadData);
    return () => socket.off("db_update");
  }, [user]);

  const book = async () => {
    if (vehicleType === "default") return;
    setBookingLoad(true);
    try {
      const selectedTypeData = vehicleTypesData.find(v => v.vehicleType.toLowerCase() === vehicleType);
      const rateString = `${selectedTypeData.chargingRate} ${selectedTypeData.currency} / ${selectedTypeData.timeType}`;

      await axios.post("http://localhost:5000/api/parking/book", {
        uid: user.uid,
        vehicleType,
        name: dbUser?.name || user.displayName,
        email: dbUser?.email || user.email,
        phone: dbUser?.phone || user.phoneNumber,
        parkingRate: rateString 
      });
      
      toast.success(`${vehicleType.toUpperCase()} Booked Successfully!`);
      setVehicleType("default");
    } catch (err) {
      toast.error("Booking failed. Please try again.");
    } finally {
      setBookingLoad(false);
    }
  };

  const isBookDisabled =
    vehicleType === "default" ||
    !slotAvailability[vehicleType] ||
    slotAvailability[vehicleType] === 0 ||
    bookingLoad;

  if (loading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center" style={{ height: "80vh" }}>
        <img src={loadingImg} alt="Logo" style={{ width: "220px", marginBottom: "20px" }} />
        <BounceLoader color="#6199ff" size={50} />
      </div>
    );
  }

  return (
    <div className="container py-5">
      <ToastContainer position="top-center" autoClose={3000} />
      
      <div className="text-center mb-5">
        <h1 className="fw-bold display-6">Vehicle Booking Hub</h1>
        <p className="text-muted">Real-time slot availability and active session management</p>
      </div>

      {/* Main Wrapper for Equal Width and Vertical Stacking */}
      <div className="mx-auto" style={{ maxWidth: "800px", width: "80%" }}>
        
        {/* Availability Section - Always Top */}
        <div className="mb-5">
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
            <h5 className="fw-bold mb-4 d-flex align-items-center">
              <Car className="me-2 text-primary" /> Available Slots
            </h5>
            <div className="list-group list-group-flush mb-4">
              {vehicleTypesData.map(item => (
                <div key={item.vehicleType} className="list-group-item d-flex justify-content-between align-items-center px-0 bg-transparent">
                  <span className="text-capitalize fw-semibold">{item.vehicleType}</span>
                  <span className={`badge rounded-pill ${slotAvailability[item.vehicleType.toLowerCase()] > 0 ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}>
                    {slotAvailability[item.vehicleType.toLowerCase()] || 0} Slots
                  </span>
                </div>
              ))}
            </div>

            <div className="bg-light p-3 rounded-3">
              <label className="form-label small fw-bold text-muted">SELECT VEHICLE</label>
              <select
                className="form-select form-select-lg border-0 shadow-sm mb-3"
                value={vehicleType}
                onChange={e => setVehicleType(e.target.value)}
              >
                <option value="default">Select Type...</option>
                {vehicleTypesData.map(item => (
                  <option key={item.vehicleType} value={item.vehicleType.toLowerCase()}>
                    {item.vehicleType.toUpperCase()}
                  </option>
                ))}
              </select>
              <button 
                className="btn btn-primary btn-lg w-100 fw-bold rounded-3 shadow-sm"
                onClick={book} 
                disabled={isBookDisabled}
              >
                {bookingLoad ? <Loader2 className="animate-spin mx-auto" size={24} /> : "Book Now"}
              </button>
            </div>
          </div>
        </div>

        {/* Sessions Section - Always Bottom */}
        <div className="mb-5">
          <h5 className="fw-bold mb-4">My Parking Sessions</h5>
          {sessions.length === 0 ? (
            <div className="card border-0 shadow-sm rounded-4 p-5 text-center bg-white">
              <p className="text-muted mb-0">No active sessions found.</p>
            </div>
          ) : (
            <div className="d-flex flex-column gap-3">
              {sessions.map(s => (
                <ParkingCard key={s._id} data={s} dbUser={dbUser} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}