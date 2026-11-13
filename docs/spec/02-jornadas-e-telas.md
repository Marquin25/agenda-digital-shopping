# 02 — Jornadas, mapa de telas e wireframes

> Papel: **Especialista UX/UI** · Mobile-first para o visitante, desktop-first para a administração.

## 1. Jornadas

### Visitante: Descobrir → Participar → Avaliar

1. **Entrada.** Toca no destaque do portal Wi-Fi (`?utm_source=wifi`) ou no link da bio ou do post do Instagram (`?utm_source=instagram`). Cai na agenda, sem tela de cadastro e sem pop-up bloqueante.
2. **Descobrir.** Vê os próximos eventos ("Hoje" em destaque), filtra por categoria, data ou acessibilidade, ou busca por texto.
3. **Decidir.** Abre os detalhes: horário, local com referência, recursos de acessibilidade e informações de entrada.
4. **Participar (intenção).** Toca em "Tenho interesse" e/ou "Adicionar à agenda" (`.ics`); pode compartilhar.
5. **Comparecer.** No local, lê o QR exibido no telão e registra o check-in (M\*).
6. **Avaliar.** Depois do encerramento, volta pela página do evento (o card mostra "Avalie este evento") e envia nota e tags em menos de 30 segundos.
7. **Sugerir.** Ao fim da avaliação, ou pelo rodapé, sugere um tipo de evento.

Pontos de atenção: os navegadores internos do Instagram e do portal cativo podem bloquear download ou apagar o armazenamento. Por isso o `.ics` tem como alternativa "copiar link" ou "abrir no navegador", e o estado do visitante não pode depender só do `localStorage`.

### Administração: Planejar → Publicar → Medir → Melhorar

1. O **Administrador** convida o Editor e o Analista (cria a conta com senha temporária e troca obrigatória no primeiro acesso).
2. O **Editor** cria o evento como rascunho, envia o banner com texto alternativo, marca os recursos de acessibilidade, revisa a pré-visualização e publica.
3. No dia, o Editor abre o **modo telão** do evento num tablet ou TV (M\*).
4. O **Analista** acompanha o dashboard: interesse, check-in, conversão, CSAT e origem dos acessos.
5. A equipe lê as avaliações e as sugestões, arquiva e planeja a próxima programação.

## 2. Mapa de telas

```
Público (sem login)
├── /                         Agenda (lista + busca + filtros)
├── /eventos/[slug]           Detalhes do evento
│   ├── /avaliar              Avaliação pós-evento
│   └── /check-in?t=…         Confirmação de check-in (M*)
├── /eventos/encerrados       Encerrados recentes (para avaliar)
├── /sugerir                  Mural de sugestões (envio)
└── /privacidade              Aviso de privacidade + apagar dados do dispositivo

Administração (login)
├── /admin/entrar             Login
├── /admin                    Dashboard
├── /admin/eventos            Lista de eventos (filtros por status)
│   ├── /novo                 Criar
│   └── /[id]                 Editar · Avaliações · Telão (M*)
├── /admin/sugestoes          Mural de sugestões
├── /admin/usuarios           Usuários e papéis (Administrador)
└── /admin/configuracoes      Período de avaliação, check-in, auditoria
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

Variações: **em andamento** → botão "Fazer check-in" orienta a ler o QR no local (M\*) · **encerrado** → interesse e agenda somem; aparece "Avaliar este evento" enquanto o período estiver aberto · **cancelado** → faixa "Evento cancelado" e ações desativadas · **não encontrado** → 404 com link para a agenda.

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

### 3.5 Dashboard (desktop)

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
│ Local*             [ Piso / referência  ] │                         │
│ Categoria*         [ Infantil ▾ ]         │                         │
│ Banner             [Enviar imagem]        │                         │
│ Texto alternativo* [                    ] │ ← obrigatório com banner│
│ Acessibilidade     ☐ Libras ☐ Sensorial   │                         │
│                    ☐ Pet friendly ☐ …     │                         │
│ Informações de entrada [ Gratuito; …    ] │                         │
│ Capacidade (informativa) [   ]            │                         │
│ Período de avaliação [7] dias após o fim  │                         │
│ [Salvar rascunho] [Publicar] [Cancelar evento]                      │
└─────────────────────────────────────────────────────────────────────┘
```

Validações: fim depois do início, imagem ≤ 5 MB (JPEG, PNG ou WebP), texto alternativo obrigatório. Ao publicar, um resumo mostra o que falta. Cancelar um evento publicado pede confirmação na própria página, não em diálogo do navegador.
