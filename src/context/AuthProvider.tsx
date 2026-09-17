// context/AuthProvider.tsx

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { AppState } from "react-native";

import { api, ehErroDeRede, setUnauthorizedHandler } from "../Services/api";

// =========================
// INTERFACES
// =========================

interface Usuario {
  id: string;
  email: string;
  name: string;
  telefone: string;
  cpf: string;
  data_nascimento: string;
  foto: string;
  foto_thumbnail: string;
}

interface AuthResponse {
  user: Usuario;
  token: string;
}

interface DadosCadastro {
  email: string;
  name: string;
  cpf: string;
  data_nascimento: string;
  password: string;
  telefone?: string;
}

// este app cadastra motorista; sem o perfil o backend cria só o usuário e
// todo endpoint do motorista responde 403
const PERFIL_DESTE_APP = "motorista";

interface AtualizarFotoPayload {
  foto: string;
  foto_thumbnail: string;
}

interface AuthContextType {
  user: Usuario | null;

  loading: boolean;

  login: (email: string, password: string) => Promise<void>;

  loginComToken: (user: Usuario, token: string) => Promise<void>;

  logout: () => Promise<void>;

  register: (dados: DadosCadastro) => Promise<void>;

  atualizarFotoUsuario: (dados: AtualizarFotoPayload) => Promise<void>;

  sessaoValida: () => Promise<boolean>;
}

// =========================
// CONTEXT
// =========================

const AuthContext = createContext<AuthContextType>({
  user: null,

  loading: true,

  login: async (email: string, password: string) => {},

  loginComToken: async (user: Usuario, token: string) => {},

  logout: async () => {},

  register: async (dados: DadosCadastro) => {},

  atualizarFotoUsuario: async (dados: AtualizarFotoPayload) => {},

  sessaoValida: async () => true,
});

// =========================
// PROVIDER
// =========================

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<Usuario | null>(null);

  const [loading, setLoading] = useState(true);

  // =========================
  // RESTAURA SESSÃO
  // =========================

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const storedUser = await SecureStore.getItemAsync("user");
        const storedToken = await SecureStore.getItemAsync("token");

        // só restaura se tiver os dois; usuário sem token não consegue
        // autenticar nenhuma requisição
        if (storedUser && storedToken) {
          const parsedUser = JSON.parse(storedUser);

          setUser(parsedUser);
        }
      } catch (error) {
        console.error("Erro ao restaurar sessão:", error);

        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  // =========================
  // LOGIN
  // =========================

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);

      const response = await api.post<AuthResponse>("/auth/login", {
        email,
        password,
      });

      const { user, token } = response.data;

      setUser(user);

      await SecureStore.setItemAsync("user", JSON.stringify(user));

      await SecureStore.setItemAsync("token", token);
    } catch (error: any) {
      if (__DEV__) {
        console.error(
          "Erro ao fazer login:",
          error?.response?.status,
          error?.response?.data ?? error?.message,
        );
      }

      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginComToken = async (userData: Usuario, token: string) => {
    try {
      setLoading(true);
      setUser(userData);

      await SecureStore.setItemAsync("user", JSON.stringify(userData));

      await SecureStore.setItemAsync("token", token);
    } catch (error) {
      console.error("Erro ao autenticar com token:", error);

      throw error;
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // LOGOUT
  // =========================

  // Limpa a sessão local sem chamar o backend (usado quando o token já é
  // sabidamente inválido, ex: resposta 401 de qualquer requisição).
  const limparSessaoLocal = async () => {
    setUser(null);

    await SecureStore.deleteItemAsync("user");

    await SecureStore.deleteItemAsync("token");
  };

  const logout = async () => {
    try {
      // invalida o token no backend antes de limpar localmente
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Erro ao invalidar token no backend:", error);
    } finally {
      await limparSessaoLocal();
    }
  };

  useEffect(() => {
    setUnauthorizedHandler(() => {
      // token já é inválido (401): só limpa localmente, não chama /auth/logout
      limparSessaoLocal();

      router.replace({
        pathname: "/login",
        params: { motivo: "sessao-expirada" },
      });
    });
  }, []);

  const sessaoValida = useCallback(async () => {
    try {
      await api.get("/usuario-logado");

      return true;
    } catch (error) {
      return ehErroDeRede(error);
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    sessaoValida();

    const assinatura = AppState.addEventListener("change", (estado) => {
      if (estado === "active") {
        sessaoValida();
      }
    });

    return () => assinatura.remove();
  }, [user, sessaoValida]);

  // =========================
  // REGISTER
  // =========================

  const register = async (dadosCadastro: DadosCadastro) => {
    try {
      setLoading(true);

      const response = await api.post<AuthResponse>("/auth/register", {
        ...dadosCadastro,
        perfil: PERFIL_DESTE_APP,
      });

      const { user, token } = response.data;

      setUser(user);

      await SecureStore.setItemAsync("user", JSON.stringify(user));

      await SecureStore.setItemAsync("token", token);
    } catch (error: any) {
      if (__DEV__) {
        console.error(
          "Erro ao registrar:",
          error?.response?.status,
          error?.response?.data ?? error?.message,
        );
      }

      throw error;
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // ATUALIZAR FOTO USUÁRIO
  // =========================

  const atualizarFotoUsuario = async ({
    foto,
    foto_thumbnail,
  }: AtualizarFotoPayload) => {
    if (!user) return;

    const usuarioAtualizado = {
      ...user,
      foto,
      foto_thumbnail,
    };

    setUser(usuarioAtualizado);

    await SecureStore.setItemAsync("user", JSON.stringify(usuarioAtualizado));
  };

  // =========================
  // PROVIDER
  // =========================

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        loginComToken,
        logout,
        register,
        atualizarFotoUsuario,
        sessaoValida,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// =========================
// HOOK
// =========================

export const useAuth = () => useContext(AuthContext);
