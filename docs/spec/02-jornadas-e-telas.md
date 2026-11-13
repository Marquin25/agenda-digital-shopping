# 02 — Jornadas, mapa de telas e wireframes

> Papel: **Especialista UX/UI** · Revisão 2 · 2026-11-13 · Mobile-first para o visitante, desktop-first para a administração. A **fase** de cada tela segue `01-produto.md`; telas marcadas **[P]** dependem de decisão.

## 1. Jornadas

### Visitante: Descobrir → Participar → Avaliar

1. **Entrada.** Toca num link de divulgação (`/r/{codigo}`) no portal Wi-Fi (se viável), na bio, post ou story do Instagram, ou lê um **QR de divulgação** num cartaz, totem ou painel. Cai na agenda ou direto no evento, sem cadastro e sem pop-up bloqueante.
2. **Descobrir.** Vê os próximos eventos ("Hoje" em destaque), filtra por categoria, data ou acessibilidade, ou busca por texto.
3. **Decidir.** Abre os detalhes: horário, local com referência, recursos de acessibilidade e informações de entrada.
4. **Participar (intenção).** Toca em "Tenho interesse" e/ou "Adicionar à agenda" (`.ics`); pode compartilhar.
5. **Comparecer.** No local, lê o **QR de check-in** exibido no telão e registra a presença (Fase 2, [P]). Se o evento tiver vagas por ordem de chegada, a página já avisou; **reserva** é [P].
6. **Avaliar.** Depois do encerramento, volta pela página do evento (o card mostra "Avalie este evento") e envia nota e tags em menos de 30 segundos (Fase 2).
7. **Sugerir.** Ao fim da avaliação, ou pelo rodapé, sugere um tipo de evento (Fase 2).

Pontos de atenção: os navegadores internos do Instagram e do portal cativo podem bloquear download ou apagar o armazenamento. Por isso o `.ics` tem como alternativa "copiar link" ou "abrir no navegador", e o estado do visitante não pode depender só do `localStorage`.

### Administração: Planejar → Publicar → Divulgar → Medir → Melhorar

1. O **Administrador** convida o Editor e o Analista (conta com senha temporária e troca obrigatória no primeiro acesso).
2. *(Fase 2)* O **Analista** cria um **planejamento** (objetivo, público desejado, segmentos, orçamento, período, espaços), gera **recomendações**, lê as justificativas e premissas, escolhe uma ideia e registra a decisão.
3. O **Editor** cria o evento (a partir da ideia escolhida, ou do zero), escolhe o espaço, envia o banner com texto alternativo, marca a acessibilidade e o modo de vagas e publica.
4. O **Editor** gera **links e QR de divulgação** por canal (Instagram, cartaz, totem, Wi-Fi) e os distribui.
5. *(Fase 2, [P])* No dia, o Editor abre o **modo telão** do check-in.
6. O **Analista** acompanha o painel (Fase 1: visualizações e origem; Fase 2: interesse, avaliações, CSAT, check-ins) e recebe o **relatório automático** quando o evento acaba.
7. *(Fase 2)* A equipe compara eventos e períodos, lê as oportunidades, as avaliações e as sugestões e volta ao passo 2.

## 2. Mapa de telas

```
Público (sem login)                                         Fase
├── /                         Agenda (lista + busca + filtros) 1
├── /r/[codigo]               Link/QR de divulgação → redireciona 1
├── /eventos/[slug]           Detalhes do evento               1
│   ├── /avaliar              Avaliação pós-evento             2
│   └── /check-in?t=…         Confirmação de check-in          2 [P]
├── /eventos/encerrados       Encerrados recentes (avaliar)    2
├── /sugerir                  Mural de sugestões (envio)       2
├── /privacidade              Privacidade + apagar dados       1
└── /painel                   Modo painel digital              3

Administração (login)
├── /admin/entrar             Login                            1
├── /admin                    Painel (básico → completo)       1 → 2
├── /admin/eventos            Lista, criar, editar, encerrar   1
│   └── /[id]                 Links e QR · Relatório · Avaliações · Telão
├── /admin/divulgacao         Links de divulgação e QR Codes   1
├── /admin/espacos            Espaços do shopping              1
├── /admin/relatorios         Relatórios e comparação          2
├── /admin/oportunidades      Oportunidades descritivas        2
├── /admin/planejamentos      Planejamentos → recomendações    2
├── /admin/catalogo           Modelos de experiência           2
├── /admin/estabelecimentos   Lojas e segmentos                2
├── /admin/sugestoes          Mural de sugestões               2
├── /admin/usuarios           Usuários e papéis                1
└── /admin/configuracoes      Períodos, check-in, pesos, auditoria 1–2
```

## 3. Wireframes textuais

### 3.1 Agenda pública (mobile, 360–430 px)

```
┌────────────────────────────────┐
│ [logo] Conecta Shopping   [≡]  │  ← cabeçalho fixo baixo (não cobre foco)
├────────────────────────────────┤
│ 🔍 [ Buscar eventos…        ]  │  ← <input type=search> com rótulo visível
│                                │
│ [Hoje] [Fim de semana] [Datas▾]│  ← chips de data (botões de alternância)
│ [Categoria ▾] [Acessibilidade▾]│  ← abrem painel com caixas de seleção
│ 2 filtros ativos · Limpar      │  ← resumo anunciado (aria-live)
├────────────────────────────────┤
│ HOJE · sáb, 15 nov             │  ← título de grupo (h2)
│ ┌────────────────────────────┐ │
│ │ [imagem 16:9, alt]         │ │
│ │ Infantil                   │ │  ← categoria em texto, não só cor
│ │ Oficina de Pintura Kids    │ │  ← h3 = link do card inteiro
│ │ 15:00–17:00 · Piso L2,     │ │
│ │ Praça Central              │ │
│ │ ♿ Acessível · 🤟 Libras    │ │  ← ícone + texto
│ │ ● Em andamento             │ │
│ └────────────────────────────┘ │
│ ┌────────────────────────────┐ │
│ │ …próximo card…             │ │
├────────────────────────────────┤
│ Encerrados recentes → Avaliar  │
│ Sugira um evento · Privacidade │
└────────────────────────────────┘
```

Estados: **carregando** (esqueleto de cards, `aria-busy`) · **vazio** ("Nenhum evento com esses filtros", botão "Limpar filtros") · **sem eventos futuros** (mensagem + link para sugerir) · **erro** (mensagem + "Tentar novamente"; a versão em cache aparece quando existir) · **offline** (aviso discreto).

### 3.2 Detalhes do evento (mobile)

```
┌────────────────────────────────┐
│ ← Agenda                       │
│ [banner 16:9, alt descritivo]  │
│ Música · ● Agendado            │
│ # Show Acústico de Sábado      │  ← h1
│ 📅 sáb, 22 nov · 19:00–21:00    │  ← <time datetime>
│ 📍 Piso L1, próximo à Fonte     │
│ 🎟 Gratuito · vagas limitadas,  │  ← "informações de entrada" (texto)
│    por ordem de chegada        │
├────────────────────────────────┤
│ [★ Tenho interesse]  (toggle)  │  ← aria-pressed; "Interesse registrado"
│ [📅 Adicionar à agenda ▾]       │  ← .ics · Google Calendar · copiar link
│ [↗ Compartilhar]               │
├────────────────────────────────┤
│ ## Sobre                       │
│ Descrição…                     │
│ ## Acessibilidade              │
│ • Intérprete de Libras         │
│ • Espaço sensorial disponível  │
│ • Pet friendly                 │
│ ## Como chegar                 │
│ Texto de referência do local   │
└────────────────────────────────┘
```

Variações: **em andamento** → botão "Fazer check-in" orienta a ler o QR de check-in no local (Fase 2, [P]) · **vagas limitadas** → aviso "por ordem de chegada" (reserva [P]) · **encerrado** → interesse e agenda somem; aparece "Avaliar este evento" enquanto o período estiver aberto · **cancelado** → faixa "Evento cancelado" e ações desativadas · **não encontrado** → 404 com link para a agenda.

### 3.3 Avaliação

```
┌────────────────────────────────┐
│ ← Show Acústico de Sábado      │
│ # Como foi o evento?           │
│ Sua nota (obrigatória)         │  ← fieldset + legend
│ ( 1 ) ( 2 ) ( 3 ) ( 4 ) ( 5 )  │  ← radios grandes, rótulos
│ Muito ruim          Excelente  │     "1 – Muito ruim" … (não só estrelas)
│                                │
│ O que se destacou? (opcional)  │
│ [Organização] [Horário]        │  ← caixas de seleção como chips
│ [Atração] [Conforto]           │
│                                │
│ Comentário (opcional)          │
│ [                          ]   │
│ 0/280                          │  ← contador anunciado ao chegar no limite
│ ⓘ Não escreva dados pessoais.  │
│ [ Enviar avaliação ]           │
└────────────────────────────────┘
```

Estados: **sucesso** ("Obrigado! Sua avaliação foi registrada." + link para sugerir) · **já avaliou** · **fora do período** ("O período de avaliação terminou em …") · **erro de validação** (resumo no topo com links para os campos) · **limite atingido** (429: "Muitas tentativas, tente mais tarde").

### 3.4 Login administrativo (desktop)

```
┌──────────────────────────────────────┐
│          Conecta Shopping · Admin    │
│  # Entrar                            │
│  E-mail  [                        ]  │  ← autocomplete="username"
│  Senha   [                    ][👁]  │  ← autocomplete="current-password"
│  [ Entrar ]                          │
│  Esqueceu a senha? Fale com o        │
│  administrador do sistema.           │  ← sem e-mail no MVP
└──────────────────────────────────────┘
```

Erro genérico ("E-mail ou senha incorretos"); bloqueio progressivo depois de várias falhas; troca de senha obrigatória no primeiro acesso.

### 3.5 Painel (desktop)

**Fase 1 (básico):** só acessos, visualizações por evento e origem por canal e por QR. O wireframe abaixo mostra o **painel completo da Fase 2**. Cada cartão leva o selo **Medido**, **Estimado** ou **Indisponível** (ex.: "Fluxo — indisponível: sem integração").

```
┌ Conecta Shopping · Admin ─────────────────────── [Ana · Analista ▾] ┐
│ Dashboard | Eventos | Sugestões | (Usuários) | (Configurações)       │
├─────────────────────────────────────────────────────────────────────┤
│ Período [Últimos 30 dias ▾]  Categoria [Todas ▾]  Evento [Todos ▾]   │
├──────────┬──────────┬──────────┬──────────┬──────────┬──────────────┤
│ Acessos  │ Eventos  │Interessa-│Check-ins │ Avalia-  │ CSAT         │
│ à agenda │ ativos   │ dos      │          │ ções     │ 82% (n=57)   │
│ 3.410    │ 6        │ 412      │ 138      │ 57       │ média 4,3    │
│ disp.est.│          │          │          │          │              │
├──────────┴──────────┴──────────┴──────────┴──────────┴──────────────┤
│ Interesse × check-in por evento   [gráfico de barras agrupadas]     │
│ [Ver como tabela]                                                    │
├──────────────────────────────────┬──────────────────────────────────┤
│ Satisfação por categoria         │ Origem dos acessos               │
│ [barras horizontais + n]         │ Wi-Fi 61% · Instagram 30% · …    │
├──────────────────────────────────┴──────────────────────────────────┤
│ ⓘ Números estimados por dispositivo, não por pessoa. Como calculamos│
└─────────────────────────────────────────────────────────────────────┘
```

Regras: cada gráfico tem tabela equivalente e título descritivo. Com n < 10, aparece "amostra pequena". Os rótulos definem a métrica (ver `03-metricas.md`). Estado vazio: "Sem dados no período".

### 3.6 Gestão de eventos (desktop)

```
Lista
┌─────────────────────────────────────────────────────────────────────┐
│ # Eventos                                       [+ Novo evento]      │
│ [Buscar…]  Status [Todos ▾]  Categoria [Todas ▾]                     │
│ Título            │ Data        │ Categoria │ Status      │ Ações    │
│ Oficina Kids      │ 15/11 15:00 │ Infantil  │ Em andamento│ Editar ⋯ │
│ Show Acústico     │ 22/11 19:00 │ Música    │ Agendado    │ Editar ⋯ │
│ Festival Gastr.   │ —           │ Gastron.  │ Rascunho    │ Editar ⋯ │
└─────────────────────────────────────────────────────────────────────┘

Formulário (criar/editar)
┌───────────────────────────────────────────┬─────────────────────────┐
│ Título*            [                    ] │ Pré-visualização        │
│ Descrição*         [ editor de texto    ] │ (card + detalhe mobile) │
│ Início* [dd/mm/aaaa hh:mm] Fim* [ … ]     │                         │
│ Espaço*            [ Praça Central ▾ ]    │                         │
│ Complemento local  [ ao lado da fonte   ] │                         │
│ Categoria*         [ Infantil ▾ ]         │                         │
│ Banner             [Enviar imagem]        │                         │
│ Texto alternativo* [                    ] │ ← obrigatório com banner│
│ Acessibilidade     ☐ Libras ☐ Sensorial   │                         │
│                    ☐ Pet friendly ☐ …     │                         │
│ Informações de entrada [ Gratuito; …    ] │                         │
│ Vagas  (•) Sem limite                     │                         │
│        ( ) Limitadas, por ordem de chegada│                         │
│        ( ) Com reserva — pendente de      │ ← desativado [P]        │
│            aprovação                      │                         │
│ Capacidade (informativa) [   ]            │                         │
│ Lojas participantes [ + ] (Fase 2)        │                         │
│ Período de avaliação [7] dias (Fase 2)    │                         │
│ [Salvar rascunho] [Publicar] [Encerrar evento] [Cancelar evento]    │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.7 Links e QR de divulgação (Fase 1)

```
┌ Divulgação · Show Acústico de Sábado ───────────────────────────────┐
│ [+ Novo link]  Destino: (•) Este evento ( ) Agenda ( ) Filtro        │
│ Canal         │ Descrição        │ Link curto      │ Acessos │ QR    │
│ Instagram     │ Bio novembro     │ …/r/ig-nov      │ 212 (M) │ —     │
│ QR cartaz     │ Cartaz entrada A │ …/r/k7f2        │ 58 (M)  │ PNG SVG│
│ Wi-Fi         │ Portal (pendente)│ …/r/wifi1       │ —  (I)  │ —     │
│ ⓘ QR de divulgação só abre a página. Não é check-in.                │
└─────────────────────────────────────────────────────────────────────┘
```
(M) medido · (I) indisponível.

### 3.8 Planejamento e recomendações (Fase 2)

```
┌ Novo planejamento ───────────────────┬ Recomendações ────────────────┐
│ Objetivo*  [Aumentar vendas ▾]       │ 1. Consultoria de estilo      │
│ Secundários ☐ Novos públicos …       │    Confiança: baixa (só regras)│
│ Público desejado                     │    Por que: objetivo vendas    │
│   Faixa [25–40 ▾] Perfil [Adultos ▾] │    (+3), público 25–40 (+3),   │
│   Interesses [moda] [estilo]         │    segmento moda (+2)          │
│ Segmentos  [Moda ✕] [+]              │    Premissas: custo do         │
│ Lojas      [Loja X ✕] [+]            │    catálogo (atualizado 10/11);│
│ Orçamento  R$ [5.000] a [15.000]     │    espaço Praça Central (40 m²)│
│ Período    [01/03] a [31/03]         │    Lojas possíveis: X, Y       │
│ Dias       ☑ sáb ☑ dom               │    Custo informado: R$ 3–8 mil │
│ Espaços    [Praça Central ✕] [+]     │    Medir: visualizações, CSAT  │
│ [Gerar recomendações]                │    [Criar evento a partir desta]│
│                                      │ 2. Festival de moda …          │
│                                      │ Eliminados (2): ver motivos ▾  │
│ ⓘ Sugestões baseadas em regras e dados informados. Não são previsões │
│   nem garantias de resultado.                                        │
└──────────────────────────────────────┴───────────────────────────────┘
```

### 3.9 Relatório pós-evento (Fase 2)

```
┌ Relatório · Show Acústico de Sábado · encerrado 22/11 21:00 ────────┐
│ Visualizações    1.240  Estimado │ Origem: Instagram 48% · QR 30% … │
│ Compartilhamentos   96  Estimado │ Interessados (início)  310 Estim.│
│ Check-ins            —  Indisp.* │ Avaliações  41 · CSAT 85% (n=41) │
│ Fluxo                —  Indisp.  │ Vendas      —  Indisponível      │
│ Lojas participantes: X, Y                                            │
│ Comparação: +18% de visualizações/hora vs. média da categoria (n=4)  │
│ * check-in não habilitado para este evento                           │
│ [Como calculamos] [Ver como tabela] [Exportar agregados]             │
└─────────────────────────────────────────────────────────────────────┘
```

Validações: fim depois do início, imagem ≤ 5 MB (JPEG, PNG ou WebP), texto alternativo obrigatório. Ao publicar, um resumo mostra o que falta. Cancelar um evento publicado pede confirmação na própria página, não em diálogo do navegador.
