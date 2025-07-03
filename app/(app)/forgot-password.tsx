import { Button } from "@/components/button";
import { Input } from "@/components/input";
import { useToast } from "@/contexts/toastContext";
import { generateOTP, sendOTP } from "@/services/auth";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import { SafeAreaView, ScrollView, Text, View } from "react-native";

export default function ForgotPassword() {
  const [email, setEmail] = useState<string>("");
  const { showToast } = useToast();

  const sendOtpAndNavigate = async () => {
    const otp = await generateOTP(email);
    await sendOTP(email, otp);
    router.push({
      pathname: "/code-verification",
      params: {
        email: email,
      },
    });
  };

  const handleSendEmail = async () => {
    try {
      if (!email) {
        showToast("Please enter your email", "error");
        return;
      }
      await sendOtpAndNavigate();
      showToast("OTP sent successfully", "success");
    } catch (error: any) {
      console.log(error.message);
      showToast("Failed to send OTP", "error");
    }
  };

  const navigateToLogin = () => {
    router.replace("/sign-in");
  };

  return (
    <SafeAreaView className="bg-[#fc6a19] flex-1">
      <Text className="text-white ml-4 text-2xl my-8 font-[semibold]">
        Password Reset
      </Text>
      <ScrollView
        indicatorStyle="black"
        showsVerticalScrollIndicator={true}
        className="bg-white flex-1 rounded-t-2xl p-4"
      >
        <Text className="my-4 text-2xl font-[bold]">Forgot Password</Text>
        <Text className="font-[regular] text-[#1e1b1b]">
          Enter your email to reset password
        </Text>
        <View className="w-full mt-6 gap-y-4 mb-8">
          <Input
            icon={<Ionicons name="mail-outline" size={20} />}
            placeholder="Email address"
            value={email}
            onChangeText={(e: any) => {
              setEmail(e);
            }}
            viewProps="bg-[#e9e9e9]"
          />
        </View>
        <View className="flex flex-col gap-4">
          <Button
            text="Continue"
            viewProps="p-3"
            textColor="#fff"
            backgroundColor="#fc6a19"
            onPress={handleSendEmail}
          />
          <Button
            text="Cancel"
            viewProps="p-3"
            textColor="#1e1b1b"
            borderColor="#e9e9e9"
            backgroundColor="#fff"
            onPress={navigateToLogin}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
