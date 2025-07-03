import { FontAwesome6 } from "@expo/vector-icons";
import React, { useRef } from "react";
import { TouchableOpacity, Text, View, Animated } from "react-native";

interface CheckboxProps {
  text?: string;
  isChecked: boolean;
  onPress: () => void;
  viewProps?: string;
  checkboxProps?: string;
  textProps?: string;
}

export const Checkbox = ({
  text,
  onPress,
  isChecked,
  viewProps,
  checkboxProps,
  textProps,
}: CheckboxProps) => {
  return (
    <View
      style={{ display: "flex", flexDirection: "row" }}
      className={viewProps}
    >
      <TouchableOpacity
        onPress={onPress}
        style={{
          borderColor: "#fc6a19",
          borderWidth: 1.5,
          borderRadius: 4,
          height: 20,
          width: 20,
          backgroundColor: isChecked ? "#fc6a19" : "",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
        }}
        className={checkboxProps}
      >
        <FontAwesome6 name="check" size={12} color="white" />
      </TouchableOpacity>
      {text && (
        <Text style={{ fontSize: 12, marginLeft: 12 }} className={textProps}>
          {text}
        </Text>
      )}
    </View>
  );
};
