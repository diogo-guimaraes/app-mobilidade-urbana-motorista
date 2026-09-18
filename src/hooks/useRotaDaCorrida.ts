import { api } from "@/Services/api";
import type { CorridaEmCurso } from "@/hooks/useDespachoMotorista";
import { useEffect, useState } from "react";

export interface Coordenada {
  latitude: number;
  longitude: number;
}

// enquanto o motorista vai buscar, o alvo é a origem; depois do embarque,
// o destino — mesma regra que o backend usa pra estimar a chegada
const TIPO_ALVO: Record<string, "origem" | "destino"> = {
  aceita: "origem",
  motorista_chegou: "origem",
  em_andamento: "destino",
};

// só refaz o traçado se o motorista andou o bastante pra mudar o desenho.
// sem isso cada envio de posição (8s) viraria uma chamada de Directions
const DISTANCIA_PARA_REFAZER_KM = 0.25;

const numero = (valor: number | string | null | undefined) => {
  const convertido = typeof valor === "string" ? Number(valor) : valor;

  return typeof convertido === "number" && Number.isFinite(convertido)
    ? convertido
    : null;
};

const distanciaKm = (a: Coordenada, b: Coordenada) => {
  const raio = 6371;
  const rad = (grau: number) => (grau * Math.PI) / 180;
  const dLat = rad(b.latitude - a.latitude);
  const dLon = rad(b.longitude - a.longitude);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.latitude)) *
      Math.cos(rad(b.latitude)) *
      Math.sin(dLon / 2) ** 2;

  return 2 * raio * Math.asin(Math.min(1, Math.sqrt(h)));
};

export function alvoDaCorrida(
  corrida: CorridaEmCurso | null,
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

export function useRotaDaCorrida(
  corrida: CorridaEmCurso | null,
  posicao: Coordenada | null,
) {
  const [rota, setRota] = useState<Coordenada[]>([]);
  const [origemDoTracado, setOrigemDoTracado] = useState<Coordenada | null>(
    null,
  );

  const alvo = alvoDaCorrida(corrida);
  const chaveAlvo = alvo ? `${alvo.latitude},${alvo.longitude}` : "";

  // o traçado é refeito quando muda o alvo ou quando o motorista se afastou
  const precisaRefazer =
    origemDoTracado === null ||
    (posicao !== null &&
      distanciaKm(origemDoTracado, posicao) > DISTANCIA_PARA_REFAZER_KM);

  useEffect(() => {
    if (chaveAlvo === "") {
      setRota([]);
      setOrigemDoTracado(null);
      return;
    }

    if (posicao === null || !precisaRefazer) return;

    let cancelado = false;
    const partida = posicao;

    api
      .post<{ coordinates: Coordenada[] }>("/tracado-rota", {
        pontos: [
          partida,
          { latitude: alvo!.latitude, longitude: alvo!.longitude },
        ],
      })
      .then(({ data }) => {
        if (cancelado) return;

        const coordenadas = data?.coordinates ?? [];

        if (coordenadas.length === 0) return;

        setRota(coordenadas);
        setOrigemDoTracado(partida);
      })
      .catch(() => {
        // sem traçado o mapa continua útil: some a linha, não a corrida
      });

    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chaveAlvo, posicao, precisaRefazer]);

  return { rota, alvo };
}
