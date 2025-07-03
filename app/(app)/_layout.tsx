import { StatusBar, Text } from "react-native";
import React from "react";
import { Redirect, Stack } from "expo-router";

import { useSession } from "../../ctx";

export default function AppLayout() {
  // const { session, isLoading } = useSession();

  // if (isLoading) {
  //   return <Text>Loading...</Text>;
  // }

  // if (!session) {
  //   return <Redirect href="/sign-in" />;
  // }

  return (
    <>
      <StatusBar barStyle={"dark-content"} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="sign-in" />
        <Stack.Screen name="code-verification" />
        <Stack.Screen name="forgot-password" />
        <Stack.Screen name="reset-password" />
        <Stack.Screen name="screens" />
      </Stack>
    </>
  );
}
