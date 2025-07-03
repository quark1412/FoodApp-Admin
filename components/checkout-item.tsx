import { View, Text, Image, TouchableOpacity } from "react-native";
import { AntDesign, Entypo, Feather } from "@expo/vector-icons";
import { formatToVND } from "@/utils/format";
import { Button } from "./button";

import "../global.css";
import { Checkbox } from "./checkbox";
import { useEffect } from "react";
import { useState } from "react";
import { getProductById } from "@/services/products";

interface CheckoutItemProps {
  productId: string;
  size: string;
  quantity: number;
}

export const CheckoutItem = ({
  productId,
  size,
  quantity,
}: CheckoutItemProps) => {
  const [image, setImage] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [price, setPrice] = useState<number>(0);

  useEffect(() => {
    const fetchProduct = async () => {
      const product = await getProductById(productId);
      setImage(product.images[0].url);
      setName(product.name);
      setPrice(product.price);
    };
    fetchProduct();
  }, [productId]);

  return (
    <View
      style={{
        display: "flex",
        justifyContent: "space-between",
        flexDirection: "row",
        borderRadius: 12,
        padding: 8,
        alignItems: "center",
        backgroundColor: "#fff",
      }}
    >
      <View className="flex flex-row gap-3 items-center">
        <Text className="font-[medium]">{quantity}x</Text>
        <Image
          source={{ uri: image }}
          style={{ width: 40, aspectRatio: 1, borderRadius: 8 }}
        />
        <Text className="font-[medium] text-lg">
          {name} | {size}
        </Text>
      </View>
      <Text className="font-[medium] text-lg">{formatToVND(price)}</Text>
    </View>
  );
};
