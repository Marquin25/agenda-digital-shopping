# 01 — Produto e requisitos

> Status: **proposta para revisão** · 2026-11-13 · Fontes: `README.md`, `docs/plano/00-descoberta.md`, `docs/research/referencias.md`

## 1. Problema

A programação de eventos do shopping está espalhada entre posts, stories, cartazes e o boca a boca. O visitante não tem um lugar único para saber **o que acontece, quando, onde e se o evento é acessível para ele**. A administração divulga sem saber **quem se interessou, quem compareceu e o que achou**, e planeja o próximo evento sem esses dados.

## 2. Usuários

| Persona | Contexto | Necessidade principal |
| --- | --- | --- |
| **Visitante** (público geral) | Celular, muitas vezes no Wi-Fi do shopping ou vindo do Instagram; sem conta e sem aplicativo | Descobrir rapidamente eventos de interesse e saber como chegar |
| **Responsável com criança** | Busca atividades infantis no fim de semana | Filtrar por "Infantil", data e horário |
| **Pessoa com deficiência ou neurodivergente** | Usa leitor de tela, ampliação ou precisa de recursos específicos | Filtrar por Libras, espaço sensorial, acessibilidade física; navegar sem barreiras |
| **Editor** (marketing/eventos) | Desktop no escritório | Cadastrar e atualizar eventos com rapidez |
| **Analista** (gestão) | Desktop | Ver interesse, presença e satisfação para planejar a programação |
| **Administrador** | Responsável pelo sistema | Gerenciar acessos e configurações |

## 3. Proposta de valor

- **Visitante:** toda a programação num link aberto. Funciona sem aplicativo e sem cadastro, é acessível e permite salvar o evento na própria agenda.
- **Shopping:** um só lugar para divulgar e medir o ciclo **Descobrir → Participar → Avaliar → Melhorar**, com números honestos (estimativas por dispositivo, com o tamanho da amostra sempre visível).

## 4. Requisitos funcionais

Prioridade: **M** = MVP · **M\*** = MVP depois da aprovação do desenho detalhado · **F** = futuro.

### Visitante (público, sem login)

| ID | Requisito | Prior. |
| --- | --- | --- |
| RF01 | Listar eventos publicados que ainda não terminaram, em ordem cronológica, em cards (imagem, título, data, horário, local, categoria, ícones de acessibilidade) | M |
| RF02 | Buscar por texto (título e descrição) | M |
| RF03 | Filtrar por categoria, data (hoje / fim de semana / intervalo) e recursos de acessibilidade, com combinação de filtros refletida na URL (link compartilhável) | M |
| RF04 | Página de detalhes com descrição, data, horário, local (com referência como piso ou loja-âncora), recursos de acessibilidade, informações de entrada e status temporal | M |
| RF05 | Ação "Tenho interesse", que liga e desliga, uma por dispositivo e por evento | M |
| RF06 | Baixar arquivo `.ics` (iCalendar) e abrir o link do Google Calendar (este como opção secundária) | M |
| RF07 | Avaliar o evento depois do encerramento, dentro de um período configurável: nota de 1 a 5, tags opcionais (Organização, Horário, Atração, Conforto) e comentário opcional de até 280 caracteres | M |
| RF08 | Enviar sugestão de evento (até 500 caracteres), visível apenas para a administração | M |
| RF09 | Check-in no local do evento por QR code com código rotativo | M\* |
| RF10 | Página "Privacidade" e opção "Apagar meus dados deste dispositivo" | M |
| RF11 | Compartilhar o evento (URL própria com prévia Open Graph; botão nativo de compartilhar quando disponível) | M |
| RF12 | Ver eventos encerrados recentes (para avaliar) | M |
| RF13 | Cupom promocional | F |
| RF14 | Inscrição com reserva de vaga ou pagamento | F (exige nova análise) |
| RF15 | Lembretes e notificações | F |

### Administração (login obrigatório)

| ID | Requisito | Prior. |
| --- | --- | --- |
| RF20 | Login com e-mail e senha; sessão com expiração; logout | M |
| RF21 | Papéis Administrador, Editor e Analista com as permissões da tabela da seção 6 | M |
| RF22 | Administrador cria, desativa e redefine o acesso de usuários (sem cadastro aberto) | M |
| RF23 | CRUD de eventos: título, descrição, início e fim, local, categoria, banner com texto alternativo obrigatório, recursos de acessibilidade, informações de entrada (texto livre: preço, vagas por ordem de chegada etc.), capacidade informativa opcional e status de publicação | M |
| RF24 | Status temporal automático (Agendado, Em andamento, Encerrado), além de Rascunho e Cancelado, controlados pelo editor | M |
| RF25 | Dashboard: acessos à agenda, eventos ativos, interessados, check-ins, avaliações, CSAT; filtros por período, evento e categoria | M |
| RF26 | Gráficos: interesse × check-in por evento; satisfação por evento e por categoria; origem dos acessos (Wi-Fi, Instagram, direto); sempre com tabela de dados equivalente | M |
| RF27 | Mural de sugestões com status (nova, lida, arquivada) | M |
| RF28 | Lista de avaliações por evento, com comentários e indicação "com check-in / sem check-in"; ocultar avaliação abusiva | M |
| RF29 | Modo telão: tela de QR rotativo para check-in de um evento | M\* |
| RF30 | Registro de auditoria das ações administrativas (quem, o quê, quando) | M |
| RF31 | Configurações: período de avaliação padrão e tolerâncias do check-in | M |
| RF32 | Exportar métricas agregadas (CSV) | F |
| RF33 | Vários shoppings (multi-tenant) | F |

## 5. Requisitos não funcionais

| ID | Categoria | Requisito |
| --- | --- | --- |
| RNF01 | Acessibilidade | WCAG 2.2 nível AA em todas as telas; alvos de toque ≥ 44×44 px; funciona com teclado, VoiceOver e TalkBack; zoom de 200% sem perder conteúdo (detalhes em `06-qualidade.md`) |
| RNF02 | Desempenho | Agenda pública em 4G: LCP ≤ 2,5 s e INP ≤ 200 ms no percentil 75; JS inicial da página pública ≤ 150 KB (gzip) |
| RNF03 | Compatibilidade | Safari iOS e Chrome Android das 2 últimas versões principais, incluindo o **navegador interno do Instagram** e o navegador do portal cativo do Wi-Fi |
| RNF04 | Privacidade | Sem cadastro do visitante; nenhum dado pessoal direto (nome, e-mail, telefone, CPF); identificador de dispositivo pseudonimizado; sem analytics nem pixels de terceiros no MVP |
| RNF05 | Segurança | OWASP ASVS nível 1 como base; senhas com Argon2id; cookies `HttpOnly`, `Secure` e `SameSite`; CSP; proteção contra CSRF; limite de requisições; nenhum segredo no repositório |
| RNF06 | Disponibilidade | Agenda pública tolera falha do banco servindo a última versão em cache (degradação graciosa) |
| RNF07 | Manutenção | Uma única aplicação TypeScript, implantável em contêiner, sem dependência obrigatória de um fornecedor |
| RNF08 | Idioma | Interface, código de domínio e documentação em pt-BR; datas no formato brasileiro, fuso `America/Sao_Paulo` |
| RNF09 | Observabilidade | Logs estruturados sem dados pessoais nem segredos; endpoint de saúde |
| RNF10 | SEO e compartilhamento | Página de evento gerada no servidor, com `schema.org/Event` e Open Graph |

## 6. Papéis e permissões (provisório)

| Ação | Administrador | Editor | Analista |
| --- | :-: | :-: | :-: |
| Ver dashboard e métricas | ✅ | ✅ | ✅ |
| Criar, editar e publicar eventos | ✅ | ✅ | — |
| Excluir evento (só rascunho; publicado → cancelar) | ✅ | ✅ | — |
| Abrir modo telão (check-in) | ✅ | ✅ | — |
| Ler e arquivar sugestões | ✅ | ✅ | ✅ |
| Ocultar avaliação abusiva | ✅ | ✅ | — |
| Gerenciar usuários e papéis | ✅ | — | — |
| Configurações e auditoria | ✅ | — | — |

## 7. Fora do escopo do MVP

Cupom, inscrição com reserva ou pagamento, e-mail ou SMS para visitantes, notificações push, login de visitante, mural público, vários shoppings, integração por API com o Instagram ou com o portal Ponto Fibra (só links com UTM), aplicativo nativo.

> **Inscrição e vagas:** o administrador pode informar no evento "vagas limitadas, por ordem de chegada" e uma capacidade apenas informativa. O sistema **não reserva nem garante vaga**. Antes de qualquer reserva ou cobrança, o trabalho para e as implicações são levadas ao responsável (ver `07-mvp-e-riscos.md`).
