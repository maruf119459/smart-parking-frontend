import axios from "axios";
import { useState, useEffect } from "react";
import { auth } from "../firebase";

const GRACE_MINUTES = 10;

export default function ParkingCard({ data }) {
  const [qr, setQr] = useState(null);
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState(null);
  const [duration, setDuration] = useState(null);
  const [rate, setRate] = useState(null);

  const user = auth.currentUser;
  const uid = user?.uid;

  /* -------------------- Load charge rate -------------------- */
  useEffect(() => {
    if (!data?.vehicleType) return;

    axios
      .get("http://localhost:5000/api/charge-control", {
        params: { vehicleType: data.vehicleType }
      })
      .then(res => setRate(res.data.chargePerMinutes))
      .catch(console.error);
  }, [data?.vehicleType]);

  /* ✅ EARLY RETURN MUST BE HERE (after hooks) */
  if (["entance_error", "completed"].includes(data.status)) {
    return null;
  }

  /* -------------------- REAL-TIME AMOUNT CALCULATION -------------------- */
const calculateAmount = async () => {
  const timeRes = await axios.get(
    "http://localhost:5000/api/parking/times",
    { params: { parkingId: data._id } }
  );

  const {
    entryTime,
    paidAt,
    lastExitDeadline
  } = timeRes.data[0];

  const now = new Date();
  const entry = new Date(entryTime);

  const baseMinutes = Math.ceil((now - entry) / 60000);
  let fineMinutes = 0;

  if (paidAt && lastExitDeadline) {
    const deadline = new Date(lastExitDeadline);
    if (now > deadline) {
      fineMinutes = Math.ceil((now - deadline) / 60000);
    }
  }

  const totalMinutes = baseMinutes + fineMinutes;
  setDuration(totalMinutes);

  // ✅ use already-loaded rate
  return (totalMinutes * rate).toFixed(2);
};


  /* -------------------- PAY NOW -------------------- */
  const payNow = async () => {
    try {
      setLoading(true);

      const finalAmount = await calculateAmount();
      setAmount(finalAmount);

      const userRes = await axios.get(
        `http://localhost:5000/api/users/${uid}`
      );

      const { name, phone, email } = userRes.data;

      const res = await axios.post(
        "http://localhost:5000/api/payment/init", 
        {
          parkingId: data._id,
          amount: finalAmount,
          name,
          phone,
          email,
          vehicleType: data.vehicleType
        }
      );

      if (res.data?.GatewayPageURL) {
        window.location.href = res.data.GatewayPageURL;
      } else {
        alert("Payment gateway error");
      }

    } catch (err) {
      console.error(err);
      alert("Payment failed");
    } finally {
      setLoading(false);
    }
  };

  /* -------------------- QR -------------------- */
  const generateEntranceQR = async () => {
    const res = await axios.post(
      "http://localhost:5000/api/qr/entrance",
      data
    );
    setQr(res.data.qr);
  };

  const generateExitQR = async () => {
    const res = await axios.post(
      "http://localhost:5000/api/qr/exit",
      { parkingId: data._id }
    );
    setQr(res.data.qr);
  };

  return (
    <div style={{ border: "1px solid black", padding: 15, margin: 10 }}>
      <div><b>Vehicle:</b> {data.vehicleType}</div>
      <div><b>Status:</b> {data.status}</div>

      {rate && data.status === "parked" && (
        <div><b>Charge:</b> ৳ {rate} / minute</div>
      )}

      {data.status === "parked" && (
        <div style={{ color: "red" }}>
          ⚠️ After payment, Exit within 10 minutes. Else fine applies.
        </div>
      )}
      {data.status === "repay" && (
        <div style={{ color: "red" }}>
          🚩 10 minutes over, Fine applied. Fine = Previous paid amount + additional time stay charge.
        </div>
      )}

      {data.status === "inital" && (
        <button onClick={generateEntranceQR}>Entrance QR</button>
      )}

      {(data.status === "parked" || data.status === "repay") && (
        <button onClick={payNow} disabled={loading}>
          Pay with SSLCommerz
        </button>
      )}

      {amount && (
        <div>
          <div><b>Duration:</b> {duration} minutes</div>
          <div><b>Total:</b> ৳ {amount}</div>
        </div>
      )}

      {data.status === "paid" && (
        <button onClick={generateExitQR}>Exit QR</button>
      )}

      {qr && <img src={qr} alt="QR" width={120} />}
    </div>
  );
}
