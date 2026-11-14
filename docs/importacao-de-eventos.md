# Importação de eventos por planilha (B-94)

Permite cadastrar ou atualizar vários eventos de uma vez a partir de uma planilha do Excel. Nada é gravado
antes da confirmação: o sistema lê o arquivo no servidor, mostra uma prévia linha a linha e só então,
quando a equipe confirma, cria ou atualiza os eventos.

## Quem pode usar

Quem tem a permissão `events:manage` (papéis **Editor** e **Administrador**). Analistas não veem a tela,
o modelo nem os relatórios.

## Passo a passo

1. Em **Eventos**, toque em **Importar planilha** (`/admin/eventos/importar`).
2. Baixe o **modelo de planilha (CSV)**. Ele tem os cabeçalhos e uma linha de exemplo — apague o exemplo.
3. Preencha uma linha por evento. Salve como **.xlsx** ou como **CSV UTF-8** (no Excel: “CSV UTF-8
   (delimitado por vírgulas)”; o separador `;` do Excel em português é aceito).
4. Envie o arquivo e clique em **Ver prévia**.
5. Revise os totais (novos, atualizados, ignorados, rejeitados) e as observações de cada linha. Se houver
   problemas, baixe o **relatório de erros (CSV)**, corrija a planilha e envie de novo.
6. Clique em **Confirmar importação**. Os eventos marcados com “Publicar = Sim” aparecem na agenda; os
   demais ficam como rascunho. A tela final lista os eventos com link para cada um.

A prévia vale por 24 horas. Se algo mudou entre a prévia e a confirmação (por exemplo, outra pessoa
importou o mesmo código), a confirmação é recusada e a prévia é recalculada para nova revisão.

## Colunas

| Coluna | Obrigatória | Formato |
| --- | --- | --- |
| Código | não | Letras, números, ponto, hífen ou sublinhado (até 64). Identifica o evento para atualizações |
| Título | sim | 3 a 120 caracteres |
| Descrição | sim | 10 a 5.000 caracteres |
| Início | sim | `dd/mm/aaaa hh:mm` no horário de Brasília, ou célula de data e hora do Excel |
| Término | sim | Mesmo formato; depois do início |
| Espaço | sim | Nome de um espaço ativo já cadastrado |
| Detalhe do local | não | Até 200 caracteres |
| Categoria | sim | Nome de uma categoria ativa |
| Acessibilidade | não | Recursos cadastrados separados por `;` |
| Lojas | não | Lojas ativas cadastradas separadas por `;` |
| Entrada | não | Até 300 caracteres |
| Vagas | não | “Livre” (padrão) ou “Ordem de chegada”. Não existe reserva |
| Vagas exibidas | não | 1 a 100.000; só com “Ordem de chegada” |
| Dias para avaliar | não | 1 a 30 (padrão 7) |
| Publicar | não | “Sim” publica ao confirmar; vazio ou “Não” deixa como rascunho |

Os nomes de espaços, categorias, lojas e recursos são comparados sem diferenciar maiúsculas e acentos
(“praca central” encontra “Praça Central”). Colunas fora do modelo são ignoradas com aviso.

## Regras de importação

- **Com Código**: se já existe um evento importado com aquele código, a linha **atualiza** esse evento;
  senão, cria um novo e guarda o código. Para atualizar, a planilha precisa ter todas as colunas do modelo
  (para não apagar campos por omissão).
- **Sem Código**: a linha é **ignorada** se já existir evento com o mesmo título, início e espaço (ou se
  repetir uma linha anterior do arquivo). Eventos nunca são atualizados só pelo título.
- Código repetido no mesmo arquivo: a segunda linha é rejeitada.
- Eventos cancelados ou encerrados não podem ser alterados pela planilha.
- “Publicar = Não” não despublica um evento já publicado (fica um aviso).
- Início no passado gera aviso, não erro.
- Linhas com erro são **rejeitadas**; as demais podem ser importadas mesmo assim.
- Linhas totalmente vazias não contam.

## Segurança e limites

- Até **1 MB** e **500 linhas de eventos** por arquivo; só a primeira aba do .xlsx é lida.
- O servidor confere a extensão **e** o conteúdo: .xlsx precisa ser um ZIP válido; CSV precisa ser texto
  UTF-8 sem bytes nulos. O nome do arquivo e o tipo informado pelo navegador não bastam.
- Arquivos com **macros** (VBA) ou controles ActiveX são recusados; .xls antigo e .xlsm não são aceitos.
- O tamanho descompactado do .xlsx é limitado (contra “bombas” de ZIP).
- **Fórmulas não são executadas**: vale o valor que o Excel salvou na célula.
- **Banners, imagens e URLs não são baixados**: colunas como “Banner” ou “Imagem” são ignoradas. Adicione
  o banner depois, na página do evento.
- A importação só cria ou altera **eventos** (e suas ligações com recursos de acessibilidade e lojas
  existentes). Não cria nem altera espaços, categorias, lojas, usuários, permissões ou configurações.
- O relatório de erros CSV protege contra injeção de fórmulas (células que começam com `=`, `+`, `-`, `@`).
- A auditoria registra apenas as contagens (criados, atualizados, ignorados, rejeitados), não o conteúdo.
- As células enviadas ficam guardadas só para a prévia e a confirmação e são apagadas pela rotina de
  retenção após **7 dias**.
