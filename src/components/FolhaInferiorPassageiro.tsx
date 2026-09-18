import { Ionicons } from "@expo/vector-icons";
import BottomSheet, {
  BottomSheetFlatList,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import React, { useCallback, useMemo, useRef } from "react";
import { Text } from "@/components/common/Texto";
import { StyleSheet, TouchableOpacity, View } from "react-native";

// 🔹 Definição das props que o componente recebe
interface DriverSearchProps {
  onPressInput: () => void;
  // ✨ NOVO: Callback para notificar o componente pai (Home) sobre a mudança de estado
  onSheetChange: (index: number) => void;
}

export default function FolhaInferiorMotorista({
  onPressInput,
  onSheetChange,
}: DriverSearchProps) {
  // snap points do bottomsheet
  const snapPoints = useMemo(() => ["64%", "80%"], []);
  const sheetRef = useRef<BottomSheet>(null);

  // eventos
  const handleSheetChange = useCallback(
    (index: number) => {
      console.log("handleSheetChange", index);
      // ✨ CHAMANDO CALLBACK: Notifica o componente pai sobre o índice atual
      onSheetChange(index);
    },
    [onSheetChange],
  );

  // dados das últimas corridas
  const data = useMemo(
    () => [
      {
        id: "1",
        rua: "Av. Paulista, 1000",
        cidade: "São Paulo, SP",
      },
      {
        id: "2",
        rua: "Rua das Flores, 45",
        cidade: "Curitiba, PR",
      },
    ],
    [],
  );

  // render item da lista
  const renderItem = useCallback(
    ({ item, index }: { item: any; index: number }) => (
      <TouchableOpacity>
        <View
          className={`flex-row items-start p-4 w-full ${
            index !== data.length - 1 ? "border-b border-gray-200" : ""
          }`}
        >
          <Ionicons
            name="time-outline"
            size={20}
            color="#666"
            style={{ marginRight: 12, marginTop: 2 }}
          />
          <View>
            <Text className="text-base font-semibold text-gray-800">
              {item.rua}
            </Text>
            <Text className="text-sm text-gray-500">{item.cidade}</Text>
          </View>
        </View>
      </TouchableOpacity>
    ),
    [data],
  );

  return (
    <View className="flex-1 pt-12 px-4">
      <BottomSheet
        ref={sheetRef}
        snapPoints={snapPoints}
        enableDynamicSizing={false}
        onChange={handleSheetChange}
        // ✨ MODIFICAÇÃO: Configurações para o efeito de arrastar para baixo e voltar:
        // 1. overDragResistanceFactor: Controla a resistência ao arrastar além do
        //    último snap point. Um valor maior torna o gesto mais 'elástico' e
        //    limita a distância de arrasto. O valor 3 é um bom ponto de partida.
        overDragResistanceFactor={13}
        // 2. enablePanDownToClose: Garante que o BottomSheet não feche
        //    quando arrastado para baixo, fazendo com que ele volte (snap back)
        //    para o snap point ativo (como visto no vídeo).
        enablePanDownToClose={false}
      >
        {/* Campo de pesquisa */}
        <BottomSheetView className="flex-1 items-center px-4">
          <TouchableOpacity
            style={styles.inputContainer}
            activeOpacity={0.7}
            onPress={onPressInput} // 🔹 Ao clicar, dispara a prop
          >
            <Ionicons
              name="search"
              size={30}
              color="black"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.inputText}>Para onde vamos?</Text>
          </TouchableOpacity>

          {/* Lista de últimas corridas */}
          <BottomSheetFlatList
            data={data}
            keyExtractor={(i: any) => i.id}
            renderItem={renderItem}
            className="w-full"
          />
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f8",
    borderRadius: 12,
    padding: 12,
    width: "100%",
  },
  inputText: {
    marginLeft: 8,
    fontSize: 29,
    fontWeight: "600",
    color: "black",
  },
});
