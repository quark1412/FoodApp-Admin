import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { Slot } from "expo-router";
import { SessionProvider } from "../ctx";
import { Provider } from "react-redux";
import { store } from "@/store";

import "../global.css";
import { StatusBar } from "react-native";
import { ToastProvider } from "@/contexts/toastContext";
import * as Location from "expo-location";
import { UserLocationContext } from "@/contexts/userLocationContext";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    regular: require("../assets/fonts/Urbanist-Regular.ttf"),
    medium: require("../assets/fonts/Urbanist-Medium.ttf"),
    semibold: require("../assets/fonts/Urbanist-SemiBold.ttf"),
    light: require("../assets/fonts/Urbanist-Light.ttf"),
    bold: require("../assets/fonts/Urbanist-Bold.ttf"),
    black: require("../assets/fonts/Urbanist-Black.ttf"),
    extraBold: require("../assets/fonts/Urbanist-ExtraBold.ttf"),
  });
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  useEffect(() => {
    async function getCurrentLocation() {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied");
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
    }

    getCurrentLocation();
  }, []);

  if (!loaded && !error) {
    return null;
  }

  return (
    // <SessionProvider>
    <UserLocationContext.Provider value={{ location, setLocation }}>
      <ToastProvider>
        <Provider store={store}>
          <StatusBar barStyle={"dark-content"} />
          <Slot />
        </Provider>
      </ToastProvider>
    </UserLocationContext.Provider>
    // </SessionProvider>
  );
}
