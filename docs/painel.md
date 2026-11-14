# Modo painel digital (B-45)

> Revisão 1 · 2026-11-14 · Issue [#45](https://github.com/Marquin25/agenda-digital-shopping/issues/45). O modelo e o fornecedor dos painéis (decisão **P-INT-2**) ainda não foram definidos; esta página foi testada só em navegador.

A página **`/painel`** mostra os destaques da agenda para telas e totens do shopping. Basta o *player* do painel abrir a URL num navegador em tela cheia. Ninguém precisa tocar na tela.

## O que aparece

- Um destaque por vez, com capa, categoria, título, data, horário e local em letras grandes.
- Primeiro os eventos **em andamento**, depois os próximos, por horário de início. Eventos cancelados, encerrados e rascunhos não aparecem.
- Um **QR Code** em cada destaque, que abre a página do evento no celular. Sem destaques, a tela mostra um QR para a agenda.
- A lista se atualiza sozinha a cada 5 minutos.

## Configurar cada tela pela URL

| Parâmetro | Exemplo | Padrão | O que faz |
| --- | --- | --- | --- |
| `tela` | `tela=entrada-a` | nenhum | Nome da tela (letras minúsculas, números e hífen; até 32). Vai junto nos QR para separar as telas nas métricas |
| `intervalo` | `intervalo=15` | 12 | Segundos de cada destaque (mínimo 6, máximo 60) |
| `limite` | `limite=5` | 8 | Quantos destaques entram na rotação (1 a 12) |
| `categoria` | `categoria=infantil` | todas | Mesmo filtro da agenda; pode repetir |
| `acessibilidade` | `acessibilidade=libras` | todos | Mesmo filtro da agenda; pode repetir |
| `data` | `data=hoje` | todas | `hoje`, `fim-de-semana` ou `intervalo` com `de` e `ate` (AAAA-MM-DD) |

Exemplo de uma tela na praça de alimentação que mostra só o que acontece hoje:

```text
https://<endereço da agenda>/painel?tela=praca-alimentacao&data=hoje&intervalo=15
```

Valores inválidos são ignorados e a tela usa o padrão.

## Métricas e privacidade

- A tela **não conta como visitante**: `/painel` não grava visualização, não cria identificador de aparelho e não aparece nos buscadores (`noindex`).
- Quem lê o QR chega ao evento com `utm_source=painel` e `utm_campaign=<tela>`. No painel de métricas, a visita entra no canal **Painel digital**, com as mesmas regras de qualquer visita (docs/spec/03-metricas.md).

## Acessibilidade

- A rotação tem o botão **Pausar rotação** (WCAG 2.2.2) e para enquanto o mouse está sobre o destaque.
- A troca é um esmaecimento curto, sem piscar, e some para quem pede menos movimento (`prefers-reduced-motion`).
- Os destaques ocultos ficam fora da árvore de acessibilidade; o leitor de tela é avisado da troca só quando a rotação está pausada (padrão de carrossel do WAI-ARIA APG).
- O QR fica sempre escuro sobre fundo claro, também no modo escuro, para a câmera conseguir ler.

## Pendente

- Testar no equipamento real assim que P-INT-2 for decidido (tamanho, orientação, navegador do *player* e rede).
- Se o fornecedor exigir integração com o sistema do painel em vez da URL, ela fica atrás de um adaptador próprio (docs/spec/05-arquitetura.md, D11).
