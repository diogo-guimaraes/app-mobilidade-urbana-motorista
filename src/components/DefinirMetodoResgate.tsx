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

type Metodo = "conta99" | "pix" | "banco";

export default function DefinirMetodoResgate({
  visible,
  onClose,
  duration = 200,
}: props) {
  const translateX = useRef(new Animated.Value(width)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const [isMounted, setIsMounted] = useState(visible);

  // Estado para controlar qual método está selecionado conforme a imagem
  const [selecionado, setSelecionado] = useState<Metodo>("pix");

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

  const renderOption = (
    id: Metodo,
    title: string,
    description: string,
    icon: any,
    iconColor: string,
    tag?: string,
  ) => (
    <TouchableOpacity
      style={styles.optionContainer}
      onPress={() => setSelecionado(id)}
      activeOpacity={0.7}
    >
      <View style={[styles.iconCircle, { backgroundColor: iconColor }]}>
        {icon}
      </View>

      <View style={styles.optionTextContainer}>
        <View style={styles.titleRow}>
          <Text style={styles.optionTitle}>{title}</Text>
          {tag && (
            <View style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          )}
        </View>
        <Text style={styles.optionDescription}>{description}</Text>
      </View>

      <View style={styles.radioOuter}>
        {selecionado === id && <View style={styles.radioInner} />}
      </View>
    </TouchableOpacity>
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
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="chevron-back" size={24} color="#333" />
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.body} bounces={false}>
          <Text style={styles.mainTitle}>Definir método de resgate</Text>
          <Text style={styles.mainSubtitle}>
            Os resgates serão processados usando o método escolhido, sujeito às
            regras sobre horários de depósito, taxas de serviço e requisitos
            mínimos de resgate.
          </Text>

          {/* OPÇÕES DE RESGATE */}
          {renderOption(
            "conta99",
            "Conta99",
            "Receba transferências diárias gratuitamente em sua conta em segundos",
            <MaterialCommunityIcons
              name="wallet-outline"
              size={22}
              color="#fff"
            />,
            "#ff6600",
            "Recomendado",
          )}

          {renderOption(
            "pix",
            "Chave Pix",
            "Receba transferências automáticas no seu cartão toda quarta-feira. Você receberá os ganhos em 1 ou 2 dias úteis.",
            <Ionicons name="qr-code-outline" size={20} color="#fff" />,
            "#2db089",
          )}

          {renderOption(
            "banco",
            "Saque por transferência bancária",
            "Receba transferências automáticas no seu cartão toda quarta-feira. Você receberá os ganhos em 1 ou 2 dias úteis.",
            <MaterialCommunityIcons
              name="currency-usd"
              size={22}
              color="#fff"
            />,
            "#ff6600",
          )}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  drawer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  body: {
    flex: 1,
    paddingHorizontal: 20,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#000",
    marginTop: 10,
    marginBottom: 10,
  },
  mainSubtitle: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 30,
  },
  // OPÇÕES
  optionContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 30,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  optionTextContainer: {
    flex: 1,
    marginLeft: 15,
    paddingRight: 10,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  optionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#000",
  },
  tag: {
    backgroundColor: "#e8f9f2",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  tagText: {
    color: "#2db089",
    fontSize: 11,
    fontWeight: "600",
  },
  optionDescription: {
    fontSize: 13,
    color: "#999",
    lineHeight: 18,
  },
  // RADIO BUTTON
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#ddd",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 5,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#000",
  },
});
