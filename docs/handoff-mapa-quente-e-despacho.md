# Handoff: mapa quente (demanda e dinâmico) e lentidão do despacho

Estado em 2026-11-23. O visual do mapa quente está pronto nos três repositórios. Há um problema aberto de desempenho no backend, descrito no fim, que precisa de uma decisão antes de seguir.

## O que ficou pronto

### App do motorista

- **Demanda em manchas** (`src/components/DemandaSuave.tsx`, `src/domain/demandaSuave.ts`, `src/theme/demandaCores.ts`).
  - Cada célula com demanda vira uma gaussiana; as células se combinam sem passar de 1 e o campo é pintado numa única imagem PNG.
  - A imagem entra no mapa como um `Overlay` só. A primeira versão usava ~300 polígonos de contorno e travava o desenho na abertura do app.
  - O PNG é gerado em JS (CRC32, Adler32 e zlib sem compressão, sem biblioteca) e vai como data URI.
  - Níveis (`demandaCores.ts`): abaixo de `LIMITE_NIVEL_1` (0,2) o mapa fica limpo; acima aparece a mancha amarela, indo ao âmbar nas células mais fortes. Bonequinhos a partir de `LIMITE_ICONES` (0,3), só onde não há tarifa dinâmica.
  - Cor, opacidade e espalhamento (`ESPALHAMENTO_DA_MANCHA` 0,65, `OPACIDADE_MAXIMA` 0,62) são os valores que o usuário aprovou. Duas tentativas de deixar a mancha mais forte e mais espalhada foram desfeitas a pedido.
- **Dinâmico em hexágonos** (`src/components/RegioesDinamicas.tsx`, `src/theme/dinamicaCores.ts`).
  - Cor sólida por faixa do multiplicador: até 1,3x `#FFA088`, 1,4x a 1,7x `#FF704D`, 1,8x a 2,2x `#E63926`, 2,3x ou mais `#A61C1C`. Sem borda.
  - No modo valor fixo não há multiplicador; a intensidade é espalhada de 1,1x a 3,0x (`multiplicadorEquivalente`).
  - Um selo (`src/components/SeloDinamico.tsx`) por bloco de regiões vizinhas, com o menor e o maior valor ("1,1X-1,4X"). Os blocos vêm do backend.
- **Botão Conectar** azul com texto branco, e a barrinha do "Aguarde, buscando por novas corridas" também azul. A cor fica em `src/theme/azul.ts` (`AZUL_DE_DESTAQUE`, `#2563EB`). O ganho do dia (a pílula "R$ 0,00") continua preto.
- **Desconectar** (`src/hooks/useDespachoMotorista.ts`): a tela fica offline na hora, com o indicador de carregamento, e volta ao estado anterior se a chamada falhar. Uma consulta antiga da situação não devolve a tela ao "online" enquanto o status muda.

### Backend

- `GET /api/motorista/me/dinamica` passou a devolver também `clusters[]` e `multiplicador_maximo`. Os campos antigos continuam. Os blocos juntam todas as células vizinhas, mesmo de cores diferentes (`DinamicaService::clustersParaMapa`).
- Simulador (`SimulacaoChamadasService`): níveis de demanda `limpo`, `concentracao` e `pesada`, com endpoint `GET gestao/dinamica/simulacao/niveis`. O nível fica em Cache (`simulacao_chamadas.nivel_demanda`).
- `FilaDespachoService`: as taxas de cada motorista candidato ficam em memória por 15 s dentro do serviço (veja o problema aberto).

### Gestão

- `PaginaDinamica.vue`: bloco "Demanda no mapa do motorista" com um botão por nível. Escolher um nível liga a simulação se ela estiver parada.

## Decisões e pegadinhas

- No Android, o `Overlay` do mapa é desenhado **acima** dos polígonos, e o `zIndex` não resolve. Para a mancha não aparecer sobre o hexágono sólido, a imagem é recortada: os pixels dentro de uma célula com tarifa ficam transparentes (`celulaDoPonto` em `demandaSuave.ts`, mesma conta da grade do backend).
- Hexágono: pontas para cima, coordenadas axiais, projeção Mercator, igual à `GradeHexagonal` do backend. O raio vem da API (`raio_metros`).
- Os limites das faixas de cor (1,4 / 1,8 / 2,3) existem só no app. Duas ideias foram feitas e **desfeitas a pedido**: agrupar blocos por faixa de cor no backend, e posicionar os selos sem sobreposição calculando pelo zoom. Se voltarem, o selo por bloco e a colisão entre selos ainda são um ponto em aberto: hoje selos de blocos vizinhos podem se encostar.
- Os testes do backend rodam no container Sail (`docker exec aplicativo-mobilidade-urbana-backend-laravel.test-1 php artisan test --filter=...`). O WSL não alcança o MySQL.

## Problema aberto: `GET /motorista/corridas-disponiveis` é lento

Sintoma: o Desconectar demorava de 10 a mais de 60 s para responder com a simulação "pesada" ligada. Conectar e desconectar em si levam 0,15 s no servidor.

Medição (log do nginx com `rt=`, e um perfil com `tinker`):

- `corridas-disponiveis` levou 75 s em 3 chamadas. O app desiste em 10 s (status 499), mas o PHP continua processando e ocupa os workers (o PHP-FPM do ambiente tem 5). O Desconectar espera na fila atrás delas.
- Perfil da rota para um motorista: 6.947 consultas e 76 s para devolver 2 ofertas. A rota carrega todos os pedidos abertos da cidade (572 na simulação) e, para cada pedido em volta, chama `FilaDespachoService::garantirVez`. Isso avança a fila e, em `ranquear`, recalcula as taxas de cada candidato (um N+1 de 5.222 consultas idênticas).
- Com a memória das taxas: 2.767 consultas e 50 s. Melhorou, mas ainda é inaceitável. Cada consulta leva ~17 ms.

Causa estrutural: uma rota de leitura (a lista de chamadas, consultada por todo motorista online a cada poucos segundos) faz trabalho de escrita pesado e com lock.

Plano proposto (ainda **não feito**, precisa de aval):

1. Mover o avanço da fila para um job agendado, por pedido, a cada 1 a 2 s, fora da requisição do motorista.
2. A lista do motorista só lê, devolve só os pedidos dentro do raio e com limite.
3. No app: nunca iniciar uma consulta com outra pendente e usar espera crescente quando o servidor demora. Já existe uma trava (`emBusca`) em `useDespachoMotorista.ts`, mas o log mostrou duas chamadas paralelas a cada 10 s, e isso precisa ser investigado.
4. Ver os índices de `chamadas_despacho`, `corridas` e `motorista_taxa_eventos`, e subir `pm.max_children` do PHP-FPM do ambiente de teste.

## Como reproduzir e validar

- Recarregar o app no celular: `adb reverse tcp:8082 tcp:8082` (e 80, 8080) e abrir `exp+aplicativo-mobilidade-urbana-motorista://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8082`.
- Ver o mapa quente: na gestão, em "Demanda no mapa do motorista", escolher "Concentração" ou "Pesada".
- Medir o tempo das rotas: no container, o `log_format` do nginx pode ganhar `rt=$request_time`; os acessos saem em `docker logs`. Essa mudança é só do container e some se ele for recriado.
- Perfil da lista de chamadas: pôr o motorista online em `status_buscas` e rodar `DespachoCorridaService::ofertasPara` com `DB::enableQueryLog()` no `tinker`.
- Validação do app: `npx tsc --noEmit`, `npm run lint`, `npm run format:check`.

## Pendências

- Decidir e fazer o plano do despacho acima.
- Testes do backend para os níveis do simulador (`nivel_demanda`); hoje só os blocos (`clusters`) têm teste.
- Conferir no celular, com chamada real, o cartão de chamada, a rota até o embarque e o "sem chamada durante a avaliação" (feitos em sessões anteriores e ainda não validados com uma chamada de verdade).
