import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface StatsCardProps {
  title: string;
  value: string;
  icon: string;
  color: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon, color }) => {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
          <Ionicons name={icon as any} size={20} color={color} />
        </View>
      </View>
      <Text style={styles.value} numberOfLines={1} ellipsizeMode="tail">
        {value}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    width: "48%",
    marginBottom: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  title: {
    color: "#4B5563",
    fontWeight: "500",
  },
  iconContainer: {
    padding: 8,
    borderRadius: 20,
  },
  value: {
    fontSize: 20,
    fontWeight: "bold",
  },
});

export default StatsCard;
