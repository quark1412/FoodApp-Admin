import { createContext, useContext, useState, useEffect } from "react";
import * as Location from "expo-location";

export interface DriverLocation {
  latitude: number;
  longitude: number;
  timestamp: number;
}

export interface TrackingInfo {
  orderId: string;
  status: "Đang chờ" | "Đã nhận đơn" | "Đang xử lý" | "Đang giao" | "Đã giao";
  driverLocation: DriverLocation | null;
  estimatedTime: number | null;
  distance: number | null;
}

interface OrderTrackingContextType {
  trackingInfo: TrackingInfo | null;
  updateDriverLocation: (location: DriverLocation) => void;
  startTracking: (orderId: string) => void;
  stopTracking: () => void;
}

const OrderTrackingContext = createContext<OrderTrackingContextType>({
  trackingInfo: null,
  updateDriverLocation: () => {},
  startTracking: () => {},
  stopTracking: () => {},
});

export const useOrderTracking = () => useContext(OrderTrackingContext);

export function OrderTrackingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [trackingInfo, setTrackingInfo] = useState<TrackingInfo | null>(null);
  const [userLocation, setUserLocation] =
    useState<Location.LocationObject | null>(null);

  useEffect(() => {
    // Get user's location
    const getUserLocation = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      const location = await Location.getCurrentPositionAsync({});
      setUserLocation(location);
    };

    getUserLocation();
  }, []);
  // Store the last API call time to limit request frequency
  const [lastApiCallTime, setLastApiCallTime] = useState<number>(0);
  // Minimum time between API calls in milliseconds (30 seconds)
  const MIN_API_CALL_INTERVAL = 30000;
  // Threshold for significant movement to trigger an update (in degrees, roughly 100m)
  const MOVEMENT_THRESHOLD = 0.001;
  // Cache for last location that triggered an API call
  const [lastApiLocation, setLastApiLocation] = useState<DriverLocation | null>(
    null
  );

  const updateDriverLocation = (location: DriverLocation) => {
    if (!trackingInfo) return;

    // Always update the driver location in state
    setTrackingInfo((prev) =>
      prev
        ? {
            ...prev,
            driverLocation: location,
          }
        : null
    );

    // Check if we should make an API call based on time and distance
    const currentTime = Date.now();
    const timeSinceLastCall = currentTime - lastApiCallTime;

    // Only make API calls when necessary
    const shouldCallApi =
      // If this is the first update
      !lastApiLocation ||
      // Or if enough time has passed since the last call
      timeSinceLastCall > MIN_API_CALL_INTERVAL ||
      // Or if the driver has moved significantly
      Math.abs(location.latitude - lastApiLocation.latitude) >
        MOVEMENT_THRESHOLD ||
      Math.abs(location.longitude - lastApiLocation.longitude) >
        MOVEMENT_THRESHOLD;

    if (shouldCallApi && userLocation?.coords) {
      // Calculate distance and ETA using Google Maps Distance Matrix API
      const calculateDistanceAndETA = async () => {
        try {
          console.log("Making Distance Matrix API call");
          setLastApiCallTime(currentTime);
          setLastApiLocation(location);

          // Implement request timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000);

          try {
            const response = await fetch(
              `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${location.latitude},${location.longitude}&destinations=${userLocation?.coords.latitude},${userLocation?.coords.longitude}&key=${process.env.GOOGLE_MAPS_API_KEY}`,
              { signal: controller.signal }
            );
            clearTimeout(timeoutId);

            const data = await response.json();

            if (data.rows[0]?.elements[0]?.status === "OK") {
              const { distance, duration } = data.rows[0].elements[0];
              setTrackingInfo((prev) =>
                prev
                  ? {
                      ...prev,
                      driverLocation: location,
                      distance: distance.value,
                      estimatedTime: Math.ceil(duration.value / 60),
                    }
                  : null
              );
            }
          } catch (error: any) {
            clearTimeout(timeoutId);
            if (error?.name === "AbortError") {
              console.log("Distance Matrix API request timed out");
            } else {
              console.log("Error calculating distance:", error);
            }
          }
        } catch (error) {
          console.log("Error in calculateDistanceAndETA:", error);
        }
      };

      calculateDistanceAndETA();
    }
  };

  const startTracking = (orderId: string) => {
    setTrackingInfo({
      orderId,
      status: "Đang chờ",
      driverLocation: null,
      estimatedTime: null,
      distance: null,
    });
  };

  const stopTracking = () => {
    setTrackingInfo(null);
  };

  return (
    <OrderTrackingContext.Provider
      value={{
        trackingInfo,
        updateDriverLocation,
        startTracking,
        stopTracking,
      }}
    >
      {children}
    </OrderTrackingContext.Provider>
  );
}
