import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface BottomMenuProps {
  selectedTab: string;
  onTabPress: (tab: string) => void;
}

const CIRCLE_SIZE = 32;

export default function MenuInferiorPassageiro({
  selectedTab,
  onTabPress,
}: BottomMenuProps) {
  const tabs = [
    { key: "corrida", icon: "car-outline", label: "Corrida" },
    { key: "entrega", icon: "cube-outline", label: "Entrega" },
    { key: "pay", icon: "cash-outline", label: "Pay" },
  ];

  return (
    <SafeAreaView style={styles.bottomMenuWrapper}>
      <View style={styles.bottomMenu}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={styles.tabItem}
            onPress={() => onTabPress(tab.key)}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.iconCircle,
                selectedTab === tab.key && styles.activeCircle,
              ]}
            >
              <Ionicons
                name={tab.icon as any}
                size={20}
                color={selectedTab === tab.key ? "#000" : "#888"}
              />
            </View>
            <Text
              style={[
                styles.tabText,
                selectedTab === tab.key && styles.activeTabText,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  bottomMenuWrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 15,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  bottomMenu: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 10,
  },
  tabItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingVertical: 6,
  },
  tabText: {
    marginLeft: 8,
    fontSize: 15,
    color: "#888",
  },
  activeTabText: {
    fontWeight: "700",
    color: "#000",
  },
  iconCircle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  activeCircle: {
    backgroundColor: "#FFD84D",
    borderRadius: CIRCLE_SIZE / 2,
    overflow: "hidden",
  },
});
