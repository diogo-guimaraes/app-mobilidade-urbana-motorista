import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Text } from "@/components/common/Texto";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Buscando from "./Buscando";

import Preferencias from "./Preferencias";

interface props {
  setSolicitacoesCorrida: () => void;
  disponivel: boolean;
  emCorrida: boolean;
  ocupado: boolean;
  onAlternarDisponibilidade: (proximoEstado: boolean) => void;
}

export default function MenuInferiorMotorista({
  setSolicitacoesCorrida,
  disponivel,
  emCorrida,
  ocupado,
  onAlternarDisponibilidade,
}: props) {
  const [dialogPreferenciasVisible, setDialogPreferenciasVisibleLocal] =
    useState(false);

  // em corrida não se desconecta pelo botão: a corrida tem os próprios passos
  const bloqueado = ocupado || emCorrida;

  const alternar = () => {
    if (bloqueado) return;

    onAlternarDisponibilidade(!disponivel);
  };

  const desconectar = () => {
    if (bloqueado || !disponivel) return;

    onAlternarDisponibilidade(false);
  };

  const MostrarPreferencias = () => {
    setDialogPreferenciasVisibleLocal(true);
  };

  const connectButtonStyle = [
    styles.connectButton,
    disponivel
      ? {
          backgroundColor: "transparent",
          shadowOpacity: 0,
          elevation: 0,
        }
      : {
          backgroundColor: emCorrida ? "#E0E0E0" : "#FFD600",
        },
  ];

  return (
    <>
      <Preferencias
        visible={dialogPreferenciasVisible}
        onClose={() => setDialogPreferenciasVisibleLocal(false)}
        onDisconnect={desconectar}
        buscandoCorrida={disponivel}
      />

      <SafeAreaView style={styles.bottomMenuWrapper}>
        <View style={styles.bottomMenu}>
          {/* 🔹 Ícone lateral esquerdo (Config/Desconectar) */}
          <TouchableOpacity
            style={styles.iconButton}
            onPress={MostrarPreferencias}
            activeOpacity={0.8}
          >
            <Ionicons name="options-outline" size={40} color="#000" />
            {/* 🔴 Pontinho vermelho de status */}
            <View
              style={[
                styles.redDot,
                { backgroundColor: disponivel ? "#22c55e" : "#E53935" },
              ]}
            />
          </TouchableOpacity>

          {/* 🔹 Botão central "Conectar" / "Buscando" */}
          <TouchableOpacity
            style={connectButtonStyle}
            onPress={alternar}
            disabled={bloqueado}
            activeOpacity={0.9}
          >
            {disponivel ? (
              <Buscando />
            ) : (
              <Text style={styles.connectTextLarge}>
                {emCorrida ? "Em corrida" : ocupado ? "..." : "Conectar"}
              </Text>
            )}
          </TouchableOpacity>

          {/* 🔹 Ícone lateral direito */}
          <TouchableOpacity
            style={styles.iconButton}
            onPress={setSolicitacoesCorrida}
            activeOpacity={0.8}
          >
            <Ionicons name="document-text-outline" size={40} color="#000" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  bottomMenuWrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  bottomMenu: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  iconButton: {
    position: "relative",
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  redDot: {
    position: "absolute",
    top: 6,
    left: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "red",
  },
  connectButton: {
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    width: "70%",
    alignSelf: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
    minHeight: 56,
  },
  connectTextLarge: {
    color: "black",
    fontSize: 30,
    fontWeight: "600",
    textAlign: "center",
  },
});
