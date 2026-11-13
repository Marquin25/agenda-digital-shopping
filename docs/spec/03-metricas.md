# 03 — Métricas: definições, fórmulas e limitações

> Papéis: **Especialista web + QA** · Base: `docs/research/referencias.md` (seções de métricas e antiabuso).

## 1. Princípios

1. **Interesse não é presença.** São tabelas, gráficos e rótulos separados; nenhuma fórmula soma os dois.
2. **A unidade é o dispositivo estimado, não a pessoa.** Todo número público para a administração diz "dispositivos estimados".
3. **Sempre mostrar o n.** Percentuais e médias vêm com o tamanho da amostra; com n < 10, aparece o aviso "amostra pequena".
4. **Excluir a equipe.** Ações feitas num navegador com sessão administrativa ativa não entram nas métricas.
5. **Sem dados pessoais nas métricas.** Agregação por evento, dia e origem; nenhum dado do visitante é enviado a terceiros.

## 2. Identificador de dispositivo (ID)

- Valor aleatório (UUID v4) gerado pelo servidor na **primeira ação que precisa dele** (ver um detalhe, demonstrar interesse, avaliar). Fica num cookie próprio do site, `HttpOnly`, `Secure`, `SameSite=Lax`, com validade de 180 dias.
- No banco fica **apenas** `HMAC-SHA256(pepper, id)`, onde `pepper` é um segredo do servidor que fica fora do repositório. Assim, um vazamento do banco não liga os registros aos cookies.
- **Não** se usa fingerprinting, IP como identificador persistente nem cruzamento com dados do portal Wi-Fi.
- Pela LGPD, isso é **pseudonimização, não anonimização**: o produto não usa a palavra "anônimo" (pendência jurídica P-LGPD-1).

## 3. Definições

| Métrica | Evento que a gera | Deduplicação | Fórmula |
| --- | --- | --- | --- |
| **Acessos à agenda** | Página `/` gerada pelo servidor | 1 por ID por dia | `COUNT(DISTINCT id, dia)` no período |
| **Visualizações do evento** | Página `/eventos/[slug]` | 1 por ID por evento por dia | `COUNT(DISTINCT id, dia)` por evento |
| **Origem** | Parâmetro `utm_source` da primeira página da visita (wifi, instagram, outro, direto) | igual a acessos | distribuição % dos acessos |
| **Interessados** | Ligar "Tenho interesse" | 1 por ID por evento; desligar remove | `COUNT(interesses ativos)`, congelado no **início** do evento para o relatório |
| **Check-ins** (M\*) | Leitura válida do QR rotativo dentro da janela do evento | 1 por ID por evento (restrição única) | `COUNT(check-ins)` por evento |
| **Conversão interesse → check-in** | — | — | `|interessados ∩ check-ins| ÷ |interessados|` (mesmo ID) |
| **Check-ins sem interesse prévio** | — | — | `|check-ins − interessados|` (mostra quem não marcou interesse antes) |
| **Avaliações** | Envio válido do formulário | 1 por ID por evento | `COUNT` por evento ou categoria |
| **CSAT** | — | — | `% de notas 4 ou 5 ÷ total de avaliações` × 100, com n e média 1–5 ao lado |
| **CSAT verificado** | — | — | o mesmo CSAT, só com avaliações de IDs que fizeram check-in |
| **Tags mais citadas** | Tags marcadas na avaliação | — | frequência ÷ avaliações do recorte |
| **Sugestões** | Envio no mural | por ID: limite de 3 por dia | `COUNT` por período |

**A nota é CSAT, não NPS.** O NPS usa uma pergunta de recomendação numa escala de 0 a 10. Se o shopping quiser NPS, isso exige outra pergunta (decisão futura).

## 4. Limitações conhecidas (mostradas em "Como calculamos")

| Limitação | Efeito | Mitigação |
| --- | --- | --- |
| Navegador interno do Instagram e navegador do portal Wi-Fi têm cookies próprios | Uma mesma pessoa conta 2 ou mais vezes | Aceitar; explicar; não somar origens como pessoas |
| Limpar cookies ou janela anônima | Gera um ID novo e permite duplicar interesse ou avaliação | Limites de taxa; com check-in, CSAT verificado |
| Aparelho compartilhado (família) | Subconta pessoas | Aceitar; não é pessoa |
| Quem avalia é quem quer avaliar | Viés de autosseleção | Mostrar n; não tratar como pesquisa representativa |
| Avaliação sem check-in | Não comprova participação | Separar CSAT total e CSAT verificado |
| QR fotografado e compartilhado | Check-in remoto | Token muda a cada 60 s; janela curta; alertas de anomalia |
| Robôs e pré-carregamento de links (prévia do WhatsApp/Instagram) | Infla visualizações | Contar só respostas a navegadores com cookie aceito e ignorar user agents de robôs conhecidos |
| Equipe testando | Infla tudo | Excluir sessões com login administrativo; eventos em rascunho não contam |

## 5. Antiabuso (proporcional, sem cadastro)

O Wi-Fi do shopping provavelmente sai por **um único IP público**, então um limite só por IP bloquearia visitantes legítimos.

| Camada | Onde | Regra inicial (configurável) |
| --- | --- | --- |
| Unicidade no banco | interesse, check-in, avaliação | restrição `UNIQUE(evento, id_hash)` |
| Limite por ID | todas as ações de escrita | 30 por minuto; avaliações: 10 por dia; sugestões: 3 por dia |
| Limite alto por IP | todas as ações de escrita | 600 por minuto → HTTP 429 (só barra automação) |
| Honeypot | formulários de avaliação e sugestão | campo oculto preenchido → descarta em silêncio |
| Tempo mínimo de preenchimento | avaliação e sugestão | < 2 s → descarta |
| Desafio (Cloudflare Turnstile) | avaliação e sugestão | **desligado por padrão**; liga por configuração se houver abuso (depende de conta e chaves: pendência P-INF-3) |
| Moderação | avaliações e sugestões | só a administração vê; ocultar avaliação abusiva; nada é publicado |
| Validação | todos os textos | tamanho máximo, remoção de HTML, normalização Unicode |

## 6. Check-in por QR rotativo (desenho para aprovação, M\*)

**Não implementar antes de aprovar este desenho e o ADR correspondente.**

1. Cada evento tem um `segredo_checkin` (32 bytes aleatórios) gerado no servidor e nunca exibido.
2. O **modo telão** (Editor ou Administrador logado) mostra um QR com `https://…/eventos/{slug}/check-in?t={token}`, onde `token = base32(HMAC-SHA256(segredo, floor(agora/60s)))[0:10]`. A tela se atualiza a cada 60 s.
3. O servidor aceita o token se: (a) ele bate com a janela atual ou com a anterior (tolera 60–120 s de atraso de leitura); (b) o evento está publicado e `agora ∈ [início − 15 min, fim + 30 min]` (tolerâncias configuráveis); (c) não há check-in do mesmo `id_hash` para o evento.
4. Dispositivo sem cookie: o servidor cria o ID na hora, então o check-in em si não depende de interesse prévio.
5. **Duplicidade:** a restrição única no banco é a fonte de verdade; uma segunda leitura responde "Você já fez check-in" (idempotente).
6. **Fraude e riscos residuais**
   - Foto do QR enviada a quem não está no local: o código expira em 1–2 min, o que reduz o risco sem eliminá-lo.
   - Uma pessoa com vários navegadores ou cookies apagados: alerta de anomalia (picos de check-ins no mesmo segundo, check-ins além da capacidade informativa).
   - Telão sem rede: plano B com QR estático impresso, marcado como `metodo = estatico` e com menor confiança no dashboard.
7. O check-in **não coleta nenhum dado** além do `id_hash` e da hora.

## 7. Avaliação aberta (MVP)

- Abre no **fim** do evento e fecha `fim + N dias` (N padrão = 7, configurável por evento; global em Configurações).
- Não exige check-in. Toda avaliação guarda `com_checkin` (verdadeiro ou falso), calculado no momento do envio.
- O dashboard e a lista de avaliações deixam claro: "Avaliações sem check-in não comprovam participação."
