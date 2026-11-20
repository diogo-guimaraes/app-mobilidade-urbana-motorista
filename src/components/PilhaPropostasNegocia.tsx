import { textoDeCorridasDoPassageiro } from "@/domain/reputacaoPassageiro";
import { Text } from "@/components/common/Texto";
import { enderecoCurto } from "@/domain/endereco";
import { emDistancia } from "@/domain/negocia";
import type { OfertaCorrida } from "@/hooks/useDespachoMotorista";
import { extrasDaCorrida, useEstilos, type CoresDoTema } from "@/theme/tema";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// validade da proposta no backend (precificacao.negocia_proposta_validade_segundos)
const VALIDADE_PADRAO_MS = 20_000;
const DURACAO_ENTRADA_MS = 280;
const DURACAO_SAIDA_MS = 240;
// o loading entre a contagem e a mensagem de recusa
const TROCA_DO_TEXTO_MS = 900;
// a pilha começa logo abaixo do menu e do saldo do topo
const DISTANCIA_DO_TOPO = 68;

interface Item {
  oferta: OfertaCorrida;
  saindo: boolean;
}

const emReais = (valor: number | string | null | undefined) => {
  const numero = Number(valor);
  return Number.isFinite(numero)
    ? `R$ ${numero.toFixed(2).replace(".", ",")}`
    : "";
};

// quem já está na tela não muda de lugar (quem sumiu sai com fade ali mesmo)
// e as propostas novas entram embaixo, na ordem em que foram mandadas
const mesclar = (atuais: Item[], propostas: OfertaCorrida[]): Item[] => {
  const porCorrida = new Map(propostas.map((p) => [p.corrida_id, p]));
  const naTela = new Set(atuais.map((item) => item.oferta.corrida_id));

  return [
    ...atuais.map((item) => {
      const oferta = porCorrida.get(item.oferta.corrida_id);
      return oferta ? { oferta, saindo: false } : { ...item, saindo: true };
    }),
    ...propostas
      .filter((oferta) => !naTela.has(oferta.corrida_id))
      .map((oferta) => ({ oferta, saindo: false })),
  ];
};

function CartaoAguardando({
  item,
  compacto,
  onSaiu,
}: {
  item: Item;
  // com a chamada da vez na tela, só o essencial para caber mais de um
  compacto: boolean;
  onSaiu: (corridaId: number) => void;
}) {
  const estilos = useEstiloDaPilha();
  const { oferta, saindo } = item;
  // o prazo vem de quanto falta (servidor), igual ao do passageiro; sem isso,
  // do horário de vencimento
  const expiraEm =
    oferta.minha_proposta?.vence_em_local ??
    (oferta.minha_proposta?.expira_em
      ? new Date(oferta.minha_proposta.expira_em).getTime()
      : null);
  const validadeMs =
    (oferta.minha_proposta?.validade_segundos ?? 0) * 1000 ||
    VALIDADE_PADRAO_MS;
  const [opacidade] = useState(() => new Animated.Value(0));
  const [deslocamento] = useState(() => new Animated.Value(-10));
  const [progresso] = useState(() => new Animated.Value(0));
  const [largura, setLargura] = useState(0);
  const [agora, setAgora] = useState(() => Date.now());
  // o passageiro recusou: a contagem dá lugar a um loading rápido e, depois, à
  // mensagem
  const recusada = oferta.minha_proposta?.status === "recusada";
  const [fase, setFase] = useState<"espera" | "carregando" | "mensagem">(
    recusada ? "mensagem" : "espera",
  );

  useEffect(() => {
    if (!recusada) {
      setFase("espera");

      return;
    }

    setFase("carregando");
    const mostrar = setTimeout(() => setFase("mensagem"), TROCA_DO_TEXTO_MS);

    return () => clearTimeout(mostrar);
  }, [recusada]);

  useEffect(() => {
    const relogio = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(relogio);
  }, []);

  useEffect(() => {
    const animacao = Animated.parallel([
      Animated.timing(opacidade, {
        toValue: saindo ? 0 : 1,
        duration: saindo ? DURACAO_SAIDA_MS : DURACAO_ENTRADA_MS,
        easing: saindo ? Easing.in(Easing.quad) : Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(deslocamento, {
        toValue: saindo ? -6 : 0,
        duration: saindo ? DURACAO_SAIDA_MS : DURACAO_ENTRADA_MS,
        easing: saindo ? Easing.in(Easing.quad) : Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);

    animacao.start(({ finished }) => {
      if (finished && saindo) onSaiu(oferta.corrida_id);
    });

    return () => animacao.stop();
  }, [saindo, oferta.corrida_id, opacidade, deslocamento, onSaiu]);

  // a faixa amarela esvazia até o fim do prazo, como o Aceitar do passageiro
  useEffect(() => {
    if (saindo || largura === 0 || expiraEm === null) return;

    const restante = Math.max(0, expiraEm - Date.now());
    progresso.setValue(Math.min(1, Math.max(0, 1 - restante / validadeMs)));
    const contagem = Animated.timing(progresso, {
      toValue: 1,
      duration: restante,
      easing: Easing.linear,
      useNativeDriver: true,
    });
    contagem.start();

    return () => contagem.stop();
  }, [saindo, largura, expiraEm, validadeMs, progresso]);

  const segundos =
    expiraEm === null
      ? null
      : Math.max(0, Math.round((expiraEm - agora) / 1000));
  const valor = emReais(
    oferta.minha_proposta?.valor_motorista ?? oferta.valor_motorista,
  );
  const reputacao =
    typeof oferta.passageiro_nota === "number"
      ? `★${oferta.passageiro_nota.toFixed(1).replace(".", ",")} · `
      : "";
  const corridas = textoDeCorridasDoPassageiro(
    oferta.passageiro_corridas,
    oferta.passageiro_novo,
  );

  return (
    <Animated.View
      style={[
        estilos.cartao,
        { opacity: opacidade, transform: [{ translateY: deslocamento }] },
      ]}
      accessible
      accessibilityLabel={`Proposta de ${valor} esperando o passageiro${segundos !== null ? `, ${segundos} segundos` : ""}. Embarque em ${enderecoCurto(oferta.origem)}`}
    >
      <View style={estilos.topo}>
        <Text style={estilos.categoria} numberOfLines={1}>
          {oferta.categoria ?? "Negocia"}
        </Text>
        <Text style={estilos.valor}>{valor}</Text>
      </View>

      {!compacto && (
        <View style={estilos.passageiroLinha}>
          <View style={estilos.foto}>
            <Ionicons name="person" size={20} color="#9AA1AB" />
          </View>
          <View style={estilos.dados}>
            <Text style={estilos.reputacao} numberOfLines={1}>
              {reputacao}
              {corridas}
            </Text>
            <Text style={estilos.endereco} numberOfLines={1}>
              {enderecoCurto(oferta.origem)}
            </Text>
          </View>
          <View style={estilos.distancias}>
            <Text style={estilos.distancia}>
              {emDistancia(oferta.distancia_ate_origem_km)}
            </Text>
            <Text style={estilos.viagem}>
              {emDistancia(oferta.distancia_corrida_km)} de viagem
            </Text>
          </View>
        </View>
      )}

      {fase !== "espera" ? (
        <View style={estilos.recusou}>
          {fase === "carregando" ? (
            <ActivityIndicator color="#B42318" />
          ) : (
            <Text style={estilos.recusouTexto}>
              O passageiro recusou a sua oferta
            </Text>
          )}
        </View>
      ) : (
        <View
          style={estilos.aguardando}
          onLayout={({ nativeEvent }) => setLargura(nativeEvent.layout.width)}
        >
          <Animated.View
            pointerEvents="none"
            style={[
              estilos.preenchimento,
              {
                transform: [
                  {
                    translateX: progresso.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -largura],
                    }),
                  },
                ],
              },
            ]}
          />
          <Text style={estilos.aguardandoTexto}>
            Aguardando o passageiro
            {segundos !== null ? ` · ${segundos}s` : ""}
          </Text>
        </View>
      )}
    </Animated.View>
  );
}

// Negocia: propostas mandadas esperando o passageiro escolher, empilhadas no
// topo como os cartões do passageiro (a mais antiga em cima)
export default function PilhaPropostasNegocia({
  propostas,
  chamadaNaTela,
}: {
  propostas: OfertaCorrida[];
  // com a chamada da vez embaixo, a pilha para antes dela
  chamadaNaTela: boolean;
}) {
  const estilos = useEstiloDaPilha();
  const insets = useSafeAreaInsets();
  const { height: alturaTela } = useWindowDimensions();
  const [anteriores, setAnteriores] = useState(propostas);
  const [itens, setItens] = useState<Item[]>(() => mesclar([], propostas));

  if (anteriores !== propostas) {
    setAnteriores(propostas);
    setItens(mesclar(itens, propostas));
  }

  const [remover] = useState(
    () => (corridaId: number) =>
      setItens((atuais) =>
        atuais.filter((item) => item.oferta.corrida_id !== corridaId),
      ),
  );

  if (itens.length === 0) return null;

  const topo = insets.top + DISTANCIA_DO_TOPO;
  const alturaMaxima = alturaTela * (chamadaNaTela ? 0.4 : 0.62) - topo;

  return (
    <View
      pointerEvents="box-none"
      style={[estilos.container, { top: topo }]}
      accessibilityLiveRegion="polite"
    >
      <ScrollView
        style={{ maxHeight: Math.max(160, alturaMaxima) }}
        contentContainerStyle={estilos.lista}
        showsVerticalScrollIndicator={false}
      >
        {itens.map((item) => (
          <CartaoAguardando
            key={item.oferta.corrida_id}
            item={item}
            compacto={chamadaNaTela}
            onSaiu={remover}
          />
        ))}
      </ScrollView>
    </View>
  );
}

// no escuro o cartão vira o painel do tema; a barra amarela "Aguardando o
// passageiro" (com texto escuro) continua igual nos dois temas
const extrasDaPilha = (cores: CoresDoTema) => ({
  ...extrasDaCorrida(cores),
  "#eceef1": cores.item,
  // nota e endereço do passageiro: cinza escuro no claro, legível no escuro
  "color:#3c4043": cores.texto,
});

function useEstiloDaPilha() {
  const tema = useEstilos(styles, extrasDaPilha);

  return {
    ...tema,
    aguardando: styles.aguardando,
    preenchimento: styles.preenchimento,
    aguardandoTexto: styles.aguardandoTexto,
  };
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 14,
    right: 14,
    zIndex: 8,
    elevation: 8,
  },
  lista: { gap: 10, paddingBottom: 4 },
  cartao: {
    borderRadius: 20,
    backgroundColor: "#FFF",
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 14,
    gap: 10,
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  topo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  categoria: {
    flexShrink: 1,
    color: "#5F6368",
    fontSize: 15,
    fontWeight: "600",
  },
  valor: { fontSize: 25, fontWeight: "900", color: "#111" },
  passageiroLinha: { flexDirection: "row", alignItems: "center", gap: 10 },
  foto: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ECEEF1",
    alignItems: "center",
    justifyContent: "center",
  },
  dados: { flex: 1, minWidth: 0, gap: 1 },
  reputacao: { fontSize: 14, color: "#3C4043" },
  endereco: { fontSize: 14, color: "#3C4043" },
  distancias: {
    alignItems: "flex-end",
    alignSelf: "flex-start",
    paddingTop: 2,
  },
  distancia: { color: "#111", fontSize: 14, fontWeight: "800" },
  viagem: { color: "#5F6368", fontSize: 12 },
  aguardando: {
    minHeight: 42,
    borderRadius: 8,
    backgroundColor: "#FFE57A",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  preenchimento: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "#FFD000",
  },
  aguardandoTexto: { fontSize: 15, fontWeight: "800", color: "#111" },
  // o passageiro recusou a oferta: faixa avermelhada no lugar da amarela
  recusou: {
    minHeight: 42,
    borderRadius: 8,
    backgroundColor: "#FDECEA",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  recusouTexto: { fontSize: 15, fontWeight: "800", color: "#B42318" },
});
