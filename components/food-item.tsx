import { formatToVND } from "@/utils/format";
import { AntDesign, Entypo, MaterialCommunityIcons } from "@expo/vector-icons";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { Button } from "./button";
import { Link } from "expo-router";

interface FoodItemProps {
  id: string;
  imagePath: string;
  name: string;
  category: string;
  rating: number;
  price: number;
}

export const FoodItem = ({
  id,
  imagePath,
  name,
  category,
  rating,
  price,
}: FoodItemProps) => {
  return (
    <Link href={`/foods/${id}`} asChild>
      <TouchableOpacity
        style={{
          display: "flex",
          flexDirection: "column",
          borderRadius: 12,
          padding: 8,
          gap: 12,
          backgroundColor: "#fff",
        }}
      >
        <Image
          source={{ uri: imagePath }}
          style={{
            width: 140,
            height: 140,
            borderRadius: 12,
          }}
        />
        <View
          className="flex flex-col flex-1"
          style={{
            justifyContent: "space-between",
            gap: 4,
            paddingHorizontal: 4,
          }}
        >
          <View className="flex flex-row justify-between items-center">
            <View
              className="px-4 py-2 border-[#ffe4d6] "
              style={{ backgroundColor: "#ffe4d6", borderRadius: 20 }}
            >
              <Text
                className="text-[#fc6a19]"
                style={{ fontFamily: "semibold" }}
              >
                {category}
              </Text>
            </View>
          </View>
          <Text className="font-[medium] text-lg text-[#6c6c6c] text-wrap">
            {name}
          </Text>
          {/* <View
            className="flex flex-row"
            style={{ gap: 12, alignItems: "center" }}
          >
            <Checkbox isChecked={isSelected} onPress={onSelect} />
            <TouchableOpacity onPress={onDelete}>
              <Feather name="trash-2" color="#fc6a19" size={20} />
            </TouchableOpacity>
          </View> */}

          <View className="flex flex-row justify-between items-center">
            <Text className="font-[bold] text-xl">{formatToVND(price)}</Text>
            <View className="flex flex-row" style={{ gap: 6 }}>
              <AntDesign name="star" color="#fc6a19" size={16} />
              <Text className="font-[medium]">{rating}</Text>
            </View>
            {/* <Button
              icon={
                <MaterialCommunityIcons
                  name="cart-outline"
                  size={20}
                  color="white"
                />
              }
              backgroundColor="#fc6a19"
              viewProps="py-2 px-4"
            /> */}
          </View>
        </View>
      </TouchableOpacity>
    </Link>
  );
};
