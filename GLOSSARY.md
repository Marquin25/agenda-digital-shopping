# Glossário — Conecta Shopping

| Termo | Definição | Evitar |
| --- | --- | --- |
| **Evento** | Atividade da programação do shopping com início, fim, local e categoria | "atração" (é uma tag de avaliação) |
| **Status de publicação** | Decisão da equipe: Rascunho, Publicado ou Cancelado | — |
| **Status temporal** | Derivado das datas de um evento publicado: Agendado, Em andamento ou Encerrado | Editar manualmente |
| **Dispositivo estimado** | Unidade das métricas: um navegador identificado por cookie próprio; não equivale a uma pessoa | "usuário", "pessoa", "visitante único" |
| **ID do dispositivo** | Identificador aleatório no cookie; no banco fica só o HMAC (`id_hash`). É pseudonimizado | "anônimo" |
| **Interesse** | Sinal de intenção ("Tenho interesse"), que pode ser desligado; **não é presença nem reserva** | "inscrição", "confirmação" |
| **Check-in** | Registro de presença no local, validado por QR rotativo | "presença" quando a origem é o interesse |
| **Avaliação** | Nota de 1 a 5, com tags e comentário opcionais, enviada no período após o fim | "NPS" |
| **CSAT** | % de avaliações com nota 4 ou 5 sobre o total, sempre com n | — |
| **CSAT verificado** | CSAT só com avaliações de dispositivos que fizeram check-in | — |
| **Sugestão** | Ideia de evento enviada pelo visitante; visível só para a administração | "comentário público" |
| **Informações de entrada** | Texto livre do evento (preço, vagas por ordem de chegada); não gera reserva | "ingresso" |
| **Capacidade informativa** | Número de vagas exibido ao público; o sistema não controla nem garante vaga | "limite de inscrições" |
| **Origem** | Canal da visita pelo `utm_source`: wifi, instagram, outro, direto | — |
| **Modo telão** | Tela administrativa que exibe o QR rotativo do check-in no local | — |
