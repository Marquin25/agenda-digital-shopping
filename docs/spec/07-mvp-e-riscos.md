# 07 — Fases, priorização, riscos e decisões abertas

> Papel: **PO** (com QA nos riscos) · Revisão 2 · 2026-11-13 · Legenda: **[C]** confirmado · **[PDF]** · **[R]** recomendação · **[P]** pendente.

## 1. Escopo por fase

| Fase 1 — Plataforma essencial [C][PDF] | Fase 2 — Inteligência e indicadores [C][PDF] | Fase 3 — Integrações e evolução [C][PDF] |
| --- | --- | --- |
| Agenda pública, busca e filtros | Painel completo com selos medido/estimado/indisponível | Integração com o portal Wi-Fi (viabilidade + autorização) |
| Detalhes, compartilhamento, Open Graph | Relatório automático pós-evento | Fluxo agregado (se houver fonte e autorização) |
| Gestão de eventos, espaços, usuários e papéis | Comparação entre eventos e períodos | Vendas agregadas (se houver fonte e autorização) |
| Links diretos e QR Codes de divulgação | Estabelecimentos e segmentos | Painéis digitais (modo painel / integração) |
| Métricas básicas: visualizações e origem | Planejamento: objetivos, público, segmentos, orçamento, período, espaços | Recomendações com modelos analíticos (com dados suficientes) |
| "Tenho interesse" [C] · **fase pendente** (P-FASE-1; rec. Fase 1) | Catálogo de modelos + motor de regras transparente | |
| `.ics` / Google Calendar [R] | Oportunidades descritivas | |
| Privacidade + apagar dados do dispositivo [R] | Avaliação pós-evento (regras [C], fase [P]) | |
| | Mural de sugestões (fase [P]) | |
| | Check-in por QR rotativo (**[P] desenho a aprovar**) | |
| | Spike de reservas (**[P]**) | |

**Fora de todas as fases sem nova aprovação:** cupom, pagamento, reserva com cobrança, login de visitante, notificações [C].

**Definição de MVP [P]:** recomendação [R]: Fase 1 = primeira versão publicável; Fases 1 + 2 = MVP completo da proposta do PDF.

### Inscrição, reserva e cobrança: ponto de parada obrigatório [C]

Antes de implementar **reserva** ou **cobrança**, o trabalho para e as implicações vão ao responsável. As alternativas e perguntas sobre reserva estão em `03-metricas.md` §6. Cobrança exige gateway, regras fiscais, Código de Defesa do Consumidor e PCI: é outro projeto.

## 2. Critérios de priorização [R]

1. **Fecha o ciclo da fase?** Na Fase 1, o ciclo é publicar → divulgar → medir o alcance; na Fase 2, medir → comparar → planejar → recomendar.
2. **Risco ou incerteza alta?** Fazer cedo, como *spike* (navegadores internos, portal Wi-Fi, reservas).
3. **Depende de decisão ou de terceiros?** Fica com `bloqueado:decisao` ou `bloqueado:terceiros`, sem atrasar o resto.
4. **Valor ÷ esforço**, com acessibilidade, segurança e privacidade **dentro** de cada item, não como itens separados.
5. **Gera histórico cedo?** Dados que alimentam a inteligência (visualizações, origem, interesse) entram cedo, porque a Fase 2 precisa de histórico.

## 3. Riscos

| # | Risco | Prob. | Impacto | Mitigação | Dono |
| --- | --- | :-: | :-: | --- | --- |
| R1 | Navegadores internos (Instagram, portal Wi-Fi) bloqueiam cookie ou download do `.ics` | Alta | Médio | Spike na Fase 1; alternativas; não depender de `localStorage` | Web/QA |
| R2 | Métricas infladas ou lidas como "pessoas" | Alta | Médio | Dedup; selos medido/estimado/indisponível; "dispositivos estimados"; equipe excluída | Web/PO |
| R3 | Spam em avaliações, sugestões e reservas | Média | Médio | Camadas de `03-metricas.md` §5 | Web |
| R4 | Fraude no check-in | Média | Baixo–médio | QR rotativo; janela; alertas | Web |
| R5 | Dados pessoais digitados em comentários | Média | Médio | Aviso; acesso restrito; retenção; ocultar | PO |
| R6 | Hospedagem e orçamento indefinidos atrasam a publicação | Alta | Alto | App portável; tudo roda localmente | PO |
| R7 | Pendências de LGPD não validadas | Média | Alto | Minimização; lista P-LGPD; nunca dizer "conforme" | PO |
| R8 | Conteúdo inacessível (banner sem alt, texto em imagem) | Média | Médio | `alt` obrigatório; orientação; revisão | UX |
| R9 | Fuso e horário em `.ics` e relatórios | Baixa | Médio | UTC + IANA; testes | Web |
| R10 | Uma só pessoa mantém o sistema | Média | Alto | Simplicidade; testes; documentação | PO |
| R11 | **Expectativa de "IA" maior do que o motor de regras entrega** | Alta | Médio | Comunicar "regras transparentes" desde já; mostrar premissas e confiança | PO |
| R12 | **Histórico insuficiente** para recomendações e comparações úteis | Alta | Médio | Coletar métricas desde a Fase 1; limiar mínimo; confiança "baixa" explícita | Web/PO |
| R13 | **Catálogo de modelos vazio ou desatualizado** (motor sem o que sugerir) | Média | Alto | Catálogo inicial revisado pelo marketing; data de atualização visível | PO |
| R14 | **Confusão entre QR de divulgação e QR de check-in** | Média | Médio | Nomes distintos na interface e no glossário; QR de check-in só no modo telão | UX |
| R15 | Integrações da Fase 3 inviáveis (sem API, sem autorização, custo) | Média | Médio | Fase 3 opcional; indicadores "indisponíveis"; nada no caminho crítico | PO |
| R16 | Dados de vendas confidenciais ou sujeitos a contrato | Média | Alto | Só agregados; acesso restrito; aprovação formal (P-LGPD-8) | PO |
| R17 | Viés em comparações (sazonalidade, feriados, duração diferente) | Média | Médio | Normalizar por hora; marcar datas especiais; avisos de amostra | Web |

## 4. Decisões abertas (consolidado)

| ID | Tema | Decisão necessária | Bloqueia |
| --- | --- | --- | --- |
| **P-MVP-1** | Escopo | O "MVP" é a Fase 1 ou as Fases 1 + 2? | Comunicação do marco |
| **P-FASE-1** | Prioridade | Fase do "Tenho interesse" (rec.: Fase 1) | Ordem do backlog |
| **P-FASE-2** | Prioridade | Fase das avaliações (rec.: início da Fase 2; alt.: fim da Fase 1) | Ordem do backlog |
| **P-FASE-3** | Prioridade | Fase do mural de sugestões (rec.: Fase 2) | Ordem do backlog |
| **P-PROD-1** | Check-in | Aprovar o desenho do QR rotativo (`03-metricas.md` §7) e a fase (rec.: Fase 2) | E-PART check-in |
| **P-RES-1…9** | Reservas | Aprovar ou não; escolher a alternativa (A/B/C/D) e responder às 9 perguntas de `03-metricas.md` §6.2 | Qualquer reserva |
| **P-ORC-1** | Orçamento | Orçamento mensal de infraestrutura e custo aceitável de serviços (Turnstile, e-mail, armazenamento) | Hospedagem |
| **P-INF-1** | Hospedagem | Opção A/B/C/D (`05-arquitetura.md` §3) | Implantação |
| **P-INF-2** | Domínio | Subdomínio e acesso ao DNS | Implantação, Open Graph final, QR impressos definitivos |
| **P-INF-3** | Antiabuso | Conta Cloudflare para Turnstile (opcional) | Só ligar o Turnstile |
| **P-EQ-1** | Equipe | Quem mantém o sistema, faz backup e responde a incidentes; quem do shopping opera (Editor, Analista) | Implantação; treinamento |
| **P-AUTH-1** | Autenticação | Provedor de login da equipe (`05-arquitetura.md` §3) | Não bloqueia (começa com o próprio) |
| **P-PAPEL-1** | Papéis | Permissões do Editor em planejamento e catálogo | Fase 2 |
| **P-INT-1** | Wi-Fi | Ponto Fibra: link no portal? navegador? autorização? integração? | Canal Wi-Fi |
| **P-INT-2** | Painéis | Modelo e fornecedor dos painéis digitais | Fase 3 |
| **P-INT-3/4** | Fluxo e vendas | Existem fontes? Formato, frequência, contrato, autorização | Fase 3 |
| **P-INT-IA-1…5** | Inteligência | `10-inteligencia.md` §7 (catálogo, papéis, faixas de público, limiar, IA futura) | Fase 2 |
| **P-LGPD-1…8** | Privacidade | `06-qualidade.md` §3 | Publicação em produção |
| **P-PROD-2** | Avaliação | Período padrão (proposta: 7 dias) | Não bloqueia |
| **P-PROD-3** | Marca | Identidade visual e nome final | Não bloqueia |
| **P-PROD-4** | Conteúdo | Categorias, recursos de acessibilidade, espaços e segmentos iniciais | Não bloqueia (semente editável) |
