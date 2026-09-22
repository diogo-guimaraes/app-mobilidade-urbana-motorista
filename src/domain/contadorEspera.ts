export interface ResumoEspera {
  inicio_em: string;
  calculado_em: string;
  segundos_decorridos: number;
  tolerancia_segundos: number;
  limite_cobranca_segundos: number;
  segundos_cobrados: number;
  segundos_tolerancia_restantes: number;
  limite_atingido: boolean;
  valor_por_minuto: number;
  taxa_plataforma_percentual: number;
  valor_taxa_motorista: number;
  valor_taxa_passageiro: number;
}

export interface ContadorEspera {
  fase: "tolerancia" | "cobrando" | "limite";
  rotulo: string;
  tempo: string;
  apoio: string;
  valor: number;
  segundosCobrados: number;
}

export type PerspectivaEspera = "motorista" | "passageiro";

const limitar = (valor: number, minimo: number, maximo: number) =>
  Math.min(Math.max(valor, minimo), maximo);

export const formatarTempoEspera = (segundos: number) => {
  const total = Math.max(0, Math.floor(segundos));
  const minutos = Math.floor(total / 60);
  const restante = total % 60;

  return `${String(minutos).padStart(2, "0")}:${String(restante).padStart(2, "0")}`;
};

export function calcularContadorEspera(
  resumo: ResumoEspera,
  segundosDesdeResumo: number,
  perspectiva: PerspectivaEspera,
): ContadorEspera {
  const decorridos = Math.max(
    0,
    Math.floor(resumo.segundos_decorridos + segundosDesdeResumo),
  );
  const cobrados = limitar(
    decorridos - resumo.tolerancia_segundos,
    0,
    resumo.limite_cobranca_segundos,
  );
  const toleranciaRestante = Math.max(
    resumo.tolerancia_segundos - decorridos,
    0,
  );
  const motoristaCentavos = Math.round(
    resumo.valor_por_minuto * (cobrados / 60) * 100,
  );
  const percentual = limitar(resumo.taxa_plataforma_percentual, 0, 95) / 100;
  const passageiroCentavos = Math.round(motoristaCentavos / (1 - percentual));
  const valor =
    (perspectiva === "motorista" ? motoristaCentavos : passageiroCentavos) /
    100;

  if (toleranciaRestante > 0) {
    return {
      fase: "tolerancia",
      rotulo: "Tolerância gratuita",
      tempo: formatarTempoEspera(toleranciaRestante),
      apoio: "A cobrança começa depois de 2 minutos.",
      valor: 0,
      segundosCobrados: 0,
    };
  }

  if (cobrados >= resumo.limite_cobranca_segundos) {
    return {
      fase: "limite",
      rotulo: "Limite de espera atingido",
      tempo: formatarTempoEspera(resumo.limite_cobranca_segundos),
      apoio: "A taxa não aumentará após 12 minutos cobrados.",
      valor,
      segundosCobrados: cobrados,
    };
  }

  return {
    fase: "cobrando",
    rotulo: "Tempo de espera cobrado",
    tempo: formatarTempoEspera(cobrados),
    apoio: "Cobrança limitada a 12 minutos.",
    valor,
    segundosCobrados: cobrados,
  };
}
