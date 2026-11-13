# Agenda Digital do Shopping

Proposta de uma agenda digital para ajudar visitantes a descobrir eventos do shopping e apoiar a equipe na divulgação, no planejamento e na avaliação das experiências realizadas.

## Contexto

Shoppings também são espaços de convivência, lazer, entretenimento e realização de eventos. Para planejar experiências que interessem a diferentes públicos, é importante facilitar o acesso à programação e aprender com a participação e as opiniões dos visitantes.

## Objetivo

Melhorar o planejamento, a participação e a avaliação dos eventos realizados no shopping, reunindo a programação em um canal simples e acessível.

## Proposta

A Agenda Digital do Shopping terá uma página pública para visitantes e uma área administrativa para a equipe responsável pelos eventos.

### Para visitantes

- Consultar os próximos eventos sem precisar criar uma conta.
- Encontrar informações como data, horário, local, público indicado, preço, vagas e acessibilidade.
- Filtrar a programação por data e tipo de atividade.
- Acessar a agenda pelo link na bio do Instagram, pelas publicações dos eventos e por um destaque na entrada do Wi-Fi gratuito.
- Enviar uma avaliação breve e sugerir atividades futuras.

### Para administradores

- Cadastrar e atualizar eventos em um único lugar.
- Organizar a programação e divulgar informações atualizadas.
- Consultar inscrições, presença e avaliações, quando esses recursos estiverem disponíveis.
- Usar os resultados para orientar os próximos eventos.

## Fluxo da experiência

1. A equipe planeja e cadastra um evento.
2. A agenda publica a programação.
3. O visitante descobre o evento pelo Instagram ou pelo Wi-Fi do shopping.
4. O visitante consulta os detalhes e participa.
5. Depois do evento, pode enviar uma avaliação.
6. A equipe analisa os resultados e aprimora a próxima programação.

## Indicadores sugeridos

- Visualizações e inscrições por evento.
- Participantes presentes e desistências.
- Satisfação dos visitantes.
- Interesses e sugestões mais frequentes.
- Intenção de participar de eventos futuros.

## Cuidados de experiência e privacidade

A consulta à programação deve ser simples e aberta, sem exigir cadastro. O uso do Wi-Fi não deve depender de inscrição em eventos ou de envio de avaliações. Caso sejam coletadas informações pessoais ou preferências, o sistema deverá explicar de forma clara a finalidade da coleta e oferecer escolha ao visitante.

## Escopo inicial sugerido

Uma primeira versão pode incluir a agenda pública, páginas de detalhes dos eventos, cadastro administrativo e avaliação breve após cada atividade. Inscrições, lembretes e relatórios podem ser acrescentados em etapas posteriores.

## Situação do projeto

A **Fase 1 (Plataforma essencial)** está implementada na branch `feat/phase-1-platform`. Ela ainda não foi publicada em nenhum ambiente. A especificação fica em [`docs/spec/`](docs/spec/README.md), e o status de cada item está em [`docs/spec/09-backlog.md`](docs/spec/09-backlog.md).

**O que existe:** agenda pública com busca e filtros, página de detalhes (Open Graph, JSON-LD, `.ics` e Google Agenda), compartilhamento, página de privacidade com "apagar dados deste dispositivo", área administrativa com login, papéis, usuários, espaços, eventos (rascunho, publicação, cancelamento e encerramento), upload de banner, links e QR de divulgação e painel básico de métricas.

**O que não existe, de propósito:** "Tenho interesse" (fase pendente, P-FASE-1), reservas, check-in, avaliações, sugestões, módulo de inteligência e integrações. As decisões abertas estão em [`docs/spec/07-mvp-e-riscos.md`](docs/spec/07-mvp-e-riscos.md) §4.

## Como rodar localmente

Requisitos: Node.js 22.12 ou mais recente. O PostgreSQL é opcional, porque a aplicação também roda com o banco embutido **PGlite**, que guarda os dados numa pasta local.

1. Instale as dependências:

   ```sh
   npm install
   ```

2. Copie `.env.example` para `.env.local` e preencha. O arquivo `.env.local` está no `.gitignore` e **nunca** deve ser versionado.
   - `DATABASE_URL`: use `pglite:./storage/pglite` (sem Docker) ou `postgres://conecta:conecta_local_only@localhost:5432/conecta` depois de `docker compose up -d`. A senha do Compose serve só para uso local.
   - `DEVICE_ID_PEPPER`: gere com `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`. Em desenvolvimento, se ficar vazio, a aplicação usa um valor temporário. Em produção, ele é obrigatório.

3. Prepare o banco e, se quiser, os dados de demonstração:

   ```sh
   npm run db:migrate
   npm run db:seed        # categorias, recursos de acessibilidade, um espaço e eventos de exemplo
   ```

4. Crie a primeira conta da equipe. A senha é pedida no terminal e precisa ser trocada no primeiro acesso:

   ```sh
   npm run admin:create -- --name "Seu nome" --email voce@example.com --role administrator
   ```

5. Suba a aplicação com `npm run dev` e abra <http://localhost:3000>. A área da equipe fica em `/admin`.

## Verificações

| Comando | O que faz |
| --- | --- |
| `npm test` | Testes de unidade e de integração (Vitest; o banco é PGlite em memória) |
| `npm run test:e2e` | Compila a aplicação e roda os testes ponta a ponta (Playwright + axe). Usa um banco descartável em `storage/e2e-db` e a porta 3200 |
| `npm run typecheck` | TypeScript em modo estrito |
| `npm run lint` | ESLint |
| `npm run format:check` | Prettier |
| `npm run build` | Build de produção do Next.js |

Para o primeiro `test:e2e`, instale o navegador com `npx playwright install chromium`.

## Integração contínua e implantação

- **CI:** o workflow `.github/workflows/ci.yml` roda lint, tipos, formatação, testes, build e E2E em cada pull request e em cada push na `main`.
- **Vercel:** está preparada, mas não vinculada. Veja [`docs/implantacao-vercel.md`](docs/implantacao-vercel.md) para as variáveis, os serviços pendentes e os passos que dependem do responsável.

## Convenções

A documentação e a interface ficam em português do Brasil, e o código em inglês. Veja [`CLAUDE.md`](CLAUDE.md), [`GLOSSARY.md`](GLOSSARY.md) e [`docs/spec/05-arquitetura.md`](docs/spec/05-arquitetura.md) §6.
