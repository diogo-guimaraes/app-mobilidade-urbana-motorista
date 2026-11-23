import { Text } from "@/components/common/Texto";
import { Ionicons } from "@expo/vector-icons";
import { memo, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Marker } from "react-native-maps";

interface Props {
  latitude: number;
  longitude: number;
  // "1,1x-1,4x" ou "1,5x", já formatado pelo backend
  rotulo: string;
}

// No Android o Marker com View só desenha o conteúdo se acompanhar a mudança
// da view no primeiro quadro; depois disso volta a false para não pesar.
function useRastrearPorUmMomento() {
  const [rastrear, setRastrear] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setRastrear(false), 1200);

    return () => clearTimeout(timer);
  }, []);

  return rastrear;
}

/**
 * Selo do intervalo de uma região: pílula branca com sombra suave, o raio e o
 * menor e o maior valor ("1,1X-1,4X"), no centro da área.
 */
function SeloDinamico({ latitude, longitude, rotulo }: Props) {
  const rastrear = useRastrearPorUmMomento();

  return (
    <Marker
      coordinate={{ latitude, longitude }}
      anchor={{ x: 0.5, y: 0.5 }}
      tracksViewChanges={rastrear}
      // o toque cai no mapa, não neste selo
      tappable={false}
      zIndex={3}
    >
      <View style={styles.selo}>
        <Ionicons name="flash" size={13} color="#E63926" />
        <Text style={styles.texto}>{rotulo.toUpperCase()}</Text>
      </View>
    </Marker>
  );
}

export default memo(SeloDinamico);

const styles = StyleSheet.create({
  selo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    // sombra suave; o espaço em volta evita o corte dela no Android
    elevation: 3,
    shadowColor: "#000000",
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  texto: { color: "#1C1C1E", fontSize: 13, fontWeight: "800" },
});
