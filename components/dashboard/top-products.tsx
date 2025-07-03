import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface Product {
  name: string;
  quantity: number;
}

interface TopProductsProps {
  products: Product[];
}

const TopProducts: React.FC<TopProductsProps> = ({ products }) => {
  const maxQuantity = Math.max(
    ...products.map((product) => product.quantity),
    1
  );

  return (
    <View style={styles.container}>
      {products.length === 0 ? (
        <Text style={styles.noDataText}>No product data available</Text>
      ) : (
        products.map((product, index) => (
          <View key={index} style={styles.productItem}>
            <View style={styles.nameContainer}>
              <Text style={styles.productName} numberOfLines={1}>
                {product.name}
              </Text>
              <Text style={styles.quantityText}>{product.quantity}</Text>
            </View>

            <View style={styles.barContainer}>
              <View
                style={[
                  styles.bar,
                  {
                    width: `${(product.quantity / maxQuantity) * 100}%`,
                    backgroundColor: getBarColor(index),
                  },
                ]}
              />
            </View>
          </View>
        ))
      )}
    </View>
  );
};

const getBarColor = (index: number) => {
  const colors = ["#4CAF50", "#2196F3", "#FFC107", "#FF5722", "#9C27B0"];
  return colors[index % colors.length];
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  noDataText: {
    textAlign: "center",
    padding: 16,
    color: "#666",
  },
  productItem: {
    marginBottom: 16,
  },
  nameContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  productName: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
  },
  quantityText: {
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 8,
  },
  barContainer: {
    height: 8,
    backgroundColor: "#F1F1F1",
    borderRadius: 4,
    overflow: "hidden",
  },
  bar: {
    height: "100%",
    borderRadius: 4,
  },
});

export default TopProducts;
