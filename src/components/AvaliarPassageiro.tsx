import { CorridaParaAvaliar } from "@/hooks/useAvaliacaoPendente";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Text, TextInput } from "@/components/common/Texto";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Props {
  corrida: CorridaParaAvaliar;
  enviando: boolean;
  onAvaliar: (nota: number, comentario?: string) => void;
  onDispensar: () => void;
}

const ESTRELAS = [1, 2, 3, 4, 5];

const formatarValor = (valor?: string | number | null) => {
  const numero = typeof valor === "string" ? Number(valor) : valor;

  if (numero === null || numero === undefined || Number.isNaN(numero)) {
    return null;
  }

  return `R$ ${numero.toFixed(2).replace(".", ",")}`;
};

const formatarKm = (valor?: string | number | null) => {
  const numero = typeof valor === "string" ? Number(valor) : valor;

  if (numero === null || numero === undefined || Number.isNaN(numero)) {
    return null;
  }

  return `${numero.toFixed(1).replace(".", ",")} km`;
};

export default function AvaliarPassageiro({
  corrida,
  enviando,
  onAvaliar,
  onDispensar,
}: Props) {
  const insets = useSafeAreaInsets();

  const [nota, setNota] = useState(0);
  const [comentario, setComentario] = useState("");

  const ganho = formatarValor(corrida.corrida_financeiro?.valor_motorista);
  const distancia = formatarKm(corrida.distancia_total);
  const passageiro = corrida.passageiro?.user?.name;

  const destino = corrida.corrida_destinos?.find(
    (ponto) => ponto.tipo === "destino",
  );

  return (
    <View style={styles.sobreposicao}>
      <View style={[styles.cartao, { paddingBottom: insets.bottom + 20 }]}>
        <Text style={styles.titulo}>Corrida finalizada</Text>

        {ganho !== null && (
          <>
            <Text style={styles.ganho}>{ganho}</Text>
            <Text style={styles.ganhoApoio}>o seu ganho nesta corrida</Text>
          </>
        )}

        <View style={styles.detalhes}>
          {distancia !== null && (
            <Text style={styles.linha}>{distancia} rodados</Text>
          )}

          {destino && (
            <Text style={styles.linha} numberOfLines={1}>
              Até {destino.endereco}
            </Text>
          )}
        </View>

        <Text style={styles.pergunta}>
          Como foi {passageiro ? `com ${passageiro}` : "o passageiro"}?
        </Text>

        <View style={styles.estrelas}>
          {ESTRELAS.map((valorEstrela) => (
            <TouchableOpacity
              key={valorEstrela}
              onPress={() => setNota(valorEstrela)}
              disabled={enviando}
              style={styles.estrela}
            >
              <Ionicons
                name={valorEstrela <= nota ? "star" : "star-outline"}
                size={34}
                color={valorEstrela <= nota ? "#fbc02d" : "#BBB"}
              />
            </TouchableOpacity>
          ))}
        </View>

        {nota > 0 && nota <= 3 && (
          <TextInput
            style={styles.comentario}
            placeholder="O que aconteceu? (opcional)"
            placeholderTextColor="#999"
            value={comentario}
            onChangeText={setComentario}
            multiline
            editable={!enviando}
          />
        )}

        <TouchableOpacity
          style={[styles.botao, nota === 0 && styles.botaoDesativado]}
          disabled={nota === 0 || enviando}
          onPress={() => onAvaliar(nota, comentario.trim() || undefined)}
        >
          <Text style={styles.textoBotao}>
            {enviando ? "Enviando..." : "Enviar e continuar"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.botaoPular}
          disabled={enviando}
          onPress={onDispensar}
        >
          <Text style={styles.textoPular}>Agora não</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sobreposicao: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
    zIndex: 50,
  },
  cartao: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  titulo: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
  },
  ganho: {
    fontSize: 34,
    fontWeight: "800",
    color: "#111",
    marginTop: 8,
  },
  ganhoApoio: {
    fontSize: 13,
    color: "#777",
    marginTop: 2,
  },
  detalhes: {
    marginTop: 14,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  linha: {
    fontSize: 13,
    color: "#666",
    marginTop: 3,
  },
  pergunta: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111",
    marginTop: 18,
    textAlign: "center",
  },
  estrelas: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 12,
  },
  estrela: {
    paddingHorizontal: 6,
  },
  comentario: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 12,
    padding: 12,
    minHeight: 70,
    fontSize: 14,
    color: "#111",
    textAlignVertical: "top",
  },
  botao: {
    marginTop: 18,
    backgroundColor: "#fbc02d",
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
  },
  botaoDesativado: {
    backgroundColor: "#EEE",
  },
  textoBotao: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
  },
  botaoPular: {
    marginTop: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  textoPular: {
    fontSize: 14,
    color: "#888",
  },
});
