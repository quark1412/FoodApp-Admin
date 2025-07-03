import React from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { formatToVND } from "../../utils/format";

interface Order {
  _id: string;
  finalPrice: number;
  createdAt: string;
  deliveryInfo: Array<{ status: string }>;
  paymentMethod: string;
}

interface RecentOrdersProps {
  orders: Order[];
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "Đang chờ":
      return "#FFA000";
    case "Đang xử lý":
      return "#2196F3";
    case "Đang giao":
      return "#FF5722";
    case "Đã giao":
      return "#4CAF50";
    case "Đã hủy bởi người mua":
    case "Đã hủy bởi người bán":
      return "#F44336";
    default:
      return "#757575";
  }
};

const RecentOrders: React.FC<RecentOrdersProps> = ({ orders }) => {
  return (
    <View style={styles.container}>
      {orders.length === 0 ? (
        <Text style={styles.noOrdersText}>No recent orders found</Text>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item._id}
          scrollEnabled={false}
          renderItem={({ item }) => {
            const currentStatus =
              item.deliveryInfo[item.deliveryInfo.length - 1].status;
            return (
              <View style={styles.orderItem}>
                <View style={styles.orderHeader}>
                  <Text style={styles.orderId}>#{item._id.slice(-6)}</Text>
                  <Text
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: getStatusColor(currentStatus) + "20",
                        color: getStatusColor(currentStatus),
                      },
                    ]}
                  >
                    {currentStatus}
                  </Text>
                </View>

                <View style={styles.orderDetails}>
                  <View style={styles.detailItem}>
                    <Ionicons name="calendar-outline" size={16} color="#666" />
                    <Text style={styles.detailText}>
                      {formatDate(item.createdAt)}
                    </Text>
                  </View>

                  <View style={styles.detailItem}>
                    <Ionicons name="wallet-outline" size={16} color="#666" />
                    <Text style={styles.detailText}>{item.paymentMethod}</Text>
                  </View>

                  <View style={styles.detailItem}>
                    <Ionicons name="cash-outline" size={16} color="#666" />
                    <Text style={styles.detailText}>
                      {formatToVND(item.finalPrice)}
                    </Text>
                  </View>
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    overflow: "hidden",
  },
  noOrdersText: {
    textAlign: "center",
    padding: 16,
    color: "#666",
  },
  orderItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  orderId: {
    fontWeight: "bold",
    fontSize: 16,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 12,
    fontWeight: "500",
  },
  orderDetails: {
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  detailText: {
    marginLeft: 8,
    color: "#666",
    fontSize: 14,
  },
});

export default RecentOrders;
