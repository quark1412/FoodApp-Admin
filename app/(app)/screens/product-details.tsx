import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useToast } from "../../../contexts/toastContext";
import { getProductById } from "../../../services/products";
import { getCategoryById } from "../../../services/categories";
import { getProductVariantsByProductId } from "../../../services/productVariants";

interface ProductImage {
  _id: string;
  url: string;
  publicId: string;
}

interface Variant {
  _id: string;
  size: string;
  stock: number;
}

export default function ProductDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [productName, setProductName] = useState("");
  const [photos, setPhotos] = useState<ProductImage[]>([]);
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [variants, setVariants] = useState<Variant[]>([]);

  useEffect(() => {
    fetchProductData();
  }, [id]);

  const fetchProductData = async () => {
    try {
      setLoading(true);

      // Fetch product data
      const product = await getProductById(id!);
      console.log(product);
      setProductName(product.name);
      setPrice(product.price.toString());
      setDescription(product.description);

      // Set images
      if (product.images) {
        setPhotos(product.images);
      }

      // Fetch category
      if (product.categoryId) {
        const fetchedCategory = await getCategoryById(product.categoryId);
        console.log(fetchedCategory);
        setCategory(fetchedCategory.name);
      }

      // Fetch variants
      const fetchedVariants = await getProductVariantsByProductId(id!);
      if (fetchedVariants.length > 0) {
        const variantsData = fetchedVariants.map((variant: any) => ({
          _id: variant._id,
          size: variant.size,
          stock: variant.stock,
        }));
        setVariants(variantsData);
      }
    } catch (error) {
      console.log("Error fetching product data:", error);
      showToast("Error loading product information", "error");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#fc6a19" />
          <Text className="mt-4 text-gray-600">
            Loading product information...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-6 py-4 border-b border-gray-200">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mr-4 p-2 -ml-2"
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text className="font-[bold] text-xl text-gray-900">
            Product Details
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-6 py-6">
        {/* Product Images */}
        <View className="bg-white rounded-lg p-6 mb-6 shadow-sm">
          <Text className="font-[bold] text-lg text-gray-900 mb-4">
            Product Images
          </Text>

          {photos.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row">
                {photos.map((photo, index) => (
                  <View key={index} className="mr-4">
                    <Image
                      source={{ uri: photo.url }}
                      className="w-32 h-32 rounded-lg bg-gray-200"
                      resizeMode="cover"
                    />
                  </View>
                ))}
              </View>
            </ScrollView>
          ) : (
            <View className="h-32 border-2 border-dashed border-gray-300 rounded-lg items-center justify-center bg-gray-50">
              <Ionicons name="image-outline" size={32} color="#9CA3AF" />
              <Text className="font-[regular] text-gray-500 mt-2">
                No images
              </Text>
            </View>
          )}
        </View>

        {/* Product Information */}
        <View className="bg-white rounded-lg p-6 mb-6 shadow-sm">
          <Text className="font-[bold] text-lg text-gray-900 mb-4">
            Product Information
          </Text>

          {/* Product Name */}
          <View className="mb-4">
            <Text className="font-[semibold] text-sm text-gray-700 mb-2">
              Product Name
            </Text>
            <View className="border border-gray-300 rounded-lg px-4 py-3 bg-gray-50">
              <Text className="font-[regular] text-gray-600 text-base">
                {productName || "No product name"}
              </Text>
            </View>
          </View>

          {/* Category and Price */}
          <View className="flex-row mb-4">
            <View className="flex-1 mr-3">
              <Text className="font-[semibold] text-sm text-gray-700 mb-2">
                Category
              </Text>
              <View className="border border-gray-300 rounded-lg px-4 py-3 bg-gray-50">
                <Text className="font-[regular] text-gray-600 text-base">
                  {category || "No category"}
                </Text>
              </View>
            </View>

            <View className="flex-1 ml-3">
              <Text className="font-[semibold] text-sm text-gray-700 mb-2">
                Price (VND)
              </Text>
              <View className="border border-gray-300 rounded-lg px-4 py-3 bg-gray-50">
                <Text className="font-[regular] text-gray-600 text-base">
                  {price
                    ? `${parseInt(price).toLocaleString("vi-VN")} VND`
                    : "0 VND"}
                </Text>
              </View>
            </View>
          </View>

          {/* Description */}
          <View className="mb-4">
            <Text className="font-[semibold] text-sm text-gray-700 mb-2">
              Product Description
            </Text>
            <View className="border border-gray-300 rounded-lg px-4 py-3 bg-gray-50 min-h-24">
              <Text className="font-[regular] text-gray-600 text-base">
                {description || "No description"}
              </Text>
            </View>
          </View>
        </View>

        {/* Product Variants */}
        <View className="bg-white rounded-lg p-6 mb-6 shadow-sm">
          <Text className="font-[bold] text-lg text-gray-900 mb-4">
            Product Variants
          </Text>

          {variants.length > 0 ? (
            variants.map((variant, index) => (
              <View
                key={variant._id}
                className="mb-4 p-4 bg-gray-50 rounded-lg"
              >
                <View className="flex-row items-center mb-3">
                  <Ionicons name="pricetag-outline" size={16} color="#6B7280" />
                  <Text className="font-[semibold] text-gray-700 ml-2">
                    Variant {index + 1}
                  </Text>
                </View>

                <View className="flex-row">
                  <View className="flex-1 mr-3">
                    <Text className="font-[semibold] text-sm text-gray-700 mb-2">
                      Size
                    </Text>
                    <View className="border border-gray-300 rounded-lg px-4 py-3 bg-white">
                      <Text className="font-[regular] text-gray-600 text-base">
                        {variant.size || "No size"}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-1 ml-3">
                    <Text className="font-[semibold] text-sm text-gray-700 mb-2">
                      Stock Quantity
                    </Text>
                    <View className="border border-gray-300 rounded-lg px-4 py-3 bg-white">
                      <Text className="font-[regular] text-gray-600 text-base">
                        {variant.stock.toLocaleString("vi-VN")} items
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View className="p-8 items-center justify-center bg-gray-50 rounded-lg">
              <Ionicons name="cube-outline" size={32} color="#9CA3AF" />
              <Text className="font-[regular] text-gray-500 mt-2 text-center">
                No variants available for this product
              </Text>
            </View>
          )}
        </View>

        {/* Product Stats */}
        <View className="bg-white rounded-lg p-6 mb-8 shadow-sm">
          <Text className="font-[bold] text-lg text-gray-900 mb-4">
            Product Statistics
          </Text>

          <View className="flex-row">
            <View className="flex-1 items-center p-4 bg-blue-50 rounded-lg mr-2">
              <Ionicons name="layers-outline" size={24} color="#3B82F6" />
              <Text className="font-[regular] text-sm text-gray-600 mt-1">
                Total Variants
              </Text>
              <Text className="font-[bold] text-xl text-blue-600 mt-1">
                {variants.length}
              </Text>
            </View>

            <View className="flex-1 items-center p-4 bg-green-50 rounded-lg ml-2">
              <Ionicons name="cube-outline" size={24} color="#10B981" />
              <Text className="font-[regular] text-sm text-gray-600 mt-1">
                Stock
              </Text>
              <Text className="font-[bold] text-xl text-green-600 mt-1">
                {variants.reduce((total, variant) => total + variant.stock, 0)}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-[#fc6a19] py-4 rounded-lg items-center mb-8"
        >
          <Text className="font-[bold] text-white text-base">Go Back</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
