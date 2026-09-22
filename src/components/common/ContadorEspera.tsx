import { Text } from "@/components/common/Texto";
import {
  PerspectivaEspera,
  ResumoEspera,
  calcularContadorEspera,
} from "@/domain/contadorEspera";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

interface Props {
  espera: ResumoEspera;
  perspectiva: PerspectivaEspera;
  onCancelarNaoComparecimento?: () => void;
}

const formatarValor = (valor: number) =>
  `R$ ${valor.toFixed(2).replace(".", ",")}`;

export default function ContadorEspera({
  espera,
  perspectiva,
  onCancelarNaoComparecimento,
}: Props) {
  const [relogio, setRelogio] = useState({
    calculadoEm: espera.calculado_em,
    segundos: 0,
  });

  useEffect(() => {
    const inicio = performance.now();
    const segundosAteLimite = Math.max(
      espera.tolerancia_segundos +
        espera.limite_cobranca_segundos -
        espera.segundos_decorridos,
      0,
    );

    if (segundosAteLimite === 0) return;

    const intervalo = setInterval(() => {
      const segundos = Math.min(
        (performance.now() - inicio) / 1000,
        segundosAteLimite,
      );
      setRelogio({ calculadoEm: espera.calculado_em, segundos });

      if (segundos >= segundosAteLimite) clearInterval(intervalo);
    }, 1000);

    return () => clearInterval(intervalo);
  }, [
    espera.calculado_em,
    espera.limite_cobranca_segundos,
    espera.segundos_decorridos,
    espera.tolerancia_segundos,
  ]);

  const segundosDesdeResumo =
    relogio.calculadoEm === espera.calculado_em ? relogio.segundos : 0;
  const contador = calcularContadorEspera(
    espera,
    segundosDesdeResumo,
    perspectiva,
  );
  // aviso de cobrança: a família amarela inteira, com a severidade indo do
  // tom mais claro (tolerância, ainda gratuita) ao mais fechado (limite
  // atingido). Amarelo puro no texto não tem contraste suficiente sobre
  // fundo claro, por isso o texto usa âmbar escuro.
  const paleta =
    contador.fase === "tolerancia"
      ? { frente: "#B45309", fundo: "#FFFBEB", borda: "#FCD34D" }
      : contador.fase === "limite"
        ? { frente: "#92400E", fundo: "#FDE68A", borda: "#D97706" }
        : { frente: "#B45309", fundo: "#FEF3C7", borda: "#F59E0B" };

  const cor = paleta.frente;

  return (
    <View
      style={[
        styles.container,
        { borderColor: paleta.borda, backgroundColor: paleta.fundo },
      ]}
    >
      <View style={styles.topo}>
        <Ionicons name="timer-outline" size={21} color={cor} />
        <View style={styles.textos}>
          <Text style={[styles.rotulo, { color: cor }]}>{contador.rotulo}</Text>
          <Text style={styles.apoio}>{contador.apoio}</Text>
        </View>
        <Text style={[styles.tempo, { color: cor }]}>{contador.tempo}</Text>
      </View>

      {contador.fase !== "tolerancia" ? (
        <View style={styles.valorLinha}>
          <Text style={styles.valorRotulo}>
            {perspectiva === "motorista"
              ? "Acréscimo do motorista"
              : "Taxa de espera até agora"}
          </Text>
          <Text style={[styles.valor, { color: cor }]}>
            {formatarValor(contador.valor)}
          </Text>
        </View>
      ) : null}
      {perspectiva === "motorista" && onCancelarNaoComparecimento ? (
        <TouchableOpacity
          disabled={espera.segundos_decorridos + segundosDesdeResumo < 180}
          onPress={onCancelarNaoComparecimento}
          style={styles.botaoAusencia}
        >
          <Text style={styles.textoAusencia}>
            {espera.segundos_decorridos + segundosDesdeResumo < 180
              ? "Cancelamento por ausência após 3 minutos"
              : "Passageiro não apareceu"}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  botaoAusencia: {
    alignSelf: "center",
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  textoAusencia: {
    color: "#A53232",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  container: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#FAFAFA",
  },
  topo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  textos: {
    flex: 1,
  },
  rotulo: {
    fontSize: 14,
    fontWeight: "700",
  },
  apoio: {
    fontSize: 11,
    color: "#666",
    marginTop: 2,
  },
  tempo: {
    fontSize: 21,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  valorLinha: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
    marginTop: 10,
    paddingTop: 9,
  },
  valorRotulo: {
    color: "#555",
    fontSize: 12,
  },
  valor: {
    fontSize: 15,
    fontWeight: "700",
  },
});
