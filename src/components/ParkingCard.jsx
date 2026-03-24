import axios from "axios";
import { useState, useEffect } from "react";
import { auth } from "../firebase";
import { QrCode, CreditCard, Clock, AlertTriangle, Calendar, Ban } from "lucide-react";
import { toast } from "react-toastify";
import { BounceLoader } from "react-spinners";
import loadingImg from "../assets/loading_img.png";

export default function ParkingCard({ data, dbUser }) {
  const [qr, setQr] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false); // New state for cancel modal
  const [liveCost, setLiveCost] = useState("0.00");
  const [liveDuration, setLiveDuration] = useState(0);
  const [rate, setRate] = useState(0);
  const [timeLeft, setTimeLeft] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  
  const [fineAmount, setFineAmount] = useState(100);
  const [additionalMinutes, setAdditionalMinutes] = useState(0);
  const [totalRepayFee, setTotalRepayFee] = useState(0);
  const [currentCharge, setCurrentCharge] = useState(0);

  const BASE_URL = "https://smart-parking-backend-u47b.onrender.com";


  const user = auth.currentUser;

  useEffect(() => {
    if (!data?.vehicleType) return;
    axios.get(`${BASE_URL}/api/vehicle-types-and-charges`)
      .then(res => {
        const match = res.data.find(v => v.vehicleType.toLowerCase() === data.vehicleType.toLowerCase());
        if (match) setRate(match.chargingRate);
      });

    axios.get(`${BASE_URL}/api/payments/${data._id}`)
      .then(res => {
        setPaymentHistory(res.data);
        if (data.status === "repay" && res.data.length > 0) {
          const lastPayment = res.data[res.data.length - 1];
          const calculatedFine = lastPayment.amount / 2;
          setFineAmount(calculatedFine <= 100 ? 100 : calculatedFine);
        }
      })
      .catch(() => setPaymentHistory([]));
  }, [data._id, data.vehicleType, data.status]);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      if (data.status === "parked" && data.entryTime) {
        const entry = new Date(data.entryTime);
        const diffMinutes = Math.floor((now - entry) / 60000);
        setLiveDuration(diffMinutes);
        setLiveCost((diffMinutes * rate).toFixed(2));
      }

      if (data.status === "repay" && paymentHistory.length > 0) {
        const lastPayment = paymentHistory[paymentHistory.length - 1];
        const lastPaidAt = new Date(lastPayment.paidAt || lastPayment.tran_date);
        const addMins = Math.max(0, Math.floor((now - lastPaidAt) / 60000));
        const currentCharge = addMins * rate;
        setCurrentCharge(currentCharge.toFixed(2));
        setAdditionalMinutes(addMins);
        setTotalRepayFee((fineAmount + currentCharge).toFixed(2));
      }

      if (data.status === "request_booking" || data.status === "paid") {
        const startTime = data.status === "request_booking" ? new Date(data.booking_time) : new Date(data.paidAt);
        const expiryTime = new Date(startTime.getTime() + 10 * 60000);
        const secondsLeft = Math.max(0, Math.floor((expiryTime - now) / 1000));
        setTimeLeft(secondsLeft);
        if (secondsLeft === 0) handleAutoUpdate(data.status);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [data, rate, paymentHistory, fineAmount]);

  const handleAutoUpdate = async (currentStatus) => {
    const nextStatus = currentStatus === "request_booking" ? "canceled" : "repay";
    try {
      await axios.patch(`${BASE_URL}/api/parking/${data._id}`, { status: nextStatus });
    } catch (err) { console.error(err); }
  };

  const confirmCancelRequest = async () => {
    try {
      await axios.patch(`${BASE_URL}/api/parking/${data._id}`, { status: "canceled" });
      toast.info("Booking request canceled.");
      setShowCancelConfirm(false);
    } catch (err) { toast.error("Failed to cancel request."); }
  };

  const generateQR = async (type) => {
    setQrLoading(true);
    setShowModal(true);
    try {
      const url = type === 'entrance' ? `${BASE_URL}/api/qr/entrance` : `${BASE_URL}/api/qr/exit`;
      const res = await axios.post(url, type === 'entrance' ? data : { parkingId: data._id });
      setQr(res.data.qr);
    } catch (err) {
      toast.error("QR Generation failed");
      setShowModal(false);
    } finally { setQrLoading(false); }
  };

  const handlePayment = async () => {
    const finalAmount = data.status === "repay" ? totalRepayFee : liveCost;
    try {
      const res = await axios.post(`${BASE_URL}/api/payment/init`, {
        parkingId: data._id, amount: finalAmount,
        name: user?.displayName || dbUser?.name,
        uid: user?.uid,
        email: user?.email || dbUser?.email,
        phone: user?.phoneNumber || dbUser?.phone,
        vehicleType: data.vehicleType
      });
      if (res.data?.GatewayPageURL) window.location.href = res.data.GatewayPageURL;
    } catch (err) { toast.error("Payment failed."); }
  };

  const formatDuration = (totalMinutes) => {
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${hours}h:${mins}m`;
  };

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const formatTime = (mins) => `${Math.floor(mins / 60)}h:${mins % 60}m`;

  if (["canceled", "completed"].includes(data.status)) return null;

  return (
    <>
      <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-3 bg-white border-start border-4"
        style={{ borderLeftColor: data.status === 'parked' ? '#0d6efd' : data.status === 'repay' ? '#dc3545' : '#ffc107' }}>
        <div className="card-body p-4">
          <div className="row align-items-center">
            <div className="col-md-7 text-start">
              <div className="d-flex align-items-center mb-2">
                <span className="badge bg-primary-subtle text-primary text-uppercase me-2 px-3 py-2">{data.vehicleType}</span>
                <span className={`badge ${data.status === 'parked' ? 'bg-success' : data.status === 'repay' ? 'bg-danger' : 'bg-warning text-dark'}`}>
                  {data.status.replace('_', ' ')}
                </span>
              </div>
              <h5 className="fw-bold mb-1">Slot: {data.slotNumber || "Slot Assigned After Entrance"}</h5>
              <div className="text-muted small">
                {data.status === "request_booking" && (
                  <div className="mt-2 p-2 rounded">
                    <div><Clock size={14} /> <b>Booking:</b> {new Date(data.booking_time).toLocaleString()}</div>
                    <div><Calendar size={14} /> <b>Est. Entry Deadline:</b> {new Date(new Date(data.booking_time).getTime() + 10 * 60000).toLocaleTimeString()}</div>
                    <div className="text-danger mt-1"><AlertTriangle size={12} /> Entry within 10 mins or cancellation.</div>
                  </div>
                )}
                {data.status === 'parked' && (
                  <>
                    <div><Clock size={14} /> <b>Entry:</b> {new Date(data.entryTime).toLocaleString()}</div>
                    <div><AlertTriangle size={14} /> <b>Rate:</b> {data.parkingRate}</div>
                  </>
                )}
                {data.status === 'paid' && (
                  <>
                    <div><Clock size={14} /> <b>Entry:</b> {new Date(data.entryTime).toLocaleString()}</div>
                    <div className="text-danger mt-1"><AlertTriangle size={12} /> <b>Note:</b> Fail to enter within 10 mins will result in fine will be applicable.</div>
                    <div><CreditCard size={14} /> <b>{paymentHistory.length > 1 ? "Repaid At:" : "Paid At:"}</b> {new Date(data.paidAt).toLocaleString()}</div>
                    <div className="text-primary fw-bold mt-1"><Clock size={14} /> <b>Exit Deadline:</b> {new Date(new Date(data.paidAt).getTime() + 10 * 60000).toLocaleTimeString()}</div>
                  </>
                )}
                {data.status === "repay" && (
                  <div className="mt-2">
                    <div><b>Entry:</b> {new Date(data.entryTime).toLocaleString()}</div>
                    <div><b>Last Exit Deadline:</b> {new Date(new Date(paymentHistory[paymentHistory.length-1]?.paidAt || Date.now()).getTime() + 10 * 60000).toLocaleTimeString()}</div>
                    <div className="text-danger fw-bold">Outstanding Time: {formatTime(additionalMinutes)}</div>
                    <div className="text-danger fw-bold">Fine: ৳{fineAmount} | Current Charge : ৳{currentCharge}</div>
                  </div>
                )}
              </div>
            </div>

            <div className="col-md-5 text-start text-md-end mt-3 mt-md-0">
              {data.status === "parked" && (
                <div>
                  <div className="small text-muted mb-1">Stayed: {formatDuration(liveDuration)}</div>
                  <h3 className="fw-bold text-primary mb-3">৳ {liveCost}</h3>
                  <button onClick={handlePayment} className="btn btn-dark rounded-pill px-4 fw-bold shadow-sm w-100 w-md-auto">
                    <CreditCard size={18} className="me-2" /> Pay Now
                  </button>
                </div>
              )}

              {timeLeft !== null && (data.status === "request_booking" || data.status === "paid") && (
                <div className="d-flex flex-column align-items-start align-items-md-end gap-2">
                  <div className="small fw-bold text-danger animate-pulse">Timer: {formatTimer(timeLeft)}</div>
                  
                  {/* Flex container that changes behavior based on screen size */}
                  <div className={`d-flex ${data.status === "request_booking" ? "flex-row flex-md-column" : ""} gap-2 w-100 justify-content-start justify-content-md-end`}>
                    <button onClick={() => generateQR(data.status === 'paid' ? 'exit' : 'entrance')}
                      className="btn btn-primary rounded-pill px-4 fw-bold shadow-sm w-100 w-md-auto order-1">
                      <QrCode size={18} className="me-2" /> {data.status === 'paid' ? "Get QR" : "Get QR"}
                    </button>
                    
                    {data.status === "request_booking" && (
                      <button onClick={() => setShowCancelConfirm(true)} 
                        className="btn btn-outline-danger rounded-pill px-4 fw-bold w-100 w-md-auto order-2">
                        <Ban size={18} className="me-1" /> Cancel
                      </button>
                    )}
                  </div>
                </div>
              )}

              {data.status === "repay" && (
                <div>
                  <div className="small text-danger fw-bold mb-1">Total Fee</div>
                  <h3 className="fw-bold text-danger mb-3">৳ {totalRepayFee}</h3>
                  <button onClick={handlePayment} className="btn btn-danger rounded-pill px-4 fw-bold shadow-sm w-100 w-md-auto">
                    <CreditCard size={18} className="me-2" /> Pay Fine
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CANCELLATION CONFIRMATION MODAL */}
      {showCancelConfirm && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4">
              <div className="modal-body text-center p-5">
                <AlertTriangle size={48} className="text-warning mb-3" />
                <h5 className="fw-bold mb-3">Cancel Booking?</h5>
                <p className="text-muted">Are you sure you want to cancel this booking request?</p>
                <div className="d-flex gap-3 justify-content-center mt-4">
                  <button className="btn btn-danger rounded-pill px-4 fw-bold" onClick={confirmCancelRequest}>Yes, Cancel</button>
                  <button className="btn btn-light rounded-pill px-4 fw-bold" onClick={() => setShowCancelConfirm(false)}>No, Keep it</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR MODAL */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 shadow-lg">
              <div className="modal-header border-0 bg-light rounded-top-4">
                <h5 className="modal-title fw-bold">Scan at Gate</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body text-center py-5">
                {qrLoading ? (
                  <div className="py-4">
                    <img src={loadingImg} alt="Logo" className="mb-3" style={{ width: "150px" }} />
                    <BounceLoader className="mx-auto" color="#6199ff" size={40} />
                    <p className="mt-3 text-muted fw-bold">Generating Secure QR...</p>
                  </div>
                ) : (
                  <>
                    <img src={qr} alt="QR" className="img-fluid rounded-3 shadow-sm border p-3 bg-white" style={{ width: "240px" }} />
                    <p className="mt-4 text-muted small px-3">This QR is valid for 10 minutes.</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
