# 08 — Estratégia de testes e definição de pronto

> Papel: **QA** · O TDD (skill `tdd`) vale para regras de domínio e casos de uso.

## 1. Pirâmide de testes

| Nível | Ferramenta (proposta) | O que cobre | Exemplos |
| --- | --- | --- | --- |
| Unidade (domínio) | Vitest | Regras puras, escritas primeiro (TDD) | status derivado; janela de avaliação; token de check-in (janela atual/anterior); geração e escaping do `.ics`; fórmulas de CSAT e conversão; validação de entrada |
| Integração | Vitest + PostgreSQL em contêiner | Casos de uso com banco real | unicidade de interesse, avaliação e check-in; limite de requisições; retenção e agregação; autorização por papel |
| Ponta a ponta | Playwright (Chromium + WebKit, viewport móvel 390×844 e desktop) | Jornadas principais | visitante filtra → abre detalhe → marca interesse → baixa `.ics`; avalia evento encerrado; Editor cria e publica evento; Analista vê o dashboard e não consegue editar |
| Acessibilidade automática | `@axe-core/playwright` em cada página e estado | Violações WCAG detectáveis | zero violações sérias ou críticas |
| Acessibilidade manual | Checklist por entrega | O que a automação não pega | só teclado; VoiceOver (iOS) e TalkBack (Android) nas jornadas do visitante; zoom de 200% e 320 px; contraste do tema |
| Segurança | Testes de integração + checagens | Autorização, CSRF, upload, cabeçalhos, segredos | acesso a `/admin` sem sessão → redireciona; Analista fazendo POST de edição → 403; upload de SVG ou arquivo com extensão falsa → rejeitado; gitleaks no CI |
| Desempenho | Lighthouse CI | Orçamento da agenda e do detalhe | LCP, CLS e peso do JS dentro das metas |
| Responsividade e compatibilidade | Playwright + teste manual em aparelho real | Safari iOS, Chrome Android, navegador interno do Instagram, portal Wi-Fi | download do `.ics` e persistência do cookie nos navegadores internos |

## 2. Critérios de aceite por funcionalidade (resumo)

O detalhamento fica em cada issue de `09-backlog.md`. Regras transversais:

- **Interesse ≠ presença:** nenhum teste, consulta ou rótulo soma os dois.
- **Idempotência:** repetir uma ação pública (interesse, check-in, avaliação) não cria duplicata.
- **Equipe excluída:** ações com sessão administrativa não alteram métricas.
- **Sem dado pessoal em log:** teste que verifica que os logs não contêm IP completo, cookie ou comentário.

## 3. Registro de resultados e defeitos

- Cada PR informa **os comandos executados e o resultado real** (nunca "testes passaram" sem rodar).
- Defeito: issue com o rótulo `bug`, passos para reproduzir, resultado esperado × obtido, ambiente (navegador e dispositivo) e evidência. A investigação usa a skill `diagnosing-bugs`.

## 4. Definição de pronto (DoD)

Uma issue está **pronta** quando:

1. Os critérios de aceite da issue foram verificados no comportamento real (não só nos testes).
2. Os testes de unidade e integração das regras novas passam; o E2E da jornada afetada passa.
3. O axe não acusa nenhuma violação séria ou crítica nas telas alteradas; o checklist manual de teclado foi feito.
4. `lint`, `typecheck` e `build` passam; nenhum segredo foi versionado.
5. Autorização testada para cada papel quando a issue mexe em `/admin`.
6. Documentação atualizada (`docs/spec/`, `GLOSSARY.md`, ADR se houve decisão).
7. A revisão com a skill `code-review` foi feita e os apontamentos foram tratados.
8. Commits pequenos e claros numa branch da issue; a issue e o board foram atualizados.
9. A aplicação continua executável localmente (`docker compose up` + `npm run dev`).

## 5. Definição de preparada (DoR)

A issue tem objetivo, critérios de aceite verificáveis, dependências marcadas, nenhuma decisão aberta que a bloqueie e estimativa de tamanho P ou M (G = quebrar em partes).
