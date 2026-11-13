# 03 — Métricas, participação e reservas

> Revisão 2 · 2026-11-13 · Legenda de origem em `01-produto.md` (**[C]** confirmado · **[PDF]** · **[R]** recomendação · **[P]** pendente).

## 1. Princípios

1. **Indicadores distintos e nunca somados** [C][PDF]: visualizações, origem, interesse, compartilhamentos, reservas, check-ins, avaliações, fluxo e vendas. Nenhum deles equivale ao "público total presente" [PDF].
2. **Classificação de cada número** [PDF]: **Medido** (contagem direta de um evento técnico), **Estimado** (contagem por dispositivo com deduplicação aproximada ou inferência) ou **Indisponível** (fonte não integrada; aparece como "—" com explicação, nunca como 0).
3. **Unidade = dispositivo estimado, não pessoa** [R]. O painel mostra o rótulo "dispositivos estimados".
4. **Sempre mostrar o n** e avisar "amostra pequena" com n < 10 [R].
5. **Equipe excluída** das métricas (sessão administrativa ativa) [R].
6. **Somente agregados nos relatórios** [PDF]: nenhum relatório lista registros individuais.

## 2. Identificador de dispositivo (Fase 1) [R]

- UUID aleatório em cookie próprio (`HttpOnly`, `Secure`, `SameSite=Lax`, 180 dias), criado na primeira ação que precisa dele.
- No banco só fica `id_hash = HMAC-SHA256(pepper, id)`; o `pepper` fica fora do repositório.
- Sem fingerprinting, sem IP persistente, sem cruzamento com o portal Wi-Fi.
- É dado **pseudonimizado** (provavelmente pessoal pela LGPD), **não anônimo**. Ver `06-qualidade.md` §3.

## 3. Catálogo de indicadores

| Indicador | Fase | Fonte | Fórmula | Classificação | Limitações |
| --- | :-: | --- | --- | --- | --- |
| **Acessos à agenda** | 1 | Página `/` gerada pelo servidor | `COUNT(DISTINCT id_hash, dia)` | Estimado | vários navegadores por pessoa; robôs filtrados por heurística |
| **Visualizações do evento** | 1 | Página do evento | `COUNT(DISTINCT id_hash, evento, dia)` | Estimado | idem; prévias de link (WhatsApp/Instagram) excluídas |
| **Visualizações brutas** | 1 | Cada resposta da página | `COUNT(*)` | Medido | inclui recarregamentos |
| **Origem do acesso** | 1 | `utm_source`/`utm_medium`/`utm_campaign` da primeira página da visita, ou código do link de divulgação | distribuição % dos acessos por canal (wifi, instagram, qr-cartaz, qr-totem, painel, link-direto, outro, direto) | Medido (por clique em link marcado) | links copiados sem parâmetro viram "direto"; o navegador pode remover o referrer |
| **Leituras de QR de divulgação** | 1 | Acesso com o código do QR | `COUNT` por QR | Medido | conta aberturas, não pessoas |
| **Compartilhamentos** | 1 | Clique no botão compartilhar ou copiar link | `COUNT(DISTINCT id_hash, evento)` | Estimado | mede a **intenção** de compartilhar, não o envio efetivo |
| **Cliques em "adicionar à agenda"** | 1 | Download do `.ics` ou clique no Google | `COUNT(DISTINCT id_hash, evento)` | Estimado | não garante que o evento foi salvo |
| **Interessados** | 1 [P] | Toggle "Tenho interesse" | interesses ativos; snapshot no início do evento | Estimado | interesse ≠ reserva ≠ presença |
| **Avaliações** | 2 | Formulário | `COUNT` por evento | Medido (envios) | autosseleção |
| **CSAT** | 2 | Avaliações | `% notas 4–5 ÷ total` + média + n | Estimado (amostra) | **não é NPS**; avaliações sem check-in não comprovam participação [C] |
| **CSAT verificado** | 2 | Avaliações de IDs com check-in | idem | Estimado | depende do check-in [P] |
| **Sugestões** | 2 | Mural | `COUNT` por período/tema | Medido | — |
| **Check-ins** | 2 [P] | QR rotativo no local | `COUNT(DISTINCT id_hash, evento)` | Medido (registros válidos) | subconta quem não leu o QR; risco residual de foto do QR |
| **Conversão interesse → check-in** | 2 [P] | Interesse ∩ check-in | `|I ∩ C| ÷ |I|` | Estimado | mesmo ID em navegadores diferentes |
| **Reservas** | — [P] | Depende da alternativa (§6) | ativas, canceladas, liberadas, comparecimento (reserva ∩ check-in) | Indisponível até aprovação | ver §6 |
| **Fluxo de visitantes** | 3 [P] | Sensores ou sistemas do shopping | agregado por período/área | Indisponível até integrar | precisa de fonte, contrato e autorização |
| **Impacto comercial** | 3 [P] | Vendas agregadas | variação no período do evento × período de comparação | Indisponível até integrar | **correlação, não causalidade**; sazonalidade |

## 4. Relatório automático pós-evento (Fase 2) [PDF]

Gerado no fim do evento e atualizado até o fim do período de avaliação. Contém: visualizações, origem, leituras de QR, compartilhamentos, interessados, (check-ins), avaliações e CSAT, estabelecimentos participantes e comparação com eventos anteriores da mesma categoria. Cada número leva o selo **Medido**, **Estimado** ou **Indisponível**, o n e a nota "Como calculamos".

**Comparação entre eventos e períodos:** só entre indicadores de mesma definição; normaliza pela duração do evento (por hora) quando fizer sentido; avisa quando as amostras são pequenas ou quando o período de comparação tem feriado ou data comemorativa (lista mantida pela administração [R]).

## 5. Antiabuso sem cadastro [R]

O Wi-Fi do shopping provavelmente sai por um único IP público, então um limite só por IP bloquearia visitantes legítimos.

| Camada | Onde | Regra inicial (configurável) |
| --- | --- | --- |
| Unicidade no banco | interesse, check-in, avaliação, (reserva) | `UNIQUE(evento, id_hash)` |
| Limite por ID | escritas públicas | 30/min; avaliações 10/dia; sugestões 3/dia |
| Limite alto por IP | escritas públicas | 600/min → 429 |
| Honeypot + tempo mínimo de preenchimento | avaliação, sugestão, (reserva) | descarte silencioso |
| Cloudflare Turnstile | avaliação, sugestão, (reserva) | desligado por padrão; depende de conta [P] |
| Moderação | avaliações e sugestões | só a administração vê |

## 6. Interesse × Reserva × Check-in

| | **Tenho interesse** | **Reservar vaga** | **Check-in** |
| --- | --- | --- | --- |
| O que significa | Sinal de intenção ou favorito | Pedido de lugar num evento **com limite** | Registro de presença no local |
| Garante vaga? | Não | Depende das regras [P] | — |
| Comprova presença? | Não | Não | Sim (registro válido no local) |
| Status | [C] | **[P] não aprovado** | [P] desenho a aprovar |

### 6.1 Configuração de vagas no evento (Fase 1) [C]

O administrador escolhe: **sem limite** · **limitado, por ordem de chegada** (capacidade informativa exibida) · **limitado, com reserva** (opção **bloqueada** até a aprovação das reservas).

### 6.2 Reserva sem dados pessoais: alternativas para decisão [P]

| Alternativa | Como funciona | Prós | Contras |
| --- | --- | --- | --- |
| **A. Sem reserva** (ordem de chegada) | Só capacidade informativa | Zero dados, zero fraude | Não garante lugar |
| **B. Reserva por dispositivo + código** | Cria a reserva ligada ao `id_hash`; mostra um código curto ou QR que a equipe confere na entrada | Sem nome nem contato | Fácil burlar limpando cookies ou usando vários navegadores; sem canal para avisar mudanças; o código se perde se o cookie sumir |
| **C. Reserva com contato mínimo** (e-mail **ou** telefone) | Confirmação e cancelamento pelo contato | Deduplicação melhor; permite avisar mudanças | **Dado pessoal**: finalidade, base legal, retenção, provedor de e-mail/SMS; contraria o "sem cadastro" |
| **D. Fichas no local** | Distribuição presencial; a equipe atualiza "vagas restantes" no sistema | Sem dados; simples | Trabalho manual; não é reserva antecipada |

**Perguntas abertas** (não decidir em nome do responsável):

1. **Duplicidade e abuso:** quantas reservas por dispositivo? Quantos lugares por reserva (famílias)? Exigir Turnstile? Aceitar o risco da alternativa B?
2. **Confirmação:** a reserva é imediata ou precisa de confirmação? Como o visitante recupera o código se perder o cookie?
3. **Lotação:** permitir overbooking (% acima da capacidade, prevendo não comparecimento)? Lista de espera?
4. **Cancelamento:** o visitante cancela pela página (mesmo dispositivo)? Até quando?
5. **Liberação de vagas:** vagas de quem não chegar são liberadas X minutos após o início? Quem libera no local?
6. **Conferência na entrada:** quem confere, com que equipamento? A reserva conferida conta como check-in?
7. **Acessibilidade:** reservar uma cota de vagas para pessoas com deficiência? Como, sem dados sensíveis?
8. **Mudança ou cancelamento do evento:** como avisar quem reservou sem ter contato?
9. **Métricas:** comparecimento de reservas = reservas com check-in ÷ reservas ativas no início (só se houver check-in).

**Recomendação [R]:** manter **A** na Fase 1; na Fase 2, fazer um *spike* comparando **B** e **D** com um evento-piloto. **C** só depois de análise de LGPD e aprovação explícita.

## 7. Check-in por QR rotativo (desenho para aprovação, Fase 2) [P]

**Não implementar antes de aprovar este desenho e o ADR.** Não confundir com o **QR de divulgação** (Fase 1, estático, só abre a página e marca a origem).

1. Cada evento tem um `segredo_checkin` (32 bytes) gerado no servidor e nunca exibido.
2. O **modo telão** (Editor ou Administrador) mostra um QR com `…/eventos/{slug}/check-in?t={token}`, onde `token = base32(HMAC-SHA256(segredo, floor(agora/60 s)))[0:10]`, atualizado a cada 60 s.
3. O servidor aceita se: o token é da janela atual ou da anterior; o evento está publicado e `agora ∈ [início − 15 min, fim + 30 min]`; não há check-in desse `id_hash` no evento.
4. **Duplicidade:** a restrição `UNIQUE(evento, id_hash)` é a fonte de verdade; a segunda leitura responde "já registrado" (idempotente).
5. **Fraude residual:** foto do QR enviada para fora (mitigada pela janela de 1–2 min); vários navegadores (alerta de anomalia); telão sem rede → QR estático marcado como `metodo=estatico`, com confiança menor.
6. O check-in não coleta nada além do `id_hash` e da hora.

## 8. Avaliação aberta (Fase 2 recomendada; regras [C])

Abre no fim do evento e fecha em `fim + N dias` (N padrão 7, configurável). Não exige check-in. Grava `com_checkin`. Painel e lista mostram: "Avaliações sem check-in não comprovam participação."
