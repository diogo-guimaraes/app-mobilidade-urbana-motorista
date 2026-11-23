// Escala de cores do preço dinâmico: faixas fixas por multiplicador, do salmão
// claro ao vinho. A cor é sólida (sem transparência) para a mancha de demanda
// não aparecer por baixo do hexágono.

interface Faixa {
  // a faixa vale do multiplicador `de` (inclusive) até a próxima
  de: number;
  cor: string;
}

const FAIXAS: readonly Faixa[] = [
  { de: 0, cor: "#FFA088" }, // 1,1x - 1,3x salmão
  { de: 1.4, cor: "#FF704D" }, // 1,4x - 1,7x coral
  { de: 1.8, cor: "#E63926" }, // 1,8x - 2,2x vermelho vivo
  { de: 2.3, cor: "#A61C1C" }, // 2,3x ou mais vinho
];

/** Cor sólida da faixa do multiplicador; acima de 3,0x segue no vinho. */
export function corDoMultiplicador(multiplicador: number): string {
  let faixa = FAIXAS[0];

  for (const candidata of FAIXAS) {
    if (multiplicador >= candidata.de) faixa = candidata;
  }

  return faixa.cor;
}

// no modo de valor fixo não há multiplicador: a intensidade (0 a 1) é
// espalhada na mesma escala, de 1,1x a 3,0x
export const multiplicadorEquivalente = (intensidade: number) =>
  1.1 + Math.min(Math.max(intensidade, 0), 1) * 1.9;
