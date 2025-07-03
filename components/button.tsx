import {
  GestureResponderEvent,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import "../global.css";

interface ButtonProps {
  icon?: any;
  text?: string;
  textColor?: string;
  borderColor?: string;
  backgroundColor: string;
  viewProps?: string;
  textProps?: string;
  disabled?: boolean;
  onPress: () => void;
}

export const Button = ({
  icon,
  text,
  textColor,
  borderColor,
  backgroundColor,
  viewProps,
  textProps,
  disabled,
  onPress,
}: ButtonProps) => {
  return (
    <TouchableOpacity
      className={viewProps}
      style={{
        backgroundColor: `${backgroundColor}`,
        borderRadius: 30,
        display: "flex",
        flexDirection: "row",
        gap: 8,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: borderColor ? 1 : 0,
        borderColor: `${borderColor}`,
        opacity: disabled ? 0.5 : 1,
      }}
      onPress={onPress}
      disabled={disabled}
    >
      {icon}
      {text && (
        <Text
          className={textProps}
          style={{
            fontSize: 16,
            color: `${textColor}`,
            fontFamily: "semibold",
          }}
        >
          {text}
        </Text>
      )}
    </TouchableOpacity>
  );
};
