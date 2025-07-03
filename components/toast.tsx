import React, {
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
  useState,
} from "react";
import { Animated, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface ToastProps {
  duration?: number; // Duration to show the toast
  animationDuration?: number; // Duration for slide animations
}

const toastStyles = {
  success: {
    backgroundColor: "#4caf50", // Green
    icon: "checkmark-circle-outline",
  },
  error: {
    backgroundColor: "#f44336", // Red
    icon: "close-circle-outline",
  },
  info: {
    backgroundColor: "#2196f3", // Blue
    icon: "information-circle-outline",
  },
  warning: {
    backgroundColor: "#ff9800", // Orange
    icon: "warning-outline",
  },
};

export const Toast = forwardRef(
  ({ duration = 2000, animationDuration = 300 }: ToastProps, ref) => {
    const translateY = useRef(new Animated.Value(-100)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null); // Store the timeout ID
    const [message, setMessage] = useState("");
    const [icon, setIcon] = useState<string>("information-circle-outline");
    const [backgroundColor, setBackgroundColor] = useState("#2196f3");

    useImperativeHandle(ref, () => ({
      show: (
        message: string,
        type: "success" | "error" | "info" | "warning" = "info"
      ) => {
        // Clear the previous timer if any
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        // Reset the toast state
        setMessage(message);
        const { backgroundColor, icon } = toastStyles[type] || toastStyles.info;
        setIcon(icon);
        setBackgroundColor(backgroundColor);

        // Reset animation values
        translateY.setValue(-100);
        opacity.setValue(0);

        // Slide in and fade in
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: 0,
            duration: animationDuration,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: animationDuration,
            useNativeDriver: true,
          }),
        ]).start();

        // Start a new timeout
        timeoutRef.current = setTimeout(() => {
          Animated.parallel([
            Animated.timing(translateY, {
              toValue: -100,
              duration: animationDuration,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: animationDuration,
              useNativeDriver: true,
            }),
          ]).start();
        }, duration);
      },
    }));

    return (
      <Animated.View
        style={[
          {
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 999,
            transform: [{ translateY }],
            opacity,
          },
        ]}
      >
        <View
          className="mx-4 mt-8"
          style={{
            backgroundColor,
            paddingHorizontal: 16,
            paddingVertical: 8,
            alignSelf: "center",
            borderRadius: 40,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <Ionicons name={icon as any} size={24} color="white" />
          <Text className="text-white text-center font-[medium] ml-2">
            {message}
          </Text>
        </View>
      </Animated.View>
    );
  }
);
