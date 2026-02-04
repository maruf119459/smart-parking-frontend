import { useEffect, useState } from "react";
import axios from "axios";
import { socket } from "../socket";
import { useAuth } from "../AuthContext";

export default function History() {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = async () => {
    try {
      setLoading(true);

      const res = await axios.get(
        `http://localhost:5000/api/parking/user-history?uid=${user.uid}`
      );

      setHistory(res.data);
      console.log("user history "+res.data)
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    console.log("hitory " +user.uid)

    loadHistory();
    socket.on("db_update", loadHistory);

    return () => socket.off("db_update");
  }, [user]);

  return (
    <div style={{ textAlign: "center", marginTop: "10px" }}>
      <h2>Parking History</h2>

      {loading && <p>Loading...</p>}

      {!loading && history.length === 0 && (
        <p>No history found</p>
      )}

      {history.map(h => (
        <div
          key={h._id}
          style={{
            border: "1px solid gray",
            margin: "10px",
            padding: "10px",
            borderRadius: "6px"
          }}
        >
          <div><b>Vehicle:</b> {h.vehicleType}</div>
          <div>
            <b>Status:</b>{" "}
            {h.status === "completed" ? "✅ Completed" : "❌ Entrance Error"}
          </div>
          <div>
            <b>Entry:</b>{" "}
            {h.entryTime
              ? new Date(h.entryTime).toLocaleString()
              : "-"}
          </div>
          <div>
            <b>Exit:</b>{" "}
            {h.exitTime
              ? new Date(h.exitTime).toLocaleString()
              : "-"}
          </div>
        </div>
      ))}
    </div>
  );
}
