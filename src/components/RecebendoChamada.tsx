import { Ionicons } from "@expo/vector-icons";
import { AudioPlayer, createAudioPlayer } from "expo-audio";
import React, { useEffect, useRef, useState } from "react";
import { Text } from "@/components/common/Texto";
import {
  Animated,
  Easing,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import NegociarChamada from "./NegociarChamada";

interface RecebendoChamadaProps {
  onAceitar: () => void;
  onRecusar: () => void;
  valor?: number;
  distanciaAteOrigem?: number;
  distanciaDaCorrida?: number;
  origem?: string;
  destino?: string | null;
  paradas?: number;
  notaPassageiro?: number | null;
  corridasPassageiro?: number;
}

const DURACAO_OFERTA_MS = 20_000;

const silenciar = (player: AudioPlayer | null) => {
  if (!player) return;

  try {
    player.loop = false;
  } catch {}

  try {
    player.pause();
  } catch {}

  try {
    player.remove();
  } catch {}
};

// ==========================================================
// 🚀 Componente Interno: PulseOverlay
// Efeito de pulso com múltiplas ondas (3 ondas) - Adaptado do BottomMenu
// ==========================================================
const PulseOverlay = () => {
  // Referências para as três ondas de pulso
  const [pulse1] = useState(() => new Animated.Value(0));
  // const pulse2 = useRef(new Animated.Value(0)).current;
  // const pulse3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Duração mais rápida para simular a urgência da chamada
    const DURATION = 2100;
    // Função para criar o loop de pulso com atraso
    const createPulse = (animatedValue: Animated.Value, delay: number) => {
      // Cria um loop que sequencia: 1) Atraso, 2) Expansão (0 -> 1), 3) Reset (1 -> 0)
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: DURATION,
            easing: Easing.out(Easing.ease),
            useNativeDriver: false,
          }),
          // Reseta a animação para 0 imediatamente para reiniciar o ciclo
          Animated.timing(animatedValue, {
            toValue: 0,
            duration: 0,
            useNativeDriver: false,
          }),
        ]),
      );
    };

    // Inicia as animações com atrasos sequenciais
    const anim1 = createPulse(pulse1, 0);

    anim1.start();

    return () => {
      anim1.stop();
    };
  }, [pulse1]);

  // Função para gerar os estilos animados
  const getCircleStyle = (animatedValue: Animated.Value) => {
    // Escala (começa menor e expande)
    const scale = animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0.5, 3.5], // Escala aumentada para cobrir o card inteiro
    });

    // Opacidade Invertida: Começa mais visível (0.4) e desvanece (0)
    const opacity = animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0.4, 0],
    });

    return {
      transform: [{ scale }],
      opacity,
    };
  };

  return (
    <View style={pulseStyles.container}>
      <Animated.View
        style={[pulseStyles.pulseCircle, getCircleStyle(pulse1)]}
      />
    </View>
  );
};

// Estilos específicos para o PulseOverlay
const pulseStyles = StyleSheet.create({
  container: {
    // Ocupa 100% da área do pai (.card)
    ...StyleSheet.absoluteFill,
    justifyContent: "center",
    alignItems: "center",
    // ⚠️ Importante: Garante que o pulso fique dentro do card
    overflow: "hidden",
    borderRadius: 12,
  },
  pulseCircle: {
    position: "absolute",
    // Tamanho base para a onda de pulso (grande o suficiente para começar no centro)
    width: 80,
    height: 80,
    borderRadius: 40,
    // Cor do pulso (Amarelo, mas um pouco mais sutil que o fundo do card)
    backgroundColor: "rgba(251, 192, 45, 0.4)", // #fbc02d com opacidade
  },
});
// ==========================================================
// 🛑 Fim do Componente: PulseOverlay
// ==========================================================

export default function RecebendoChamadas({
  onAceitar,
  onRecusar,
  valor = 8.2,
  distanciaAteOrigem,
  distanciaDaCorrida,
  origem,
  destino,
  paradas = 0,
  notaPassageiro,
  corridasPassageiro = 0,
}: RecebendoChamadaProps) {
  const playerRef = useRef<AudioPlayer | null>(null);
  const onRecusarRef = useRef(onRecusar);

  useEffect(() => {
    onRecusarRef.current = onRecusar;
  }, [onRecusar]);
  const [progress] = useState(() => new Animated.Value(1));
  const closedRef = useRef(false); // evita múltiplas chamadas de fechamento

  // Variável para controlar a montagem/desmontagem do PulseOverlay
  // Usaremos um simples state para garantir que a animação seja reiniciada se o componente for remontado.
  const [isPulsing, setIsPulsing] = useState(true);

  useEffect(() => {
    // O React remonta efeitos em desenvolvimento. Reiniciar estas refs evita
    // que a limpeza da primeira montagem deixe a oferta aberta para sempre.
    closedRef.current = false;
    progress.stopAnimation();
    progress.setValue(1);

    // anima barra
    const animacao = Animated.timing(progress, {
      toValue: 0,
      duration: DURACAO_OFERTA_MS,
      easing: Easing.linear,
      useNativeDriver: false,
    });
    animacao.start();

    // 🔹 O loop de pulsação agora é gerido pelo componente PulseOverlay,
    // então removemos a lógica de `pulseAnimationRef` daqui.

    let player: AudioPlayer | null = null;

    try {
      player = createAudioPlayer(require("../../assets/toque-chamada.mp3"));
      playerRef.current = player;

      // o toque é curto: repete enquanto a chamada estiver na tela
      player.loop = true;
      player.play();
    } catch {}

    // quem fecha a chamada é o tempo da barra, não o fim do som
    const expiracao = setTimeout(() => {
      if (closedRef.current) return;

      closedRef.current = true;
      setIsPulsing(false);

      silenciar(player);
      if (playerRef.current === player) playerRef.current = null;

      try {
        onRecusarRef.current();
      } catch {}
    }, DURACAO_OFERTA_MS);

    // cleanup do effect
    return () => {
      closedRef.current = true;
      clearTimeout(expiracao);
      animacao.stop();

      silenciar(player); // para e descarrega o player
      if (playerRef.current === player) playerRef.current = null;
    };
  }, [progress]);

  const pararSom = () => {
    silenciar(playerRef.current);
    playerRef.current = null;
  };

  // função centralizada para fechar + parar/descarregar com proteção
  const closeAndUnload = () => {
    if (closedRef.current) return;
    closedRef.current = true;
    setIsPulsing(false); // Pára o pulso

    try {
      onRecusar(); // fecha o card
    } catch {
      // ignore callback errors
    }

    pararSom();
  };

  const acceptAndUnload = () => {
    // chamado ao aceitar
    if (!closedRef.current) closedRef.current = true;
    setIsPulsing(false); // Pára o pulso

    try {
      onAceitar();
    } catch {
      // swallow
    }

    pararSom();
  };

  const widthInterpolated = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  const emKm = (valorEmKm?: number) =>
    typeof valorEmKm === "number"
      ? `${valorEmKm.toFixed(1).replace(".", ",")} km`
      : "—";

  const emReais = (valorEmReais: number) =>
    `R$ ${valorEmReais.toFixed(2).replace(".", ",")}`;

  const distanciaAteVoce = emKm(distanciaAteOrigem);
  const distanciaViagem = emKm(distanciaDaCorrida);
  const enderecoPartida = origem ?? "Endereço de partida";
  const enderecoDestino = destino ?? "Endereço de destino";

  return (
    <View style={styles.overlay}>
      {/* O card é um View normal, o pulso será um overlay interno */}
      <View style={styles.card}>
        {/* 🚀 O componente de pulso triplo é adicionado aqui, garantindo que ele fique abaixo de todo o conteúdo do card */}
        {isPulsing && <PulseOverlay />}

        <View style={styles.progressContainer}>
          <Animated.View
            style={[styles.progressBar, { width: widthInterpolated }]}
          />
        </View>

        <View style={styles.valorContainer}>
          <Text style={styles.valorText}>{emReais(valor)}</Text>
        </View>

        <View style={styles.infoPagamento}>
          <View style={styles.iconPagamento}>
            <Ionicons name="cash-outline" size={18} color="#fff" />
          </View>
          <Text className="ml-2 mt-1" style={styles.topText}>
            {`${distanciaViagem} · ${emKm(distanciaAteOrigem)} até a partida`}
          </Text>
        </View>

        <View style={styles.perfilInfoContainer}>
          {typeof notaPassageiro === "number" ? (
            <>
              <View style={styles.infoItem}>
                <Ionicons
                  className="ml-4"
                  name="star"
                  size={20}
                  color="#FFD700"
                />
                <Text className="ml-2 font-bold" style={styles.infoText}>
                  {notaPassageiro.toFixed(2).replace(".", ",")}
                </Text>
              </View>

              <Text style={styles.dot}>•</Text>
            </>
          ) : null}

          <View style={styles.infoItem}>
            <Text className="font-bold" style={styles.infoText}>
              {corridasPassageiro === 0
                ? "Primeira corrida"
                : `${corridasPassageiro} ${corridasPassageiro === 1 ? "corrida" : "corridas"}`}
            </Text>
          </View>
        </View>

        <View style={styles.separador} />

        {/* INFO: tempo / distância / endereços */}
        <View style={styles.infoContainer}>
          {/* ✅ Row com o badge ao lado do tempo */}
          <View style={styles.infoRow}>
            <View style={[styles.badge, styles.badgeCorInicial]}>
              <Text style={styles.badgeText}>A</Text>
            </View>
            <Text style={styles.infoTempoKm}>{distanciaAteVoce} até você</Text>
          </View>

          {/* Endereço de partida (linha abaixo do tempo) */}
          <View style={styles.infoRow}>
            <Ionicons name="arrow-down-outline" size={18} color="white" />
            <Text className="ml-3" style={styles.infoText}>
              {enderecoPartida}
            </Text>
          </View>

          {/* espaço entre os dois blocos de tempo/endereço */}
          <View style={{ height: 2 }} />

          {/* Segundo tempo/distância + destino */}
          <View style={styles.infoRow}>
            <View style={[styles.badge, styles.badgeCorFinal]}>
              <Text style={styles.badgeText}>B</Text>
            </View>
            <Text style={[styles.infoTempoKm, { marginTop: 0 }]}>
              {distanciaViagem} de viagem
              {paradas > 0
                ? ` · ${paradas} ${paradas === 1 ? "parada" : "paradas"}`
                : ""}
            </Text>
          </View>
          <Text className="ml-8" style={styles.infoText}>
            {enderecoDestino}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.btnAceitar}
          onPress={() => {
            // aceita e para o som
            acceptAndUnload();
          }}
        >
          <Text style={styles.btnAceitarText}>
            {`Aceitar por ${emReais(valor)}`}
          </Text>
        </TouchableOpacity>

        {/* aqui deve ficar o componente NegociarChamada */}
        <NegociarChamada
          valorBase={valor}
          onValorEscolhido={(novoValor) => {
            console.log("Valor negociado escolhido:", novoValor);
            // Aqui você pode atualizar o estado ou chamar outra ação
          }}
        />

        <TouchableOpacity
          style={styles.recusarBtn}
          onPress={() => {
            closeAndUnload();
          }}
        >
          <Text style={styles.recusarText}>Recusar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 12,
    zIndex: 9999,
    elevation: 9999,
  },
  card: {
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    width: "94%",
    paddingVertical: 16,
    paddingHorizontal: 20,
    // Adicionar position: 'relative' para que o PulseOverlay use absoluteFillObject corretamente
    position: "relative",
  },
  progressContainer: {
    height: 3,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 10,
    // Garante que a barra de progresso esteja acima do pulso
    zIndex: 2,
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#fbc02d",
  },
  topText: {
    color: "white",
    fontSize: 16,
    marginBottom: 8,
    fontWeight: "bold",
    alignItems: "center",
    justifyContent: "center",
    // Garante que o texto esteja acima do pulso
    zIndex: 2,
  },
  valorContainer: {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    // Garante que o valor esteja acima do pulso
    zIndex: 2,
  },
  valorText: {
    color: "#fff",
    fontSize: 50,
    fontWeight: "600",
    // Garante que o valor esteja acima do pulso
    zIndex: 2,
  },
  valorKm: {
    color: "#ccc",
    fontSize: 14,
    marginTop: 2,
    // Garante que o texto esteja acima do pulso
    zIndex: 2,
  },
  infoContainer: {
    marginVertical: 14,
    flexDirection: "column",
    paddingHorizontal: 12,
    // Garante que o bloco de informações esteja acima do pulso
    zIndex: 2,
  },
  infoTempoKm: {
    color: "#fff",
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "bold",
  },
  infoText: {
    color: "#fff",
    fontSize: 16,
    lineHeight: 20,
  },
  btnAceitar: {
    backgroundColor: "#fbc02d",
    paddingVertical: 14,
    borderRadius: 50,
    alignItems: "center",
    marginBottom: 14,
    // Garante que o botão Aceitar esteja acima do pulso
    zIndex: 2,
  },
  btnAceitarText: {
    color: "#111",
    fontWeight: "600",
    fontSize: 16,
  },
  footerButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    // Garante que os botões de rodapé estejam acima do pulso
    zIndex: 2,
  },
  footerButton: {
    flex: 1,
    backgroundColor: "#3b3b3b",
    paddingVertical: 10,
    marginHorizontal: 3,
    borderRadius: 8,
  },
  footerButtonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "600",
  },
  recusarBtn: {
    alignItems: "center",
    marginTop: 10,
    // Garante que o botão Recusar esteja acima do pulso
    zIndex: 2,
  },
  recusarText: {
    color: "#ccc",
    fontSize: 14,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  badge: {
    width: 22,
    height: 22,
    borderRadius: 11, // metade do tamanho = círculo perfeito
    justifyContent: "center",
    alignItems: "center",
    marginRight: 6,
  },
  badgeCorInicial: {
    backgroundColor: "#4CAF50",
  },
  badgeCorFinal: {
    backgroundColor: "red",
  },
  badgeText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 13,
  },
  infoPagamento: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    // Garante que o info de pagamento esteja acima do pulso
    zIndex: 2,
  },
  iconPagamento: {
    backgroundColor: "#2ecc71",
    paddingHorizontal: 6, // deixa mais largo
    height: 20, // um pouco mais alto
    borderRadius: 6, // arredondamento suave
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  perfilInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    justifyContent: "center",
    // Garante que o info de perfil esteja acima do pulso
    zIndex: 2,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  dot: {
    color: "#aaa",
    marginHorizontal: 6,
  },
  badgePerfil: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2979ff",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  separador: {
    height: 1,
    backgroundColor: "#444",
    marginVertical: 10,
    marginHorizontal: 20,
    borderRadius: 1,
    opacity: 0.6,
    // Garante que o separador esteja acima do pulso
    zIndex: 2,
  },
});
