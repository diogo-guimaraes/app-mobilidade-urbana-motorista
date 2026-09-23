// Navegação turn-by-turn no estilo 99 (banner de manobra, ponto no mapa com
// direção, velocímetro, ETA). Só entra em cena depois que o motorista dá
// "Iniciar corrida" (status em_andamento) — antes disso (a caminho do
// embarque, aguardando o passageiro) a tela continua sendo o
// CorridaEmAndamento de sempre. Tudo abaixo funciona de verdade (rota real
// via Google Directions, posição/velocidade reais do GPS). Duas coisas do
// espelho do 99 ficaram de fora por dependerem de trabalho maior, sem ter
// pra onde "fingir" no frontend:
// - Voz guiando as manobras (precisa de TTS + lógica de quando anunciar).
// - "Confirmar parada" pra corrida com parada intermediária: o modelo de
//   dados da corrida hoje não tem parada — só origem e destino.
import BotaoDeslizar from "@/components/BotaoDeslizar";
import { Text } from "@/components/common/Texto";
import type { AcaoCorrida, PassageiroDaCorrida } from "@/components/CorridaEmAndamento";
import {
  anguloDaManobra,
  formatarDistancia,
  formatarHorario,
} from "@/domain/navegacao";
import type { Coordenada } from "@/domain/rotaDaCorrida";
import { useNavegacaoDaCorrida } from "@/hooks/useNavegacaoDaCorrida";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  Alert,
  Image,
  Linking,
  Share,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, {
  Marker,
  Polyline,
  PROVIDER_GOOGLE,
  UserLocationChangeEvent,
} from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Props {
  codigoCorrida: string;
  alvo: Coordenada | null;
  enderecoAlvo?: string | null;
  passageiro?: PassageiroDaCorrida | null;
  metodoPagamento?: string | null;
  minutos?: number | null;
  distanciaKm?: number | null;
  ocupado?: boolean;
  onAvancar: (acao: AcaoCorrida) => void;
}

const PASSO = { acao: "finalizar" as AcaoCorrida, rotulo: "Finalizar corrida", cor: "#2F6BFF" };

const ROTULO_PAGAMENTO: Record<string, string> = {
  dinheiro: "dinheiro",
  cartao: "cartão",
  pix: "Pix",
};

// distância no traçado até achar o ponto mais próximo da posição atual —
// o resto da polyline (o que já foi percorrido) não é desenhado
function trecoRestante(polyline: Coordenada[], posicao: Coordenada | null) {
  if (!posicao || polyline.length < 2) return polyline;

  let indiceMaisProximo = 0;
  let menorDistancia = Infinity;

  polyline.forEach((ponto, indice) => {
    const d =
      (ponto.latitude - posicao.latitude) ** 2 +
      (ponto.longitude - posicao.longitude) ** 2;
    if (d < menorDistancia) {
      menorDistancia = d;
      indiceMaisProximo = indice;
    }
  });

  return polyline.slice(indiceMaisProximo);
}

export default function NavegacaoAtiva({
  codigoCorrida,
  alvo,
  enderecoAlvo,
  passageiro,
  metodoPagamento,
  minutos,
  distanciaKm,
  ocupado = false,
  onAvancar,
}: Props) {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const primeiraPosicao = useRef(true);
  const [posicao, setPosicao] = useState<Coordenada | null>(null);
  const [heading, setHeading] = useState(0);
  const [velocidadeKmh, setVelocidadeKmh] = useState<number | null>(null);
  // a folha varia de altura (contador de espera, chip de pagamento...), então
  // o velocímetro e os botões laterais acompanham a altura medida de verdade
  // em vez de um valor fixo — senão ou sobra vão embaixo da folha ou fica
  // um vão grande quando ela é mais baixa
  const [alturaFolha, setAlturaFolha] = useState(0);
  const [navegando, setNavegando] = useState(false);

  const { rota, passoAtual, distanciaAteManobra } = useNavegacaoDaCorrida(
    alvo,
    posicao,
  );

  const onUserLocationChange = useCallback((event: UserLocationChangeEvent) => {
    const { coordinate } = event.nativeEvent;
    if (!coordinate) return;

    const nova = {
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
    };
    setPosicao(nova);

    const novoHeading =
      typeof coordinate.heading === "number" && coordinate.heading >= 0
        ? coordinate.heading
        : undefined;
    if (novoHeading !== undefined) setHeading(novoHeading);

    setVelocidadeKmh(
      typeof coordinate.speed === "number" && coordinate.speed >= 0
        ? coordinate.speed * 3.6
        : null,
    );

    mapRef.current?.animateCamera(
      {
        center: nova,
        heading: novoHeading ?? heading,
        pitch: 55,
        zoom: 18,
      },
      { duration: primeiraPosicao.current ? 0 : 600 },
    );
    primeiraPosicao.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const polylineRestante = useMemo(
    () => trecoRestante(rota?.polyline ?? [], posicao),
    [rota, posicao],
  );

  const distanciaTexto = useMemo(() => {
    const metros = rota?.distancia_m ?? (distanciaKm ? distanciaKm * 1000 : null);
    return metros !== null ? formatarDistancia(metros) : "--";
  }, [rota, distanciaKm]);

  const minutosRestantes = useMemo(() => {
    if (rota?.duracao_s) return Math.max(1, Math.round(rota.duracao_s / 60));
    return typeof minutos === "number" ? minutos : null;
  }, [rota, minutos]);

  const horarioChegada = useMemo(() => {
    if (minutosRestantes === null) return null;
    return formatarHorario(new Date(Date.now() + minutosRestantes * 60_000));
  }, [minutosRestantes]);

  const ligar = () => {
    if (!passageiro?.telefone) return;
    Linking.openURL(`tel:${passageiro.telefone.replace(/\D/g, "")}`);
  };

  // funcional: abre o compartilhamento nativo do aparelho com uma mensagem
  // real. FALTA pra chegar no nível do 99 (link de rastreamento ao vivo,
  // clicável, mostrando a corrida em tempo real pra quem recebe): um
  // endpoint público (sem login) que exponha a posição da corrida por um
  // token da própria corrida — isso ainda não existe no backend.
  const compartilhar = () => {
    void Share.share({
      message: `Estou a caminho na corrida ${codigoCorrida}. Acompanhe pelo app.`,
    });
  };

  // funcional: mostra os telefones de emergência reais. FALTA pra chegar no
  // nível do 99 (gravação da corrida, notificar contato de confiança com a
  // localização ao vivo): infraestrutura de gravação/consentimento e o
  // mesmo endpoint público de rastreamento citado acima em compartilhar().
  const abrirSeguranca = () => {
    Alert.alert(
      "Central de segurança",
      "Em caso de emergência, ligue para 190 (Polícia) ou 192 (SAMU).",
    );
  };

  return (
    <View style={styles.tela}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider={PROVIDER_GOOGLE}
        showsUserLocation
        followsUserLocation={false}
        showsMyLocationButton={false}
        onUserLocationChange={onUserLocationChange}
      >
        {polylineRestante.length > 1 && (
          <Polyline
            coordinates={polylineRestante}
            strokeColor="#17A673"
            strokeWidth={6}
          />
        )}
        {alvo && (
          <Marker coordinate={alvo} anchor={{ x: 0.5, y: 1 }}>
            <Ionicons name="flag" size={32} color="#D32F2F" />
          </Marker>
        )}
      </MapView>

      {/* TOPO: banner de manobra + pill de destino */}
      <View style={[styles.topo, { top: insets.top + 10 }]}>
        {navegando && passoAtual && (
          <TouchableOpacity
            style={styles.bannerManobra}
            onPress={() => setNavegando(false)}
            activeOpacity={0.85}
          >
            <View style={styles.setaCirculo}>
              <Ionicons
                name="arrow-up"
                size={30}
                color="#FFF"
                style={{
                  transform: [
                    { rotate: `${anguloDaManobra(passoAtual.manobra)}deg` },
                  ],
                }}
              />
            </View>
            <View style={styles.bannerTextos}>
              <Text style={styles.bannerDistancia}>
                {formatarDistancia(distanciaAteManobra ?? passoAtual.distancia_m)}
              </Text>
              <Text numberOfLines={1} style={styles.bannerRua}>
                {passoAtual.rua ?? passoAtual.instrucao}
              </Text>
            </View>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.pillDestino}
          activeOpacity={0.85}
          onPress={() => (navegando ? setNavegando(false) : setNavegando(true))}
        >
          <View style={styles.pillLinha}>
            <View style={[styles.pontoCor, { backgroundColor: "#E53935" }]} />
            <Text numberOfLines={2} style={styles.pillTexto}>
              {enderecoAlvo ?? "Endereço não informado"}
            </Text>
          </View>

          {!navegando && (
            <>
              <View style={styles.pillDivisor} />
              <View style={styles.pillIrLinha}>
                <Ionicons name="chevron-up" size={16} color="#FFF" />
                <Text style={styles.pillIrTexto}>Ir</Text>
              </View>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* velocímetro */}
      <View style={[styles.velocidade, { bottom: alturaFolha + 16 }]}>
        <Text style={styles.velocidadeValor}>
          {velocidadeKmh !== null ? Math.round(velocidadeKmh) : "--"}
        </Text>
        <Text style={styles.velocidadeUnidade}>km/h</Text>
      </View>

      {/* ícones de segurança e compartilhar */}
      <View style={[styles.acoesLaterais, { bottom: alturaFolha + 16 }]}>
        <TouchableOpacity style={styles.botaoRedondo} onPress={abrirSeguranca}>
          <Ionicons name="shield-checkmark-outline" size={22} color="#111" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.botaoRedondo} onPress={compartilhar}>
          <Feather name="share-2" size={20} color="#111" />
        </TouchableOpacity>
      </View>

      {/* FOLHA INFERIOR */}
      <View
        style={[styles.folha, { paddingBottom: insets.bottom + 16 }]}
        onLayout={({ nativeEvent }) => setAlturaFolha(nativeEvent.layout.height)}
      >
        <View style={styles.puxador} />

        <View style={styles.resumoLinha}>
          <Text style={styles.resumoTexto}>
            {minutosRestantes !== null ? `${minutosRestantes} min` : "-- min"}
            {" · "}
            {distanciaTexto}
          </Text>
          {horarioChegada && (
            <Text style={styles.resumoChegada}>
              Chegada prevista: {horarioChegada}
            </Text>
          )}
        </View>

        {metodoPagamento && (
          <View style={styles.chipPagamento}>
            <Ionicons name="cash-outline" size={14} color="#1959B3" />
            <Text style={styles.chipPagamentoTexto}>
              Corrida em {ROTULO_PAGAMENTO[metodoPagamento] ?? metodoPagamento}
            </Text>
          </View>
        )}

        <View style={styles.separador} />

        <View style={styles.linhaPassageiro}>
          {passageiro?.foto && !passageiro.foto_oculta ? (
            <Image source={{ uri: passageiro.foto }} style={styles.avatar} />
          ) : (
            <View
              style={[
                styles.avatar,
                styles.avatarVazio,
                passageiro?.foto_oculta && styles.avatarProtegido,
              ]}
            >
              <Feather name="user" size={20} color="#888" />
            </View>
          )}

          <View style={styles.passageiroBloco}>
            <Text style={styles.passageiroNome}>
              {passageiro?.nome ?? "Passageiro"}
            </Text>
            <Text style={styles.passageiroApoio}>
              {passageiro?.foto_oculta ? "Foto protegida até sua chegada · " : ""}
              {typeof passageiro?.nota === "number"
                ? `★ ${passageiro.nota.toFixed(2).replace(".", ",")} · `
                : ""}
              {(passageiro?.corridas ?? 0) === 0
                ? "Primeira corrida"
                : `${passageiro?.corridas} ${passageiro?.corridas === 1 ? "corrida" : "corridas"}`}
            </Text>
          </View>

          {passageiro?.telefone ? (
            <TouchableOpacity style={styles.botaoLigar} onPress={ligar}>
              <Feather name="phone" size={20} color="#000" />
            </TouchableOpacity>
          ) : null}
        </View>

        <BotaoDeslizar
          rotulo={PASSO.rotulo}
          cor={PASSO.cor}
          desabilitado={ocupado}
          onConfirmar={() => onAvancar(PASSO.acao)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // cobre o mapa/menu de fora por cima: sem isso o TopMenu e os botões do
  // Map por trás (zIndex até 30) apareciam por cima da navegação
  tela: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#E5E3DF",
    zIndex: 100,
    elevation: 100,
  },
  topo: {
    position: "absolute",
    left: 16,
    right: 16,
    gap: 8,
  },
  bannerManobra: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#1C1C1E",
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    elevation: 6,
  },
  setaCirculo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#2F6BFF",
    alignItems: "center",
    justifyContent: "center",
  },
  bannerTextos: { flex: 1 },
  bannerDistancia: { color: "#FFF", fontSize: 22, fontWeight: "700" },
  bannerRua: { color: "#D5D9DE", fontSize: 14, marginTop: 2 },
  pillDestino: {
    backgroundColor: "#1C1C1E",
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 16,
    elevation: 6,
  },
  pillLinha: { flexDirection: "row", alignItems: "center", gap: 10 },
  pontoCor: { width: 10, height: 10, borderRadius: 5 },
  pillTexto: { flex: 1, color: "#FFF", fontSize: 14, fontWeight: "600" },
  pillDivisor: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.15)",
    marginVertical: 10,
  },
  pillIrLinha: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4 },
  pillIrTexto: { color: "#FFF", fontSize: 15, fontWeight: "700" },
  velocidade: {
    position: "absolute",
    left: 16,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
  },
  velocidadeValor: { color: "#FFF", fontSize: 18, fontWeight: "700" },
  velocidadeUnidade: { color: "#AAA", fontSize: 9 },
  acoesLaterais: {
    position: "absolute",
    right: 16,
    gap: 10,
  },
  botaoRedondo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },
  folha: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#FFF",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 20,
    paddingTop: 10,
    gap: 12,
    elevation: 10,
  },
  puxador: {
    alignSelf: "center",
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#DDD",
  },
  resumoLinha: { gap: 2 },
  resumoTexto: { fontSize: 18, fontWeight: "700", color: "#000" },
  resumoChegada: { fontSize: 13, fontWeight: "600", color: "#B26A00" },
  chipPagamento: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: "#EAF2FE",
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  chipPagamentoTexto: { color: "#1959B3", fontSize: 13, fontWeight: "600" },
  separador: { height: 1, backgroundColor: "#EEE" },
  linhaPassageiro: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 42, height: 42, borderRadius: 21 },
  avatarVazio: {
    backgroundColor: "#F0F0F0",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarProtegido: { opacity: 0.55, backgroundColor: "#D8D8D8" },
  passageiroBloco: { flex: 1 },
  passageiroNome: { fontSize: 16, fontWeight: "600", color: "#000" },
  passageiroApoio: { fontSize: 13, color: "#777", marginTop: 2 },
  botaoLigar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F3F3F3",
    alignItems: "center",
    justifyContent: "center",
  },
});
