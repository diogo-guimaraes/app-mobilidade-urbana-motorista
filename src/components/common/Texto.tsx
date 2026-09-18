import { forwardRef } from "react";
import {
  Platform,
  StyleSheet,
  Text as TextDoRN,
  TextInput as TextInputDoRN,
  TextInputProps,
  TextProps,
  TextStyle,
} from "react-native";

// Teto para o quanto o texto cresce com a preferência de fonte do sistema.
// Em 1 o app ignoraria a acessibilidade; sem teto, um aparelho com fonte
// grande estoura o layout.
export const ESCALA_MAXIMA_FONTE = 1.2;

// A Roboto (Android) tem altura-de-x maior que a SF Pro (iOS), então o mesmo
// fontSize aparece maior no Android. Este fator compensa a diferença.
export const FATOR_FONTE_ANDROID = 0.94;

const ajustarFonte = <T,>(style: T): T => {
  if (Platform.OS !== "android") return style;

  const achatado = StyleSheet.flatten(style as never) as TextStyle | undefined;
  const tamanho = achatado?.fontSize;

  if (typeof tamanho !== "number") return style;

  const entrelinha = achatado?.lineHeight;

  return [
    style,
    {
      fontSize: tamanho * FATOR_FONTE_ANDROID,
      ...(typeof entrelinha === "number"
        ? { lineHeight: entrelinha * FATOR_FONTE_ANDROID }
        : {}),
    },
  ] as T;
};

export type Text = TextDoRN;

export const Text = forwardRef<TextDoRN, TextProps>(
  ({ maxFontSizeMultiplier, style, ...resto }, ref) => (
    <TextDoRN
      ref={ref}
      maxFontSizeMultiplier={maxFontSizeMultiplier ?? ESCALA_MAXIMA_FONTE}
      style={ajustarFonte(style)}
      {...resto}
    />
  ),
);

Text.displayName = "Text";

export type TextInput = TextInputDoRN;

export const TextInput = forwardRef<TextInputDoRN, TextInputProps>(
  ({ maxFontSizeMultiplier, style, ...resto }, ref) => (
    <TextInputDoRN
      ref={ref}
      maxFontSizeMultiplier={maxFontSizeMultiplier ?? ESCALA_MAXIMA_FONTE}
      style={ajustarFonte(style)}
      {...resto}
    />
  ),
);

TextInput.displayName = "TextInput";
