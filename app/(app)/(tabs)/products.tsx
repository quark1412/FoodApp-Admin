import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  FlatList,
  Modal,
  TextInput,
  Image,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

// Services
import {
  getAllProducts,
  archiveProductById,
  getBestSellerProducts,
} from "../../../services/products";
import { getAllCategories } from "../../../services/categories";

// Utils
import { formatToVND } from "../../../utils/format";

// Components
import { useToast } from "../../../contexts/toastContext";

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  soldQuantity: number;
  rating: number;
  isActive: boolean;
  images: Array<{ url: string; publicId: string }>;
  categoryId: {
    _id: string;
    name: string;
  };
  createdAt: string;
}

interface Category {
  _id: string;
  name: string;
  isActive: boolean;
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name");
  const [showFilters, setShowFilters] = useState(false);
  const [archiveModalVisible, setArchiveModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [archiving, setArchiving] = useState(false);
  const { showToast } = useToast();

  const fetchProducts = async () => {
    try {
      const fetchedProducts = await getAllProducts();
      setProducts(fetchedProducts);
      setFilteredProducts(fetchedProducts);
    } catch (error) {
      console.error("Error fetching products:", error);
      showToast("Failed to fetch products", "error");
    }
  };

  const fetchCategories = async () => {
    try {
      const fetchedCategories = await getAllCategories();
      setCategories(fetchedCategories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      showToast("Failed to fetch categories", "error");
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchProducts(), fetchCategories()]);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchQuery, selectedCategory, sortBy]);

  const filterProducts = () => {
    let filtered = [...products];

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter((product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (product) => product.categoryId._id === selectedCategory
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "price":
          return a.price - b.price;
        case "soldQuantity":
          return b.soldQuantity - a.soldQuantity;
        case "createdAt":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        default:
          return 0;
      }
    });

    setFilteredProducts(filtered);
  };

  const openArchiveModal = (product: Product) => {
    setSelectedProduct(product);
    setArchiveModalVisible(true);
  };

  const handleArchiveProduct = async () => {
    if (!selectedProduct) return;

    try {
      setArchiving(true);
      await archiveProductById(selectedProduct._id);
      await fetchProducts();
      setArchiveModalVisible(false);
      setSelectedProduct(null);

      const message = selectedProduct.isActive
        ? "Product archived successfully"
        : "Product restored successfully";
      showToast(message, "success");
    } catch (error: any) {
      console.error("Error archiving product:", error);
      showToast(
        error?.response?.data?.message || "Error changing product status",
        "error"
      );
    } finally {
      setArchiving(false);
    }
  };

  const navigateToCreateProduct = () => {
    router.push("/screens/create-product");
  };

  const navigateToEditProduct = (productId: string) => {
    router.push({
      pathname: "/screens/update-product",
      params: { id: productId },
    });
  };

  const navigateToProductDetails = (productId: string) => {
    router.push({
      pathname: "/screens/product-details",
      params: { id: productId },
    });
  };

  const renderProductCard = ({ item }: { item: Product }) => (
    <TouchableOpacity
      className="bg-white rounded-xl mb-4 overflow-hidden shadow-sm"
      style={{ width: "48%" }}
      onPress={() => navigateToProductDetails(item._id)}
    >
      <View className="relative h-40">
        {item.images && item.images.length > 0 ? (
          <Image
            source={{ uri: item.images[0].url }}
            className="w-full h-full bg-gray-50"
          />
        ) : (
          <View className="w-full h-full bg-gray-50 justify-center items-center">
            <Ionicons name="image-outline" size={40} color="#ccc" />
          </View>
        )}
        <View className="absolute top-2 right-2 px-2 py-1 rounded">
          <Text
            className={`text-xs font-[semiBold] ${
              item.isActive
                ? "text-green-700 bg-green-100"
                : "text-red-700 bg-red-100"
            } px-2 py-1 rounded`}
          >
            {item.isActive ? "Active" : "Inactive"}
          </Text>
        </View>
      </View>

      <View className="p-3">
        <Text
          className="font-[bold] text-sm text-gray-900 mb-1"
          numberOfLines={2}
        >
          {item.name}
        </Text>
        <Text className="font-[regular] text-xs text-gray-600 mb-2">
          {item.categoryId.name}
        </Text>
        <Text className="font-[bold] text-base text-orange-500 mb-2">
          {formatToVND(item.price)}
        </Text>

        <View className="flex-row justify-between mb-3">
          <View className="flex-row items-center">
            <Ionicons name="star" size={14} color="#FFA000" />
            <Text className="font-[regular] text-xs text-gray-600 ml-1">
              {item.rating.toFixed(1)}
            </Text>
          </View>
          <View className="flex-row items-center">
            <Ionicons name="bag-outline" size={14} color="#666" />
            <Text className="font-[regular] text-xs text-gray-600 ml-1">
              {item.soldQuantity} sold
            </Text>
          </View>
        </View>

        <View className="flex-row justify-end gap-x-2">
          <TouchableOpacity
            className="p-2 bg-blue-50 rounded"
            onPress={() => navigateToEditProduct(item._id)}
          >
            <Ionicons name="create-outline" size={16} color="#2196F3" />
          </TouchableOpacity>
          <TouchableOpacity
            className="p-2 bg-red-50 rounded"
            onPress={() => openArchiveModal(item)}
          >
            <Ionicons name="archive-outline" size={16} color="#F44336" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderFiltersModal = () => (
    <Modal
      visible={showFilters}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView className="flex-1 bg-white">
        <View className="px-6 py-4 border-b border-gray-200">
          <View className="flex-row justify-between items-center">
            <Text className="text-xl font-[bold] text-gray-900">Filters</Text>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView className="flex-1 px-6 py-4">
          <View className="mb-6">
            <Text className="font-[semiBold] text-gray-900 mb-3">Category</Text>
            <View className="flex-row flex-wrap">
              <TouchableOpacity
                onPress={() => setSelectedCategory("all")}
                className={`px-4 py-2 rounded-full mr-2 mb-2 ${
                  selectedCategory === "all" ? "bg-orange-500" : "bg-gray-100"
                }`}
              >
                <Text
                  className={`text-sm font-[medium] ${
                    selectedCategory === "all" ? "text-white" : "text-gray-700"
                  }`}
                >
                  All
                </Text>
              </TouchableOpacity>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category._id}
                  onPress={() => setSelectedCategory(category._id)}
                  className={`px-4 py-2 rounded-full mr-2 mb-2 ${
                    selectedCategory === category._id
                      ? "bg-orange-500"
                      : "bg-gray-100"
                  }`}
                >
                  <Text
                    className={`text-sm font-[medium] ${
                      selectedCategory === category._id
                        ? "text-white"
                        : "text-gray-700"
                    }`}
                  >
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View className="mb-6">
            <Text className="font-[semiBold] text-gray-900 mb-3">Sort</Text>
            <View className="flex-row flex-wrap">
              {[
                { key: "name", label: "Name" },
                { key: "price", label: "Price" },
                { key: "soldQuantity", label: "Best Selling" },
                { key: "createdAt", label: "Newest" },
              ].map((option) => (
                <TouchableOpacity
                  key={option.key}
                  onPress={() => setSortBy(option.key)}
                  className={`px-4 py-2 rounded-full mr-2 mb-2 ${
                    sortBy === option.key ? "bg-orange-500" : "bg-gray-100"
                  }`}
                >
                  <Text
                    className={`text-sm font-[medium] ${
                      sortBy === option.key ? "text-white" : "text-gray-700"
                    }`}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        <View className="px-6 py-4 border-t border-gray-200">
          <TouchableOpacity
            onPress={() => setShowFilters(false)}
            className="bg-[#fc6a19] py-3 rounded-xl"
          >
            <Text className="text-white text-center font-[semiBold]">
              Apply Filters
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="bg-white px-6 py-4 border-b border-gray-200">
        <Text className="text-2xl font-[bold] text-gray-900 mb-4 font-urbanist">
          Products
        </Text>

        {/* Search Bar */}
        <View className="flex-row items-center mb-4">
          <View className="flex-1 flex-row items-center bg-gray-100 rounded-xl px-4 py-3 mr-3">
            <Ionicons name="search" size={20} color="#6B7280" />
            <TextInput
              className="flex-1 ml-2 text-gray-900 font-[regular] font-urbanist"
              placeholder="Search products..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity
            onPress={() => setShowFilters(true)}
            className="bg-orange-500 p-3 rounded-xl"
          >
            <Ionicons name="options" size={20} color="white" />
          </TouchableOpacity>
        </View>

        {/* Filter Tags */}
        {(selectedCategory !== "all" || sortBy !== "name") && (
          <View className="flex-row flex-wrap mb-2">
            {selectedCategory !== "all" && (
              <View className="bg-orange-100 px-3 py-1 rounded-full mr-2 mb-2">
                <Text className="text-orange-600 text-sm font-[medium] font-urbanist">
                  Category:{" "}
                  {categories.find((c) => c._id === selectedCategory)?.name}
                </Text>
              </View>
            )}
            {sortBy !== "name" && (
              <View className="bg-orange-100 px-3 py-1 rounded-full mr-2 mb-2">
                <Text className="text-orange-600 text-sm font-[medium] font-urbanist">
                  Sort:{" "}
                  {sortBy === "price"
                    ? "Price"
                    : sortBy === "soldQuantity"
                      ? "Best Selling"
                      : sortBy === "createdAt"
                        ? "Newest"
                        : "Name"}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Results Count */}
        <Text className="text-gray-600 text-sm font-[regular] font-urbanist">
          {filteredProducts.length > 0
            ? `Showing ${filteredProducts.length} products`
            : "No products found"}
        </Text>
      </View>

      <FlatList
        data={filteredProducts}
        renderItem={renderProductCard}
        keyExtractor={(item) => item._id}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: "space-between" }}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center py-20">
            <Ionicons name="bag-outline" size={64} color="#D1D5DB" />
            <Text className="text-gray-500 text-lg mt-4">
              No products found
            </Text>
          </View>
        }
      />

      {/* Add Product Button */}
      <TouchableOpacity
        onPress={navigateToCreateProduct}
        className="absolute bottom-6 right-6 bg-[#fc6a19] w-14 h-14 rounded-full justify-center items-center shadow-lg"
      >
        <Ionicons name="add" size={24} color="white" />
      </TouchableOpacity>

      {renderFiltersModal()}

      {/* Archive Confirmation Modal */}
      <Modal
        visible={archiveModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setArchiveModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="bg-white rounded-xl p-6 w-80">
            <View className="items-center mb-4">
              <Ionicons name="warning-outline" size={48} color="#F59E0B" />
              <Text className="font-[bold] text-lg text-gray-900 mt-2 text-center">
                Confirm {selectedProduct?.isActive ? "Archive" : "Restore"}
              </Text>
              <Text className="font-[regular] text-gray-600 mt-2 text-center leading-5">
                Are you sure you want to{" "}
                {selectedProduct?.isActive ? "archive" : "restore"} product "
                {selectedProduct?.name}"?
              </Text>
            </View>

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setArchiveModalVisible(false)}
                className="flex-1 py-3 bg-gray-200 rounded-xl items-center"
              >
                <Text className="font-[semibold] text-gray-700">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleArchiveProduct}
                disabled={archiving}
                className={`flex-1 py-3 rounded-xl items-center ${
                  archiving ? "bg-gray-400" : "bg-red-500"
                }`}
              >
                {archiving ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="font-[semibold] text-white">
                    {selectedProduct?.isActive ? "Archive" : "Restore"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
