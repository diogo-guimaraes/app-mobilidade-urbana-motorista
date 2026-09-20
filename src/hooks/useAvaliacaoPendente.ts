import { api } from "@/Services/api";
import { useToast } from "@/context/ToastContext";
import { useCallback, useEffect, useState } from "react";

export interface CorridaParaAvaliar {
  id: number;
  codigo_corrida: string;
  distancia_total?: string | number | null;
  passageiro?: { user?: { name?: string | null } | null } | null;
  corrida_financeiro?: { valor_motorista?: string | number | null } | null;
  corrida_destinos?: { tipo: string; endereco: string }[] | null;
}

export function useAvaliacaoPendente(recarregarQuando: unknown) {
  const { mostrarToast } = useToast();
  const [corrida, setCorrida] = useState<CorridaParaAvaliar | null>(null);
  const [enviando, setEnviando] = useState(false);

  const buscar = useCallback(async () => {
    try {
      const { data } = await api.get<{
        corrida: CorridaParaAvaliar | null;
        avaliando_como?: string | null;
      }>("/corrida-para-avaliar");

      setCorrida(
        data?.avaliando_como === "motorista" ? (data?.corrida ?? null) : null,
      );
    } catch {
      // sem avaliação pendente é o caso normal
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => void buscar(), 0);

    return () => clearTimeout(timer);
  }, [buscar, recarregarQuando]);

  const avaliar = useCallback(
    async (nota: number, comentario?: string) => {
      if (corrida === null) return false;

      setEnviando(true);

      try {
        await api.post("/avaliacoes-corridas", {
          corrida_id: corrida.id,
          nota,
          comentario,
        });

        setCorrida(null);
        mostrarToast({
          tipo: "success",
          titulo: "Avaliação enviada",
          mensagem: `Corrida ${corrida.codigo_corrida}.`,
        });

        return true;
      } catch {
        mostrarToast({
          tipo: "error",
          titulo: "A avaliação não foi salva",
          mensagem: "Confira sua conexão e tente enviar novamente.",
        });
        return false;
      } finally {
        setEnviando(false);
      }
    },
    [corrida, mostrarToast],
  );

  const dispensar = useCallback(() => setCorrida(null), []);

  return { corrida, enviando, avaliar, dispensar };
}
