import { Button } from "@/components/button";
import { Input } from "@/components/input";
import { useState, useRef, useEffect } from "react";
import {
  NativeSyntheticEvent,
  SafeAreaView,
  Text,
  TextInput,
  TextInputKeyPressEventData,
  View,
} from "react-native";
import { formatTime } from "@/utils/format";
import { router, useLocalSearchParams } from "expo-router";
import { generateOTP, sendOTP, verifyOTP } from "@/services/auth";
import { useToast } from "@/contexts/toastContext";

export default function CodeVerification() {
  const { email } = useLocalSearchParams();
  const { showToast } = useToast();
  const [verificationCode, setVerificationCode] = useState<string[]>([
    "",
    "",
    "",
    "",
    "",
    "",
  ]);
  const [expirationTime, setExpirationTime] = useState<number>(60);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (expirationTime > 0) {
      const countdown = setInterval(
        () => setExpirationTime((prev) => prev - 1),
        1000
      );
      return () => clearInterval(countdown);
    }
  }, [expirationTime]);

  const handleChange = (index: number, value: string) => {
    const newCode = [...verificationCode];

    if (value === "" && verificationCode[index] !== "") {
      newCode[index] = "";
      setVerificationCode(newCode);
      if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (value === "" || /^[0-9]$/.test(value)) {
      newCode[index] = value;
      setVerificationCode(newCode);

      if (value !== "" && index < verificationCode.length - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (
    index: number,
    event: NativeSyntheticEvent<TextInputKeyPressEventData>
  ) => {
    if (
      event.nativeEvent.key === "Backspace" &&
      verificationCode[index] === "" &&
      index > 0
    ) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyCode = async () => {
    try {
      const data = await verifyOTP(email as string, verificationCode.join(""));
      console.log(data);
      router.replace({
        pathname: "/reset-password",
        params: {
          refreshToken: data.refreshToken,
        },
      });
    } catch (error: any) {
      console.log(error.message);
      showToast("Invalid OTP", "error");
    }
  };

  const handleResendCode = async () => {
    try {
      const otp = await generateOTP(email as string);
      await sendOTP(email as string, otp);
      showToast("OTP has been resent", "success");
      setExpirationTime(60);
    } catch (error: any) {
      console.log(error.message);
      showToast("Failed to resend OTP", "error");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex flex-col p-4">
        <Text className="font-[bold] text-center text-[#1e1b1b] text-2xl mt-8">
          Enter verification code
        </Text>
        <Text className="text-[#ababab] text-center mt-4">
          Enter the verification code sent to your email
        </Text>
        <View className="flex flex-row justify-center gap-x-2 mt-12 mb-8">
          {verificationCode.map((digit, index) => (
            <TextInput
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              className="px-5 py-3 border-none bg-[#e9e9e9] font-[semibold] leading-tight text-center rounded-lg text-2xl w-14 h-14"
              maxLength={1}
              keyboardType="numeric"
              value={digit}
              onChangeText={(e) => handleChange(index, e)}
              onKeyPress={(
                e: NativeSyntheticEvent<TextInputKeyPressEventData>
              ) => handleKeyDown(index, e)}
            />
          ))}
        </View>

        <View className="px-4 py-2 border border-[#c3c3c3] rounded-lg w-fit min-w-24 items-center self-center mb-16">
          <Text className="font-[semibold]">
            {expirationTime > 0 ? formatTime(expirationTime) : "Expired Code"}
          </Text>
        </View>

        <Button
          text="Verify"
          textColor="#fff"
          viewProps="p-3"
          backgroundColor="#fc6a19"
          onPress={handleVerifyCode}
        />
        <Text className="text-center text-[#767676] my-8">
          Didn't receive any code?{" "}
          <Text
            className="font-[bold] text-[#1e1b1b] disabled:text-[#767676]"
            onPress={handleResendCode}
            disabled={expirationTime > 0}
          >
            Resend Code
          </Text>
        </Text>
      </View>
    </SafeAreaView>
  );
}
