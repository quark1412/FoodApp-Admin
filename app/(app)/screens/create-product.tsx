import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  TextInput,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";

// Services
import { createProduct, createProductImages } from "../../../services/products";
import { getAllCategories } from "../../../services/categories";
import { createProductVariant } from "../../../services/productVariants";

// Components
import { useToast } from "../../../contexts/toastContext";

interface Category {
  _id: string;
  name: string;
  isActive: boolean;
}

interface ProductVariant {
  size: string;
  quantity: string;
}

interface ProductImage {
  imagePath: string;
  imageFile: any;
}

export default function CreateProduct() {
  const [productName, setProductName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [selectedCategoryName, setSelectedCategoryName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<ProductImage[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([
    { size: "", quantity: "" },
  ]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    fetchCategories();
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Sorry, we need camera roll permissions to upload images!"
      );
    }
  };

  const fetchCategories = async () => {
    try {
      const fetchedCategories = await getAllCategories();
      setCategories(fetchedCategories.filter((cat: Category) => cat.isActive));
    } catch (error) {
      console.error("Error fetching categories:", error);
      showToast("Failed to fetch categories", "error");
    }
  };

  const handlePhotoSelect = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        aspect: [1, 1],
      });

      if (!result.canceled && result.assets) {
        const newPhotos = result.assets.map((asset) => ({
          imagePath: asset.uri,
          imageFile: {
            uri: asset.uri,
            type: "image/jpeg",
            name: `image_${Date.now()}.jpg`,
          },
        }));
        setPhotos((prev) => [...prev, ...newPhotos]);
      }
    } catch (error) {
      console.error("Error selecting images:", error);
      showToast("Failed to select images", "error");
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCategorySelect = (category: Category) => {
    setCategoryId(category._id);
    setSelectedCategoryName(category.name);
    setShowCategoryModal(false);
  };

  const handleAddVariant = () => {
    setVariants((prev) => [...prev, { size: "", quantity: "" }]);
  };

  const handleRemoveVariant = (index: number) => {
    if (variants.length > 1) {
      setVariants((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleVariantChange = (
    index: number,
    field: keyof ProductVariant,
    value: string
  ) => {
    setVariants((prev) => {
      const newVariants = [...prev];
      newVariants[index][field] = value;
      return newVariants;
    });
  };

  const validateForm = () => {
    if (!productName.trim()) {
      showToast("Product name is required", "error");
      return false;
    }
    if (!categoryId) {
      showToast("Please select a category", "error");
      return false;
    }
    if (!price.trim() || isNaN(Number(price)) || Number(price) <= 0) {
      showToast("Please enter a valid price", "error");
      return false;
    }
    if (!description.trim()) {
      showToast("Description is required", "error");
      return false;
    }
    if (photos.length === 0) {
      showToast("Please add at least one product image", "error");
      return false;
    }

    // Validate variants
    for (let i = 0; i < variants.length; i++) {
      const variant = variants[i];
      if (!variant.size.trim()) {
        showToast(`Size is required for variant ${i + 1}`, "error");
        return false;
      }
      if (
        !variant.quantity.trim() ||
        isNaN(Number(variant.quantity)) ||
        Number(variant.quantity) < 0
      ) {
        showToast(
          `Please enter a valid quantity for variant ${i + 1}`,
          "error"
        );
        return false;
      }
    }

    return true;
  };

  const handleCreateProduct = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Create product
      const productResponse = await createProduct(
        productName.trim(),
        description.trim(),
        categoryId,
        Number(price),
        0
      );

      if (productResponse) {
        const productId = productResponse._id;

        // Upload images
        if (photos.length > 0) {
          await createProductImages(productId, photos);
        }

        // Create variants
        await Promise.all(
          variants.map((variant) =>
            createProductVariant(
              productId,
              variant.size.trim(),
              Number(variant.quantity)
            )
          )
        );

        showToast("Product created successfully!", "success");
        router.back();
      }
    } catch (error: any) {
      console.error("Error creating product:", error);
      showToast(
        error?.response?.data?.message || "Failed to create product",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const renderCategoryModal = () => (
    <Modal
      visible={showCategoryModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowCategoryModal(false)}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white rounded-t-3xl max-h-3/4">
          <View className="flex-row justify-between items-center p-5 border-b border-gray-200">
            <Text className="font-[bold] text-lg text-gray-900">
              Select Category
            </Text>
            <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          <ScrollView className="max-h-96">
            {categories.map((category) => (
              <TouchableOpacity
                key={category._id}
                className={`flex-row justify-between items-center py-4 px-5 border-b border-gray-100 ${
                  categoryId === category._id ? "bg-orange-50" : ""
                }`}
                onPress={() => handleCategorySelect(category)}
              >
                <Text
                  className={`font-[regular] text-base ${
                    categoryId === category._id
                      ? "text-orange-600 font-[semibold]"
                      : "text-gray-900"
                  }`}
                >
                  {category.name}
                </Text>
                {categoryId === category._id && (
                  <Ionicons name="checkmark" size={20} color="#fc6a19" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center justify-between px-4 py-4 bg-white border-b border-gray-200">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text className="font-[bold] text-lg text-gray-900">
          Add New Product
        </Text>
        <View className="w-6" />
      </View>

      <ScrollView
        className="flex-1 p-4"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Images Section */}
        <View className="bg-gray-50 rounded-xl p-4 mb-4">
          <Text className="font-[bold] text-base text-gray-900 mb-4">
            Product Images <Text className="text-red-500">*</Text>
          </Text>
          <View className="min-h-32">
            {photos.length === 0 ? (
              <TouchableOpacity
                className="h-32 border-2 border-dashed border-orange-500 rounded-xl justify-center items-center bg-orange-50"
                onPress={handlePhotoSelect}
              >
                <Ionicons name="camera-outline" size={40} color="#fc6a19" />
                <Text className="font-[semibold] text-orange-500 mt-2">
                  Upload Images
                </Text>
              </TouchableOpacity>
            ) : (
              <View className="flex-row flex-wrap gap-2">
                {photos.map((photo, index) => (
                  <View key={index} className="relative w-20 h-20">
                    <Image
                      source={{ uri: photo.imagePath }}
                      className="w-full h-full rounded-xl bg-gray-200"
                    />
                    <TouchableOpacity
                      className="absolute -top-2 -right-2 bg-red-500 rounded-full w-5 h-5 justify-center items-center"
                      onPress={() => handleRemovePhoto(index)}
                    >
                      <Ionicons name="close" size={12} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
                <TouchableOpacity
                  className="w-20 h-20 border-2 border-dashed border-orange-500 rounded-xl justify-center items-center bg-orange-50"
                  onPress={handlePhotoSelect}
                >
                  <Ionicons name="add" size={24} color="#fc6a19" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Product Info Section */}
        <View className="bg-gray-50 rounded-xl p-4 mb-4">
          <Text className="font-[bold] text-base text-gray-900 mb-4">
            Product Information
          </Text>

          <View className="mb-4">
            <Text className="font-[semibold] text-sm text-gray-700 mb-2">
              Product Name <Text className="text-red-500">*</Text>
            </Text>
            <TextInput
              className="border border-gray-300 rounded-xl px-4 py-3 font-[regular] text-gray-900 bg-white"
              placeholder="Enter product name"
              value={productName}
              onChangeText={setProductName}
            />
          </View>

          <View className="flex-row gap-3 mb-4">
            <View className="flex-1">
              <Text className="font-[semibold] text-sm text-gray-700 mb-2">
                Category <Text className="text-red-500">*</Text>
              </Text>
              <TouchableOpacity
                className="flex-row justify-between items-center border border-gray-300 rounded-xl px-4 py-3 bg-white"
                onPress={() => setShowCategoryModal(true)}
              >
                <Text
                  className={`font-[regular] text-base ${
                    !selectedCategoryName ? "text-gray-500" : "text-gray-900"
                  }`}
                >
                  {selectedCategoryName || "Select category"}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#666" />
              </TouchableOpacity>
            </View>

            <View className="flex-1">
              <Text className="font-[semibold] text-sm text-gray-700 mb-2">
                Price (VND) <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                className="border border-gray-300 rounded-xl px-4 py-3 font-[regular] text-gray-900 bg-white"
                placeholder="0"
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View className="mb-4">
            <Text className="font-[semibold] text-sm text-gray-700 mb-2">
              Description <Text className="text-red-500">*</Text>
            </Text>
            <TextInput
              className="border border-gray-300 rounded-xl px-4 py-3 font-[regular] text-gray-900 bg-white h-20"
              placeholder="Write a brief description about the product..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Variants Section */}
        <View className="bg-gray-50 rounded-xl p-4 mb-4">
          <Text className="font-[bold] text-base text-gray-900 mb-4">
            Product Variants
          </Text>
          {variants.map((variant, index) => (
            <View key={index} className="flex-row items-end gap-3 mb-4">
              <View className="flex-1 flex-row gap-3">
                <View className="flex-1">
                  <Text className="font-[semibold] text-sm text-gray-700 mb-2">
                    Size <Text className="text-red-500">*</Text>
                  </Text>
                  <TextInput
                    className="border border-gray-300 rounded-xl px-4 py-3 font-[regular] text-gray-900 bg-white"
                    placeholder="e.g., S, M, L"
                    value={variant.size}
                    onChangeText={(value) =>
                      handleVariantChange(index, "size", value)
                    }
                  />
                </View>

                <View className="flex-1">
                  <Text className="font-[semibold] text-sm text-gray-700 mb-2">
                    Quantity <Text className="text-red-500">*</Text>
                  </Text>
                  <TextInput
                    className="border border-gray-300 rounded-xl px-4 py-3 font-[regular] text-gray-900 bg-white"
                    placeholder="0"
                    value={variant.quantity}
                    onChangeText={(value) =>
                      handleVariantChange(index, "quantity", value)
                    }
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {variants.length > 1 && (
                <TouchableOpacity
                  className="p-2 bg-red-50 rounded-xl"
                  onPress={() => handleRemoveVariant(index)}
                >
                  <Ionicons name="trash-outline" size={20} color="#F44336" />
                </TouchableOpacity>
              )}
            </View>
          ))}

          <TouchableOpacity
            className="flex-row items-center justify-center gap-2 py-3 px-4 border border-orange-500 rounded-xl bg-orange-50"
            onPress={handleAddVariant}
          >
            <Ionicons name="add-circle-outline" size={20} color="#fc6a19" />
            <Text className="font-[semibold] text-orange-500">Add Variant</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Footer */}
      <View className="bg-white px-4 py-3 border-t border-gray-200">
        <TouchableOpacity
          className={`py-4 rounded-xl items-center ${
            loading ? "bg-gray-400" : "bg-orange-500"
          }`}
          onPress={handleCreateProduct}
          disabled={loading}
        >
          <Text className="font-[bold] text-white">
            {loading ? "Creating..." : "Create Product"}
          </Text>
        </TouchableOpacity>
      </View>

      {renderCategoryModal()}
    </SafeAreaView>
  );
}
