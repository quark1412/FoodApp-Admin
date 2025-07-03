import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { PieChart } from "react-native-chart-kit";

interface OrderStatusChartProps {
  pending: number;
  shipping: number;
  delivered: number;
  cancelled: number;
}

const OrderStatusChart: React.FC<OrderStatusChartProps> = ({
  pending,
  shipping,
  delivered,
  cancelled,
}) => {
  const screenWidth = Dimensions.get("window").width - 40;

  const chartData = [
    {
      name: "Pending",
      population: pending,
      color: "#FFA000",
      legendFontColor: "#7F7F7F",
      legendFontSize: 12,
    },
    {
      name: "Shipping",
      population: shipping,
      color: "#FF5722",
      legendFontColor: "#7F7F7F",
      legendFontSize: 12,
    },
    {
      name: "Delivered",
      population: delivered,
      color: "#4CAF50",
      legendFontColor: "#7F7F7F",
      legendFontSize: 12,
    },
    {
      name: "Cancelled",
      population: cancelled,
      color: "#F44336",
      legendFontColor: "#7F7F7F",
      legendFontSize: 12,
    },
  ].filter((item) => item.population > 0);

  const chartConfig = {
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  };

  const hasData = chartData.length > 0;

  if (!hasData) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No order status data available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Order Status Distribution</Text>
      <PieChart
        data={chartData}
        width={screenWidth}
        height={200}
        chartConfig={chartConfig}
        accessor="population"
        backgroundColor="transparent"
        paddingLeft="15"
        absolute={false}
      />

      <View style={styles.summaryContainer}>
        <SummaryItem label="Pending" value={pending} color="#FFA000" />
        <SummaryItem label="Shipping" value={shipping} color="#FF5722" />
        <SummaryItem label="Delivered" value={delivered} color="#4CAF50" />
        <SummaryItem label="Cancelled" value={cancelled} color="#F44336" />
      </View>
    </View>
  );
};

interface SummaryItemProps {
  label: string;
  value: number;
  color: string;
}

const SummaryItem: React.FC<SummaryItemProps> = ({ label, value, color }) => (
  <View style={styles.summaryItem}>
    <View style={[styles.colorIndicator, { backgroundColor: color }]} />
    <Text style={styles.summaryLabel}>{label}</Text>
    <Text style={styles.summaryValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    padding: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center",
  },
  emptyContainer: {
    height: 200,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    color: "#666",
  },
  summaryContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 16,
    width: "100%",
  },
  summaryItem: {
    flexDirection: "row",
    alignItems: "center",
    width: "48%",
    marginBottom: 8,
  },
  colorIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: "#666",
    marginRight: 4,
  },
  summaryValue: {
    fontSize: 12,
    fontWeight: "bold",
  },
});

export default OrderStatusChart;
