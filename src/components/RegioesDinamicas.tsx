import DemandaSuave from "@/components/DemandaSuave";
import SeloDinamico from "@/components/SeloDinamico";
import {
  iconesDaDemanda,
  demandaDaRegiao,
  verticesDoHexagono,
  type CamadasDoMapa,
  type MapaDinamico,
} from "@/domain/dinamica";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { memo, useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Marker, Polygon } from "react-native-maps";
import { LIMITE_ICONES, LIMITE_NIVEL_1 } from "@/theme/demandaCores";
import {
  corDoMultiplicador,
  multiplicadorEquivalente,
} from "@/theme/dinamicaCores";
import { useTema } from "@/theme/tema";

interface Props {
  mapa: MapaDinamico;
  camadas: CamadasDoMapa;
}

/**
 * Camadas do mapa de calor, dentro do MapView:
 * - Demanda: manchas sem borda por baixo, mais fortes onde há mais procura, com
 *   de 1 a 4 bonequinhos no centro;
 * - Tarifas: hexágonos sem borda, na cor sólida da faixa do multiplicador (a
 *   demanda não aparece por baixo), e um selo por bloco de regiões vizinhas com o menor e o maior valor ("1,1x-1,4x").
 */
function RegioesDinamicas({ mapa, camadas }: Props) {
  const desenhos = useMemo(
    () =>
      mapa.regioes.map((regiao) => ({
        regiao,
        cor: corDoMultiplicador(
          mapa.modo === "valor_fixo"
            ? multiplicadorEquivalente(regiao.intensidade)
            : regiao.multiplicador,
        ),
        vertices: verticesDoHexagono(regiao, mapa.raio_metros),
      })),
    [mapa],
  );

  // a demanda vale sozinha: cobre também onde não há tarifa
  const { lista, candidatas, comTarifa } = useMemo(() => {
    const comTarifa = new Set(mapa.regioes.map((regiao) => regiao.celula));
    const lista = (
      mapa.demandas ??
      mapa.regioes.map((regiao) => ({
        celula: regiao.celula,
        latitude: regiao.latitude,
        longitude: regiao.longitude,
        demanda: demandaDaRegiao(regiao),
      }))
    ).filter((area) => area.demanda >= LIMITE_NIVEL_1);

    return {
      comTarifa,
      lista,
      candidatas: lista.filter((area) => area.demanda >= LIMITE_ICONES),
    };
  }, [mapa]);

  // onde há tarifa dinâmica o valor ocupa o centro: sem bonequinho ali, e a
  // área de ícones é refeita só com as células sem tarifa
  const icones = useMemo(
    () =>
      iconesDaDemanda(
        camadas.tarifas
          ? candidatas.filter((area) => !comTarifa.has(area.celula))
          : candidatas,
      ),
    [candidatas, comTarifa, camadas.tarifas],
  );

  return (
    <>
      {camadas.demanda && (
        <DemandaSuave
          areas={lista}
          raioMetros={mapa.raio_metros}
          // o hexágono do dinâmico é sólido: a mancha fica só fora dele
          ocultas={camadas.tarifas ? comTarifa : undefined}
        />
      )}
      {camadas.tarifas &&
        desenhos.map(({ regiao, cor, vertices }) => (
          <Polygon
            key={`area:${regiao.celula}`}
            coordinates={vertices}
            fillColor={cor}
            strokeColor="rgba(0,0,0,0)"
            strokeWidth={0}
            // abaixo da rota (10) e dos pontos da corrida (20)
            zIndex={2}
          />
        ))}
      {camadas.demanda &&
        icones.map((icone) => (
          <BonequinhosDaRegiao
            key={`gente:${icone.celula}:${icone.nivel}`}
            regiao={icone}
            quantidade={icone.nivel}
          />
        ))}
      {camadas.tarifas &&
        mapa.clusters?.map((cluster) => (
          <SeloDinamico
            key={`selo:${cluster.id}:${cluster.rotulo}`}
            latitude={cluster.latitude}
            longitude={cluster.longitude}
            rotulo={cluster.rotulo}
          />
        ))}
    </>
  );
}

// No Android o Marker com View só desenha o conteúdo se acompanhar a mudança
// da view no primeiro quadro; depois disso volta a false para não pesar.
function useRastrearPorUmMomento() {
  const [rastrear, setRastrear] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setRastrear(false), 1200);

    return () => clearTimeout(timer);
  }, []);

  return rastrear;
}

function BonequinhosDaRegiao({
  regiao,
  quantidade,
}: {
  regiao: { latitude: number; longitude: number };
  quantidade: number;
}) {
  const rastrear = useRastrearPorUmMomento();
  const { escuro } = useTema();
  const cor = "#FFFFFF";

  return (
    <Marker
      // o tema entra na chave de desenho: o marcador congela depois do 1º quadro
      key={escuro ? "escuro" : "claro"}
      coordinate={regiao}
      anchor={{ x: 0.5, y: 0.5 }}
      tracksViewChanges={rastrear}
      tappable={false}
      zIndex={2}
    >
      <View style={[styles.bonequinhos, escuro && styles.bonequinhosEscuro]}>
        {quantidade === 3 ? (
          // demanda extrema: o ícone de grupo com 3 pessoas
          <MaterialIcons name="groups" size={24} color={cor} />
        ) : quantidade === 2 ? (
          // demanda alta: o ícone de duas pessoas
          <Ionicons name="people" size={19} color={cor} />
        ) : (
          <Ionicons name="person" size={16} color={cor} />
        )}
      </View>
    </Marker>
  );
}

export default memo(RegioesDinamicas);

const styles = StyleSheet.create({
  bonequinhos: {
    flexDirection: "row",
    // sem fundo: só as silhuetas, para ocupar o mínimo do hexágono
    marginHorizontal: -1,
  },
  bonequinhosEscuro: {},
});
