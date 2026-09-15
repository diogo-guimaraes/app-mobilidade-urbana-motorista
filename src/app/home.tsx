// app/home.tsx
import FolhaInferiorMotorista from "@/components/FolhaInferiorMotorista";
import FolhaInferiorPassageiro from "@/components/FolhaInferiorPassageiro";
import GanhoDiario from "@/components/GanhoDiario";
import Map from "@/components/Map";
import MenuInferiorMotorista from "@/components/MenuInferiorMotorista";
import MenuInferiorPassageiro from "@/components/MenuInferiorPassageiro";
import RecebendoChamada from "@/components/RecebendoChamada";
import SideMenu from "@/components/SideMenu";
import SolicitacoesCorrida from "@/components/SolicitacoesCorrida";
import SolicitarCorrida from "@/components/SolicitarCorrida";
import TopMenu from "@/components/TopMenu";
import { useAuth } from "@/context/AuthProvider";
import AvaliarPassageiro from "@/components/AvaliarPassageiro";
import { useAvaliacaoPendente } from "@/hooks/useAvaliacaoPendente";
import { useDespachoMotorista } from "@/hooks/useDespachoMotorista";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { Region } from "react-native-maps";

const ROTULO_STATUS: Record<string, string> = {
  aceita: "A caminho do passageiro",
  motorista_chegou: "No local, aguardando",
  em_andamento: "Viagem em andamento",
};

const PROXIMA_ACAO: Record<
  string,
  { acao: "cheguei" | "iniciar" | "finalizar"; rotulo: string }
> = {
  aceita: { acao: "cheguei", rotulo: "Cheguei" },
  motorista_chegou: { acao: "iniciar", rotulo: "Iniciar viagem" },
  em_andamento: { acao: "finalizar", rotulo: "Finalizar" },
};

export default function Home() {
  const { user, loading: authLoading, usuario } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedTab, setSelectedTab] = useState("corrida");
  const [region, setRegion] = useState<Region | null>(null);
  const [destinationModalVisible, setDestinationModalVisible] = useState(false);
  const [solicitacoesCorrida, setSolicitacoesCorrida] = useState(false);
  const {
    disponivel,
    oferta,
    corrida,
    chegada,
    erro: erroDespacho,
    ocupado,
    alternarDisponibilidade,
    aceitar,
    recusar,
    avancar,
  } = useDespachoMotorista();

  const {
    corrida: corridaParaAvaliar,
    enviando: enviandoAvaliacao,
    avaliar,
    dispensar: dispensarAvaliacao,
  } = useAvaliacaoPendente(corrida?.id ?? null);

  // ✨ NOVO ESTADO: Armazena a região inicial do usuário (sem o ajuste de offset)
  const userInitialRegion = useRef<Region | null>(null);

  // ✨ NOVO: Estado para armazenar o índice do BottomSheet
  const [bottomSheetIndex, setBottomSheetIndex] = useState<number>(0);

  // ✨ NOVO: Estado do modal de ganhos foi elevado para cá
  const [ganhoModalVisivel, setGanhoModalVisivel] = useState(false);

  const drawerWidth = Math.round(Dimensions.get("window").width * 0.78);
  const translateX = useRef(new Animated.Value(-drawerWidth)).current;

  useEffect(() => {
    Animated.timing(translateX, {
      toValue: menuVisible ? 0 : -drawerWidth,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [menuVisible, drawerWidth, translateX]);

  // 🔹 Função para fechar o menu
  const closeMenu = useCallback(() => {
    setMenuVisible(false);
  }, []);

  // ✨ NOVA FUNÇÃO: Coordena abertura do menu e fechamento do modal
  const handleMenuOpen = () => {
    if (ganhoModalVisivel) {
      // Pequeno delay para deixar a animação do modal acontecer antes do SideMenu
      setMenuVisible(true);
      setGanhoModalVisivel(false);
      // setTimeout(() => setGanhoModalVisivel(false), 500); // mesmo tempo da animação
      return;
    }
    setMenuVisible(true);
  };

  // 🔹 Redirecionar para login se não estiver autenticado
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [user, authLoading, router]);

  const handleUserLocationFound = useCallback((userRegion: Region) => {
    console.log("handleUserLocationFound teste:");

    userInitialRegion.current = {
      ...userRegion,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };

    // 🔹 Ajuste de deslocamento vertical inicial (para o snap point 0)
    const offsetLatitude = 0.0064;
    const adjustedRegion: Region = {
      ...userRegion,
      latitude: userRegion.latitude - offsetLatitude, // 🔹 Move o mapa para cima
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
    setRegion(adjustedRegion);
  }, []);

  // ✨ NOVO: Função para ajustar o mapa quando o BottomSheet muda de estado
  const handleSheetStateChange = useCallback((index: number) => {
    console.log(usuario, "BottomSheet Index1:", index);
    // 🔹 Atualiza o estado que será passado para o Map
    setBottomSheetIndex(index);
    if (!userInitialRegion.current) {
      // Garante que temos a localização do usuário antes de ajustar
      return;
    }
  }, []);

  const onChangeBottomSheetMotorista = useCallback((index: number) => {
    console.log(usuario, "onChangeBottomSheetMotorista Index:", index);
    console.log(user, "user home:");

    setBottomSheetIndex(index);
    if (!userInitialRegion.current) {
      return;
    }
  }, []);

  // 🔹 Mostrar loading enquanto verifica autenticação
  if (authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
        <ActivityIndicator size="large" color="#000" />
        <Text style={styles.loadingText}>Verificando autenticação...</Text>
      </View>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* <StatusBar style={colorScheme === "dark" ? "light" : "dark"} /> */}

      {/* 🔹 Mapa com ajuste de posicionamento */}
      <Map
        region={region}
        onRegionChange={setRegion}
        onUserLocationFound={handleUserLocationFound}
        bottomSheetIndex={bottomSheetIndex}
        isGanhoModalVisible={ganhoModalVisivel}
      />

      <TouchableOpacity
        style={styles.botaoDisponibilidade}
        disabled={ocupado || corrida !== null}
        onPress={() => alternarDisponibilidade(!disponivel)}
      >
        <Ionicons
          name={disponivel ? "radio-outline" : "power-outline"}
          size={30}
          color={disponivel ? "#22c55e" : "#fbc02d"}
        />
        <Text style={styles.textoDisponibilidade}>
          {corrida !== null ? "Em corrida" : disponivel ? "Online" : "Offline"}
        </Text>
      </TouchableOpacity>

      {erroDespacho.length > 0 && (
        <View style={styles.faixaErro}>
          <Text style={styles.textoErro}>{erroDespacho}</Text>
        </View>
      )}

      {corrida !== null && (
        <View style={styles.barraCorrida}>
          <Text style={styles.codigoCorrida}>{corrida.codigo_corrida}</Text>
          <View style={styles.statusCorrida}>
            <Text style={styles.statusTexto}>
              {ROTULO_STATUS[corrida.status_corrida] ?? corrida.status_corrida}
            </Text>

            {chegada && (
              <Text style={styles.chegadaTexto}>
                {chegada.alvo === "origem"
                  ? `${chegada.minutos} min até o passageiro`
                  : `${chegada.minutos} min até o destino`}
                {` · ${chegada.distancia_km.toFixed(1).replace(".", ",")} km`}
              </Text>
            )}
          </View>

          {PROXIMA_ACAO[corrida.status_corrida] && (
            <TouchableOpacity
              style={styles.botaoAcao}
              disabled={ocupado}
              onPress={() => avancar(PROXIMA_ACAO[corrida.status_corrida].acao)}
            >
              <Text style={styles.textoBotaoAcao}>
                {PROXIMA_ACAO[corrida.status_corrida].rotulo}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {corridaParaAvaliar !== null && corrida === null && (
        <AvaliarPassageiro
          corrida={corridaParaAvaliar}
          enviando={enviandoAvaliacao}
          onAvaliar={avaliar}
          onDispensar={dispensarAvaliacao}
        />
      )}

      {oferta !== null && corrida === null && (
        <RecebendoChamada
          valor={oferta.valor_motorista}
          onAceitar={aceitar}
          onRecusar={recusar}
        />
      )}

      <GanhoDiario
        visible={ganhoModalVisivel}
        setVisible={setGanhoModalVisivel}
      />
      <TopMenu onMenuPress={handleMenuOpen} />

      {/* Backdrop para SideMenu */}
      {menuVisible && (
        <Pressable
          style={styles.backdrop}
          onPress={() => setMenuVisible(false)}
        />
      )}

      {/* Side Menu - zIndex menor */}
      <SideMenu visible={menuVisible} onClose={closeMenu} drawerWidth={280} />

      {/* FolhaInferior */}
      {oferta === null && (
        <>
          {menuVisible && (
            <Pressable
              style={styles.backdrop}
              onPress={() => setMenuVisible(false)}
            />
          )}

          {usuario?.tipoUsuario === "PASSAGEIRO" ? (
            <FolhaInferiorPassageiro
              onPressInput={() => setDestinationModalVisible(true)}
              onSheetChange={handleSheetStateChange}
            />
          ) : (
            <FolhaInferiorMotorista
              onSheetChange={onChangeBottomSheetMotorista}
            />
          )}

          <SolicitarCorrida
            visible={destinationModalVisible}
            onClose={() => setDestinationModalVisible(false)}
          />

          <SolicitacoesCorrida
            visible={solicitacoesCorrida}
            onClose={() => setSolicitacoesCorrida(false)}
          />

          {usuario?.tipoUsuario === "PASSAGEIRO" ? (
            <MenuInferiorPassageiro
              selectedTab={selectedTab}
              onTabPress={setSelectedTab}
            />
          ) : (
            <MenuInferiorMotorista
              setSolicitacoesCorrida={() => setSolicitacoesCorrida(true)}
            />
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  botaoDisponibilidade: {
    position: "absolute",
    top: 150,
    left: 10,
    backgroundColor: "#000",
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  textoDisponibilidade: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  faixaErro: {
    position: "absolute",
    top: 110,
    left: 10,
    right: 10,
    backgroundColor: "rgba(220, 38, 38, 0.92)",
    borderRadius: 10,
    padding: 10,
  },
  textoErro: {
    color: "#fff",
    fontSize: 13,
    textAlign: "center",
  },
  barraCorrida: {
    position: "absolute",
    top: 60,
    left: 10,
    right: 10,
    backgroundColor: "#111",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  codigoCorrida: {
    color: "#fbc02d",
    fontWeight: "700",
    fontSize: 13,
  },
  statusCorrida: {
    flex: 1,
    marginHorizontal: 10,
  },
  statusTexto: {
    color: "#fff",
    fontSize: 13,
  },
  chegadaTexto: {
    color: "#fbc02d",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  botaoAcao: {
    backgroundColor: "#fbc02d",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  textoBotaoAcao: {
    color: "#000",
    fontWeight: "700",
    fontSize: 13,
  },
  container: { flex: 1 },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.28)",
    zIndex: 18, // zIndex para o backdrop do SideMenu
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
});
