# 06 — Acessibilidade, segurança, privacidade e desempenho

> Papéis: **UX/UI, Especialista web, QA** · Referências: `docs/research/referencias.md`.

## 1. Acessibilidade

**Meta:** WCAG 2.2 nível AA (referência alinhada à ABNT NBR 17225:2025; a LBI, art. 63, exige acessibilidade em sites de empresas com sede no Brasil). O eMAG só é obrigatório para órgãos públicos e serve apenas como referência complementar.

| Tema | Requisito do projeto |
| --- | --- |
| Estrutura | HTML semântico; um `h1` por página; landmarks (`header`, `nav`, `main`, `footer`); link "Pular para o conteúdo" |
| Teclado | Tudo operável por teclado, em ordem lógica; **foco sempre visível e não coberto** por cabeçalho fixo ou banner (WCAG 2.4.11) |
| Toque | Alvos ≥ 44×44 px (o mínimo da norma é 24×24, WCAG 2.5.8); nenhuma ação exige arrastar (2.5.7) |
| Cor e contraste | Texto ≥ 4,5:1; componentes e ícones ≥ 3:1; categoria e status **nunca só por cor** |
| Imagens | Banner com `alt` obrigatório no cadastro; ícones decorativos com `aria-hidden` |
| Filtros | Grupos em `fieldset`/`legend`; chips como botões com `aria-pressed`; quantidade de resultados anunciada por `aria-live="polite"`; nenhuma mudança de contexto inesperada |
| Formulários | Rótulos visíveis; erros em texto ligados ao campo (`aria-describedby`) e resumo no topo; nota com rádios rotulados (não só estrelas) |
| Mensagens de status | "Interesse registrado", "Avaliação enviada" anunciados sem mover o foco (4.1.3) |
| Datas | `<time datetime>`; formato por extenso ("sábado, 22 de novembro, 19h") |
| Movimento | Respeitar `prefers-reduced-motion`; sem carrossel automático |
| Zoom e reflow | Funcional em 320 px de largura e com zoom de 200% |
| Linguagem | Frases curtas, sem jargão; `lang="pt-BR"` |
| Gráficos | Título, descrição e **tabela equivalente**; paleta segura para daltonismo |
| Autenticação | Login sem teste cognitivo (3.3.8); permite colar a senha e usar gerenciador de senhas |

## 2. Segurança

Base: OWASP ASVS nível 1, OWASP Top 10 e OWASP API Security Top 10.

| Área | Medida |
| --- | --- |
| Senhas | Argon2id; mínimo de 12 caracteres; checagem contra lista de senhas vazadas comuns (local); troca obrigatória no 1º acesso |
| Login | Mensagem genérica; bloqueio progressivo por conta (5 falhas → 15 min) + limite por IP; registro em auditoria |
| Sessão | Token aleatório; só o hash vai para o banco; cookie `HttpOnly; Secure; SameSite=Lax`; renovação depois do login; expiração ociosa e absoluta; logout invalida no servidor |
| Autorização | Checagem de papel **no servidor** em toda ação de `/admin`; negação por padrão; testes de autorização por papel |
| CSRF | Verificação de `Origin` + token em mutações |
| Entrada | Validação Zod em todo endpoint; limites de tamanho; HTML removido de textos do visitante; consultas parametrizadas (ORM) |
| Saída | Escape padrão do React; sem `dangerouslySetInnerHTML` com conteúdo do usuário; descrição do evento em Markdown restrito e sanitizado |
| Cabeçalhos | CSP restritiva, `X-Content-Type-Options`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, HSTS em produção |
| Upload | Só JPEG, PNG ou WebP; verificar o tipo real do arquivo; ≤ 5 MB; reprocessar a imagem (remove EXIF/GPS); nome aleatório; servir com tipo correto |
| Segredos | Somente variáveis de ambiente; `.env*` no `.gitignore`; nada em logs, issues ou commits; varredura de segredos no CI (ex.: gitleaks) |
| Dependências | `npm audit` / Dependabot no CI; versões fixadas no lockfile |
| Auditoria | Login, falhas, criação, edição e publicação de evento, mudanças de usuário ou papel, ocultar avaliação |

## 3. Privacidade e LGPD

> **Não declaramos conformidade com a LGPD.** As medidas abaixo seguem o princípio da minimização. A validação cabe ao controlador (o shopping) e ao seu encarregado.

### Inventário de dados

| Dado | Finalidade | Pessoal? | Base legal (a validar) | Retenção |
| --- | --- | --- | --- | --- |
| `id_hash` do dispositivo | Deduplicar interesse, check-in, avaliação e métricas | Provavelmente sim (pseudonimizado) | A definir pelo controlador (ex.: legítimo interesse, com teste de balanceamento) | Ver `04-dados-e-integracoes.md` |
| IP | Limite de requisições e segurança | Sim | Legítimo interesse / segurança (a validar) | Memória (minutos); logs por 7 dias |
| Comentário da avaliação e texto da sugestão | Melhorar eventos | Pode conter dado pessoal digitado pelo visitante | A validar | 2 anos; aviso "não escreva dados pessoais" |
| `utm_source` | Origem agregada | Não | — | Agregado |
| Dados de usuários administrativos (nome, e-mail) | Acesso e auditoria | Sim | Execução de contrato / legítimo interesse (a validar) | Enquanto ativo + prazo da auditoria |

### Medidas

- Sem cadastro, sem nome, telefone ou CPF do visitante; sem pixels ou analytics de terceiros; sem cruzamento com o portal Wi-Fi.
- O Wi-Fi **não depende** de nenhuma ação na agenda (o README já registra isso).
- Página **Privacidade** em linguagem simples: o que é guardado, por quê, por quanto tempo, quem acessa, como apagar e contato do encarregado (pendente).
- Botão "Apagar meus dados deste dispositivo".
- Cookie de ID estritamente funcional, criado só na primeira ação que precisa dele. Precisa de banner de consentimento? **Pendente de validação** (P-LGPD-2).
- Acesso administrativo aos comentários limitado aos papéis da tabela; exportações só com dados agregados.

### Pendências para o responsável do shopping

| ID | Pergunta |
| --- | --- |
| P-LGPD-1 | Confirmar controlador, encarregado (DPO) e canal do titular |
| P-LGPD-2 | Base legal do `id_hash` e do IP; necessidade de consentimento para o cookie funcional |
| P-LGPD-3 | Aprovar os prazos de retenção propostos |
| P-LGPD-4 | Texto final da página Privacidade e ligação com a política do shopping |
| P-LGPD-5 | Se a hospedagem ficar fora do Brasil: regras de transferência internacional (art. 33) |

## 4. Desempenho

| Meta | Como |
| --- | --- |
| LCP ≤ 2,5 s · INP ≤ 200 ms · CLS ≤ 0,1 (p75, 4G) | SSR; cache com revalidação para a agenda; componentes de servidor; JS mínimo no público |
| Imagens leves | Redimensionamento no upload (WebP, larguras 400/800/1200, `srcset`, `width`/`height` definidos, `loading="lazy"` abaixo da dobra) |
| Fontes | Fonte do sistema, ou 1 família com `font-display: swap` e subconjunto latino |
| Dashboard | Consultas agregadas com índices; snapshots para eventos encerrados |
| Verificação | Lighthouse CI na agenda e no detalhe (orçamento de desempenho no CI) |
