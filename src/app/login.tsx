// app/login.tsx
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { AxiosError } from "axios";
import { useAuth } from "../context/AuthProvider";

import { StatusBar } from "expo-status-bar";

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [entrando, setEntrando] = useState(false);
  const { user, loading, login } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();

  // 🔹 Redireciona automaticamente quando o usuário é definido
  useEffect(() => {
    if (user && !loading) {
      router.replace("/home");
    }
  }, [user, loading, router]);

  const handleLogin = async () => {
    if (email.trim().length === 0 || senha.length === 0) {
      setErro("Preencha e-mail e senha.");
      return;
    }

    setErro("");
    setEntrando(true);

    try {
      await login(email.trim(), senha);
    } catch (falha) {
      const resposta = (falha as AxiosError<{ message?: string }>)?.response;

      setErro(resposta?.data?.message ?? "Não foi possível entrar.");
    } finally {
      setEntrando(false);
    }
  };

  const handleRegister = () => {
    router.push("/register");
  };

  // 🔹 Mostrar loading enquanto verifica autenticação
  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white dark:bg-black">
        <ActivityIndicator size="large" color="#007AFF" />
        <Text className="mt-4 text-gray-600 dark:text-gray-300">
          Verificando autenticação...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 p-4 bg-white dark:bg-black">
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        className="flex-1"
      >
        <View className="flex-1 justify-center items-center">
          <Text className="text-2xl text-black dark:text-white mb-8">
            Login
          </Text>

          <TextInput
            className="w-full bg-gray-200 dark:bg-gray-700 border-2 border-green-500 dark:border-green-600 rounded-full m-4 p-4 text-black dark:text-white"
            placeholder="Digite seu e-mail"
            placeholderTextColor={
              colorScheme === "dark" ? "#9CA3AF" : "#6B7280"
            }
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            editable={!loading && !entrando}
          />

          <TextInput
            className="w-full bg-gray-200 dark:bg-gray-700 border-2 border-green-500 dark:border-green-600 rounded-full m-4 p-4 text-black dark:text-white"
            placeholder="Digite sua senha"
            placeholderTextColor={
              colorScheme === "dark" ? "#9CA3AF" : "#6B7280"
            }
            value={senha}
            onChangeText={setSenha}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
            editable={!loading && !entrando}
          />

          {erro.length > 0 && (
            <Text className="text-red-500 px-4 text-center">{erro}</Text>
          )}

          <TouchableOpacity
            className="bg-blue-500 w-48 p-4 rounded-full mb-4"
            onPress={handleLogin}
            disabled={loading || entrando}
          >
            {loading || entrando ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text className="text-white text-center font-semibold">
                Login
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={handleRegister} disabled={loading}>
            <Text className="text-blue-500 text-lg text-center">
              Não tem conta? Cadastre-se
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
