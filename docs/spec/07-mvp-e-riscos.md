# 07 — MVP, priorização, riscos e decisões abertas

> Papel: **PO** (com QA para os riscos).

## 1. Escopo do MVP

Fecha o ciclo **Descobrir → Participar → Avaliar → Melhorar** com o mínimo de dados.

| Incluído | Condicionado (M\*) | Adiado |
| --- | --- | --- |
| Agenda pública com busca e filtros (categoria, data, acessibilidade) | **Check-in por QR rotativo**: implementar só depois de aprovar o desenho em `03-metricas.md` §6 e o ADR | Cupom promocional |
| Detalhes do evento, compartilhamento, schema.org e Open Graph | | Inscrição com reserva de vaga ou cobrança |
| "Tenho interesse" | | Lembretes, e-mail, push |
| `.ics` + link do Google Calendar | | Mural de sugestões público |
| Avaliação aberta pós-evento (período configurável, antispam) | | Login de visitante |
| Envio de sugestões (só a administração vê) | | Vários shoppings |
| Login administrativo + papéis + gestão de usuários | | Login com Google, Microsoft ou passkeys |
| CRUD de eventos + banner + status | | NPS, exportação CSV |
| Dashboard (acessos, interesse, avaliações, CSAT, origem) | | Integração por API com Instagram ou Ponto Fibra |
| Privacidade + apagar dados do dispositivo + retenção | | |

### Inscrição com vaga: ponto de parada obrigatório

O administrador pode informar "vagas limitadas" e uma capacidade **informativa**. Antes de criar **reserva** ou **cobrança**, o trabalho para e estas questões são apresentadas ao responsável:

- Reservar vaga sem dados pessoais só garante "um lugar por dispositivo", o que é fácil de burlar. Garantir a vaga de verdade exige identificar a pessoa (nome, e-mail ou telefone) e isso muda a análise de LGPD.
- Seria preciso lista de espera, cancelamento e não comparecimento, além de conferência na entrada (quem confere? com que dado?).
- Cobrança exige meio de pagamento (gateway), dados fiscais, política de reembolso, regras do Código de Defesa do Consumidor e PCI. Isso é um projeto à parte.

## 2. Critérios de priorização

Ordem de decisão para cada item do backlog:

1. **Fecha o ciclo?** Itens sem os quais o ciclo não fecha vêm primeiro (agenda → detalhes → interesse → admin cria evento → avaliação → dashboard).
2. **Risco ou incerteza alta?** Fazer cedo ou fazer um *spike* (ex.: comportamento do navegador interno do Instagram e do portal Wi-Fi).
3. **Depende de decisão externa?** Fica bloqueado com um rótulo, sem atrasar o resto (hospedagem, LGPD, Ponto Fibra).
4. **Valor ÷ esforço**, com acessibilidade e segurança como **requisitos de cada item**, não como itens à parte.

## 3. Riscos

| # | Risco | Prob. | Impacto | Mitigação | Dono |
| --- | --- | :-: | :-: | --- | --- |
| R1 | Navegador interno do Instagram ou do portal Wi-Fi bloqueia cookie ou download do `.ics` | Alta | Médio | Spike cedo; alternativas "copiar link" e "abrir no navegador"; não depender de `localStorage` | Web/QA |
| R2 | Métricas infladas (vários cookies, robôs, equipe) | Alta | Médio | Dedup, exclusão da equipe, filtro de robôs, rótulos "dispositivos estimados", CSAT verificado | Web |
| R3 | Spam em avaliações e sugestões | Média | Médio | Camadas da seção 5 de `03-metricas.md`; Turnstile que pode ser ligado | Web |
| R4 | Fraude no check-in (foto do QR) | Média | Baixo–médio | Token de 60 s; janela do evento; alertas | Web |
| R5 | Dados pessoais digitados em comentários | Média | Médio | Aviso; só a administração vê; retenção; ocultar | PO/LGPD |
| R6 | Hospedagem indefinida atrasa a publicação | Alta | Alto | App portável; desenvolvimento local completo; decisão registrada | PO |
| R7 | Pendências de LGPD não validadas a tempo | Média | Alto | Minimização por padrão; lista P-LGPD; nada de "conforme LGPD" | PO |
| R8 | Conteúdo sem acessibilidade (banner sem alt, texto em imagem) | Média | Médio | `alt` obrigatório; orientação no formulário; revisão na publicação | UX |
| R9 | Fuso e horário de verão nos eventos e no `.ics` | Baixa | Médio | Armazenar em UTC; exibir com `America/Sao_Paulo` pela base IANA; testes | Web |
| R10 | Uma pessoa só mantém o sistema | Média | Alto | Simplicidade, documentação e testes automatizados | PO |
| R11 | Link do Google Calendar sem documentação oficial | Baixa | Baixo | `.ics` como principal | Web |

## 4. Decisões abertas

| ID | Decisão | Quem decide | Bloqueia |
| --- | --- | --- | --- |
| P-INF-1 | Hospedagem (A/B/C/D em `05-arquitetura.md`), orçamento e responsável pela manutenção e pelos backups | Responsável do projeto / shopping | Implantação (E8) |
| P-INF-2 | Domínio e DNS | Shopping | Implantação, Open Graph final |
| P-INF-3 | Conta Cloudflare para o Turnstile (opcional) | Responsável | Apenas ligar o Turnstile |
| P-AUTH-1 | Provedor de login: própria (proposta) × Google/Microsoft × link mágico | Responsável | Não bloqueia: começa com a própria e mantém a interface trocável |
| P-INT-1 | Portal Ponto Fibra: link externo, navegador, quem configura | Shopping + Ponto Fibra | Divulgação via Wi-Fi |
| P-LGPD-1…5 | Ver `06-qualidade.md` §3 | Controlador / encarregado | Publicação em produção |
| P-PROD-1 | Aprovação do desenho do check-in (QR rotativo) | Responsável | E6 |
| P-PROD-2 | Período padrão de avaliação (proposta: 7 dias) | Responsável | Não bloqueia (é configurável) |
| P-PROD-3 | Identidade visual (cores, logo) e nome final | Shopping | Não bloqueia (tema provisório acessível) |
| P-PROD-4 | Lista final de recursos de acessibilidade e categorias | Shopping + UX | Não bloqueia (semente editável) |
