import { api } from "@/Services/api";
import { obterEcho } from "@/Services/echo";
import { useToast } from "@/context/ToastContext";
import { ResumoEspera } from "@/domain/contadorEspera";
import * as Location from "expo-location";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";

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
  foto_oculta?: boolean;
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
  const { mostrarToast } = useToast();
  const [disponivel, setDisponivel] = useState(false);
  const [oferta, setOferta] = useState<OfertaCorrida | null>(null);
  const [ofertas, setOfertas] = useState<OfertaCorrida[]>([]);
  const [carregandoOfertas, setCarregandoOfertas] = useState(false);
  const [corrida, setCorrida] = useState<CorridaEmCurso | null>(null);
  const [chegada, setChegada] = useState<ChegadaEstimada | null>(null);
  const [espera, setEspera] = useState<ResumoEspera | null>(null);
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
  const [ocupado, setOcupado] = useState(false);
  const [socketAtivo, setSocketAtivo] = useState(false);
  const [gatilho, setGatilho] = useState(0);

  const recusadas = useRef<Set<number>>(new Set());
  const corridaRef = useRef<CorridaEmCurso | null>(null);

  const aplicarCorrida = useCallback(
    (nova: CorridaEmCurso | null, avisarEncerramento = true) => {
      const anterior = corridaRef.current;

      if (avisarEncerramento && anterior !== null && nova === null) {
        mostrarToast({
          tipo: "warning",
          titulo: "Corrida encerrada",
          mensagem:
            "A corrida não está mais ativa e você voltou a receber ofertas.",
          chave: `corrida:${anterior.id}:encerrada-remotamente`,
        });
      }

      corridaRef.current = nova;
      setCorrida((atual) =>
        JSON.stringify(atual) === JSON.stringify(nova) ? atual : nova,
      );
    },
    [mostrarToast],
  );

  const posicaoAtual = useCallback(async () => {
    let permissao = await Location.getForegroundPermissionsAsync();
    if (permissao.status !== "granted")
      permissao = await Location.requestForegroundPermissionsAsync();

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
        espera: ResumoEspera | null;
      }>("/minha-corrida-atual", { timeout: 10000 });

      aplicarCorrida(data?.corrida ?? null);
      setChegada((anterior) =>
        JSON.stringify(anterior) === JSON.stringify(data?.chegada ?? null)
          ? anterior
          : (data?.chegada ?? null),
      );
      setPassageiro((anterior) =>
        JSON.stringify(anterior) === JSON.stringify(data?.passageiro ?? null)
          ? anterior
          : (data?.passageiro ?? null),
      );
      setEspera(data?.espera ?? null);
    } catch {
      // silencioso: é só sincronização de estado
    }
  }, [aplicarCorrida]);

  // o servidor é a fonte da verdade: abrir o app sem isso deixava o motorista
  // recebendo corridas no backend enquanto a tela mostrava "Conectar"
  const sincronizarSituacao = useCallback(async () => {
    try {
      const { data } = await api.get<{
        disponivel: boolean;
        corrida: CorridaEmCurso | null;
        posicao: { latitude: number; longitude: number } | null;
      }>("/motorista/situacao");

      setDisponivel(Boolean(data?.disponivel));
      aplicarCorrida(data?.corrida ?? null);
      if (data?.posicao) setPosicao(data.posicao);
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
  }, [aplicarCorrida]);

  useEffect(() => {
    const sincronizar = async () => {
      await sincronizarSituacao();
      await carregarCorridaAtual();
    };
    const inicio = setTimeout(sincronizar, 0);
    const assinatura = AppState.addEventListener("change", (estado) => {
      if (estado === "active") void sincronizar();
    });

    return () => {
      clearTimeout(inicio);
      assinatura.remove();
    };
  }, [sincronizarSituacao, carregarCorridaAtual]);

  const alternarDisponibilidade = useCallback(
    async (novoEstado: boolean) => {
      setOcupado(true);

      try {
        const posicao = novoEstado ? await posicaoAtual() : null;

        if (novoEstado && posicao === null) {
          mostrarToast({
            tipo: "warning",
            titulo: "Localização necessária",
            mensagem: "Permita o acesso ao GPS para receber corridas.",
          });
          return;
        }

        await api.post("/motorista/disponibilidade", {
          disponivel: novoEstado,
          latitude: posicao?.latitude,
          longitude: posicao?.longitude,
        });

        setDisponivel(novoEstado);
        setPosicao(posicao);

        if (!novoEstado) {
          setOferta(null);
          setOfertas([]);
        }

        mostrarToast({
          tipo: "success",
          titulo: novoEstado ? "Você está online" : "Você está offline",
          mensagem: novoEstado
            ? "As corridas próximas já podem aparecer para você."
            : "Novas solicitações foram pausadas.",
          chave: `disponibilidade:${novoEstado}`,
        });
      } catch (falha) {
        mostrarToast({
          tipo: "error",
          titulo: "Não foi possível mudar seu status",
          mensagem: mensagemDoErro(
            falha,
            "Confira sua conexão e tente novamente.",
          ),
        });
      } finally {
        setOcupado(false);
      }
    },
    [mostrarToast, posicaoAtual],
  );

  useEffect(() => {
    if (!disponivel || corrida !== null) return;

    let cancelado = false;

    let emBusca = false;
    const buscar = async () => {
      if (emBusca) return;
      emBusca = true;
      setCarregandoOfertas(true);
      try {
        const { data } = await api.get<{ corridas: OfertaCorrida[] }>(
          "/motorista/corridas-disponiveis",
          { timeout: 10000 },
        );

        if (cancelado) return;

        const atuais = (data?.corridas ?? []).filter(
          (item) => !recusadas.current.has(item.corrida_id),
        );
        const proxima = atuais[0];

        setOfertas(atuais);
        setOferta(proxima ?? null);
      } catch {
        if (!cancelado) {
          setOferta(null);
          setOfertas([]);
        }
      } finally {
        emBusca = false;
        if (!cancelado) setCarregandoOfertas(false);
      }
    };

    const buscaInicial = setTimeout(buscar, 0);

    const relogio = setInterval(
      buscar,
      socketAtivo
        ? INTERVALO_BUSCA_COM_SOCKET_MS
        : INTERVALO_BUSCA_SEM_SOCKET_MS,
    );

    return () => {
      cancelado = true;
      clearTimeout(buscaInicial);
      clearInterval(relogio);
    };
  }, [disponivel, corrida, socketAtivo, gatilho]);

  // WebSocket em cima do polling: avisa que a lista mudou e o hook refaz a
  // consulta (o raio e a autorização seguem no servidor). Sem socket, o
  // intervalo normal de 5s continua valendo.
  useEffect(() => {
    if (!disponivel || corrida !== null) {
      return;
    }

    const echo = obterEcho();

    if (echo === null) return;

    try {
      const cancelarObservacao = echo.connector.onConnectionChange((status) => {
        setSocketAtivo(status === "connected");
      });
      const estadoInicial = setTimeout(() => {
        setSocketAtivo(echo.connector.connectionStatus() === "connected");
      }, 0);
      echo
        .private("corridas-disponiveis")
        .listen(".corridas.disponiveis", () => setGatilho((n) => n + 1));

      return () => {
        clearTimeout(estadoInicial);
        cancelarObservacao();
        setSocketAtivo(false);
        try {
          echo.leave("corridas-disponiveis");
        } catch {
          /* canal já encerrado */
        }
      };
    } catch {}
  }, [disponivel, corrida]);

  const corridaAtivaId = corrida?.id;
  useEffect(() => {
    if (!disponivel && corridaAtivaId === undefined) return;

    let cancelado = false;

    let enviando = false;
    const enviarPosicao = async () => {
      if (enviando) return;
      enviando = true;
      try {
        const posicao = await posicaoAtual();

        if (cancelado || posicao === null) return;

        setPosicao((anterior) =>
          anterior?.latitude === posicao.latitude &&
          anterior.longitude === posicao.longitude
            ? anterior
            : posicao,
        );

        try {
          await api.post("/motorista/posicao", posicao);
        } catch {
          // posição é informativa; falhar aqui não pode atrapalhar a corrida
        }

        // durante corrida, posição nova também produz uma previsão nova
        if (!cancelado && corridaAtivaId !== undefined)
          await carregarCorridaAtual();
      } catch {
        // GPS indisponível nesta rodada; o próximo intervalo tenta de novo.
      } finally {
        enviando = false;
      }
    };

    enviarPosicao();

    const relogio = setInterval(enviarPosicao, INTERVALO_POSICAO_MS);

    return () => {
      cancelado = true;
      clearInterval(relogio);
    };
  }, [disponivel, corridaAtivaId, posicaoAtual, carregarCorridaAtual]);

  const aceitar = useCallback(
    async (corridaId?: number) => {
      const escolhida =
        corridaId === undefined
          ? oferta
          : (ofertas.find((item) => item.corrida_id === corridaId) ?? null);
      if (escolhida === null) return;

      setOcupado(true);

      try {
        const { data } = await api.post<CorridaEmCurso>(
          `/motorista/corridas/${escolhida.corrida_id}/aceitar`,
        );

        aplicarCorrida(data, false);
        setOferta(null);
        setOfertas([]);
        setDisponivel(false);

        mostrarToast({
          tipo: "success",
          titulo: "Corrida aceita",
          mensagem: "Siga a rota até o ponto de embarque do passageiro.",
          chave: `corrida:${data.id}:aceita`,
        });

        if (posicao === null) {
          const atual = await posicaoAtual();
          if (atual !== null) {
            setPosicao(atual);
            void api.post("/motorista/posicao", atual).catch(() => undefined);
          }
        }

        // a resposta do aceite não traz passageiro nem previsão de chegada
        await carregarCorridaAtual();
      } catch (falha) {
        mostrarToast({
          tipo: "error",
          titulo: "Não foi possível aceitar a corrida",
          mensagem: mensagemDoErro(
            falha,
            "A oferta pode ter sido aceita por outro motorista.",
          ),
        });
        setOferta(null);
        setOfertas((atuais) =>
          atuais.filter((item) => item.corrida_id !== escolhida.corrida_id),
        );
        await sincronizarSituacao();
        await carregarCorridaAtual();
      } finally {
        setOcupado(false);
      }
    },
    [
      oferta,
      ofertas,
      posicao,
      posicaoAtual,
      aplicarCorrida,
      mostrarToast,
      sincronizarSituacao,
      carregarCorridaAtual,
    ],
  );

  const recusar = useCallback(
    (corridaId?: number) => {
      const id = corridaId ?? oferta?.corrida_id;
      if (id !== undefined) recusadas.current.add(id);

      const restantes = ofertas.filter((item) => item.corrida_id !== id);
      setOfertas(restantes);
      setOferta(restantes[0] ?? null);
      mostrarToast({
        tipo: "info",
        titulo: "Solicitação recusada",
        mensagem: "Essa oferta não será mostrada novamente.",
      });
    },
    [oferta, ofertas, mostrarToast],
  );

  const recarregarOfertas = useCallback(
    () => setGatilho((atual) => atual + 1),
    [],
  );

  const avancar = useCallback(
    async (acao: "cheguei" | "iniciar" | "finalizar") => {
      if (corrida === null) return;

      setOcupado(true);

      try {
        const { data } = await api.post<CorridaEmCurso>(
          `/motorista/corridas/${corrida.id}/${acao}`,
        );

        aplicarCorrida(acao === "finalizar" ? null : data, false);

        const avisos = {
          cheguei: {
            titulo: "Chegada informada",
            mensagem: "O passageiro foi avisado que você está no local.",
          },
          iniciar: {
            titulo: "Corrida iniciada",
            mensagem: "A rota agora segue para o destino.",
          },
          finalizar: {
            titulo: "Corrida finalizada",
            mensagem: "Você continua online e pode receber novas ofertas.",
          },
        } as const;
        const aviso = avisos[acao];

        mostrarToast({
          tipo: "success",
          ...aviso,
          chave: `corrida:${corrida.id}:${acao}`,
        });

        if (acao === "finalizar") {
          setDisponivel(true);
          setChegada(null);
          setEspera(null);
          setPassageiro(null);
          recusadas.current.clear();
          setGatilho((atual) => atual + 1);
          await sincronizarSituacao();
        } else {
          await carregarCorridaAtual();
        }
      } catch (falha) {
        mostrarToast({
          tipo: "error",
          titulo: "Não foi possível atualizar a corrida",
          mensagem: mensagemDoErro(
            falha,
            "Confira sua conexão e tente novamente.",
          ),
        });
        await carregarCorridaAtual();
      } finally {
        setOcupado(false);
      }
    },
    [
      corrida,
      aplicarCorrida,
      mostrarToast,
      carregarCorridaAtual,
      sincronizarSituacao,
    ],
  );

  const cancelarNaoComparecimento = useCallback(async () => {
    if (corrida === null || ocupado) return;
    setOcupado(true);
    try {
      const atual = await posicaoAtual();
      if (atual === null) throw new Error("Localização indisponível.");
      await api.post("/motorista/posicao", atual);
      await api.post(`/motorista/corridas/${corrida.id}/cancelar`, {
        tipo: "nao_comparecimento",
        motivo: "Passageiro não compareceu ao embarque",
      });
      aplicarCorrida(null, false);
      setEspera(null);
      setChegada(null);
      setPassageiro(null);
      setDisponivel(true);
      setGatilho((atual) => atual + 1);
      mostrarToast({
        tipo: "info",
        titulo: "Corrida cancelada por ausência",
        mensagem: "A tarifa base foi registrada como taxa de cancelamento.",
      });
      await sincronizarSituacao();
    } catch (falha) {
      mostrarToast({
        tipo: "error",
        titulo: "Não foi possível cancelar por ausência",
        mensagem: mensagemDoErro(
          falha,
          "Confira sua localização e tente novamente.",
        ),
      });
    } finally {
      setOcupado(false);
    }
  }, [
    corrida,
    ocupado,
    posicaoAtual,
    aplicarCorrida,
    mostrarToast,
    sincronizarSituacao,
  ]);

  return {
    disponivel,
    oferta,
    ofertas,
    carregandoOfertas,
    corrida,
    chegada,
    espera,
    passageiro,
    posicao,
    precisaLiberacao,
    ocupado,
    alternarDisponibilidade,
    aceitar,
    recusar,
    recarregarOfertas,
    avancar,
    cancelarNaoComparecimento,
  };
}
