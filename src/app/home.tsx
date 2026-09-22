// app/home.tsx
import AvaliarPassageiro from "@/components/AvaliarPassageiro";
import CorridaEmAndamento from "@/components/CorridaEmAndamento";
import FolhaInferiorMotorista from "@/components/FolhaInferiorMotorista";
import GanhoDiario from "@/components/GanhoDiario";
import Map from "@/components/Map";
import MenuInferiorMotorista from "@/components/MenuInferiorMotorista";
import RecebendoChamada from "@/components/RecebendoChamada";
import SideMenu from "@/components/SideMenu";
import SolicitacoesCorrida from "@/components/SolicitacoesCorrida";
import SolicitarCorrida from "@/components/SolicitarCorrida";
import TopMenu from "@/components/TopMenu";
import { Text } from "@/components/common/Texto";
import { useAuth } from "@/context/AuthProvider";
import { useAvaliacaoPendente } from "@/hooks/useAvaliacaoPendente";
import { useDespachoMotorista } from "@/hooks/useDespachoMotorista";
import { useRotaDaCorrida } from "@/hooks/useRotaDaCorrida";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Pressable,
  StyleSheet,
  View,
  useColorScheme,
} from "react-native";
import { Region } from "react-native-maps";
import { useSharedValue } from "react-native-reanimated";

// altura aproximada da folha de corrida, pra rota não ser enquadrada atrás dela
const ALTURA_FOLHA_CORRIDA = 330;
const ALTURA_FOLHA_ESPERA = 430;

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const [menuVisible, setMenuVisible] = useState(false);
  const [region, setRegion] = useState<Region | null>(null);
  const [destinationModalVisible, setDestinationModalVisible] = useState(false);
  const [solicitacoesCorrida, setSolicitacoesCorrida] = useState(false);
  const {
    disponivel,
    oferta,
    ofertas,
    carregandoOfertas,
    corrida,
    chegada,
    espera,
    passageiro,
    posicao,
    precisaLiberacao,
    ocupado,
    alternarDisponibilidade,
    aceitar,
    recusar,
    recarregarOfertas,
    avancar,
    cancelarNaoComparecimento,
  } = useDespachoMotorista();

  const { rota: rotaDaCorrida, alvo: alvoDaCorrida } = useRotaDaCorrida(
    corrida,
    posicao,
  );

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
  const bottomSheetAnimatedIndex = useSharedValue(0);

  // ✨ NOVO: Estado do modal de ganhos foi elevado para cá
  const [ganhoModalVisivel, setGanhoModalVisivel] = useState(false);

  const drawerWidth = Math.round(Dimensions.get("window").width * 0.78);
  const [translateX] = useState(() => new Animated.Value(-drawerWidth));

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
  // cadastro ainda em análise não opera: volta para a esteira de liberação
  useEffect(() => {
    if (precisaLiberacao) {
      router.replace("/liberacao");
    }
  }, [precisaLiberacao, router]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [user, authLoading, router]);

  const handleUserLocationFound = useCallback((userRegion: Region) => {
    userInitialRegion.current = {
      ...userRegion,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };

    const adjustedRegion: Region = {
      ...userRegion,
      latitude: userRegion.latitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
    setRegion(adjustedRegion);
  }, []);

  const onChangeBottomSheetMotorista = useCallback((index: number) => {
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
        indiceFolhaAnimado={bottomSheetAnimatedIndex}
        isGanhoModalVisible={ganhoModalVisivel}
        rota={rotaDaCorrida}
        alvo={alvoDaCorrida}
        alvoEhDestino={corrida?.status_corrida === "em_andamento"}
        alturaFolha={
          corrida === null
            ? 0
            : corrida.status_corrida === "motorista_chegou"
              ? ALTURA_FOLHA_ESPERA
              : ALTURA_FOLHA_CORRIDA
        }
      />

      {corrida !== null && (
        <CorridaEmAndamento
          status={corrida.status_corrida}
          codigoCorrida={corrida.codigo_corrida}
          origem={
            corrida.corrida_destinos?.find((d) => d.tipo === "origem")?.endereco
          }
          destino={
            corrida.corrida_destinos?.find((d) => d.tipo === "destino")
              ?.endereco
          }
          passageiro={passageiro}
          minutos={chegada?.minutos ?? null}
          distanciaKm={chegada?.distancia_km ?? null}
          ocupado={ocupado}
          espera={espera}
          onAvancar={avancar}
          onCancelarNaoComparecimento={cancelarNaoComparecimento}
        />
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
          key={oferta.corrida_id}
          valor={oferta.valor_motorista}
          distanciaAteOrigem={oferta.distancia_ate_origem_km}
          distanciaDaCorrida={oferta.distancia_corrida_km}
          origem={oferta.origem}
          destino={oferta.destino}
          paradas={oferta.paradas}
          notaPassageiro={oferta.passageiro_nota}
          corridasPassageiro={oferta.passageiro_corridas}
          onAceitar={aceitar}
          onRecusar={recusar}
        />
      )}

      <GanhoDiario
        visible={ganhoModalVisivel}
        setVisible={setGanhoModalVisivel}
        corridaAtivaId={corrida?.id ?? null}
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
      <SideMenu
        visible={menuVisible}
        onClose={closeMenu}
        drawerWidth={280}
        disponivel={disponivel}
        emCorrida={corrida !== null}
        onAlternarDisponibilidade={alternarDisponibilidade}
      />

      {/* FolhaInferior */}
      {oferta === null && corrida === null && (
        <>
          {menuVisible && (
            <Pressable
              style={styles.backdrop}
              onPress={() => setMenuVisible(false)}
            />
          )}

          <FolhaInferiorMotorista
            onSheetChange={onChangeBottomSheetMotorista}
            indiceAnimado={bottomSheetAnimatedIndex}
          />

          <SolicitarCorrida
            visible={destinationModalVisible}
            onClose={() => setDestinationModalVisible(false)}
          />

          <SolicitacoesCorrida
            visible={solicitacoesCorrida}
            onClose={() => setSolicitacoesCorrida(false)}
            disponivel={disponivel}
            carregando={carregandoOfertas}
            ofertas={ofertas}
            ocupado={ocupado}
            onAtualizar={recarregarOfertas}
            onAceitar={(corridaId) => {
              setSolicitacoesCorrida(false);
              void aceitar(corridaId);
            }}
            onRecusar={(corridaId) => recusar(corridaId)}
          />

          <MenuInferiorMotorista
            setSolicitacoesCorrida={() => setSolicitacoesCorrida(true)}
            disponivel={disponivel}
            emCorrida={corrida !== null}
            ocupado={ocupado}
            onAlternarDisponibilidade={alternarDisponibilidade}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
