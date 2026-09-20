import { MaterialIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Text } from "@/components/common/Texto";
import {
  Alert,
  AppState,
  Linking,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, {
  Marker,
  Polyline,
  PROVIDER_GOOGLE,
  Region,
  UserLocationChangeEvent,
} from "react-native-maps";

export interface Coordenada {
  latitude: number;
  longitude: number;
}

interface MapProps {
  region: Region | null;
  onRegionChange: (region: Region) => void;
  onUserLocationFound?: (region: Region) => void;
  bottomSheetIndex?: number; // 👈 nova prop
  isGanhoModalVisible?: boolean;
  rota?: Coordenada[];
  alvo?: Coordenada | null;
  alvoEhDestino?: boolean;
  // altura ocupada pela folha da corrida, pra rota não ficar embaixo dela
  alturaFolha?: number;
}

// Região inicial vazia - será substituída pela localização do usuário
const emptyRegion: Region = {
  latitude: 0,
  longitude: 0,
  latitudeDelta: 0.01, // 🔹 atualizado para manter consistência com home.tsx
  longitudeDelta: 0.01,
};

export default function Map({
  region,
  onRegionChange,
  onUserLocationFound,
  bottomSheetIndex, // 👈 recebendo o valor
  isGanhoModalVisible,
  rota = [],
  alvo = null,
  alvoEhDestino = false,
  alturaFolha = 0,
}: MapProps) {
  const mapRef = useRef<MapView>(null);
  const [userLocation, setUserLocation] = useState<Region | null>(null);
  const [locationPermission, setLocationPermission] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasInitialLocation, setHasInitialLocation] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [mapaTentativa, setMapaTentativa] = useState(0);
  const [mapaDemorando, setMapaDemorando] = useState(false);
  const temporizadorMapa = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [tentativaLocalizacao, setTentativaLocalizacao] = useState(0);

  const limparTemporizadorMapa = useCallback(() => {
    if (temporizadorMapa.current !== null)
      clearTimeout(temporizadorMapa.current);
    temporizadorMapa.current = null;
  }, []);

  const mapaPronto = useCallback(() => {
    setMapReady(true);
    if (Platform.OS === "android") {
      limparTemporizadorMapa();
      temporizadorMapa.current = setTimeout(
        () => setMapaDemorando(true),
        12_000,
      );
    }
  }, [limparTemporizadorMapa]);

  const mapaCarregado = useCallback(() => {
    limparTemporizadorMapa();
    setMapaDemorando(false);
  }, [limparTemporizadorMapa]);

  useEffect(() => () => limparTemporizadorMapa(), [limparTemporizadorMapa]);

  // 🔹 guarda a região original do usuário para aplicar offsets conforme o BottomSheet
  const userInitialRegion = useRef<Region | null>(null);

  // com rota na tela, o mapa deixa de seguir a região manual e passa a
  // mostrar o trajeto inteiro
  const chaveRota =
    rota.length > 0
      ? `${rota.length}:${rota[0].latitude},${rota[0].longitude}:${rota[rota.length - 1].latitude},${rota[rota.length - 1].longitude}`
      : "";

  useEffect(() => {
    if (chaveRota === "" || !mapReady || mapRef.current === null) return;

    mapRef.current.fitToCoordinates(rota, {
      edgePadding: {
        top: 140,
        right: 60,
        bottom: Math.max(alturaFolha, 120) + 40,
        left: 60,
      },
      animated: true,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chaveRota, alturaFolha, mapReady]);

  // Solicitar permissão de localização
  useEffect(() => {
    let montado = true;

    (async () => {
      try {
        setIsLoading(true);

        let { status } = await Location.getForegroundPermissionsAsync();
        if (status !== "granted") {
          ({ status } = await Location.requestForegroundPermissionsAsync());
        }

        if (!montado) return;

        if (status === "granted") {
          setLocationPermission(true);

          // Obter localização atual
          const recente = await Location.getLastKnownPositionAsync({
            maxAge: 60_000,
            requiredAccuracy: 500,
          });
          const location =
            recente ??
            (await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            }));

          if (!montado) return;

          const userRegion: Region = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          };

          userInitialRegion.current = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          };

          setUserLocation(userRegion);
          setHasInitialLocation(true);

          // Notificar o componente pai sobre a localização encontrada
          if (onUserLocationFound) {
            onUserLocationFound(userInitialRegion.current);
          }

          // Centralizar no usuário
          if (mapRef.current) {
            mapRef.current.animateToRegion(userRegion, 1000);
          }
        } else {
          setLocationPermission(false);
          Alert.alert(
            "Localização Necessária",
            "Este app precisa da sua localização para funcionar corretamente. Por favor, permita o acesso à localização nas configurações do seu dispositivo.",
            [{ text: "OK" }],
          );
        }
      } catch (error) {
        console.error("Erro ao obter localização:", error);
        setLocationPermission(false);
        Alert.alert(
          "Erro de Localização",
          "Não foi possível obter sua localização. Verifique se o GPS está ativado.",
          [{ text: "OK" }],
        );
      } finally {
        if (montado) setIsLoading(false);
      }
    })();

    return () => {
      montado = false;
    };
  }, [onUserLocationFound, tentativaLocalizacao]);

  useEffect(() => {
    const assinatura = AppState.addEventListener("change", async (estado) => {
      if (estado !== "active") return;
      const permissao = await Location.getForegroundPermissionsAsync();
      if (permissao.status === "granted" && !locationPermission) {
        setTentativaLocalizacao((atual) => atual + 1);
      }
    });
    return () => assinatura.remove();
  }, [locationPermission]);

  // Atualizar localização do usuário quando ele se move
  const handleUserLocationChange = (event: UserLocationChangeEvent) => {
    const { coordinate } = event.nativeEvent;
    if (coordinate) {
      const newUserRegion = {
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
        latitudeDelta: 0.01, // 🔹 atualizado
        longitudeDelta: 0.01,
      };
      setUserLocation(newUserRegion);
      userInitialRegion.current = newUserRegion;
      if (rota.length === 0) onUserLocationFound?.(newUserRegion);
    }
  };

  // Centralizar no usuário
  const centerOnUser = async () => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion(userLocation, 1000);
    } else {
      // Tentar obter localização novamente
      try {
        setIsLoading(true);
        let location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const newUserRegion = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };

        setUserLocation(newUserRegion);
        if (mapRef.current) {
          mapRef.current.animateToRegion(newUserRegion, 1000);
        }
      } catch (error) {
        console.error("Erro ao obter localização:", error);
        Alert.alert("Erro", "Não foi possível obter sua localização");
      } finally {
        setIsLoading(false);
      }
    }
  };

  // 👇 NOVO useEffect: reage à mudança de estado do BottomSheet
  useEffect(() => {
    if (
      bottomSheetIndex === undefined ||
      !userInitialRegion.current ||
      rota.length > 1
    )
      return;

    const fracaoOcupada = [0.18, 0.52, 0.92][bottomSheetIndex] ?? 0.18;
    const base = userInitialRegion.current;
    const latitudeDelta = base.latitudeDelta ?? 0.01;
    const novaRegiao: Region = {
      ...base,
      latitude: base.latitude - (latitudeDelta * fracaoOcupada) / 2,
      latitudeDelta,
      longitudeDelta: base.longitudeDelta ?? 0.01,
    };

    mapRef.current?.animateToRegion(novaRegiao, 450);
  }, [bottomSheetIndex, rota.length, mapReady]);

  // Se ainda está carregando, mostrar loading
  if (isLoading) {
    return (
      <View style={[StyleSheet.absoluteFill, styles.loadingContainer]}>
        <MaterialIcons name="location-searching" size={48} color="#007AFF" />
        <Text style={styles.loadingText}>Obtendo sua localização...</Text>
      </View>
    );
  }

  // Se não tem permissão, mostrar erro
  if (!locationPermission) {
    return (
      <View style={[StyleSheet.absoluteFill, styles.errorContainer]}>
        <MaterialIcons name="location-off" size={48} color="#FF3B30" />
        <Text style={styles.errorText}>
          Permissão de localização necessária
        </Text>
        <Text style={styles.errorSubtext}>
          Ative a localização nas configurações do seu dispositivo para usar o
          app
        </Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            void Location.requestForegroundPermissionsAsync().then(
              ({ status }) => {
                if (status === "granted") {
                  setTentativaLocalizacao((atual) => atual + 1);
                } else {
                  void Linking.openSettings();
                }
              },
            );
          }}
        >
          <Text style={styles.retryButtonText}>Tentar Novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Se tem permissão mas não conseguiu localização inicial (caso raro)
  if (locationPermission && !hasInitialLocation) {
    return (
      <View style={[StyleSheet.absoluteFill, styles.errorContainer]}>
        <MaterialIcons name="location-disabled" size={48} color="#FF9500" />
        <Text style={styles.errorText}>Não foi possível obter localização</Text>
        <Text style={styles.errorSubtext}>
          Verifique se o GPS está ativado e tente novamente
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={centerOnUser}>
          <Text style={styles.retryButtonText}>Tentar Novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[StyleSheet.absoluteFill, styles.mapContainer]}>
      <MapView
        key={mapaTentativa}
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
        region={
          rota.length > 0 ? undefined : region || userLocation || emptyRegion
        }
        onRegionChangeComplete={onRegionChange}
        showsUserLocation={true}
        showsMyLocationButton={false}
        onUserLocationChange={handleUserLocationChange}
        followsUserLocation={false}
        mapType="standard"
        userInterfaceStyle="light"
        onMapReady={mapaPronto}
        onMapLoaded={mapaCarregado}
      >
        {rota.length > 1 && (
          <Polyline
            key={chaveRota}
            coordinates={rota}
            strokeWidth={5}
            strokeColor={alvoEhDestino ? "#2F6BFF" : "#17A673"}
            zIndex={10}
          />
        )}

        {alvo && (
          <Marker
            coordinate={alvo}
            pinColor={alvoEhDestino ? "#D32F2F" : "#17A673"}
            title={alvoEhDestino ? "Destino" : "Embarque"}
          />
        )}
      </MapView>

      {mapaDemorando && (
        <View accessibilityRole="alert" style={styles.mapLoadError}>
          <Text style={styles.mapLoadErrorTitle}>O mapa não carregou</Text>
          <Text style={styles.mapLoadErrorText}>
            Confira sua internet e atualize o Google Play Services.
          </Text>
          <TouchableOpacity
            style={styles.mapLoadRetry}
            onPress={() => {
              limparTemporizadorMapa();
              setMapReady(false);
              setMapaDemorando(false);
              setMapaTentativa((atual) => atual + 1);
            }}
          >
            <Text style={styles.mapLoadRetryText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Botão para centralizar no usuário */}
      {!isGanhoModalVisible && (
        <TouchableOpacity
          className="absolute top-32 bottom-32 right-2 rounded-full bg-white w-12 h-12 items-center justify-center z-20"
          onPress={centerOnUser}
          disabled={isLoading}
        >
          <MaterialIcons
            name="my-location"
            size={24}
            color={isLoading ? "#ccc" : "#007AFF"}
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  mapContainer: {
    backgroundColor: "#FFFFFF",
  },
  mapLoadError: {
    position: "absolute",
    top: 110,
    left: 24,
    right: 24,
    zIndex: 30,
    alignItems: "center",
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    padding: 16,
    elevation: 8,
  },
  mapLoadErrorTitle: { color: "#202124", fontSize: 16, fontWeight: "700" },
  mapLoadErrorText: {
    marginTop: 5,
    color: "#5F6368",
    fontSize: 13,
    textAlign: "center",
  },
  mapLoadRetry: {
    marginTop: 12,
    borderRadius: 18,
    backgroundColor: "#111",
    paddingHorizontal: 18,
    paddingVertical: 9,
  },
  mapLoadRetryText: { color: "#FFF", fontSize: 14, fontWeight: "600" },
  centerButton: {
    position: "absolute",
    bottom: 120,
    right: 16,
    backgroundColor: "white",
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  errorContainer: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    color: "#FF3B30",
    textAlign: "center",
    fontWeight: "bold",
  },
  errorSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
