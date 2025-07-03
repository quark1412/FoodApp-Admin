import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Modal,
  Alert,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useToast } from "../../../contexts/toastContext";
import {
  createCategory,
  getAllCategories,
  updateCategory,
  updateStatusCategoryById,
} from "../../../services/categories";

interface Category {
  _id: string;
  name: string;
  isActive: boolean;
}

const ITEMS_PER_PAGE = 10;

export default function Categories() {
  const { showToast } = useToast();

  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Modal states
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [archiveModalVisible, setArchiveModalVisible] = useState(false);

  // Form states
  const [newCategoryName, setNewCategoryName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [updateCategoryName, setUpdateCategoryName] = useState("");
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [archiving, setArchiving] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    filterCategories();
  }, [categories, searchTerm]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const fetchedCategories = await getAllCategories();
      setCategories(fetchedCategories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      showToast("Error loading categories list", "error");
    } finally {
      setLoading(false);
    }
  };

  const filterCategories = () => {
    let filtered = categories;

    if (searchTerm.trim()) {
      filtered = categories.filter((category) =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredCategories(filtered);
    setCurrentPage(1);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCategories();
    setRefreshing(false);
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      showToast("Please enter category name", "error");
      return;
    }

    try {
      setCreating(true);
      await createCategory(newCategoryName.trim());
      await fetchCategories();
      setNewCategoryName("");
      setCreateModalVisible(false);
      showToast("Category added successfully", "success");
    } catch (error: any) {
      console.error("Error creating category:", error);
      showToast(
        error?.response?.data?.message || "Error creating category",
        "error"
      );
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateCategory = async () => {
    if (!updateCategoryName.trim()) {
      showToast("Please enter category name", "error");
      return;
    }

    if (!selectedCategory) return;

    try {
      setUpdating(true);
      await updateCategory(selectedCategory._id, updateCategoryName.trim());
      await fetchCategories();
      setUpdateModalVisible(false);
      setSelectedCategory(null);
      setUpdateCategoryName("");
      showToast("Category updated successfully", "success");
    } catch (error: any) {
      console.error("Error updating category:", error);
      showToast(
        error?.response?.data?.message || "Error updating category",
        "error"
      );
    } finally {
      setUpdating(false);
    }
  };

  const handleArchiveCategory = async () => {
    if (!selectedCategory) return;

    try {
      setArchiving(true);
      await updateStatusCategoryById(selectedCategory._id);
      await fetchCategories();
      setArchiveModalVisible(false);
      setSelectedCategory(null);

      const message = selectedCategory.isActive
        ? "Category archived successfully"
        : "Category restored successfully";
      showToast(message, "success");
    } catch (error: any) {
      console.error("Error archiving category:", error);
      showToast(
        error?.response?.data?.message || "Error changing category status",
        "error"
      );
    } finally {
      setArchiving(false);
    }
  };

  const openUpdateModal = (category: Category) => {
    setSelectedCategory(category);
    setUpdateCategoryName(category.name);
    setUpdateModalVisible(true);
  };

  const openArchiveModal = (category: Category) => {
    setSelectedCategory(category);
    setArchiveModalVisible(true);
  };

  const getCurrentPageCategories = () => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredCategories.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(filteredCategories.length / ITEMS_PER_PAGE);

  const renderCategoryItem = ({ item }: { item: Category }) => (
    <View className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100">
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-1">
          <Text className="font-[bold] text-lg text-gray-900 mb-1">
            {item.name}
          </Text>
          <Text className="font-[regular] text-sm text-gray-600">
            ID: {item._id}
          </Text>
        </View>
        <View
          className={`px-3 py-1 rounded-2xl ${
            item.isActive ? "bg-green-100" : "bg-red-100"
          }`}
        >
          <Text
            className={`font-[semibold] text-xs ${
              item.isActive ? "text-green-700" : "text-red-700"
            }`}
          >
            {item.isActive ? "Active" : "Archived"}
          </Text>
        </View>
      </View>

      <View className="flex-row justify-end gap-3">
        <TouchableOpacity
          onPress={() => openUpdateModal(item)}
          className="flex-row items-center px-3 py-2 bg-blue-50 rounded-xl"
        >
          <Ionicons name="create-outline" size={16} color="#3B82F6" />
          <Text className="font-[semibold] text-sm text-blue-600 ml-1">
            Edit
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => openArchiveModal(item)}
          className="flex-row items-center px-3 py-2 bg-red-50 rounded-xl"
        >
          <Ionicons
            name={item.isActive ? "archive-outline" : "refresh-outline"}
            size={16}
            color="#EF4444"
          />
          <Text className="font-[semibold] text-sm text-red-600 ml-1">
            {item.isActive ? "Archive" : "Restore"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#fc6a19" />
          <Text className="font-[regular] text-gray-600 mt-4">
            Loading categories list...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-4 bg-white border-b border-gray-200">
        <Text className="font-[bold] text-xl text-gray-900">Categories</Text>
        <TouchableOpacity
          className="bg-orange-500 p-2 rounded-xl flex-row items-center justify-center"
          onPress={() => setCreateModalVisible(true)}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View className="px-4 py-4 bg-white border-b border-gray-200">
        <View className="flex-row items-center bg-gray-50 rounded-xl px-4 py-3">
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            className="flex-1 ml-3 font-[regular] text-gray-900"
            placeholder="Search categories..."
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity onPress={() => setSearchTerm("")}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Categories List */}
      <View className="flex-1 px-4 py-4">
        {getCurrentPageCategories().length > 0 ? (
          <>
            <FlatList
              data={getCurrentPageCategories()}
              renderItem={renderCategoryItem}
              keyExtractor={(item) => item._id}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
              showsVerticalScrollIndicator={false}
            />

            {/* Pagination */}
            {totalPages > 1 && (
              <View className="flex-row items-center justify-between mt-4 px-4 py-3 bg-white rounded-xl">
                <Text className="font-[regular] text-sm text-gray-600">
                  Page {currentPage} / {totalPages} ({filteredCategories.length}{" "}
                  categories)
                </Text>

                <View className="flex-row items-center gap-2">
                  <TouchableOpacity
                    onPress={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className={`p-2 rounded-xl ${
                      currentPage === 1 ? "bg-gray-200" : "bg-orange-500"
                    }`}
                  >
                    <Ionicons
                      name="chevron-back"
                      size={16}
                      color={currentPage === 1 ? "#9CA3AF" : "white"}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() =>
                      setCurrentPage(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                    className={`p-2 rounded-xl ${
                      currentPage === totalPages
                        ? "bg-gray-200"
                        : "bg-orange-500"
                    }`}
                  >
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color={currentPage === totalPages ? "#9CA3AF" : "white"}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </>
        ) : (
          <View className="flex-1 justify-center items-center">
            <Ionicons name="folder-outline" size={64} color="#D1D5DB" />
            <Text className="font-[semibold] text-lg text-gray-600 mt-4">
              {searchTerm ? "No categories found" : "No categories yet"}
            </Text>
            <Text className="font-[regular] text-gray-500 mt-2 text-center">
              {searchTerm
                ? "Try searching with different keywords"
                : "Create your first category"}
            </Text>
          </View>
        )}
      </View>

      {/* Create Category Modal */}
      <Modal
        visible={createModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="bg-white rounded-xl p-6 w-80">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="font-[bold] text-xl text-gray-900">
                Add New Category
              </Text>
              <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View className="mb-4">
              <Text className="font-[semibold] text-sm text-gray-700 mb-2">
                Category Name <Text className="text-red-600">*</Text>
              </Text>
              <TextInput
                value={newCategoryName}
                onChangeText={setNewCategoryName}
                placeholder="Enter category name"
                className="border border-gray-300 rounded-xl px-4 py-3 font-[regular] text-gray-900"
              />
            </View>

            <TouchableOpacity
              onPress={handleCreateCategory}
              disabled={creating}
              className={`py-3 rounded-xl items-center ${
                creating ? "bg-gray-400" : "bg-orange-500"
              }`}
            >
              {creating ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="font-[bold] text-white">Add Category</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Update Modal */}
      <Modal
        visible={updateModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setUpdateModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="bg-white rounded-xl p-6 w-80">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="font-[bold] text-xl text-gray-900">
                Edit Category
              </Text>
              <TouchableOpacity onPress={() => setUpdateModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View className="mb-4">
              <Text className="font-[semibold] text-sm text-gray-700 mb-2">
                Category Name
              </Text>
              <TextInput
                value={updateCategoryName}
                onChangeText={setUpdateCategoryName}
                placeholder="Enter category name"
                className="border border-gray-300 rounded-xl px-4 py-3 font-[regular] text-gray-900"
              />
            </View>

            <TouchableOpacity
              onPress={handleUpdateCategory}
              disabled={updating}
              className={`py-3 rounded-xl items-center ${
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
      </Modal>

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
                Confirm {selectedCategory?.isActive ? "Archive" : "Restore"}
              </Text>
              <Text className="font-[regular] text-gray-600 mt-2 text-center leading-5">
                Are you sure you want to{" "}
                {selectedCategory?.isActive ? "archive" : "restore"} category "
                {selectedCategory?.name}"?
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
                onPress={handleArchiveCategory}
                disabled={archiving}
                className={`flex-1 py-3 rounded-xl items-center ${
                  archiving ? "bg-gray-400" : "bg-red-500"
                }`}
              >
                {archiving ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="font-[semibold] text-white">
                    {selectedCategory?.isActive ? "Archive" : "Restore"}
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
