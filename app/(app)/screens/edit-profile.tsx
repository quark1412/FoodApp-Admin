import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  Image,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Input } from "@/components/input";
import { Button } from "@/components/button";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useToast } from "@/contexts/toastContext";
import * as ImagePicker from "expo-image-picker";
import instance from "@/configs/axiosConfig";
import { getUserById, updateUserById } from "@/services/user";

export default function EditProfile() {
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // Load user data
  useEffect(() => {
    const loadUserData = async () => {
      setLoading(true);
      try {
        const cachedUser = await AsyncStorage.getItem("user");
        console.log("Cached user:", cachedUser);
        const userData = await getUserById(
          cachedUser
            ? JSON.parse(cachedUser).id || JSON.parse(cachedUser)._id
            : null
        );
        console.log(userData);
        if (userData) {
          setUser(userData);
          setFullName(userData.fullName || "");
          setPhoneNumber(userData.phone || "");
          setProfileImage(
            cachedUser
              ? JSON.parse(cachedUser).avatarPath
              : userData.avatarPath || null
          );
        }
      } catch (error) {
        console.log("Error loading user data:", error);
        showToast("Unable to load user information", "error");
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

  // Handle image picker
  const pickImage = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        showToast("Photo library access permission required", "error");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.log("Error picking image:", error);
      showToast("Unable to select image", "error");
    }
  };

  // Handle update profile
  const handleUpdateProfile = async () => {
    if (!fullName.trim()) {
      showToast("Please enter your full name", "error");
      return;
    }

    setLoading(true);
    try {
      // Create form data for upload - matching web implementation
      const formData = new FormData();
      formData.append("fullName", fullName);
      formData.append("phone", phoneNumber);

      // Only append avatar if image is changed and is a local URI (not a remote URL)
      if (
        profileImage &&
        profileImage !== user.avatarPath &&
        !profileImage.startsWith("http")
      ) {
        const filename = profileImage.split("/").pop();
        const match = /\.(\w+)$/.exec(filename || "");
        const type = match ? `image/${match[1]}` : "image/jpeg";

        formData.append("avatarPath", {
          uri: profileImage,
          name: filename,
          type,
        } as any);
      }

      const response = await updateUserById(user._id, formData);

      if (response) {
        // Update local storage with new user data
        const updatedUser = {
          ...user,
          fullName,
          phone: phoneNumber,
          avatarPath: profileImage,
          // Ensure ID fields are preserved
          id: user.id || user._id,
          _id: user._id || user.id,
        };
        await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
        showToast("Profile updated successfully", "success");
        router.back();
      }
    } catch (error: any) {
      console.log("Error updating profile:", error);
      showToast(
        error?.response?.data?.message || "Unable to update profile",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 16 }}>
          {/* Header */}
          <View className="flex-row items-center py-4">
            <TouchableOpacity onPress={() => router.back()} className="p-2">
              <Ionicons name="arrow-back" size={24} color="black" />
            </TouchableOpacity>
            <Text className="text-lg font-bold ml-4">Edit Profile</Text>
          </View>

          {/* Profile Image */}
          <View className="items-center my-6">
            <View className="relative">
              {profileImage ? (
                <Image
                  source={{ uri: profileImage }}
                  className="w-32 h-32 rounded-full bg-gray-100"
                />
              ) : (
                <View className="w-32 h-32 rounded-full bg-gray-100 justify-center items-center">
                  <Ionicons name="person" size={60} color="#aaa" />
                </View>
              )}
              <TouchableOpacity
                className="absolute right-3 bottom-0 bg-black rounded-full w-7.5 h-7.5 justify-center items-center border-2 border-white"
                onPress={pickImage}
              >
                <Ionicons name="pencil" size={16} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Form */}
          <View className="mt-4">
            <View className="mb-4">
              <Text className="mb-2 text-base font-medium">Full Name</Text>
              <Input
                icon={<Ionicons name="person-outline" size={20} color="#888" />}
                placeholder="Enter your full name"
                value={fullName}
                onChangeText={setFullName}
                viewProps="bg-[#f5f5f5] mb-4"
              />
            </View>

            <View className="mb-4">
              <Text className="mb-2 text-base font-medium">Phone Number</Text>
              <Input
                icon={<Ionicons name="call-outline" size={20} color="#888" />}
                placeholder="Enter phone number"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                viewProps="bg-[#f5f5f5] mb-4"
              />
            </View>

            {/* Update Button */}
            <View className="my-6">
              <Button
                text="Update Changes"
                backgroundColor="#ea580c"
                textColor="#ffffff"
                viewProps="p-4 mt-8"
                onPress={handleUpdateProfile}
                disabled={loading}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Loading Overlay */}
      {loading && (
        <View className="absolute inset-0 bg-white/70 justify-center items-center z-50">
          <ActivityIndicator size="large" color="#000000" />
          <Text className="mt-2 font-medium">Updating...</Text>
        </View>
      )}
    </SafeAreaView>
  );
}
