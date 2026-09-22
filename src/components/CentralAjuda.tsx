import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
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

export default function CentralAjuda({
  visible,
  onClose,
  duration = 200,
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

  const renderTopic = (icon: any, title: string) => (
    <View style={styles.topicItem}>
      <View style={styles.topicIconRow}>
        <Ionicons name={icon} size={22} color="#333" />
        <Text style={styles.topicText}>{title}</Text>
      </View>
      <Text style={styles.emBreve}>Em breve</Text>
    </View>
  );

  return (
    <>
      <View style={[StyleSheet.absoluteFill, { zIndex: 30 }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: "rgba(0,0,0,0.3)", opacity: overlayOpacity },
            ]}
          />
        </Pressable>

        <Animated.View style={[styles.drawer, { transform: [{ translateX }] }]}>
          {/* HEADER FIXO */}
          <View
            style={[
              styles.header,
              { paddingTop: Math.max(insets.top + 12, 50) },
            ]}
          >
            <TouchableOpacity onPress={onClose} style={styles.backButton}>
              <Ionicons name="chevron-back" size={28} color="#333" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Central de Ajuda</Text>
          </View>

          <ScrollView
            style={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            stickyHeaderIndices={[1]}
          >
            {/* BANNER SUPERIOR */}
            <View style={styles.bannerContainer}>
              <Text style={styles.bannerText}>Como podemos ajudar?</Text>
              <Ionicons name="help-circle-outline" size={54} color="#FF7A45" />
            </View>

            {/* ABAS (TABS) */}
            <View style={styles.tabsWrapper}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.tabsScroll}
              >
                <View style={[styles.tabItem, styles.tabItemActive]}>
                  <Text style={[styles.tabText, styles.tabTextActive]}>
                    Corridas
                  </Text>
                </View>
              </ScrollView>
            </View>

            <View style={styles.contentPadding}>
              {/* TODOS OS TÓPICOS */}
              <Text
                style={[
                  styles.sectionTitle,
                  { marginTop: 25, marginBottom: 15 },
                ]}
              >
                Todos os tópicos
              </Text>

              <View style={styles.searchBar}>
                <Ionicons name="search" size={20} color="#bbb" />
                <TextInput
                  placeholder="Pesquisar artigos de ajuda"
                  style={styles.searchInput}
                  placeholderTextColor="#bbb"
                />
              </View>

              <View style={styles.topicsList}>
                {renderTopic(
                  "cash-outline",
                  "Revisar minha tarifa de pagamento",
                )}
                {renderTopic("location-outline", "Suporte com minhas corridas")}
                {renderTopic("grid-outline", "Registro")}
                {renderTopic(
                  "information-circle-outline",
                  "Informações sobre regras e tarifas",
                )}
                {renderTopic("person-outline", "Minha conta")}
                {renderTopic("heart-outline", "Segurança e Emergências")}
              </View>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  drawer: { flex: 1, backgroundColor: "#f6f6f6" },
  scrollContainer: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 15,
    backgroundColor: "#fff",
  },
  backButton: { marginRight: 15 },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#333" },
  emBreve: { color: "#999", fontSize: 12 },

  bannerContainer: {
    height: 100,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  bannerText: { fontSize: 18, fontWeight: "600", color: "#333", width: "60%" },
  bannerImage: { width: 80, height: 80, resizeMode: "contain" },

  tabsWrapper: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  tabsScroll: { paddingHorizontal: 15 },
  tabItem: {
    paddingVertical: 12,
    marginRight: 25,
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
  },
  tabItemActive: { borderBottomColor: "#ff7a45" },
  tabText: { fontSize: 16, color: "#777", fontWeight: "600" },
  tabTextActive: { color: "#111" },

  contentPadding: { padding: 16, paddingBottom: 50 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#111" },

  cardAndamento: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    elevation: 1,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  cardItemTitle: { fontSize: 15, fontWeight: "700", color: "#333", flex: 1 },
  cardDate: { fontSize: 12, color: "#999", marginRight: 5 },
  cardSubtitle: { fontSize: 14, color: "#666" },

  selectTripRow: { flexDirection: "row", alignItems: "center" },
  selectTripText: { fontSize: 14, color: "#999", marginRight: 4 },

  cardConcluida: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    elevation: 1,
  },
  tripHeader: { marginBottom: 15 },
  tripType: { fontSize: 15, fontWeight: "800", color: "#111" },
  tripTime: { fontWeight: "400", color: "#666", fontSize: 14 },
  addressRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  addressText: { fontSize: 13, color: "#444", flex: 1 },

  lostItemRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  lostIconBG: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#eafff8",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  lostText: { fontSize: 14, color: "#333", fontWeight: "500" },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 25,
    paddingHorizontal: 15,
    height: 45,
    marginBottom: 20,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: "#333" },

  topicsList: { backgroundColor: "#fff", borderRadius: 20, overflow: "hidden" },
  topicItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },
  topicIconRow: { flexDirection: "row", alignItems: "center" },
  topicText: { fontSize: 15, color: "#333", fontWeight: "600", marginLeft: 15 },
});
