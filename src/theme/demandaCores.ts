// Visual do mapa de demanda: manchas amarelas esfumaçadas, sem vermelho (o
// vermelho fica para o preço dinâmico).

// limites da demanda por célula: abaixo do primeiro o mapa fica limpo (nível 0),
// até o segundo é concentração (nível 1) e dali em diante é demanda pesada
// (nível 2), quando as duas cores (amarelo e âmbar) aparecem
export const LIMITE_NIVEL_1 = 0.2;
// a partir daqui a célula ganha o bonequinho (onde não há tarifa dinâmica)
export const LIMITE_ICONES = 0.3;

// quão espalhada é a mancha de cada célula, em raios de hexágono
export const ESPALHAMENTO_DA_MANCHA = 0.65;

const AMARELO = [255, 226, 64] as const;
const AMBAR = [255, 163, 0] as const;

// transparência máxima no núcleo da mancha: deixa as ruas legíveis por baixo
const OPACIDADE_MAXIMA = 0.62;

const suave = (de: number, ate: number, x: number) => {
  const t = Math.min(Math.max((x - de) / (ate - de), 0), 1);

  return t * t * (3 - 2 * t);
};

/**
 * Cor de um ponto da mancha pelo valor do campo de demanda (0 a 1): amarelo
 * claro e bem transparente na borda, indo ao âmbar suave no núcleo.
 */
export function corDoCampo(valor: number): [number, number, number, number] {
  const t = suave(0.3, 0.8, valor);
  const [r, g, b] = AMARELO.map((c, i) => Math.round(c + (AMBAR[i] - c) * t));

  return [
    r,
    g,
    b,
    Math.round(255 * OPACIDADE_MAXIMA * suave(0.02, 0.85, valor)),
  ];
}
