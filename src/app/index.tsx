import { useAuth } from "@/context/AuthProvider";
import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

export default function Index() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // Se já estiver autenticado, vai para home, senão para login
  return <Redirect href={user ? "/home" : "/login"} />;
}
