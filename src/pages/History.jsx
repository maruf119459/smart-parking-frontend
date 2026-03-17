import { useEffect, useState } from "react";
import axios from "axios";
import { socket } from "../socket";
import { useAuth } from "../AuthContext";
import { BounceLoader } from "react-spinners";
import loadingImg from "../assets/loading_img.png";
import {
  ChevronDown, ChevronUp, Download, Car, Bike, Bus,
  Truck, Info
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import html2canvas from "html2canvas";

// Vehicle Icon Mapping
const vehicleIcons = {
  bike: <Bike size={22} />,
  car: <Car size={22} />,
  "high car": <Car size={22} />,
  "mini bus": <Bus size={22} />,
  bus: <Bus size={22} />,
  truck: <Truck size={22} />,
  "mini truck": <Truck size={22} />,
  cng: <Info size={22} />, 
  bicycle: <Bike size={22} />
};

export default function History() {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [paymentDetails, setPaymentDetails] = useState({});

  console.log(history)

  const loadHistory = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`http://localhost:5000/api/parking/user-history?uid=${user.uid}`);
      setHistory(res.data);
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

  if (loading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center" style={{ height: "80vh" }}>
        <img src={loadingImg} alt="Logo" style={{ width: "220px", marginBottom: "20px" }} />
        <BounceLoader color="#6199ff" size={50} />
      </div>
    );
  }

  return (
    <div className="container py-4" style={{ maxWidth: '640px' }}>
      <h2 className="fw-bold mb-4 text-center" style={{ color: '#4a4a8a', fontStyle: 'italic' }}>Parking History</h2>

      {history.map((h) => {
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
                {/* Information Column */}
                <div className="text-start">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <span className="text-primary">
                      {vehicleIcons[h.vehicleType?.toLowerCase()] || <Car size={22} />}
                    </span>
                    <h6 className="mb-0 fw-bold text-uppercase">{h.vehicleType} - {h.slotNumber}</h6>
                  </div>

                  <div className="small text-muted d-flex flex-column gap-1">
                    <span><b>Status:</b> {isCanceled ? "Canceled 😟" : "Completed 😊"}</span>
                    <span><b>Booked:</b> {new Date(h.booking_time).toLocaleString()}</span>
                    <span><b>Entry:</b> {h.entryTime ? new Date(h.entryTime).toLocaleString() : "-"}</span>
                    <span><b>Exit:</b> {h.exitTime ? new Date(h.exitTime).toLocaleString() : "-"}</span>
                  </div>
                </div>

                {/* Actions Column */}
                {!isCanceled && (
                  <div className="d-flex flex-column justify-content-between align-items-end">
                    <button
                      className="btn btn-outline-primary btn-sm border-0"
                      onClick={() => downloadInvoice(h)} // Pass the whole object 'h'
                    >
                      <Download size={20} />
                    </button>
                    <button className="btn btn-light btn-sm rounded-circle shadow-sm" onClick={() => toggleDetails(h._id)}>
                      {expandedId === h._id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                  </div>
                )}
              </div>

              {/* Payment Details Drawer */}
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

            {/* Hidden Invoice Template */}
            <InvoiceTemplate id={`invoice-template-${h._id}`} h={h} payments={payments} total={totalPaid} user={user} />
          </motion.div>
        );
      })}
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
      {/* Header */}
      <div className="d-flex justify-content-between align-items-start mb-2">
        <img src={loadingImg} alt="Logo" style={{ width: '120px' }} />
        <div className="text-end">
          <h1 className="fw-bold mb-0" style={{ color: '#2c3e50', fontSize: '32px' }}>INVOICE</h1>
          <p className="text-muted small">Date: {new Date().toLocaleDateString()}</p>
        </div>
      </div>

      <hr style={{ border: '1px solid #eee' }} />

      {/* Grid Data */}
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