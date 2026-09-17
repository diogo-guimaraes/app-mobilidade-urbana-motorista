import { api } from "@/Services/api";
import { useCallback, useEffect, useState } from "react";

export type SituacaoCadastro =
  | "sem_cadastro"
  | "pendente"
  | "em_analise"
  | "aprovado"
  | "reprovado";

export interface DocumentoEnviado {
  tipo_documento: string;
  status: string;
  observacao: string | null;
}

export interface CadastroMotorista {
  situacao: SituacaoCadastro;
  cnh: {
    numero: string;
    categoria: string;
    expiracao: string;
    ear: boolean;
  } | null;
  documentos: DocumentoEnviado[];
  veiculos: number;
  pendencias: ("cnh" | "documentos" | "veiculo")[];
}

export interface DadosCnh {
  cnh_numero: string;
  cnh_categoria: string;
  cnh_expiracao: string;
  ear: boolean;
}

const mensagemDoErro = (erro: unknown, padrao: string) => {
  const resposta = (
    erro as {
      response?: {
        data?: { message?: string; errors?: Record<string, string[]> };
      };
    }
  )?.response;

  const primeiroErro = Object.values(resposta?.data?.errors ?? {})[0]?.[0];

  return primeiroErro ?? resposta?.data?.message ?? padrao;
};

export function useCadastroMotorista() {
  const [cadastro, setCadastro] = useState<CadastroMotorista | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  const carregar = useCallback(async () => {
    try {
      const { data } = await api.get<CadastroMotorista>("/motorista/cadastro");

      setCadastro(data);
      setErro("");
    } catch (falha) {
      setErro(mensagemDoErro(falha, "Não foi possível carregar seu cadastro."));
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const enviarCnh = useCallback(
    async (dados: DadosCnh) => {
      setEnviando(true);
      setErro("");

      try {
        await api.post("/motorista/cadastro/cnh", dados);
        await carregar();

        return true;
      } catch (falha) {
        setErro(mensagemDoErro(falha, "Não foi possível enviar sua CNH."));

        return false;
      } finally {
        setEnviando(false);
      }
    },
    [carregar],
  );

  return {
    cadastro,
    carregando,
    enviando,
    erro,
    enviarCnh,
    recarregar: carregar,
  };
}
