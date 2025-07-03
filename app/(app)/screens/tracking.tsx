import { useEffect, useState, useRef } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  Text,
  View,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
  Dimensions,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { getOrderById } from "@/services/orders";
import { Order } from "@/types/order";
import MapView, {
  Marker,
  PROVIDER_GOOGLE,
  Polyline,
  MapViewProps,
  Camera,
  Callout,
} from "react-native-maps";
import * as Location from "expo-location";
import {
  createCoordinate,
  updateCoordinateById,
  getCoordinateByOrderId,
} from "@/services/coordinates";
import {
  ORDER_STATUS,
  DELIVERY_RADIUS,
  STEP_COMPLETION_RADIUS,
} from "@/constants/order";
import { updateDeliveryInfoById } from "@/services/orders";
import { getUserAddressById } from "@/services/userAddresses";
import { Ionicons } from "@expo/vector-icons";
import {
  connectSocket,
  emitDriverLocationUpdate,
  emitRouteUpdate,
} from "@/services/socket";

// Set of constants for tile prefetching algorithm
const PREFETCH_AHEAD_MULTIPLIER = 3; // How far ahead to prefetch based on speed
const DIRECTION_LOOK_AHEAD = 5; // Points to look ahead for direction prediction
const SPEED_THRESHOLD_LOW = 5; // m/s (~18 km/h)
const SPEED_THRESHOLD_HIGH = 15; // m/s (~54 km/h)
const MIN_PREFETCH_DISTANCE = 0.01; // ~1km in coordinates
const MAX_PREFETCH_DISTANCE = 0.05; // ~5km in coordinates
const OFF_ROUTE_THRESHOLD = 0.0003; // ~30-40 meters in coordinates

// Smaller radius to check if a step is completed

export default function OrderTracking() {
  const { id, orderId } = useLocalSearchParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [userAddress, setUserAddress] = useState<any>();
  const [loading, setLoading] = useState(true);
  const [driverLocation, setDriverLocation] =
    useState<Location.LocationObject | null>(null);
  const [customerLocation, setCustomerLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [coordinateId, setCoordinateId] = useState<string | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<any[]>([]);
  const [routeInstructions, setRouteInstructions] = useState<any[]>([]);
  const [routeDistance, setRouteDistance] = useState<string>("");
  const [routeDuration, setRouteDuration] = useState<string>("");
  const [showInstructions, setShowInstructions] = useState<boolean>(false);
  const [navigationMode, setNavigationMode] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [heading, setHeading] = useState<number | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(0);
  const [lastPosition, setLastPosition] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [lastRouteCheck, setLastRouteCheck] = useState<number>(0);
  const [isOffRoute, setIsOffRoute] = useState<boolean>(false);
  const [mapType, setMapType] = useState<"standard" | "satellite">("standard");
  const [routeType, setRouteType] = useState<string>("fastest");
  const [showMapOptions, setShowMapOptions] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  // New state variables for route optimization
  const [initialRouteFetched, setInitialRouteFetched] =
    useState<boolean>(false);
  const [recalculationCount, setRecalculationCount] = useState<number>(0);

  const simulationTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const locationUpdateTimer = useRef<ReturnType<typeof setInterval> | null>(
    null
  );
  const simulationIndex = useRef<number>(0);
  const simulationSubIndex = useRef<number>(0);
  const SIMULATION_STEPS = 10; // Number of steps to interpolate between points
  const mapRef = useRef<MapView>(null);
  const locationSubscription = useRef<any>(null);
  const [lastStepChangeTime, setLastStepChangeTime] = useState<number>(0);
  const [stabilizedInstructions, setStabilizedInstructions] =
    useState<any>(null);

  // Add refs for predictive tile loading
  const prefetchedRegions = useRef<Set<string>>(new Set());
  const lastPrefetchTime = useRef<number>(0);
  const currentSpeed = useRef<number>(0);
  const currentDirection = useRef<number>(0);
  const lastProcessedLocation = useRef<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const originalDriverLocation = useRef<Location.LocationObject | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const timeoutId = useRef<number | null>(null);
  const simActive = useRef(false);
  const isTracking = useRef<boolean>(true);
  const initialCamera = useRef<Camera | null>(null);

  useEffect(() => {
    setupLocationTracking();
    fetchOrderDetails();

    // Connect to socket for real-time location updates
    connectSocket();

    return () => {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
      if (locationUpdateTimer.current) {
        clearInterval(locationUpdateTimer.current);
      }
    };
  }, [id, orderId]);

  // Set up timer to update location every 10 seconds for database fallback
  useEffect(() => {
    if (coordinateId && orderId) {
      console.log("Setting up location update timer for orderId:", orderId);

      // Clear any existing timer
      if (locationUpdateTimer.current) {
        clearInterval(locationUpdateTimer.current);
      }

      // Set up timer to update location every 10 seconds for database fallback
      locationUpdateTimer.current = setInterval(() => {
        console.log(
          "Timer triggered - updating location for database fallback"
        );
        updateLocationToDatabase();
      }, 10000); // 10 seconds

      // Call updateLocationToDatabase immediately when timer is set up
      console.log("Calling updateLocationToDatabase immediately");
      updateLocationToDatabase();
    }

    return () => {
      if (locationUpdateTimer.current) {
        clearInterval(locationUpdateTimer.current);
      }
    };
  }, [coordinateId, orderId]);

  // Optimized route fetching effect
  useEffect(() => {
    // Fetch route only when:
    // 1. Starting navigation/simulation (initialRouteFetched false)
    // 2. Driver is off-route (recalculationCount changes)
    if (
      (!initialRouteFetched || recalculationCount > 0) &&
      driverLocation &&
      customerLocation
    ) {
      console.log(
        "Fetching route coordinates",
        initialRouteFetched ? "(recalculation)" : "(initial)"
      );
      getRouteCoordinates();
      setInitialRouteFetched(true);
    }
  }, [
    driverLocation,
    customerLocation,
    initialRouteFetched,
    recalculationCount,
  ]);

  // Progressive loading algorithm: Predict and prefetch map tiles based on movement
  const predictAndPrefetchTiles = (location: Location.LocationObject) => {
    // Implement a throttle - don't prefetch too often
    const now = Date.now();
    const timeSinceLastPrefetch = now - lastPrefetchTime.current;

    // Only run algorithm every 2 seconds or when significant movement occurs
    if (timeSinceLastPrefetch < 2000 && lastProcessedLocation.current) {
      // Check if we've moved enough to justify a new prefetch
      const distanceMoved = calculateDistance(
        location.coords.latitude,
        location.coords.longitude,
        lastProcessedLocation.current.latitude,
        lastProcessedLocation.current.longitude
      );

      // If we haven't moved significantly, skip prefetching
      if (distanceMoved < 0.0003) {
        // Roughly 30-50 meters in coordinates
        return;
      }
    }

    // Update our last processed location and time
    lastProcessedLocation.current = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
    lastPrefetchTime.current = now;

    // Calculate current speed (or use the one provided by location services)
    const speed =
      location.coords.speed !== null
        ? location.coords.speed
        : currentSpeed.current;

    // Update stored speed
    currentSpeed.current = speed;

    // Get direction of travel
    const travelDirection =
      location.coords.heading !== null
        ? location.coords.heading
        : heading !== null
          ? heading
          : currentDirection.current;

    // Update stored direction
    currentDirection.current = travelDirection;

    // Calculate prefetch distance based on speed
    // Higher speed = prefetch further ahead
    let prefetchDistance = MIN_PREFETCH_DISTANCE;

    if (speed > SPEED_THRESHOLD_HIGH) {
      prefetchDistance = MAX_PREFETCH_DISTANCE;
    } else if (speed > SPEED_THRESHOLD_LOW) {
      // Linear interpolation between min and max based on speed
      const speedFactor =
        (speed - SPEED_THRESHOLD_LOW) /
        (SPEED_THRESHOLD_HIGH - SPEED_THRESHOLD_LOW);
      prefetchDistance =
        MIN_PREFETCH_DISTANCE +
        speedFactor * (MAX_PREFETCH_DISTANCE - MIN_PREFETCH_DISTANCE);
    }

    // Calculate regions to prefetch based on current direction and speed
    const prefetchRegions = calculatePrefetchRegions(
      location.coords.latitude,
      location.coords.longitude,
      travelDirection,
      prefetchDistance,
      speed
    );

    // For each region, check if already prefetched - if not, trigger loading
    prefetchRegions.forEach((region) => {
      const regionKey = `${region.latitude.toFixed(
        4
      )},${region.longitude.toFixed(4)}`;

      if (!prefetchedRegions.current.has(regionKey)) {
        console.log(
          `Prefetching map region at ${region.latitude}, ${region.longitude}`
        );

        // Mark as prefetched to avoid duplicate work
        prefetchedRegions.current.add(regionKey);

        // Use requestAnimationFrame to schedule the camera move when UI thread is less busy
        // This helps prevent visual stutters in the main map view
        requestAnimationFrame(() => {
          if (mapRef.current) {
            // Get current camera position so we can return to it
            mapRef.current.getCamera().then((currentCamera) => {
              // Temporarily move to the region we want to prefetch
              mapRef.current?.setCamera({
                center: {
                  latitude: region.latitude,
                  longitude: region.longitude,
                },
                zoom: 15, // Good level for prefetching details
                pitch: 0,
                heading: 0,
                altitude: 0,
              });

              // Wait for tiles to load, then move back to original position
              setTimeout(() => {
                // Only move back if we're still on the same component
                if (mapRef.current) {
                  mapRef.current.setCamera(currentCamera);
                }
              }, 200); // Brief delay to load tiles
            });
          }
        });
      }
    });

    // If in navigation and we have route coordinates, prefetch upcoming route areas
    if (navigationMode && routeCoordinates.length > 0) {
      prefetchUpcomingRouteSegments(location);
    }
  };

  // Calculate regions to prefetch based on direction and speed
  const calculatePrefetchRegions = (
    latitude: number,
    longitude: number,
    direction: number,
    distance: number,
    speed: number
  ) => {
    const regions = [];

    // Convert direction from degrees to radians
    const directionRad = (direction * Math.PI) / 180;

    // Primary direction - directly ahead based on current heading
    const primaryLat = latitude + distance * Math.sin(directionRad);
    const primaryLong = longitude + distance * Math.cos(directionRad);

    regions.push({
      latitude: primaryLat,
      longitude: primaryLong,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    });

    // If moving quickly, also add regions slightly to the left and right
    // of the primary direction to account for turns
    if (speed > SPEED_THRESHOLD_LOW) {
      // Left region (30 degrees to the left)
      const leftDirRad = directionRad - (30 * Math.PI) / 180;
      const leftLat = latitude + distance * Math.sin(leftDirRad);
      const leftLong = longitude + distance * Math.cos(leftDirRad);

      // Right region (30 degrees to the right)
      const rightDirRad = directionRad + (30 * Math.PI) / 180;
      const rightLat = latitude + distance * Math.sin(rightDirRad);
      const rightLong = longitude + distance * Math.cos(rightDirRad);

      regions.push({
        latitude: leftLat,
        longitude: leftLong,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      });

      regions.push({
        latitude: rightLat,
        longitude: rightLong,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      });
    }

    return regions;
  };

  // Prefetch upcoming segments of the route
  const prefetchUpcomingRouteSegments = (location: Location.LocationObject) => {
    if (!routeCoordinates.length) return;

    // Find the closest point on the route to current position
    let closestPointIndex = 0;
    let minDistance = Number.MAX_VALUE;

    routeCoordinates.forEach((point, index) => {
      const distance = calculateDistance(
        location.coords.latitude,
        location.coords.longitude,
        point.latitude,
        point.longitude
      );

      if (distance < minDistance) {
        minDistance = distance;
        closestPointIndex = index;
      }
    });

    // Look ahead on the route based on speed
    const lookAheadAmount = Math.min(
      Math.floor(currentSpeed.current * PREFETCH_AHEAD_MULTIPLIER),
      100 // Cap to avoid excessive prefetching
    );

    // Calculate several points ahead to prefetch
    for (
      let i = closestPointIndex + 20;
      i < routeCoordinates.length && i < closestPointIndex + lookAheadAmount;
      i += 20 // Take sample points at intervals
    ) {
      const point = routeCoordinates[i];
      if (!point) continue;

      const regionKey = `${point.latitude.toFixed(4)},${point.longitude.toFixed(
        4
      )}`;

      if (!prefetchedRegions.current.has(regionKey)) {
        prefetchedRegions.current.add(regionKey);

        // Prefetch this area of the route
        requestAnimationFrame(() => {
          if (mapRef.current) {
            mapRef.current.getCamera().then((currentCamera) => {
              // Just mark the tiles for loading without actually moving camera
              mapRef.current?.setCamera({
                center: {
                  latitude: point.latitude,
                  longitude: point.longitude,
                },
                zoom: 16,
                heading: 0,
                pitch: 0,
                altitude: 0,
              });

              // Return to normal view quickly
              setTimeout(() => {
                if (mapRef.current) {
                  mapRef.current.setCamera(currentCamera);
                }
              }, 150);
            });
          }
        });
      }
    }
  };

  const setupLocationTracking = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Location permission is required for delivery tracking."
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setDriverLocation(location);
      setLastPosition({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      // Check if coordinate exists for this order
      const existingCoordinate = await getCoordinateByOrderId(
        orderId as string
      );

      if (existingCoordinate && existingCoordinate.length > 0) {
        // If coordinate exists, use its ID
        setCoordinateId(existingCoordinate[0]._id);
        console.log(
          "Using existing coordinate with ID:",
          existingCoordinate[0]._id
        );
      } else {
        // If no coordinate exists, create a new one
        const coordinate = await createCoordinate(
          location.coords.latitude,
          location.coords.longitude,
          orderId as string
        );
        setCoordinateId(coordinate._id);
        console.log("Created new coordinate with ID:", coordinate._id);
      }

      // Start listening to heading changes for navigation
      const headingSubscription = await Location.watchHeadingAsync(
        (headingData) => {
          setHeading(headingData.trueHeading);
          // Update the current direction for prefetching algorithm
          currentDirection.current = headingData.trueHeading;
        }
      );

      // Set up more frequent location updates for navigation
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation, // Higher accuracy for navigation
          distanceInterval: 5, // Update every 5 meters
          timeInterval: 500, // Update at least every 500ms for smoother movement
        },
        (location) => {
          if (!isTracking.current) return;

          setDriverLocation(location);

          // If in navigation mode, always update camera
          if (navigationMode && mapRef.current) {
            updateNavigationCamera(location);
          }

          // Always run predictive tile prefetching
          predictAndPrefetchTiles(location);

          // Check if coordinate should be updated
          const currentTime = Date.now();
          const timeSinceLastUpdate = currentTime - lastUpdateTime;
          const isMoving = isDriverMoving(
            location.coords.latitude,
            location.coords.longitude
          );

          // Emit real-time socket updates more frequently (every 500ms if moving)
          if (coordinateId && timeSinceLastUpdate >= 500 && isMoving) {
            console.log("Driver emitting real-time location update:", {
              orderId: orderId as string,
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              heading: location.coords.heading,
            });

            // Emit location update to customer via socket for real-time tracking
            emitDriverLocationUpdate(
              orderId as string,
              location.coords.latitude,
              location.coords.longitude,
              location.coords.heading
            );

            // Update last position and time
            setLastPosition({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            });
            setLastUpdateTime(currentTime);
          }

          // If in navigation mode, check if driver is off route
          if (navigationMode) {
            // Check if driver is off route every 15 seconds
            if (currentTime - lastRouteCheck > 15000) {
              checkIfOffRoute(location);
              setLastRouteCheck(currentTime);
            }
          }

          // Store speed information for prefetching algorithm
          if (location.coords.speed !== null) {
            currentSpeed.current = location.coords.speed;
          }
        }
      );

      return () => {
        headingSubscription.remove();
        if (locationSubscription.current) {
          locationSubscription.current.remove();
        }
      };
    } catch (error) {}
  };

  // Check if driver has deviated from the route
  const checkIfOffRoute = (location: Location.LocationObject) => {
    if (!routeCoordinates.length || !customerLocation) return;

    // Find the closest point on the route to the current location
    let minDistance = Number.MAX_VALUE;
    let closestPointIndex = 0;

    routeCoordinates.forEach((point, index) => {
      const distance = calculateDistance(
        location.coords.latitude,
        location.coords.longitude,
        point.latitude,
        point.longitude
      );

      if (distance < minDistance) {
        minDistance = distance;
        closestPointIndex = index;
      }
    });

    // If the closest point is more than threshold distance away, driver is off route
    if (minDistance > OFF_ROUTE_THRESHOLD) {
      console.log("Driver is off route, recalculating...");
      setIsOffRoute(true);
      setRecalculationCount((prev) => prev + 1); // Trigger route refetch

      // Show a notification to the driver
      Alert.alert(
        "Route Updated",
        "Your route has been recalculated based on your current location.",
        [{ text: "OK" }],
        { cancelable: true }
      );
    } else {
      setIsOffRoute(false);
    }
  };

  // Check if driver is moving by comparing current position to last position
  const isDriverMoving = (latitude: number, longitude: number): boolean => {
    if (!lastPosition) return true; // Default to true if no last position

    // Calculate distance between current and last position
    const distance = calculateDistance(
      latitude,
      longitude,
      lastPosition.latitude,
      lastPosition.longitude
    );

    // Consider driver moving if distance is greater than threshold (e.g., 10 meters)
    const MOVEMENT_THRESHOLD = 0.00008; // Approximately 8-10 meters in coordinates
    return distance > MOVEMENT_THRESHOLD;
  };

  const updateNavigationCamera = (location: Location.LocationObject) => {
    if (!mapRef.current) return;

    // Calculate camera position and angle
    const camera: Camera = {
      center: {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      },
      pitch: 45, // Tilt
      heading: heading || location.coords.heading || 0,
      altitude: 500,
      zoom: 18.5, // Increased zoom level for closer view
    };

    // Use animateCamera with a shorter duration for more responsive updates
    mapRef.current.animateCamera(camera, { duration: 500 });
  };

  const checkStepCompletion = () => {
    if (!driverLocation || currentStep >= routeInstructions.length) return;

    const currentInstruction = routeInstructions[currentStep];
    if (!currentInstruction.endLocation) return;

    const distance = calculateDistance(
      driverLocation.coords.latitude,
      driverLocation.coords.longitude,
      currentInstruction.endLocation.lat,
      currentInstruction.endLocation.lng
    );

    // Current time to check if we should allow a step change
    const currentTime = Date.now();
    const timeSinceLastStep = currentTime - lastStepChangeTime;

    // Minimum time between step changes (2 seconds)
    const MIN_STEP_CHANGE_INTERVAL = 2000;

    // Only proceed if enough time has passed since the last step change
    if (timeSinceLastStep < MIN_STEP_CHANGE_INTERVAL) {
      return;
    }

    // If driver is close to the end of current step, move to next step
    if (distance <= STEP_COMPLETION_RADIUS) {
      if (currentStep < routeInstructions.length - 1) {
        setCurrentStep(currentStep + 1);
        setLastStepChangeTime(currentTime);

        // Update stabilized instructions
        updateStabilizedInstructions(currentStep + 1);
      }
    }
  };

  // Function to update stabilized instructions with debouncing
  const updateStabilizedInstructions = (stepIndex: number) => {
    // If we don't have instructions yet, exit
    if (!routeInstructions.length || stepIndex >= routeInstructions.length)
      return;

    // Get current and next instructions
    const currentInst = routeInstructions[stepIndex];
    const nextInst =
      stepIndex < routeInstructions.length - 1
        ? routeInstructions[stepIndex + 1]
        : null;

    // Normal case - just use the actual instructions
    setStabilizedInstructions({
      current: currentInst,
      next: nextInst,
    });
  };

  // Initialize stabilized instructions when route is first loaded
  useEffect(() => {
    if (
      routeInstructions.length > 0 &&
      currentStep < routeInstructions.length
    ) {
      updateStabilizedInstructions(currentStep);
    }
  }, [routeInstructions, currentStep]);

  // Function to simulate driver movement along the route with smooth interpolation
  const startSimulation = async () => {
    if (routeCoordinates.length === 0) {
      return;
    }

    simActive.current = true;

    if (driverLocation) {
      originalDriverLocation.current = driverLocation;
    }

    // Reset simulation indices to start from beginning of route
    simulationIndex.current = 0;
    simulationSubIndex.current = 0;
    setIsSimulating(true);

    // Create or verify coordinate exists for this order
    if (!coordinateId && driverLocation) {
      try {
        console.log(
          "Creating coordinate for order when starting simulation:",
          orderId
        );
        const coordinate = await createCoordinate(
          driverLocation.coords.latitude,
          driverLocation.coords.longitude,
          orderId as string
        );
        setCoordinateId(coordinate._id);
        console.log("Created new coordinate with ID:", coordinate._id);
      } catch (error) {
        console.log("Error creating coordinate:", error);
      }
    }

    // Update order status to IN_DELIVERY when starting simulation
    if (order && userAddress) {
      try {
        await updateDeliveryInfoById(
          order._id,
          ORDER_STATUS.IN_DELIVERY,
          `${userAddress.street}, ${userAddress.commune}, ${userAddress.district}, ${userAddress.city}`,
          new Date().toISOString()
        );
        console.log("Order status updated to IN_DELIVERY (simulation)");
      } catch (error) {
        console.log("Error updating order status to IN_DELIVERY:", error);
      }
    }

    // Start navigation mode for better visualization (don't update status since we already did)
    if (!navigationMode) {
      startNavigation(false);
    }

    // Clear any existing timer
    if (simulationTimer.current) {
      clearInterval(simulationTimer.current);
    }

    // Base interval for simulation (100ms for smooth animation)
    let interval = 100;

    // Track the last simulation time to enforce consistent speed
    let lastSimulationTime = Date.now();
    let lastSocketEmitTime = Date.now();

    // Define the simulation step function that we can reuse
    const simulationStep = () => {
      if (!simActive.current) return;

      const currentTime = Date.now();

      // If we've gone through all route coordinates, end simulation
      if (simulationIndex.current >= routeCoordinates.length - 1) {
        stopSimulation();
        return;
      }

      // Get current and next coordinates for interpolation
      const currentCoord = routeCoordinates[simulationIndex.current];
      const nextCoord = routeCoordinates[simulationIndex.current + 1];

      // Calculate the actual distance between these points in meters
      const segmentDistanceInMeters =
        calculateDistance(
          currentCoord.latitude,
          currentCoord.longitude,
          nextCoord.latitude,
          nextCoord.longitude
        ) * 111000; // Convert lat/lng distance to meters (approx)

      // The maximum speed is 8.3 m/s (30 km/h)
      const MAX_SPEED_MPS = 8.3; // 30 km/h in m/s

      // Calculate minimum time required to traverse this segment at max speed (in ms)
      const minimumSegmentTimeMs =
        (segmentDistanceInMeters / MAX_SPEED_MPS) * 1000;

      // Ensure our simulation respects this minimum time by dividing it across sub-steps
      const minimumSubStepTimeMs = minimumSegmentTimeMs / SIMULATION_STEPS;

      // Calculate time since last simulation step
      const timeSinceLastStep = currentTime - lastSimulationTime;

      // If we're trying to move too fast, delay this step
      if (timeSinceLastStep < minimumSubStepTimeMs) {
        // Schedule the next step at the appropriate time
        setTimeout(simulationStep, minimumSubStepTimeMs - timeSinceLastStep);
        return;
      }

      // Update last simulation time
      lastSimulationTime = currentTime;

      // Interpolate between current and next coordinates for smooth movement
      const latitude =
        currentCoord.latitude +
        (nextCoord.latitude - currentCoord.latitude) *
          (simulationSubIndex.current / SIMULATION_STEPS);
      const longitude =
        currentCoord.longitude +
        (nextCoord.longitude - currentCoord.longitude) *
          (simulationSubIndex.current / SIMULATION_STEPS);

      // Calculate heading between current and next position
      const calculatedHeading = calculateHeading(
        currentCoord.latitude,
        currentCoord.longitude,
        nextCoord.latitude,
        nextCoord.longitude
      );
      setHeading(calculatedHeading);

      // Calculate actual simulation speed to report (respecting max speed)
      // Slight variation to make it feel natural, but always capped
      const speedVariation = Math.sin(simulationIndex.current * 0.1) * 1.5;

      // Base speed adjusts automatically for straight vs curved segments
      let baseSpeed = segmentDistanceInMeters < 20 ? 5 : 7; // Slower on short/curved segments

      // Apply variation and cap
      let simulatedSpeed = baseSpeed + speedVariation;
      simulatedSpeed = Math.min(simulatedSpeed, MAX_SPEED_MPS);

      // Create a fake location object with the interpolated coordinate
      const simulatedLocation: Location.LocationObject = {
        coords: {
          latitude,
          longitude,
          altitude: null,
          accuracy: 5,
          altitudeAccuracy: null,
          heading: calculatedHeading,
          speed: simulatedSpeed,
        },
        timestamp: Date.now(),
      };

      // Update driver location with simulated position
      setDriverLocation(simulatedLocation);

      // Emit location update to customer via socket every 1 second during simulation
      if (currentTime - lastSocketEmitTime >= 1000) {
        // 1 second
        console.log("Simulation - emitting location update to customer:", {
          orderId: orderId as string,
          latitude,
          longitude,
          heading: calculatedHeading,
        });

        emitDriverLocationUpdate(
          orderId as string,
          latitude,
          longitude,
          calculatedHeading
        );

        // Update coordinate in database during simulation
        if (coordinateId) {
          updateCoordinateById(coordinateId, latitude, longitude).catch(
            console.log
          );
        }

        lastSocketEmitTime = currentTime;
      }

      // Check if step is completed
      if (navigationMode && routeInstructions.length > 0) {
        checkStepCompletion();
      }

      // Update last position for checking movement
      setLastPosition({
        latitude,
        longitude,
      });

      // Increment sub-index for interpolation
      simulationSubIndex.current++;

      // If we've completed all sub-steps, move to next major point
      if (simulationSubIndex.current >= SIMULATION_STEPS) {
        simulationSubIndex.current = 0;
        simulationIndex.current++;

        // Slow down further at turns to mimic real driving behavior
        if (simulationIndex.current < routeCoordinates.length - 1) {
          const nextNextCoord = routeCoordinates[simulationIndex.current + 1];
          const currentHeading = calculateHeading(
            currentCoord.latitude,
            currentCoord.longitude,
            nextCoord.latitude,
            nextCoord.longitude
          );
          const nextHeading = calculateHeading(
            nextCoord.latitude,
            nextCoord.longitude,
            nextNextCoord.latitude,
            nextNextCoord.longitude
          );

          // If there's a significant turn (heading change > 30 degrees)
          const headingDiff = Math.abs(nextHeading - currentHeading);
          if (headingDiff > 30 && headingDiff < 330) {
            // Add a delay to simulate slowing down at turns
            // Wait a bit longer before continuing simulation
            setTimeout(simulationStep, 400);
            return;
          }
        }
      }

      // Check if we're near the destination
      if (
        simulationIndex.current >= routeCoordinates.length - 8 &&
        simulationIndex.current < routeCoordinates.length - 5 &&
        simulationSubIndex.current === 0 &&
        customerLocation
      ) {
        Alert.alert(
          "Near Destination",
          "You're approaching the destination. Delivery will be completed soon."
        );
      }

      // If in navigation mode, update camera (but less frequently for smoother feeling)
      if (
        navigationMode &&
        mapRef.current &&
        (simulationSubIndex.current === 0 || simulationSubIndex.current === 5)
      ) {
        updateNavigationCamera(simulatedLocation);
      }

      // Schedule the next simulation step, using recursion instead of interval
      // This gives us more precise control over timing
      animationFrameId.current = requestAnimationFrame(() => {
        timeoutId.current = setTimeout(simulationStep, interval);
      });
    };

    // Start the simulation with our step function
    simulationStep();
  };

  const stopSimulation = () => {
    simActive.current = false;

    if (animationFrameId.current !== null) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }

    if (timeoutId.current !== null) {
      clearTimeout(timeoutId.current);
      timeoutId.current = null;
    }

    if (simulationTimer.current) {
      clearInterval(simulationTimer.current);
      simulationTimer.current = null;
    }
    setIsSimulating(false);

    if (driverLocation) {
      setHeading(driverLocation.coords.heading);
    }

    // If we reached the end of the route, show arrival notification
    if (
      simulationIndex.current >= routeCoordinates.length - 1 &&
      customerLocation
    ) {
      Alert.alert(
        "Arrived at Destination",
        "You have reached the customer's location.",
        [{ text: "OK" }]
      );
    }
  };

  // Calculate heading angle between two points with more precision
  const calculateHeading = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const y = Math.sin(dLon) * Math.cos(lat2 * (Math.PI / 180));
    const x =
      Math.cos(lat1 * (Math.PI / 180)) * Math.sin(lat2 * (Math.PI / 180)) -
      Math.sin(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.cos(dLon);
    const brng = (Math.atan2(y, x) * 180) / Math.PI;
    return (brng + 360) % 360;
  };

  // Clean up simulation on unmount
  useEffect(() => {
    return () => {
      if (simulationTimer.current) {
        clearInterval(simulationTimer.current);
      }
      if (locationUpdateTimer.current) {
        clearInterval(locationUpdateTimer.current);
      }
    };
  }, []);

  // Modified start navigation function to initialize stabilized instructions
  const startNavigation = async (updateStatus = true) => {
    if (isSimulating) {
      stopSimulation();
    }
    setNavigationMode(true);
    setCurrentStep(0);
    setLastStepChangeTime(Date.now());
    setShowInstructions(true);
    setLastRouteCheck(Date.now());
    setInitialRouteFetched(false); // Ensure route fetch on navigation start
    setRecalculationCount(0); // Reset recalculation counter

    // Create or verify coordinate exists for this order
    if (!coordinateId && driverLocation) {
      try {
        console.log(
          "Creating coordinate for order when starting navigation:",
          orderId
        );
        const coordinate = await createCoordinate(
          driverLocation.coords.latitude,
          driverLocation.coords.longitude,
          orderId as string
        );
        setCoordinateId(coordinate._id);
        console.log("Created new coordinate with ID:", coordinate._id);
      } catch (error) {
        console.log("Error creating coordinate:", error);
      }
    }

    // Update order status to IN_DELIVERY when starting shipping (only if updateStatus is true)
    if (updateStatus && order && userAddress) {
      try {
        await updateDeliveryInfoById(
          order._id,
          ORDER_STATUS.IN_DELIVERY,
          `${userAddress.street}, ${userAddress.commune}, ${userAddress.district}, ${userAddress.city}`,
          new Date().toISOString()
        );
        console.log("Order status updated to IN_DELIVERY");
      } catch (error) {
        console.log("Error updating order status to IN_DELIVERY:", error);
      }
    }

    // Initialize stabilized instructions
    if (routeInstructions.length > 0) {
      updateStabilizedInstructions(0);
    }

    // Force immediate camera update
    if (driverLocation && mapRef.current) {
      // First ensure we're at the right position before animation
      mapRef.current.setCamera({
        center: {
          latitude: driverLocation.coords.latitude,
          longitude: driverLocation.coords.longitude,
        },
        heading: heading || driverLocation.coords.heading || 0,
        pitch: 45,
        altitude: 500,
        zoom: 18.5,
      });

      // Then animate to get the smooth transition
      setTimeout(() => {
        updateNavigationCamera(driverLocation);
      }, 100);
    }

    isTracking.current = true;
  };

  // Modify stopNavigation to also stop simulation
  const stopNavigation = () => {
    if (isSimulating) {
      stopSimulation();

      if (originalDriverLocation.current) {
        setDriverLocation(originalDriverLocation.current);
      }
    }
    setNavigationMode(false);

    // Reset map view to show both markers
    if (driverLocation && customerLocation && mapRef.current) {
      mapRef.current.fitToCoordinates(
        [
          {
            latitude: driverLocation.coords.latitude,
            longitude: driverLocation.coords.longitude,
          },
          {
            latitude: customerLocation.latitude,
            longitude: customerLocation.longitude,
          },
        ],
        {
          edgePadding: { top: 175, right: 150, bottom: 175, left: 150 },
          animated: true,
        }
      );
    }

    isTracking.current = false;
  };

  // Original updateLocation function for manual updates
  const updateLocation = async () => {
    try {
      if (!coordinateId) return;

      const location = await Location.getCurrentPositionAsync({});
      setDriverLocation(location);

      // Check if driver has moved since last update
      const isMoving = isDriverMoving(
        location.coords.latitude,
        location.coords.longitude
      );

      if (isMoving) {
        await updateCoordinateById(
          coordinateId,
          location.coords.latitude,
          location.coords.longitude
        );

        // Emit location update to customer via socket
        console.log("Driver emitting location update (manual):", {
          orderId: orderId as string,
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          heading: location.coords.heading,
        });
        emitDriverLocationUpdate(
          orderId as string,
          location.coords.latitude,
          location.coords.longitude,
          location.coords.heading
        );

        // Update last position
        setLastPosition({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      }

      // Check if driver has reached customer
      if (customerLocation) {
        const distance = calculateDistance(
          location.coords.latitude,
          location.coords.longitude,
          customerLocation.latitude,
          customerLocation.longitude
        );

        if (distance <= DELIVERY_RADIUS) {
          if (navigationMode) {
            // Automatically stop navigation when reaching destination
            stopNavigation();
          }

          Alert.alert(
            "Arrived at Destination",
            "You have reached the customer's location.",
            [{ text: "OK" }]
          );
        }
      }
    } catch (error) {
      console.log("Error updating location:", error);
    }
  };

  // New function for consistent database updates every 10 seconds
  const updateLocationToDatabase = async () => {
    try {
      if (!coordinateId) return;

      const location = await Location.getCurrentPositionAsync({});
      setDriverLocation(location);

      // Always update database every 10 seconds regardless of movement
      // This ensures customers can always get the latest location even without socket connection
      await updateCoordinateById(
        coordinateId,
        location.coords.latitude,
        location.coords.longitude
      );

      console.log("Database updated with driver location (fallback):", {
        orderId: orderId as string,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      // Also emit to socket for real-time updates if connected
      emitDriverLocationUpdate(
        orderId as string,
        location.coords.latitude,
        location.coords.longitude,
        location.coords.heading
      );

      // Update last position
      setLastPosition({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      // Check if driver has reached customer
      if (customerLocation) {
        const distance = calculateDistance(
          location.coords.latitude,
          location.coords.longitude,
          customerLocation.latitude,
          customerLocation.longitude
        );

        if (distance <= DELIVERY_RADIUS) {
          if (navigationMode) {
            // Automatically stop navigation when reaching destination
            stopNavigation();
          }

          Alert.alert(
            "Arrived at Destination",
            "You have reached the customer's location.",
            [{ text: "OK" }]
          );
        }
      }
    } catch (error) {
      console.log("Error updating location to database:", error);
    }
  };

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) => {
    return Math.sqrt(Math.pow(lat2 - lat1, 2) + Math.pow(lon2 - lon1, 2));
  };

  const fetchOrderDetails = async () => {
    try {
      const orderData = await getOrderById(orderId as string);
      const userAddress = await getUserAddressById(orderData[0].userAddressId);
      setUserAddress(userAddress);
      setOrder(orderData[0]);

      if (userAddress) {
        const geocode = await Location.geocodeAsync(
          `${userAddress.street}, ${userAddress.commune}, ${userAddress.district}, ${userAddress.city}`
        );
        if (geocode.length > 0) {
          setCustomerLocation({
            latitude: geocode[0].latitude,
            longitude: geocode[0].longitude,
          });
        }
      }
    } catch (error) {
      console.log("Error fetching order details:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch the driving route using Google Directions API
  const getRouteCoordinates = async () => {
    try {
      // Prevent API calls without locations
      if (!driverLocation || !customerLocation) {
        console.log("Skipping route fetch - locations unavailable");
        return;
      }

      const origin = `${driverLocation.coords.latitude},${driverLocation.coords.longitude}`;
      const destination = `${customerLocation.latitude},${customerLocation.longitude}`;
      const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

      let routeOptions = "";
      if (routeType === "shortest") {
        routeOptions = "&optimize=true";
      } else if (routeType === "no-highways") {
        routeOptions = "&avoid=highways";
      } else if (routeType === "no-tolls") {
        routeOptions = "&avoid=tolls";
      }

      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&mode=driving${routeOptions}&key=${apiKey}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== "OK" || !data.routes.length) {
        console.log("Directions API error:", data.status, data.error_message);
        setRouteCoordinates([]);
        return;
      }

      const route = data.routes[0];

      const allCoords: { latitude: number; longitude: number }[] = [];

      if (route.legs && route.legs.length > 0) {
        setRouteDistance(route.legs[0].distance.text);
        setRouteDuration(route.legs[0].duration.text);

        // Detailed steps
        const steps = route.legs[0].steps.map((step: any) => {
          // Decode each step's polyline and add to allCoords
          const stepCoords = decodePolyline(step.polyline.points);
          allCoords.push(...stepCoords);

          return {
            instructions: step.html_instructions.replace(/<[^>]*>/g, " "),
            distance: step.distance.text,
            duration: step.duration.text,
            startLocation: step.start_location,
            endLocation: step.end_location,
            maneuver: step.maneuver || "",
          };
        });

        setRouteInstructions(steps);
      }

      setRouteCoordinates(allCoords); // Use detailed coordinates

      // Emit route data to customer via socket
      if (orderId && allCoords.length > 0) {
        console.log("Emitting route data to customer:", {
          orderId: orderId as string,
          coordinates: allCoords.length,
          distance: route.legs[0].distance.text,
          duration: route.legs[0].duration.text,
        });

        emitRouteUpdate(
          orderId as string,
          allCoords,
          route.legs[0].distance.text,
          route.legs[0].duration.text
        );
      }

      if (navigationMode) {
        setCurrentStep(0);
      }

      console.log(
        `Got ${allCoords.length} detailed route coordinates from ${route.legs[0].steps.length} steps`
      );
    } catch (error) {
      console.log("Error fetching route:", error);
      setRouteCoordinates([]);
    }
  };

  // Polyline decoder for Google's encoded polyline
  const decodePolyline = (encoded: string) => {
    let poly = [];
    let index = 0,
      len = encoded.length;
    let lat = 0,
      lng = 0;
    while (index < len) {
      let b,
        shift = 0,
        result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      let dlat = result & 1 ? ~(result >> 1) : result >> 1;
      lat += dlat;
      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      let dlng = result & 1 ? ~(result >> 1) : result >> 1;
      lng += dlng;
      poly.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
    }
    return poly;
  };

  const handleConfirmDelivery = async () => {
    try {
      if (!order) return;
      console.log("Confirming delivery for order:", order._id);

      await updateDeliveryInfoById(
        order._id,
        ORDER_STATUS.SHIPPED,
        order.deliveryInfo[order.deliveryInfo.length - 1].deliveryAddress,
        new Date().toISOString()
      );

      console.log("Order status updated to SHIPPED successfully");

      Alert.alert(
        "Delivery Completed",
        "The order has been marked as delivered.",
        [
          {
            text: "OK",
            onPress: () => {
              console.log(
                "Navigating back to home screen - orders will be refetched"
              );
              router.back();
            },
          },
        ]
      );
    } catch (error) {
      console.log("Error confirming delivery:", error);
      Alert.alert("Error", "Failed to confirm delivery. Please try again.");
    }
  };

  // Get icon for instruction type
  const getManeuverIcon = (maneuver: string) => {
    switch (maneuver) {
      case "turn-right":
        return "arrow-forward";
      case "turn-left":
        return "arrow-back";
      case "roundabout-right":
      case "roundabout-left":
        return "refresh-circle";
      case "merge":
        return "git-merge-outline";
      case "straight":
        return "arrow-up";
      case "ramp-right":
      case "ramp-left":
        return "arrow-undo";
      default:
        return "navigate";
    }
  };

  // Get direction text based on maneuver
  const getDirectionText = (instruction: string, maneuver: string) => {
    // Extract street name if available (usually after "onto" or "on")
    let streetName = "";
    if (instruction.includes(" onto ")) {
      streetName = instruction.split(" onto ")[1].split(" ")[0];
    } else if (instruction.includes(" on ")) {
      streetName = instruction.split(" on ")[1].split(" ")[0];
    }

    // Get direction based on maneuver
    let direction = "Đi thẳng"; // Go straight (default)

    if (maneuver === "turn-right") {
      direction = "Rẽ phải";
    } else if (maneuver === "turn-left") {
      direction = "Rẽ trái";
    } else if (maneuver === "straight") {
      direction = "Đi thẳng";
    } else if (maneuver.includes("roundabout")) {
      direction = "Vào vòng xoay";
    } else if (maneuver === "merge") {
      direction = "Nhập làn";
    } else if (instruction.toLowerCase().includes("north")) {
      direction = "Đi về hướng Bắc";
    } else if (instruction.toLowerCase().includes("south")) {
      direction = "Đi về hướng Nam";
    } else if (instruction.toLowerCase().includes("east")) {
      direction = "Đi về hướng Đông";
    } else if (instruction.toLowerCase().includes("west")) {
      direction = "Đi về hướng Tây";
    } else if (instruction.toLowerCase().includes("northeast")) {
      direction = "Đi về hướng Đông Bắc";
    } else if (instruction.toLowerCase().includes("northwest")) {
      direction = "Đi về hướng Tây Bắc";
    } else if (instruction.toLowerCase().includes("southeast")) {
      direction = "Đi về hướng Đông Nam";
    } else if (instruction.toLowerCase().includes("southwest")) {
      direction = "Đi về hướng Tây Nam";
    }

    // Return direction with street name if available
    return streetName ? `${direction} ${streetName}` : direction;
  };

  // Add an effect to update the camera whenever driver location changes in navigation mode
  useEffect(() => {
    if (navigationMode && driverLocation && mapRef.current) {
      updateNavigationCamera(driverLocation);
    }
  }, [
    navigationMode,
    driverLocation?.coords.latitude,
    driverLocation?.coords.longitude,
    heading,
  ]);

  // Wrapper function for TouchableOpacity event handler
  const handleStartNavigation = () => {
    startNavigation(true);
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#f5f5f5]">
        <ActivityIndicator size="large" color="#fc6a19" />
      </SafeAreaView>
    );
  }

  if (!order || !driverLocation || !customerLocation) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#f5f5f5]">
        <ActivityIndicator size="large" color="#fc6a19" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#f5f5f5]">
      <View className="flex-1">
        <MapView
          ref={mapRef}
          style={{ flex: 1 }}
          provider={PROVIDER_GOOGLE}
          mapType={mapType}
          showsUserLocation={false} // Hide default user location since we use custom marker
          showsMyLocationButton={true}
          initialRegion={{
            latitude: 10.8231, // Default to Vietnam center
            longitude: 106.6297,
            latitudeDelta: 10,
            longitudeDelta: 10,
          }}
          followsUserLocation={navigationMode}
          userLocationUpdateInterval={500}
          userLocationFastestInterval={500}
          minZoomLevel={navigationMode ? 15 : 0}
          // Add properties for progressive tile loading
          loadingEnabled={true}
          loadingBackgroundColor="#f5f5f5"
          loadingIndicatorColor="#fc6a19"
          zoomControlEnabled={true}
          cacheEnabled={true}
          onMapReady={async () => {
            console.log("Map is ready - setting initial region");

            if (mapRef.current && !initialCamera.current) {
              const cam = await mapRef.current.getCamera();
              initialCamera.current = cam;
            }

            // Set initial region to show both driver and customer locations
            if (driverLocation && customerLocation && mapRef.current) {
              mapRef.current.fitToCoordinates(
                [
                  {
                    latitude: driverLocation.coords.latitude,
                    longitude: driverLocation.coords.longitude,
                  },
                  {
                    latitude: customerLocation.latitude,
                    longitude: customerLocation.longitude,
                  },
                ],
                {
                  edgePadding: { top: 175, right: 150, bottom: 175, left: 150 },
                  animated: false, // No animation on initial load
                }
              );
            }

            // Prefetch initial regions
            if (driverLocation && customerLocation) {
              const regionKey = `${driverLocation.coords.latitude.toFixed(4)},${driverLocation.coords.longitude.toFixed(4)}`;
              prefetchedRegions.current.add(regionKey);

              const customerRegionKey = `${customerLocation.latitude.toFixed(4)},${customerLocation.longitude.toFixed(4)}`;
              prefetchedRegions.current.add(customerRegionKey);
            }
          }}
          onRegionChange={() => {
            // When user manually pans the map, add the region to prefetched regions
            if (mapRef.current) {
              mapRef.current.getCamera().then((camera) => {
                const regionKey = `${camera.center.latitude.toFixed(
                  4
                )},${camera.center.longitude.toFixed(4)}`;
                prefetchedRegions.current.add(regionKey);
              });
            }
          }}
        >
          {/* Custom Driver Marker for Navigation Mode (oriented based on heading) */}
          {navigationMode && driverLocation && (
            <Marker
              key={"driver-nav"}
              coordinate={{
                latitude: driverLocation.coords.latitude,
                longitude: driverLocation.coords.longitude,
              }}
              anchor={{ x: 0.5, y: 0.5 }}
              rotation={heading || driverLocation.coords.heading || 0}
              flat={true}
              tracksViewChanges={false}
            >
              <View className="items-center justify-center">
                <View className="bg-[#2377ff] h-8 w-8 rounded-full items-center justify-center shadow-lg">
                  <Ionicons name="navigate" size={20} color="#fff" />
                </View>
              </View>
            </Marker>
          )}

          {/* Driver Marker (hidden in navigation mode) */}
          {!navigationMode && driverLocation && (
            <Marker
              key="driver-static"
              coordinate={{
                latitude: driverLocation.coords.latitude,
                longitude: driverLocation.coords.longitude,
              }}
              title="Your Location"
              pinColor="#fc6a19"
              tracksViewChanges={false}
            />
          )}

          {/* Customer Marker */}
          {customerLocation && (
            <Marker
              coordinate={{
                latitude: customerLocation.latitude,
                longitude: customerLocation.longitude,
              }}
              title="Customer Location"
              pinColor="#4CAF50"
              tracksViewChanges={false}
            />
          )}

          {/* Route Line (actual driving route) */}
          {routeCoordinates.length > 0 && (
            <Polyline
              coordinates={routeCoordinates}
              strokeColor="#fc6a19"
              strokeWidth={4}
              lineCap="round"
              lineJoin="round"
            />
          )}
        </MapView>

        {/* Back Button */}
        <TouchableOpacity
          className="absolute top-0 left-4 bg-white p-2 rounded-full shadow-md z-10"
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={20} color="#fc6a19" />
        </TouchableOpacity>

        {/* Map Type Selector */}
        {/* <TouchableOpacity
          className="absolute top-4 right-4 bg-white p-2 rounded-full shadow-md z-10"
          onPress={() => setShowMapOptions(!showMapOptions)}
        >
          <Ionicons name="layers" size={28} color="#fc6a19" />
        </TouchableOpacity> */}

        {/* Map Options Panel */}
        {/* {showMapOptions && (
          <View className="absolute top-16 right-4 bg-white p-3 rounded-lg shadow-md z-10">
            <Text className="font-[bold] mb-2">Map Type</Text>
            <View className="flex-row mb-3">
              <TouchableOpacity
                className={`px-3 py-2 rounded-lg mr-2 ${
                  mapType === "standard" ? "bg-[#fc6a19]" : "bg-[#e0e0e0]"
                }`}
                onPress={() => setMapType("standard")}
              >
                <Text
                  className={`${
                    mapType === "standard" ? "text-white" : "text-[#333]"
                  } font-[medium]`}
                >
                  Standard
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`px-3 py-2 rounded-lg ${
                  mapType === "satellite" ? "bg-[#fc6a19]" : "bg-[#e0e0e0]"
                }`}
                onPress={() => setMapType("satellite")}
              >
                <Text
                  className={`${
                    mapType === "satellite" ? "text-white" : "text-[#333]"
                  } font-[medium]`}
                >
                  Satellite
                </Text>
              </TouchableOpacity>
            </View>

            <Text className="font-[bold] mb-2">Route Preference</Text>
            <View className="flex-row flex-wrap">
              {["fastest", "shortest", "no-highways", "no-tolls"].map(
                (type) => (
                  <TouchableOpacity
                    key={type}
                    className={`px-3 py-2 rounded-lg mr-2 mb-2 ${
                      routeType === type ? "bg-[#fc6a19]" : "bg-[#e0e0e0]"
                    }`}
                    onPress={() => {
                      setRouteType(type);
                      getRouteCoordinates();
                      setShowMapOptions(false);
                    }}
                  >
                    <Text
                      className={`${
                        routeType === type ? "text-white" : "text-[#333]"
                      } font-[medium]`}
                    >
                      {type.charAt(0).toUpperCase() +
                        type.slice(1).replace("-", " ")}
                    </Text>
                  </TouchableOpacity>
                )
              )}
            </View>
          </View>
        )} */}

        {/* Navigation Mode Banner - Shows current step when in navigation mode */}
        {navigationMode &&
          routeInstructions.length > 0 &&
          currentStep < routeInstructions.length &&
          stabilizedInstructions && (
            <View className="absolute top-0 left-0 right-0 bg-[#006d5b] shadow-lg z-20">
              {/* Main direction */}
              <View className="p-4">
                <View className="flex-row items-center">
                  <View className="items-center justify-center mr-3">
                    <Ionicons
                      name={getManeuverIcon(
                        stabilizedInstructions.current.maneuver
                      )}
                      size={36}
                      color="white"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white text-xl font-[bold]">
                      {getDirectionText(
                        stabilizedInstructions.current.instructions,
                        stabilizedInstructions.current.maneuver
                      )}
                    </Text>
                    <Text className="text-white opacity-80 text-sm">
                      {stabilizedInstructions.current.distance}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Next instruction - "After that" section */}
              {stabilizedInstructions.next && (
                <View className="bg-[#004a3c] p-3 flex-row items-center">
                  <Text className="text-white font-[medium] mr-2">Sau đó</Text>
                  <Ionicons
                    name={getManeuverIcon(stabilizedInstructions.next.maneuver)}
                    size={20}
                    color="white"
                  />
                  <View className="flex-1">
                    <Text className="text-white ml-2">
                      {getDirectionText(
                        stabilizedInstructions.next.instructions,
                        stabilizedInstructions.next.maneuver
                      )}
                    </Text>
                    <Text className="text-white opacity-70 ml-2 text-xs">
                      {stabilizedInstructions.next.distance}
                    </Text>
                  </View>
                </View>
              )}

              <TouchableOpacity
                className="absolute top-2 right-2 p-2"
                onPress={stopNavigation}
              >
                <Ionicons name="close-circle" size={28} color="white" />
              </TouchableOpacity>
            </View>
          )}

        {/* Route Summary (only shown when not in navigation mode) */}
        {!navigationMode && routeDistance && routeDuration && (
          <View className="absolute top-10 left-4 right-4 bg-white p-3 rounded-lg shadow-md">
            <View className="flex-col justify-between gap-2">
              <View className="flex-row justify-between">
                <Text className="text-lg font-[bold]">
                  {routeDistance} {"\n"}({routeDuration})
                </Text>
                <View className="flex-row">
                  <TouchableOpacity
                    className="bg-[#fc6a19] px-3 py-2 rounded-lg self-center mr-2"
                    onPress={handleStartNavigation}
                  >
                    <Text className="text-white font-[medium]">
                      Start Shipping
                    </Text>
                  </TouchableOpacity>
                  {/* <TouchableOpacity
                    className="bg-[#e0e0e0] px-3 self-center py-2 rounded-lg"
                    onPress={() => setShowInstructions(!showInstructions)}
                  >
                    <Text className="text-[#333] font-[medium]">
                      {showInstructions ? "Hide" : "Steps"}
                    </Text>
                  </TouchableOpacity> */}
                </View>
              </View>
              <Text className="text-[#666]">
                Delivery to{" "}
                {userAddress
                  ? `${userAddress.street}, ${userAddress.commune}, ${userAddress.district}, ${userAddress.city}`
                  : "Customer"}
              </Text>

              {/* Simulation Controls */}
              <View className="mt-2 pt-2 border-t border-gray-200">
                <View className="flex-row justify-between items-center">
                  {!isSimulating ? (
                    <TouchableOpacity
                      className="bg-[#4CAF50] px-3 py-2 rounded-lg"
                      onPress={startSimulation}
                    >
                      <Text className="text-white font-[medium]">
                        Simulate Drive
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      className="bg-[#F44336] px-3 py-2 rounded-lg"
                      onPress={stopSimulation}
                    >
                      <Text className="text-white font-[medium]">
                        Stop Simulation
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Off-route indicator */}
        {navigationMode && isOffRoute && (
          <View className="absolute top-24 left-4 right-4 bg-[#f9a825] p-2 rounded-lg shadow-md">
            <Text className="text-white text-center font-[medium]">
              Route updated based on your current location
            </Text>
          </View>
        )}

        {/* Turn-by-turn instructions (only shown when not in navigation mode) */}
        {/* {!navigationMode &&
          showInstructions &&
          routeInstructions.length > 0 && (
            <View className="absolute bottom-36 left-4 right-4 bg-white rounded-lg shadow-md max-h-60">
              <ScrollView className="p-2">
                {routeInstructions.map((step, index) => (
                  <View
                    key={index}
                    className="flex-row items-center p-2 border-b border-gray-100"
                  >
                    <View className="bg-[#f0f0f0] rounded-full w-10 h-10 items-center justify-center mr-3">
                      <Ionicons
                        name={getManeuverIcon(step.maneuver)}
                        size={20}
                        color="#fc6a19"
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="font-[medium]">{step.instructions}</Text>
                      <Text className="text-[#666] text-xs">
                        {step.distance} · {step.duration}
                      </Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          )} */}

        {/* Order Info Overlay */}
        <View className="absolute bottom-0 left-0 right-0 bg-white p-4 rounded-t-2xl shadow-lg">
          <Text className="text-lg font-[bold] mb-2">
            Order #{order._id.slice(-6)}
          </Text>
          <Text className="text-lg font-[bold] mb-2">Customer Info</Text>
          <View className="flex-col">
            <Text className="text-[#666] mb-4">
              Name: {order.userInfo.fullName}
            </Text>
            <Text className="text-[#666] mb-4">Phone: {userAddress.phone}</Text>
          </View>

          {calculateDistance(
            driverLocation.coords.latitude,
            driverLocation.coords.longitude,
            customerLocation.latitude,
            customerLocation.longitude
          ) <= DELIVERY_RADIUS && (
            <TouchableOpacity
              className="bg-[#fc6a19] p-4 rounded-lg"
              onPress={handleConfirmDelivery}
            >
              <Text className="text-white text-center font-[bold]">
                Confirm Delivery
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
