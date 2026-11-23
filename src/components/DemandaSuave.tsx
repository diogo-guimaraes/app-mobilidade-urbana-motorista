import { imagemDaDemanda, type AreaDeDemanda } from "@/domain/demandaSuave";
import { ESPALHAMENTO_DA_MANCHA } from "@/theme/demandaCores";
import { memo, useMemo } from "react";
import { Overlay } from "react-native-maps";

interface Props {
  areas: AreaDeDemanda[];
  raioMetros: number;
  // células com outra camada por cima (os hexágonos do dinâmico): sem mancha
  ocultas?: ReadonlySet<string>;
}

// o mapa avisa a cada consulta, mas só vale refazer a imagem quando a demanda
// de fato mudou
const assinatura = (
  areas: AreaDeDemanda[],
  raioMetros: number,
  ocultas?: ReadonlySet<string>,
) =>
  `${raioMetros}|${areas
    .map(
      (a) => `${a.latitude.toFixed(4)},${a.longitude.toFixed(4)},${a.demanda}`,
    )
    .join(";")}|${ocultas ? [...ocultas].sort().join(",") : ""}`;

/**
 * Mancha de demanda: uma imagem desfocada, do amarelo claro nas bordas ao âmbar
 * no núcleo, sem linha de borda para o nome das ruas aparecer. É um objeto só no
 * mapa, em vez de um polígono por contorno.
 */
function DemandaSuave({ areas, raioMetros, ocultas }: Props) {
  const chave = assinatura(areas, raioMetros, ocultas);
  const imagem = useMemo(
    () => imagemDaDemanda(areas, raioMetros, ESPALHAMENTO_DA_MANCHA, ocultas),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chave],
  );

  if (imagem === null) return null;

  return (
    <Overlay key={chave} image={{ uri: imagem.uri }} bounds={imagem.bounds} />
  );
}

export default memo(DemandaSuave);
