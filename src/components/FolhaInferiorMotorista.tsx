import { useAuth } from "@/context/AuthProvider";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import React, { useCallback, useMemo, useRef } from "react";
import { Text } from "@/components/common/Texto";
import { StyleSheet, View } from "react-native";

// 🔹 Definição das props que o componente recebe
interface DriverSearchProps {
  // ✨ NOVO: Callback para notificar o componente pai (Home) sobre a mudança de estado
  onSheetChange: (index: number) => void;
}

export default function FolhaInferiorMotorista({
  onSheetChange,
}: DriverSearchProps) {
  const { user, loading: authLoading } = useAuth();
  // snap points do bottomsheet
  const snapPoints = useMemo(() => ["64%", "80%"], []);
  const sheetRef = useRef<BottomSheet>(null);

  // eventos
  const handleSheetChange = useCallback(
    (index: number) => {
      console.log(user, "handleSheetChange", index);
      // ✨ CHAMANDO CALLBACK: Notifica o componente pai sobre o índice atual
      onSheetChange(index);
    },
    [onSheetChange],
  );

  return (
    <View className="flex-1 pt-12 px-4">
      <BottomSheet
        ref={sheetRef}
        snapPoints={snapPoints}
        enableDynamicSizing={false}
        onChange={handleSheetChange}
      >
        {/* Campo de pesquisa */}
        <BottomSheetView className="flex-1 items-center px-4">
          <Text>escreva aqui, {user?.name}!</Text>
          {/* crie aqui */}
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
