import { io } from "socket.io-client";
const socket = io("https://smart-parking-backend-u47b.onrender.com", {
  transports: ["websocket", "polling"],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 2000,
  timeout: 10000,
  withCredentials: true
});
export default socket;