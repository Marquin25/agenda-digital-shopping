## Convenções do projeto

- Documentação, issues e interface em **português do Brasil**; **código em inglês** (identificadores, tabelas, arquivos, testes, logs).
- Aplicar **SOLID** (skill `solid-design-principles`) e padrões de projeto apenas quando resolverem uma necessidade concreta; ver `docs/spec/05-arquitetura.md` §6.
- Termos do domínio e sua tradução para o código: `GLOSSARY.md`.

## Agent skills

### Issue tracker

Issues ficam no GitHub Issues de `Marquin25/agenda-digital-shopping` (via `gh` CLI); a especificação fica em `docs/spec/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Usa os cinco rótulos padrão (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: um `GLOSSARY.md` e `docs/adr/` na raiz do repo. See `docs/agents/domain.md`.
