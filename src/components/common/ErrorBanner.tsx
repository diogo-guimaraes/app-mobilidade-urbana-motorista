import { Text } from "@/components/common/Texto";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, View } from "react-native";
import { colors } from "@/theme/colors";

interface Props {
  message: string;
}

export default function ErrorBanner({ message }: Props) {
  return (
    <View style={styles.container}>
      <Ionicons name="alert-circle" size={18} color={colors.error} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.errorLight,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  text: {
    flex: 1,
    marginLeft: 8,
    color: colors.error,
    fontSize: 13,
    lineHeight: 18,
  },
});
