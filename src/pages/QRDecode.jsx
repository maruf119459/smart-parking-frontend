import { useState } from "react";
import axios from "axios";

export default function QRDecode() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [decoded, setDecoded] = useState(null);
  const [loading, setLoading] = useState(false);

  // Handle image select
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result); // base64
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Send image to backend
  const decodeQR = async () => {
    if (!image) return alert("Please upload a QR image");

    try {
      setLoading(true);
      const res = await axios.post(
        "https://city-parking-backend.onrender.com/api/qr/decode",
        { image }
      );

    } catch (error) {
      console.error(error);
      alert("QR decode failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 400 }}>
      <h2>QR Decode Test</h2>

      <input type="file" accept="image/*" onChange={handleImageChange} />

      {preview && (
        <div style={{ marginTop: 10 }}>
          <img src={preview} alt="QR Preview" width="200" />
        </div>
      )}

      <button onClick={decodeQR} disabled={loading} style={{ marginTop: 10 }}>
        {loading ? "Decoding..." : "Decode QR"}
      </button>

      {decoded && (
        <div style={{ marginTop: 15 }}>
          <h4>Decoded QR Data</h4>
          <pre>{JSON.stringify(decoded, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
