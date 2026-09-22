import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Text } from "@/components/common/Texto";
import {
  Animated,
  BackHandler,
  Dimensions,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

interface props {
  visible: boolean;
  onClose: () => void;
  duration?: number;
  valorSaque?: string; // Prop opcional para passar o valor dinamicamente
}

export default function SaqueStatus({
  visible,
  onClose,
  duration = 200,
  valorSaque = "0,01",
}: props) {
  const insets = useSafeAreaInsets();
  const [translateX] = useState(() => new Animated.Value(width));
  const [overlayOpacity] = useState(() => new Animated.Value(0));
  const [isMounted, setIsMounted] = useState(visible);

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
    <View style={[StyleSheet.absoluteFill, { zIndex: 100 }]}>
      {/* Fundo escurecido da tela anterior */}
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: "rgba(0,0,0,0.25)", opacity: overlayOpacity },
          ]}
        />
      </Pressable>

      {/* Drawer deslizante */}
      <Animated.View
        style={[
          styles.drawer,
          {
            transform: [{ translateX }],
          },
        ]}
      >
        {/* HEADER */}
        <View
          style={[styles.header, { paddingTop: Math.max(insets.top + 12, 45) }]}
        >
          <View style={styles.headerContent}>
            <View style={styles.leftHeader}>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="chevron-back" size={26} color="#111" />
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} style={{ marginLeft: 15 }}>
                <Ionicons name="close" size={26} color="#111" />
              </TouchableOpacity>
            </View>
            <Text style={styles.headerTitle}>Status do saque</Text>
            <View style={{ width: 60 }} />
          </View>
        </View>

        {/* BODY */}
        <View style={styles.body}>
          {/* Seção de Status e Valor */}
          <View style={styles.statusSection}>
            <View style={styles.statusTextContainer}>
              <Text style={styles.processingText}>Processando</Text>
              <Text style={styles.mainAmount}>R${valorSaque}</Text>
              <Text style={styles.accountText}>Conta99</Text>
            </View>
            <View style={styles.bankIconContainer}>
              <Ionicons name="business-outline" size={24} color="#333" />
            </View>
          </View>

          {/* Timeline de Processamento */}
          <View style={styles.timelineContainer}>
            <View style={styles.timelineItem}>
              <View style={styles.timelineIndicator}>
                <View style={[styles.dot, styles.dotActive]} />
                <View style={[styles.line, styles.lineActive]} />
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineLabel}>Resgate iniciado</Text>
                <Text style={styles.timelineDate}>10/02/2026 10:35</Text>
              </View>
            </View>

            <View style={styles.timelineItem}>
              <View style={styles.timelineIndicator}>
                <View style={[styles.dot, styles.dotActive]} />
                <View style={styles.line} />
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineLabel}>Processamento bancário</Text>
                <Text style={styles.timelineDate}>10/02/2026 10:35</Text>
              </View>
            </View>

            <View style={styles.timelineItem}>
              <View style={styles.timelineIndicator}>
                <View style={styles.dot} />
              </View>
              <View style={styles.timelineContent}>
                {/* Espaço reservado para o próximo passo */}
              </View>
            </View>
          </View>

          {/* Rodapé com Detalhamento de Valores */}
          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>
                Valor solicitado para saque
              </Text>
              <Text style={styles.detailValue}>R${valorSaque}</Text>
            </View>
            <View style={styles.detailRow}>
              <View style={styles.labelWithIcon}>
                <Text style={styles.detailLabel}>Taxa de serviço</Text>
                <Ionicons
                  name="information-circle-outline"
                  size={16}
                  color="#ccc"
                  style={{ marginLeft: 4 }}
                />
              </View>
              <Text style={styles.detailValue}>- R$0,00</Text>
            </View>
            <View style={styles.separator} />
            <View style={styles.detailRow}>
              <Text style={styles.detailLabelBold}>Valor a receber</Text>
              <Text style={styles.detailValueBold}>R${valorSaque}</Text>
            </View>
          </View>
        </View>
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
    backgroundColor: "#fff", // Fundo branco conforme imagem
  },
  header: {
    backgroundColor: "#fff",
    paddingTop: 45,
    paddingBottom: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 0.6,
    borderBottomColor: "#e5e5e5",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  leftHeader: { flexDirection: "row", alignItems: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#111" },
  body: {
    flex: 1,
    backgroundColor: "#fff",
  },
  statusSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 20,
    alignItems: "flex-start",
  },
  statusTextContainer: {
    flex: 1,
  },
  processingText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FF6600", // Laranja do "Processando"
    marginBottom: 8,
  },
  mainAmount: {
    fontSize: 36,
    fontWeight: "700",
    color: "#111",
    marginBottom: 4,
  },
  accountText: {
    fontSize: 16,
    color: "#333",
  },
  bankIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  timelineContainer: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  timelineItem: {
    flexDirection: "row",
    minHeight: 50,
  },
  timelineIndicator: {
    alignItems: "center",
    width: 20,
    marginRight: 15,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#ddd",
    zIndex: 2,
  },
  dotActive: {
    backgroundColor: "#666",
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: "#eee",
    marginVertical: -2,
  },
  lineActive: {
    backgroundColor: "#eee",
  },
  timelineContent: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 20,
  },
  timelineLabel: {
    fontSize: 15,
    color: "#333",
    fontWeight: "500",
  },
  timelineDate: {
    fontSize: 14,
    color: "#999",
  },
  detailsContainer: {
    marginTop: "auto",
    borderTopWidth: 8,
    borderTopColor: "#f7f7f7",
    padding: 20,
    paddingBottom: 40,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  labelWithIcon: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 15,
    color: "#555",
  },
  detailValue: {
    fontSize: 15,
    color: "#111",
  },
  separator: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 5,
  },
  detailLabelBold: {
    fontSize: 16,
    color: "#111",
    fontWeight: "500",
  },
  detailValueBold: {
    fontSize: 16,
    color: "#111",
    fontWeight: "500",
  },
});
