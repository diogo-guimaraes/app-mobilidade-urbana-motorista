import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Text } from "@/components/common/Texto";
import {
  Animated,
  BackHandler,
  Dimensions,
  FlatList,
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
}

// Mock de dados baseado na imagem
const NOTIFICATIONS = [
  {
    id: "1",
    title: "Status perfeito!",
    message: "Você está pronto(a). Conecte-se para ac...",
    time: "12:02",
  },
  {
    id: "2",
    title: "Você conseguiu!",
    message: "Aumente sua Pontos da fase,Taxa de Fin...",
    time: "10:48",
  },
  {
    id: "3",
    title: "Status perfeito!",
    message: "Você está pronto(a). Conecte-se para ac...",
    time: "07:18",
  },
  {
    id: "4",
    title: "DIOGO GUIMARAES DE SOUZA, qu...",
    message: "Fala Motora! queremos saber a sua opini...",
    time: "Ontem 19:00",
  },
  {
    id: "5",
    title: "Status perfeito!",
    message: "Você está pronto(a). Conecte-se para ac...",
    time: "Ontem 18:44",
  },
  {
    id: "6",
    title: "Status perfeito!",
    message: "Você está pronto(a). Conecte-se para ac...",
    time: "Ontem 18:40",
  },
  {
    id: "8",
    title: "Novas áreas de alta demanda",
    message: "Preço dinâmico de x2 a apenas 4.616 m ...",
    time: "Ontem 18:38",
  },
  {
    id: "9",
    title: "Novas áreas de alta demanda",
    message: "Preço dinâmico de x2 a apenas 4.616 m ...",
    time: "Ontem 18:38",
  },
];

const FILTERS = ["Todos", "Ganhos", "Messages", "Car"];

export default function HistoricoMensagens({
  visible,
  onClose,
  duration = 200,
}: props) {
  const insets = useSafeAreaInsets();
  const [translateX] = useState(() => new Animated.Value(width));
  const [overlayOpacity] = useState(() => new Animated.Value(0));
  const [isMounted, setIsMounted] = useState(visible);
  const [activeFilter, setActiveFilter] = useState("Todos");

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
  }, [visible, translateX, overlayOpacity, duration]);

  if (!isMounted) return null;

  const renderNotification = ({
    item,
  }: {
    item: (typeof NOTIFICATIONS)[0];
  }) => (
    <TouchableOpacity style={styles.notificationItem}>
      <View style={styles.iconContainer}>
        <MaterialCommunityIcons
          name="numeric-9-plus-circle"
          size={32}
          color="#666"
        />
      </View>
      <View style={styles.textContent}>
        <Text style={styles.notifTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.notifMessage} numberOfLines={1}>
          {item.message}
        </Text>
        <Text style={styles.notifTime}>{item.time}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#CCC" />
    </TouchableOpacity>
  );

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 30 }]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: "rgba(0,0,0,0.25)", opacity: overlayOpacity },
          ]}
        />
      </Pressable>

      <Animated.View style={[styles.drawer, { transform: [{ translateX }] }]}>
        {/* HEADER PRINCIPAL */}
        <View
          style={[styles.header, { paddingTop: Math.max(insets.top + 12, 45) }]}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="chevron-back" size={28} color="#111" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Notificações</Text>
            <View style={{ width: 28 }} />
          </View>
        </View>

        {/* SUB-HEADER COM MENSAGENS E FILTROS */}
        <View style={styles.subHeader}>
          <View style={styles.messageSummary}>
            <Text style={styles.summaryText}>Mensagens (420 não lidas)</Text>
            <View style={styles.summaryActions}>
              <Ionicons
                name="checkmark-done-outline"
                size={20}
                color="#666"
                style={{ marginRight: 15 }}
              />
              <Ionicons name="options-outline" size={20} color="#666" />
            </View>
          </View>

          <FlatList
            data={FILTERS}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterList}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => setActiveFilter(item)}
                style={[
                  styles.filterTab,
                  activeFilter === item && styles.filterTabActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    activeFilter === item && styles.filterTextActive,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item}
          />
        </View>

        {/* LISTA DE NOTIFICAÇÕES */}
        <FlatList
          data={NOTIFICATIONS}
          renderItem={renderNotification}
          keyExtractor={(item) => item.id}
          style={styles.body}
          contentContainerStyle={{ paddingBottom: 20 }}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
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
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111",
  },
  subHeader: {
    backgroundColor: "#FFF",
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  messageSummary: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  summaryText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  summaryActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  filterList: {
    paddingHorizontal: 16,
    paddingVertical: 5,
  },
  filterTab: {
    paddingHorizontal: 22,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#EEE",
  },
  filterTabActive: {
    backgroundColor: "#FFF",
    borderColor: "#FF6B00", // Cor de destaque baseada no estilo 99
  },
  filterText: {
    fontSize: 14,
    color: "#666",
  },
  filterTextActive: {
    color: "#FF6B00",
    fontWeight: "600",
  },
  body: {
    flex: 1,
  },
  notificationItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FFF",
  },
  iconContainer: {
    marginRight: 15,
  },
  textContent: {
    flex: 1,
  },
  notifTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111",
    marginBottom: 2,
  },
  notifMessage: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  notifTime: {
    fontSize: 12,
    color: "#999",
  },
  separator: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginLeft: 65, // Alinha com o início do texto
  },
});
