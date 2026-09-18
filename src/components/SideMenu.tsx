import { useAuth } from "@/context/AuthProvider";
import { AnimationConfig, useSlideAnimation } from "@/hooks/useSlideAnimation";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Text } from "@/components/common/Texto";
import {
  Animated,
  BackHandler,
  Image,
  PanResponder,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import CentralAjuda from "./CentralAjuda";
import CentralGanhos from "./CentralGanhos";
import ConvidarMotorista from "./ConvidarMotorista";
import HistoricoMensagens from "./HistoricoMensagens";
import Preferencias from "./Preferencias";
import HorasDirigindo from "./usuario/HorasDirigindo";
import MeusVeiculos from "./usuario/MeusVeiculos";
import PerfilUsuario from "./usuario/PerfilUsuario";
interface SideMenuProps {
  visible: boolean;
  onClose: () => void;
  drawerWidth: number;
  animationConfig?: AnimationConfig;
  menuItems?: MenuItem[];
  showOverlay?: boolean;
  enableSwipeGesture?: boolean;
}

interface MenuItem {
  icon: string;
  label: string;
  onPress?: () => void;
  color?: string;
}

const defaultMenuItems: MenuItem[] = [
  { icon: "time-outline", label: "Ganhos" },
  { icon: "time-outline", label: "Indique um amigo" },
  { icon: "chatbubble-outline", label: "Notificações" },
  { icon: "shield-checkmark-outline", label: "Central de Ajuda" },
  { icon: "card-outline", label: "Veículo" },
  { icon: "card-outline", label: "Horas dirigindo" },
  { icon: "settings-outline", label: "Preferências" },
];

export default function SideMenu({
  visible,
  onClose,
  drawerWidth,
  animationConfig = {},
  menuItems = defaultMenuItems,
  showOverlay = true,
  enableSwipeGesture = true,
}: SideMenuProps) {
  const { user, logout } = useAuth();
  const { translateX, overlayOpacity, closeAnimation } = useSlideAnimation(
    visible,
    drawerWidth,
    animationConfig,
  );

  const [isMounted, setIsMounted] = useState(visible);
  const [showHistoricoMensagens, setShowHistoricoMensagens] = useState(false);
  const [showCentralAjuda, setShowCentralAjuda] = useState(false);
  const [showPefilUsuario, setShowPerfilUsuario] = useState(false);
  const [showMeusVeiculos, setShowMeusVeiculos] = useState(false);
  const [showConvidarMotorista, setShowConvidarMotorista] = useState(false);
  const [showHorasDirigindo, setShowHorasDirigindo] = useState(false);
  const [showCentralGannhos, setShowCentralGannhos] = useState(false);
  const [showPreferencias, setShowPreferencias] = useState(false);

  const handleDisconnect = () => {};

  const closeMenu = useCallback(() => {
    closeAnimation(onClose);
  }, [closeAnimation, onClose]);

  useEffect(() => {
    // Se o dialog estiver aberto, fecha
    const onBackPress = () => {
      if (showPreferencias) {
        setShowPreferencias(false);
        return true;
      }
      if (showCentralGannhos) {
        setShowCentralGannhos(false);
        return true;
      }
      if (showPefilUsuario) {
        setShowPerfilUsuario(false);
        return true;
      }
      if (showConvidarMotorista) {
        setShowConvidarMotorista(false);
        return true;
      }
      if (showHorasDirigindo) {
        setShowHorasDirigindo(false);
        return true;
      }
      if (showHistoricoMensagens) {
        setShowHistoricoMensagens(false);
        return true;
      }
      if (showCentralAjuda) {
        setShowCentralAjuda(false);
        return true;
      }
      if (showMeusVeiculos) {
        setShowMeusVeiculos(false);
        return true;
      }
      if (visible) {
        closeMenu();
        return true;
      }
      return false;
    };
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      onBackPress,
    );
    return () => subscription.remove();
  }, [visible, closeMenu]);

  useEffect(() => {
    if (visible) {
      setIsMounted(true);
    } else {
      const closeDelay = animationConfig?.duration ?? 300;
      const t = setTimeout(() => setIsMounted(false), closeDelay + 20);
      return () => clearTimeout(t);
    }
  }, [visible, animationConfig?.duration]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => enableSwipeGesture,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return enableSwipeGesture && Math.abs(gestureState.dx) > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0) translateX.setValue(gestureState.dx);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -50 || gestureState.vx < -0.5) {
          closeMenu();
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            damping: animationConfig.damping || 20,
            stiffness: animationConfig.stiffness || 90,
          }).start();
        }
      },
    }),
  ).current;

  const handleLogout = () => {
    closeMenu();
    setTimeout(() => logout(), 300);
  };

  const menuSelecionado = (item: MenuItem) => {
    if (item.label === "Indique um amigo") {
      setShowConvidarMotorista(true);
    }
    if (item.label === "Notificações") {
      setShowHistoricoMensagens(true);
    }
    if (item.label === "Central de Ajuda") {
      setShowCentralAjuda(true);
    }
    if (item.label === "Veículo") {
      setShowMeusVeiculos(true);
    }
    if (item.label === "Horas dirigindo") {
      setShowHorasDirigindo(true);
    }
    if (item.label === "Ganhos") {
      setShowCentralGannhos(true);
    }
    if (item.label === "Preferências") {
      setShowPreferencias(true);
    }
  };

  if (!isMounted) return null;

  return (
    <>
      <HistoricoMensagens
        visible={showHistoricoMensagens}
        onClose={() => setShowHistoricoMensagens(false)}
      />
      <CentralAjuda
        visible={showCentralAjuda}
        onClose={() => setShowCentralAjuda(false)}
      />
      <PerfilUsuario
        visible={showPefilUsuario}
        onClose={() => setShowPerfilUsuario(false)}
      />
      <MeusVeiculos
        visible={showMeusVeiculos}
        onClose={() => setShowMeusVeiculos(false)}
      />
      <ConvidarMotorista
        visible={showConvidarMotorista}
        onClose={() => setShowConvidarMotorista(false)}
      />
      <HorasDirigindo
        visible={showHorasDirigindo}
        onClose={() => setShowHorasDirigindo(false)}
      />
      <CentralGanhos
        visible={showCentralGannhos}
        onClose={() => setShowCentralGannhos(false)}
      />

      <Preferencias
        visible={showPreferencias}
        onClose={() => setShowPreferencias(false)}
        onDisconnect={handleDisconnect}
        buscandoCorrida={false}
      />

      <View style={[StyleSheet.absoluteFill, { zIndex: 20 }]}>
        {showOverlay && (
          <TouchableWithoutFeedback onPress={closeMenu}>
            <Animated.View
              style={[styles.overlay, { opacity: overlayOpacity }]}
            />
          </TouchableWithoutFeedback>
        )}

        <Animated.View
          style={[
            styles.sideMenu,
            {
              width: drawerWidth,
              transform: [{ translateX }],
            },
          ]}
          {...panResponder.panHandlers}
        >
          {/* HEADER DE PERFIL */}
          <View style={styles.profileSection}>
            <TouchableOpacity onPress={() => setShowPerfilUsuario(true)}>
              <Image
                source={{ uri: "https://i.pravatar.cc/150?img=1" }}
                style={styles.avatar}
              />
            </TouchableOpacity>

            <View style={styles.nameRow}>
              <Text style={styles.userName}>{user || "Diogo"}</Text>
              <Text style={styles.ratingText}> · 4,82 ★</Text>
            </View>

            <TouchableOpacity style={styles.statusBadge}>
              <View style={styles.badgeContent}>
                <Ionicons name="shield-checkmark" size={14} color="#FFF" />
                <Text style={styles.statusText}>Carro · Fase 3</Text>
                <Ionicons name="chevron-forward" size={14} color="#FFF" />
              </View>
              <View style={styles.notificationDot} />
            </TouchableOpacity>

            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>48%</Text>
                <Text style={styles.statLabel}>Taxa de Aceitação</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={styles.statValue}>78%</Text>
                <Text style={styles.statLabel}>Taxa de Finalização</Text>
              </View>
            </View>
          </View>

          <View style={styles.menuList}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.menuItem}
                onPress={() => menuSelecionado(item)}
              >
                <Text
                  style={[styles.menuText, item.color && { color: item.color }]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}

            {user && (
              <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
                <Text style={[styles.menuText, styles.logoutText]}>Sair</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "#000",
  },
  sideMenu: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "#fff",
    paddingTop: 40,
    elevation: 8,
  },
  profileSection: {
    alignItems: "center",
    paddingHorizontal: 18,
    marginBottom: 20,
  },
  avatar: {
    width: 85,
    height: 85,
    borderRadius: 42.5,
    marginBottom: 15,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  userName: {
    fontSize: 19,
    fontWeight: "bold",
    color: "#111",
  },
  ratingText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#111",
  },
  statusBadge: {
    backgroundColor: "#313663",
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 25,
  },
  badgeContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
  notificationDot: {
    position: "absolute",
    top: -2,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#FF4D4D",
    borderWidth: 1,
    borderColor: "#FFF",
  },
  statsRow: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-around",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  statBox: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: "100%",
    backgroundColor: "#EEE",
  },
  // LISTA DE ITENS
  menuList: {
    paddingHorizontal: 18,
    marginTop: 10,
  },
  menuItem: {
    paddingVertical: 12,
  },
  menuText: {
    fontSize: 22,
    color: "#111",
    fontWeight: "500",
  },
  logoutText: {
    color: "#FF4D4D",
  },
});
