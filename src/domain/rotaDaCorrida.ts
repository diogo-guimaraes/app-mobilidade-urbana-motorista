export interface Coordenada {
  latitude: number;
  longitude: number;
}

interface DestinoDaCorrida {
  tipo: string;
  latitude: number | string | null;
  longitude: number | string | null;
}

interface CorridaComDestinos {
  status_corrida: string;
  corrida_destinos?: DestinoDaCorrida[];
}

const TIPO_ALVO: Record<string, "origem" | "destino"> = {
  aceita: "origem",
  motorista_chegou: "origem",
  em_andamento: "destino",
};

const numero = (valor: number | string | null | undefined) => {
  const convertido = typeof valor === "string" ? Number(valor) : valor;

  return typeof convertido === "number" && Number.isFinite(convertido)
    ? convertido
    : null;
};

export function alvoDaCorrida(
  corrida: CorridaComDestinos | null,
): Coordenada | null {
  if (corrida === null) return null;

  const tipo = TIPO_ALVO[corrida.status_corrida];
  if (!tipo) return null;

  const destino = corrida.corrida_destinos?.find((item) => item.tipo === tipo);
  const latitude = numero(destino?.latitude);
  const longitude = numero(destino?.longitude);

  if (latitude === null || longitude === null) return null;

  return { latitude, longitude };
}
