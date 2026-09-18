import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { Text } from "@/components/common/Texto";
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

export default function HistoricoCorridasDetalhes({
  visible,
  onClose,
  duration = 250,
}: props) {
  const translateX = useRef(new Animated.Value(width)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
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
  }, [visible, translateX, overlayOpacity, duration]);

  if (!isMounted) return null;

  const InfoRow = ({ label, value, bold = false, color = "#111" }: any) => (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text
        style={[styles.infoValue, { color, fontWeight: bold ? "700" : "400" }]}
      >
        {value}
      </Text>
    </View>
  );

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 100 }]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: "rgba(0,0,0,0.4)", opacity: overlayOpacity },
          ]}
        />
      </Pressable>

      <Animated.View style={[styles.drawer, { transform: [{ translateX }] }]}>
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={onClose} hitSlop={15}>
              <Ionicons name="chevron-back" size={28} color="#111" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Detalhes da corrida</Text>
            <View style={{ width: 28 }} />
          </View>
        </View>

        <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
          {/* VALOR PRINCIPAL */}
          <View style={styles.topSection}>
            <Text style={styles.labelGanhos}>Você ganhou</Text>
            <Text style={styles.mainValue}>R$12,50</Text>

            <View style={styles.statsContainer}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Duração</Text>
                <Text style={styles.statValue}>18m26s</Text>
              </View>
              <View style={styles.dividerVertical} />
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Distância</Text>
                <Text style={styles.statValue}>6,6 km</Text>
              </View>
            </View>
          </View>

          {/* DETALHES GERAIS */}
          <View style={styles.section}>
            <InfoRow label="Tipo de corrida" value="Pop" />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Método de pagamento</Text>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <MaterialCommunityIcons
                  name="cash-multiple"
                  size={18}
                  color="#007AFF"
                  style={{ marginRight: 4 }}
                />
                <Text style={styles.infoValue}>Dinheiro</Text>
              </View>
            </View>
            <InfoRow label="Dinheiro recebido" value="R$15,40" />
          </View>

          {/* SEUS GANHOS */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Seus ganhos</Text>
            <InfoRow label="Valor da corrida" value="R$10,40" />
            <InfoRow label="Tarifa base" value="R$2,10" />
            <View style={styles.separator} />
            <InfoRow label="Total" value="R$12,50" bold />
          </View>

          {/* PAGO PELO PASSAGEIRO */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pago pelo(a) passageiro(a)</Text>
            <InfoRow label="Pago por esta corrida" value="R$15,40" />
            <InfoRow label="Valor da corrida" value="R$15,40" />
            <View style={styles.separator} />
            <View style={styles.infoRow}>
              <Text
                style={[styles.infoLabel, { fontWeight: "700", color: "#111" }]}
              >
                Total
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <MaterialCommunityIcons
                  name="cash-multiple"
                  size={18}
                  color="#007AFF"
                  style={{ marginRight: 4 }}
                />
                <Text style={[styles.infoValue, { fontWeight: "700" }]}>
                  R$15,40
                </Text>
              </View>
            </View>
          </View>

          {/* TAXA 99 */}
          <View style={styles.section}>
            <InfoRow label="Total" value="-R$2,90" bold />
            <View style={styles.taxaContainer}>
              <Text style={styles.taxaLabel}>Percentual da Taxa99</Text>
              <Text style={styles.taxaValue}>18,83%</Text>
            </View>
            <Text style={styles.taxaDesc}>
              =Recebido pela 99/Pago pelo(a) passageiro(a)
            </Text>
            <Text style={styles.taxaDesc}>=R$2,90/R$15,40</Text>
          </View>

          {/* DADOS DA CORRIDA / PASSAGEIRA */}
          <View style={[styles.section, { marginBottom: 40 }]}>
            <Text style={styles.sectionTitle}>Detalhes da corrida</Text>
            <View style={styles.passengerRow}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={20} color="#999" />
              </View>
              <View>
                <Text style={styles.passengerName}>Jessica</Text>
                <Text style={styles.dateText}>04/02/2026 13:54:31</Text>
              </View>
            </View>

            <View style={styles.addressContainer}>
              <View style={styles.timeline}>
                <View style={[styles.dot, { backgroundColor: "#00C853" }]} />
                <View style={styles.line} />
                <View style={[styles.dot, { backgroundColor: "#FF6D00" }]} />
              </View>
              <View style={styles.addresses}>
                <Text style={styles.addressText} numberOfLines={2}>
                  Rua Jerônimo de Ornelas, Nova Caiari II, Porto Velho, RO,
                  Brasil
                </Text>
                <Text
                  style={[styles.addressText, { marginTop: 20 }]}
                  numberOfLines={2}
                >
                  Espaço Revendedor Grupo Boticário, Rua Salgado Filho, 2446 -
                  São Cristóvão...
                </Text>
              </View>
            </View>
          </View>
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
    backgroundColor: "#FFF",
  },
  header: {
    backgroundColor: "#fff",
    paddingTop: 45,
    paddingBottom: 15,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "#111",
  },
  body: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  topSection: {
    alignItems: "center",
    paddingVertical: 30,
    borderBottomWidth: 8,
    borderBottomColor: "#F8F8F8",
  },
  labelGanhos: {
    fontSize: 15,
    color: "#666",
    marginBottom: 5,
  },
  mainValue: {
    fontSize: 42,
    fontWeight: "800",
    color: "#111",
    marginBottom: 25,
  },
  statsContainer: {
    flexDirection: "row",
    width: "100%",
    paddingHorizontal: 20,
  },
  statBox: {
    flex: 1,
    alignItems: "center",
  },
  statLabel: {
    fontSize: 14,
    color: "#999",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "600",
    color: "#333",
  },
  dividerVertical: {
    width: 1,
    height: "100%",
    backgroundColor: "#EEE",
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    alignItems: "center",
  },
  infoLabel: {
    fontSize: 15,
    color: "#555",
    flex: 1,
  },
  infoValue: {
    fontSize: 15,
    color: "#111",
    textAlign: "right",
  },
  separator: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginVertical: 12,
  },
  taxaContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  taxaLabel: {
    fontSize: 16,
    color: "#111",
  },
  taxaValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
  },
  taxaDesc: {
    fontSize: 13,
    color: "#999",
    marginTop: 2,
  },
  passengerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 25,
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  passengerName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111",
  },
  dateText: {
    fontSize: 14,
    color: "#999",
  },
  addressContainer: {
    flexDirection: "row",
    paddingLeft: 5,
  },
  timeline: {
    alignItems: "center",
    marginRight: 15,
    paddingVertical: 5,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  line: {
    width: 1,
    height: 40,
    backgroundColor: "#EEE",
    marginVertical: 4,
  },
  addresses: {
    flex: 1,
  },
  addressText: {
    fontSize: 14,
    color: "#444",
    lineHeight: 20,
  },
});
