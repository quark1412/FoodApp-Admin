import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";

import { useToast } from "../../../contexts/toastContext";
import { getAllCategories } from "../../../services/categories";
import {
  getProductById,
  updateProduct,
  createProductImages,
  deleteProductImageById,
} from "../../../services/products";
import {
  getProductVariantsByProductId,
  createProductVariant,
  updateProductVariant,
  deleteProductVariant,
} from "../../../services/productVariants";

interface Category {
  _id: string;
  name: string;
  isActive: boolean;
}

interface ProductImage {
  _id?: string;
  url?: string;
  publicId?: string;
  imagePath?: string;
  imageFile?: any;
}

interface Variant {
  _id?: string;
  size: string;
  quantity: string;
  stock?: number;
}

export default function UpdateProduct() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [productName, setProductName] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<ProductImage[]>([]);
  const [currentPhotos, setCurrentPhotos] = useState<ProductImage[]>([]);
  const [variants, setVariants] = useState<Variant[]>([
    { size: "", quantity: "" },
  ]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch product data
      const product = await getProductById(id!);
      setProductName(product.name);
      setPrice(product.price.toString());
      setDescription(product.description);
      setCategoryId(product.categoryId);

      // Set images
      if (product.images) {
        console.log("Product images:", product.images);
        setPhotos(product.images);
        setCurrentPhotos(product.images);
      }

      // Fetch variants
      const fetchedVariants = await getProductVariantsByProductId(id!);
      if (fetchedVariants.length > 0) {
        const variantsData = fetchedVariants.map((variant: any) => ({
          _id: variant._id,
          size: variant.size,
          quantity: variant.stock.toString(),
          stock: variant.stock,
        }));
        setVariants(variantsData);
      }

      // Fetch categories
      const fetchedCategories = await getAllCategories();
      const activeCategories = fetchedCategories.filter(
        (cat: Category) => cat.isActive
      );
      setCategories(activeCategories);
    } catch (error) {
      console.error("Error fetching data:", error);
      showToast("Error loading product data", "error");
    } finally {
      setLoading(false);
    }
  };

  const pickImages = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        aspect: [1, 1],
      });

      if (!result.canceled) {
        const newImages = result.assets.map((asset) => ({
          imagePath: asset.uri,
          imageFile: asset,
        }));
        setPhotos((prev) => [...prev, ...newImages]);
      }
    } catch (error) {
      console.error("Error picking images:", error);
      showToast("Error selecting images", "error");
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const addVariant = () => {
    setVariants((prev) => [...prev, { size: "", quantity: "" }]);
  };

  const updateVariant = (
    index: number,
    field: keyof Variant,
    value: string
  ) => {
    setVariants((prev) => {
      const newVariants = [...prev];
      newVariants[index] = { ...newVariants[index], [field]: value };
      return newVariants;
    });
  };

  const removeVariant = (index: number) => {
    if (variants.length > 1) {
      setVariants((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const validateForm = (): boolean => {
    if (!productName.trim()) {
      showToast("Please enter product name", "error");
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
      showToast("Please enter product description", "error");
      return false;
    }
    if (photos.length === 0) {
      showToast("Please add at least one product image", "error");
      return false;
    }

    // Validate variants
    for (const variant of variants) {
      if (!variant.size.trim()) {
        showToast("Please enter size for all variants", "error");
        return false;
      }
      if (
        !variant.quantity.trim() ||
        isNaN(Number(variant.quantity)) ||
        Number(variant.quantity) < 0
      ) {
        showToast("Please enter valid quantity for all variants", "error");
        return false;
      }
    }

    return true;
  };

  const handleUpdateProduct = async () => {
    if (!validateForm()) return;

    try {
      setUpdating(true);

      // Update product info
      await updateProduct(
        id!,
        productName,
        description,
        categoryId,
        Number(price)
      );

      // Handle image updates
      const existingImages = currentPhotos;
      const existingImagesMap = existingImages.reduce(
        (map: any, image: ProductImage) => {
          map[image.publicId!] = image;
          return map;
        },
        {}
      );

      // Find new images to upload
      const newImages = photos.filter((photo) => !photo.publicId);
      if (newImages.length > 0) {
        await createProductImages(id!, newImages);
      }

      // Find images to delete
      const imagesToDelete = existingImages.filter(
        (existing) =>
          !photos.some((photo) => photo.publicId === existing.publicId)
      );

      // Delete removed images
      for (const image of imagesToDelete) {
        await deleteProductImageById(id!, image.publicId!);
      }

      // Handle variant updates
      const existingVariants = await getProductVariantsByProductId(id!);
      const existingVariantsMap = existingVariants.reduce(
        (map: any, variant: any) => {
          map[variant.size] = variant;
          return map;
        },
        {}
      );

      // Update or create variants
      for (const variant of variants) {
        const existingVariant = existingVariantsMap[variant.size];

        if (existingVariant) {
          // Update existing variant if changed
          const hasChanged =
            existingVariant.stock !== Number(variant.quantity) ||
            existingVariant.size !== variant.size;

          if (hasChanged) {
            await updateProductVariant(
              existingVariant._id,
              existingVariant.productId,
              variant.size,
              Number(variant.quantity)
            );
          }
        } else {
          // Create new variant
          await createProductVariant(
            id!,
            variant.size,
            Number(variant.quantity)
          );
        }
      }

      // Delete removed variants
      const variantSizesToKeep = variants.map((v) => v.size);
      const variantsToDelete = existingVariants.filter(
        (existing: any) => !variantSizesToKeep.includes(existing.size)
      );

      for (const variant of variantsToDelete) {
        await deleteProductVariant(variant._id);
      }

      showToast("Product updated successfully", "success");
      router.back();
    } catch (error: any) {
      console.error("Error updating product:", error);
      showToast(
        error?.response?.data?.message || "Error updating product",
        "error"
      );
    } finally {
      setUpdating(false);
    }
  };

  const selectedCategory = categories.find((cat) => cat._id === categoryId);

  const renderCategoryModal = () => (
    <Modal
      visible={showCategoryPicker}
      transparent
      animationType="fade"
      onRequestClose={() => setShowCategoryPicker(false)}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white rounded-t-3xl max-h-3/4">
          <View className="flex-row justify-between items-center p-5 border-b border-gray-200">
            <Text className="font-[bold] text-lg text-gray-900">
              Select Category
            </Text>
            <TouchableOpacity onPress={() => setShowCategoryPicker(false)}>
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
                onPress={() => {
                  setCategoryId(category._id);
                  setShowCategoryPicker(false);
                }}
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

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#fc6a19" />
          <Text className="font-[regular] mt-4 text-gray-600">
            Loading data...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center justify-between px-4 py-4 bg-white border-b border-gray-200">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text className="font-[bold] text-lg text-gray-900">Edit Product</Text>
        <View className="w-6" />
      </View>

      <ScrollView
        className="flex-1 p-4"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Product Images */}
        <View className="bg-gray-50 rounded-xl p-4 mb-4">
          <Text className="font-[bold] text-base text-gray-900 mb-4">
            Product Images
          </Text>

          <View className="min-h-32">
            {photos.length > 0 ? (
              <View className="flex-row flex-wrap gap-2">
                {photos.map((photo, index) => (
                  <View key={index} className="relative w-20 h-20">
                    <Image
                      source={{ uri: photo.url || photo.imagePath }}
                      className="w-full h-full rounded-xl bg-gray-200"
                      resizeMode="cover"
                    />
                    <TouchableOpacity
                      className="absolute -top-2 -right-2 bg-red-500 rounded-full w-5 h-5 justify-center items-center"
                      onPress={() => removePhoto(index)}
                    >
                      <Ionicons name="close" size={12} color="white" />
                    </TouchableOpacity>
                  </View>
                ))}
                <TouchableOpacity
                  className="w-20 h-20 border-2 border-dashed border-orange-500 rounded-xl justify-center items-center bg-orange-50"
                  onPress={pickImages}
                >
                  <Ionicons name="add" size={24} color="#fc6a19" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                className="h-32 border-2 border-dashed border-orange-500 rounded-xl justify-center items-center bg-orange-50"
                onPress={pickImages}
              >
                <Ionicons name="camera-outline" size={40} color="#fc6a19" />
                <Text className="font-[semibold] text-orange-500 mt-2">
                  Upload Images
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Product Information */}
        <View className="bg-gray-50 rounded-xl p-4 mb-4">
          <Text className="font-[bold] text-base text-gray-900 mb-4">
            Product Information
          </Text>

          <View className="mb-4">
            <Text className="font-[semibold] text-sm text-gray-700 mb-2">
              Product Name
            </Text>
            <TextInput
              value={productName}
              onChangeText={setProductName}
              placeholder="Enter product name"
              className="border border-gray-300 rounded-xl px-4 py-3 font-[regular] text-gray-900 bg-white"
            />
          </View>

          <View className="flex-row gap-3 mb-4">
            <View className="flex-1">
              <Text className="font-[semibold] text-sm text-gray-700 mb-2">
                Category
              </Text>
              <TouchableOpacity
                className="flex-row justify-between items-center border border-gray-300 rounded-xl px-4 py-3 bg-white"
                onPress={() => setShowCategoryPicker(true)}
              >
                <Text
                  className={`font-[regular] text-base ${
                    selectedCategory ? "text-gray-900" : "text-gray-500"
                  }`}
                >
                  {selectedCategory ? selectedCategory.name : "Select category"}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#666" />
              </TouchableOpacity>
            </View>

            <View className="flex-1">
              <Text className="font-[semibold] text-sm text-gray-700 mb-2">
                Price (VND)
              </Text>
              <TextInput
                value={price}
                onChangeText={setPrice}
                placeholder="0"
                keyboardType="numeric"
                className="border border-gray-300 rounded-xl px-4 py-3 font-[regular] text-gray-900 bg-white"
              />
            </View>
          </View>

          <View className="mb-4">
            <Text className="font-[semibold] text-sm text-gray-700 mb-2">
              Product Description
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Enter product description"
              multiline
              numberOfLines={4}
              className="border border-gray-300 rounded-xl px-4 py-3 font-[regular] text-gray-900 bg-white h-20"
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Product Variants */}
        <View className="bg-gray-50 rounded-xl p-4 mb-4">
          <Text className="font-[bold] text-base text-gray-900 mb-4">
            Product Variants
          </Text>

          {variants.map((variant, index) => (
            <View key={index} className="flex-row items-end gap-3 mb-4">
              <View className="flex-1 flex-row gap-3">
                <View className="flex-1">
                  <Text className="font-[semibold] text-sm text-gray-700 mb-2">
                    Size
                  </Text>
                  <TextInput
                    value={variant.size}
                    onChangeText={(value) =>
                      updateVariant(index, "size", value)
                    }
                    placeholder="S, M, L, XL..."
                    className="border border-gray-300 rounded-xl px-4 py-3 font-[regular] text-gray-900 bg-white"
                  />
                </View>

                <View className="flex-1">
                  <Text className="font-[semibold] text-sm text-gray-700 mb-2">
                    Quantity
                  </Text>
                  <TextInput
                    value={variant.quantity}
                    onChangeText={(value) =>
                      updateVariant(index, "quantity", value)
                    }
                    placeholder="0"
                    keyboardType="numeric"
                    className="border border-gray-300 rounded-xl px-4 py-3 font-[regular] text-gray-900 bg-white"
                  />
                </View>
              </View>

              {variants.length > 1 && (
                <TouchableOpacity
                  className="p-2 bg-red-50 rounded-xl"
                  onPress={() => removeVariant(index)}
                >
                  <Ionicons name="trash-outline" size={20} color="#F44336" />
                </TouchableOpacity>
              )}
            </View>
          ))}

          <TouchableOpacity
            className="flex-row items-center justify-center gap-2 py-3 px-4 border border-orange-500 rounded-xl bg-orange-50"
            onPress={addVariant}
          >
            <Ionicons name="add-circle-outline" size={20} color="#fc6a19" />
            <Text className="font-[semibold] text-orange-500">Add Variant</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Footer */}
      <View className="bg-white px-4 py-3 border-t border-gray-200">
        <View className="flex-row gap-3">
          <TouchableOpacity
            onPress={() => router.back()}
            className="flex-1 py-4 bg-gray-200 rounded-xl items-center"
          >
            <Text className="font-[bold] text-gray-700">Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleUpdateProduct}
            disabled={updating}
            className={`flex-1 py-4 rounded-xl items-center ${
              updating ? "bg-gray-400" : "bg-orange-500"
            }`}
          >
            {updating ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="font-[bold] text-white">Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {renderCategoryModal()}
    </SafeAreaView>
  );
}
