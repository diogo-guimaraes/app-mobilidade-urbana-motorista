import axios from "axios";
import * as SecureStore from "expo-secure-store";

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

type UnauthorizedHandler = () => void;
let onUnauthorized: UnauthorizedHandler | null = null;

export const setUnauthorizedHandler = (handler: UnauthorizedHandler) => {
  onUnauthorized = handler;
};

export const ehErroDeRede = (error: unknown) =>
  Boolean(error) &&
  typeof error === "object" &&
  "isAxiosError" in (error as object) &&
  !(error as { response?: unknown }).response;

let renovacaoEmAndamento: Promise<string | null> | null = null;

const renovarToken = (): Promise<string | null> => {
  renovacaoEmAndamento ??= (async () => {
    try {
      const token = await SecureStore.getItemAsync("token");

      if (!token) return null;

      const { data } = await axios.post<{ token?: string }>(
        `${process.env.EXPO_PUBLIC_API_URL}/auth/refresh`,
        {},
        {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (typeof data?.token !== "string") return null;

      await SecureStore.setItemAsync("token", data.token);

      return data.token;
    } catch {
      return null;
    } finally {
      renovacaoEmAndamento = null;
    }
  })();

  return renovacaoEmAndamento;
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error?.config;

    const tinhaToken = Boolean(config?.headers?.Authorization);

    if (error?.response?.status === 401 && tinhaToken) {
      if (!config.__jaTentouRenovar) {
        config.__jaTentouRenovar = true;

        const novoToken = await renovarToken();

        if (novoToken) {
          config.headers.Authorization = `Bearer ${novoToken}`;

          return api.request(config);
        }
      }

      onUnauthorized?.();
    }

    return Promise.reject(error);
  },
);
