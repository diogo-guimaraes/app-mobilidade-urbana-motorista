import { api } from "@/Services/api";
import { useCallback, useEffect, useState } from "react";

export interface ItemHistorico {
  id: string;
  date: string;
  time: string;
  type: string;
  paymentMethod: "cash" | "app";
  origin: string;
  destination: string;
  value: string;
  status: string;
}

interface CorridaDaApi {
  id: number;
  status_corrida: string;
  metodo_pagamento?: string | null;
  tempo_solicitacao?: string | null;
  created_at?: string | null;
  produto?: { nome?: string | null } | null;
  corrida_financeiro?: { valor_motorista?: string | number | null } | null;
  corrida_destinos?: { tipo: string; endereco: string }[] | null;
}

const ROTULOS: Record<string, string> = {
  solicitada: "Procurando motorista",
  em_busca: "Procurando motorista",
  aceita: "Motorista a caminho",
  motorista_chegou: "Motorista no local",
  em_andamento: "Em andamento",
  finalizada: "Pedido finalizado",
  cancelada: "Cancelada",
};

const formatarValor = (valor?: string | number | null) => {
  const numero = typeof valor === "string" ? Number(valor) : valor;

  if (numero === null || numero === undefined || Number.isNaN(numero)) {
    return "—";
  }

  return `R$${numero.toFixed(2).replace(".", ",")}`;
};

const paraItem = (corrida: CorridaDaApi): ItemHistorico => {
  const quando = new Date(
    corrida.tempo_solicitacao ?? corrida.created_at ?? "",
  );
  const valida = !Number.isNaN(quando.getTime());

  const ponto = (tipo: string) =>
    corrida.corrida_destinos?.find((d) => d.tipo === tipo)?.endereco ?? "—";

  return {
    id: String(corrida.id),
    date: valida ? quando.toLocaleDateString("pt-BR") : "—",
    time: valida
      ? quando.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—",
    type: corrida.produto?.nome ?? "Corrida",
    paymentMethod: corrida.metodo_pagamento === "dinheiro" ? "cash" : "app",
    origin: ponto("origem"),
    destination: ponto("destino"),
    value: formatarValor(corrida.corrida_financeiro?.valor_motorista),
    status: ROTULOS[corrida.status_corrida] ?? corrida.status_corrida,
  };
};

export function useHistoricoCorridas(ativo: boolean) {
  const [itens, setItens] = useState<ItemHistorico[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  const buscar = useCallback(async () => {
    setCarregando(true);
    setErro("");

    try {
      const { data } = await api.get<{ data?: CorridaDaApi[] }>("/corridas");

      setItens((data?.data ?? []).map(paraItem));
    } catch {
      setErro("Não foi possível carregar seu histórico.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    if (ativo) buscar();
  }, [ativo, buscar]);

  return { itens, carregando, erro, recarregar: buscar };
}
