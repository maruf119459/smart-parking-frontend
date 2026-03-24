import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../AuthContext";
import { socket } from "../socket";
import { Sun, Moon, Clock, AlertTriangle, CreditCard } from "lucide-react";
import { BounceLoader } from "react-spinners";
import loadingImg from "../assets/loading_img.png";

// Asset Imports
import bannerImg from "../assets/banner.jpg";
import busTopViewIcon from "../assets/bus.png";
import carTopViewIcon from "../assets/car.png";
import bikeTopViewIcon from "../assets/bike.png";
import bycycleTopViewIcon from "../assets/bycycle.png";
import cngTopViewIcon from "../assets/cng.png";
import highCarTopViewIcon from "../assets/high_car.png";
import miniBusTopViewIcon from "../assets/mini_bus.png";
import miniTruckTopViewIcon from "../assets/mini_truck.png";
import truckTopViewIcon from "../assets/truck.png";

import busIcon from "../assets/bus_icon.png";
import carIcon from "../assets/car_icon.png";
import bikeIcon from "../assets/bike_icon.png";
import bycycleIcon from "../assets/cycle_icon.png";
import cngIcon from "../assets/cng_icon.png";
import highCarIcon from "../assets/high_car_icon.png";
import miniBusIcon from "../assets/mini_bus_icon.png";
import miniTruckIcon from "../assets/mini_truck_icon.png";
import truckIcon from "../assets/truck_icon.png";
import { Helmet } from "react-helmet-async";

const iconMap = {
    car: { main: carIcon, top: carTopViewIcon },
    bike: { main: bikeIcon, top: bikeTopViewIcon },
    bus: { main: busIcon, top: busTopViewIcon },
    bicycle: { main: bycycleIcon, top: bycycleTopViewIcon },
    cng: { main: cngIcon, top: cngTopViewIcon },
    "high_car": { main: highCarIcon, top: highCarTopViewIcon },
    "mini_bus": { main: miniBusIcon, top: miniBusTopViewIcon },
    "mini_truck": { main: miniTruckIcon, top: miniTruckTopViewIcon },
    truck: { main: truckIcon, top: truckTopViewIcon },
};

export default function Home() {
    const { user } = useAuth();
    const [weather, setWeather] = useState(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [charges, setCharges] = useState([]);
    const [ongoingParking, setOngoingParking] = useState([]);
    const [rules, setRules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isDay, setIsDay] = useState(true);

    const BASE_URL = "https://smart-parking-backend-u47b.onrender.com";


    // Initial Data Fetch
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                await Promise.allSettled([
                    axios.get("https://api.open-meteo.com/v1/forecast?latitude=23.8103&longitude=90.4125&current_weather=true").then(res => setWeather(res.data.current_weather)),
                    axios.get(`${BASE_URL}/api/vehicle-types-and-charges`).then(res => setCharges(res.data)),
                    axios.get(`${BASE_URL}/api/rules-and-regulations`).then(res => setRules(res.data))
                ]);
            } finally {
                setLoading(false);
            }
        };
        loadInitialData();
    }, []);

    // Real-time Update Engine (1 Second Interval)
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
            setIsDay(new Date().getHours() >= 6 && new Date().getHours() < 18);
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (user) {
            fetchOngoing();
            socket.on("db_update", fetchOngoing);
            return () => socket.off("db_update");
        }
    }, [user]);

    const fetchOngoing = async () => {
        try {
            const res = await axios.get(`${BASE_URL}/api/parking/user-current-parking?uid=${user.uid}`);
            setOngoingParking(res.data);
        } catch (err) { console.error(err); }
    };

    const getGreeting = () => {
        const hour = currentTime.getHours();
        if (hour < 12) return "Good Morning";
        if (hour < 18) return "Good Afternoon";
        return "Good Evening";
    };

    // Helper to format countdown timer (MM:SS)
    const formatTimer = (startTime) => {
        const start = new Date(startTime);
        const expiry = new Date(start.getTime() + 10 * 60000);
        const diff = Math.max(0, Math.floor((expiry - currentTime) / 1000));
        const m = Math.floor(diff / 60);
        const s = diff % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    // Live Calculation Logic for Parking Sessions
    const calculateLiveStats = (entryTime, vehicleType) => {
        if (!entryTime) return { timeStr: "00:00:00", cost: "0.00" };
        const start = new Date(entryTime);
        const diffMs = currentTime - start;
        const hours = Math.floor(diffMs / 3600000);
        const minutes = Math.floor((diffMs % 3600000) / 60000);
        const seconds = Math.floor((diffMs % 60000) / 1000);

        const rateObj = charges.find(c => c.vehicleType.toLowerCase() === vehicleType.toLowerCase());
        const perMinuteRate = rateObj ? parseFloat(rateObj.chargingRate) : 0;
        const liveCost = ((diffMs / 60000) * perMinuteRate).toFixed(2);

        return {
            timeStr: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
            cost: liveCost
        };
    };

    if (loading) {
        return (
            <div className="d-flex flex-column align-items-center justify-content-center" style={{ height: "80vh" }}>
                <img src={loadingImg} alt="Logo" style={{ width: "220px", marginBottom: "20px" }} />
                <BounceLoader color="#6199ff" size={50} />
            </div>
        );
    }

    return (
        <>
            <Helmet>
                <title>City Parking | Home</title>
            </Helmet>
            <div className="container py-4" style={{ maxWidth: "900px" }}>

                {/* Banner Section */}
                <div className="position-relative text-white rounded-4 overflow-hidden mb-4 shadow-lg"
                    style={{ height: "280px", background: `url(${bannerImg}) center/cover` }}>
                    <div className="position-absolute w-100 h-100" style={{ background: "rgba(0,0,0,0.3)" }}></div>
                    <div className="position-absolute top-0 end-0 p-3 text-end">
                        {weather && (
                            <div className="d-flex align-items-center gap-2">
                                <span className="fs-3 fw-bold">{weather.temperature}°C</span>
                                <span>{isDay ? <Sun size={32} color="orange" /> : <Moon size={32} color="gray" />}</span>
                            </div>
                        )}
                    </div>
                    <div className="position-absolute bottom-0 start-0 p-4">
                        <h2 className="mb-0 ">{getGreeting()},</h2>
                        <h2 className="fw-light">{user?.displayName ? user.displayName.split(" ").slice(-1)[0] : "Guest"}</h2>
                    </div>
                    <div className="position-absolute bottom-0 end-0 p-4 text-end">
                        <div className="small opacity-75">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        <div className="fw-bold">{currentTime.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                    </div>
                </div>

                {/* Parking Charges Section */}
                <div className="bg-light rounded-4 p-4 mb-4 shadow-sm border border-white">
                    <h6 className="text-primary fw-bold mb-3 text-start">Parking Charges</h6>
                    <div className="d-flex flex-wrap justify-content-start gap-3">
                        {charges.map((item, idx) => (
                            <div key={idx} className="text-center px-3 border-end" style={{ minWidth: '120px' }}>
                                <img src={iconMap[item.vehicleType.toLowerCase()]?.main} alt="" style={{ height: "30px" }} />
                                <div className="small fw-bold mt-2 text-uppercase" style={{ fontSize: '10px' }}>
                                    BDT {item.chargingRate} / {item.timeType === "hourly" ? "hr" : item.timeType}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Ongoing Parking Section */}
                {user && (
                    <div className="bg-light rounded-4 p-4 mb-4 shadow-sm">
                        <h6 className="text-primary fw-bold mb-3 text-start">Your Current Parking</h6>
                        {ongoingParking.length === 0 ? (
                            <div className="text-muted py-3">You have no ongoing parking.</div>
                        ) : (
                            <div className="row g-3">
                                {ongoingParking.map((p) => {
                                    const liveData = calculateLiveStats(p.entryTime, p.vehicleType);
                                    const isCountdownStatus = ["request_booking", "paid"].includes(p.status);

                                    return (
                                        <div key={p._id} className="col-md-6">
                                            <div className="d-flex align-items-center bg-white p-3 rounded-3 shadow-sm border h-100">
                                                <img src={iconMap[p.vehicleType.toLowerCase()]?.top}
                                                    className="me-3"
                                                    style={{ width: "35px", height: "70px", objectFit: "contain" }} />
                                                <div className="text-start small" style={{ flex: 1 }}>
                                                    <div className="fw-bold text-capitalize d-flex justify-content-between">
                                                        <span>{p.vehicleType}</span>
                                                        <span className="text-muted">{p.slotNumber ? `Slot: ${p.slotNumber}` : "Pending Slot"}</span>
                                                    </div>

                                                    <div className="mt-1">
                                                        {p.status === "parked" && (
                                                            <>
                                                                <div>   <Clock size={12} className="me-1" />Entry Time: {new Date(p.entryTime).toLocaleString()}</div>
                                                                <div className="text-primary fw-bold"><Clock size={12} /> Time: {liveData.timeStr}</div>
                                                                <div className="text-success fw-bold">Cost: ৳{liveData.cost}</div>
                                                            </>
                                                        )}

                                                        {isCountdownStatus && (
                                                            <div className="text-primary ">
                                                                <div>   <Clock size={12} className="me-1" />Entry Time: {new Date(p.entryTime).toLocaleString()}</div>
                                                                <div className="text-danger fw-bold animate-pulse"> <Clock size={12} className="me-1" />Timer: {formatTimer(p.status === "request_booking" ? p.booking_time : p.paidAt)}</div>
                                                            </div>
                                                        )}

                                                        {p.status === "repay" && (
                                                            <div className="text-danger fw-bold">
                                                                <AlertTriangle size={12} className="me-1" />
                                                                Action Required: Pay Fine
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="d-flex align-items-center gap-2 mt-2">
                                                        <span className={`badge ${p.status === "parked" ? "bg-success" :
                                                            p.status === "repay" ? "bg-danger" :
                                                                p.status === "paid" ? "bg-info text-white" : "bg-warning text-dark"
                                                            }`}>
                                                            {p.status.replace('_', ' ').toUpperCase()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* Rules and Regulation Section */}
                <div className="bg-white rounded-4 p-4 shadow-sm border">
                    <h4 className="mb-2 text-center border-bottom pb-2">Rules and Regulation</h4>
                    <div className="text-start">
                        {rules.map((rule, idx) => (
                            <div key={idx} className="mb-4">
                                <h6 className="fw-bold text-primary">{idx + 1}. {rule.section_title}</h6>
                                <p className="text-muted small">{rule.message}</p>
                                {rule.point && (
                                    <ul className="list-unstyled ps-3 small text-muted">
                                        {Object.values(rule.point).map((p, i) => (
                                            <li key={i} className="mb-1">• {p}</li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}