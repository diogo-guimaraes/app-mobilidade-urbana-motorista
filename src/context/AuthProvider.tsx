import { api, ehErroDeRede, setUnauthorizedHandler } from "@/Services/api";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { AppState } from "react-native";

interface Usuario {
  id: number;
  name: string;
  email: string;
  telefone?: string | null;
  cpf?: string | null;
  foto?: string | null;
  tipoUsuario?: string;
}

interface AuthContextType {
  user: string | null;
  usuario: Usuario | null;
  loading: boolean;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => Promise<void>;
  sessaoValida: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  usuario: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
  sessaoValida: async () => false,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<string | null>(null);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  const limparSessao = useCallback(async () => {
    await SecureStore.deleteItemAsync("token");
    setUser(null);
    setUsuario(null);
  }, []);

  const carregarUsuario = useCallback(async () => {
    const token = await SecureStore.getItemAsync("token");

    if (!token) {
      setUser(null);
      setUsuario(null);
      return;
    }

    try {
      const { data } = await api.get<Usuario>("/usuario-logado");

      setUsuario(data);
      setUser(data?.email ?? null);
    } catch (erro) {
      if (!ehErroDeRede(erro)) {
        await limparSessao();
      }
    }
  }, [limparSessao]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      limparSessao();
      router.replace("/login");
    });
  }, [limparSessao, router]);

  useEffect(() => {
    carregarUsuario().finally(() => setLoading(false));
  }, [carregarUsuario]);

  useEffect(() => {
    const assinatura = AppState.addEventListener("change", (estado) => {
      if (estado === "active") carregarUsuario();
    });

    return () => assinatura.remove();
  }, [carregarUsuario]);

  const login = useCallback(async (email: string, senha: string) => {
    const { data } = await api.post<{ token: string; user: Usuario }>(
      "/auth/login",
      { email, password: senha },
    );

    await SecureStore.setItemAsync("token", data.token);

    setUsuario(data.user);
    setUser(data.user?.email ?? email);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // token já pode estar inválido; a limpeza local é o que importa
    }

    await limparSessao();
  }, [limparSessao]);

  const sessaoValida = useCallback(async () => {
    try {
      await api.get("/usuario-logado");
      return true;
    } catch (erro) {
      return ehErroDeRede(erro);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, usuario, loading, login, logout, sessaoValida }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
