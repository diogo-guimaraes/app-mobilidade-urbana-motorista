// app/_layout.tsx
import { AuthProvider } from "@/context/AuthProvider";
import "@/styles/global.css";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Image, useColorScheme } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
        <Stack>
          <Stack.Screen
            name="login"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="loginEmail"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="register"
            options={{
              headerShown: false,
            }}
          />

          <Stack.Screen
            name="home"
            options={{
              headerShown: false,
            }}
          />

          <Stack.Screen
            name="index"
            options={{
              headerShown: true,
              headerStyle: { backgroundColor: "black" },
              headerTintColor: "#fff",
              headerTitleStyle: { fontWeight: "bold" },
              headerTitle: () => (
                <Image source={require("../../assets/images/logo.png")} />
              ),
            }}
          />
        </Stack>
      </GestureHandlerRootView>
    </AuthProvider>
  );
}
