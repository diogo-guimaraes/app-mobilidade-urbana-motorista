import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import { Text } from "@/components/common/Texto";
import {
  Animated,
  BackHandler,
  Dimensions,
  FlatList,
  ListRenderItem,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import ConfigurarSolicitacoes from "./ConfigurarSolicitacoes";
import DefinirDestino from "./DefinirDestino";
import MetodosPagamento from "./MetodosPagamento";
import PreferenciasNavegacao from "./PreferenciasNavegacao";
import PreferenciasSomVoz from "./PreferenciasSomVoz";

const { width } = Dimensions.get("window");

// 👉 DEFINIÇÃO DA INTERFACE PARA O ITEM DE ENDEREÇO
interface AddressItem {
  id: string;
  address: string;
  cityState: string;
  icon: string; // 👈 novo campo
  iconColor: string; // 👈 novo campo
}

// 👉 Dados dos destinos direcionados
const data: AddressItem[] = [
  // 👈 Tipando a lista de dados
  {
    id: "1",
    address: "Av. Paulista, 1000",
    cityState: "São Paulo, SP",
    icon: "home-outline",
    iconColor: "orange",
  },
  {
    id: "2",
    address: "Rua das Flores, 45",
    cityState: "Curitiba, PR",
    icon: "time-outline",
    iconColor: "#888",
  },
];

interface props {
  visible: boolean;
  onClose: () => void;
  duration?: number;
  onDisconnect: () => void;
  buscandoCorrida: boolean;
}

export default function Preferencias({
  visible,
  onClose,
  duration = 200,
  onDisconnect,
  buscandoCorrida,
}: props) {
  const translateX = useRef(new Animated.Value(width)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const [isMounted, setIsMounted] = useState(visible);
  const [dialogDefinirDestinoVisible, setDialogDefinirDestinoVisible] =
    useState(false);
  const [configurarSolicitacoesVisible, setConfigurarSolicitacoesVisible] =
    useState(false);
  const [metodosPagamentoVisible, setMetodosPagamentoVisible] = useState(false);
  const [preferenciasNavegacao, setPreferenciasNavegacao] = useState(false);
  const [preferenciasSomVoz, setPreferenciasSomVoz] = useState(false);

  const mostrarDedifnirDestino = () => {
    setDialogDefinirDestinoVisible(true);
  };

  const mostrarConfigurarSolicitacoes = () => {
    setConfigurarSolicitacoesVisible(true);
  };

  const mostrarMetodosPagamento = () => {
    setMetodosPagamentoVisible(true);
  };

  const mostrarPreferenciasNavegacao = () => {
    setPreferenciasNavegacao(true);
  };

  const mostrarPreferenciasSomVoz = () => {
    setPreferenciasSomVoz(true);
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
          // 👉 abre da direita para a esquerda
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
          // 👉 fecha voltando para a direita
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

  const handleDesconectar = () => {
    onDisconnect(); // chama handleConnect() do BottomMenu
    onClose(); // fecha o drawer logo em seguida
  };

  // 👉 Componente de renderização para cada item da lista de endereços
  // 👈 Tipagem corrigida com ListRenderItem<AddressItem>
  const renderItem: ListRenderItem<AddressItem> = ({ item, index }) => (
    <TouchableOpacity style={[styles.addressItem]}>
      {/* Ícone dinâmico */}
      <Ionicons
        name={item.icon as any}
        size={24}
        color={item.iconColor}
        style={styles.addressIcon}
      />
      {/* O addressContent agora contém a borda para que ela não inclua o ícone */}
      <View
        style={[
          styles.addressContent,
          // Aplica a borda condicionalmente
          index !== data.length - 1 && styles.addressContentSeparator,
        ]}
      >
        <Text style={styles.addressLine1}>{item.address}</Text>
        <Text style={styles.addressLine2}>{item.cityState}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <>
      {/* 👉 Componente de destino com Z-INDEX maior */}
      {configurarSolicitacoesVisible && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 50,
          }}
        >
          <ConfigurarSolicitacoes
            visible={configurarSolicitacoesVisible}
            onClose={() => setConfigurarSolicitacoesVisible(false)}
          />
        </View>
      )}

      {metodosPagamentoVisible && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 50,
          }}
        >
          <MetodosPagamento
            visible={metodosPagamentoVisible}
            onClose={() => setMetodosPagamentoVisible(false)}
          />
        </View>
      )}

      {preferenciasNavegacao && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 50,
          }}
        >
          <PreferenciasNavegacao
            visible={preferenciasNavegacao}
            onClose={() => setPreferenciasNavegacao(false)}
          />
        </View>
      )}

      {preferenciasSomVoz && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 50,
          }}
        >
          <PreferenciasSomVoz
            visible={preferenciasSomVoz}
            onClose={() => setPreferenciasSomVoz(false)}
          />
        </View>
      )}

      {dialogDefinirDestinoVisible && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 50,
          }}
        >
          <DefinirDestino
            visible={dialogDefinirDestinoVisible}
            onClose={() => setDialogDefinirDestinoVisible(false)}
          />
        </View>
      )}
      <View style={[StyleSheet.absoluteFill, { zIndex: 30 }]}>
        {/* Fundo escurecido */}
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
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="arrow-back-outline" size={26} color="#111" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>
                Preferências de solicitações
              </Text>
              <View style={{ width: 26 }} />
            </View>
          </View>

          {/* BODY */}
          <View style={styles.body}>
            {/* Card 1 - Preferências de solicitações */}
            {/* 👉 Título fora do Card 1 */}
            {/* <Text style={styles.outerSectionTitle}>
              Destinos definidos
            </Text> */}
            <View style={styles.cardGroup}>
              {/* <Text style={styles.sectionTitle}>
              Destinos definidos
            </Text> */}

              {/* Primeiro botão: Definir meu destino */}
              <TouchableOpacity
                onPress={mostrarDedifnirDestino}
                className="mt-3"
                style={styles.cardButton}
              >
                <View style={styles.cardLeft}>
                  <Ionicons
                    name="navigate-circle-outline"
                    size={22}
                    color="#111"
                    style={styles.icon}
                  />
                  <Text style={styles.cardText}>Definir meu destino</Text>
                </View>
                <Ionicons
                  name="chevron-forward-outline"
                  size={20}
                  color="#aaa"
                />
              </TouchableOpacity>

              {/* Título e Lista de Destinos Direcionados */}
              {data.length > 0 && (
                <View style={styles.addressListContainer}>
                  {/* Título 'Destinos direcionados' */}
                  <Text style={styles.addressListTitle}>Definidos</Text>

                  {/* Lista de endereços usando FlatList */}
                  <FlatList
                    data={data}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    scrollEnabled={false} // A lista é curta, não precisa de rolagem interna
                  />
                </View>
              )}
            </View>

            {/* Card 2 - Assistente de ganhos */}
            <View style={styles.cardGroup}>
              {/* <Text style={styles.sectionTitle}>Assistente de ganhos</Text> */}

              {/* Segundo botão: Configurar solicitações */}
              <TouchableOpacity
                onPress={mostrarConfigurarSolicitacoes}
                style={styles.cardButton}
              >
                <View style={styles.cardLeft}>
                  <Ionicons
                    name="options-outline"
                    size={22}
                    color="#111"
                    style={styles.icon}
                  />
                  <Text style={styles.cardText}>Configurar solicitações</Text>
                </View>
                <Ionicons
                  name="chevron-forward-outline"
                  size={20}
                  color="#aaa"
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={mostrarMetodosPagamento}
                style={styles.cardButton}
              >
                <View style={styles.cardLeft}>
                  <Ionicons
                    name="cash-outline"
                    size={22}
                    color="#111"
                    style={styles.icon}
                  />
                  <Text style={styles.cardText}>Métodos de pagamento</Text>
                </View>
                <View style={styles.rightGroup}>
                  <View style={styles.redDot} />
                  <Ionicons
                    name="chevron-forward-outline"
                    size={20}
                    color="#aaa"
                  />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={mostrarPreferenciasNavegacao}
                style={styles.cardButton}
              >
                <View style={styles.cardLeft}>
                  <Ionicons
                    name="navigate-outline"
                    size={22}
                    color="#111"
                    style={styles.icon}
                  />
                  <Text style={styles.cardText}>Navegação</Text>
                </View>
                <View style={styles.rightGroup}>
                  <View style={styles.redDot} />
                  <Ionicons
                    name="chevron-forward-outline"
                    size={20}
                    color="#aaa"
                  />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={mostrarPreferenciasSomVoz}
                style={styles.cardButton}
              >
                <View style={styles.cardLeft}>
                  <Ionicons
                    name="notifications-circle-outline"
                    size={22}
                    color="#111"
                    style={styles.icon}
                  />
                  <Text style={styles.cardText}>Som e voz</Text>
                </View>
                <View style={styles.rightGroup}>
                  <View style={styles.redDot} />
                  <Ionicons
                    name="chevron-forward-outline"
                    size={20}
                    color="#aaa"
                  />
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* FOOTER */}
          {buscandoCorrida && (
            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.botaoDesconectar}
                onPress={handleDesconectar}
              >
                <Text style={styles.textoDesconectar}>Desconectar</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
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
    backgroundColor: "#f7f7f7", // corpo do drawer
  },

  // HEADER
  header: {
    backgroundColor: "#fff",
    paddingTop: 45,
    paddingBottom: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 0.6,
    borderBottomColor: "#e5e5e5",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
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

  // BODY
  body: {
    flex: 1,
    padding: 16,
  },

  cardGroup: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 10,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },

  // 👉 Título fora dos cards
  outerSectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    marginLeft: 4,
    marginBottom: 6,
    marginTop: 2,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
    marginLeft: 16,
    marginTop: 4,
  },

  // CARD BUTTON
  cardButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    marginBottom: 10,
    marginLeft: 16,
    marginRight: 16,
  },
  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    marginRight: 12,
  },
  cardText: {
    fontSize: 15,
    color: "#111",
  },

  rightGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  redDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "red",
    marginRight: 6,
  },

  // 👉 ESTILOS PARA A LISTA DE ENDEREÇOS
  addressListContainer: {
    paddingVertical: 10,
  },
  addressListTitle: {
    fontSize: 12,
    fontWeight: "500",
    color: "#666",
    marginLeft: 16,
    marginBottom: 4,
    marginTop: 8,
  },
  addressItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  addressIcon: {
    marginRight: 10,
    marginTop: 4,
  },
  addressContent: {
    flex: 1,
  },
  addressContentSeparator: {
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    paddingBottom: 12,
    paddingRight: 16,
    paddingTop: 12,
    marginTop: -12, // Compensa o padding superior adicionado em addressItem para manter o alinhamento
    marginBottom: -12, // Compensa o padding inferior adicionado em addressItem para manter o alinhamento
  },
  addressLine1: {
    fontSize: 16,
    fontWeight: "500",
    color: "#111",
    marginBottom: 2,
  },
  addressLine2: {
    fontSize: 14,
    color: "#888",
  },
  // FIM DOS ESTILOS DA LISTA DE ENDEREÇOS

  // FOOTER - BOTÃO DESCONECTAR
  footer: {
    backgroundColor: "#fff",
    paddingVertical: 14,
    alignItems: "center",
    borderTopWidth: 0.4,
    borderTopColor: "#ddd",
    paddingBottom: 30,
  },
  botaoDesconectar: {
    borderWidth: 1.5,
    borderColor: "#111",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
  },
  textoDesconectar: {
    color: "#111",
    fontSize: 30,
    fontWeight: "600",
    textAlign: "center",
  },
});
