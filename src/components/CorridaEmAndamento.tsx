import BotaoDeslizar from "@/components/BotaoDeslizar";
import ContadorEspera from "@/components/common/ContadorEspera";
import { Text } from "@/components/common/Texto";
import { ResumoEspera } from "@/domain/contadorEspera";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Image,
  Alert,
  Linking,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

export type AcaoCorrida = "cheguei" | "iniciar" | "finalizar";

export interface PassageiroDaCorrida {
  nome: string;
  foto?: string | null;
  foto_oculta?: boolean;
  telefone?: string | null;
  nota?: number | null;
  corridas?: number;
}

interface props {
  status: string;
  codigoCorrida: string;
  origem?: string | null;
  destino?: string | null;
  passageiro?: PassageiroDaCorrida | null;
  minutos?: number | null;
  distanciaKm?: number | null;
  ocupado?: boolean;
  espera?: ResumoEspera | null;
  onAvancar: (acao: AcaoCorrida) => void;
  onCancelarNaoComparecimento: () => void;
}

const PASSOS: Record<
  string,
  {
    acao: AcaoCorrida;
    rotulo: string;
    cor: string;
    titulo: string;
    apoio: string;
  }
> = {
  aceita: {
    acao: "cheguei",
    rotulo: "Cheguei no embarque",
    cor: "#17A673",
    titulo: "A caminho do embarque",
    apoio: "Deslize assim que chegar no ponto de encontro",
  },
  motorista_chegou: {
    acao: "iniciar",
    rotulo: "Iniciar corrida",
    cor: "#2F6BFF",
    titulo: "Aguardando passageiro",
    apoio: "Deslize para começar assim que o passageiro embarcar",
  },
  em_andamento: {
    acao: "finalizar",
    rotulo: "Finalizar corrida",
    cor: "#2F6BFF",
    titulo: "Em viagem",
    apoio: "Deslize ao chegar no destino",
  },
};

export default function CorridaEmAndamento({
  status,
  codigoCorrida,
  origem,
  destino,
  passageiro,
  minutos,
  distanciaKm,
  ocupado = false,
  espera,
  onAvancar,
  onCancelarNaoComparecimento,
}: props) {
  const insets = useSafeAreaInsets();
  const passo = PASSOS[status];

  if (!passo) return null;

  const indoParaODestino = status === "em_andamento";
  const enderecoAlvo = indoParaODestino ? destino : origem;

  const ligar = () => {
    if (!passageiro?.telefone) return;

    Linking.openURL(`tel:${passageiro.telefone.replace(/\D/g, "")}`);
  };

  return (
    <View style={[styles.folha, { paddingBottom: insets.bottom + 16 }]}>
      <View style={styles.puxador} />

      <View style={styles.linhaTopo}>
        <View style={styles.selo}>
          <Text style={styles.seloTexto}>
            {typeof minutos === "number" ? `${minutos}` : "--"}
          </Text>
          <Text style={styles.seloUnidade}>min</Text>
        </View>

        <View style={styles.tituloBloco}>
          <Text style={styles.titulo}>{passo.titulo}</Text>
          <Text style={styles.apoio}>{passo.apoio}</Text>
        </View>

        <Text style={styles.codigo}>{codigoCorrida}</Text>
      </View>

      <View style={styles.enderecoLinha}>
        <Ionicons
          name={indoParaODestino ? "flag" : "location"}
          size={16}
          color={indoParaODestino ? "#D32F2F" : "#17A673"}
        />

        <Text numberOfLines={2} style={styles.endereco}>
          {enderecoAlvo ?? "Endereço não informado"}
        </Text>

        {typeof distanciaKm === "number" && (
          <Text style={styles.distancia}>
            {distanciaKm.toFixed(1).replace(".", ",")} km
          </Text>
        )}
      </View>

      {status === "motorista_chegou" &&
      espera !== null &&
      espera !== undefined ? (
        <ContadorEspera
          espera={espera}
          perspectiva="motorista"
          onCancelarNaoComparecimento={() =>
            Alert.alert(
              "Confirmar ausência",
              "O passageiro não apareceu? A corrida será cancelada e a tarifa base da categoria será registrada como taxa de cancelamento.",
              [
                { text: "Voltar", style: "cancel" },
                {
                  text: "Confirmar",
                  style: "destructive",
                  onPress: onCancelarNaoComparecimento,
                },
              ],
            )
          }
        />
      ) : null}

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
        rotulo={passo.rotulo}
        cor={passo.cor}
        desabilitado={ocupado}
        onConfirmar={() => onAvancar(passo.acao)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
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
    paddingBottom: 16,
    gap: 14,
    zIndex: 20,
  },

  puxador: {
    alignSelf: "center",
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#DDD",
  },

  linhaTopo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  selo: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: "#2F6BFF",
    alignItems: "center",
    justifyContent: "center",
  },

  seloTexto: {
    fontSize: 17,
    fontWeight: "700",
    color: "#2F6BFF",
  },

  seloUnidade: {
    fontSize: 10,
    color: "#2F6BFF",
  },

  tituloBloco: {
    flex: 1,
  },

  titulo: {
    fontSize: 17,
    fontWeight: "700",
    color: "#000",
  },

  apoio: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },

  codigo: {
    fontSize: 11,
    color: "#AAA",
  },

  enderecoLinha: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  endereco: {
    flex: 1,
    fontSize: 14,
    color: "#333",
  },

  distancia: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666",
  },

  separador: {
    height: 1,
    backgroundColor: "#EEE",
  },

  linhaPassageiro: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },

  avatarVazio: {
    backgroundColor: "#F0F0F0",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarProtegido: { opacity: 0.55, backgroundColor: "#D8D8D8" },

  passageiroBloco: {
    flex: 1,
  },

  passageiroNome: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },

  passageiroApoio: {
    fontSize: 13,
    color: "#777",
    marginTop: 2,
  },

  botaoLigar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F3F3F3",
    alignItems: "center",
    justifyContent: "center",
  },
});
