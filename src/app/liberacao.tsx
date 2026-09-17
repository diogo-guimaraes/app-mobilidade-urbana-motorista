import AppLogo from "@/components/common/AppLogo";
import ErrorBanner from "@/components/common/ErrorBanner";
import { Text, TextInput } from "@/components/common/Texto";
import { useAuth } from "@/context/AuthProvider";
import {
  SituacaoCadastro,
  useCadastroMotorista,
} from "@/hooks/useCadastroMotorista";
import { useEspacoDoTeclado } from "@/hooks/useEspacoDoTeclado";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

const CATEGORIAS_CNH = ["A", "B", "AB", "C", "D", "E"];

const AVISO: Record<
  SituacaoCadastro,
  { titulo: string; texto: string; cor: string }
> = {
  sem_cadastro: {
    titulo: "Falta pouco para você dirigir",
    texto: "Envie seus dados para começarmos a análise.",
    cor: "#E65100",
  },
  pendente: {
    titulo: "Seu cadastro está incompleto",
    texto: "Complete os itens abaixo para entrar na análise.",
    cor: "#E65100",
  },
  em_analise: {
    titulo: "Cadastro em análise",
    texto: "Já recebemos seus dados. Avisaremos assim que for aprovado.",
    cor: "#1565C0",
  },
  reprovado: {
    titulo: "Cadastro reprovado",
    texto: "Confira as observações e reenvie o que for necessário.",
    cor: "#D32F2F",
  },
  aprovado: {
    titulo: "Cadastro aprovado",
    texto: "Tudo certo. Você já pode receber corridas.",
    cor: "#17A673",
  },
};

const ROTULO_PENDENCIA: Record<string, string> = {
  cnh: "Dados da CNH",
  documentos: "Envio de documentos",
  veiculo: "Cadastro do veículo",
};

const formatarData = (texto: string) =>
  texto
    .replace(/\D/g, "")
    .slice(0, 8)
    .replace(/(\d{2})(\d)/, "$1/$2")
    .replace(/(\d{2})(\d)/, "$1/$2");

const paraIso = (texto: string) => {
  const digitos = texto.replace(/\D/g, "");

  if (digitos.length !== 8) return null;

  return `${digitos.slice(4)}-${digitos.slice(2, 4)}-${digitos.slice(0, 2)}`;
};

export default function Liberacao() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { logout } = useAuth();
  const espacoDoTeclado = useEspacoDoTeclado();
  const { cadastro, carregando, enviando, erro, enviarCnh, recarregar } =
    useCadastroMotorista();

  const [numero, setNumero] = useState("");
  const [categoria, setCategoria] = useState("");
  const [validade, setValidade] = useState("");
  const [ear, setEar] = useState(false);

  useEffect(() => {
    if (cadastro?.situacao === "aprovado") {
      router.replace("/home");
    }
  }, [cadastro?.situacao, router]);

  const validadeIso = paraIso(validade);
  const naoVencida =
    validadeIso !== null && new Date(`${validadeIso}T00:00:00`) > new Date();

  const cnhCompleta =
    numero.replace(/\D/g, "").length >= 9 && categoria !== "" && naoVencida;

  const faltaCnh = cadastro?.pendencias.includes("cnh") ?? true;

  const enviar = async () => {
    if (!cnhCompleta || validadeIso === null) return;

    await enviarCnh({
      cnh_numero: numero.replace(/\D/g, ""),
      cnh_categoria: categoria,
      cnh_expiracao: validadeIso,
      ear,
    });
  };

  if (carregando) {
    return (
      <View style={styles.carregando}>
        <ActivityIndicator size="large" color="#FF5500" />
        <Text style={styles.carregandoTexto}>Carregando seu cadastro...</Text>
      </View>
    );
  }

  const aviso = AVISO[cadastro?.situacao ?? "sem_cadastro"];

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.container}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View
            style={[
              styles.header,
              { paddingTop: Math.max(insets.top + 12, 56) },
            ]}
          >
            <AppLogo />
          </View>

          <View style={styles.content}>
            <View style={[styles.aviso, { borderLeftColor: aviso.cor }]}>
              <Text style={[styles.avisoTitulo, { color: aviso.cor }]}>
                {aviso.titulo}
              </Text>
              <Text style={styles.avisoTexto}>{aviso.texto}</Text>
            </View>

            <Text style={styles.secao}>O que falta</Text>

            {(cadastro?.pendencias.length ?? 0) === 0 ? (
              <View style={styles.itemLinha}>
                <Feather name="check-circle" size={18} color="#17A673" />
                <Text style={styles.itemTexto}>Nada pendente</Text>
              </View>
            ) : (
              cadastro?.pendencias.map((item) => (
                <View key={item} style={styles.itemLinha}>
                  <Feather name="circle" size={18} color="#BBB" />
                  <Text style={styles.itemTexto}>
                    {ROTULO_PENDENCIA[item] ?? item}
                  </Text>
                </View>
              ))
            )}

            {cadastro?.documentos.map((documento) => (
              <View key={documento.tipo_documento} style={styles.itemLinha}>
                <Feather
                  name={
                    documento.status === "aprovado" ? "check-circle" : "clock"
                  }
                  size={18}
                  color={
                    documento.status === "aprovado" ? "#17A673" : "#E65100"
                  }
                />
                <Text style={styles.itemTexto}>
                  {documento.tipo_documento} · {documento.status}
                  {documento.observacao ? ` — ${documento.observacao}` : ""}
                </Text>
              </View>
            ))}

            {faltaCnh ? (
              <>
                <Text style={styles.secao}>Dados da CNH</Text>

                <View style={styles.inputWrapper}>
                  <TextInput
                    placeholder="Número de registro"
                    placeholderTextColor="#CCC"
                    style={styles.input}
                    value={numero}
                    onChangeText={(texto) =>
                      setNumero(texto.replace(/\D/g, "").slice(0, 11))
                    }
                    keyboardType="number-pad"
                    editable={!enviando}
                  />
                </View>
                <View style={styles.inputUnderline} />

                <Text style={styles.rotulo}>Categoria</Text>

                <View style={styles.categoriaLinha}>
                  {CATEGORIAS_CNH.map((item) => {
                    const escolhida = categoria === item;

                    return (
                      <TouchableOpacity
                        key={item}
                        style={[
                          styles.categoria,
                          escolhida ? styles.categoriaEscolhida : null,
                        ]}
                        onPress={() => setCategoria(item)}
                        disabled={enviando}
                      >
                        <Text
                          style={[
                            styles.categoriaTexto,
                            escolhida ? styles.categoriaTextoEscolhido : null,
                          ]}
                        >
                          {item}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View style={styles.inputWrapper}>
                  <TextInput
                    placeholder="Validade (DD/MM/AAAA)"
                    placeholderTextColor="#CCC"
                    style={styles.input}
                    value={validade}
                    onChangeText={(texto) => setValidade(formatarData(texto))}
                    keyboardType="number-pad"
                    editable={!enviando}
                  />
                </View>
                <View style={styles.inputUnderline} />

                {validade.length === 10 && !naoVencida ? (
                  <Text style={styles.alerta}>
                    Essa data já passou. Informe uma CNH dentro da validade.
                  </Text>
                ) : null}

                <TouchableOpacity
                  style={styles.opcao}
                  onPress={() => setEar((atual) => !atual)}
                  disabled={enviando}
                >
                  <Text style={styles.opcaoTexto}>
                    Minha CNH tem observação EAR
                  </Text>
                  {ear && <Feather name="check" size={20} color="#000" />}
                </TouchableOpacity>
              </>
            ) : null}

            {erro.length > 0 ? <ErrorBanner message={erro} /> : null}

            <TouchableOpacity style={styles.sair} onPress={logout}>
              <Text style={styles.sairTexto}>Sair da conta</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <View
          style={[
            styles.footer,
            {
              paddingBottom: Math.max(insets.bottom + 12, 60) + espacoDoTeclado,
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.botao,
              (faltaCnh ? cnhCompleta : true) && !enviando
                ? styles.botaoAtivo
                : styles.botaoInativo,
            ]}
            onPress={faltaCnh ? enviar : recarregar}
            disabled={(faltaCnh && !cnhCompleta) || enviando}
          >
            {enviando ? (
              <ActivityIndicator color="black" />
            ) : (
              <Text
                style={[
                  styles.botaoTexto,
                  faltaCnh && !cnhCompleta && styles.botaoTextoInativo,
                ]}
              >
                {faltaCnh ? "Enviar para análise" : "Atualizar situação"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF" },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 28 },
  carregando: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF",
  },
  carregandoTexto: { marginTop: 16, fontSize: 14, color: "#666" },
  header: { alignItems: "center", paddingTop: 56, paddingHorizontal: 20 },
  content: { flexGrow: 1, paddingHorizontal: 30, marginTop: 20 },
  aviso: {
    borderLeftWidth: 4,
    backgroundColor: "#FAFAFA",
    borderRadius: 8,
    padding: 14,
    marginBottom: 24,
  },
  avisoTitulo: { fontSize: 17, fontWeight: "700" },
  avisoTexto: { fontSize: 14, color: "#555", marginTop: 4, lineHeight: 20 },
  secao: {
    fontSize: 13,
    fontWeight: "700",
    color: "#888",
    textTransform: "uppercase",
    marginTop: 18,
    marginBottom: 12,
  },
  itemLinha: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  itemTexto: { flex: 1, fontSize: 15, color: "#333" },
  rotulo: { fontSize: 13, color: "#666", marginBottom: 10 },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  input: { flex: 1, fontSize: 18, color: "#000", fontWeight: "400" },
  inputUnderline: {
    height: 1,
    backgroundColor: "#FF5500",
    width: "100%",
    marginBottom: 16,
  },
  categoriaLinha: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },
  categoria: {
    minWidth: 54,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    alignItems: "center",
  },
  categoriaEscolhida: { borderColor: "#FF5500", backgroundColor: "#FFF3E0" },
  categoriaTexto: { fontSize: 15, fontWeight: "600", color: "#666" },
  categoriaTextoEscolhido: { color: "#E65100" },
  alerta: { fontSize: 13, color: "#D32F2F", marginBottom: 16 },
  opcao: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 12,
  },
  opcaoTexto: { fontSize: 16, color: "#333" },
  sair: { marginTop: 24, paddingVertical: 12, alignItems: "center" },
  sairTexto: { fontSize: 15, color: "#888", textDecorationLine: "underline" },
  footer: {
    paddingHorizontal: 30,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: "#FFF",
  },
  botao: {
    height: 55,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  botaoAtivo: { backgroundColor: "#FFD200" },
  botaoInativo: { backgroundColor: "#F5F5F5" },
  botaoTexto: { fontSize: 16, fontWeight: "700", color: "#000" },
  botaoTextoInativo: { color: "#CCC" },
});
