import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { Text, TextInput } from "@/components/common/Texto";
import {
  Animated,
  BackHandler,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

interface props {
  visible: boolean;
  onClose: () => void;
  duration?: number;
}

export default function AdicionarMetodoResgateConta({
  visible,
  onClose,
  duration = 200,
}: props) {
  const translateX = useRef(new Animated.Value(width)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const [isMounted, setIsMounted] = useState(visible);

  // Estados do Formulário
  const [nome, setNome] = useState("Diogo Guimarães");
  const [sobrenome, setSobrenome] = useState("De Souza");
  const [cpf, setCpf] = useState("011.498.972-95");
  const [agencia, setAgencia] = useState("3430");
  const [agenciaDigito, setAgenciaDigito] = useState("0");
  const [conta, setConta] = useState("1646");
  const [contaDigito, setContaDigito] = useState("0");
  const [tipoConta, setTipoConta] = useState<"corrente" | "poupanca">(
    "poupanca",
  );
  const [smsCode, setSmsCode] = useState("");

  // Lógica de Validação: Verifica se todos os campos obrigatórios estão preenchidos
  const isFormValid =
    nome.trim().length > 0 &&
    sobrenome.trim().length > 0 &&
    cpf.trim().length >= 11 &&
    agencia.trim().length > 0 &&
    agenciaDigito.trim().length > 0 &&
    conta.trim().length > 0 &&
    contaDigito.trim().length > 0 &&
    smsCode.trim().length > 0;

  useEffect(() => {
    const onBackPress = () => {
      if (visible) {
        onClose();
        return true;
      }
      return false;
    };
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      onBackPress,
    );
    return () => subscription.remove();
  }, [visible, onClose]);

  useEffect(() => {
    if (visible) {
      setIsMounted(true);
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: 0,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: duration * 0.8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: width,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: duration * 0.8,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => finished && setIsMounted(false));
    }
  }, [visible, duration]);

  if (!isMounted) return null;

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 100 }]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: "rgba(0,0,0,0.25)", opacity: overlayOpacity },
          ]}
        />
      </Pressable>

      <Animated.View style={[styles.drawer, { transform: [{ translateX }] }]}>
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="chevron-back" size={26} color="#111" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Método de resgate</Text>
            <View style={{ width: 26 }} />
          </View>
        </View>

        {/* FORMULÁRIO */}
        <ScrollView
          style={styles.body}
          contentContainerStyle={{ paddingBottom: 50 }}
        >
          <Text style={styles.mainDescription}>
            Registre sua conta bancária para transferir seus ganhos
          </Text>

          <Text style={styles.warningText}>
            O nome e CPF/CNPJ informados devem obrigatoriamente corresponder ao
            beneficiário da conta
          </Text>

          {/* INPUTS DE IDENTIFICAÇÃO */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Primeiro nome & nome do meio</Text>
            <TextInput
              style={styles.input}
              value={nome}
              onChangeText={setNome}
              placeholder="Nome"
            />
            <View style={styles.line} />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Último Nome</Text>
            <TextInput
              style={styles.input}
              value={sobrenome}
              onChangeText={setSobrenome}
              placeholder="Sobrenome"
            />
            <View style={styles.line} />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>CPF/CNPJ</Text>
            <TextInput
              style={styles.input}
              value={cpf}
              onChangeText={setCpf}
              keyboardType="numeric"
              placeholder="000.000.000-00"
            />
            <View style={styles.line} />
          </View>

          <TouchableOpacity style={styles.inputGroup}>
            <Text style={styles.label}>Banco</Text>
            <View style={styles.rowBetween}>
              <Text style={styles.bankValue}>104 - CAIXA ECONÔMICA</Text>
              <Ionicons name="caret-forward" size={14} color="#111" />
            </View>
            <View style={styles.line} />
          </TouchableOpacity>

          <Text style={styles.subNote}>
            Não esqueça de preencher o dígito, se tiver.
          </Text>

          {/* AGÊNCIA E CONTA */}
          <View style={styles.rowInputs}>
            <View style={[styles.inputGroup, { flex: 3, marginRight: 20 }]}>
              <Text style={styles.label}>Agência</Text>
              <TextInput
                style={styles.inputBold}
                value={agencia}
                onChangeText={setAgencia}
                keyboardType="numeric"
                maxLength={5}
              />
              <View style={styles.line} />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Dígito</Text>
              <TextInput
                style={styles.inputBold}
                value={agenciaDigito}
                onChangeText={setAgenciaDigito}
                maxLength={2}
              />
              <View style={styles.line} />
            </View>
          </View>

          <View style={styles.rowInputs}>
            <View style={[styles.inputGroup, { flex: 3, marginRight: 20 }]}>
              <Text style={styles.label}>Conta</Text>
              <TextInput
                style={styles.inputBold}
                value={conta}
                onChangeText={setConta}
                keyboardType="numeric"
                maxLength={12}
              />
              <View style={styles.line} />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Dígito</Text>
              <TextInput
                style={styles.inputBold}
                value={contaDigito}
                onChangeText={setContaDigito}
                maxLength={2}
              />
              <View style={styles.line} />
            </View>
          </View>

          {/* TIPO DE CONTA */}
          <TouchableOpacity
            style={styles.radioRow}
            onPress={() => setTipoConta("corrente")}
          >
            <Ionicons
              name={
                tipoConta === "corrente"
                  ? "checkmark-circle"
                  : "ellipse-outline"
              }
              size={24}
              color={tipoConta === "corrente" ? "#111" : "#ccc"}
            />
            <View style={styles.radioLabelContainer}>
              <Text style={styles.radioTitle}>Conta corrente</Text>
              <Text style={styles.radioSub}>Conta Corrente PF - 001</Text>
              <Text style={styles.radioSub}>Conta Caixa Fácil - 023</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.radioRow}
            onPress={() => setTipoConta("poupanca")}
          >
            <Ionicons
              name={
                tipoConta === "poupanca"
                  ? "checkmark-circle"
                  : "ellipse-outline"
              }
              size={24}
              color={tipoConta === "poupanca" ? "#111" : "#ccc"}
            />
            <View style={styles.radioLabelContainer}>
              <Text style={styles.radioTitle}>Conta poupança</Text>
              <Text style={styles.radioSub}>Poupança PJ/PF - 013</Text>
            </View>
          </TouchableOpacity>

          {/* VERIFICAÇÃO SMS */}
          <View style={styles.smsContainer}>
            <Text style={styles.smsLabel}>Código de verificação por SMS</Text>
            <View style={styles.rowBetween}>
              <TextInput
                placeholder="Código"
                style={styles.smsInput}
                keyboardType="numeric"
                value={smsCode}
                onChangeText={setSmsCode}
                maxLength={6}
              />
              <TouchableOpacity>
                <Text style={styles.sendText}>Enviar</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.line} />
          </View>

          {/* BOTÃO ADICIONAR (Habilitado apenas se isFormValid for true) */}
          <TouchableOpacity
            style={[styles.btnAdd, isFormValid && styles.btnAddActive]}
            disabled={!isFormValid}
            onPress={() => console.log("Conta Adicionada")}
          >
            <Text
              style={[
                styles.btnAddText,
                isFormValid && styles.btnAddTextActive,
              ]}
            >
              Adicionar conta
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  drawer: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: "100%",
    backgroundColor: "#fff",
  },
  header: {
    backgroundColor: "#fff",
    paddingTop: 45,
    paddingBottom: 10,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: { fontSize: 17, fontWeight: "500", color: "#111" },
  body: { flex: 1, paddingHorizontal: 20 },
  mainDescription: {
    fontSize: 20,
    fontWeight: "500",
    color: "#333",
    marginTop: 20,
    lineHeight: 26,
  },
  warningText: {
    fontSize: 14,
    color: "#999",
    marginTop: 15,
    marginBottom: 20,
    lineHeight: 18,
  },
  inputGroup: { marginTop: 20 },
  label: { fontSize: 14, color: "#999", marginBottom: 5 },
  input: { fontSize: 18, fontWeight: "700", color: "#111", paddingVertical: 2 },
  inputBold: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
    paddingVertical: 2,
  },
  bankValue: { fontSize: 18, fontWeight: "700", color: "#000" },
  line: { height: 1, backgroundColor: "#eee", marginTop: 5 },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  subNote: { fontSize: 13, color: "#333", marginTop: 20 },
  rowInputs: { flexDirection: "row" },
  radioRow: { flexDirection: "row", alignItems: "flex-start", marginTop: 30 },
  radioLabelContainer: { marginLeft: 15 },
  radioTitle: { fontSize: 15, color: "#999", marginBottom: 4 },
  radioSub: { fontSize: 14, color: "#666", fontWeight: "500" },
  smsContainer: { marginTop: 40, marginBottom: 30 },
  smsLabel: { fontSize: 18, color: "#999", marginBottom: 10 },
  smsInput: { flex: 1, fontSize: 18, paddingVertical: 5 },
  sendText: { color: "#FF6600", fontSize: 16, fontWeight: "600" },
  btnAdd: {
    backgroundColor: "#F0F0F0",
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  btnAddActive: { backgroundColor: "#FFD700" },
  btnAddText: { color: "#CCC", fontSize: 18, fontWeight: "700" },
  btnAddTextActive: { color: "#111" },
});
