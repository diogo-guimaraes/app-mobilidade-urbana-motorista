import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Text } from "@/components/common/Texto";
import {
  Animated,
  BackHandler,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import DetalhesVeiculo from "./DetalhesVeiculo";
import EscolherVeiculo from "./EscolherVeiculo";

const { width } = Dimensions.get("window");

interface props {
  visible: boolean;
  onClose: () => void;
  duration?: number;
}

export default function MeusVeiculos({
  visible,
  onClose,
  duration = 200,
}: props) {
  const insets = useSafeAreaInsets();
  const [translateX] = useState(() => new Animated.Value(width));
  const [overlayOpacity] = useState(() => new Animated.Value(0));
  const [isMounted, setIsMounted] = useState(visible);
  const [showDetalhesVeiculo, setShowDetalhesVeiculo] = useState(false);
  const [veiculoSelecionado, setVeiculoSelecionado] = useState<any>(null);
  const [showEscolherVeiculo, setShowEscolherVeiculo] = useState<any>(null);

  const mostrarDetalhes = (veiculo: object) => {
    setVeiculoSelecionado(veiculo);
    setShowDetalhesVeiculo(true);
  };

  const veiculos = [
    {
      id: "1",
      tipo: "POP",
      status: "Aprovado",
      placa: "NCQ-7483",
      modelo: "Chevrolet ONIX LT (FLEX)",
      imagem: "https://cdn-icons-png.flaticon.com/512/744/744465.png",
      ativo: true,
    },
    {
      id: "2",
      tipo: "POP",
      status: "Aprovado",
      placa: "ABC-1234",
      modelo: "Hyundai HB20 (FLEX)",
      ativo: false,
      imagem: "https://cdn-icons-png.flaticon.com/512/744/744465.png",
    },
    {
      id: "3",
      tipo: "MOTO",
      status: "Aprovado",
      placa: "XYZ-9090",
      modelo: "Honda CG 160",
      ativo: false,
      imagem: "https://cdn-icons-png.flaticon.com/512/1986/1986937.png",
    },
  ];

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

  const renderVeiculo = (item: any) => (
    <View key={item.id} style={styles.card}>
      {/* TOP */}
      <TouchableOpacity onPress={() => mostrarDetalhes(item)}>
        <View style={styles.cardTop}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.tipo}</Text>
          </View>
          <Text style={styles.status}>{item.status}</Text>
        </View>

        {/* CONTEÚDO */}
        <View style={styles.cardContent}>
          <View style={{ flex: 1 }}>
            <Text style={styles.placa}>{item.placa}</Text>
            <Text style={styles.modelo}>{item.modelo}</Text>

            {item.ativo && (
              <View style={styles.ativoRow}>
                <View style={styles.dot} />
                <Text style={styles.ativoText}>Veículo ativo</Text>
              </View>
            )}
          </View>
          <Image source={{ uri: item.imagem }} style={styles.image} />
        </View>
      </TouchableOpacity>
    </View>
  );

  return (
    <>
      <View style={[StyleSheet.absoluteFill, { zIndex: 30 }]}>
        {/* Overlay */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: "rgba(0,0,0,0.25)", opacity: overlayOpacity },
            ]}
          />
        </Pressable>

        {/* Drawer */}
        <Animated.View style={[styles.drawer, { transform: [{ translateX }] }]}>
          {/* HEADER */}
          <View
            style={[
              styles.header,
              { paddingTop: Math.max(insets.top + 12, 45) },
            ]}
          >
            <View style={styles.headerContent}>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="arrow-back-outline" size={26} color="#111" />
              </TouchableOpacity>

              <Text style={styles.headerTitle}>Veículo</Text>

              <View style={{ width: 26 }} />
            </View>
          </View>

          {/* BODY */}
          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {veiculos.map(renderVeiculo)}
          </ScrollView>

          {/* BOTÃO FIXO */}
          <View style={styles.footer}>
            <TouchableOpacity
              onPress={() => setShowEscolherVeiculo(true)}
              style={styles.button}
            >
              <Text style={styles.buttonText}>Adicionar</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
      <DetalhesVeiculo
        visible={showDetalhesVeiculo}
        onClose={() => setShowDetalhesVeiculo(false)}
        data={veiculoSelecionado}
      />
      <EscolherVeiculo
        visible={showEscolherVeiculo}
        onClose={() => setShowEscolherVeiculo(false)}
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
    backgroundColor: "#f7f7f7",
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

  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111",
  },

  body: {
    flex: 1,
    padding: 16,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },

  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  badge: {
    backgroundColor: "#eee",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },

  badgeText: {
    fontSize: 11,
    color: "#555",
    fontWeight: "600",
  },

  status: {
    fontSize: 12,
    color: "#2E7D32",
    fontWeight: "600",
  },

  cardContent: {
    flexDirection: "row",
    alignItems: "center",
  },

  placa: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
  },

  modelo: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },

  ativoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#2ECC71",
    marginRight: 6,
  },

  ativoText: {
    fontSize: 12,
    color: "#2ECC71",
    fontWeight: "600",
  },

  image: {
    width: 70,
    height: 40,
    resizeMode: "contain",
  },

  footer: {
    padding: 16,
    backgroundColor: "#fff",
  },

  button: {
    backgroundColor: "#FFD600",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },

  buttonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
  },
});
