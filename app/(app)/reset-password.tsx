import { Button } from "@/components/button";
import { Input } from "@/components/input";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useState, useRef, useEffect } from "react";
import {
  NativeSyntheticEvent,
  SafeAreaView,
  Text,
  TextInput,
  TextInputKeyPressEventData,
  View,
} from "react-native";
import instance from "@/configs/axiosConfig";
import { useToast } from "@/contexts/toastContext";

export default function ResetPassword() {
  const { refreshToken } = useLocalSearchParams();
  const { showToast } = useToast();
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");

  const handleResetPassword = async (): Promise<void> => {
    const passwordPattern =
      /^(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;

    if (!password || !confirmPassword) {
      showToast("Please fill in all fields", "error");
      return;
    }

    if (!passwordPattern.test(password)) {
      showToast(
        "Password must be at least 8 characters, contain at least 1 number and 1 special character",
        "error"
      );
      return;
    }

    if (password !== confirmPassword) {
      showToast("Passwords do not match", "error");
      return;
    }

    try {
      const tokenResponse = await instance.post(
        "/auth/refreshToken",
        { refreshToken: refreshToken as string },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const accessToken: string = tokenResponse.data.data.accessToken;
      const response = await instance.post(
        "/auth/forgotPassword",
        {
          newPassword: password,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.status === 200) {
        showToast("Password reset successful!", "success");
        router.replace("/sign-in");
      }
    } catch (error: any) {
      showToast(error?.response?.data?.message || "An error occurred", "error");
    }
  };

  const navigateToLogin = () => {
    router.replace("/sign-in");
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex flex-col p-4">
        <Text className="font-[bold] text-center text-[#1e1b1b] text-2xl mt-8">
          Reset your password
        </Text>
        <Text className="text-[#ababab] text-center mt-4">
          The password must be at least 8 characters, contain at least 1 number
          and 1 special character
        </Text>

        <View className="my-8 flex flex-col gap-4">
          <Input
            icon={<Ionicons name="lock-closed-outline" size={20} />}
            placeholder="New password"
            value={password}
            onChangeText={(e) => setPassword(e)}
            viewProps="bg-[#e9e9e9]"
          />
          <Input
            icon={<Ionicons name="lock-closed-outline" size={20} />}
            placeholder="Confirm password"
            value={confirmPassword}
            onChangeText={(e) => setConfirmPassword(e)}
            viewProps="bg-[#e9e9e9]"
          />
        </View>

        <View className="flex flex-col gap-4">
          <Button
            text="Reset password"
            textColor="#fff"
            viewProps="p-3"
            backgroundColor="#fc6a19"
            onPress={handleResetPassword}
          />
          <Button
            text="Cancel"
            textColor="#1e1b1b"
            viewProps="p-3"
            borderColor="#e9e9e9"
            backgroundColor="#fff"
            onPress={navigateToLogin}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
