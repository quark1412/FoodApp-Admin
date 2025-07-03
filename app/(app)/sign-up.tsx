import { Button } from "@/components/button";
import { Input } from "@/components/input";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import { SafeAreaView, ScrollView, Text, View } from "react-native";

export default function SignUp() {
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");

  const handleRegister = async () => {
    try {
      console.log("hello");
    } catch (error: any) {
      console.log(error.message);
    }
  };

  const handleLoginWithGoogle = async () => {
    try {
    } catch (error: any) {
      console.log(error.message);
    }
  };

  const navigateToLogin = () => {
    router.replace("/sign-in");
  };

  return (
    <SafeAreaView className="bg-[#fc6a19] flex-1">
      <Text className="text-white ml-4 text-2xl my-8 font-[semibold]">
        Register
      </Text>
      <ScrollView
        indicatorStyle="black"
        showsVerticalScrollIndicator={true}
        className="bg-white flex-1 rounded-t-2xl p-4"
      >
        <Text className="my-4 text-2xl font-[bold]">Welcome!</Text>
        <Text className="font-[regular] text-[#1e1b1b]">
          To keep connected with us, please register with your personal info.
        </Text>
        <View className="w-full mt-6 gap-y-4 mb-4">
          <Input
            icon={<Ionicons name="person-outline" size={20} />}
            placeholder="Your name"
            value={name}
            onChangeText={(e: any) => {
              setName(e);
            }}
            viewProps="bg-[#e9e9e9]"
          />
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
          <Input
            icon={<Ionicons name="lock-closed-outline" size={20} />}
            placeholder="Confirm password"
            value={confirmPassword}
            onChangeText={(e: any) => {
              setConfirmPassword(e);
            }}
            type="password"
            viewProps="bg-[#e9e9e9]"
          />
        </View>
        <Button
          text="Register"
          textColor="#fff"
          viewProps="p-3"
          backgroundColor="#fc6a19"
          onPress={handleRegister}
        />
        <View className="flex flex-row items-center gap-4 my-6">
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
        />
        <Text className="my-8 text-center text-[#767676]">
          Already have an account?{" "}
          <Text
            className="font-[bold] text-[#1e1b1b]"
            onPress={navigateToLogin}
          >
            Log In
          </Text>
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
