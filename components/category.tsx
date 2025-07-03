import { Image, Pressable, Text, TouchableOpacity, View } from "react-native";

interface CategoryProps {
  name: string;
  imagePath: string | number;
  isActive: boolean;
  onPress: () => void;
}

export const Category = ({
  name,
  imagePath,
  isActive,
  onPress,
}: CategoryProps) => {
  return (
    <TouchableOpacity
      style={{
        backgroundColor: isActive ? "#fc6a19" : "#e9e9e9",
        borderRadius: 8,
        padding: 8,
        display: "flex",
        gap: 8,
        minWidth: 80,
        alignItems: "center",
      }}
      onPress={onPress}
    >
      <Image
        source={typeof imagePath === "string" ? { uri: imagePath } : imagePath}
        style={{ width: 60, height: 60, resizeMode: "contain" }}
      />
      <Text
        style={{
          color: isActive ? "#fff" : "#1e1b1b",
          fontFamily: "semibold",
        }}
      >
        {name}
      </Text>
    </TouchableOpacity>
  );
};
