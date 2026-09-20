import { useModalAnimation } from "@/hooks/useModalAnimation";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { Text } from "@/components/common/Texto";
import {
  Animated,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CentralGanhos from "./CentralGanhos";
import HistoricoCorridas from "./HistoricoCorridas";
import ModalGanhos from "./ModalGanhos";
import ObjetivoSemanal from "./ObjetivoSemanal";
import SeusGanhos from "./SeusGanhos";

interface GanhoDiarioProps {
  visible: boolean;
  setVisible: (visible: boolean) => void;
}

const GanhoDiario = ({ visible, setVisible }: GanhoDiarioProps) => {
  const [mostrarValor, setMostrarValor] = useState(true);
  const [modalRenderizado, setModalRenderizado] = useState(visible);

  const { slideAnim, overlayOpacity, closeAnimation } = useModalAnimation(
    modalRenderizado,
    { slideFrom: "top", duration: 200, overlayDuration: 300 },
  );
  const [dialogHistoricoCorridaVisible, setDialogHistoricoCorrida] =
    useState(false);
  const [dialogCentralGanhos, setDialogCentralGanhos] = useState(false);
  const [dialogSeusGanhos, setDialogSeusGanhos] = useState(false);
  const [dialogObjetivoSemanal, setDialogObjetivoSemanal] = useState(false);

  const mostrarHistoricoCorrida = () => {
    setDialogHistoricoCorrida(true);
  };

  const mostrarCentralGanhos = () => {
    setDialogCentralGanhos(true);
  };

  const mostrarSeusGanhos = () => {
    setDialogSeusGanhos(true);
  };
  const mostrarObjetivoSemanal = () => {
    setDialogObjetivoSemanal(true);
  };

  useEffect(() => {
    if (visible) {
      setTimeout(() => setModalRenderizado(true), 0);
    } else {
      closeAnimation(() => setModalRenderizado(false));
    }
  }, [visible, closeAnimation]);

  const handleEyePress = () => {
    setMostrarValor((prev) => !prev);
    console.log("👁️ Botão olho clicado");
  };

  const handleToggleModal = () => {
    setVisible(!visible);
    console.log("Modal Toggled");
  };

  const handleFecharModal = () => {
    setVisible(false);
    console.log("📂 Modal fechado");
  };

  const ganhosSemana = 245.97;
  const metaSemana = 1400.0;
  const progressoPercentual = (ganhosSemana / metaSemana) * 100;

  return (
    <>
      <HistoricoCorridas
        visible={dialogHistoricoCorridaVisible}
        onClose={() => setDialogHistoricoCorrida(false)}
      />
      <CentralGanhos
        visible={dialogCentralGanhos}
        onClose={() => setDialogCentralGanhos(false)}
      />
      <SeusGanhos
        visible={dialogSeusGanhos}
        onClose={() => setDialogSeusGanhos(false)}
      />
      <ObjetivoSemanal
        visible={dialogObjetivoSemanal}
        onClose={() => setDialogObjetivoSemanal(false)}
      />
      <SafeAreaView style={styles.container} pointerEvents="box-none">
        {/* --- BOTÃO DE GANHOS (VISUAL PRINCIPAL) --- */}
        <View style={styles.valorButton}>
          {/* Botão Olho */}
          <TouchableOpacity onPress={handleEyePress} activeOpacity={0.7}>
            <Ionicons
              name={mostrarValor ? "eye" : "eye-off"}
              size={19}
              color="#fff"
            />
          </TouchableOpacity>
          {/* Separador vertical */}
          <View style={styles.separator} />

          {/* Valor (agora também abre/fecha o modal ao tocar) */}
          <TouchableOpacity onPress={handleToggleModal} activeOpacity={0.7}>
            <Text style={styles.valorText}>
              {mostrarValor ? (
                <>
                  <Text style={styles.moeda}>R$ </Text>44,14
                </>
              ) : (
                "* * * * * *"
              )}
            </Text>
          </TouchableOpacity>

          {/* Botão Dropdown (abre modal) */}
          <TouchableOpacity
            onPress={handleToggleModal}
            activeOpacity={0.7}
            style={styles.dropdownButton}
          >
            <Ionicons
              name={visible ? "chevron-up" : "chevron-down"}
              size={18}
              color="#fff"
            />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* ✨ Estrutura do Modal/Backdrop */}
      {modalRenderizado && (
        <View
          className="absolute w-full h-full"
          style={[styles.modalWrapper]}
          pointerEvents={visible ? "auto" : "none"}
        >
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              styles.backdrop,
              { opacity: overlayOpacity },
            ]}
          >
            <Pressable style={{ flex: 1 }} onPress={handleFecharModal} />
          </Animated.View>

          <Animated.View style={[{ transform: [{ translateY: slideAnim }] }]}>
            <ModalGanhos
              visible={visible}
              onClose={handleFecharModal}
              config={{ slideFrom: "top", duration: 500 }}
            >
              <View
                style={styles.card}
                className="bg-gray-200 shadow-slate-200 shadow-md rounded-2xl mt-28"
              >
                {/* Card 1 - Painel */}
                <View>
                  <View style={styles.painelHeader}>
                    <Text style={styles.modalTitle}>Painel</Text>
                  </View>

                  {/* Grid de Ganhos */}
                  <View style={styles.gridContainer}>
                    {/* Coluna 1 */}
                    <View style={styles.gridColumn}>
                      <View style={styles.gridItem}>
                        <TouchableOpacity
                          onPress={mostrarHistoricoCorrida}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.gridValue}>R$7,79</Text>
                          <Text style={styles.gridLabel}>
                            Valor da última corrida &gt;
                          </Text>
                        </TouchableOpacity>
                      </View>
                      <View style={styles.separator} />
                      <View style={styles.gridItem}>
                        <Text style={styles.gridValue}>
                          R$ {ganhosSemana.toFixed(2).replace(".", ",")}
                        </Text>
                        <Text style={styles.gridLabel}>
                          Ganhos desta semana &gt;
                        </Text>
                      </View>
                    </View>

                    {/* Coluna 2 */}
                    <View style={styles.gridColumn}>
                      <View style={styles.gridItem}>
                        <TouchableOpacity
                          onPress={mostrarSeusGanhos}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.gridValue}>R$16,40</Text>
                          <Text style={styles.gridLabel}>
                            / (solicitação) semana &gt;
                          </Text>
                        </TouchableOpacity>
                      </View>
                      <View style={styles.gridItem}>
                        <Text style={styles.gridValue}>2</Text>
                        <Text style={styles.gridLabel}>
                          Solicitação(ões) &gt;
                        </Text>
                      </View>
                    </View>

                    {/* Coluna 3 */}
                    <View style={styles.gridColumn}>
                      <View style={styles.gridItem}>
                        <Text style={styles.gridValue}>0%</Text>
                        <Text style={styles.gridLabel}>
                          Taxa99 (esta semana) &gt;
                        </Text>
                      </View>
                      <View style={styles.gridItem}>
                        <Text style={styles.gridValue}>R$3,57</Text>
                        <Text style={styles.gridLabel}>/km (hoje) &gt;</Text>
                      </View>
                    </View>
                  </View>

                  {/* Botão Central de Ganhos */}
                  <TouchableOpacity
                    onPress={mostrarCentralGanhos}
                    style={styles.centralButton}
                  >
                    <Text style={styles.centralButtonText}>
                      Ver Central de ganhos
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Card 2 - Meta de ganhos */}
              <View style={styles.card}>
                <TouchableOpacity
                  onPress={mostrarObjetivoSemanal}
                  activeOpacity={0.8}
                >
                  <Text style={styles.modalTitle}>
                    Meta de ganhos escolhida
                  </Text>
                  <View style={styles.metaContent}>
                    <Ionicons name="trophy-outline" size={24} color="#f5c518" />
                    <View style={styles.metaTextContainer}>
                      <Text style={styles.metaLabel}>Objetivo semanal</Text>
                      <Text style={styles.metaSubLabel}>
                        Continue aumentando seus ganhos
                      </Text>
                    </View>
                    <Text style={styles.metaProgressText}>
                      {ganhosSemana.toFixed(2).replace(".", ",")} / R$
                      {metaSemana.toFixed(2).replace(".", ",")}
                    </Text>
                  </View>

                  {/* Barra de Progresso */}
                  <View style={styles.progressBarBackground}>
                    <View
                      style={[
                        styles.progressBarForeground,
                        { width: `${progressoPercentual}%` },
                      ]}
                    />
                  </View>
                </TouchableOpacity>
              </View>
            </ModalGanhos>
          </Animated.View>
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 18,
  },
  valorButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "black",
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 10,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
  },
  separator: {
    width: 1,
    height: 16,
    backgroundColor: "rgba(255,255,255,0.3)",
    marginHorizontal: 6,
  },
  valorText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  moeda: {
    color: "#FFD600",
  },
  dropdownButton: {
    marginLeft: 5,
  },
  modalWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
  backdrop: {
    backgroundColor: "rgba(0, 0, 0, 0.2)",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  label: {
    color: "#555",
  },
  value: {
    fontWeight: "bold",
    color: "#1E1B3C",
  },
  centralButton: {
    marginTop: 14,
    backgroundColor: "#000",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  centralButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 19,
  },
  modalContainer: {
    width: "100%",
    paddingHorizontal: 12,
    marginTop: 10,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    width: "100%",
    marginBottom: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  painelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  painelHeaderLinks: {
    flexDirection: "row",
  },
  headerLink: {
    color: "#555",
    fontWeight: "500",
    marginLeft: 16,
    fontSize: 14,
  },
  gridContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  gridColumn: {
    flex: 1,
  },
  gridItem: {
    marginBottom: 16,
  },
  gridValue: {
    fontSize: 18,
    color: "black",
  },
  gridLabel: {
    fontSize: 12,
    color: "#777",
  },
  metaContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  metaTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  metaLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "black",
  },
  metaSubLabel: {
    fontSize: 12,
    color: "#777",
  },
  metaProgressText: {
    fontSize: 15,
    fontWeight: "600",
    color: "black",
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: "#eee",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarForeground: {
    height: "100%",
    backgroundColor: "#f5c518",
    borderRadius: 3,
  },
});

export default GanhoDiario;
