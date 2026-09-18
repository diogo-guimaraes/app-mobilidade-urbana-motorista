import AppLogo from "@/components/common/AppLogo";
import ErrorBanner from "@/components/common/ErrorBanner";
import { Text, TextInput } from "@/components/common/Texto";
import { api } from "@/Services/api";
import { useEspacoDoTeclado } from "@/hooks/useEspacoDoTeclado";
import { Feather } from "@expo/vector-icons";
import type { AxiosError } from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthProvider";

const PASSO_FINAL = 6;

const paraIso = (texto: string) => {
  const partes = texto.replace(/\D/g, "");

  if (partes.length !== 8) return null;

  const dia = partes.slice(0, 2);
  const mes = partes.slice(2, 4);
  const ano = partes.slice(4);

  const data = new Date(`${ano}-${mes}-${dia}T00:00:00`);

  if (Number.isNaN(data.getTime())) return null;

  return `${ano}-${mes}-${dia}`;
};

const temIdadeMinima = (iso: string) => {
  const nascimento = new Date(`${iso}T00:00:00`);
  const limite = new Date();

  limite.setFullYear(limite.getFullYear() - 18);

  return nascimento <= limite;
};

const formatarCPF = (texto: string) =>
  texto
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");

const formatarValidadeCnh = (texto: string) =>
  texto
    .replace(/\D/g, "")
    .slice(0, 8)
    .replace(/(\d{2})(\d)/, "$1/$2")
    .replace(/(\d{2})(\d)/, "$1/$2");

const CATEGORIAS_CNH = ["A", "B", "AB", "C", "D", "E"];

const formatarNascimento = (texto: string) =>
  texto
    .replace(/\D/g, "")
    .slice(0, 8)
    .replace(/(\d{2})(\d)/, "$1/$2")
    .replace(/(\d{2})(\d)/, "$1/$2");

export default function Cadastro() {
  const router = useRouter();
  const { loginComToken } = useAuth();

  const { telefone: telefoneParam } = useLocalSearchParams<{
    telefone?: string;
  }>();
  const espacoDoTeclado = useEspacoDoTeclado();
  const codigoOcultoRef = useRef<TextInput>(null);

  const [step, setStep] = useState(1);

  const [email, setEmail] = useState("");
  const [codigo, setCodigo] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [nome, setNome] = useState("");
  const [sobreNome, setsobreNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [nascimento, setNascimento] = useState("");
  const [cnhNumero, setCnhNumero] = useState("");
  const [cnhCategoria, setCnhCategoria] = useState("");
  const [cnhValidade, setCnhValidade] = useState("");
  const [ear, setEar] = useState(false);
  const [concordo, setConcordo] = useState(false);

  const [enviando, setEnviando] = useState(false);
  const [erroCadastro, setErroCadastro] = useState("");
  const [erroEmailServidor, setErroEmailServidor] = useState("");
  const [erroCpfServidor, setErroCpfServidor] = useState("");
  const [erroCnhServidor, setErroCnhServidor] = useState("");

  const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const codigoValido = codigo.length === 4;
  const senhasIguais = senha.length >= 8 && senha === confirmarSenha;
  const cpfLimpo = cpf.replace(/\D/g, "");
  const nascimentoIso = paraIso(nascimento);
  const maiorDeIdade = nascimentoIso !== null && temIdadeMinima(nascimentoIso);

  const cnhNumeroLimpo = cnhNumero.replace(/\D/g, "");
  const cnhValidadeIso = paraIso(cnhValidade);
  const cnhNaoVencida =
    cnhValidadeIso !== null &&
    new Date(`${cnhValidadeIso}T00:00:00`) > new Date();

  const cnhOk =
    cnhNumeroLimpo.length >= 9 && cnhCategoria !== "" && cnhNaoVencida;

  const dadosPessoaisOk =
    nome.trim().length > 0 &&
    sobreNome.trim().length > 0 &&
    cpfLimpo.length === 11 &&
    maiorDeIdade;

  const finalizarCadastro = async () => {
    if (!concordo || enviando) return;

    if (nascimentoIso === null || cpfLimpo.length !== 11) {
      setErroCadastro("Confira o CPF e a data de nascimento.");
      setStep(4);
      return;
    }

    if (!cnhOk) {
      setErroCnhServidor("Confira os dados da sua CNH.");
      setStep(5);
      return;
    }

    setErroCadastro("");
    setErroEmailServidor("");
    setErroCpfServidor("");
    setErroCnhServidor("");
    setEnviando(true);

    try {
      const { data } = await api.post<{
        token: string;
        user: { id: number; name: string; email: string };
      }>("/auth/register", {
        name: `${nome} ${sobreNome}`.trim(),
        email,
        password: senha,
        cpf: cpfLimpo,
        data_nascimento: nascimentoIso,
        ...(telefoneParam ? { telefone: telefoneParam } : {}),
        perfil: "motorista",
        cnh_numero: cnhNumeroLimpo,
        cnh_categoria: cnhCategoria,
        cnh_expiracao: cnhValidadeIso,
        ear,
      });

      await loginComToken(data.user, data.token);

      router.replace("/home");
    } catch (falha) {
      const resposta = (
        falha as AxiosError<{
          message?: string;
          errors?: Record<string, string[]>;
        }>
      )?.response;

      const erros = resposta?.data?.errors;

      if (erros?.email) {
        setErroEmailServidor(erros.email[0] ?? "E-mail já cadastrado.");
        setStep(1);
        return;
      }

      if (erros?.cpf) {
        setErroCpfServidor(erros.cpf[0] ?? "CPF já cadastrado.");
        setStep(4);
        return;
      }

      const erroDeCnh =
        erros?.cnh_numero ?? erros?.cnh_categoria ?? erros?.cnh_expiracao;

      if (erroDeCnh) {
        setErroCnhServidor(erroDeCnh[0] ?? "Confira os dados da sua CNH.");
        setStep(5);
        return;
      }

      if (erros?.telefone) {
        setErroCadastro(
          "Já existe uma conta com esse telefone. Volte e entre com ele.",
        );
        return;
      }

      if (resposta?.status === 429) {
        setErroCadastro(
          "Muitas tentativas. Aguarde um minuto e tente de novo.",
        );
        return;
      }

      setErroCadastro(
        Object.values(erros ?? {})[0]?.[0] ??
          resposta?.data?.message ??
          "Não foi possível concluir o cadastro.",
      );
    } finally {
      setEnviando(false);
    }
  };

  const podeAvancarPorPasso: Record<number, boolean> = {
    1: emailValido,
    2: codigoValido,
    3: senhasIguais,
    4: dadosPessoaisOk,
    5: cnhOk,
    6: concordo,
  };

  const podeAvancar = (podeAvancarPorPasso[step] ?? false) && !enviando;

  const rotuloAvancar = step === PASSO_FINAL ? "Finalizar" : "Avançar";

  const avancar = () => {
    if (!podeAvancar) return;

    if (step === PASSO_FINAL) {
      finalizarCadastro();
      return;
    }

    setStep(step + 1);
  };

  const voltarPasso = useCallback(() => {
    if (step <= 1) {
      router.back();
      return;
    }

    setStep(step - 1);
  }, [step, router]);

  useEffect(() => {
    const inscricao = BackHandler.addEventListener("hardwareBackPress", () => {
      voltarPasso();
      return true;
    });

    return () => inscricao.remove();
  }, [voltarPasso]);

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.container}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <AppLogo />

            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>🚗 Cadastro de motorista</Text>
            </View>
          </View>

          <View style={styles.content}>
            {step === 1 && (
              <View style={styles.stepContainer}>
                <Text style={styles.title}>Qual é o seu e-mail?</Text>

                <View
                  style={[
                    styles.inputWrapper,
                    erroEmailServidor ? styles.inputWrapperError : null,
                  ]}
                >
                  <TextInput
                    autoFocus
                    placeholder="Informe seu e-mail"
                    placeholderTextColor="#CCC"
                    style={styles.input}
                    value={email}
                    onChangeText={(texto) => {
                      if (erroEmailServidor) setErroEmailServidor("");

                      setEmail(texto);
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
                <View style={styles.inputUnderline} />

                {erroEmailServidor ? (
                  <ErrorBanner message={erroEmailServidor} />
                ) : null}
              </View>
            )}

            {step === 2 && (
              <View style={styles.stepContainer}>
                <Text style={styles.title}>
                  Digite o código de 4 dígitos enviado para:
                </Text>

                <Text style={styles.destaque}>{email}</Text>

                <TextInput
                  ref={codigoOcultoRef}
                  autoFocus
                  value={codigo}
                  onChangeText={(texto) =>
                    setCodigo(texto.replace(/[^0-9]/g, "").slice(0, 4))
                  }
                  keyboardType="number-pad"
                  maxLength={4}
                  caretHidden
                  contextMenuHidden
                  style={styles.codigoOculto}
                />

                <Pressable
                  style={styles.codigoGrade}
                  onPress={() => {
                    codigoOcultoRef.current?.blur();

                    setTimeout(() => codigoOcultoRef.current?.focus(), 50);
                  }}
                >
                  {[0, 1, 2, 3].map((posicao) => {
                    const digito = codigo[posicao];
                    const ativa =
                      posicao === Math.min(codigo.length, 3) && !digito;

                    return (
                      <View key={posicao} style={styles.codigoCelula}>
                        <View style={styles.codigoCaixa}>
                          <Text
                            style={[
                              styles.codigoTexto,
                              { color: digito ? "#000" : "#D9D9D9" },
                            ]}
                          >
                            {digito || "0"}
                          </Text>
                        </View>

                        <View
                          style={[
                            styles.codigoLinha,
                            {
                              backgroundColor:
                                digito || ativa ? "#FF5500" : "#E5E5E5",
                            },
                          ]}
                        />
                      </View>
                    );
                  })}
                </Pressable>

                <Text style={styles.apoio}>
                  Verifique a caixa de entrada e o spam.
                </Text>
              </View>
            )}

            {step === 3 && (
              <View style={styles.stepContainer}>
                <Text style={styles.title}>Crie uma senha para sua conta</Text>

                <View style={styles.inputWrapper}>
                  <TextInput
                    autoFocus
                    placeholder="Senha (mínimo 8 caracteres)"
                    placeholderTextColor="#CCC"
                    style={styles.input}
                    value={senha}
                    onChangeText={setSenha}
                    secureTextEntry
                    autoCapitalize="none"
                  />
                </View>
                <View style={styles.inputUnderline} />

                <View style={styles.inputWrapper}>
                  <TextInput
                    placeholder="Confirme a senha"
                    placeholderTextColor="#CCC"
                    style={styles.input}
                    value={confirmarSenha}
                    onChangeText={setConfirmarSenha}
                    secureTextEntry
                    autoCapitalize="none"
                  />
                </View>
                <View style={styles.inputUnderline} />

                {confirmarSenha.length > 0 && !senhasIguais ? (
                  <ErrorBanner message="As senhas precisam ser iguais e ter ao menos 8 caracteres." />
                ) : null}
              </View>
            )}

            {step === 4 && (
              <View style={styles.stepContainer}>
                <Text style={styles.title}>Seus dados</Text>

                <View style={styles.inputWrapper}>
                  <TextInput
                    autoFocus
                    placeholder="Primeiro nome"
                    placeholderTextColor="#CCC"
                    style={styles.input}
                    value={nome}
                    onChangeText={setNome}
                  />
                </View>
                <View style={styles.inputUnderline} />

                <View style={styles.inputWrapper}>
                  <TextInput
                    placeholder="Sobrenome"
                    placeholderTextColor="#CCC"
                    style={styles.input}
                    value={sobreNome}
                    onChangeText={setsobreNome}
                  />
                </View>
                <View style={styles.inputUnderline} />

                <View
                  style={[
                    styles.inputWrapper,
                    erroCpfServidor ? styles.inputWrapperError : null,
                  ]}
                >
                  <TextInput
                    placeholder="CPF"
                    placeholderTextColor="#CCC"
                    style={styles.input}
                    value={cpf}
                    onChangeText={(texto) => {
                      if (erroCpfServidor) setErroCpfServidor("");

                      setCpf(formatarCPF(texto));
                    }}
                    keyboardType="number-pad"
                    maxLength={14}
                  />
                </View>
                <View style={styles.inputUnderline} />

                {erroCpfServidor ? (
                  <ErrorBanner message={erroCpfServidor} />
                ) : null}

                <View style={styles.inputWrapper}>
                  <TextInput
                    placeholder="Data de nascimento (DD/MM/AAAA)"
                    placeholderTextColor="#CCC"
                    style={styles.input}
                    value={nascimento}
                    onChangeText={(texto) =>
                      setNascimento(formatarNascimento(texto))
                    }
                    keyboardType="number-pad"
                    maxLength={10}
                  />
                </View>
                <View style={styles.inputUnderline} />

                {nascimentoIso !== null && !maiorDeIdade ? (
                  <ErrorBanner message="Você precisa ter pelo menos 18 anos para se cadastrar." />
                ) : null}
              </View>
            )}

            {step === 5 && (
              <View style={styles.stepContainer}>
                <Text style={styles.title}>Dados da sua CNH</Text>
                <Text style={styles.apoio}>
                  Precisamos deles para liberar você para dirigir
                </Text>

                <View
                  style={[
                    styles.inputWrapper,
                    erroCnhServidor ? styles.inputWrapperError : null,
                  ]}
                >
                  <TextInput
                    autoFocus
                    placeholder="Número de registro da CNH"
                    placeholderTextColor="#CCC"
                    style={styles.input}
                    value={cnhNumero}
                    onChangeText={(texto) => {
                      if (erroCnhServidor) setErroCnhServidor("");

                      setCnhNumero(texto.replace(/\D/g, "").slice(0, 11));
                    }}
                    keyboardType="number-pad"
                  />
                </View>
                <View style={styles.inputUnderline} />

                <Text style={styles.rotuloCampo}>Categoria</Text>

                <View style={styles.categoriaLinha}>
                  {CATEGORIAS_CNH.map((categoria) => {
                    const escolhida = cnhCategoria === categoria;

                    return (
                      <TouchableOpacity
                        key={categoria}
                        style={[
                          styles.categoria,
                          escolhida ? styles.categoriaEscolhida : null,
                        ]}
                        onPress={() => {
                          if (erroCnhServidor) setErroCnhServidor("");

                          setCnhCategoria(categoria);
                        }}
                      >
                        <Text
                          style={[
                            styles.categoriaTexto,
                            escolhida ? styles.categoriaTextoEscolhido : null,
                          ]}
                        >
                          {categoria}
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
                    value={cnhValidade}
                    onChangeText={(texto) => {
                      if (erroCnhServidor) setErroCnhServidor("");

                      setCnhValidade(formatarValidadeCnh(texto));
                    }}
                    keyboardType="number-pad"
                  />
                </View>
                <View style={styles.inputUnderline} />

                {cnhValidade.length === 10 && !cnhNaoVencida ? (
                  <Text style={styles.aviso}>
                    Essa data já passou. Informe uma CNH dentro da validade.
                  </Text>
                ) : null}

                <TouchableOpacity
                  style={styles.opcao}
                  onPress={() => setEar((atual) => !atual)}
                >
                  <Text style={styles.opcaoTexto}>
                    Minha CNH tem observação EAR
                  </Text>

                  {ear && <Feather name="check" size={20} color="#000" />}
                </TouchableOpacity>

                {erroCnhServidor ? (
                  <ErrorBanner message={erroCnhServidor} />
                ) : null}
              </View>
            )}

            {step === 6 && (
              <View style={styles.stepContainer}>
                <View style={styles.iconeTermos}>
                  <Feather name="file-text" size={56} color="#000" />
                </View>

                <Text style={styles.title}>
                  Aceite os Termos e o Aviso de Privacidade
                </Text>

                <Text style={styles.textoTermos}>
                  Ao selecionar Concordo abaixo, confirmo que revisei e concordo
                  com os Termos de uso e reconheço o Aviso de Privacidade. Eu
                  tenho pelo menos 18 anos.
                </Text>

                {erroCadastro.length > 0 ? (
                  <ErrorBanner message={erroCadastro} />
                ) : null}

                <Pressable
                  style={styles.linhaConcordo}
                  onPress={() => setConcordo(!concordo)}
                >
                  <Text style={styles.concordoTexto}>Concordo</Text>

                  <View
                    style={[
                      styles.caixaConcordo,
                      concordo ? styles.caixaConcordoMarcada : null,
                    ]}
                  >
                    {concordo && (
                      <Feather name="check" size={16} color="#FFF" />
                    )}
                  </View>
                </Pressable>
              </View>
            )}
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: 60 + espacoDoTeclado }]}>
          <TouchableOpacity
            style={styles.roundedButton}
            onPress={voltarPasso}
            disabled={enviando}
          >
            <Feather name="arrow-left" size={22} color="black" />
          </TouchableOpacity>

          <TouchableOpacity
            disabled={!podeAvancar}
            onPress={avancar}
            style={[
              styles.nextButton,
              podeAvancar ? styles.nextButtonActive : styles.nextButtonDisabled,
            ]}
          >
            <Text
              style={[
                styles.nextButtonText,
                !podeAvancar && styles.nextButtonTextDisabled,
              ]}
            >
              {rotuloAvancar}
            </Text>

            <Feather
              name="arrow-right"
              size={18}
              color={podeAvancar ? "black" : "#CCC"}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  rotuloCampo: {
    fontSize: 13,
    color: "#666",
    marginBottom: 10,
  },

  categoriaLinha: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 25,
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

  categoriaEscolhida: {
    borderColor: "#FF5500",
    backgroundColor: "#FFF3E0",
  },

  categoriaTexto: {
    fontSize: 15,
    fontWeight: "600",
    color: "#666",
  },

  categoriaTextoEscolhido: {
    color: "#E65100",
  },

  aviso: {
    fontSize: 13,
    color: "#D32F2F",
    marginBottom: 16,
  },

  container: { flex: 1, backgroundColor: "#FFF" },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 28 },
  header: { alignItems: "center", paddingTop: 56, paddingHorizontal: 20 },
  content: {
    flexGrow: 1,
    paddingHorizontal: 30,
    marginTop: 20,
    paddingBottom: 24,
  },
  stepContainer: { flexGrow: 1 },
  badgeContainer: {
    backgroundColor: "#FFF3E0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 10,
  },
  badgeText: {
    color: "#E65100",
    fontSize: 12,
    fontWeight: "600",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#000",
    marginBottom: 12,
  },
  destaque: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FF5500",
    marginBottom: 16,
  },
  apoio: {
    fontSize: 13,
    color: "#666",
    marginBottom: 16,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  inputWrapperError: { borderBottomWidth: 2, borderBottomColor: "#D32F2F" },
  input: { flex: 1, fontSize: 18, color: "#000", fontWeight: "400" },
  inputUnderline: {
    height: 1,
    backgroundColor: "#FF5500",
    width: "100%",
    marginBottom: 16,
  },
  codigoOculto: { position: "absolute", opacity: 0, width: 20, height: 20 },
  codigoGrade: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  codigoCelula: { alignItems: "center", width: "20%" },
  codigoCaixa: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 8,
    width: "100%",
  },
  codigoTexto: { fontSize: 32, fontWeight: "400", textAlign: "center" },
  codigoLinha: { height: 1.5, width: "100%" },
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
  iconeTermos: { alignItems: "center", marginBottom: 20 },
  textoTermos: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
    marginBottom: 20,
  },
  linhaConcordo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#EEE",
    paddingTop: 18,
    marginTop: 4,
  },
  concordoTexto: { fontSize: 16, color: "#000" },
  caixaConcordo: {
    width: 26,
    height: 26,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#BBB",
    alignItems: "center",
    justifyContent: "center",
  },
  caixaConcordoMarcada: { backgroundColor: "#000", borderColor: "#000" },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 30,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: "#FFF",
  },
  roundedButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  nextButton: {
    height: 50,
    borderRadius: 25,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  nextButtonActive: { backgroundColor: "#FFD200" },
  nextButtonDisabled: { backgroundColor: "#F5F5F5" },
  nextButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
    marginRight: 8,
  },
  nextButtonTextDisabled: { color: "#CCC" },
});
