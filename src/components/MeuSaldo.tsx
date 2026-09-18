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
import DefinirMetodoResgate from "./DefinirMetodoResgate";
import SacarSaldo from "./SacarSaldo";
import SaqueStatus from "./SaqueStatus";

const { width } = Dimensions.get("window");

interface props {
  visible: boolean;
  onClose: () => void;
  duration?: number;
}

export default function MeuSaldo({ visible, onClose, duration = 200 }: props) {
  const translateX = useRef(new Animated.Value(width)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const [isMounted, setIsMounted] = useState(visible);

  const [sacarSaldo, setSacarSaldo] = useState(false);
  const [saqueStatus, setSaqueStatus] = useState(false);
  const [visibleDefinirMetodoResgate, setVisibleDefinirMetodoResgate] =
    useState(false);

  const mostrarSacarSaldo = () => {
    setSacarSaldo(true);
  };

  const mostrarDefinirMetodoResgate = () => {
    console.log("mostrarDefinirMetodoResgate");
    setVisibleDefinirMetodoResgate(true);
  };

  const mostrarSaqueStatus = () => {
    // toggleConfirm(false);
    setSaqueStatus(true);
  };

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

  // Mock de transações baseado na imagem
  const transacoes = [
    {
      id: 1,
      tipo: "Pop",
      hora: "08:15",
      valor: "R$8,56",
      cor: "#E67E22",
      icon: "car",
    },
    {
      id: 2,
      tipo: "Pop",
      hora: "08:02-PIX",
      valor: "R$17,10",
      cor: "#E67E22",
      icon: "dots-horizontal-circle",
    },
    {
      id: 3,
      tipo: "Pop",
      hora: "08:02-Dinheiro",
      valor: "R$5,10",
      cor: "#E67E22",
      icon: "car",
    },
    {
      id: 4,
      tipo: "Pop",
      hora: "07:30-Dinheiro",
      valor: "-R$0,62",
      cor: "#111",
      icon: "car",
    },
    {
      id: 5,
      tipo: "Corra e ganhe",
      hora: "03:12",
      valor: "R$4,00",
      cor: "#E67E22",
      icon: "gift",
    },
    {
      id: 6,
      tipo: "Pop",
      hora: "08:15",
      valor: "R$8,56",
      cor: "#E67E22",
      icon: "car",
    },
    {
      id: 7,
      tipo: "Pop",
      hora: "08:02-PIX",
      valor: "R$17,10",
      cor: "#E67E22",
      icon: "dots-horizontal-circle",
    },
    {
      id: 8,
      tipo: "Pop",
      hora: "08:02-Dinheiro",
      valor: "R$5,10",
      cor: "#E67E22",
      icon: "car",
    },
    {
      id: 9,
      tipo: "Pop",
      hora: "07:30-Dinheiro",
      valor: "-R$0,62",
      cor: "#111",
      icon: "car",
    },
    {
      id: 10,
      tipo: "Corra e ganhe",
      hora: "03:12",
      valor: "R$4,00",
      cor: "#E67E22",
      icon: "gift",
    },
  ];

  return (
    <>
      <View style={[StyleSheet.absoluteFill, { zIndex: 50 }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: "rgba(0,0,0,0.3)", opacity: overlayOpacity },
            ]}
          />
        </Pressable>

        <Animated.View style={[styles.drawer, { transform: [{ translateX }] }]}>
          {/* HEADER */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="chevron-back" size={28} color="#111" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Saldo</Text>
              <TouchableOpacity onPress={mostrarDefinirMetodoResgate}>
                <Text style={styles.headerRight}>Configurações</Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.container} bounces={false}>
            {/* SEÇÃO AMARELA - SALDO ATUAL */}
            <View style={styles.balanceCard}>
              <View style={styles.balanceInfo}>
                <Text style={styles.balanceValue}>R$130,52</Text>
                <View style={styles.regasRow}>
                  <Text style={styles.regasText}>Regras</Text>
                  <Ionicons
                    name="information-circle-outline"
                    size={16}
                    color="#999"
                    style={{ marginLeft: 4 }}
                  />
                </View>
                <Text style={styles.subText}>
                  Motoristas com Conta99: Resgate para Conta99 em até 1 minuto
                </Text>
              </View>

              <TouchableOpacity
                onPress={mostrarSacarSaldo}
                style={styles.btnResgatar}
              >
                <Text style={styles.btnResgatarText}>Resgatar</Text>
              </TouchableOpacity>

              {/* Ícone de Moeda de fundo (opcional para estética) */}
              <MaterialCommunityIcons
                name="currency-usd"
                size={120}
                color="rgba(255,215,0,0.1)"
                style={styles.bgIcon}
              />
            </View>

            {/* LISTA DE TRANSAÇÕES */}
            <View style={styles.listSection}>
              <TouchableOpacity style={styles.dateSelector}>
                <Text style={styles.dateText}>06-02-2026</Text>
                <Ionicons name="chevron-up" size={18} color="#CCC" />
              </TouchableOpacity>

              <View style={styles.transferenciaRow}>
                <Text style={styles.transferenciaLabel}>Transferência</Text>
                <Text style={styles.transferenciaValue}>R$0,00</Text>
              </View>

              {transacoes.map((item) => (
                <TouchableOpacity
                  onPress={mostrarSaqueStatus}
                  key={item.id}
                  style={styles.transactionItem}
                >
                  <View style={styles.itemLeft}>
                    <View style={styles.iconCircle}>
                      <MaterialCommunityIcons
                        name={item.icon as any}
                        size={22}
                        color="#444"
                      />
                    </View>
                    <View>
                      <Text style={styles.itemType}>{item.tipo}</Text>
                      <Text style={styles.itemTime}>{item.hora}</Text>
                    </View>
                  </View>
                  <View style={styles.itemRight}>
                    <Text
                      style={[
                        styles.itemValue,
                        {
                          color: item.valor.includes("-") ? "#111" : "#F39C12",
                        },
                      ]}
                    >
                      {item.valor}
                    </Text>
                    <Ionicons name="chevron-forward" size={18} color="#CCC" />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </Animated.View>
      </View>
      <SacarSaldo visible={sacarSaldo} onClose={() => setSacarSaldo(false)} />
      <SaqueStatus
        visible={saqueStatus}
        onClose={() => setSaqueStatus(false)}
      />
      <DefinirMetodoResgate
        visible={visibleDefinirMetodoResgate}
        onClose={() => setVisibleDefinirMetodoResgate(false)}
      />
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
  headerRight: {
    fontSize: 15,
    color: "#666",
  },
  container: {
    flex: 1,
  },
  balanceCard: {
    backgroundColor: "#FFFDED", // Amarelo bem claro conforme imagem
    padding: 20,
    paddingTop: 10,
    position: "relative",
    overflow: "hidden",
  },
  balanceInfo: {
    zIndex: 2,
  },
  balanceValue: {
    fontSize: 34,
    fontWeight: "800",
    color: "#111",
  },
  regasRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  regasText: {
    fontSize: 14,
    color: "#666",
  },
  subText: {
    fontSize: 13,
    color: "#999",
    marginTop: 4,
    width: "80%",
    lineHeight: 18,
  },
  btnResgatar: {
    backgroundColor: "#FFD700", // Amarelo 99
    borderRadius: 8,
    height: 54,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 25,
    zIndex: 2,
  },
  btnResgatarText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
  },
  bgIcon: {
    position: "absolute",
    right: -20,
    top: -10,
    zIndex: 1,
  },
  listSection: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  dateSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  dateText: {
    fontSize: 14,
    color: "#999",
  },
  transferenciaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 25,
  },
  transferenciaLabel: {
    fontSize: 16,
    color: "#999",
  },
  transferenciaValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
  },
  transactionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  itemType: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  itemTime: {
    fontSize: 13,
    color: "#999",
    marginTop: 2,
  },
  itemRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  itemValue: {
    fontSize: 16,
    fontWeight: "700",
    marginRight: 5,
  },
});
