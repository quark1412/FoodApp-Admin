import {
  TextInput,
  View,
  Text,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import "../global.css";

interface InputProps {
  icon?: any;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  onKeyPress?: (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => void;
  viewProps?: string | undefined;
  inputProps?: string | undefined;
  type?: "text" | "password";
}

export const Input = ({
  icon,
  placeholder,
  value,
  onKeyPress,
  onChangeText,
  viewProps,
  inputProps,
  type = "text",
}: InputProps) => {
  return (
    <View
      className={viewProps}
      style={{
        display: "flex",
        flexDirection: "row",
        borderRadius: 8,
        padding: 12,
        gap: 8,
        alignItems: "center",
      }}
    >
      {icon}
      <TextInput
        className={inputProps}
        placeholder={placeholder}
        placeholderTextColor="#ababab"
        value={value}
        onChangeText={onChangeText}
        onKeyPress={onKeyPress}
        secureTextEntry={type === "password"}
        style={{
          borderWidth: 0,
          flex: 1,
          padding: 8,
          fontFamily: "medium",
          textAlignVertical: "center",
        }}
      />
    </View>
  );
};
