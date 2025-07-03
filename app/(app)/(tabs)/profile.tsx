import {
  SafeAreaView,
  View,
  Text,
  Image,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, useNavigation } from "expo-router";
import { useToast } from "@/contexts/toastContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import instance from "@/configs/axiosConfig";
import { useDispatch, useSelector } from "react-redux";
import { emptyCart } from "@/slices/cartSlice";
import {
  createShoppingCart,
  deleteShoppingCartById,
  getShoppingCartByUserId,
  updateShoppingCartQuantityById,
} from "@/services/shoppingCarts";
import { getProductVariantByProductInfo } from "@/services/productVariants";
import { useCallback, useEffect, useState } from "react";

export default function Profile() {
  const { showToast } = useToast();
  const [user, setUser] = useState<any>(null);

  const loadUserData = useCallback(async () => {
    const userData = await AsyncStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  useFocusEffect(
    useCallback(() => {
      loadUserData();
    }, [loadUserData])
  );

  const logout = async () => {
    try {
      let refreshToken = await AsyncStorage.getItem("refreshToken");
      const user = (await AsyncStorage.getItem("user"))
        ? JSON.parse((await AsyncStorage.getItem("user")) || "null")
        : null;
      const response = await instance.post(
        "/auth/logout",
        {
          refreshToken: refreshToken,
        },
        { requiresAuth: true } as any
      );
      if (response.status === 200) {
        AsyncStorage.removeItem("accessToken");
        AsyncStorage.removeItem("refreshToken");
        AsyncStorage.removeItem("permission");
        showToast("Logout successfully", "success");
        router.replace("/sign-in");
        AsyncStorage.removeItem("user");
      }
    } catch (error: any) {
      console.log(error);
      showToast(error?.response?.data?.message || "Failed to logout!", "error");
    }
  };

  const handleSignOut = () => {
    logout();
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="p-4">
        <Text className="font-[bold] text-xl">Profile</Text>
      </View>

      <View className="items-center p-4">
        <Image
          source={{ uri: user?.avatarPath }}
          className="w-24 h-24 rounded-full"
        />
        <Text className="font-[bold] text-xl mt-4">{user?.fullName}</Text>
      </View>

      <View className="p-4 flex-1">
        <TouchableOpacity
          className="flex-row items-center p-4 bg-gray-50 rounded-xl mb-3"
          onPress={() => router.push("/screens/edit-profile")}
        >
          <Ionicons name="person-outline" size={24} color="#1e1b1b" />
          <Text className="ml-3 font-[semibold]">Edit Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-row items-center p-4 bg-red-50 rounded-xl mt-auto"
          onPress={handleSignOut}
        >
          <Ionicons name="log-out-outline" size={24} color="#ef4444" />
          <Text className="ml-3 font-[semibold] text-red-500">Sign Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
