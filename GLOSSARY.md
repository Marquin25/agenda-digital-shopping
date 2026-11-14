# Glossário — Conecta Shopping

> No código (inglês), use o termo da coluna **Código**.

| Termo | Código | Definição | Evitar |
| --- | --- | --- | --- |
| **Evento** | `Event` | Atividade da programação do shopping com início, fim, local e categoria | "atração" (é uma tag de avaliação) |
| **Status de publicação** | `PublicationStatus` | Decisão da equipe: Rascunho, Publicado ou Cancelado | — |
| **Status temporal** | `TemporalStatus` | Derivado das datas de um evento publicado: Agendado, Em andamento ou Encerrado | Editar manualmente |
| **Dispositivo estimado** | `estimated devices` | Unidade das métricas: um navegador identificado por cookie próprio; não equivale a uma pessoa | "usuário", "pessoa", "visitante único" |
| **ID do dispositivo** | `DeviceId` / `deviceHash` | Identificador aleatório no cookie; no banco fica só o HMAC (`id_hash`). É pseudonimizado | "anônimo" |
| **Interesse** | `Interest` | Sinal de intenção ("Tenho interesse"), que pode ser desligado; funciona como favorito; **não é presença nem reserva** | "inscrição", "confirmação" |
| **Reserva** | `Reservation` | Pedido de lugar num evento configurado com limite. **Pendente de aprovação**; não comprova presença | "inscrição" (até decidir), "ingresso" |
| **Modo de vagas** | `CapacityMode` | Configuração do evento: sem limite · limitado por ordem de chegada · com reserva (pendente) | — |
| **Check-in** | `CheckIn` | Registro de presença no local, validado por QR rotativo | "presença" quando a origem é o interesse |
| **Avaliação** | `Rating` | Nota de 1 a 5, com tags e comentário opcionais, enviada no período após o fim | "NPS" |
| **CSAT** | `csat` | % de avaliações com nota 4 ou 5 sobre o total, sempre com n | — |
| **CSAT verificado** | `verifiedCsat` | CSAT só com avaliações de dispositivos que fizeram check-in | — |
| **Sugestão** | `Suggestion` | Ideia de evento enviada pelo visitante; visível só para a administração | "comentário público" |
| **Informações de entrada** | `admissionInfo` | Texto livre do evento (preço, vagas por ordem de chegada); não gera reserva | "ingresso" |
| **Capacidade informativa** | `displayedCapacity` | Número de vagas exibido ao público; o sistema não controla nem garante vaga | "limite de inscrições" |
| **Origem** | `TrafficSource` | Canal da visita pelo `utm_source`: wifi, instagram, outro, direto | — |
| **Modo telão** | `CheckInDisplay` | Tela administrativa que exibe o QR rotativo do check-in no local | — |
| **Modo painel digital** | `signage` (`/painel`) | Página pública de destaques para telas e totens do shopping: rotação pausável, sem interação; os QR exibidos registram a origem `painel` e o nome da tela | "telão" (é o modo do check-in) |
| **QR de divulgação** | `PromoQrCode` | QR estático que abre a agenda ou um evento e registra a origem; **não registra presença** | "QR do evento" (ambíguo) |
| **QR de check-in** | `CheckInQrCode` | QR rotativo exibido no modo telão; registra presença | "QR do evento" (ambíguo) |
| **Link de divulgação** | `PromoLink` | Link curto `/r/{codigo}` ligado a um canal (Instagram, Wi-Fi, cartaz, totem, painel) | "link rastreado" |
| **Medido / Estimado / Indisponível** | `MetricQuality` (`measured`/`estimated`/`unavailable`) | Classificação obrigatória de todo número: contagem direta · contagem aproximada (dedup por dispositivo, amostra) · fonte não integrada (exibir "—", nunca 0) | — |
| **Espaço** | `Venue` | Local físico do shopping onde um evento acontece, com área, capacidade e estrutura | "sala" |
| **Estabelecimento** | `Store` | Loja participante de um evento ou planejamento (dado empresarial) | "parceiro" (vago) |
| **Segmento** | `Segment` | Ramo comercial: alimentação, moda, tecnologia, beleza, lazer… | — |
| **Planejamento** | `Plan` | Briefing da administração: objetivo, público desejado, segmentos, orçamento, período e espaços | "campanha" |
| **Público desejado** | `TargetAudience` | **Descrição do alvo** escrita pela equipe; não é perfil coletado de visitantes | "perfil do visitante" |
| **Modelo de experiência** | `ExperienceTemplate` | Item do catálogo de ideias de evento, com pesos, custo informado e estrutura | "template" |
| **Recomendação** | `Recommendation` | Ideia sugerida pelo motor de regras, com justificativa, premissas e nível de confiança; **não é previsão nem garantia** | "previsão", "IA" (na Fase 2) |
| **Relatório pós-evento** | `EventReport` | Consolidação automática e agregada dos indicadores de um evento encerrado | — |
