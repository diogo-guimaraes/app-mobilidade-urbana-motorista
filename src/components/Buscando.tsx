// Buscando.tsx
import React, { useEffect, useRef, useState } from "react";
import { Text } from "@/components/common/Texto";
import {
  Animated,
  Easing,
  LayoutChangeEvent,
  StyleSheet,
  View,
} from "react-native";

/**
 * Buscando v2
 * - Alterna palavras com fade in/out
 * - Indicador (linha) na parte inferior que se move lateralmente
 * - Fundo branco, texto preto
 *
 * Uso:
 * <Buscando />
 */

const WORDS = ["Buscando", "Você está online", "Preços dinâmicos"];
const FADE_DURATION = 400; // ms para fade in/out
const WORD_DISPLAY_DELAY = 5000; // tempo total antes de trocar (inclui fades)
const LINE_TRAVEL_DURATION = 700; // duração do movimento completo da linha (ida ou volta)

export default function Buscando() {
  // índice da palavra atual
  const [index, setIndex] = useState(0);

  // animação de opacidade da palavra
  const opacity = useRef(new Animated.Value(0)).current;

  // animação da linha (0 -> 1), será interpolada para translateX com base no width do contêiner
  const lineAnim = useRef(new Animated.Value(0)).current;

  // largura do container disponível (usado para calcular range da linha)
  const [containerWidth, setContainerWidth] = useState(0);

  // ciclo de palavras: fade in, esperar, fade out, trocar índice, repetir
  useEffect(() => {
    let mounted = true;

    const runCycle = async () => {
      while (mounted) {
        // fade in
        await new Promise<void>((resolve) => {
          Animated.timing(opacity, {
            toValue: 1,
            duration: FADE_DURATION,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }).start(() => resolve());
        });

        // espera visível (menos o tempo dos fades)
        await new Promise((res) =>
          setTimeout(res, Math.max(0, WORD_DISPLAY_DELAY - FADE_DURATION * 2)),
        );

        // fade out
        await new Promise<void>((resolve) => {
          Animated.timing(opacity, {
            toValue: 0,
            duration: FADE_DURATION,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }).start(() => resolve());
        });

        // atualiza índice da palavra
        if (!mounted) break;
        setIndex((prev) => (prev + 1) % WORDS.length);

        // pequena pausa antes de iniciar fade in da próxima (opcional)
        await new Promise((res) => setTimeout(res, 80));
      }
    };

    runCycle();

    return () => {
      mounted = false;
      opacity.stopAnimation();
    };
  }, [opacity]);

  // animação contínua da linha: vai e volta (loop)
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(lineAnim, {
          toValue: 1,
          duration: LINE_TRAVEL_DURATION,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(lineAnim, {
          toValue: 0,
          duration: LINE_TRAVEL_DURATION,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [lineAnim]);

  // calcula translateX da linha baseado na largura disponível
  const lineTranslateX = lineAnim.interpolate({
    inputRange: [0, 1],
    // vamos mover a linha entre 0 e (containerWidth - lineWidth)
    outputRange: [0, Math.max(0, containerWidth - 48)], // 48 => largura do elemento em que a linha se move (ajuste mais abaixo)
    extrapolate: "clamp",
  });

  // captura largura do container
  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    setContainerWidth(w);
  };

  return (
    <View style={styles.outer} onLayout={onLayout}>
      <View style={styles.center}>
        {/* Palavra atual com opacidade animada */}
        <Animated.Text
          style={[
            styles.word,
            {
              opacity: opacity,
              transform: [
                {
                  // leve movimento vertical durante fade (subtle)
                  translateY: opacity.interpolate({
                    inputRange: [0, 1],
                    outputRange: [6, 0],
                  }),
                },
              ],
            },
          ]}
          accessible
          accessibilityRole="text"
        >
          {WORDS[index]}
        </Animated.Text>

        {/* subtexto menor opcional (pode comentar se não quiser) */}
        <Text style={styles.hint}>Aguarde, buscando por novas corridas</Text>
      </View>

      {/* indicador inferior: linha/track com barra movendo-se */}
      <View style={styles.lineWrapper} pointerEvents="none">
        <View style={styles.lineTrack}>
          {/* Moving pill/segment */}
          <Animated.View
            style={[
              styles.linePill,
              {
                transform: [{ translateX: lineTranslateX }],
                // leve pulso de opacidade para dar brilho
                opacity: lineAnim.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0.8, 1, 0.8],
                }),
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    width: "100%",
    backgroundColor: "#fff", // fundo branco conforme solicitado
    alignItems: "center",
    justifyContent: "center",
  },
  center: {
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  word: {
    color: "#000",
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  hint: {
    marginTop: 6,
    fontSize: 12,
    color: "#666",
  },
  lineWrapper: {
    width: "100%",
    paddingVertical: 10,
    alignItems: "center",
  },
  lineTrack: {
    width: "82%", // área na qual a "pill" se move (ajuste pra seu layout)
    height: 8,
    backgroundColor: "#F0F0F0",
    borderRadius: 999,
    overflow: "hidden",
    justifyContent: "center",
  },
  linePill: {
    position: "absolute",
    left: 0,
    width: 48, // largura da "pílula" móvel
    height: 8,
    borderRadius: 999,
    backgroundColor: "#FFD600", // amarelo similar ao design
    // sombra leve (iOS)
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    // elevation Android
    elevation: 1,
  },
});
