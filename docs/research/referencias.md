# Referências primárias — Conecta Shopping

> Pesquisa do agente Pesquisador. Data de consulta de todas as fontes: **2026-11-13**.
> Convenção: **Fatos** têm fonte; **Hipóteses** são inferências nossas a validar; **Recomendações** são propostas para produto/arquitetura.
> Tudo é resumo com palavras próprias; nada foi copiado de terceiros. Este documento **não é parecer jurídico** e não afirma conformidade legal de nada.
> Marcador ⚖️ = precisa de validação jurídica. Marcador ❓ = não foi possível verificar em fonte primária.

---

## Índice de fontes

| # | Fonte | Link | O que informa |
|---|-------|------|---------------|
| F1 | WCAG 2.2 (W3C Recommendation) | https://www.w3.org/TR/WCAG22/ | Critérios de sucesso normativos de acessibilidade web (níveis A/AA/AAA). |
| F2 | Understanding SC 2.5.8 Target Size (Minimum) | https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html | Explicação do critério de alvo de toque (24×24 px CSS) e exceções. Documento informativo, atualizado em 02/11/2026. |
| F3 | What's New in WCAG 2.2 (W3C WAI) | https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/ | Lista dos 9 critérios novos e a remoção do 4.1.1. |
| F4 | eMAG 3.1 — Governo Digital | https://www.gov.br/governodigital/pt-br/acessibilidade-e-usuario/acessibilidade-digital/modelo-de-acessibilidade | eMAG versão 3.1 (abr/2014); obrigatório para sítios do governo (Portaria nº 3/2007, SISP). |
| F5 | Lei 13.146/2015 (LBI) | https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2015/lei/l13146.htm | Art. 63: sites de empresas com sede/representação no Brasil devem ser acessíveis; §1º símbolo de acessibilidade. |
| F6 | ABNT NBR 17225:2025 | https://www.normas.com.br/visualizar/abnt-nbr-nm/14077/abnt-nbr17225-acessibilidade-em-conteudo-e-aplicacoes-web-requisitos | Norma brasileira "Acessibilidade em conteúdo e aplicações web — Requisitos", publicada em 11/03/2025, baseada na WCAG 2.2. |
| F7 | Lei 13.709/2018 (LGPD) | https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm | Definições, princípios, bases legais, anonimização, término do tratamento, direitos, encarregado. |
| F8 | ANPD — Guia orientativo Cookies e proteção de dados pessoais (out/2022) | https://www.gov.br/anpd/pt-br/documentos-e-publicacoes/guia-orientativo-cookies-e-protecao-de-dados-pessoais.pdf | Classificação de cookies, bases legais (consentimento x legítimo interesse), banners e transparência. Não vinculante. |
| F9 | ANPD — Guia orientativo Legítimo Interesse (fev/2024) | https://www.gov.br/anpd/pt-br/documentos-e-publicacoes/guia_legitimo_interesse.pdf | Como aplicar o art. 7º, IX e art. 10; modelo de teste de balanceamento. Não vinculante. |
| F10 | ANPD — consulta sobre Guia de Anonimização e Pseudonimização (jan/2024) | https://www.gov.br/anpd/pt-br/acesso-a-informacao/participacao-social/outras-acoes/ts-01-2024-nota-tenica-6-de-abertura.pdf/@@display-file/file | Minuta em consulta; abordagem baseada em risco; criptografia/hash é pseudonimização, não anonimização. ❓ Versão final não confirmada. |
| F11 | RFC 5545 — iCalendar | https://www.rfc-editor.org/rfc/rfc5545 | Estrutura VCALENDAR/VEVENT, propriedades obrigatórias, TZID/VTIMEZONE, escaping de TEXT, dobra de linhas. |
| F12 | Decreto 9.772/2019 | https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2019/decreto/d9772.htm | Extinguiu o horário de verão no Brasil (America/Sao_Paulo hoje em UTC−3 fixo). |
| F13 | Bain — Measuring your Net Promoter Score | https://www.netpromotersystem.com/about/measuring-your-net-promoter-score/ | Pergunta 0–10, promotores 9–10, neutros 7–8, detratores 0–6; NPS = %prom − %detr. |
| F14 | ISO 10004:2018 (catálogo) | https://www.iso.org/standard/71582.html | Diretrizes para monitorar e medir satisfação do cliente. ❓ Texto pago; não lido. |
| F15 | OWASP Denial of Service Cheat Sheet | https://cheatsheetseries.owasp.org/cheatsheets/Denial_of_Service_Cheat_Sheet.html | Rate limiting/throttling em infraestrutura e aplicação; CAPTCHA ajuda contra abuso de funcionalidade, não contra DoS. |
| F16 | OWASP API Security Top 10 2023 — API6 | https://api-security.owasp.org/editions/2023/en/0xa6-unrestricted-access-to-sensitive-business-flows | Proteger fluxos de negócio contra automação: detecção de humano, padrões não humanos, fingerprint, bloqueio de proxies. |
| F17 | OWASP API Security Top 10 2023 — API4 | https://api-security.owasp.org/editions/2023/en/0xa4-unrestricted-resource-consumption | Limites de consumo de recursos e de requisições por cliente. |
| F18 | RFC 6585 — status 429 | https://www.rfc-editor.org/rfc/rfc6585#section-4 | Código HTTP 429 Too Many Requests e cabeçalho Retry-After opcional. |
| F19 | Cloudflare Turnstile — visão geral | https://developers.cloudflare.com/turnstile/ | Alternativa a CAPTCHA, geralmente sem desafio visual; modos managed/non-interactive/invisible. |
| F20 | Cloudflare Turnstile — server-side validation | https://developers.cloudflare.com/turnstile/get-started/server-side-validation/ | Token validado via `siteverify`, válido por 300 s, uso único (detecção de reuso eventualmente consistente). |
| F21 | RFC 6238 — TOTP | https://www.rfc-editor.org/rfc/rfc6238 | Algoritmo de código baseado em janela de tempo (HMAC), referência conceitual para token rotativo. |
| F22 | Google Search Central — Event structured data | https://developers.google.com/search/docs/appearance/structured-data/event | Propriedades obrigatórias/recomendadas, `eventStatus`, elegibilidade (inclui Brasil). |
| F23 | schema.org/Event | https://schema.org/Event | Vocabulário completo do tipo Event. |
| F24 | The Open Graph protocol | https://ogp.me/ | Metadados obrigatórios (`og:title`, `og:type`, `og:image`, `og:url`), `og:image:alt`, `og:locale`. |
| F25 | Meta — Sharing for Webmasters | https://developers.facebook.com/docs/sharing/webmasters/ | Como a Meta lê tags OG; ferramenta Sharing Debugger. ❓ Não cobre WhatsApp/Instagram explicitamente. |
| F26 | RFC 8908 / RFC 8910 — Captive Portal API / DHCP | https://www.rfc-editor.org/rfc/rfc8908 | Padrão IETF para portais cativos (contexto do portal Wi‑Fi). |

---

## 1. Acessibilidade

### Fatos (com fonte)
- WCAG 2.2 é Recomendação W3C; adiciona 9 critérios e torna obsoleto o 4.1.1 Parsing [F1, F3].
- Critérios mais relevantes para uma agenda mobile [F1]:
  - **2.5.8 Target Size (Minimum) — AA**: alvos de ponteiro com pelo menos 24×24 px CSS, salvo exceções (espaçamento equivalente, controle alternativo, links dentro de texto, controle nativo do navegador, apresentação essencial) [F2]. O 2.5.5 (AAA) pede 44×44 px.
  - **2.4.7 Focus Visible — AA**: o foco do teclado precisa ser visível.
  - **2.4.11 Focus Not Obscured (Minimum) — AA (novo)**: o elemento focado não pode ficar totalmente escondido por conteúdo do autor (ex.: barra fixa inferior, banner de cookies). 2.4.13 Focus Appearance é AAA.
  - **1.4.3 Contrast (Minimum) — AA**: 4.5:1 para texto normal, 3:1 para texto grande. **1.4.11 Non-text Contrast — AA**: 3:1 para componentes de interface e indicadores de estado (ex.: chip de filtro selecionado, ícone de estrela).
  - **1.4.10 Reflow — AA**: conteúdo utilizável em 320 px CSS de largura sem rolagem em duas dimensões. **1.4.4 Resize Text** e **1.4.12 Text Spacing — AA**.
  - **1.1.1 Non-text Content — A**: alternativa textual para imagens informativas; imagens decorativas devem ser ignoráveis por tecnologia assistiva.
  - **1.3.1 Info and Relationships**, **3.3.2 Labels or Instructions**, **3.3.1 Error Identification**, **3.3.3 Error Suggestion**, **4.1.2 Name, Role, Value**: formulários (avaliação, tags, comentário) com rótulos programáticos e erros descritos em texto.
  - **4.1.3 Status Messages — AA**: mensagens como "Interesse registrado" ou "12 eventos encontrados" após filtrar devem ser anunciadas sem mover o foco.
  - **2.5.7 Dragging Movements — AA (novo)**: funcionalidades que usam arrastar (ex.: slider de nota, carrossel) precisam de alternativa com toque simples.
  - **3.3.8 Accessible Authentication (Minimum) — AA (novo)**: relevante para o login administrativo e para qualquer CAPTCHA de quebra-cabeça cognitivo.
  - **3.2.6 Consistent Help — A** e **3.3.7 Redundant Entry — A (novos)**.
  - **2.2.2 Pause, Stop, Hide — A**: carrosséis automáticos precisam de controle de pausa.
- **eMAG 3.1** (abril/2014) é obrigatório para sítios e portais do governo brasileiro (Portaria nº 3/2007, no âmbito do SISP); a página oficial não menciona o setor privado [F4].
- **LBI, art. 63**: é obrigatória a acessibilidade nos sítios mantidos por empresas com sede ou representação comercial no País ou por órgãos de governo, segundo as melhores práticas e diretrizes internacionais; §1º exige símbolo de acessibilidade em destaque [F5].
- **ABNT NBR 17225:2025** ("Acessibilidade em conteúdo e aplicações web — Requisitos") foi publicada em 11/03/2025 e baseia-se na WCAG 2.2 [F6]. ❓ Não lemos o texto integral (acesso via ABNT/Coleção).

### Hipóteses
- O eMAG **não se aplica obrigatoriamente** a um shopping privado (escopo é governo), mas a LBI art. 63 **se aplica** a empresas com sede no Brasil. ⚖️
- "Melhores práticas internacionais" do art. 63 tende a ser lido como WCAG; a NBR 17225 pode virar a referência nacional usada em fiscalizações/ações. ⚖️
- O símbolo de acessibilidade do §1º não tem formato padronizado que tenhamos encontrado. ❓
- WebViews de portal cativo e do navegador interno do Instagram podem ter zoom/fonte limitados; testar em ambos.

### Recomendações
- Meta: **WCAG 2.2 nível AA** (alinhado à NBR 17225), com alvo de toque de **44×44 px** por padrão (supera o mínimo de 24 px).
- Filtros como `<button aria-pressed>` ou checkboxes reais; contagem de resultados em região `aria-live="polite"`.
- Barra fixa inferior e banner de cookies não podem cobrir o foco (2.4.11); usar `scroll-padding`.
- Nota 1–5 como grupo de radio buttons nativos (não slider de arrastar); tags como checkboxes; comentário com `<label>` e contador de caracteres anunciado.
- Exigir campo de texto alternativo no cadastro de evento no admin (obrigatório quando a imagem informa algo, ex.: cartaz com data).
- Incluir símbolo/página de acessibilidade no rodapé (LBI §1º). ⚖️

---

## 2. LGPD e ANPD

### Fatos (com fonte)
- Dado pessoal = informação sobre pessoa natural identificada **ou identificável** (art. 5º, I). Dado anonimizado = titular não identificável com meios técnicos razoáveis disponíveis no tratamento (art. 5º, III e XI) [F7].
- Art. 12: dado anonimizado não é dado pessoal, **salvo** se a anonimização puder ser revertida com esforço razoável ou só com meios próprios; §2º: dados usados para formar perfil comportamental de pessoa identificada podem ser considerados pessoais [F7].
- Art. 13, §4º: pseudonimização = dado que só pode ser associado a um indivíduo com informação adicional mantida separadamente em ambiente controlado e seguro. **Dado pseudonimizado continua sendo dado pessoal** (interpretação consolidada na minuta da ANPD) [F7, F10].
- Princípio da **necessidade** (art. 6º, III): limitar ao mínimo necessário, dados pertinentes, proporcionais e não excessivos [F7].
- Bases legais: consentimento (art. 7º, I) e legítimo interesse (art. 7º, IX), este último com requisitos do art. 10 (finalidade legítima, situação concreta, só dados estritamente necessários, transparência) [F7]. A ANPD publicou guia com teste de balanceamento [F9].
- Término do tratamento e eliminação (arts. 15–16), com exceções (obrigação legal, estudo, uso exclusivo do controlador com dados anonimizados) [F7].
- Direitos do titular (art. 18): confirmação, acesso, correção, anonimização/bloqueio/eliminação, portabilidade, informação sobre compartilhamento, revogação de consentimento [F7].
- Encarregado (art. 41) com identidade e contato divulgados publicamente [F7].
- Guia de cookies da ANPD (2022): cookies podem coletar dados pessoais; classifica por finalidade (necessários, analíticos, funcionalidade, publicidade); bases típicas são consentimento e legítimo interesse; recomenda banner, política de cookies e meios fáceis de oposição/revogação [F8].
- Minuta do guia de anonimização (2024): abordagem baseada em risco; hash/criptografia/tokenização são **pseudonimização** [F10]. ❓ Versão final não confirmada.

### Hipóteses
- Um identificador aleatório de dispositivo (ex.: UUID em `localStorage`/cookie) usado para deduplicar "Tenho interesse"/check-in/avaliação **provavelmente é dado pessoal** (identificável, permite singularizar o dispositivo). Logo, o app "anônimo" para o usuário **não é anônimo para a LGPD**. ⚖️
- IP, user-agent e MAC/dados vindos do portal Wi‑Fi são dados pessoais; se o portal Wi‑Fi já coleta CPF/e‑mail, cruzar com o identificador do app criaria perfil (art. 12, §2º). ⚖️
- Comentário livre pode conter dados pessoais de terceiros ou sensíveis (saúde, religião) digitados pelo usuário. ⚖️
- Legítimo interesse pode sustentar métricas agregadas e antiabuso; cookies de marketing/remarketing provavelmente exigem consentimento. ⚖️
- Cookie/armazenamento estritamente necessário para impedir voto duplicado pode ser classificado como "necessário" — a ANPD não fixa essa categoria para este caso. ⚖️

### Recomendações
- **Minimização por desenho**: não pedir nome, e‑mail, telefone; não guardar IP bruto além do necessário para rate limit (TTL curto, ex.: minutos/horas) ⚖️.
- ID de dispositivo aleatório, sem vínculo com o portal Wi‑Fi; não fazer fingerprinting de navegador.
- Separar tabelas: eventos de ação (pseudonimizados, retenção curta, ex.: 90 dias após o evento ⚖️) e agregados (contagens por evento/dia, sem ID) mantidos a longo prazo.
- Moderação do comentário: limite de caracteres, aviso "não inclua dados pessoais", filtro simples de e‑mail/telefone.
- Política de privacidade e de cookies, banner com escolha real para não necessários, contato do encarregado no rodapé.
- Canal para direitos do titular: como não há conta, permitir "apagar meus dados deste dispositivo" (apaga registros ligados ao ID local).
- Registro das operações de tratamento e teste de balanceamento (LIA) para legítimo interesse, conduzidos pelo jurídico. ⚖️
- Não declarar "100% anônimo" nem "em conformidade com a LGPD" em textos do produto.

---

## 3. iCalendar (RFC 5545) e link do Google Calendar

### Fatos (com fonte)
- VCALENDAR exige `PRODID` e `VERSION` (uma vez cada) [F11, §3.6/§3.7].
- VEVENT exige `DTSTAMP` e `UID`; `DTSTART` é obrigatório quando o objeto não tem `METHOD`; `DTEND` e `DURATION` não podem coexistir [F11, §3.6.1].
- `UID` deve ser globalmente único e persistente para o mesmo evento (atualizações reaproveitam o UID) [F11, §3.8.4.7].
- Hora local com `TZID` exige um componente `VTIMEZONE` correspondente no mesmo objeto; sem TZID e sem `Z` a hora é "flutuante" [F11, §3.2.19, §3.3.5].
- Escaping em TEXT: barra invertida, ponto e vírgula e vírgula são escapados com `\`; quebra de linha vira `\n` [F11, §3.3.11].
- Linhas terminam em CRLF e **devem** (SHOULD) ser dobradas acima de 75 octetos, continuando com espaço/tab; atenção a UTF‑8 multibyte [F11, §3.1].
- Tipo de mídia `text/calendar` [F11, §8.1].
- Brasil não tem horário de verão desde 2019 (Decreto 9.772/2019) → `America/Sao_Paulo` = UTC−3 [F12].
- **Link "adicionar ao Google Calendar"**: ❓ **não encontramos documentação oficial do Google** para o formato `https://calendar.google.com/calendar/render?action=TEMPLATE&...`. Parâmetros **observados** em fontes de terceiros: `text` (título), `dates` (início/fim `AAAAMMDDTHHMMSSZ/...` em UTC, ou `AAAAMMDD/AAAAMMDD` para dia inteiro, fim exclusivo), `details`, `location`, `ctz` (fuso IANA). Há divergência sobre a interação de `ctz` com o sufixo `Z`.

### Hipóteses
- Clientes (Apple/Google/Outlook) aceitam `DTSTART`/`DTEND` em UTC (`Z`) sem VTIMEZONE; é a forma mais robusta e evita erros de VTIMEZONE.
- O navegador interno do Instagram e o mini‑navegador do portal cativo podem não abrir/baixar `.ics` corretamente.

### Recomendações
- Gerar `.ics` mínimo no servidor: `VERSION:2.0`, `PRODID`, `CALSCALE:GREGORIAN`, `METHOD:PUBLISH`, e VEVENT com `UID` estável (`<id-evento>@<domínio>`), `DTSTAMP` (UTC), `DTSTART`/`DTEND` em **UTC**, `SUMMARY`, `LOCATION`, `DESCRIPTION`, `URL`; incrementar `SEQUENCE` em alterações; `STATUS:CANCELLED` em cancelamentos.
- Armazenar datas em UTC no banco + `timezone = America/Sao_Paulo` e renderizar com biblioteca IANA (não hardcode −03:00, caso o horário de verão volte).
- Funções testadas para escaping e dobra por octetos (testes com acentos e emojis).
- Link do Google: usar `dates` em UTC com `Z`, tratar como **não oficial** (pode mudar), com fallback para o `.ics`. Validar manualmente em produção.

---

## 4. Métricas de eventos

### Fatos (com fonte)
- **NPS** (Bain/Reichheld): pergunta "quão provável recomendar" em escala 0–10; promotores 9–10, neutros 7–8, detratores 0–6; NPS = %promotores − %detratores (−100 a +100) [F13]. Originalmente proposto por Reichheld na HBR (2003, "The One Number You Need to Grow") ❓ artigo não acessado diretamente.
- **CSAT**: ❓ não há norma primária com fórmula única. A ISO 10004:2018 dá diretrizes para medir satisfação [F14], mas o texto é pago. A convenção de mercado é % de respostas 4–5 numa escala 1–5 (top‑2‑box) — **convenção, não norma**.
- Taxa interesse→presença: não há definição padronizada em fonte primária ❓; é métrica interna do produto.

### Hipóteses
- A nota 1–5 do app é um CSAT, **não** um NPS; chamar de NPS seria incorreto sem a pergunta 0–10 de recomendação.
- Contagens anônimas sofrem: (a) **superestimação** quando a mesma pessoa usa 2 dispositivos/navegadores ou limpa armazenamento (portal cativo frequentemente descarta cookies); (b) **subestimação** quando um dispositivo é compartilhado (família); (c) **viés de seleção**: quem avalia é quem fez check-in e quis responder (tendência a extremos); (d) visitantes do Instagram x Wi‑Fi têm perfis diferentes.
- Check-in só no local (QR) torna "presença" um piso, não o total real de público.

### Recomendações
- Definições no admin (documentadas na própria tela):
  - **CSAT** = avaliações com nota 4 ou 5 ÷ total de avaliações × 100; mostrar também média e distribuição 1–5 e o **n**.
  - **Conversão interesse→presença** = dispositivos com interesse **e** check-in no evento ÷ dispositivos com interesse. Exibir separadamente "check-ins sem interesse prévio".
  - **Taxa de resposta** = avaliações ÷ check-ins.
- NPS só se for adicionada pergunta 0–10 específica (opcional, fase futura).
- Ocultar percentuais com n < ~30 (ou mostrar aviso de amostra pequena) — limiar a definir pelo time.
- Deduplicar por (evento, ID de dispositivo, ação); rotular métricas como "dispositivos únicos (estimado)", nunca "pessoas".
- Registrar canal de origem (`utm_source` wifi/instagram) de forma agregada para comparar vieses.

---

## 5. Antiabuso em ações anônimas

### Fatos (com fonte)
- OWASP recomenda rate limiting/throttling na infraestrutura e na aplicação (por IP, blocos, geolocalização), limites de tamanho de requisição e timeouts; CAPTCHA ajuda contra **abuso de funcionalidade**, não contra DoS [F15].
- OWASP API4:2023 recomenda limitar frequência de requisições por cliente/recurso [F17]; API6:2023 recomenda identificar fluxos de negócio sensíveis (ex.: comentários, reservas) e mitigar automação com detecção de humano, de padrões não humanos (rápido/regular demais), fingerprint de dispositivo e bloqueio de proxies/Tor [F16].
- HTTP 429 Too Many Requests com `Retry-After` opcional [F18].
- Cloudflare Turnstile: alternativa a CAPTCHA que normalmente não exige interação; modos managed, non-interactive e invisible; funciona sem proxy da Cloudflare; token deve ser validado no servidor via `siteverify`, vale 300 s e é de uso único (detecção de reuso eventualmente consistente) [F19, F20]. A Cloudflare declara não acessar entradas de formulário [F19] — é declaração do fornecedor.
- TOTP (RFC 6238) define códigos HMAC por janela de tempo — base conceitual para QR rotativo [F21].
- Honeypot: ❓ sem norma primária; técnica conhecida de campo oculto que humanos não preenchem.

### Hipóteses
- Fingerprinting (sugerido pela OWASP API6) conflita com minimização da LGPD; para este produto, risco de abuso (inflar interesse) é baixo/moderado e não justifica fingerprint. ⚖️
- Rate limit por IP é fraco no Wi‑Fi do shopping: muitos visitantes saem pelo **mesmo IP público (NAT)**; limites por IP precisam ser altos ou combinados com ID de dispositivo.
- Turnstile envolve terceiro (Cloudflare) processando dados técnicos do visitante → operador/transferência internacional a avaliar. ⚖️
- CAPTCHAs visuais violam o espírito do 3.3.8 (WCAG) e prejudicam conversão em mobile.

### Recomendações
- Camadas, da mais barata à mais intrusiva:
  1. Idempotência no servidor: uma ação por (evento, dispositivo); "Tenho interesse" é toggle.
  2. Rate limit por ID de dispositivo (ex.: N ações/min) **e** por IP com teto alto; responder 429.
  3. Honeypot + tempo mínimo de preenchimento no formulário de avaliação.
  4. Turnstile (modo managed/invisible) **apenas** no envio de avaliação/comentário ou quando heurística detectar anomalia — não em "Tenho interesse".
  5. Avaliação só permitida após check-in válido (reduz spam de notas).
- **Check-in por QR no local**: QR exibido em tela no evento com token rotativo = HMAC(segredo do evento, janela de 30–60 s), aceitar janela atual ± 1; servidor valida token + horário do evento; um check-in por dispositivo. QR impresso estático é fallback, com risco de foto compartilhada (aceitar e sinalizar no admin).
- Monitorar no admin picos anômalos (muitas ações do mesmo IP/dispositivo em segundos).

---

## 6. Dados estruturados e compartilhamento

### Fatos (com fonte)
- Google Event: obrigatórios `name`, `startDate`, `location` (Place com `address`); recomendados `description`, `endDate`, `eventStatus`, `image`, `location.name`, `offers`, `organizer`, `performer`, `previousStartDate` [F22].
- `eventStatus`: EventScheduled (padrão), EventCancelled, EventPostponed, EventRescheduled [F22].
- Experiência de eventos no Google disponível no Brasil; exige evento **físico** e **aberto ao público geral** (não só para convidados) [F22].
- schema.org/Event define o vocabulário completo (inclui `eventAttendanceMode`, `isAccessibleForFree`) [F23].
- Open Graph: obrigatórios `og:title`, `og:type`, `og:image`, `og:url`; recomendados `og:description`, `og:locale` (ex.: `pt_BR`, padrão `en_US`), `og:image:width/height/alt`; o spec pede `og:image:alt` quando houver imagem [F24].
- A Meta documenta leitura de OG e oferece o Sharing Debugger para atualizar cache [F25]. ❓ Não achamos documentação oficial específica de prévia de links do **WhatsApp** nem do **Instagram**.

### Hipóteses
- WhatsApp gera prévia a partir de OG (`og:title`, `og:description`, `og:image`) — comportamento observado, não documentado; imagens grandes demais podem não aparecer.
- Instagram não exibe prévia OG em legendas de feed (links não clicáveis); links funcionam em bio, figurinha de link nos Stories e Direct. O tráfego do Instagram abre no **navegador interno** (limitações de `.ics`, storage e login).
- Rich results de eventos dependem de indexação; páginas renderizadas só no cliente (SPA) podem ser indexadas com atraso.

### Recomendações
- Cada evento com URL própria e estável, **renderizada no servidor** (SSR/SSG) com JSON‑LD `Event` + OG + `twitter:card=summary_large_image`.
- Imagem OG 1200×630 (proporção 1.91:1, convenção da Meta [F25]), < ~300 KB, com `og:image:alt`.
- `og:locale=pt_BR`; `og:url` canônica sem parâmetros de rastreio; UTM apenas nos links compartilhados.
- Atualizar `eventStatus` e `.ics` (`SEQUENCE`/`STATUS`) em cancelamento/adiamento.
- Validar com Rich Results Test e Sharing Debugger antes de campanhas.

---

## Contexto adicional: portal Wi‑Fi
- Fato: a IETF padroniza descoberta de portal cativo (RFC 8910) e uma API de portal (RFC 8908) [F26].
- Hipótese: o mini‑navegador do portal cativo (iOS/Android) tem armazenamento efêmero e pode fechar após autenticar; o ID de dispositivo gerado ali provavelmente não é o mesmo do navegador principal → duplicidade nas métricas.
- Recomendação: no portal, mostrar um link "abrir agenda" que leve ao navegador padrão; não depender de ações feitas dentro do portal.

---

## Pendências e itens não verificados
- ❓ Texto integral da NBR 17225 (pago/acesso via ABNT).
- ❓ Status final do guia de anonimização da ANPD.
- ❓ Documentação oficial do link de template do Google Calendar.
- ❓ Comportamento oficial de prévias no WhatsApp/Instagram.
- ❓ Artigo HBR 2003 de Reichheld (não acessado).
- ⚖️ Base legal, retenção, natureza do ID de dispositivo, uso do Turnstile e símbolo da LBI: validar com jurídico/encarregado.
