// hooks/useSlideAnimation.ts
import { useEffect, useRef } from "react";
import { Animated } from "react-native";

export interface AnimationConfig {
  damping?: number;
  stiffness?: number;
  duration?: number;
  overlayDuration?: number;
}

export function useSlideAnimation(
  visible: boolean,
  drawerWidth: number,
  config: AnimationConfig = {},
) {
  const {
    damping = 20,
    stiffness = 90,
    duration = 250,
    overlayDuration = 300,
  } = config;

  const translateX = useRef(new Animated.Value(-drawerWidth)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          damping,
          stiffness,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0.5,
          duration: overlayDuration,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [
    visible,
    damping,
    stiffness,
    overlayDuration,
    overlayOpacity,
    translateX,
  ]);

  const closeAnimation = (onClose: () => void) => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: -drawerWidth,
        duration,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: overlayDuration - 100,
        useNativeDriver: true,
      }),
    ]).start(onClose);
  };

  return {
    translateX,
    overlayOpacity,
    closeAnimation,
  };
}
