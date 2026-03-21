import { useEffect, useState } from "react";
import axios from "axios";
import { socket } from "../socket";
import { useAuth } from "../AuthContext";
import { BounceLoader } from "react-spinners";
import loadingImg from "../assets/loading_img.png";
import {
  ChevronDown, ChevronUp, Download, ChevronLeft, ChevronRight, Search, Calendar
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import html2canvas from "html2canvas";

import busIcon from "../assets/bus_icon.png";
import carIcon from "../assets/car_icon.png";
import bikeIcon from "../assets/bike_icon.png";
import bycycleIcon from "../assets/cycle_icon.png";
import cngIcon from "../assets/cng_icon.png";
import highCarIcon from "../assets/high_car_icon.png";
import miniBusIcon from "../assets/mini_bus_icon.png";
import miniTruckIcon from "../assets/mini_truck_icon.png";
import truckIcon from "../assets/truck_icon.png";

const vehicleIcons = {
  bike: bikeIcon,
  car: carIcon,
  "high_car": highCarIcon,
  "mini_bus": miniBusIcon,
  bus: busIcon,
  truck: truckIcon,
  "mini_truck": miniTruckIcon,
  cng: cngIcon, 
  bicycle: bycycleIcon
};

export default function History() {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [paymentDetails, setPaymentDetails] = useState({});

  // Search States
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const loadHistory = async () => {
    try {
      setLoading(true);
      let url = `http://localhost:5000/api/parking/user-history?uid=${user.uid}`;
      
      if (startDate && endDate) {
        url += `&startDate=${startDate}&endDate=${endDate}`;
      }

      const res = await axios.get(url);
      setHistory(res.data);
      setCurrentPage(1); 
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleDetails = async (parkingId) => {
    if (expandedId === parkingId) {
      setExpandedId(null);
      return;
    }
    try {
      if (!paymentDetails[parkingId]) {
        const res = await axios.get(`http://localhost:5000/api/payments/${parkingId}`);
        setPaymentDetails(prev => ({ ...prev, [parkingId]: res.data }));
      }
      setExpandedId(parkingId);
    } catch (err) { console.error(err); }
  };

  const downloadInvoice = async (h) => {
    let currentPayments = paymentDetails[h._id];
    if (!currentPayments) {
      try {
        const res = await axios.get(`http://localhost:5000/api/payments/${h._id}`);
        currentPayments = res.data;
        setPaymentDetails(prev => ({ ...prev, [h._id]: res.data }));
      } catch (err) {
        console.error("Failed to fetch payments for invoice:", err);
        return;
      }
    }

    setTimeout(async () => {
      const element = document.getElementById(`invoice-template-${h._id}`);
      if (!element) return;
      element.style.display = "block";
      const canvas = await html2canvas(element, { scale: 3, useCORS: true });
      const data = canvas.toDataURL("image/png");
      const link = document.createElement('a');
      link.href = data;
      link.download = `Invoice_${h._id}.png`;
      link.click();
      element.style.display = "none";
    }, 100);
  };

  useEffect(() => {
    if (!user) return;
    loadHistory();
    socket.on("db_update", loadHistory);
    return () => socket.off("db_update");
  }, [user]);

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = history.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(history.length / itemsPerPage);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo(0, 0);
  };

  if (loading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center" style={{ height: "80vh" }}>
        <img src={loadingImg} alt="Logo" style={{ width: "220px", marginBottom: "20px" }} />
        <BounceLoader color="#6199ff" size={50} />
      </div>
    );
  }
console.log("History:", history);
  return (
    <div className="container py-4" style={{ maxWidth: '640px' }}>
      <h2 className="fw-bold display-6 text-center">Parking History</h2>

      {/* Date Search Section */}
      <div className="card border-0 shadow-sm p-3 mb-4" style={{ borderRadius: '15px' }}>
        <div className="row g-2 align-items-end">
          <div className="col-5">
            <label className="small fw-bold text-muted mb-1 ml-1">From Date</label>
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-white border-end-0"><Calendar size={14} /></span>
              <input 
                type="date" 
                className="form-control border-start-0 ps-0" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)} 
              />
            </div>
          </div>
          <div className="col-5">
            <label className="small fw-bold text-muted mb-1 ml-1">To Date</label>
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-white border-end-0"><Calendar size={14} /></span>
              <input 
                type="date" 
                className="form-control border-start-0 ps-0" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)} 
              />
            </div>
          </div>
          <div className="col-2">
            <button 
              className="btn btn-primary btn-sm w-100 py-2 d-flex align-items-center justify-content-center" 
              onClick={loadHistory}
              disabled={!startDate || !endDate}
            >
              <Search size={18} />
            </button>
          </div>
        </div>
        {(startDate || endDate) && (
          <button 
            className="btn btn-link btn-sm text-decoration-none p-0 mt-2 text-muted" 
            onClick={() => { setStartDate(""); setEndDate(""); loadHistory(); }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {currentItems.length > 0 ? (
        currentItems.map((h) => {
          const isCanceled = h.status === "canceled";
          const payments = paymentDetails[h._id] || [];
          const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

          return (
            <motion.div
              layout
              key={h._id}
              className="card border-0 shadow-sm mb-3"
              style={{
                borderRadius: '12px',
                backgroundColor: isCanceled ? '#ffebeb' : '#ffffff'
              }}
            >
              <div className="card-body p-3">
                <div className="d-flex justify-content-between">
                  <div className="text-start">
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <span className="text-primary">
                        <img src={vehicleIcons[h.vehicleType.toLowerCase()]} alt="" style={{ height: "30px" }} />
                      </span>
                      <h6 className="mb-0 fw-bold ">{h.vehicleType.charAt(0).toUpperCase() + h.vehicleType.slice(1)} - {h.slotNumber} </h6>
                    </div>

                    <div className="small text-muted d-flex flex-column gap-1">
                      <span><b>Status:</b> {isCanceled ? "Canceled 😟" : "Completed 😊"}</span>
                      <span><b>Booked:</b> {new Date(h.booking_time).toLocaleString()}</span>
                      <span><b>Entry:</b> {h.entryTime ? new Date(h.entryTime).toLocaleString() : "-"}</span>
                      <span><b>Exit:</b> {h.exitTime ? new Date(h.exitTime).toLocaleString() : "-"}</span>
                    </div>
                  </div>

                  {!isCanceled && (
                    <div className="d-flex flex-column justify-content-between align-items-end">
                      <button className="btn btn-outline-primary btn-sm border-0" onClick={() => downloadInvoice(h)}>
                        <Download size={20} />
                      </button>
                      <button className="btn btn-light btn-sm rounded-circle shadow-sm" onClick={() => toggleDetails(h._id)}>
                        {expandedId === h._id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                    </div>
                  )}
                </div>

                <AnimatePresence>
                  {expandedId === h._id && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-3 pt-3 border-top">
                      <div className="d-flex justify-content-between fw-bold pb-2">
                        <span>Parking Rate</span>
                        <span className="text-primary">{h.parkingRate}</span>
                      </div>
                      {payments.map((p, idx) => (
                        <div key={idx} className="mb-3 small pb-2 border-bottom border-light">
                          <div className="text-muted">Transaction ID: {p.tran_id}</div>
                          <div className="text-muted">Bank Name: {p.bankName ||'-'}</div>
                          <div className="text-muted">Account Type: {p.accountType ||'-'}</div>
                          <div className="text-muted">Customer Phone: {p.cus_phone}</div>
                          <div className="text-muted">Paid at: {new Date(p.paidAt).toLocaleString('en-GB', { day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}</div>
                          <div className="d-flex justify-content-between fw-bold mt-1">
                            <span>Paid Amount</span>
                            <span className="text-success">৳{p.amount}</span>
                          </div>
                        </div>
                      ))}
                      <div className="d-flex justify-content-between fw-bold pt-2">
                        <span>Total Payment</span>
                        <span className="text-primary">৳{totalPaid.toFixed(2)}</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <InvoiceTemplate id={`invoice-template-${h._id}`} h={h} payments={payments} total={totalPaid} user={user} />
            </motion.div>
          );
        })
      ) : (
        <div className="text-center py-5 text-muted">
          No history found for the selected range.
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <nav className="d-flex justify-content-center mt-4">
          <ul className="pagination pagination-sm gap-1">
            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
              <button className="page-link rounded-circle border-0 shadow-sm" onClick={() => paginate(currentPage - 1)}>
                <ChevronLeft size={18} />
              </button>
            </li>

            {[...Array(totalPages)].map((_, i) => (
              <li key={i} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
                <button 
                  className={`page-link rounded-circle border-0 shadow-sm mx-1 ${currentPage === i + 1 ? 'bg-primary text-white' : 'bg-white text-dark'}`} 
                  onClick={() => paginate(i + 1)}
                  style={{ width: '35px', height: '35px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  {i + 1}
                </button>
              </li>
            ))}

            <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
              <button className="page-link rounded-circle border-0 shadow-sm" onClick={() => paginate(currentPage + 1)}>
                <ChevronRight size={18} />
              </button>
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
}

function InvoiceTemplate({ id, h, payments, total, user }) {
  const formatDate = (date) => date ? new Date(date).toLocaleString('en-GB', { day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }) : "-";

  const totalParkingTime = () => {
    if (!h.entryTime || !h.exitTime) return "-";
    const diff = new Date(h.exitTime) - new Date(h.entryTime);
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div id={id} style={{ display: 'none', width: '700px', padding: '50px', backgroundColor: 'white' }}>
      <div className="d-flex justify-content-between align-items-start mb-2">
        <img src={loadingImg} alt="Logo" style={{ width: '120px' }} />
        <div className="text-end">
          <h1 className="fw-bold mb-0" style={{ color: '#2c3e50', fontSize: '32px' }}>INVOICE</h1>
          <p className="text-muted small">Date: {new Date().toLocaleDateString()}</p>
        </div>
      </div>
      <hr style={{ border: '1px solid #eee' }} />
      <div className="py-3">
        {[
          ["Customer Name", h?.name || "N/A"],
          ["Customer Phone", h?.phone || "N/A"],
          ["Email Address", user?.email || h.email || "N/A"],
          ["Vehicle Type", h.vehicleType],
          ["Parking Rate", h.parkingRate],
          ["Slot Number", h.slotNumber],
          ["Booking Time", formatDate(h.booking_time)],
          ["Entry Time", formatDate(h.entryTime)],
          ["Exit Time", formatDate(h.exitTime)],
          ["Total Parking Time", totalParkingTime()],
          ["Bank Name", payments.map(p => p.bankName || '-').join(", ")],
          ["Account Type", payments.map(p => p.accountType || '-').join(", ")],
          ["Transaction ID", payments.map(p => p.tran_id).join(", ")],
          ["Paid Amount", payments.map(p => `৳${p.amount}`).join(", ")],
          ["Paid At", payments.map(p => formatDate(p.paidAt)).join(", ")],
          ["Account Number", payments.map(p => p.cus_phone).join(", ")]
        ].map(([label, value], idx) => (
          <div key={idx} className="row border-bottom py-2 mx-0" style={{ backgroundColor: idx % 2 === 0 ? '#fcfcfc' : 'transparent' }}>
            <div className="col-5 fw-bold text-muted">{label}</div>
            <div className="col-7 text-dark">{value}</div>
          </div>
        ))}
      </div>
      <div className="d-flex justify-content-end mt-4">
        <div className="text-end p-3 rounded" style={{ backgroundColor: '#f8f9fa', width: '250px' }}>
          <span className="fw-bold text-muted">Total Paid</span>
          <h3 className="fw-bold text-primary mb-0">৳{total.toFixed(2)}</h3>
        </div>
      </div>
      <hr className="mt-5" />
      <div className="text-center text-muted small">
        <p className="mb-1">Thank you for using City Parking!</p>
        <p className="fw-bold">Contact: cityparkinghelp@gmail.com | +880 1715-XXXXXX</p>
      </div>
    </div>
  );
}