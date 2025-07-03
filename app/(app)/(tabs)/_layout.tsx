import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { AdminGuard } from "@/components/AdminGuard";

export default function RootLayout() {
  return (
    // <AdminGuard>
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          borderTopLeftRadius: 12,
          borderTopRightRadius: 12,
          borderWidth: 0,
          marginBottom: 20,
          backgroundColor: "#fff",
          boxShadow: "0 0 8 rgba(0,0,0,.1)",
          height: 70,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
          marginTop: -4,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, focused }) => {
            return focused ? (
              <Ionicons name="grid" size={20} color={"#fc6a19"} />
            ) : (
              <Ionicons name="grid-outline" size={20} />
            );
          },
          tabBarLabel: "Dashboard",
          tabBarActiveTintColor: "#fc6a19",
          tabBarInactiveTintColor: "#1e1b1b",
          tabBarIconStyle: { marginTop: -2 },
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: "Products",
          tabBarIcon: ({ color, focused }) => {
            return focused ? (
              <Ionicons name="cube" size={20} color={"#fc6a19"} />
            ) : (
              <Ionicons name="cube-outline" size={20} />
            );
          },
          tabBarLabel: "Products",
          tabBarActiveTintColor: "#fc6a19",
          tabBarInactiveTintColor: "#1e1b1b",
          tabBarIconStyle: { marginTop: -2 },
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: "Categories",
          tabBarIcon: ({ color, focused }) => {
            return focused ? (
              <Ionicons name="folder" size={20} color={"#fc6a19"} />
            ) : (
              <Ionicons name="folder-outline" size={20} />
            );
          },
          tabBarLabel: "Categories",
          tabBarActiveTintColor: "#fc6a19",
          tabBarInactiveTintColor: "#1e1b1b",
          tabBarIconStyle: { marginTop: -2 },
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          title: "Users",
          tabBarIcon: ({ color, focused }) => {
            return focused ? (
              <Ionicons name="people" size={20} color={"#fc6a19"} />
            ) : (
              <Ionicons name="people-outline" size={20} />
            );
          },
          tabBarLabel: "Users",
          tabBarActiveTintColor: "#fc6a19",
          tabBarInactiveTintColor: "#1e1b1b",
          tabBarIconStyle: { marginTop: -2 },
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => {
            return focused ? (
              <MaterialCommunityIcons
                name="account-circle"
                size={20}
                color={"#fc6a19"}
              />
            ) : (
              <MaterialCommunityIcons name="account-circle-outline" size={20} />
            );
          },
          tabBarLabel: "Account",
          tabBarActiveTintColor: "#fc6a19",
          tabBarInactiveTintColor: "#1e1b1b",
          tabBarIconStyle: { marginTop: -2 },
        }}
      />
    </Tabs>
    // </AdminGuard>
  );
}
