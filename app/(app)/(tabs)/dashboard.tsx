import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Alert,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

// Components
import StatsCard from "../../../components/dashboard/stats-card";
import RevenueChart from "../../../components/dashboard/revenue-chart";
import TopProducts from "../../../components/dashboard/top-products";
import RecentOrders from "../../../components/dashboard/recent-orders";

// Services
import { getAllOrders } from "../../../services/orders";
import {
  getAllProducts,
  getBestSellerProducts,
} from "../../../services/products";
import { getStatistics } from "../../../services/statistics";
import dayjs from "dayjs";

// Utils
import { formatToVND } from "../../../utils/format";
import { getAllUsers } from "@/services/user";

interface Order {
  _id: string;
  finalPrice: number;
  createdAt: string;
  deliveryInfo: Array<{ status: string }>;
  paymentMethod: string;
  userInfo: {
    _id: string;
    fullName: string;
    email: string;
  };
}

interface Product {
  _id: string;
  name: string;
  price: number;
  soldQuantity: number;
  images: Array<{ url: string; publicId: string }>;
}

interface MonthlySale {
  month: number;
  total: number;
}

export default function Dashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [bestSellerProducts, setBestSellerProducts] = useState<Product[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [yearRevenue, setYearRevenue] = useState(0);
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlySale[]>([]);
  const [statistics, setStatistics] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const fetchedOrders = await getAllOrders();
      setOrders(fetchedOrders);

      // Calculate unique users from orders
      const fetchedUsers = await getAllUsers();
      setTotalUsers(fetchedUsers.length);
    } catch (error) {
      console.error("Error fetching orders:", error);
      Alert.alert("Error", "Failed to fetch orders data");
    }
  };

  const fetchStatistics = async () => {
    try {
      const data = await getStatistics(undefined, undefined, undefined);
      const total = data.reduce((sum: number, stat: any) => {
        return sum + stat.totalRevenue;
      }, 0);
      setTotalRevenue(total);
    } catch (error) {
      console.error("Error fetching statistics:", error);
      Alert.alert("Error", "Failed to fetch statistics data");
    }
  };

  const fetchYearStatistics = async () => {
    try {
      const data = await getStatistics(undefined, undefined, dayjs().year());

      const yearlyRevenue = Array(12).fill(0);
      const yearlyOrder = Array(12).fill(0);

      data.forEach((stat: any) => {
        if (stat._id) {
          if (stat._id.month) {
            const monthIndex = stat._id.month - 1;
            if (monthIndex >= 0 && monthIndex < 12) {
              yearlyOrder[monthIndex] += stat.totalOrder || 0;
              yearlyRevenue[monthIndex] += stat.totalRevenue || 0;
            }
          }
        }
      });

      // Convert to array format for chart
      const monthlyData: MonthlySale[] = yearlyRevenue.map(
        (totalRevenue, index) => ({
          month: index + 1,
          total: totalRevenue,
        })
      );

      setMonthlyRevenue(monthlyData);
      setStatistics(monthlyData);

      const total = data.reduce((sum: number, stat: any) => {
        return sum + stat.totalRevenue;
      }, 0);
      setYearRevenue(total);
    } catch (error) {
      console.error("Error fetching year statistics:", error);
      Alert.alert("Error", "Failed to fetch year statistics data");
    }
  };

  const fetchProducts = async () => {
    try {
      const fetchedProducts = await getAllProducts();
      setProducts(fetchedProducts);
    } catch (error) {
      console.error("Error fetching products:", error);
      Alert.alert("Error", "Failed to fetch products data");
    }
  };

  const fetchBestSellerProducts = async () => {
    try {
      const fetchedBestSellers = await getBestSellerProducts();
      setBestSellerProducts(fetchedBestSellers.slice(0, 5)); // Top 5 products
    } catch (error) {
      console.error("Error fetching best seller products:", error);
      Alert.alert("Error", "Failed to fetch best seller products");
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchOrders(),
        fetchProducts(),
        fetchBestSellerProducts(),
        fetchStatistics(),
        fetchYearStatistics(),
      ]);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
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

  // Get recent orders (latest 5)
  const recentOrders = orders
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 5);

  // Prepare top products data for chart (only products with sold quantity > 0)
  const topProductsData = bestSellerProducts
    .filter((product) => (product.soldQuantity || 0) > 0)
    .map((product) => ({
      name: product.name,
      quantity: product.soldQuantity || 0,
    }));

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="p-4">
          <Text className="font-[bold] text-2xl text-gray-900 mb-1">
            Dashboard
          </Text>
          <Text className="font-[regular] text-gray-600">
            Overview of your business
          </Text>
        </View>

        {/* Stats Cards Row 1 */}
        <View className="flex-row justify-between px-4 mb-3">
          <StatsCard
            title="Total Orders"
            value={orders.length.toString()}
            icon="receipt-outline"
            color="#4CAF50"
          />
          <StatsCard
            title="Total Revenue"
            value={formatToVND(totalRevenue)}
            icon="cash-outline"
            color="#2196F3"
          />
        </View>

        {/* Stats Cards Row 2 */}
        <View className="flex-row justify-between px-4 mb-5">
          <StatsCard
            title="Total Products"
            value={products.length.toString()}
            icon="cube-outline"
            color="#FF9800"
          />
          <StatsCard
            title="Total Users"
            value={totalUsers.toString()}
            icon="people-outline"
            color="#9C27B0"
          />
        </View>

        {/* Revenue Chart Section */}
        <View className="mx-4 mb-5">
          <View className="bg-gray-50 rounded-xl p-4">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="font-[bold] text-lg text-gray-900">
                Revenue This Year
              </Text>
              <Text className="font-[bold] text-xl text-green-600">
                {formatToVND(yearRevenue)}
              </Text>
            </View>
            <RevenueChart data={monthlyRevenue} />
          </View>
        </View>

        {/* Best Seller Products */}
        <View className="mx-4 mb-5">
          <View className="bg-gray-50 rounded-xl p-4">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="font-[bold] text-lg text-gray-900">
                Top Products
              </Text>
              <Ionicons name="trending-up" size={20} color="#4CAF50" />
            </View>
            <TopProducts products={topProductsData} />
          </View>
        </View>

        {/* Recent Orders Section */}
        {/* <View className="mx-4 mb-5">
          <View className="bg-gray-50 rounded-xl p-4">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="font-[bold] text-lg text-gray-900">
                Recent Orders
              </Text>
              <Ionicons name="time-outline" size={20} color="#666" />
            </View>
            <RecentOrders orders={recentOrders} />
          </View>
        </View> */}
      </ScrollView>
    </SafeAreaView>
  );
}
