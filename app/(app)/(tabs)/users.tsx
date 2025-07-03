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
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

// Services
import {
  getAllUsers,
  createUser,
  updateUserById,
  archiveUserById,
  getAllUserRoles,
  getUserRoleById,
} from "../../../services/user";

// Constants
import {
  USER_STATUS,
  ROLE_NAME,
  ITEM_PER_PAGE,
} from "../../../constants/order";

// Components
import { useToast } from "../../../contexts/toastContext";

interface User {
  _id: string;
  email: string;
  fullName: string;
  phone: string;
  isActive: boolean;
  roleId: string;
  role?: string;
  createdAt: string;
}

interface UserRole {
  _id: string;
  roleName: string;
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Modal states
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [archiveModalVisible, setArchiveModalVisible] = useState(false);

  // Form states
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [userRole, setUserRole] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userDetails, setUserDetails] = useState<User | null>(null);

  // Loading states
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [archiving, setArchiving] = useState(false);

  const { showToast } = useToast();

  const fetchUsers = async () => {
    try {
      const fetchedUsers = await getAllUsers();
      const updatedUsers = await Promise.all(
        fetchedUsers.map(async (user: User) => {
          try {
            const userRole = await getUserRoleById(user.roleId);
            return {
              ...user,
              role: userRole.roleName,
            };
          } catch (error) {
            return {
              ...user,
              role: "Unknown",
            };
          }
        })
      );
      setUsers(updatedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      showToast("Failed to fetch users", "error");
    }
  };

  const fetchUserRoles = async () => {
    try {
      const fetchedUserRoles = await getAllUserRoles();
      setUserRoles(fetchedUserRoles);
    } catch (error) {
      console.error("Error fetching user roles:", error);
      showToast("Failed to fetch user roles", "error");
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchUsers(), fetchUserRoles()]);
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
    filterUsers();
  }, [users, searchQuery, selectedRole, selectedStatus]);

  const filterUsers = () => {
    let filtered = [...users];

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (user) =>
          user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Role filter
    if (selectedRole !== "All") {
      filtered = filtered.filter((user) =>
        user.role?.toLowerCase().includes(selectedRole.toLowerCase())
      );
    }

    // Status filter
    let isActive = null;
    if (selectedStatus === "Active") {
      isActive = true;
    } else if (selectedStatus === "Inactive") {
      isActive = false;
    }

    if (isActive !== null) {
      filtered = filtered.filter((user) => user.isActive === isActive);
    }

    setCurrentPage(1);
    setFilteredUsers(filtered);
  };

  const getCurrentPageUsers = () => {
    const startIndex = (currentPage - 1) * ITEM_PER_PAGE;
    const endIndex = startIndex + ITEM_PER_PAGE;
    return filteredUsers.slice(startIndex, endIndex);
  };

  const getTotalPages = () => {
    return Math.ceil(filteredUsers.length / ITEM_PER_PAGE);
  };

  const handleCreateUser = async () => {
    if (!email || !fullName || !phone || !password || !userRole) {
      console.log(email, fullName, phone, password, userRole);
      showToast("Please fill in all required fields", "error");
      return;
    }

    try {
      setCreating(true);
      await createUser(email, fullName, phone, password, userRole);
      await fetchUsers();
      resetCreateForm();
      setCreateModalVisible(false);
      showToast("User created successfully", "success");
    } catch (error: any) {
      console.error("Error creating user:", error);
      showToast(
        error?.response?.data?.message || "Error creating user",
        "error"
      );
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!userDetails || !userDetails.fullName || !userDetails.phone) {
      showToast("Please fill in all required fields", "error");
      return;
    }

    try {
      setUpdating(true);
      await updateUserById(userDetails._id, {
        fullName: userDetails.fullName,
        phone: userDetails.phone,
        roleId: userDetails.roleId,
      });
      await fetchUsers();
      setUpdateModalVisible(false);
      setUserDetails(null);
      showToast("User updated successfully", "success");
    } catch (error: any) {
      console.error("Error updating user:", error);
      showToast(
        error?.response?.data?.message || "Error updating user",
        "error"
      );
    } finally {
      setUpdating(false);
    }
  };

  const handleArchiveUser = async (user: User) => {
    try {
      setArchiving(true);
      await archiveUserById(user._id);
      await fetchUsers();
      setArchiveModalVisible(false);
      setSelectedUser(null);

      const message = user.isActive
        ? "User archived successfully"
        : "User restored successfully";
      showToast(message, "success");
    } catch (error: any) {
      console.error("Error archiving user:", error);
      showToast(
        error?.response?.data?.message || "Error changing user status",
        "error"
      );
    } finally {
      setArchiving(false);
    }
  };

  const resetCreateForm = () => {
    setEmail("");
    setFullName("");
    setPhone("");
    setPassword("");
    setUserRole("");
  };

  const openDetailModal = (user: User) => {
    setUserDetails(user);
    setDetailModalVisible(true);
  };

  const openUpdateModal = (user: User) => {
    setUserDetails({ ...user });
    setUpdateModalVisible(true);
  };

  const openArchiveModal = (user: User) => {
    setSelectedUser(user);
    setArchiveModalVisible(true);
  };

  const getStatusBadgeStyle = (isActive: boolean) => {
    return isActive ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600";
  };

  const renderUserCard = ({ item }: { item: User }) => (
    <View className="bg-white rounded-xl p-4 mx-4 mb-4 shadow-sm border border-gray-100">
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-1">
          <Text className="font-[Bold] text-lg text-gray-900 mb-1 font-urbanist">
            {item.fullName}
          </Text>
          <Text className="text-gray-600 text-sm mb-1 font-[Regular] font-urbanist">
            {item.email}
          </Text>
          <Text className="text-gray-600 text-sm font-[Regular] font-urbanist">
            {item.phone}
          </Text>
        </View>
        <View
          className={`px-3 py-1 rounded-full ${getStatusBadgeStyle(
            item.isActive
          )}`}
        >
          <Text className="text-xs font-[semiBold] font-urbanist">
            {item.isActive ? "Active" : "Inactive"}
          </Text>
        </View>
      </View>

      <View className="flex-row justify-between items-center mb-3">
        <View className="bg-orange-50 px-3 py-1 rounded-lg">
          <Text className="text-orange-600 font-[Medium] text-sm font-urbanist">
            {item.role}
          </Text>
        </View>
        <Text className="text-gray-500 text-xs font-[Regular] font-urbanist">
          ID: {item._id.substring(0, 8)}...
        </Text>
      </View>

      <View className="flex-row justify-between">
        <TouchableOpacity
          onPress={() => openDetailModal(item)}
          className="flex-row items-center px-3 py-2 bg-gray-50 rounded-lg"
        >
          <Ionicons name="eye-outline" size={16} color="#6B7280" />
          <Text className="text-gray-600 ml-1 text-sm font-[Medium] font-urbanist">
            View
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => openUpdateModal(item)}
          className="flex-row items-center px-3 py-2 bg-blue-50 rounded-lg"
        >
          <Ionicons name="create-outline" size={16} color="#3B82F6" />
          <Text className="text-blue-600 ml-1 text-sm font-[Medium] font-urbanist">
            Edit
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => openArchiveModal(item)}
          className="flex-row items-center px-3 py-2 bg-red-50 rounded-lg"
        >
          <Ionicons
            name={item.isActive ? "archive-outline" : "refresh-outline"}
            size={16}
            color="#EF4444"
          />
          <Text className="text-red-600 ml-1 text-sm font-[Medium] font-urbanist">
            {item.isActive ? "Archive" : "Restore"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
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
            <Text className="text-xl font-[bold] text-gray-900 font-urbanist">
              Filters
            </Text>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView className="flex-1 px-6 py-4">
          <View className="mb-6">
            <Text className="font-[semiBold] text-gray-900 mb-3 font-urbanist">
              Role
            </Text>
            <View className="flex-row flex-wrap">
              <TouchableOpacity
                onPress={() => setSelectedRole("All")}
                className={`px-4 py-2 rounded-full mr-2 mb-2 ${
                  selectedRole === "All" ? "bg-orange-500" : "bg-gray-100"
                }`}
              >
                <Text
                  className={`text-sm font-[medium] font-urbanist ${
                    selectedRole === "All" ? "text-white" : "text-gray-700"
                  }`}
                >
                  All
                </Text>
              </TouchableOpacity>
              {ROLE_NAME.map((role) => (
                <TouchableOpacity
                  key={role.value}
                  onPress={() => setSelectedRole(role.value)}
                  className={`px-4 py-2 rounded-full mr-2 mb-2 ${
                    selectedRole === role.value
                      ? "bg-orange-500"
                      : "bg-gray-100"
                  }`}
                >
                  <Text
                    className={`text-sm font-[medium] font-urbanist ${
                      selectedRole === role.value
                        ? "text-white"
                        : "text-gray-700"
                    }`}
                  >
                    {role.key}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View className="mb-6">
            <Text className="font-[semiBold] text-gray-900 mb-3 font-urbanist">
              Status
            </Text>
            <View className="flex-row flex-wrap">
              <TouchableOpacity
                onPress={() => setSelectedStatus("All")}
                className={`px-4 py-2 rounded-full mr-2 mb-2 ${
                  selectedStatus === "All" ? "bg-orange-500" : "bg-gray-100"
                }`}
              >
                <Text
                  className={`text-sm font-[medium] font-urbanist ${
                    selectedStatus === "All" ? "text-white" : "text-gray-700"
                  }`}
                >
                  All
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setSelectedStatus("Active")}
                className={`px-4 py-2 rounded-full mr-2 mb-2 ${
                  selectedStatus === "Active" ? "bg-orange-500" : "bg-gray-100"
                }`}
              >
                <Text
                  className={`text-sm font-[medium] font-urbanist ${
                    selectedStatus === "Active" ? "text-white" : "text-gray-700"
                  }`}
                >
                  Active
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setSelectedStatus("Inactive")}
                className={`px-4 py-2 rounded-full mr-2 mb-2 ${
                  selectedStatus === "Inactive"
                    ? "bg-orange-500"
                    : "bg-gray-100"
                }`}
              >
                <Text
                  className={`text-sm font-[medium] font-urbanist ${
                    selectedStatus === "Inactive"
                      ? "text-white"
                      : "text-gray-700"
                  }`}
                >
                  Inactive
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        <View className="px-6 py-4 border-t border-gray-200">
          <TouchableOpacity
            onPress={() => setShowFilters(false)}
            className="bg-[#fc6a19] py-3 rounded-xl"
          >
            <Text className="text-white text-center font-[semiBold] font-urbanist">
              Apply Filters
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );

  const renderPagination = () => {
    const totalPages = getTotalPages();
    if (totalPages <= 1) return null;

    return (
      <View className="flex-row justify-center items-center py-4">
        <TouchableOpacity
          onPress={() => setCurrentPage(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className={`px-3 py-2 rounded-lg mr-2 ${
            currentPage === 1 ? "bg-gray-100" : "bg-orange-500"
          }`}
        >
          <Ionicons
            name="chevron-back"
            size={16}
            color={currentPage === 1 ? "#9CA3AF" : "white"}
          />
        </TouchableOpacity>

        <Text className="px-4 py-2 text-gray-700 font-[Regular] font-urbanist">
          Page {currentPage} / {totalPages}
        </Text>

        <TouchableOpacity
          onPress={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className={`px-3 py-2 rounded-lg ml-2 ${
            currentPage === totalPages ? "bg-gray-100" : "bg-orange-500"
          }`}
        >
          <Ionicons
            name="chevron-forward"
            size={16}
            color={currentPage === totalPages ? "#9CA3AF" : "white"}
          />
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#fc6a19" />
        <Text className="mt-2 text-gray-600 font-[Regular] font-urbanist">
          Loading...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-6 py-4 border-b border-gray-200">
        <Text className="text-2xl font-[bold] text-gray-900 mb-4 font-urbanist">
          Users
        </Text>

        {/* Search Bar */}
        <View className="flex-row items-center mb-4">
          <View className="flex-1 flex-row items-center bg-gray-100 rounded-xl px-4 py-3 mr-3">
            <Ionicons name="search" size={20} color="#6B7280" />
            <TextInput
              className="flex-1 ml-2 text-gray-900 font-[regular] font-urbanist"
              placeholder="Search by name or email..."
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
        {(selectedRole !== "All" || selectedStatus !== "All") && (
          <View className="flex-row flex-wrap mb-2">
            {selectedRole !== "All" && (
              <View className="bg-orange-100 px-3 py-1 rounded-full mr-2 mb-2">
                <Text className="text-orange-600 text-sm font-[medium] font-urbanist">
                  Role: {selectedRole}
                </Text>
              </View>
            )}
            {selectedStatus !== "All" && (
              <View className="bg-orange-100 px-3 py-1 rounded-full mr-2 mb-2">
                <Text className="text-orange-600 text-sm font-[medium] font-urbanist">
                  Status: {selectedStatus}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Results Count */}
        <Text className="text-gray-600 text-sm font-[regular] font-urbanist">
          {filteredUsers.length > 0
            ? `Showing ${(currentPage - 1) * ITEM_PER_PAGE + 1} - ${Math.min(
                currentPage * ITEM_PER_PAGE,
                filteredUsers.length
              )} of ${filteredUsers.length} results`
            : "No results found"}
        </Text>
      </View>

      {/* Users List */}
      <FlatList
        data={getCurrentPageUsers()}
        keyExtractor={(item) => item._id}
        renderItem={renderUserCard}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 100 }}
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center py-20">
            <Ionicons name="people-outline" size={64} color="#D1D5DB" />
            <Text className="text-gray-500 text-lg mt-4 font-[regular] font-urbanist">
              No users found
            </Text>
          </View>
        }
        ListFooterComponent={renderPagination}
      />

      {/* Add User Button */}
      <TouchableOpacity
        onPress={() => setCreateModalVisible(true)}
        className="absolute bottom-6 right-6 bg-[#fc6a19] w-14 h-14 rounded-full justify-center items-center shadow-lg"
      >
        <Ionicons name="add" size={24} color="white" />
      </TouchableOpacity>

      {/* Create User Modal */}
      <Modal
        visible={createModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView className="flex-1 bg-white">
          <View className="px-6 py-4 border-b border-gray-200">
            <View className="flex-row justify-between items-center">
              <Text className="text-xl font-[bold] text-gray-900 font-urbanist">
                Add New User
              </Text>
              <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView className="flex-1 px-6 py-4">
            <View className="mb-4">
              <Text className="font-[semiBold] text-gray-900 mb-2 font-urbanist">
                Email <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                className="border border-gray-300 rounded-xl px-4 py-3 text-gray-900 font-[regular] font-urbanist"
                placeholder="Enter email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View className="mb-4">
              <Text className="font-[semiBold] text-gray-900 mb-2 font-urbanist">
                Full Name <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                className="border border-gray-300 rounded-xl px-4 py-3 text-gray-900 font-[regular] font-urbanist"
                placeholder="Enter full name"
                value={fullName}
                onChangeText={setFullName}
              />
            </View>

            <View className="mb-4">
              <Text className="font-[semiBold] text-gray-900 mb-2 font-urbanist">
                Phone Number <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                className="border border-gray-300 rounded-xl px-4 py-3 text-gray-900 font-[regular] font-urbanist"
                placeholder="Enter phone number"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>

            <View className="mb-4">
              <Text className="font-[semiBold] text-gray-900 mb-2 font-urbanist">
                Password <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                className="border border-gray-300 rounded-xl px-4 py-3 text-gray-900 font-[regular] font-urbanist"
                placeholder="Enter password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <View className="mb-6">
              <Text className="font-[semiBold] text-gray-900 mb-2 font-urbanist">
                Role <Text className="text-red-500">*</Text>
              </Text>
              <View className="border border-gray-300 rounded-xl">
                {userRoles.map((role, index) => (
                  <TouchableOpacity
                    key={role._id}
                    onPress={() => setUserRole(role._id)}
                    className={`px-4 py-3 flex-row justify-between items-center ${
                      index !== userRoles.length - 1
                        ? "border-b border-gray-200"
                        : ""
                    }`}
                  >
                    <Text className="text-gray-900 font-[regular]">
                      {role.roleName}
                    </Text>
                    {userRole === role._id && (
                      <Ionicons name="checkmark" size={20} color="#fc6a19" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          <View className="px-6 py-4 border-t border-gray-200">
            <TouchableOpacity
              onPress={handleCreateUser}
              disabled={creating}
              className="bg-[#fc6a19] py-3 rounded-xl flex-row justify-center items-center"
            >
              {creating ? (
                <>
                  <ActivityIndicator size="small" color="white" />
                  <Text className="text-white font-[semiBold] ml-2 font-urbanist">
                    Creating...
                  </Text>
                </>
              ) : (
                <Text className="text-white font-[semiBold] font-urbanist">
                  Add User
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Detail Modal */}
      <Modal
        visible={detailModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView className="flex-1 bg-white">
          <View className="px-6 py-4 border-b border-gray-200">
            <View className="flex-row justify-between items-center">
              <Text className="text-xl font-[bold] text-gray-900 font-urbanist">
                User Details
              </Text>
              <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>

          {userDetails && (
            <ScrollView className="flex-1 px-6 py-4">
              <View className="mb-4">
                <Text className="font-[semiBold] text-gray-900 mb-2 font-urbanist">
                  Email
                </Text>
                <View className="border border-gray-200 rounded-xl px-4 py-3 bg-gray-50">
                  <Text className="text-gray-600 font-[regular] font-urbanist">
                    {userDetails.email}
                  </Text>
                </View>
              </View>

              <View className="mb-4">
                <Text className="font-[semiBold] text-gray-900 mb-2 font-urbanist">
                  Full Name
                </Text>
                <View className="border border-gray-200 rounded-xl px-4 py-3 bg-gray-50">
                  <Text className="text-gray-600 font-[regular] font-urbanist">
                    {userDetails.fullName}
                  </Text>
                </View>
              </View>

              <View className="mb-4">
                <Text className="font-[semiBold] text-gray-900 mb-2 font-urbanist">
                  Phone Number
                </Text>
                <View className="border border-gray-200 rounded-xl px-4 py-3 bg-gray-50">
                  <Text className="text-gray-600 font-[regular] font-urbanist">
                    {userDetails.phone}
                  </Text>
                </View>
              </View>

              <View className="mb-4">
                <Text className="font-[semiBold] text-gray-900 mb-2 font-urbanist">
                  Role
                </Text>
                <View className="border border-gray-200 rounded-xl px-4 py-3 bg-gray-50">
                  <Text className="text-gray-600 font-[regular] font-urbanist">
                    {userDetails.role}
                  </Text>
                </View>
              </View>

              <View className="mb-4">
                <Text className="font-[semiBold] text-gray-900 mb-2 font-urbanist">
                  Status
                </Text>
                <View className="border border-gray-200 rounded-xl px-4 py-3 bg-gray-50">
                  <Text className="text-gray-600 font-[regular] font-urbanist">
                    {userDetails.isActive ? "Active" : "Inactive"}
                  </Text>
                </View>
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>

      {/* Update Modal */}
      <Modal
        visible={updateModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView className="flex-1 bg-white">
          <View className="px-6 py-4 border-b border-gray-200">
            <View className="flex-row justify-between items-center">
              <Text className="text-xl font-[bold] text-gray-900 font-urbanist">
                Edit User
              </Text>
              <TouchableOpacity onPress={() => setUpdateModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>

          {userDetails && (
            <ScrollView className="flex-1 px-6 py-4">
              <View className="mb-4">
                <Text className="font-[semiBold] text-gray-900 mb-2 font-urbanist">
                  Full Name
                </Text>
                <TextInput
                  className="border border-gray-300 rounded-xl px-4 py-3 text-gray-900 font-[regular] font-urbanist"
                  placeholder="Enter full name"
                  value={userDetails.fullName}
                  onChangeText={(text) =>
                    setUserDetails({ ...userDetails, fullName: text })
                  }
                />
              </View>

              <View className="mb-4">
                <Text className="font-[semiBold] text-gray-900 mb-2 font-urbanist">
                  Phone Number
                </Text>
                <TextInput
                  className="border border-gray-300 rounded-xl px-4 py-3 text-gray-900 font-[regular] font-urbanist"
                  placeholder="Enter phone number"
                  value={userDetails.phone}
                  onChangeText={(text) =>
                    setUserDetails({ ...userDetails, phone: text })
                  }
                  keyboardType="phone-pad"
                />
              </View>

              <View className="mb-6">
                <Text className="font-[semiBold] text-gray-900 mb-2 font-urbanist">
                  Role
                </Text>
                <View className="border border-gray-300 rounded-xl">
                  {userRoles.map((role, index) => (
                    <TouchableOpacity
                      key={role._id}
                      onPress={() =>
                        setUserDetails({ ...userDetails, roleId: role._id })
                      }
                      className={`px-4 py-3 flex-row justify-between items-center ${
                        index !== userRoles.length - 1
                          ? "border-b border-gray-200"
                          : ""
                      }`}
                    >
                      <Text className="text-gray-900 font-[regular] font-urbanist">
                        {role.roleName}
                      </Text>
                      {userDetails.roleId === role._id && (
                        <Ionicons name="checkmark" size={20} color="#fc6a19" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>
          )}

          <View className="px-6 py-4 border-t border-gray-200">
            <TouchableOpacity
              onPress={handleUpdateUser}
              disabled={updating}
              className="bg-[#fc6a19] py-3 rounded-xl flex-row justify-center items-center"
            >
              {updating ? (
                <>
                  <ActivityIndicator size="small" color="white" />
                  <Text className="text-white font-[semiBold] ml-2 font-urbanist">
                    Updating...
                  </Text>
                </>
              ) : (
                <Text className="text-white font-[semiBold] font-urbanist">
                  Save Changes
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Archive Modal */}
      <Modal
        visible={archiveModalVisible}
        animationType="fade"
        transparent={true}
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="bg-white rounded-xl p-6 mx-6 w-80">
            <View className="items-center mb-4">
              <Ionicons
                name="warning-outline"
                size={48}
                color="#F59E0B"
                className="mb-4"
              />
              <Text className="text-lg font-[semiBold] text-gray-900 text-center mb-2 font-urbanist">
                Confirm Action
              </Text>
              <Text className="text-gray-600 text-center font-[regular] font-urbanist">
                {selectedUser?.isActive
                  ? "Are you sure you want to archive this user?"
                  : "Are you sure you want to restore this user?"}
              </Text>
            </View>

            <View className="flex-row justify-between">
              <TouchableOpacity
                onPress={() => setArchiveModalVisible(false)}
                className="bg-gray-200 px-6 py-3 rounded-xl flex-1 mr-2"
              >
                <Text className="text-gray-700 font-[semiBold] text-center font-urbanist">
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => selectedUser && handleArchiveUser(selectedUser)}
                disabled={archiving}
                className="bg-red-500 px-6 py-3 rounded-xl flex-1 ml-2"
              >
                {archiving ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text className="text-white font-[semiBold] text-center font-urbanist">
                    {selectedUser?.isActive ? "Archive" : "Restore"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Filters Modal */}
      {renderFiltersModal()}
    </SafeAreaView>
  );
}
