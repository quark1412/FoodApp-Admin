import { Redirect } from "expo-router";
import { View, Text } from "react-native";
import { useSession } from "../ctx"; // Adjust the import based on your context

export default function Index() {
  const { session, isLoading } = useSession();

  if (isLoading) {
    return <Text className="text-white">Loading...</Text>;
  }

  // Redirect to sign-in if not authenticated
  if (!session) {
    return <Redirect href="/sign-in" />; // Ensure this matches your file structure
  }

  // Render the main content if authenticated
  return (
    <View>
      <Text className="text-white">Welcome to the app!</Text>
    </View>
  );
}
