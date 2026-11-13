# 10 — Inteligência estratégica (Fase 2)

> Revisão 2 · 2026-11-13 · Base: seção 5 do PDF (**[PDF]**) + recomendações da equipe (**[R]**). Itens **[P]** dependem de decisão.

## 1. Objetivo

Ajudar a administração a decidir **quais experiências realizar, para quem e como avaliar o resultado** [PDF], combinando o que ela informa (objetivos, público, segmentos, orçamento, período, espaços) com o histórico da própria plataforma.

**Princípios [C][PDF]:**
- Regras **transparentes e configuráveis** antes de qualquer IA.
- Toda recomendação mostra **premissas, regras aplicadas e nível de confiança**.
- Custos e públicos são **faixas informadas pela administração**, nunca previsões garantidas.
- Nenhuma característica sensível é inferida dos visitantes [PDF]. O "público desejado" é uma **descrição de alvo** escrita pela equipe, não um perfil coletado de pessoas.

## 2. Entradas

### 2.1 Planejamento (briefing) [PDF]

| Campo | Tipo | Exemplo |
| --- | --- | --- |
| Objetivo principal (e secundários) | lista fechada: aumentar vendas · ampliar fluxo · atrair novos públicos · fortalecer a experiência | Aumentar vendas |
| Público desejado | faixa etária (faixas fixas), perfil (famílias com crianças, jovens, adultos, 60+, PcD…), interesses (tags) | Homens 25–40, interesse em moda |
| Segmentos comerciais | lista mantida pela administração: alimentação, moda, tecnologia, beleza, lazer… | Moda masculina |
| Estabelecimentos interessados | lojas cadastradas (opcional) | Lojas X e Y |
| Orçamento | faixa (mín.–máx., R$) | R$ 5–15 mil |
| Período | intervalo de datas + dias e horários preferidos | Fins de semana de março |
| Espaços disponíveis | espaços cadastrados | Praça Central, Mall L2 |

### 2.2 Catálogo de modelos de experiência [R]

Sem uma base de ideias, regras não conseguem sugerir nada. A administração mantém um catálogo editável:

| Campo | Exemplo |
| --- | --- |
| Nome e descrição | "Consultoria de estilo" |
| Objetivos que atende (peso 0–3 cada) | vendas 3 · experiência 2 · novos públicos 1 |
| Públicos atendidos (peso) | adultos 25–40: 3 · jovens: 1 |
| Segmentos relacionados | moda, beleza |
| Faixa de custo (informada) | R$ 3–8 mil |
| Estrutura necessária | área ≥ 30 m², energia, mesa; capacidade |
| Duração típica | 4 h |
| Categoria da agenda | Moda/Experiência |
| Indicadores sugeridos | visualizações, interessados, CSAT, vendas do segmento (se integrado) |

**Quem escreve o conteúdo inicial do catálogo?** [P] Proposta: a equipe de marketing do shopping, com 10–20 modelos de partida sugeridos pela equipe de agentes e revisados pelo shopping.

### 2.3 Histórico (da plataforma)

Indicadores agregados de eventos encerrados (visualizações, interesse, CSAT, check-ins), por categoria, modelo, dia da semana, horário e época. **Só agregados.**

## 3. Motor de recomendações por regras (Fase 2) [C][PDF]

1. **Filtros eliminatórios** (cada um explicado quando elimina um modelo):
   - faixa de custo **mínima** do modelo > orçamento **máximo** → eliminado ("custo mínimo informado acima do orçamento");
   - nenhum espaço disponível atende à estrutura necessária → eliminado;
   - duração incompatível com o período → eliminado.
2. **Pontuação** (pesos configuráveis pelo Administrador):
   `pontuação = w_obj·aderência_objetivo + w_pub·aderência_público + w_seg·aderência_segmento + w_hist·ajuste_histórico`
   - aderências normalizadas entre 0 e 1 a partir dos pesos do catálogo;
   - `ajuste_histórico` só se houver **≥ 3 eventos** e **≥ 30 dispositivos estimados** no histórico comparável [R]; caso contrário vale 0 e aparece "sem histórico suficiente".
3. **Saída** (top N, padrão 5), para cada ideia:
   - por que foi sugerida (regras que pontuaram, em linguagem simples);
   - premissas usadas (ex.: "custo conforme o catálogo, atualizado em …");
   - público potencial (descrição do alvo, **sem número de pessoas prometido**);
   - lojas que poderiam participar (estabelecimentos dos segmentos ligados);
   - estrutura necessária e espaços compatíveis;
   - faixa de custo **informada**;
   - indicadores recomendados para medir;
   - **nível de confiança**: baixo (só regras) · médio (histórico mínimo) · alto (histórico amplo e consistente).
4. Aviso fixo: *"Sugestões baseadas nas regras e nos dados informados. Não são previsões nem garantias de resultado."*
5. **Rastreabilidade [R]:** cada execução grava as entradas, a versão das regras e os pesos usados, para reproduzir e auditar.

### Exemplo ilustrativo (do PDF)

Briefing "aumentar vendas · homens 25–40 · moda masculina · orçamento R$ X · março": o motor pode sugerir "Consultoria de estilo", "Festival de moda" e "Ação integrada moda + gastronomia", cada um com as regras que pontuaram e as premissas. Os nomes dependem do catálogo cadastrado.

## 4. Identificação de oportunidades (Fase 2, descritiva) [PDF]

Painel com análises descritivas e o n sempre visível:
- dias da semana e horários com mais acessos e interessados;
- categorias com baixo engajamento (abaixo da mediana, com n mínimo);
- eventos com melhor desempenho por categoria e época;
- temas mais frequentes no mural de sugestões (contagem por categoria escolhida pelo visitante; **sem análise automática de texto livre no MVP** [R]).

## 5. Ciclo de aprendizado [R]

`Planejamento → recomendação escolhida → evento criado (ligado ao planejamento) → relatório pós-evento → histórico → próximas recomendações`. O Analista registra a decisão ("escolhemos o modelo X porque…") e, depois, uma nota de lições aprendidas.

## 6. Fase 3 — evolução [PDF]

- Incorporar fluxo e vendas agregados como indicadores (quando houver fonte e autorização).
- Modelos analíticos ou IA para recomendação **somente** com histórico suficiente e avaliação de viés; sempre com explicação e possibilidade de desligar [P].

## 7. Decisões pendentes

| ID | Decisão |
| --- | --- |
| P-INT-IA-1 | Quem cria e mantém o catálogo de modelos e os pesos iniciais |
| P-INT-IA-2 | Quais papéis criam planejamentos e geram recomendações (Editor?) |
| P-INT-IA-3 | Faixas etárias e perfis usados no "público desejado" |
| P-INT-IA-4 | Limiar de histórico mínimo para ajuste (proposta: 3 eventos e 30 dispositivos) |
| P-INT-IA-5 | Uso futuro de IA/modelos (Fase 3) e seus critérios de aceitação |
