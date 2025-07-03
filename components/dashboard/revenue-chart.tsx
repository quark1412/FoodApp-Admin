import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { LineChart } from "react-native-chart-kit";

interface MonthlySale {
  month: number;
  total: number;
}

interface RevenueChartProps {
  data: MonthlySale[];
}

const RevenueChart: React.FC<RevenueChartProps> = ({ data }) => {
  const screenWidth = Dimensions.get("window").width - 40;

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const chartData = {
    labels: data.map((item) => item.month.toString()),
    datasets: [
      {
        data: data.map((item) => item.total / 100000),
        color: (opacity = 1) => `rgba(252, 106, 25, ${opacity})`,
        strokeWidth: 2,
      },
    ],
    legend: ["Revenue (hundred thousands VND)"],
  };

  const chartConfig = {
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    decimalPlaces: 2,
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: "4",
      strokeWidth: "2",
      stroke: "#fc6a19",
    },
    formatYLabel: (value: string) => {
      const num = parseFloat(value);
      if (num >= 10) {
        return `${num.toFixed(1)}`;
      }
      return `${num.toFixed(2)}`;
    },
  };

  return (
    <View style={styles.container}>
      {data.length === 0 ? (
        <Text style={styles.noDataText}>No revenue data available</Text>
      ) : (
        <LineChart
          data={chartData}
          width={screenWidth}
          height={220}
          chartConfig={chartConfig}
          bezier
          withVerticalLabels={true}
          withHorizontalLabels={true}
          style={styles.chart}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  chart: {
    marginVertical: 8,
    borderRadius: 8,
  },
  noDataText: {
    textAlign: "center",
    padding: 16,
    color: "#666",
  },
});

export default RevenueChart;
