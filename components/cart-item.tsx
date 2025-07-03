import { View, Text, Image, TouchableOpacity } from "react-native";
import { AntDesign, Entypo, Feather } from "@expo/vector-icons";
import { formatToVND } from "@/utils/format";
import { Button } from "./button";

import "../global.css";
import { Checkbox } from "./checkbox";
import { useEffect } from "react";
import { useState } from "react";
import { getProductById } from "@/services/products";

interface CartItemProps {
  productId: string;
  size: string;
  quantity: number;
  isSelected: boolean;
  onDelete: () => void;
  onDecrease: () => void;
  onIncrease: () => void;
  onSelect: () => void;
}

export const CartItem = ({
  productId,
  size,
  quantity,
  isSelected,
  onDelete,
  onDecrease,
  onIncrease,
  onSelect,
}: CartItemProps) => {
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
        flexDirection: "row",
        borderRadius: 12,
        padding: 8,
        gap: 12,
        alignItems: "center",
        backgroundColor: "#fff",
      }}
    >
      <Image
        source={{ uri: image }}
        style={{ width: 100, aspectRatio: 1, borderRadius: 8 }}
      />
      <View className="flex flex-col py-2 flex-1" style={{ gap: 6 }}>
        <View className="flex flex-row items-center justify-between">
          <Text className="font-[bold] text-xl">{name}</Text>
          <View
            className="flex flex-row"
            style={{ gap: 12, alignItems: "center" }}
          >
            <Checkbox isChecked={isSelected} onPress={onSelect} />
            <TouchableOpacity onPress={onDelete}>
              <Feather name="trash-2" color="#fc6a19" size={20} />
            </TouchableOpacity>
          </View>
        </View>
        <Text className="font-[medium] text-lg">Size: {size}</Text>
        <View className="flex flex-row justify-between items-center">
          <Text className="font-[medium] text-xl">{formatToVND(price)}</Text>
          <View
            className="flex flex-row items-center"
            style={{
              borderRadius: 20,
              gap: 8,
              padding: 4,
              backgroundColor: "#f2f2f2",
            }}
          >
            <Button
              icon={<Entypo name="minus" size={16} color="black" />}
              backgroundColor="#fff"
              onPress={onDecrease}
              viewProps="p-2"
            />
            <Text className="font-[semibold]">{quantity}</Text>
            <Button
              icon={<Entypo name="plus" size={16} color="white" />}
              backgroundColor="#fc6a19"
              onPress={onIncrease}
              viewProps="p-2"
            />
          </View>
        </View>
      </View>
    </View>
  );
};
