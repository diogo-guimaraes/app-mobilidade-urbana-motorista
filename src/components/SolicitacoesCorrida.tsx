import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import { Text } from "@/components/common/Texto";
import {
  Animated,
  BackHandler,
  Dimensions,
  FlatList,
  Pressable,
  RefreshControl,
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

export default function SolicitacoesCorrida({
  visible,
  onClose,
  duration = 300,
}: props) {
  const translateX = useRef(new Animated.Value(width)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current; // 👈 controla o fade da lista

  const [isMounted, setIsMounted] = useState(visible);
  const [refreshing, setRefreshing] = useState(false);
  const [solicitacoes, setSolicitacoes] = useState(gerarSolicitacoes());

  // 👉 Gera novas solicitações simuladas
  function gerarSolicitacoes() {
    const cores = ["#003F44", "#1E1E1E", "#111", "#024E54", "#1C1C1C"];
    const valores = ["15,20", "16,10", "6,30", "18,50", "12,80"];
    return Array.from({ length: 3 }).map((_, i) => ({
      id: Math.random().toString(),
      tipo: "Pop",
      novo: true,
      valor: `R$${valores[Math.floor(Math.random() * valores.length)]}`,
      valorKm: `R$${(1.2 + Math.random() * 1.8).toFixed(2)}/km`,
      estrelas: (4.8 + Math.random() * 0.2).toFixed(2),
      corridas: Math.floor(Math.random() * 300),
      perfil: "Perfil Essencial",
      tempo: `${5 + Math.floor(Math.random() * 10)} min`,
      distancia: `${(1 + Math.random() * 5).toFixed(1)} km`,
      destino1: "Destino Aleatório 1",
      tempo2: `${10 + Math.floor(Math.random() * 8)} min`,
      distancia2: `${(3 + Math.random() * 6).toFixed(1)} km`,
      destino2: "Destino Aleatório 2",
      cor: cores[Math.floor(Math.random() * cores.length)],
    }));
  }

  // 🔄 Atualiza a lista simulando novas corridas
  const onRefresh = () => {
    setRefreshing(true);

    // Fade-out
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      // troca lista
      setSolicitacoes(gerarSolicitacoes());

      // Fade-in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start(() => setRefreshing(false));
    });
  };

  // 🔙 Botão voltar Android
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

  // 🎬 Animações de entrada e saída do drawer
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
      ]).start(({ finished }) => {
        if (finished) setIsMounted(false);
      });
    }
  }, [visible]);

  if (!isMounted) return null;

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 30 }]}>
      {/* Fundo escuro */}
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: "rgba(0,0,0,0.25)", opacity: overlayOpacity },
          ]}
        />
      </Pressable>

      {/* Drawer */}
      <Animated.View
        style={[
          styles.drawer,
          {
            transform: [{ translateX }],
            zIndex: 31,
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="arrow-back-outline" size={28} color="#111" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Solicitações</Text>
          <View style={{ width: 28 }} />
        </View>

        {/* Lista animada */}
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <FlatList
            data={solicitacoes}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={[styles.card, { backgroundColor: item.cor }]}>
                <View style={styles.cardHeader}>
                  <View style={styles.tipoContainer}>
                    <Text style={styles.tipoText}>{item.tipo}</Text>
                    {item.novo && <Text style={styles.novoBadge}>Novo</Text>}
                  </View>
                  <Ionicons
                    name="document-text-outline"
                    size={20}
                    color="#fff"
                  />
                </View>

                <View style={styles.valorContainer}>
                  <Text style={styles.valor}>{item.valor}</Text>
                  <Text style={styles.valorKm}>{item.valorKm}</Text>
                </View>

                <Text style={styles.info}>
                  ⭐ {item.estrelas} · {item.corridas} corridas · {item.perfil}
                </Text>

                <View style={{ marginTop: 8 }}>
                  <Text style={styles.destino}>
                    🕒 {item.tempo} ({item.distancia}) {item.destino1}
                  </Text>
                  <Text style={styles.destino}>
                    🕒 {item.tempo2} ({item.distancia2}) {item.destino2}
                  </Text>
                </View>

                <TouchableOpacity style={styles.escolherButton}>
                  <Text style={styles.escolherText}>Escolher</Text>
                </TouchableOpacity>
              </View>
            )}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#FFD84D"]}
                tintColor="#FFD84D"
              />
            }
          />
        </Animated.View>
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
    padding: 16,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 50,
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tipoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  tipoText: {
    color: "#00E0C6",
    fontWeight: "700",
  },
  novoBadge: {
    backgroundColor: "#00E0C6",
    color: "#003F44",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    fontSize: 11,
    fontWeight: "700",
  },
  valorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 4,
  },
  valor: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
    marginRight: 8,
  },
  valorKm: {
    color: "#A0FFA8",
    fontWeight: "700",
  },
  info: {
    color: "#A7A7A7",
    fontSize: 13,
  },
  destino: {
    color: "#D9D9D9",
    fontSize: 13,
    lineHeight: 18,
  },
  escolherButton: {
    backgroundColor: "#FFD84D",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 12,
  },
  escolherText: {
    color: "#000",
    fontWeight: "700",
    fontSize: 15,
  },
});
