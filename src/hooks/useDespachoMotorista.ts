import { api } from "@/Services/api";
import { obterEcho } from "@/Services/echo";
import * as Location from "expo-location";
import { useCallback, useEffect, useRef, useState } from "react";

const INTERVALO_BUSCA_SEM_SOCKET_MS = 5000;
const INTERVALO_BUSCA_COM_SOCKET_MS = 30000;
const INTERVALO_POSICAO_MS = 8000;

export interface OfertaCorrida {
  corrida_id: number;
  codigo_corrida: string;
  distancia_ate_origem_km: number;
  distancia_corrida_km: number;
  valor_motorista: number;
  origem: string;
  destino: string | null;
  paradas: number;
  passageiro_nota: number | null;
  passageiro_corridas: number;
}

export interface CorridaEmCurso {
  id: number;
  codigo_corrida: string;
  status_corrida: string;
  corrida_destinos?: {
    tipo: string;
    endereco: string | null;
    latitude: number | string | null;
    longitude: number | string | null;
  }[];
}

export interface PassageiroDaCorrida {
  nome: string;
  foto: string | null;
  telefone: string | null;
  nota: number | null;
  corridas: number;
}

export interface ChegadaEstimada {
  minutos: number;
  distancia_km: number;
  alvo: "origem" | "destino";
}

const mensagemDoErro = (erro: unknown, padrao: string) => {
  const resposta = (erro as { response?: { data?: { message?: string } } })
    ?.response;

  return resposta?.data?.message ?? padrao;
};

export function useDespachoMotorista() {
  const [disponivel, setDisponivel] = useState(false);
  const [oferta, setOferta] = useState<OfertaCorrida | null>(null);
  const [corrida, setCorrida] = useState<CorridaEmCurso | null>(null);
  const [chegada, setChegada] = useState<ChegadaEstimada | null>(null);
  const [passageiro, setPassageiro] = useState<PassageiroDaCorrida | null>(
    null,
  );
  // o servidor recusa com 403 + situacao quando o cadastro ainda não foi
  // aprovado; a home usa isso para mandar o motorista para a liberação
  const [precisaLiberacao, setPrecisaLiberacao] = useState(false);
  const [posicao, setPosicao] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [socketAtivo, setSocketAtivo] = useState(false);
  const [gatilho, setGatilho] = useState(0);

  const recusadas = useRef<Set<number>>(new Set());

  const posicaoAtual = useCallback(async () => {
    const permissao = await Location.requestForegroundPermissionsAsync();

    if (permissao.status !== "granted") return null;

    const { coords } = await Location.getCurrentPositionAsync({});

    return { latitude: coords.latitude, longitude: coords.longitude };
  }, []);

  const carregarCorridaAtual = useCallback(async () => {
    try {
      const { data } = await api.get<{
        corrida: CorridaEmCurso | null;
        chegada: ChegadaEstimada | null;
        passageiro: PassageiroDaCorrida | null;
      }>("/minha-corrida-atual");

      setCorrida(data?.corrida ?? null);
      setChegada(data?.chegada ?? null);
      setPassageiro(data?.passageiro ?? null);
    } catch {
      // silencioso: é só sincronização de estado
    }
  }, []);

  // o servidor é a fonte da verdade: abrir o app sem isso deixava o motorista
  // recebendo corridas no backend enquanto a tela mostrava "Conectar"
  const sincronizarSituacao = useCallback(async () => {
    try {
      const { data } = await api.get<{
        disponivel: boolean;
        corrida: CorridaEmCurso | null;
      }>("/motorista/situacao");

      setDisponivel(Boolean(data?.disponivel));
      setCorrida(data?.corrida ?? null);
      setPrecisaLiberacao(false);
    } catch (falha) {
      const resposta = (
        falha as {
          response?: { status?: number; data?: { situacao?: string } };
        }
      )?.response;

      if (resposta?.status === 403 && resposta.data?.situacao !== undefined) {
        setPrecisaLiberacao(true);
      }
    }
  }, []);

  useEffect(() => {
    sincronizarSituacao().then(carregarCorridaAtual);
  }, [sincronizarSituacao, carregarCorridaAtual]);

  const alternarDisponibilidade = useCallback(
    async (novoEstado: boolean) => {
      setErro("");
      setOcupado(true);

      try {
        const posicao = novoEstado ? await posicaoAtual() : null;

        if (novoEstado && posicao === null) {
          setErro("Precisamos da sua localização para receber corridas.");
          return;
        }

        await api.post("/motorista/disponibilidade", {
          disponivel: novoEstado,
          latitude: posicao?.latitude,
          longitude: posicao?.longitude,
        });

        setDisponivel(novoEstado);

        if (!novoEstado) setOferta(null);
      } catch (falha) {
        setErro(mensagemDoErro(falha, "Não foi possível mudar seu status."));
      } finally {
        setOcupado(false);
      }
    },
    [posicaoAtual],
  );

  useEffect(() => {
    if (!disponivel || corrida !== null) return;

    let cancelado = false;

    const buscar = async () => {
      try {
        const { data } = await api.get<{ corridas: OfertaCorrida[] }>(
          "/motorista/corridas-disponiveis",
        );

        if (cancelado) return;

        const proxima = (data?.corridas ?? []).find(
          (item) => !recusadas.current.has(item.corrida_id),
        );

        setOferta(proxima ?? null);
      } catch {
        if (!cancelado) setOferta(null);
      }
    };

    buscar();

    const relogio = setInterval(
      buscar,
      socketAtivo
        ? INTERVALO_BUSCA_COM_SOCKET_MS
        : INTERVALO_BUSCA_SEM_SOCKET_MS,
    );

    return () => {
      cancelado = true;
      clearInterval(relogio);
    };
  }, [disponivel, corrida, socketAtivo, gatilho]);

  // WebSocket em cima do polling: avisa que a lista mudou e o hook refaz a
  // consulta (o raio e a autorização seguem no servidor). Sem socket, o
  // intervalo normal de 5s continua valendo.
  useEffect(() => {
    if (!disponivel || corrida !== null) {
      setSocketAtivo(false);
      return;
    }

    const echo = obterEcho();

    if (echo === null) return;

    try {
      echo
        .private("corridas-disponiveis")
        .listen(".corridas.disponiveis", () => setGatilho((n) => n + 1));

      setSocketAtivo(true);
    } catch {
      setSocketAtivo(false);
    }

    return () => {
      setSocketAtivo(false);

      try {
        echo.leave("corridas-disponiveis");
      } catch {
        // sair do canal é best-effort
      }
    };
  }, [disponivel, corrida]);

  useEffect(() => {
    if (corrida === null) return;

    let cancelado = false;

    const enviarPosicao = async () => {
      const posicao = await posicaoAtual();

      if (cancelado || posicao === null) return;

      setPosicao(posicao);

      try {
        await api.post("/motorista/posicao", posicao);
      } catch {
        // posição é informativa; falhar aqui não pode atrapalhar a corrida
      }

      // posição nova, previsão nova
      if (!cancelado) await carregarCorridaAtual();
    };

    enviarPosicao();

    const relogio = setInterval(enviarPosicao, INTERVALO_POSICAO_MS);

    return () => {
      cancelado = true;
      clearInterval(relogio);
    };
  }, [corrida, posicaoAtual, carregarCorridaAtual]);

  const aceitar = useCallback(async () => {
    if (oferta === null) return;

    setOcupado(true);
    setErro("");

    try {
      const { data } = await api.post<CorridaEmCurso>(
        `/motorista/corridas/${oferta.corrida_id}/aceitar`,
      );

      setCorrida(data);
      setOferta(null);
      setDisponivel(false);

      // a resposta do aceite não traz passageiro nem previsão de chegada
      await carregarCorridaAtual();
    } catch (falha) {
      setErro(mensagemDoErro(falha, "Não foi possível aceitar a corrida."));
      setOferta(null);
    } finally {
      setOcupado(false);
    }
  }, [oferta, carregarCorridaAtual]);

  const recusar = useCallback(() => {
    if (oferta !== null) recusadas.current.add(oferta.corrida_id);

    setOferta(null);
  }, [oferta]);

  const avancar = useCallback(
    async (acao: "cheguei" | "iniciar" | "finalizar") => {
      if (corrida === null) return;

      setOcupado(true);
      setErro("");

      try {
        const { data } = await api.post<CorridaEmCurso>(
          `/motorista/corridas/${corrida.id}/${acao}`,
        );

        setCorrida(acao === "finalizar" ? null : data);

        if (acao === "finalizar") {
          setChegada(null);
        } else {
          await carregarCorridaAtual();
        }
      } catch (falha) {
        setErro(mensagemDoErro(falha, "Não foi possível atualizar a corrida."));
        await carregarCorridaAtual();
      } finally {
        setOcupado(false);
      }
    },
    [corrida, carregarCorridaAtual],
  );

  return {
    disponivel,
    oferta,
    corrida,
    chegada,
    passageiro,
    posicao,
    precisaLiberacao,
    erro,
    ocupado,
    alternarDisponibilidade,
    aceitar,
    recusar,
    avancar,
  };
}
