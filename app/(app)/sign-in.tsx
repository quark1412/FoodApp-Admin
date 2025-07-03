import { Button } from "@/components/button";
import { Input } from "@/components/input";
import React, { useState } from "react";
import { SafeAreaView, ScrollView, Text, View } from "react-native";
import { useSession } from "@/ctx";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Checkbox } from "@/components/checkbox";
import { useToast } from "@/contexts/toastContext";
import instance from "@/configs/axiosConfig";
import { jwtDecode } from "jwt-decode";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDispatch } from "react-redux";
import { getShoppingCartByUserId } from "@/services/shoppingCarts";
import { mergeCart } from "@/slices/cartSlice";

interface LoginResponse {
  data: {
    accessToken: string;
    refreshToken: string;
    [key: string]: any;
  };
}

interface ErrorResponse {
  response?: {
    status: number;
    data: {
      error: string;
      data?: {
        userId?: string;
      };
    };
  };
  status?: number;
}

export default function SignIn() {
  // const { signIn } = useSession();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [rememberMe, setRememberMe] = useState<boolean>(false);
  const { showToast } = useToast();
  const dispatch = useDispatch();

  const login = async (
    email: string,
    password: string
    // setUser: (user: any) => void,
    // setAuth: React.Dispatch<React.SetStateAction<{ isAuth: boolean }>>
  ): Promise<void> => {
    try {
      const response = await instance.post<LoginResponse>(
        "/auth/login",
        { email, password },
        { requiresAuth: false } as any
      );

      showToast("Login successfully", "success");

      const { accessToken, refreshToken } = response.data.data;

      const decoded = jwtDecode(accessToken);
      // setUser(decoded);

      // setAuth((prev) => ({ ...prev, isAuth: true }));

      await AsyncStorage.setItem("accessToken", accessToken);
      await AsyncStorage.setItem("refreshToken", refreshToken);
      await AsyncStorage.setItem(
        "user",
        JSON.stringify(jwtDecode(accessToken))
      );

      // Check if user is admin before allowing access
      const decodedUser = jwtDecode(accessToken) as any;
      if (decodedUser.roleId) {
        try {
          const { getUserRoleById } = await import("@/services/user");
          const roleData = await getUserRoleById(decodedUser.roleId);

          if (roleData.roleName.toLowerCase() !== "admin") {
            // User is not admin, they will be redirected by AdminGuard
            showToast("Admin access required", "error");
            // Still continue with login to let AdminGuard handle the redirect
          }
        } catch (roleError) {
          console.error("Error checking user role:", roleError);
          showToast("Error verifying permissions", "error");
        }
      }
    } catch (error: unknown) {
      const err = error as ErrorResponse;
      console.log(error);

      // setAuth((prev) => ({ ...prev, isAuth: false }));

      // if (err.response?.status === 400) {
      //   showToast("Tài khoản của bạn chưa được xác thực", "error");

      //   const userId = err.response.data.data?.userId;

      //   if (userId) {
      //     await toast.promise(
      //       instance.post(
      //         "/auth/sendMailVerifyAccount",
      //         { email, id: userId },
      //         { requiresAuth: false } as any
      //       ),
      //       {
      //         loading: "Đang gửi email xác thực...",
      //         success: "Email xác thực được gửi thành công",
      //         error: "Gửi email xác thực thất bại",
      //       }
      //     );
      //   }
      // } else {
      showToast(err.response?.data.error || "Failed to login!", "error");
      // }

      throw error;
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      showToast("Please fill in all fields", "warning");
      return;
    }

    try {
      await login(email, password);
      router.replace("/dashboard");
      return;
    } catch (error: any) {
      console.log(error);
    }
  };

  const handleLoginWithGoogle = async () => {
    try {
    } catch (error: any) {
      console.log(error.message);
    }
  };

  const navigateToForgotPassword = () => {
    router.replace("/forgot-password");
  };

  return (
    <SafeAreaView className="bg-[#fc6a19] flex-1">
      <Text className="text-white ml-4 text-2xl my-8 font-[semibold]">
        Sign In
      </Text>
      <ScrollView
        indicatorStyle="black"
        showsVerticalScrollIndicator={true}
        className="bg-white flex-1 rounded-t-2xl p-4"
      >
        <Text className="my-4 text-2xl font-[bold]">Welcome back!</Text>
        <Text className="font-[regular] text-[#1e1b1b]">
          To keep connected with us, please login with your personal info.
        </Text>
        <View className="w-full mt-6 gap-y-4">
          <Input
            icon={<Ionicons name="mail-outline" size={20} />}
            placeholder="Email address"
            value={email}
            onChangeText={(e: any) => {
              setEmail(e);
            }}
            viewProps="bg-[#e9e9e9]"
          />
          <Input
            icon={<Ionicons name="lock-closed-outline" size={20} />}
            placeholder="Password"
            value={password}
            onChangeText={(e: any) => {
              setPassword(e);
            }}
            type="password"
            viewProps="bg-[#e9e9e9]"
          />
        </View>
        <View className="flex flex-row mt-4 mb-6 justify-end">
          <Text
            className="font-[semibold] text-[#fc6a19]"
            onPress={navigateToForgotPassword}
          >
            Forgot password?
          </Text>
        </View>
        <Button
          text="Login"
          textColor="#fff"
          viewProps="p-3"
          backgroundColor="#fc6a19"
          onPress={handleLogin}
        />
        {/* <View className="flex flex-row items-center gap-4 my-6">
          <View className="flex-1 h-0 border border-[#e9e9e9]"></View>
          <Text className="font-[regular] text-[#ababab]">
            or continue with
          </Text>
          <View className="flex-1 h-0 border border-[#e9e9e9]"></View>
        </View>
        <Button
          icon={<Ionicons name="logo-google" size={24} color="#1e1b1b" />}
          text="Continue with Google"
          textColor="#1e1b1b"
          viewProps="p-3"
          backgroundColor="#e9e9e9"
          onPress={handleLoginWithGoogle}
        /> */}
      </ScrollView>
    </SafeAreaView>
  );
}
