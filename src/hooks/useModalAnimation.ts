// hooks/useModalAnimation.ts
import { useEffect, useRef } from "react";
import { Animated, Dimensions } from "react-native";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export interface ModalAnimationConfig {
  duration?: number;
  overlayDuration?: number;
  slideFrom?: "bottom" | "top" | "right";
}

export function useModalAnimation(
  visible: boolean,
  config: ModalAnimationConfig = {},
) {
  const {
    duration = 400,
    overlayDuration = 400,
    slideFrom = "bottom",
  } = config;

  const getInitialValue = () => {
    switch (slideFrom) {
      case "top":
        return -SCREEN_HEIGHT;
      case "right":
        return SCREEN_HEIGHT;
      case "bottom":
      default:
        return SCREEN_HEIGHT;
    }
  };

  const slideAnim = useRef(new Animated.Value(getInitialValue())).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  // 🔹 Animação de abertura
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0.5,
          duration: overlayDuration,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, overlayOpacity, duration, overlayDuration, slideAnim]);

  // 🔹 Corrigido: aguarda animação terminar antes de fechar
  const closeAnimation = (onClose: () => void) => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: getInitialValue(),
        duration,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: overlayDuration,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // 🔸 Só fecha após a animação terminar
      onClose?.();
    });
  };

  return {
    slideAnim,
    overlayOpacity,
    closeAnimation,
  };
}
