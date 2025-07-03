import { io } from "socket.io-client";
import { Platform } from "react-native";

// For React Native, we need to use the actual IP address instead of localhost
const getSocketUrl = () => {
  if (process.env.EXPO_PUBLIC_SOCKET_URL) {
    return process.env.EXPO_PUBLIC_SOCKET_URL;
  }

  // Use your computer's IP address instead of localhost for React Native
  // You'll need to replace this with your actual IP address
  if (Platform.OS === "ios" || Platform.OS === "android") {
    return "http://192.168.137.1:3001"; // Replace with your computer's IP
  }

  return "http://localhost:3001";
};

const SOCKET_URL = getSocketUrl();

// Create a socket instance that will be reused throughout the app
const socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ["websocket", "polling"], // Add polling as fallback
  timeout: 20000,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

// Connect to the socket server
export const connectSocket = () => {
  if (!socket.connected) {
    console.log("Attempting to connect to socket server at:", SOCKET_URL);
    socket.connect();

    socket.on("connect", () => {
      console.log("Driver socket connected successfully");
    });

    socket.on("connect_error", (error) => {
      console.log("Driver socket connection error:", error);
      console.log("Socket URL:", SOCKET_URL);
      console.log("Make sure the socket server is running and accessible");
    });

    socket.on("disconnect", (reason) => {
      console.log("Driver socket disconnected:", reason);
    });

    socket.on("reconnect", (attemptNumber) => {
      console.log("Driver socket reconnected after", attemptNumber, "attempts");
    });

    socket.on("reconnect_error", (error) => {
      console.log("Driver socket reconnection failed:", error);
    });
  }
};

// Disconnect from the socket server
export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
    console.log("Socket disconnected");
  }
};

// Emit driver location update
export const emitDriverLocationUpdate = (
  orderId: string,
  latitude: number,
  longitude: number,
  heading: number | null
) => {
  const locationData = {
    orderId,
    location: {
      latitude,
      longitude,
      heading,
      timestamp: Date.now(),
    },
  };

  console.log("Emitting driver location update:", locationData);
  console.log("Socket connected:", socket.connected);

  socket.emit("driver_location_update", locationData);
};

// Emit route data to customer
export const emitRouteUpdate = (
  orderId: string,
  routeCoordinates: { latitude: number; longitude: number }[],
  routeDistance: string,
  routeDuration: string
) => {
  const routeData = {
    orderId,
    route: {
      coordinates: routeCoordinates,
      distance: routeDistance,
      duration: routeDuration,
      timestamp: Date.now(),
    },
  };

  console.log("Emitting route update:", routeData);
  socket.emit("route_update", routeData);
};

// Export the socket instance
export default socket;
