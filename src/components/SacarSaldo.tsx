import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import { Text, TextInput } from "@/components/common/Texto";
import {
  Animated,
  BackHandler,
  Dimensions,
  Keyboard,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import SaqueStatus from "./SaqueStatus";

const { width, height } = Dimensions.get("window");

interface props {
  visible: boolean;
  onClose: () => void;
  duration?: number;
}

export default function SacarSaldo({
  visible,
  onClose,
  duration = 200,
}: props) {
  const insets = useSafeAreaInsets();
  const [translateX] = useState(() => new Animated.Value(width));
  const [overlayOpacity] = useState(() => new Animated.Value(0));
  const [slideConfirm] = useState(() => new Animated.Value(height));
  const [confirmOverlayOpacity] = useState(() => new Animated.Value(0));

  const [isMounted, setIsMounted] = useState(visible);
  const [valor, setValor] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [saqueStatus, setSaqueStatus] = useState(false);

  const toggleConfirm = useCallback(
    (show: boolean) => {
      if (show) {
        Keyboard.dismiss();
        setShowConfirm(true);
        Animated.parallel([
          Animated.timing(slideConfirm, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(confirmOverlayOpacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        Animated.parallel([
          Animated.timing(slideConfirm, {
            toValue: height,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(confirmOverlayOpacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(() => setShowConfirm(false));
      }
    },
    [confirmOverlayOpacity, slideConfirm],
  );

  const mostrarSaqueStatus = () => {
    toggleConfirm(false);
    setSaqueStatus(true);
  };

  const handleSaqueStatusClose = () => {
    setSaqueStatus(false);
    // Não fecha o SacarSaldo, apenas volta para ele
  };

  const handleDrawerClose = useCallback(() => {
    // Limpa os estados ao fechar
    setValor("");
    setShowConfirm(false);
    setSaqueStatus(false);
    onClose();
  }, [onClose]);

  useEffect(() => {
    const onBackPress = () => {
      if (showConfirm) {
        toggleConfirm(false);
        return true;
      }
      if (saqueStatus) {
        // Se SaqueStatus estiver aberto, fecha ele primeiro
        setSaqueStatus(false);
        return true;
      }
      if (visible) {
        handleDrawerClose();
        return true;
      }
      return false;
    };

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      onBackPress,
    );
    return () => subscription.remove();
  }, [
    visible,
    showConfirm,
    saqueStatus,
    onClose,
    toggleConfirm,
    handleDrawerClose,
  ]);

  useEffect(() => {
    if (visible) {
      setTimeout(() => setIsMounted(true), 0);
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
  }, [visible, duration, translateX, overlayOpacity]);

  if (!isMounted) return null;

  return (
    <>
      <SaqueStatus visible={saqueStatus} onClose={handleSaqueStatusClose} />
      <View style={[StyleSheet.absoluteFill, { zIndex: 60 }]}>
        {/* Overlay geral do drawer */}
        <Pressable style={StyleSheet.absoluteFill}>
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: "rgba(0,0,0,0.4)", opacity: overlayOpacity },
            ]}
          />
        </Pressable>

        {/* Drawer */}
        <Animated.View style={[styles.drawer, { transform: [{ translateX }] }]}>
          <View
            style={[
              styles.header,
              { paddingTop: Math.max(insets.top + 12, 45) },
            ]}
            onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
          >
            <View style={styles.headerContent}>
              <View style={styles.leftHeader}>
                <TouchableOpacity onPress={handleDrawerClose}>
                  <Ionicons name="chevron-back" size={26} color="#111" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleDrawerClose}
                  style={{ marginLeft: 15 }}
                >
                  <Ionicons name="close" size={26} color="#111" />
                </TouchableOpacity>
              </View>
              <Text style={styles.headerTitle}>Sacar</Text>
              <View style={{ width: 60 }} />
            </View>
          </View>

          {/* aqui Overlay apenas entre header e modal */}
          {showConfirm && !saqueStatus && (
            <Pressable
              style={[
                StyleSheet.absoluteFill,
                { top: headerHeight, zIndex: 5 },
              ]}
              onPress={() => toggleConfirm(false)}
            >
              <Animated.View
                style={[
                  StyleSheet.absoluteFill,
                  {
                    backgroundColor: "rgba(0,0,0,0.35)",
                    opacity: confirmOverlayOpacity,
                  },
                ]}
              />
            </Pressable>
          )}

          <View style={styles.body}>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionLabel}>Conta para saque</Text>
              <Text style={styles.sectionValue}>Conta99</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.resgateContainer}>
              <Text style={styles.resgateLabel}>Valor do resgate</Text>

              <View style={styles.inputWrapper}>
                <Text style={styles.currencyPrefix}>R$</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  keyboardType="numeric"
                  value={valor}
                  onChangeText={setValor}
                  placeholderTextColor="#999"
                />
                <TouchableOpacity onPress={() => setValor("161,67")}>
                  <Text style={styles.tudoText}>Tudo</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Saldo disponível</Text>
                <Text style={styles.infoValue}>R$161,67</Text>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.row}>
                  <Text style={styles.infoLabel}>Taxa de serviço</Text>
                  <Ionicons
                    name="information-circle-outline"
                    size={14}
                    color="#CCC"
                    style={{ marginLeft: 4 }}
                  />
                </View>
                <Text style={styles.infoValue}>- R$0</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>
                  Horário estimado do depósito
                </Text>
                <Text
                  style={[
                    styles.infoValue,
                    { textAlign: "right", flex: 1, color: "#00C853" },
                  ]}
                >
                  Obtenha fundos em 1 minuto
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.btnSacar, !valor && styles.btnDisabled]}
              disabled={!valor}
              onPress={() => toggleConfirm(true)}
            >
              <Text
                style={[styles.btnSacarText, !valor && styles.btnTextDisabled]}
              >
                Sacar
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* MODAL CONFIRMAÇÃO */}
        {showConfirm && (
          <Animated.View
            style={[
              styles.confirmModal,
              { transform: [{ translateY: slideConfirm }] },
            ]}
          >
            <View style={styles.confirmHeader}>
              <TouchableOpacity
                onPress={() => toggleConfirm(false)}
                style={styles.closeModalBtn}
              >
                <Ionicons name="close" size={28} color="#111" />
              </TouchableOpacity>
              <Text style={styles.confirmTitle}>Confirmação</Text>
            </View>

            <View style={styles.confirmBody}>
              <Text style={styles.confirmValueLabel}>Valor do resgate</Text>
              <Text style={styles.confirmValueLarge}>R${valor || "0,00"}</Text>

              <View style={styles.confirmDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Conta para saque</Text>
                  <Text style={styles.detailValue}>Conta99</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Taxa de serviço</Text>
                  <Text style={styles.detailValue}>R$0,00</Text>
                </View>
              </View>

              <View style={styles.alertBox}>
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={20}
                  color="#FF6600"
                />
                <Text style={styles.alertText}>
                  O valor deve chegar em sua conta em até 1 minuto.
                </Text>
              </View>
            </View>

            <View style={styles.confirmFooter}>
              <TouchableOpacity
                style={styles.btnConfirmarFinal}
                onPress={mostrarSaqueStatus}
              >
                <Text style={styles.btnConfirmarText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  drawer: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: "100%",
    backgroundColor: "#FFF",
  },
  header: {
    backgroundColor: "#fff",
    paddingTop: 45,
    paddingBottom: 15,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: "#EEE",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  leftHeader: { flexDirection: "row", alignItems: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#111" },
  body: { flex: 1 },
  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
  },
  sectionLabel: { fontSize: 16, fontWeight: "700" },
  sectionValue: { fontSize: 16 },
  divider: { height: 8, backgroundColor: "#F7F7F7" },
  resgateContainer: { padding: 20 },
  resgateLabel: { fontSize: 16, fontWeight: "700", marginBottom: 20 },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 70,
    marginBottom: 25,
  },
  currencyPrefix: { fontSize: 24, fontWeight: "700" },
  input: { flex: 1, fontSize: 32, fontWeight: "700" },
  tudoText: { fontSize: 16, color: "#FF6600", fontWeight: "700" },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  row: { flexDirection: "row", alignItems: "center" },
  infoLabel: { fontSize: 14, color: "#999" },
  infoValue: { fontSize: 14, color: "#666" },
  footer: { padding: 20, paddingBottom: 35 },
  btnSacar: {
    backgroundColor: "#FFD700",
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  btnDisabled: { backgroundColor: "#F5F5F5" },
  btnSacarText: { fontSize: 18, fontWeight: "700" },
  btnTextDisabled: { color: "#CCC" },

  confirmModal: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 35,
    zIndex: 20,
  },
  confirmHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  closeModalBtn: { padding: 4 },
  confirmTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
    marginRight: 32,
  },
  confirmBody: { padding: 24, alignItems: "center" },
  confirmValueLabel: { fontSize: 14, color: "#999", marginBottom: 8 },
  confirmValueLarge: {
    fontSize: 36,
    fontWeight: "800",
    marginBottom: 30,
  },
  confirmDetails: {
    width: "100%",
    backgroundColor: "#FAFAFA",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  detailLabel: { fontSize: 15, color: "#666" },
  detailValue: { fontSize: 15, fontWeight: "600" },
  alertBox: {
    flexDirection: "row",
    backgroundColor: "#FFF5EB",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    width: "100%",
  },
  alertText: {
    fontSize: 13,
    color: "#FF6600",
    marginLeft: 8,
    flex: 1,
  },
  confirmFooter: { paddingHorizontal: 20 },
  btnConfirmarFinal: {
    backgroundColor: "#FFD700",
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  btnConfirmarText: { fontSize: 18, fontWeight: "700" },
});
