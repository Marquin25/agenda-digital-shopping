# 🛍️ Conecta Shopping — Plataforma Inteligente de Eventos e Experiências

> **Tema:** 10. Eventos, entretenimento e experiências (shopping center)  
> **Equipe:** 48 - Poliwhirl  
> **Integrantes:** Ana Carolina Guedes Santos, Marcus Antônio Rodrigues Monteiro Rios de Pina e Arthur Salomão Negreiros

---

## 📋 Índice

1. [Visão Geral, Contexto e Problemática](#-1-visão-geral-contexto-e-problemática)
2. [Justificativa](#-2-justificativa)
3. [Objetivos](#-3-objetivos)
4. [Estrutura e Funcionalidades](#-4-estrutura-e-funcionalidades)
5. [Escopo do MVP e Requisitos](#-5-escopo-do-mvp-e-requisitos)
6. [Arquitetura e Stack Tecnológica](#-6-arquitetura-e-stack-tecnológica)
7. [Benchmarking e Diferenciais](#-7-benchmarking-e-diferenciais)
8. [Privacidade e Conformidade (LGPD)](#-8-privacidade-e-conformidade-lgpd)

---

## 🎯 1. Visão Geral, Contexto e Problemática

### Contexto

Os shopping centers evoluíram de centros puramente comerciais para polos de experiências, lazer, entretenimento e convivência social. Os eventos tornaram-se estratégias fundamentais para atrair visitantes, gerar conexão com o público e diferenciar o empreendimento em um mercado competitivo.

### Problemática

Na prática operacional, a programação de eventos costuma ficar pulverizada em múltiplos canais, dificultando a descoberta pelo visitante e impedindo uma visão consolidada por parte da administração. Além disso:

- A escolha e o planejamento de novos eventos frequentemente se baseiam apenas em percepção, sem apoio de dados históricos ou métricas de público.
- A avaliação de resultados depende de pesquisas e relatórios manuais, dificultando a mensuração do retorno sobre cada ação realizada.

---

## 💡 2. Justificativa

O **Conecta Shopping** surge para unificar divulgação, gestão e inteligência analítica em uma única plataforma web *mobile-first*. Com a centralização do ciclo de vida dos eventos, espera-se:

- **Facilitar o acesso do visitante:** Consulta rápida à programação diretamente pelo navegador do celular, sem necessidade de baixar aplicativos ou realizar cadastro.
- **Decisões orientadas a dados:** Planejamento baseado no histórico do próprio empreendimento e em referências de mercado (*benchmarking*).
- **Redução de retrabalho:** Automatização da consolidação de indicadores e geração de relatórios.
- **Engajamento e posicionamento:** Fortalecimento da marca do shopping por meio de experiências mais alinhadas às expectativas do público.

---

## 🚀 3. Objetivos

### Objetivo Geral

Desenvolver uma plataforma web integrada e *mobile-first* que aprimore o planejamento, a divulgação, a participação e a avaliação dos eventos e experiências de um shopping center, transformando dados e referências de mercado em decisões estratégicas.

### Objetivos Específicos

- Centralizar a agenda de eventos em um ambiente responsivo, acessível sem app e sem login obrigatório.
- Potencializar a divulgação por meio de links diretos rastreáveis, QR Codes e integração com redes sociais e calendários (`.ics` / Google Agenda).
- Fornecer à administração ferramentas completas de gestão (CRUD) e planejamento estratégico (por objetivo, público-alvo, segmentos e orçamento).
- Monitorar indicadores de acesso e engajamento (visualizações, cliques, origem de tráfego e check-in opcional) com relatórios automáticos transparentes (classificando dados como *medidos*, *estimados* ou *indisponíveis*).
- Implementar um motor de recomendação de eventos baseado em regras explicáveis, com justificativas e premissas claras.
- Incorporar o *benchmarking* tanto no ciclo de desenvolvimento quanto na análise comparativa de desempenho dentro da plataforma.
- Garantir *Privacy by Design* e total conformidade com a LGPD.

---

## 🖥️ 4. Estrutura e Funcionalidades

A plataforma é dividida em dois ambientes principais que compartilham a mesma base de dados:

### 📱 Ambiente do Visitante (Público & Mobile-First)

- **Portal Wi-Fi Cativo (Integração opcional):** Tela de conexão rápida ao Wi-Fi do shopping que direciona imediatamente para a programação de eventos.
- **Home / Programação:** Catálogo de eventos com destaques, busca textual e filtros por categoria, data e tipo.
- **Calendário:** Visualização semanal e mensal da agenda do shopping.
- **Detalhes do Evento:** Descrição completa, data, horário, localização (piso/espaço), lojas parceiras envolvidas, botão de compartilhamento, exportação para agenda e check-in opcional via QR Code.
- **Favoritos / Lembretes:** Funcionalidade opcional armazenada localmente, sem exigir criação de conta.

### 💻 Ambiente Administrativo (Restrito & Analítico)

- **Autenticação e Controle de Acesso:** Login seguro com gestão de perfis administrativos.
- **Dashboard Analítico:** Visão geral de visualizações, check-ins via QR Code, taxa de engajamento, evolução temporal e distribuição por segmento.
- **Gestão de Eventos:** Cadastro, edição, publicação, acompanhamento e encerramento de eventos.
- **Inteligência Estratégica & Apoio à Decisão:** Formulário de planejamento (objetivo comercial, faixa etária, interesses, segmentos, orçamento e período) acoplado a um **Motor de Recomendação** que sugere ideias de eventos com *score* de aderência, fundamentação analítica, lojas sugeridas e indicadores recomendados.
- **Relatórios e Divulgação:** Consolidação automática de métricas pós-evento e gerador nativo de QR Codes e links com parâmetros de campanha.

---

## 📦 5. Escopo do MVP e Requisitos

### Evolução por Etapas

- **Etapa 1 (MVP Essencial):** Agenda pública, CRUD administrativo, geração nativa de QR Codes e links de divulgação.
- **Etapa 2 (Inteligência e Métricas):** Painel de indicadores de acesso/participação, relatórios automáticos e motor de recomendação baseado em regras.
- **Etapa 3 (Integrações Avançadas - Futuro):** Integração com infraestrutura de Wi-Fi, dados de vendas (PDV/Lojistas) e sensores de fluxo físico.

### Requisitos Não Funcionais

- Design responsivo com abordagem *mobile-first* e carregamento rápido (SSR).
- Operação autônoma, sem dependência de serviços externos pagos para geração de QR Codes ou processamento de imagens.
- Controle de acesso baseado em perfis e conformidade estrita com a LGPD.

---

## 🛠️ 6. Arquitetura e Stack Tecnológica

O sistema foi projetado como uma aplicação web *full-stack* unificada com renderização no servidor (SSR), garantindo alta performance em dispositivos móveis e compartilhamento de tipagem entre front-end e back-end.

### Fluxo Arquitetural

```text
[Visitante (Mobile)]  ──┐
                        ├──► [Next.js 16 / React 19 (SSR)] ──► [Drizzle ORM] ──► [PostgreSQL 17]
[Administração (Web)] ──┘         │
                                  ├── Validação (Zod 4)
                                  ├── Autenticação (Argon2id + Sessões)
                                  ├── Mídia & Utilidades (Sharp, QR Code, .ics)
                                  └── Motor de Recomendação (Módulo isolado)
```

### Tecnologias Adotadas

| Camada | Tecnologia | Finalidade |
| :--- | :--- | :--- |
| **Linguagem** | TypeScript 5.9 (`strict` mode) | Tipagem estrita ponta a ponta sobre Node.js 22.12+ |
| **Framework Web** | Next.js 16 & React 19 | Renderização no servidor (SSR) e rotas de API |
| **Banco de Dados** | PostgreSQL 17 *(PGlite em dev/testes)* | Persistência relacional sem necessidade de Docker local |
| **ORM** | Drizzle ORM | Modelagem e migrações versionadas |
| **Validação** | Zod 4 | Validação de esquemas e contratos de dados |
| **Segurança** | Argon2id + Sessões no Banco | Autenticação administrativa segura |
| **Mídia & Agenda** | Sharp, QR Code, `.ics` | Otimização para WebP, remoção de metadados EXIF e geração local |
| **Testes** | Vitest, Playwright & axe-core | Testes unitários, integração, E2E e acessibilidade |
| **Qualidade** | ESLint, Prettier & `tsx` | Padronização de código e execução de scripts/seeds |

---

## 📊 7. Benchmarking e Diferenciais

O *benchmarking* é utilizado tanto como ferramenta de concepção do produto quanto como recurso analítico dentro da plataforma:

1. **Análise de Mercado:** Avaliação comparativa entre sites/apps de shoppings, plataformas de eventos (ex.: Sympla, Eventbrite) e ferramentas de *analytics*.
2. **Critérios Avaliados:** Acesso sem cadastro/app, filtros e busca, calendário, compartilhamento, painel administrativo, relatórios automáticos, recomendação baseada em dados, acessibilidade e desempenho mobile.
3. **Diferencial Validado:** Enquanto soluções tradicionais focam apenas na divulgação de agenda ou venda de ingressos, o **Conecta Shopping** integra o planejamento estratégico orientado a objetivos comerciais e histórico interno.
4. **Comparação Interna:** Nos relatórios administrativos, cada evento é comparado com o histórico do próprio shopping e com *benchmarks* de referência cadastrados pela gestão, evoluindo continuamente a cada ciclo do MVP.

---

## 🔒 8. Privacidade e Conformidade (LGPD)

A arquitetura segue os princípios de **Privacy by Design**:

- **Minimização de Dados:** Coleta estritamente necessária para a operação e geração de métricas.
- **Acesso Livre:** Nenhuma identificação ou cadastro é exigido do visitante para navegar pela programação ou favoritar eventos.
- **Dados Agregados:** Priorização de métricas consolidadas (visualizações, cliques e check-ins anônimos), sem inferência de dados pessoais sensíveis.
- **Higienização de Arquivos:** Remoção automática de metadados de imagens enviadas pela administração via `Sharp`.
