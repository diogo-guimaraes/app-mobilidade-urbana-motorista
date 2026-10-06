// CODEX: 33 linhas adicionadas e 11 removidas no diff atual; pausa rede e GPS durante a simulação local. Remover após validação/commit.
import { api } from "@/Services/api";
import { obterEcho } from "@/Services/echo";
import { useToast } from "@/context/ToastContext";
import { ResumoEspera } from "@/domain/contadorEspera";
import { proximoPontoDaCorrida } from "@/domain/rotaDaCorrida";
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
  recusada_localmente?: boolean;
}

export interface CorridaEmCurso {
  id: number;
  codigo_corrida: string;
  status_corrida: string;
  corrida_destinos?: {
    tipo: string;
    ordem?: number | null;
    endereco: string | null;
    latitude: number | string | null;
    longitude: number | string | null;
    concluida_em?: string | null;
  }[];
  corrida_financeiro?: {
    metodo_pagamento: string | null;
  } | null;
  produto?: { id: number; nome: string } | null;
  metodo_pagamento?: string | null;
}

// pedido do passageiro para trocar o destino (backend: AlterarCorridaService)
export interface PedidoNovoDestino {
  id: number;
  status: string;
  // trajeto inteiro pedido (paradas e destino) quando o passageiro editou as paradas
  paradas?: string[] | null;
  endereco: string;
  distancia_km: number;
  tempo_min: number;
  valor_motorista: number;
  valor_motorista_anterior: number | null;
  expira_em: string | null;
}

const ROTULO_PAGAMENTO: Record<string, string> = {
  dinheiro: "dinheiro",
  pix: "Pix",
  cartao: "cartão",
};

export interface PassageiroDaCorrida {
  nome: string;
  foto: string | null;
  foto_oculta?: boolean;
  telefone: string | null;
  nota: number | null;
  corridas: number;
}

// o cancelamento acontece dentro da tela Mais (um Modal), que cobre os
// toasts: quem chama mostra a mensagem de erro ali mesmo
export type ResultadoCancelamento =
  | { ok: true }
  | { ok: false; mensagem: string };

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

export function useDespachoMotorista(pausado = false) {
  const { mostrarToast } = useToast();
  const [disponivel, setDisponivel] = useState(false);
  const [oferta, setOferta] = useState<OfertaCorrida | null>(null);
  const [ofertas, setOfertas] = useState<OfertaCorrida[]>([]);
  const [carregandoOfertas, setCarregandoOfertas] = useState(false);
  const [corrida, setCorrida] = useState<CorridaEmCurso | null>(null);
  const [chegada, setChegada] = useState<ChegadaEstimada | null>(null);
  const [espera, setEspera] = useState<ResumoEspera | null>(null);
  const [pedidoNovoDestino, setPedidoNovoDestino] =
    useState<PedidoNovoDestino | null>(null);
  const [respondendoPedido, setRespondendoPedido] = useState(false);
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
  const [appAtivo, setAppAtivo] = useState(AppState.currentState === "active");

  const recusadas = useRef<Set<number>>(new Set());
  const corridaRef = useRef<CorridaEmCurso | null>(null);

  const aplicarCorrida = useCallback(
    (nova: CorridaEmCurso | null, avisarEncerramento = true) => {
      const anterior = corridaRef.current;

      if (avisarEncerramento && anterior !== null && nova === null) {
        setDisponivel(true);
        mostrarToast({
          tipo: "warning",
          titulo: "Corrida encerrada",
          mensagem:
            "A corrida não está mais ativa e você voltou a receber ofertas.",
          chave: `corrida:${anterior.id}:encerrada-remotamente`,
        });
      }

      if (nova !== null) setDisponivel(false);

      // o passageiro pode trocar a forma de pagamento uma vez por corrida
      if (
        anterior !== null &&
        nova !== null &&
        anterior.id === nova.id &&
        anterior.metodo_pagamento &&
        nova.metodo_pagamento &&
        anterior.metodo_pagamento !== nova.metodo_pagamento
      ) {
        const rotulo =
          ROTULO_PAGAMENTO[nova.metodo_pagamento] ?? nova.metodo_pagamento;
        mostrarToast({
          tipo: "info",
          titulo: "Pagamento alterado",
          mensagem: `O passageiro trocou para ${rotulo}.`,
          chave: `pagamento:${nova.id}:${nova.metodo_pagamento}`,
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
        alteracao_destino?: PedidoNovoDestino | null;
      }>("/minha-corrida-atual", {
        params: { perfil: "motorista" },
        timeout: 10000,
      });

      aplicarCorrida(data?.corrida ?? null);
      const pedido =
        data?.alteracao_destino?.status === "pendente"
          ? data.alteracao_destino
          : null;
      setPedidoNovoDestino((anterior) =>
        JSON.stringify(anterior) === JSON.stringify(pedido) ? anterior : pedido,
      );
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
    if (pausado) return;

    const sincronizar = async () => {
      await sincronizarSituacao();
      await carregarCorridaAtual();
    };
    const inicio = setTimeout(sincronizar, 0);
    const assinatura = AppState.addEventListener("change", (estado) => {
      const ativo = estado === "active";
      setAppAtivo(ativo);
      if (ativo) void sincronizar();
    });

    return () => {
      clearTimeout(inicio);
      assinatura.remove();
    };
  }, [pausado, sincronizarSituacao, carregarCorridaAtual]);

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

  // "Recusar novas corridas" (tela Mais do 99): ao fim da corrida atual o
  // motorista sai do ar em vez de voltar a receber ofertas. Espera o
  // `ocupado` baixar porque finalizar/cancelar ainda sincronizam a situação
  // com o servidor, e essa resposta (disponível) sobrescreveria o offline.
  const [recusarNovas, setRecusarNovas] = useState(false);
  const recusarNovasRef = useRef(false);
  const idCorridaAnterior = useRef<number | null>(null);
  const corridaEncerrada = useRef(false);

  const alternarRecusarNovas = useCallback(() => {
    const novo = !recusarNovasRef.current;
    recusarNovasRef.current = novo;
    setRecusarNovas(novo);
    mostrarToast({
      tipo: "info",
      titulo: novo ? "Novas corridas recusadas" : "Novas corridas liberadas",
      mensagem: novo
        ? "Você fica offline assim que esta corrida terminar."
        : "Ao terminar esta corrida você continua recebendo ofertas.",
      chave: `recusar-novas:${novo}`,
    });
  }, [mostrarToast]);

  useEffect(() => {
    if (idCorridaAnterior.current !== null && corrida === null) {
      corridaEncerrada.current = true;
    }
    idCorridaAnterior.current = corrida?.id ?? null;

    if (!corridaEncerrada.current || ocupado) return;
    corridaEncerrada.current = false;

    if (!recusarNovasRef.current) return;
    recusarNovasRef.current = false;
    void alternarDisponibilidade(false).then(() => setRecusarNovas(false));
  }, [corrida, ocupado, alternarDisponibilidade]);

  useEffect(() => {
    if (pausado || !appAtivo || !disponivel || corrida !== null) return;

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

        const atuais = (data?.corridas ?? []).map((item) => ({
          ...item,
          recusada_localmente: recusadas.current.has(item.corrida_id),
        }));
        const proxima = atuais.find((item) => !item.recusada_localmente);

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
  }, [pausado, appAtivo, disponivel, corrida, socketAtivo, gatilho]);

  // WebSocket em cima do polling: avisa que a lista mudou e o hook refaz a
  // consulta (o raio e a autorização seguem no servidor). Sem socket, o
  // intervalo normal de 5s continua valendo.
  useEffect(() => {
    if (pausado || !appAtivo || !disponivel || corrida !== null) {
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
  }, [pausado, appAtivo, disponivel, corrida]);

  const corridaAtivaId = corrida?.id;
  useEffect(() => {
    if (pausado || !appAtivo || (!disponivel && corridaAtivaId === undefined))
      return;

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
  }, [
    appAtivo,
    pausado,
    disponivel,
    corridaAtivaId,
    posicaoAtual,
    carregarCorridaAtual,
  ]);

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

      const atualizadas = ofertas.map((item) =>
        item.corrida_id === id ? { ...item, recusada_localmente: true } : item,
      );
      setOfertas(atualizadas);
      setOferta(atualizadas.find((item) => !item.recusada_localmente) ?? null);
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
    async (acao: "cheguei" | "iniciar" | "confirmar-parada" | "finalizar") => {
      if (corrida === null) return;

      setOcupado(true);

      try {
        if (acao === "cheguei") {
          const atual = await posicaoAtual();

          if (atual === null) {
            mostrarToast({
              tipo: "warning",
              titulo: "Localização necessária",
              mensagem:
                "Ative o GPS e permita o acesso à localização para informar sua chegada.",
            });
            return;
          }

          setPosicao(atual);
          await api.post("/motorista/posicao", atual);
        }

        const { data } = await api.post<CorridaEmCurso>(
          `/motorista/corridas/${corrida.id}/${acao}`,
        );

        aplicarCorrida(acao === "finalizar" ? null : data, false);

        const proximo =
          acao === "finalizar" ? null : proximoPontoDaCorrida(data);
        const rumo =
          proximo?.tipo === "parada"
            ? "A rota agora segue para a próxima parada."
            : "A rota agora segue para o destino.";

        const avisos = {
          cheguei: {
            titulo: "Chegada informada",
            mensagem: "O passageiro foi avisado que você está no local.",
          },
          iniciar: {
            titulo: "Corrida iniciada",
            mensagem: rumo,
          },
          "confirmar-parada": {
            titulo: "Parada confirmada",
            mensagem: rumo,
          },
          finalizar: {
            titulo: "Corrida finalizada",
            mensagem: recusarNovasRef.current
              ? "Como você pediu, não vai receber novas corridas agora."
              : "Você continua online e pode receber novas ofertas.",
          },
        } as const;
        const aviso = avisos[acao];

        mostrarToast({
          tipo: "success",
          ...aviso,
          chave: `corrida:${corrida.id}:${acao}:${proximo?.paradasPendentes ?? 0}`,
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
      posicaoAtual,
      aplicarCorrida,
      mostrarToast,
      carregarCorridaAtual,
      sincronizarSituacao,
    ],
  );

  // canal da própria corrida: pedidos de novo destino e troca de pagamento
  // chegam na hora, sem esperar a próxima rodada de posição (8s)
  useEffect(() => {
    if (pausado || corridaAtivaId === undefined) return;

    const echo = obterEcho();
    if (echo === null) return;

    try {
      echo
        .private(`corrida.${corridaAtivaId}`)
        .listen(".corrida.atualizada", () => void carregarCorridaAtual());

      return () => {
        try {
          echo.leave(`corrida.${corridaAtivaId}`);
        } catch {
          /* canal já encerrado */
        }
      };
    } catch {}
  }, [pausado, corridaAtivaId, carregarCorridaAtual]);

  const responderNovoDestino = useCallback(
    async (aceitar: boolean) => {
      if (corrida === null || pedidoNovoDestino === null) return;

      setRespondendoPedido(true);
      try {
        await api.post(
          `/motorista/corridas/${corrida.id}/destino/${pedidoNovoDestino.id}/${aceitar ? "aceitar" : "recusar"}`,
        );
        setPedidoNovoDestino(null);
        mostrarToast({
          tipo: aceitar ? "success" : "info",
          titulo: aceitar ? "Novo destino aceito" : "Novo destino recusado",
          mensagem: aceitar
            ? "A rota foi atualizada para o novo destino."
            : "A corrida segue para o destino anterior.",
          chave: `destino:${pedidoNovoDestino.id}:${aceitar}`,
        });
      } catch (falha) {
        mostrarToast({
          tipo: "warning",
          titulo: "O pedido não vale mais",
          mensagem: mensagemDoErro(
            falha,
            "Confira sua conexão e tente novamente.",
          ),
        });
      } finally {
        await carregarCorridaAtual();
        setRespondendoPedido(false);
      }
    },
    [corrida, pedidoNovoDestino, mostrarToast, carregarCorridaAtual],
  );

  const cancelarNaoComparecimento =
    useCallback(async (): Promise<ResultadoCancelamento> => {
      if (corrida === null || ocupado) {
        return { ok: false, mensagem: "Aguarde a ação anterior terminar." };
      }
      setOcupado(true);
      try {
        const atual = await posicaoAtual();
        if (atual === null) {
          return {
            ok: false,
            mensagem:
              "Ative o GPS e permita o acesso à localização para registrar a ausência.",
          };
        }
        await api.post("/motorista/posicao", atual);
        const { data: cancelada } = await api.post<{
          corrida_financeiro?: { taxa_cancelamento?: number | string | null };
        }>(`/motorista/corridas/${corrida.id}/cancelar`, {
          tipo: "nao_comparecimento",
          motivo: "Passageiro não compareceu ao embarque",
        });
        const taxa = Number(
          cancelada?.corrida_financeiro?.taxa_cancelamento ?? 0,
        );
        aplicarCorrida(null, false);
        setEspera(null);
        setChegada(null);
        setPassageiro(null);
        setDisponivel(true);
        setGatilho((atual) => atual + 1);
        mostrarToast({
          tipo: "info",
          titulo: "Corrida cancelada por ausência",
          mensagem:
            taxa > 0
              ? `Taxa de ausência de R$ ${taxa.toFixed(2).replace(".", ",")} registrada para você.`
              : "Esta categoria não tem taxa de ausência.",
        });
        await sincronizarSituacao();
        return { ok: true };
      } catch (falha) {
        return {
          ok: false,
          mensagem: mensagemDoErro(
            falha,
            "Confira sua localização e tente novamente.",
          ),
        };
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

  const cancelarCorrida = useCallback(
    async (motivo: string): Promise<ResultadoCancelamento> => {
      if (corrida === null || ocupado || motivo.trim() === "") {
        return { ok: false, mensagem: "Aguarde a ação anterior terminar." };
      }

      setOcupado(true);
      try {
        await api.post(`/motorista/corridas/${corrida.id}/cancelar`, {
          motivo: motivo.trim(),
        });
        aplicarCorrida(null, false);
        setEspera(null);
        setChegada(null);
        setPassageiro(null);
        setOferta(null);
        setOfertas([]);
        setDisponivel(true);
        recusadas.current.clear();
        setGatilho((atual) => atual + 1);
        await sincronizarSituacao();
        return { ok: true };
      } catch (falha) {
        await carregarCorridaAtual();
        return {
          ok: false,
          mensagem: mensagemDoErro(
            falha,
            "Confira sua conexão e tente novamente.",
          ),
        };
      } finally {
        setOcupado(false);
      }
    },
    [
      corrida,
      ocupado,
      aplicarCorrida,
      sincronizarSituacao,
      carregarCorridaAtual,
    ],
  );

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
    cancelarCorrida,
    cancelarNaoComparecimento,
    recusarNovas,
    alternarRecusarNovas,
    pedidoNovoDestino,
    respondendoPedido,
    responderNovoDestino,
  };
}
