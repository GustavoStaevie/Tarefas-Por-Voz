# Tarefas por Voz — documentação do projeto

Registro de tudo o que foi feito até agora: o que foi pedido, as decisões, como o
app funciona, como rodar no computador e no celular, o que foi testado e o código
completo de cada arquivo.

---

## 1. Histórico

### Sessão 1 (20/10/2026): primeira versão

- **Pedido:** integrar as tarefas do dia a dia ao **Google Agenda**.
  - **Entrada por voz:** você fala a atividade, o dia de entrega, o horário (se tiver) e a prioridade (baixa, média ou alta).
  - **Funções:** criar eventos na agenda, lembretes e marcar tarefas como concluídas.
  - **Tipo de solução:** um app web completo.
- **Feito:**
  - Parser de frases em português, com 20 testes.
  - Integração com a Google Calendar API.
  - Modo demonstração.
  - Interface com microfone, formulário de revisão e lista de tarefas.

### Sessão 3: entender melhor a fala e o texto

- **Pedido:** reconhecer palavras-chave de tipo (trabalho, prova, projeto, aula, tarefa, missão e sinônimos), as frases que vêm antes de um prazo ("tenho que entregar até", "tenho prazo até", "estou sendo cobrado"…) e a prioridade dita de várias formas, tanto na voz quanto no texto digitado.
- **Feito:**
  - Campo **Tipo** no formulário, salvo no evento e mostrado na lista.
  - O título passa a começar na palavra-chave ("tenho um trabalho de história…" → "Trabalho de história…").
  - Frases de prazo são reconhecidas antes da data e removidas do título; a data vira **Prazo de entrega**.
  - Prioridade com muito mais formas de falar, incluindo negações ("não é urgente" → baixa).
  - 20 testes novos (40 no total, todos passando).
  - Topo da página corrigido no celular quando está desconectado.

### Sessão 2: novo visual e uso no celular

- **Pedido:**
  - Melhorar o layout.
  - Tirar os emojis ("ícones de IA").
  - Centralizar o conteúdo.
  - Deixar responsivo para usar no celular, com alguma forma de manter o app rodando.
  - Conectar com a conta do Google.
- **Feito:**
  - **Visual novo:**
    - Fonte Inter.
    - Ícones em SVG desenhados como linhas, no lugar dos emojis.
    - Conteúdo centralizado numa coluna de até 620px.
    - Cards mais limpos e botão de microfone com animação enquanto grava.
    - Prioridade indicada por pontos coloridos.
    - Caixas de seleção redondas.
    - Tema claro e escuro.
  - **Celular:**
    - Layout próprio para telas de até 560px.
    - Campos com 16px, para o iPhone não dar zoom.
    - Botões com pelo menos 44px de altura.
    - Respeita o notch e a barra inferior do aparelho.
  - **App instalável (PWA):**
    - `manifest.webmanifest`, ícones e service worker (`sw.js`).
    - Pode ser adicionado à tela inicial e abre mesmo sem internet.
  - **Hospedagem:** passo a passo para publicar de graça no **GitHub Pages** (seção 6). É o que mantém o app rodando sem deixar o computador ligado.
  - **Títulos no Google Agenda:**
    - Não levam mais emoji; a prioridade aparece só pela cor do evento.
    - Tarefas concluídas ganham "✓ " na frente.
    - Eventos criados na versão antiga continuam sendo lidos normalmente.

## 2. Decisões tomadas

| Decisão | Escolha | Por quê |
|---|---|---|
| Tecnologia | HTML + CSS + JavaScript puro (módulos ES), sem build | Node não está instalado; assim não precisa instalar nada |
| Servidor local | `python -m http.server 8000` | Python 3.11 já está instalado |
| Reconhecimento de voz | Web Speech API do navegador, em `pt-BR` | É grátis e já vem no Chrome e no Edge |
| Entender a frase | Parser próprio baseado em regras (`parser.js`) | Funciona offline, sem custo e sem servidor |
| Login Google | Google Identity Services (token OAuth no navegador) | Não precisa de backend |
| API | Google Calendar API v3 via `fetch`, escopo `calendar.events` | Dá acesso só aos eventos, nada além disso |
| Sem configuração | **Modo demonstração** (salva no `localStorage`) | Permite testar tudo antes de configurar o Google |
| Revisão | Formulário de confirmação antes de salvar | A voz e o parser podem errar, então você confere antes |
| Hospedagem | **GitHub Pages** | Grátis, já vem com HTTPS (obrigatório para usar microfone e login no celular) e não precisa de servidor ligado |
| Celular | PWA (instalável na tela inicial) | Funciona como app sem passar pela loja de aplicativos |

## 3. Como o app funciona

### 3.1 O que você fala e o que o app entende

| Você fala | Exemplos | Vira |
|---|---|---|
| A tarefa | "entregar o relatório financeiro" | Título do evento |
| Tipo | trabalho, seminário, apresentação, relatório, artigo, redação, TCC · prova, avaliação, exame, teste, simulado, recuperação · projeto · aula, palestra, curso, workshop, monitoria · tarefa, atividade, lista de exercícios, lição, dever de casa · missão, desafio, meta, objetivo | Campo Tipo; o título começa na palavra-chave |
| Prazo | tenho que entregar (isso) até, tenho prazo até, o prazo é, estou/tô sendo cobrado pra, a entrega é, vence, data limite, tem que estar pronto até, pra entregar até | A data vira "Prazo de entrega" |
| Dia | hoje, amanhã, depois de amanhã, sexta-feira, na próxima segunda, terça que vem, dia 25, 3 de novembro, 05/11, daqui a 10 dias, semana que vem | Data de entrega |
| Horário (opcional) | às 15h, 14:30, às 9 e meia, às duas da tarde, 8 da noite, meio-dia, de manhã (9h), à tarde (14h), à noite (19h) | Início do evento |
| Duração (opcional) | por uma hora, por 45 minutos, por meia hora | Fim do evento (padrão: 30 min) |
| Prioridade alta | prioridade alta/máxima, alta prioridade, é urgente, muito importante, crítico, pra ontem, o quanto antes, sem falta | Vermelho e mais lembretes |
| Prioridade média | prioridade média/normal/moderada, mais ou menos importante | Amarelo (padrão) |
| Prioridade baixa | prioridade baixa/mínima, sem pressa, não é urgente, não é prioridade, pouco importante, quando der | Verde |

Regras importantes do parser:

- **"às 1" a "às 5" sem período** vira tarde (às 3 → 15h). "Às 3 da manhã" continua 3h.
- **Sem data falada**, a data fica como **hoje** e o campo aparece destacado para você conferir.
- **"dia 25"** cai neste mês se ainda não passou; senão, no próximo mês.
- **Dia da semana** é sempre a próxima ocorrência (se hoje é sexta, "sexta" é daqui a 7 dias).
- **"segunda via", "segunda vez"** e parecidos **não** viram segunda-feira.
- **Começos como "tenho que", "preciso" e "lembrar de"** são removidos do título.

### 3.2 Como a tarefa aparece no Google Agenda

- **Sem horário:** vira evento de **dia inteiro** na data de entrega.
- **Com horário:** vira evento com a duração escolhida.
- **Título:** só o nome da tarefa; a prioridade aparece pela cor do evento.
- **Descrição:** a prioridade e a frase original que você ditou.
- **Marca interna** (`extendedProperties.private.app = tarefas-voz`): faz a lista do app mostrar só as tarefas criadas por ele, e não as suas outras reuniões.

| Prioridade | Cor | Lembretes (com horário) | Lembretes (dia inteiro) |
|---|---|---|---|
| Alta | Tomate (vermelho) | notificação 1 dia antes + 1h antes + e-mail 1 dia antes | notificação 2 dias antes às 9h + véspera às 9h + e-mail na véspera às 9h |
| Média | Banana (amarelo) | notificação 1h antes | notificação na véspera às 9h |
| Baixa | Manjericão (verde) | notificação 15 min antes | notificação na véspera às 9h |

**Ao concluir uma tarefa:**

- O título ganha "✓ " na frente.
- A cor muda para Grafite (cinza).
- Os lembretes são removidos.

Desmarcar a tarefa desfaz tudo isso.

### 3.3 A interface

- **Microfone:** um botão redondo. Enquanto grava, ele fica vermelho e pulsa. Para sozinho depois de 2,5 s de silêncio, ou quando você toca de novo.
- **Campo de texto:** opção para digitar a tarefa em vez de falar.
- **Formulário de revisão** com estes campos:
  - Tarefa
  - Data
  - Horário
  - Duração
  - Prioridade
  - Resumo dos lembretes que serão criados
- **Lista "Minhas tarefas"**, dividida em:
  - Atrasadas
  - Hoje
  - Próximas
  - Concluídas (recolhida)
- **Em cada tarefa da lista:**
  - Círculo para marcar como concluída
  - Link para abrir o evento no Google Agenda
  - Botão de excluir
- **Tema:** claro e escuro automático.
- **No celular:** os campos de data e os botões ocupam a largura toda.

## 4. Estrutura de arquivos

```
Tarefas-Por-Voz/
├── index.html            # estrutura da página
├── styles.css            # visual (claro/escuro, responsivo)
├── app.js                # microfone, formulário de revisão, lista, login
├── parser.js             # entende a frase em português
├── calendar.js           # Google Agenda (criar/atualizar/excluir) + modo demonstração
├── dates.js              # utilitários de data
├── config.js             # ← cole aqui o GOOGLE_CLIENT_ID
├── manifest.webmanifest  # dados do app instalável (nome, cor, ícones)
├── sw.js                 # service worker: abre rápido e funciona sem internet
├── icons/                # favicon.svg, ícones 192/512, maskable, apple-touch-icon
├── tests.html            # 40 testes automáticos do parser
├── .gitignore            # arquivos que não vão para o GitHub
├── README.md             # guia rápido de uso e configuração
└── PROJETO.md            # este arquivo
```

## 5. Como rodar no computador (terminal do VS Code)

Abra o terminal do VS Code com Ctrl + ' e rode, dentro da pasta do projeto:

```bash
python -m http.server 8000 --bind 127.0.0.1
```

Depois abra no **Chrome ou Edge**:

- O app: http://localhost:8000
- Os testes do parser: http://localhost:8000/tests.html

O Firefox não tem reconhecimento de voz; nele, só dá para digitar a tarefa.

Para parar o servidor, use Ctrl + C. Se a porta 8000 já estiver ocupada (outro servidor esquecido aberto), feche os terminais antigos ou use outra porta, por exemplo `8001`. Se usar outra porta, adicione também `http://localhost:8001` nas origens autorizadas do Google.

## 6. Usar no celular (GitHub Pages)

O app é só um conjunto de arquivos estáticos, então o **GitHub Pages** hospeda de graça e com HTTPS. O HTTPS é obrigatório, porque o celular só libera o microfone e o login do Google em sites seguros.

- Repositório: https://github.com/GustavoStaevie/Tarefas-Por-Voz
- Endereço do app: https://gustavostaevie.github.io/Tarefas-Por-Voz/

1. No GitHub, vá em **Settings → Pages**:
   - Source: **Deploy from a branch**.
   - Branch: **main**, pasta **/ (root)**.
   - Clique em **Save**.
2. Em 1 a 2 minutos o app fica no ar.
3. Adicione `https://gustavostaevie.github.io` nas origens autorizadas do Google (seção 7, passo 4).
4. No celular, abra o endereço e instale o app:
   - **Android (Chrome):** menu ⋮ → **Adicionar à tela inicial**.
   - **iPhone (Safari):** Compartilhar → **Adicionar à Tela de Início**.

Para publicar uma atualização: `git add .`, depois `git commit -m "o que mudou"` e por fim `git push`.

**iPhone:** o reconhecimento de voz do Safari é mais limitado. Se o botão do microfone não funcionar, use o **microfone do teclado** no campo de texto; o app entende a frase do mesmo jeito.

## 7. Conectar ao Google Agenda (passo a passo)

1. Acesse https://console.cloud.google.com e crie um projeto (ex.: "Tarefas por Voz").
2. Em **APIs e serviços → Biblioteca**, procure **Google Calendar API** e clique em **Ativar**.
3. Em **Google Auth Platform** (ou "Tela de permissão OAuth"):
   - Tipo de usuário: **Externo**.
   - Preencha o nome do app e o seu e-mail de suporte.
   - Em **Público-alvo → Usuários de teste**, adicione o seu e-mail do Google.
4. Em **Clientes** (ou **Credenciais → Criar credenciais → ID do cliente OAuth**):
   - Tipo: **Aplicativo da Web**.
   - **Origens JavaScript autorizadas:**
     - `http://localhost:8000`
     - `https://gustavostaevie.github.io`
5. Copie o **ID do cliente** (termina em `.apps.googleusercontent.com`) e cole em `config.js`:
   ```js
   export const GOOGLE_CLIENT_ID = '1234567890-abc.apps.googleusercontent.com';
   ```
6. Recarregue a página e clique em **Entrar com Google**.
   - O Google vai mostrar o aviso "app não verificado". Clique em **Continuar**: o app é seu.

O ID do cliente não é secreto, porque ele fica visível no navegador de qualquer jeito. Mesmo assim, só os e-mails cadastrados como usuários de teste conseguem usar o app.

O login dura cerca de 1 hora. Depois disso, o app pede para entrar de novo, e basta um toque.

**Agenda separada (opcional):** crie uma agenda "Tarefas" no Google Agenda e cole o ID dela em `CALENDAR_ID` no `config.js`. Para achar o ID: Configurações da agenda → Integrar agenda.

## 8. O que foi testado

| Teste | Resultado |
|---|---|
| Parser: 40 frases reais (`tests.html`) | ✅ 40/40 passaram (sessão 3) |
| Digitar uma tarefa → formulário preenchido corretamente | ✅ |
| Salvar, listar e concluir tarefas | ✅ (modo demonstração, sessão 1) |
| Novo layout no computador (1200px) e no celular (375px), tema escuro | ✅ conferido por captura de tela (sessão 2) |
| Envio real ao Google Agenda | ⏳ **não testado**: falta o `GOOGLE_CLIENT_ID` |
| Microfone | ⏳ **não testado**: precisa de alguém falando no Chrome ou Edge |
| Instalação no celular (PWA) | ⏳ **não testado**: precisa estar publicado em HTTPS |

## 9. Próximos passos possíveis

- Publicar no GitHub Pages (seção 6) e configurar o `GOOGLE_CLIENT_ID` (seção 7).
- Ditar várias tarefas de uma vez ("… nova tarefa …").
- Editar uma tarefa já criada (data, prioridade).
- Tarefas recorrentes ("toda segunda às 8h").

---

## 10. Código completo

Abaixo está o conteúdo de cada arquivo de código do projeto, na versão atual. Os ícones PNG não aparecem aqui porque são imagens.

### `config.js`

```js
// vazio = modo demonstração (salva só no navegador)
export const GOOGLE_CLIENT_ID = '1089250912413-s05ud3t7r5e7iv4nt4dsdh9d99g6s57i.apps.googleusercontent.com';

export const CALENDAR_ID = 'primary';
```

### `index.html`

```html
<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Tarefas por Voz</title>
<meta name="description" content="Fale suas tarefas e salve no Google Agenda.">
<meta name="theme-color" content="#f6f7f9" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0b0d12" media="(prefers-color-scheme: dark)">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icons/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Tarefas">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="styles.css">
<script src="https://accounts.google.com/gsi/client" async defer></script>
<script type="module" src="app.js"></script>
</head>
<body>
<div class="app">
  <header class="topbar">
    <div class="brand">
      <span class="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 24 24"><rect x="2" y="9.5" width="2.5" height="5" rx="1.25"/><rect x="6.5" y="6" width="2.5" height="12" rx="1.25"/><rect x="11" y="3" width="2.5" height="18" rx="1.25"/><rect x="15.5" y="7" width="2.5" height="10" rx="1.25"/><rect x="20" y="10" width="2.5" height="4" rx="1.25"/></svg>
      </span>
      <div>
        <h1>Tarefas por Voz</h1>
        <p class="subtitle">Fale, confira e salve no Google Agenda</p>
      </div>
    </div>
    <div class="account">
      <span id="mode-badge" class="status"><span class="status-dot"></span><span id="mode-label"></span></span>
      <button id="auth-btn" class="btn btn-secondary btn-sm" type="button" hidden></button>
    </div>
  </header>

  <main>
    <div id="setup-banner" class="banner" hidden>
      <svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
      <p><strong>Modo demonstração:</strong> as tarefas ficam só neste aparelho.
      Para salvar no Google Agenda, preencha <code>GOOGLE_CLIENT_ID</code> em <code>config.js</code>.</p>
    </div>

    <section class="card capture" aria-labelledby="new-task-title">
      <h2 id="new-task-title" class="sr-only">Nova tarefa</h2>

      <div class="mic-area">
        <button id="mic-btn" class="mic" type="button" aria-pressed="false" aria-describedby="mic-status">
          <svg class="icon icon-mic" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><path d="M12 19v3"/></svg>
          <svg class="icon icon-stop" viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="7" width="10" height="10" rx="2"/></svg>
          <span class="sr-only" id="mic-sr">Gravar tarefa</span>
        </button>
        <p id="mic-label" class="mic-label">Toque para falar</p>
        <p id="mic-status" class="hint">Ex.: “Entregar o relatório amanhã às 15h, prioridade alta”</p>
        <p id="transcript" class="transcript" hidden></p>
      </div>

      <div class="divider"><span>ou digite</span></div>

      <form id="text-form" class="text-form">
        <input id="text-input" type="text" placeholder="Pagar a conta de luz dia 25, prioridade baixa" autocomplete="off" enterkeyhint="go" aria-label="Tarefa em texto">
        <button class="btn btn-primary btn-icon" type="submit" aria-label="Interpretar">
          <svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
        </button>
      </form>

      <form id="task-form" class="task-form" hidden>
        <p class="form-intro field-wide">Confira e ajuste se precisar</p>
        <label class="field field-title">
          <span>Tarefa</span>
          <input id="f-title" required>
        </label>
        <label class="field field-category">
          <span>Tipo</span>
          <select id="f-category">
            <option value="">Nenhum</option>
            <option value="trabalho">Trabalho</option>
            <option value="prova">Prova</option>
            <option value="projeto">Projeto</option>
            <option value="aula">Aula</option>
            <option value="tarefa">Tarefa</option>
            <option value="missao">Missão</option>
          </select>
        </label>
        <label class="field field-date" id="date-field">
          <span id="date-label">Data</span>
          <input id="f-date" type="date" required>
          <small class="review-note">Não ouvi a data — coloquei hoje.</small>
        </label>
        <label class="field">
          <span>Horário <em>opcional</em></span>
          <input id="f-time" type="time">
        </label>
        <label class="field">
          <span>Duração</span>
          <select id="f-duration">
            <option value="15">15 min</option>
            <option value="30" selected>30 min</option>
            <option value="45">45 min</option>
            <option value="60">1 hora</option>
            <option value="90">1h30</option>
            <option value="120">2 horas</option>
            <option value="180">3 horas</option>
          </select>
        </label>
        <fieldset class="field field-wide" id="priority-field">
          <legend>Prioridade</legend>
          <div class="segmented">
            <label><input type="radio" name="priority" value="baixa"><span><i class="dot baixa"></i>Baixa</span></label>
            <label><input type="radio" name="priority" value="media"><span><i class="dot media"></i>Média</span></label>
            <label><input type="radio" name="priority" value="alta"><span><i class="dot alta"></i>Alta</span></label>
          </div>
        </fieldset>
        <p class="reminder field-wide">
          <svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
          <span id="reminder-hint"></span>
        </p>
        <div class="actions field-wide">
          <button type="button" id="discard-btn" class="btn btn-ghost">Descartar</button>
          <button id="save-btn" class="btn btn-primary" type="submit">Adicionar à agenda</button>
        </div>
      </form>
    </section>

    <section class="card" aria-labelledby="list-title">
      <div class="list-header">
        <h2 id="list-title">Minhas tarefas</h2>
        <button id="refresh-btn" class="btn btn-ghost btn-icon btn-sm" type="button" aria-label="Atualizar" title="Atualizar">
          <svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a9 9 0 1 1-2.64-6.36L21 8"/><path d="M21 3v5h-5"/></svg>
        </button>
      </div>
      <div id="task-list" class="task-list"></div>
    </section>
  </main>
</div>

<template id="task-item">
  <li class="task">
    <input type="checkbox" class="task-done" aria-label="Marcar como concluída">
    <div class="task-body">
      <span class="task-title"></span>
      <span class="task-meta"><i class="dot"></i><span class="task-when"></span></span>
    </div>
    <a class="task-link icon-btn" target="_blank" rel="noopener" title="Abrir no Google Agenda" aria-label="Abrir no Google Agenda">
      <svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>
    </a>
    <button class="task-delete icon-btn" type="button" title="Excluir" aria-label="Excluir tarefa">
      <svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
    </button>
  </li>
</template>

<div id="toast" class="toast" role="status" aria-live="polite"></div>
</body>
</html>
```

### `styles.css`

```css
:root {
  --bg: #f6f7f9;
  --surface: #ffffff;
  --surface-2: #f1f3f6;
  --text: #111827;
  --muted: #6b7280;
  --border: #e5e7eb;
  --accent: #2563eb;
  --accent-hover: #1d4ed8;
  --accent-soft: #eaf1ff;
  --on-accent: #ffffff;
  --danger: #dc2626;
  --danger-soft: #fdecec;
  --warn: #b45309;
  --warn-soft: #fff6e5;
  --warn-border: #f5d48a;
  --alta: #dc2626;
  --media: #e5a50a;
  --baixa: #16a34a;
  --done: #9ca3af;
  --radius: 16px;
  --radius-sm: 10px;
  --shadow: 0 1px 2px rgba(16, 24, 40, .04), 0 8px 24px rgba(16, 24, 40, .06);
  color-scheme: light;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #0b0d12;
    --surface: #151922;
    --surface-2: #1c212c;
    --text: #e8eaef;
    --muted: #949bab;
    --border: #262c38;
    --accent: #3b82f6;
    --accent-hover: #60a5fa;
    --accent-soft: #1a2640;
    --danger: #f87171;
    --danger-soft: #3a1d1f;
    --warn: #fbbf24;
    --warn-soft: #2b2414;
    --warn-border: #5c4a1c;
    --shadow: 0 1px 2px rgba(0, 0, 0, .3);
    color-scheme: dark;
  }
}

* { box-sizing: border-box; }
[hidden] { display: none !important; }

html { -webkit-text-size-adjust: 100%; }

body {
  margin: 0;
  min-height: 100vh;
  min-height: 100dvh;
  background: var(--bg);
  color: var(--text);
  font: 15px/1.5 Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
  -webkit-tap-highlight-color: transparent;
}

h1, h2, h3, p { margin: 0; }
code { font-size: .85em; background: rgba(127, 127, 127, .14); padding: 1px 6px; border-radius: 6px; }

.sr-only {
  position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0;
}

.icon {
  width: 20px; height: 20px; flex: none;
  fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round;
}

.app {
  width: min(100% - 32px, 620px);
  margin-inline: auto;
  padding: max(24px, env(safe-area-inset-top)) 0 max(40px, env(safe-area-inset-bottom));
  display: grid;
  gap: 20px;
}

main { display: grid; gap: 16px; }

.topbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.brand { display: flex; align-items: center; gap: 12px; min-width: 0; }
.brand-mark {
  width: 40px; height: 40px; border-radius: 12px; flex: none;
  display: grid; place-items: center; background: var(--accent); color: var(--on-accent);
}
.brand-mark svg { width: 22px; height: 22px; fill: currentColor; }
h1 { font-size: 1.1rem; font-weight: 700; letter-spacing: -.01em; white-space: nowrap; }
.subtitle { color: var(--muted); font-size: .85rem; }

.account { display: flex; align-items: center; gap: 8px; flex: none; }
.status {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: .78rem; font-weight: 500; color: var(--muted); white-space: nowrap;
  padding: 4px 10px; border-radius: 999px; background: var(--surface); border: 1px solid var(--border);
}
.status-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--media); }
.status.connected .status-dot { background: var(--baixa); }

.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 24px;
  box-shadow: var(--shadow);
}

.banner {
  display: flex; gap: 10px; align-items: flex-start;
  background: var(--warn-soft); border: 1px solid var(--warn-border); color: var(--text);
  border-radius: var(--radius-sm); padding: 12px 14px; font-size: .85rem;
}
.banner .icon { color: var(--warn); width: 18px; height: 18px; margin-top: 1px; }

.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  font: inherit; font-weight: 600; font-size: .9rem;
  min-height: 44px; padding: 0 18px; border-radius: var(--radius-sm);
  border: 1px solid transparent; cursor: pointer; white-space: nowrap;
  transition: background .15s, border-color .15s, color .15s;
}
.btn:disabled { opacity: .55; cursor: progress; }
.btn-sm { min-height: 36px; padding: 0 12px; font-size: .82rem; }
.btn-icon { padding: 0; width: 44px; }
.btn-icon.btn-sm { width: 36px; }
.btn-primary { background: var(--accent); color: var(--on-accent); }
.btn-primary:hover:not(:disabled) { background: var(--accent-hover); }
.btn-secondary { background: var(--accent-soft); color: var(--accent); }
.btn-ghost { background: transparent; color: var(--muted); border-color: var(--border); }
.btn-ghost:hover:not(:disabled) { color: var(--text); background: var(--surface-2); }

input, select {
  font: inherit; font-size: 16px; /* menos de 16px o iPhone dá zoom */
  color: var(--text); background: var(--surface);
  border: 1px solid var(--border); border-radius: var(--radius-sm);
  min-height: 44px; padding: 0 12px; width: 100%;
  transition: border-color .15s, box-shadow .15s;
}
input:focus, select:focus {
  outline: none; border-color: var(--accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 22%, transparent);
}
input:disabled, select:disabled { opacity: .45; }
input[type="date"], input[type="time"] { -webkit-appearance: none; appearance: none; }

.capture { display: grid; gap: 20px; }

.mic-area { display: grid; justify-items: center; text-align: center; gap: 6px; padding-top: 4px; }

.mic {
  position: relative; width: 88px; height: 88px; border-radius: 50%;
  display: grid; place-items: center; margin-bottom: 8px;
  border: none; cursor: pointer; background: var(--accent); color: var(--on-accent);
  box-shadow: 0 8px 24px color-mix(in srgb, var(--accent) 35%, transparent);
  transition: transform .15s, background .15s;
}
.mic:hover:not(:disabled) { transform: scale(1.04); }
.mic:active:not(:disabled) { transform: scale(.97); }
.mic:focus-visible { outline: 3px solid color-mix(in srgb, var(--accent) 45%, transparent); outline-offset: 4px; }
.mic .icon { width: 34px; height: 34px; }
.mic .icon-stop { display: none; fill: currentColor; stroke: none; }
.mic:disabled { background: var(--surface-2); color: var(--muted); box-shadow: none; cursor: not-allowed; }

.mic.listening { background: var(--danger); box-shadow: none; }
.mic.listening .icon-mic { display: none; }
.mic.listening .icon-stop { display: block; }
.mic.listening::before, .mic.listening::after {
  content: ""; position: absolute; inset: 0; border-radius: 50%;
  border: 2px solid var(--danger); animation: ripple 1.6s ease-out infinite;
}
.mic.listening::after { animation-delay: .8s; }

@keyframes ripple {
  from { transform: scale(1); opacity: .6; }
  to { transform: scale(1.7); opacity: 0; }
}

.mic-label { font-weight: 600; }
.hint { color: var(--muted); font-size: .85rem; max-width: 48ch; text-wrap: balance; }
.transcript {
  margin-top: 8px; padding: 10px 14px; border-radius: var(--radius-sm);
  background: var(--surface-2); font-size: .92rem; max-width: 100%;
}

.divider {
  display: flex; align-items: center; gap: 12px;
  color: var(--muted); font-size: .75rem; text-transform: uppercase; letter-spacing: .06em;
}
.divider::before, .divider::after { content: ""; flex: 1; height: 1px; background: var(--border); }

.text-form { display: flex; gap: 8px; }
.text-form input { flex: 1; min-width: 0; }

.task-form {
  display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px;
  border-top: 1px solid var(--border); padding-top: 20px;
}
.form-intro { font-weight: 600; }
.field { display: grid; gap: 6px; align-content: start; border: none; margin: 0; padding: 0; min-width: 0; }
.field > span, .field legend { font-size: .8rem; color: var(--muted); font-weight: 500; padding: 0; }
.field legend { margin-bottom: 6px; }
.field em { font-style: normal; opacity: .7; }
.field-wide { grid-column: 1 / -1; }
.field-title { grid-column: span 2; }
.review-note { display: none; color: var(--warn); font-size: .78rem; }
.needs-review input { border-color: var(--warn-border); background: var(--warn-soft); }
.needs-review .review-note { display: block; }

.segmented { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.segmented label { position: relative; }
.segmented input { position: absolute; inset: 0; opacity: 0; cursor: pointer; margin: 0; }
.segmented span {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  min-height: 44px; border-radius: var(--radius-sm); border: 1px solid var(--border);
  font-weight: 500; font-size: .9rem; transition: border-color .15s, background .15s;
}
.segmented input:checked + span { border-color: var(--accent); background: var(--accent-soft); color: var(--text); font-weight: 600; }
.segmented input:focus-visible + span { box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 22%, transparent); }

.dot { display: inline-block; width: 9px; height: 9px; border-radius: 50%; flex: none; background: var(--muted); }
.dot.alta { background: var(--alta); }
.dot.media { background: var(--media); }
.dot.baixa { background: var(--baixa); }

.reminder { display: flex; gap: 8px; align-items: flex-start; color: var(--muted); font-size: .82rem; }
.reminder .icon { width: 16px; height: 16px; margin-top: 2px; }

.actions { display: flex; justify-content: flex-end; gap: 8px; }

.list-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
h2 { font-size: 1rem; font-weight: 600; }

.task-list h3 {
  font-size: .72rem; font-weight: 600; text-transform: uppercase; letter-spacing: .06em;
  color: var(--muted); margin: 18px 0 4px;
}
.task-list h3.overdue { color: var(--danger); }
.task-list ul { list-style: none; margin: 0; padding: 0; }
.task-list details summary { cursor: pointer; list-style: none; }
.task-list details summary::-webkit-details-marker { display: none; }
.task-list details summary h3::before { content: "▸ "; }
.task-list details[open] summary h3::before { content: "▾ "; }
.task-list details summary h3 { display: inline-block; }
.empty { color: var(--muted); text-align: center; padding: 28px 0 12px; font-size: .9rem; }

.task {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 0; border-bottom: 1px solid var(--border);
}
.task:last-child { border-bottom: none; }

.task-done {
  -webkit-appearance: none; appearance: none; flex: none; cursor: pointer;
  width: 22px; height: 22px; min-height: 0; padding: 0; margin: 0;
  border: 2px solid var(--border); border-radius: 50%; display: grid; place-items: center;
  background: var(--surface);
}
.task-done:hover { border-color: var(--accent); }
.task-done:checked { background: var(--accent); border-color: var(--accent); }
.task-done:checked::after {
  content: ""; width: 5px; height: 10px; margin-top: -2px;
  border: solid var(--on-accent); border-width: 0 2px 2px 0; transform: rotate(45deg);
}

.task-body { flex: 1; min-width: 0; display: grid; gap: 2px; }
.task-title { font-weight: 500; overflow-wrap: anywhere; }
.task-meta { display: flex; align-items: center; gap: 6px; font-size: .8rem; color: var(--muted); }
.task-meta .dot { width: 7px; height: 7px; }
.task.done .task-title { text-decoration: line-through; color: var(--done); font-weight: 400; }
.task.done .dot { background: var(--done); }

.icon-btn {
  flex: none; width: 36px; height: 36px; display: grid; place-items: center;
  border-radius: 8px; border: none; background: transparent; color: var(--muted); cursor: pointer;
}
.icon-btn .icon { width: 18px; height: 18px; }
.icon-btn:hover { background: var(--surface-2); color: var(--text); }
.task-delete:hover { background: var(--danger-soft); color: var(--danger); }

.toast {
  position: fixed; left: 50%; bottom: max(24px, env(safe-area-inset-bottom));
  transform: translate(-50%, 16px); z-index: 10;
  background: var(--text); color: var(--bg); font-size: .9rem; font-weight: 500;
  padding: 12px 18px; border-radius: var(--radius-sm); box-shadow: 0 8px 24px rgba(0, 0, 0, .2);
  opacity: 0; pointer-events: none; transition: opacity .2s, transform .2s;
  width: max-content; max-width: calc(100% - 32px); text-align: center;
}
.toast.show { opacity: 1; transform: translate(-50%, 0); }
.toast.error { background: var(--danger); color: #fff; }

@media (max-width: 560px) {
  .app { width: min(100% - 24px, 620px); gap: 16px; padding-top: max(16px, env(safe-area-inset-top)); }
  .card { padding: 18px; border-radius: 14px; }
  .subtitle { display: none; }
  .brand-mark { width: 36px; height: 36px; border-radius: 10px; }
  .task-form { grid-template-columns: 1fr 1fr; }
  .field-date, .field-title, .field-category { grid-column: 1 / -1; }
  .actions { flex-direction: column-reverse; }
  .actions .btn { width: 100%; }
  .mic { width: 96px; height: 96px; }
}

@media (max-width: 480px) {
  .status:has(+ .btn:not([hidden])) { display: none; }
}

@media (max-width: 360px) {
  .status { display: none; }
}

@media (hover: hover) and (min-width: 561px) {
  .task .icon-btn { opacity: 0; transition: opacity .15s; }
  .task:hover .icon-btn, .task .icon-btn:focus-visible { opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition: none !important; }
}
```

### `app.js`

```js
import { parseTask, CATEGORIES } from './parser.js';
import { GoogleBackend, DemoBackend, AuthError, PRIORITIES, DEFAULT_DURATION, describeReminders } from './calendar.js';
import { toISODate, addDays, fromISODate } from './dates.js';
import { GOOGLE_CLIENT_ID, CALENDAR_ID } from './config.js';

const $ = (sel) => document.querySelector(sel);

const backend = GOOGLE_CLIENT_ID.trim()
  ? new GoogleBackend(GOOGLE_CLIENT_ID.trim(), CALENDAR_ID)
  : new DemoBackend();

let tasks = [];
let draftSource = null;
let draftDeadline = false;

let toastTimer;
function toast(message, isError = false) {
  const el = $('#toast');
  el.textContent = message;
  el.classList.toggle('error', isError);
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), isError ? 6000 : 3000);
}

function handleError(err) {
  console.error(err);
  if (err instanceof AuthError) updateAuthUI();
  toast(err.message || 'Algo deu errado.', true);
}

// tem que rodar antes de qualquer await no clique, senão o popup do Google é bloqueado
async function ensureSignedIn() {
  if (backend.signedIn) return;
  await backend.signIn();
  updateAuthUI();
}

const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const SPEECH_ERRORS = {
  'not-allowed': 'Permissão do microfone negada. Libere o microfone nas configurações do navegador.',
  'service-not-allowed': 'O navegador bloqueou o reconhecimento de voz.',
  'no-speech': 'Não ouvi nada. Tente de novo, falando perto do microfone.',
  'audio-capture': 'Nenhum microfone encontrado.',
  network: 'Sem conexão com o serviço de reconhecimento de voz.',
};
const SILENCE_MS = 2500;

function setupSpeech() {
  const micBtn = $('#mic-btn');
  if (!Recognition) {
    micBtn.disabled = true;
    $('#mic-label').textContent = 'Voz indisponível';
    $('#mic-status').textContent = 'Este navegador não reconhece voz. Use o Chrome ou o Edge — ou digite a tarefa abaixo.';
    return;
  }

  const recognition = new Recognition();
  recognition.lang = 'pt-BR';
  recognition.interimResults = true;
  recognition.continuous = true;

  let listening = false;
  let finalText = '';
  let silenceTimer;
  const restartSilenceTimer = () => {
    clearTimeout(silenceTimer);
    silenceTimer = setTimeout(() => recognition.stop(), SILENCE_MS);
  };

  const setListening = (on) => {
    listening = on;
    micBtn.classList.toggle('listening', on);
    micBtn.setAttribute('aria-pressed', String(on));
    $('#mic-label').textContent = on ? 'Ouvindo… toque para parar' : 'Toque para falar';
    $('#mic-sr').textContent = on ? 'Parar gravação' : 'Gravar tarefa';
  };

  recognition.onstart = () => {
    finalText = '';
    setListening(true);
    $('#mic-status').hidden = false;
    $('#mic-status').textContent = 'Fale a tarefa, o dia, o horário e a prioridade.';
    $('#transcript').hidden = true;
    restartSilenceTimer();
  };

  recognition.onresult = (e) => {
    let interim = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const r = e.results[i];
      if (r.isFinal) finalText += r[0].transcript + ' ';
      else interim += r[0].transcript;
    }
    const el = $('#transcript');
    el.hidden = false;
    el.textContent = `“${(finalText + interim).trim()}”`;
    $('#mic-status').hidden = true;
    restartSilenceTimer();
  };

  recognition.onerror = (e) => {
    $('#mic-status').hidden = false;
    $('#mic-status').textContent = SPEECH_ERRORS[e.error] ?? `Erro no reconhecimento de voz (${e.error}).`;
  };

  recognition.onend = () => {
    clearTimeout(silenceTimer);
    setListening(false);
    const spoken = finalText.trim();
    if (spoken) {
      $('#text-input').value = spoken;
      $('#mic-label').textContent = 'Pronto! Confira abaixo';
      showDraft(parseTask(spoken));
    }
  };

  micBtn.addEventListener('click', () => {
    if (listening) recognition.stop();
    else recognition.start();
  });
}

function selectedPriority() {
  return document.querySelector('input[name="priority"]:checked')?.value ?? 'media';
}

function updateFormHints() {
  const timed = !!$('#f-time').value;
  $('#f-duration').disabled = !timed;
  $('#reminder-hint').textContent = `Lembretes: ${describeReminders(selectedPriority(), timed)}`
    + (timed ? '' : ' (sem horário = evento de dia inteiro)');
}

function showDraft(parsed) {
  draftSource = parsed.source;
  draftDeadline = parsed.deadline;
  $('#f-title').value = parsed.title;
  $('#f-category').value = parsed.category ?? '';
  $('#date-label').textContent = parsed.deadline ? 'Prazo de entrega' : 'Data';
  $('#f-date').value = parsed.date;
  $('#f-time').value = parsed.time ?? '';
  $('#f-duration').value = String(parsed.durationMin ?? DEFAULT_DURATION);
  if (!$('#f-duration').value) {
    $('#f-duration').add(new Option(`${parsed.durationMin} min`, parsed.durationMin, true, true));
  }
  document.querySelector(`input[name="priority"][value="${parsed.priority}"]`).checked = true;
  $('#date-field').classList.toggle('needs-review', !parsed.dateSpecified);
  $('#task-form').hidden = false;
  updateFormHints();
  if (matchMedia('(pointer: coarse)').matches) $('#task-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
  else $('#f-title').focus();
}

function resetDraft() {
  $('#task-form').reset();
  $('#task-form').hidden = true;
  $('#text-input').value = '';
  $('#transcript').hidden = true;
  $('#mic-status').hidden = false;
  $('#mic-label').textContent = 'Toque para falar';
  $('#date-field').classList.remove('needs-review');
  $('#date-label').textContent = 'Data';
  draftSource = null;
  draftDeadline = false;
}

function readDraft() {
  const time = $('#f-time').value || null;
  return {
    title: $('#f-title').value.trim(),
    category: $('#f-category').value || null,
    deadline: draftDeadline,
    date: $('#f-date').value,
    time,
    durationMin: time ? Number($('#f-duration').value) : null,
    priority: selectedPriority(),
    done: false,
    source: draftSource,
  };
}

function setupForms() {
  $('#text-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const text = $('#text-input').value.trim();
    if (text) showDraft(parseTask(text));
  });

  $('#f-time').addEventListener('input', updateFormHints);
  $('#f-date').addEventListener('input', () => $('#date-field').classList.remove('needs-review'));
  document.querySelectorAll('input[name="priority"]').forEach((r) => r.addEventListener('change', updateFormHints));
  $('#discard-btn').addEventListener('click', resetDraft);

  $('#task-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const task = readDraft();
    if (!task.title) return toast('Dê um nome para a tarefa.', true);
    const btn = $('#save-btn');
    btn.disabled = true;
    try {
      await ensureSignedIn();
      await backend.create(task);
      toast(backend.needsSignIn ? 'Tarefa adicionada ao Google Agenda' : 'Tarefa salva (modo demonstração)');
      resetDraft();
      await refresh();
    } catch (err) {
      handleError(err);
    } finally {
      btn.disabled = false;
    }
  });
}

const weekdayFmt = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' });

function describeWhen(task) {
  const today = toISODate(new Date());
  const tomorrow = toISODate(addDays(new Date(), 1));
  const day = task.date === today ? 'Hoje'
    : task.date === tomorrow ? 'Amanhã'
    : weekdayFmt.format(fromISODate(task.date)).replace(/\./g, '');
  const time = task.time ? ` às ${task.time}` : ' · dia inteiro';
  const prefix = task.deadline ? 'Prazo: ' : '';
  const category = task.category ? `${CATEGORIES[task.category]} · ` : '';
  return `${category}${prefix}${day}${time} · ${PRIORITIES[task.priority].label}`;
}

function compareTasks(a, b) {
  return a.date.localeCompare(b.date)
    || (a.time ?? '99:99').localeCompare(b.time ?? '99:99')
    || PRIORITIES[a.priority].rank - PRIORITIES[b.priority].rank;
}

function renderItem(task) {
  const li = $('#task-item').content.firstElementChild.cloneNode(true);
  li.classList.toggle('done', task.done);
  li.querySelector('.dot').classList.add(task.priority);
  li.querySelector('.task-title').textContent = task.title;
  li.querySelector('.task-when').textContent = describeWhen(task);

  const checkbox = li.querySelector('.task-done');
  checkbox.checked = task.done;
  checkbox.addEventListener('change', async () => {
    checkbox.disabled = true;
    try {
      await ensureSignedIn();
      await backend.update({ ...task, done: checkbox.checked });
      toast(checkbox.checked ? 'Tarefa concluída' : 'Tarefa reaberta');
      await refresh();
    } catch (err) {
      checkbox.checked = !checkbox.checked;
      checkbox.disabled = false;
      handleError(err);
    }
  });

  const link = li.querySelector('.task-link');
  if (task.link) link.href = task.link;
  else link.remove();

  li.querySelector('.task-delete').addEventListener('click', async () => {
    if (!confirm(`Excluir "${task.title}"${backend.needsSignIn ? ' do Google Agenda' : ''}?`)) return;
    try {
      await ensureSignedIn();
      await backend.remove(task.id);
      toast('Tarefa excluída');
      await refresh();
    } catch (err) {
      handleError(err);
    }
  });
  return li;
}

function renderGroup(container, title, items, { overdue = false, collapsed = false } = {}) {
  if (!items.length) return;
  const heading = document.createElement('h3');
  heading.textContent = `${title} (${items.length})`;
  heading.classList.toggle('overdue', overdue);
  const ul = document.createElement('ul');
  items.forEach((t) => ul.append(renderItem(t)));
  if (collapsed) {
    const details = document.createElement('details');
    const summary = document.createElement('summary');
    summary.append(heading);
    details.append(summary, ul);
    container.append(details);
  } else {
    container.append(heading, ul);
  }
}

function renderList() {
  const container = $('#task-list');
  container.replaceChildren();

  if (!backend.signedIn) {
    container.innerHTML = '<p class="empty">Entre com sua conta Google para ver suas tarefas.</p>';
    return;
  }
  if (!tasks.length) {
    container.innerHTML = '<p class="empty">Nenhuma tarefa ainda. Toque no microfone e fale a primeira.</p>';
    return;
  }

  const today = toISODate(new Date());
  const sorted = [...tasks].sort(compareTasks);
  const open = sorted.filter((t) => !t.done);
  renderGroup(container, 'Atrasadas', open.filter((t) => t.date < today), { overdue: true });
  renderGroup(container, 'Hoje', open.filter((t) => t.date === today));
  renderGroup(container, 'Próximas', open.filter((t) => t.date > today));
  renderGroup(container, 'Concluídas', sorted.filter((t) => t.done).reverse(), { collapsed: true });
}

async function refresh() {
  if (backend.signedIn) {
    const btn = $('#refresh-btn');
    btn.disabled = true;
    try {
      tasks = await backend.list();
    } catch (err) {
      handleError(err);
    } finally {
      btn.disabled = false;
    }
  } else {
    tasks = [];
  }
  renderList();
}

function updateAuthUI() {
  const btn = $('#auth-btn');
  const connected = backend.signedIn && backend.needsSignIn;
  $('#mode-badge').classList.toggle('connected', connected);
  $('#mode-label').textContent = connected ? 'Conectado' : backend.needsSignIn ? 'Desconectado' : 'Demonstração';
  btn.hidden = !backend.needsSignIn;
  btn.textContent = backend.signedIn ? 'Sair' : 'Entrar com Google';
  $('#refresh-btn').hidden = !backend.signedIn;
}

function setupAuth() {
  $('#setup-banner').hidden = backend.needsSignIn;
  $('#auth-btn').addEventListener('click', async () => {
    try {
      if (backend.signedIn) {
        backend.signOut();
        updateAuthUI();
        renderList();
      } else {
        await backend.signIn();
        updateAuthUI();
        await refresh();
      }
    } catch (err) {
      handleError(err);
    }
  });
  $('#refresh-btn').addEventListener('click', refresh);
}

setupSpeech();
setupForms();
setupAuth();
updateAuthUI();
renderList();

backend.init()
  .then(() => { updateAuthUI(); return refresh(); })
  .catch(handleError);

if ('serviceWorker' in navigator && window.isSecureContext) {
  navigator.serviceWorker.register('./sw.js').catch((err) => console.warn('Service worker não registrado:', err));
}
```

### `parser.js`

```js
// fold() mantém o mesmo tamanho do texto original, então os índices dos
// matches servem para cortar o título direto do texto original.

import { startOfDay, addDays, makeDate, toISODate, formatTime } from './dates.js';

const UNITS = 'uma|um|duas|dois|tres|quatro|cinco|seis|sete|oito|nove';
const TEENS = 'dezesseis|dezessete|dezoito|dezenove|dez|onze|doze|treze|catorze|quatorze|quinze';
const TENS = 'vinte|trinta|quarenta|cinquenta';
const NUM = `(?:\\d{1,2}|(?:${TENS})(?:\\s+e\\s+(?:${UNITS}))?|${TEENS}|primeiro|${UNITS})`;

const NUM_VALUES = {
  um: 1, uma: 1, primeiro: 1, dois: 2, duas: 2, tres: 3, quatro: 4, cinco: 5,
  seis: 6, sete: 7, oito: 8, nove: 9, dez: 10, onze: 11, doze: 12, treze: 13,
  catorze: 14, quatorze: 14, quinze: 15, dezesseis: 16, dezessete: 17,
  dezoito: 18, dezenove: 19, vinte: 20, trinta: 30, quarenta: 40, cinquenta: 50,
};

function toNumber(s) {
  if (/^\d+$/.test(s)) return parseInt(s, 10);
  return s.split(/\s+e\s+/).reduce((sum, w) => sum + (NUM_VALUES[w.trim()] ?? NaN), 0);
}

const WEEKDAYS = { domingo: 0, segunda: 1, terca: 2, quarta: 3, quinta: 4, sexta: 5, sabado: 6 };
const MONTHS = {
  janeiro: 0, fevereiro: 1, marco: 2, abril: 3, maio: 4, junho: 5, julho: 6,
  agosto: 7, setembro: 8, outubro: 9, novembro: 10, dezembro: 11,
};
const MONTH_RE = Object.keys(MONTHS).join('|');
const WORKDAY_RE = 'segunda|terca|quarta|quinta|sexta';

const PRE = '(?:\\b(?:para|pra|ate|no|na|nesta|nessa|neste|nesse|em|o|a|de)\\s+){0,2}';
const NEXT_WEEK = '(?:\\s+(?:que\\s+vem|da\\s+semana\\s+que\\s+vem|da\\s+proxima\\s+semana))?';
const PERIOD = '(?:\\s+(?:da|de|a|na|pela)\\s+(manha|tarde|noite|madrugada))?';
const MINUTES = `(?:\\s+e\\s+(meia|${NUM})(?:\\s+minutos?)?)?`;

// frases que vêm logo antes da data: "tenho que entregar até", "o prazo é", "tô sendo cobrado pra"
const LEAD = '\\b(?:' + [
  '(?:(?:eu|a\\s+gente|nos)\\s+)?(?:tenho|tem|temos|preciso|precisa|precisamos|devo|deve|vou\\s+ter|vou\\s+precisar)\\s+(?:que\\s+|de\\s+)?(?:entregar|terminar|fazer|concluir|finalizar|mandar|enviar|apresentar|resolver|estudar)(?:\\s+(?:isso|isto|ele|ela|eles|elas|tudo))?',
  '(?:(?:eu\\s+)?(?:tenho|temos|tem|com)\\s+)?(?:o\\s+|meu\\s+|nosso\\s+)?prazo(?:\\s+(?:final|maximo|de\\s+entrega))?(?:\\s+(?:e|eh|vai\\s+ser|sera|termina|acaba|vence))?',
  '(?:(?:eu|a\\s+gente|nos)\\s+)?(?:estou|to|tou|estamos|fui|fomos)\\s+(?:sendo\\s+)?cobrad[oa]s?(?:\\s+(?:para|pra|por))?',
  '(?:(?:a|o)\\s+)?(?:data\\s+(?:limite|final|de\\s+entrega)|deadline|vencimento)(?:\\s+(?:e|eh|vai\\s+ser|sera))?',
  '(?:que\\s+)?(?:vence|vencendo|expira|termina|acaba)',
  '(?:(?:pra|para|a\\s+ser|tem\\s+que\\s+ser|precisa\\s+ser)\\s+)?(?:entregar|entregue|apresentad[oa]|apresentar|terminad[oa])',
  '(?:a\\s+)?entrega\\s+(?:e|eh|sera|vai\\s+ser|fica)',
  '(?:tem|precisa|deve)\\s+(?:que\\s+|de\\s+)?(?:estar|ficar)\\s+pront[oa]s?',
  '(?:que\\s+)?(?:vai\\s+ser|sera|cai|acontece|(?:esta|foi)\\s+marcad[oa])',
  'que\\s+(?:e|eh)',
].join('|') + ')\\s+';
const L = `(?:${LEAD})?`;

const DEADLINE_HINT = /prazo|entreg|cobrad|venc|limite|deadline|pront[oa]|termin|conclu|finaliz|expira|acaba|\bate\b/;

const PRIORITY_WORDS = {
  alta: 'alta', alto: 'alta', maxima: 'alta', maximo: 'alta', urgente: 'alta', total: 'alta',
  media: 'media', medio: 'media', normal: 'media', moderada: 'media', moderado: 'media',
  baixa: 'baixa', baixo: 'baixa', minima: 'baixa', minimo: 'baixa',
};

export const CATEGORIES = {
  trabalho: 'Trabalho',
  prova: 'Prova',
  projeto: 'Projeto',
  aula: 'Aula',
  tarefa: 'Tarefa',
  missao: 'Missão',
};

const CATEGORY_WORDS = {
  trabalho: ['trabalho', 'trabalhinho', 'seminario', 'apresentacao', 'relatorio', 'artigo', 'redacao', 'resenha', 'resumo', 'monografia', 'tcc', 'pesquisa'],
  prova: ['prova', 'provinha', 'avaliacao', 'exame', 'teste', 'simulado', 'recuperacao', 'vestibular'],
  projeto: ['projeto', 'prototipo'],
  aula: ['aula', 'aulas', 'palestra', 'curso', 'workshop', 'oficina', 'treinamento', 'monitoria', 'reforco'],
  tarefa: ['tarefa', 'tarefas', 'lista de exercicios', 'exercicios', 'exercicio', 'atividade', 'atividades', 'licao de casa', 'licao', 'dever de casa', 'dever', 'afazer'],
  missao: ['missao', 'missoes', 'desafio', 'meta', 'objetivo'],
};

const KEYWORD_TO_CATEGORY = Object.fromEntries(
  Object.entries(CATEGORY_WORDS).flatMap(([cat, words]) => words.map((w) => [w, cat])),
);
const KEYWORD_RE = new RegExp(
  `\\b(${Object.keys(KEYWORD_TO_CATEGORY).sort((a, b) => b.length - a.length).map((w) => w.replace(/ /g, '\\s+')).join('|')})\\b`,
);

// o que pode vir antes da palavra-chave sem fazer parte do título ("tenho um trabalho de...")
const KEYWORD_PREAMBLE = new RegExp('^(?:(?:eu|a\\s+gente|nos)\\s+)?(?:(?:' + [
  'tenho|tem|temos|terei|teremos|vou\\s+ter|vai\\s+ter|vamos\\s+ter|ha|existe',
  'marcaram|marquei|passaram|passou|(?:o|a)\\s+(?:professor|professora|chefe|gerente)\\s+(?:passou|pediu|marcou)',
  '(?:estou|to|tou|estamos)\\s+sendo\\s+cobrad[oa]s?\\s+(?:pelo|pela|pelos|pelas|por|para|pra)',
  '(?:tenho|preciso|temos|precisamos|vou|devo)\\s+(?:que\\s+|de\\s+)?(?:fazer|entregar|terminar|concluir|finalizar|apresentar|mandar|enviar)',
  'lembrar\\s+d[aeo]s?|anotar?|anote|adicionar?|criar?|agendar?',
].join('|') + ')\\s+)?(?:(?:um|uma|o|a|os|as|meu|minha|meus|minhas|nosso|nossa|mais\\s+um|mais\\s+uma|outro|outra|pelo|pela|pelos|pelas)\\s+)?$');

function explicitDate(now, day, month, yearText) {
  if (month < 0 || month > 11) return null;
  if (yearText) {
    const year = yearText.length === 2 ? 2000 + Number(yearText) : Number(yearText);
    return makeDate(year, month, day);
  }
  const today = startOfDay(now);
  const thisYear = makeDate(now.getFullYear(), month, day);
  if (thisYear && thisYear >= today) return thisYear;
  return makeDate(now.getFullYear() + 1, month, day);
}

function dayOfMonth(now, day) {
  const today = startOfDay(now);
  for (let i = 0; i < 12; i++) {
    const month = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const d = makeDate(month.getFullYear(), month.getMonth(), day);
    if (d && d >= today) return d;
  }
  return null;
}

function nextWeekday(now, name) {
  const diff = (WEEKDAYS[name] - now.getDay() + 7) % 7 || 7;
  return addDays(now, diff);
}

function clock(h, min, period, guessAfternoon) {
  if (period === 'tarde' || period === 'noite') {
    if (h === 12 && period === 'noite') h = 0;
    else if (h < 12) h += 12;
  } else if (!period && guessAfternoon && h >= 1 && h <= 5) {
    // "às três" falado normalmente é 15h
    h += 12;
  }
  if (!(h >= 0 && h <= 23 && min >= 0 && min <= 59)) return null;
  return formatTime(h, min);
}

const minutesOf = (s) => (!s ? 0 : s === 'meia' ? 30 : toNumber(s));

// as negações vêm primeiro, senão "não é urgente" cai na regra de "urgente"
const PRIORITY_RULES = [
  {
    re: '\\b(?:(?:isso|que)\\s+)?nao\\s+(?:e|eh|tem|ha|esta)\\s+(?:(?:tao|muito|nada|com)\\s+)?(?:urgente|importante|pressa|urgencia|prioridade|prioritario|prioritaria)\\b',
    resolve: () => 'baixa',
  },
  {
    re: '\\b(?:sem\\s+(?:pressa|presa|urgencia)|(?:pouco|nada)\\s+(?:importante|urgente)|quando\\s+(?:der|puder|sobrar\\s+tempo|tiver\\s+tempo)|tranquilo)\\b',
    resolve: () => 'baixa',
  },
  {
    re: '\\b(?:(?:com|de|e|a|o)\\s+)?(?:nivel\\s+de\\s+)?(?:prioridade|urgencia|importancia)(?:\\s+(?:e|eh|vai\\s+ser|sera|de|esta))?\\s+(alta|alto|media|medio|baixa|baixo|maxima|maximo|minima|minimo|normal|moderada|moderado|urgente|total)\\b',
    resolve: (m) => PRIORITY_WORDS[m[1]],
  },
  {
    re: '\\b(?:(?:com|de)\\s+)?(alta|media|baixa|maxima|minima|total)\\s+prioridade\\b',
    resolve: (m) => PRIORITY_WORDS[m[1]],
  },
  {
    re: '\\b(?:(?:e|eh|isso\\s+e|que\\s+e)\\s+)?(?:mais\\s+ou\\s+menos|meio)\\s+(?:importante|urgente)\\b',
    resolve: () => 'media',
  },
  {
    re: '\\b(?:(?:e|eh|isso\\s+e|que\\s+e|esta)\\s+)?(?:muito\\s+)?(?:urgente|urgentissim[oa]|urgentemente|importante|importantissim[oa]|critic[oa]|prioritari[oa]|prioridade)\\b',
    resolve: () => 'alta',
  },
  {
    re: '\\b(?:(?:e|eh)\\s+)?(?:pra|para)\\s+ontem\\b|\\bo\\s+(?:quanto|mais\\s+rapido)\\s+(?:antes|possivel)\\b|\\b(?:sem\\s+falta|impreterivelmente|asap)\\b',
    resolve: () => 'alta',
  },
];

const DATE_RULES = [
  { re: `${L}${PRE}\\bdepois\\s+de\\s+amanha\\b`, resolve: (m, now) => addDays(now, 2) },
  { re: `${L}${PRE}\\bamanha\\b`, resolve: (m, now) => addDays(now, 1) },
  { re: `${L}${PRE}\\bhoje\\b`, resolve: (m, now) => startOfDay(now) },
  {
    re: `${L}${PRE}\\b(?:dia\\s+)?(\\d{1,2})\\/(\\d{1,2})(?:\\/(\\d{2,4}))?\\b`,
    resolve: (m, now) => explicitDate(now, Number(m[1]), Number(m[2]) - 1, m[3]),
  },
  {
    re: `${L}${PRE}\\b(?:dia\\s+)?(${NUM})\\s+de\\s+(${MONTH_RE})(?:\\s+de\\s+(\\d{4}))?\\b`,
    resolve: (m, now) => explicitDate(now, toNumber(m[1]), MONTHS[m[2]], m[3]),
  },
  { re: `${L}${PRE}\\bdia\\s+(${NUM})\\b`, resolve: (m, now) => dayOfMonth(now, toNumber(m[1])) },
  {
    re: `${L}${PRE}\\b(?:(?:proxima|proximo)\\s+)?(?:(${WORKDAY_RE})[- ]feira|(sabado|domingo))${NEXT_WEEK}\\b`,
    resolve: (m, now) => nextWeekday(now, m[1] || m[2]),
  },
  {
    // sem preposição, "segunda via" virava segunda-feira
    re: `${L}\\b(?:(?:para|pra|ate|na|nesta|nessa|proxima)\\s+){1,2}(${WORKDAY_RE})(?!\\s+(?:via|vez|chamada|opcao|parte|fase|etapa))${NEXT_WEEK}\\b`,
    resolve: (m, now) => nextWeekday(now, m[1]),
  },
  { re: `${L}\\b(${WORKDAY_RE})\\s+que\\s+vem\\b`, resolve: (m, now) => nextWeekday(now, m[1]) },
  {
    re: `${L}${PRE}\\b(?:daqui\\s+a|dentro\\s+de|em)\\s+(${NUM})\\s+dias?\\b`,
    resolve: (m, now) => addDays(now, toNumber(m[1])),
  },
  {
    re: `${L}${PRE}\\b(?:semana\\s+que\\s+vem|proxima\\s+semana)\\b`,
    resolve: (m, now) => addDays(now, 7),
  },
];

const DURATION_RULES = [
  {
    re: `\\b(?:por|durante|com\\s+duracao\\s+de)\\s+(?:(meia)\\s+hora|(${NUM})\\s+(horas?|minutos?|min)(?:\\s+e\\s+(meia))?)\\b`,
    resolve: (m) => {
      if (m[1]) return 30;
      const n = toNumber(m[2]);
      return m[3].startsWith('h') ? n * 60 + (m[4] ? 30 : 0) : n;
    },
  },
];

const TIME_RULES = [
  {
    re: `\\b(?:(?:as|a|ao|pelo)\\s+)?meio[- ]dia${MINUTES}\\b`,
    resolve: (m) => clock(12, minutesOf(m[1])),
  },
  { re: '\\b(?:(?:as|a)\\s+)?meia[- ]noite\\b', resolve: () => '00:00' },
  {
    re: `\\b(?:(?:as|a|pelas|por\\s+volta\\s+das)\\s+)?(\\d{1,2})(?::|h)(\\d{2})\\b${PERIOD}`,
    resolve: (m) => clock(Number(m[1]), Number(m[2]), m[3], false),
  },
  {
    re: `\\b(?:as|a|pelas|por\\s+volta\\s+das|por\\s+volta\\s+de)\\s+(${NUM})(?:\\s*(?:h|hs|horas?)\\b|\\b)${MINUTES}${PERIOD}`,
    resolve: (m) => clock(toNumber(m[1]), minutesOf(m[2]), m[3], true),
  },
  {
    re: `\\b(\\d{1,2})\\s*(?:h|hs|horas)\\b${MINUTES}${PERIOD}`,
    resolve: (m) => clock(Number(m[1]), minutesOf(m[2]), m[3], false),
  },
  {
    re: '\\b(?:de|a|pela|na)\\s+(manha|tarde|noite)\\b',
    resolve: (m) => ({ manha: '09:00', tarde: '14:00', noite: '19:00' })[m[1]],
  },
];

const compile = (rules) => rules.map((r) => ({ ...r, re: new RegExp(r.re) }));
const COMPILED = {
  priority: compile(PRIORITY_RULES),
  date: compile(DATE_RULES),
  duration: compile(DURATION_RULES),
  time: compile(TIME_RULES),
};

const LEADING_FILLER = /^(?:(?:eu\s+)?(?:tenho\s+que|tenho\s+de|preciso\s+de|preciso|lembrar\s+de|me\s+lembre\s+de|lembre-me\s+de|lembrete\s+(?:de|para)|nova\s+tarefa|adicionar|agendar)\s*[:,]?\s+)+/;
const TRAILING_LEAD = /[\s,;]+(?:e\s+)?(?:eu\s+)?(?:tenho|preciso|temos|vou\s+ter)\s+(?:que|de)\s+(?:entregar|fazer|terminar|concluir)(?:\s+(?:isso|isto|ele|ela|tudo))?[\s,;.]*$/;
const TRAILING_CONNECTOR = /(?:[\s,;:.-]+(?:para|pra|ate|no|na|em|de|do|da|e|com|as|a|o|que))+[\s,;:.-]*$/;

function fold(text) {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function stripFolded(text, re) {
  const m = re.exec(fold(text));
  return m ? text.slice(0, m.index) + text.slice(m.index + m[0].length) : text;
}

function stripKeywordPreamble(text) {
  const folded = fold(text);
  const m = KEYWORD_RE.exec(folded);
  if (!m || !KEYWORD_PREAMBLE.test(folded.slice(0, m.index))) return text;
  return text.slice(m.index);
}

function buildTitle(text, spans) {
  let out = '';
  let cursor = 0;
  for (const [start, end] of [...spans].sort((a, b) => a[0] - b[0])) {
    out += text.slice(cursor, start) + ' ';
    cursor = end;
  }
  out += text.slice(cursor);

  out = out.replace(/\s+/g, ' ').replace(/\s+([,;.!?])/g, '$1').replace(/([,;])(?:\s*[,;])+/g, '$1').trim();
  out = stripKeywordPreamble(out);
  out = stripFolded(out, LEADING_FILLER);
  out = stripFolded(out, TRAILING_LEAD);
  out = stripFolded(out, TRAILING_CONNECTOR);
  out = out.replace(/^[\s,;:.-]+|[\s,;:.-]+$/g, '').trim();
  return out.charAt(0).toUpperCase() + out.slice(1);
}

function detectCategory(title) {
  const m = KEYWORD_RE.exec(fold(title));
  return m ? KEYWORD_TO_CATEGORY[m[1].replace(/\s+/g, ' ')] : null;
}

export function parseTask(input, now = new Date()) {
  const text = input.normalize('NFC').trim();
  const state = { folded: fold(text), spans: [], lastMatch: '' };

  const take = (rules) => {
    for (const rule of rules) {
      const m = rule.re.exec(state.folded);
      if (!m) continue;
      const value = rule.resolve(m, now);
      if (value == null) continue;
      const end = m.index + m[0].length;
      state.spans.push([m.index, end]);
      state.lastMatch = m[0];
      state.folded = state.folded.slice(0, m.index) + ' '.repeat(m[0].length) + state.folded.slice(end);
      return value;
    }
    return null;
  };

  const priority = take(COMPILED.priority);
  const date = take(COMPILED.date);
  const deadline = date != null && DEADLINE_HINT.test(state.lastMatch);
  const durationMin = take(COMPILED.duration);
  const time = take(COMPILED.time);
  const title = buildTitle(text, state.spans);

  return {
    title,
    category: detectCategory(title),
    date: toISODate(date ?? now),
    dateSpecified: date != null,
    deadline,
    time,
    durationMin,
    priority: priority ?? 'media',
    prioritySpecified: priority != null,
    source: text,
  };
}
```

### `calendar.js`

```js
import { toISODate, toHHMM, fromISODate, fromDateAndTime, toLocalDateTime, addDays } from './dates.js';
import { CATEGORIES } from './parser.js';

export const PRIORITIES = {
  alta: { label: 'Alta', colorId: '11', rank: 0 },   // Tomate
  media: { label: 'Média', colorId: '5', rank: 1 },  // Banana
  baixa: { label: 'Baixa', colorId: '10', rank: 2 }, // Manjericão
};
const DONE_PREFIX = '✓';
const DONE_COLOR = '8'; // Grafite

// evento de dia inteiro começa 00:00: 900 = 9h da véspera, 2340 = 9h de dois dias antes
export const REMINDERS = {
  timed: {
    alta: [{ method: 'popup', minutes: 1440 }, { method: 'popup', minutes: 60 }, { method: 'email', minutes: 1440 }],
    media: [{ method: 'popup', minutes: 60 }],
    baixa: [{ method: 'popup', minutes: 15 }],
  },
  allDay: {
    alta: [{ method: 'popup', minutes: 2340 }, { method: 'popup', minutes: 900 }, { method: 'email', minutes: 900 }],
    media: [{ method: 'popup', minutes: 900 }],
    baixa: [{ method: 'popup', minutes: 900 }],
  },
};

export const DEFAULT_DURATION = 30;
const APP_TAG = 'tarefas-voz';
const SCOPE = 'https://www.googleapis.com/auth/calendar.events';
const API = 'https://www.googleapis.com/calendar/v3';

export class AuthError extends Error {
  constructor() {
    super('Entre com sua conta Google para continuar.');
  }
}

export function describeReminders(priority, timed) {
  const list = REMINDERS[timed ? 'timed' : 'allDay'][priority] ?? [];
  return list.map((r) => `${r.method === 'email' ? 'e-mail' : 'notificação'} ${describeOffset(r.minutes, timed)}`).join(' · ');
}

function describeOffset(minutes, timed) {
  if (!timed) {
    const days = Math.ceil(minutes / 1440);
    const at = (days * 1440 - minutes) / 60;
    return `${days === 1 ? 'na véspera' : `${days} dias antes`} às ${at}h`;
  }
  if (minutes >= 1440) return `${minutes / 1440 === 1 ? '1 dia' : `${minutes / 1440} dias`} antes`;
  if (minutes >= 60) return `${minutes / 60}h antes`;
  return `${minutes} min antes`;
}

function taskToEvent(task) {
  const p = PRIORITIES[task.priority] ?? PRIORITIES.media;
  const event = {
    summary: task.done ? `${DONE_PREFIX} ${task.title}` : task.title,
    description: [
      task.category ? `Tipo: ${CATEGORIES[task.category]}` : null,
      `Prioridade: ${p.label}`,
      task.deadline ? 'Prazo de entrega' : null,
      task.source ? `Ditado: "${task.source}"` : null,
      'Criada pelo app Tarefas por Voz.',
    ].filter(Boolean).join('\n'),
    colorId: task.done ? DONE_COLOR : p.colorId,
    extendedProperties: {
      private: {
        app: APP_TAG,
        priority: task.priority,
        category: task.category ?? '',
        deadline: String(!!task.deadline),
        done: String(!!task.done),
        source: task.source ?? '',
      },
    },
    reminders: { useDefault: false, overrides: task.done ? [] : REMINDERS[task.time ? 'timed' : 'allDay'][task.priority] },
  };
  if (task.time) {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const start = fromDateAndTime(task.date, task.time);
    const end = new Date(start.getTime() + (task.durationMin || DEFAULT_DURATION) * 60000);
    event.start = { dateTime: toLocalDateTime(start), timeZone, date: null };
    event.end = { dateTime: toLocalDateTime(end), timeZone, date: null };
  } else {
    event.start = { date: task.date, dateTime: null };
    event.end = { date: toISODate(addDays(fromISODate(task.date), 1)), dateTime: null };
  }
  return event;
}

function eventToTask(event) {
  const priv = event.extendedProperties?.private ?? {};
  const task = {
    id: event.id,
    // emojis são da versão antiga
    title: event.summary?.replace(/^(?:✓|🔴|🟡|🟢|✅)\s*/u, '') ?? '(sem título)',
    priority: priv.priority in PRIORITIES ? priv.priority : 'media',
    category: priv.category in CATEGORIES ? priv.category : null,
    deadline: priv.deadline === 'true',
    done: priv.done === 'true',
    source: priv.source || null,
    link: event.htmlLink ?? null,
    time: null,
    durationMin: null,
  };
  if (event.start.dateTime) {
    const start = new Date(event.start.dateTime);
    const end = new Date(event.end.dateTime);
    task.date = toISODate(start);
    task.time = toHHMM(start);
    task.durationMin = Math.round((end - start) / 60000);
  } else {
    task.date = event.start.date;
  }
  return task;
}

function waitForGoogle(timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const check = () => {
      if (window.google?.accounts?.oauth2) return resolve();
      if (Date.now() - started > timeoutMs) return reject(new Error('Não foi possível carregar o login do Google. Verifique sua conexão.'));
      setTimeout(check, 100);
    };
    check();
  });
}

export class GoogleBackend {
  label = 'Google Agenda';
  needsSignIn = true;

  constructor(clientId, calendarId = 'primary') {
    this.clientId = clientId;
    this.calendarId = calendarId;
    this.token = null;
  }

  get signedIn() {
    return !!this.token && Date.now() < this.token.expiresAt;
  }

  async init() {
    await waitForGoogle();
    this.tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: this.clientId,
      scope: SCOPE,
      callback: () => {},
    });
    try {
      const saved = JSON.parse(sessionStorage.getItem('tarefas-voz-token'));
      if (saved && Date.now() < saved.expiresAt) this.token = saved;
    } catch {}
  }

  signIn() {
    return new Promise((resolve, reject) => {
      this.tokenClient.callback = (resp) => {
        if (resp.error) return reject(new Error(resp.error_description || resp.error));
        this.token = { access: resp.access_token, expiresAt: Date.now() + (Number(resp.expires_in) - 60) * 1000 };
        try { sessionStorage.setItem('tarefas-voz-token', JSON.stringify(this.token)); } catch {}
        resolve();
      };
      this.tokenClient.error_callback = (err) => reject(new Error(err.type === 'popup_closed' ? 'Login cancelado.' : err.message || 'Falha no login.'));
      this.tokenClient.requestAccessToken();
    });
  }

  signOut() {
    if (this.token) google.accounts.oauth2.revoke(this.token.access, () => {});
    this.clearToken();
  }

  clearToken() {
    this.token = null;
    try { sessionStorage.removeItem('tarefas-voz-token'); } catch {}
  }

  async api(method, path, body) {
    if (!this.signedIn) throw new AuthError();
    const res = await fetch(`${API}/calendars/${encodeURIComponent(this.calendarId)}${path}`, {
      method,
      headers: { Authorization: `Bearer ${this.token.access}`, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (res.status === 401) {
      this.clearToken();
      throw new AuthError();
    }
    if (!res.ok) {
      let message = null;
      try { message = (await res.json()).error?.message; } catch {}
      throw new Error(message || `Erro ${res.status} ao falar com o Google Agenda.`);
    }
    return res.status === 204 ? null : res.json();
  }

  async list() {
    const params = new URLSearchParams({
      privateExtendedProperty: `app=${APP_TAG}`,
      singleEvents: 'true',
      orderBy: 'startTime',
      timeMin: addDays(new Date(), -30).toISOString(),
      maxResults: '250',
    });
    const data = await this.api('GET', `/events?${params}`);
    return (data.items ?? []).map(eventToTask);
  }

  async create(task) {
    return eventToTask(await this.api('POST', '/events', taskToEvent(task)));
  }

  async update(task) {
    return eventToTask(await this.api('PATCH', `/events/${encodeURIComponent(task.id)}`, taskToEvent(task)));
  }

  async remove(id) {
    await this.api('DELETE', `/events/${encodeURIComponent(id)}`);
  }
}

const DEMO_KEY = 'tarefas-voz-demo';

export class DemoBackend {
  label = 'Modo demonstração';
  needsSignIn = false;
  signedIn = true;

  async init() {}

  load() {
    try { return JSON.parse(localStorage.getItem(DEMO_KEY)) ?? []; } catch { return this.memory ?? []; }
  }

  save(tasks) {
    this.memory = tasks;
    try { localStorage.setItem(DEMO_KEY, JSON.stringify(tasks)); } catch {}
  }

  async list() {
    return this.load();
  }

  async create(task) {
    const created = { ...task, id: crypto.randomUUID(), link: null };
    this.save([...this.load(), created]);
    return created;
  }

  async update(task) {
    this.save(this.load().map((t) => (t.id === task.id ? { ...t, ...task } : t)));
    return task;
  }

  async remove(id) {
    this.save(this.load().filter((t) => t.id !== id));
  }
}
```

### `dates.js`

```js
const pad = (n) => String(n).padStart(2, '0');

export function startOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function addDays(d, n) {
  const r = startOfDay(d);
  r.setDate(r.getDate() + n);
  return r;
}

export function makeDate(year, month, day) {
  const r = new Date(year, month, day);
  return r.getFullYear() === year && r.getMonth() === month && r.getDate() === day ? r : null;
}

export function toISODate(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function toHHMM(d) {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fromISODate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function fromDateAndTime(isoDate, hhmm) {
  const [h, min] = hhmm.split(':').map(Number);
  const d = fromISODate(isoDate);
  d.setHours(h, min, 0, 0);
  return d;
}

export function toLocalDateTime(d) {
  return `${toISODate(d)}T${toHHMM(d)}:00`;
}

export function formatTime(h, m) {
  return `${pad(h)}:${pad(m)}`;
}
```

### `sw.js`

```js
const CACHE = 'tarefas-voz-v2';
const SHELL = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './parser.js',
  './calendar.js',
  './dates.js',
  './config.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/favicon.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request, { ignoreSearch: true })),
  );
});
```

### `manifest.webmanifest`

```json
{
  "name": "Tarefas por Voz",
  "short_name": "Tarefas",
  "description": "Fale suas tarefas e salve no Google Agenda.",
  "lang": "pt-BR",
  "start_url": "./",
  "scope": "./",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#f6f7f9",
  "theme_color": "#2563eb",
  "icons": [
    { "src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "icons/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

### `icons/favicon.svg`

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#2563eb"/><g fill="#fff"><rect x="6" y="13.5" width="2.6" height="5" rx="1.3"/><rect x="10.6" y="10" width="2.6" height="12" rx="1.3"/><rect x="15.2" y="7" width="2.6" height="18" rx="1.3"/><rect x="19.8" y="11" width="2.6" height="10" rx="1.3"/><rect x="24.4" y="14" width="2.6" height="4" rx="1.3"/></g></svg>
```

### `tests.html`

```html
<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>Testes do parser</title>
<style>
  body { font: 14px/1.4 system-ui, sans-serif; margin: 24px; }
  table { border-collapse: collapse; width: 100%; }
  td, th { border: 1px solid #ccc; padding: 4px 8px; text-align: left; vertical-align: top; }
  .ok { background: #e6f6ea; } .fail { background: #fde8e8; }
  pre { margin: 0; white-space: pre-wrap; }
</style>
</head>
<body>
<h1 id="summary">Rodando…</h1>
<table><thead><tr><th>Frase</th><th>Esperado</th><th>Obtido</th></tr></thead><tbody id="rows"></tbody></table>
<script type="module">
  import { parseTask } from './parser.js';

  // Terça-feira, 20/10/2026, 10h
  const NOW = new Date(2026, 9, 20, 10, 0);

  const CASES = [
    ['entregar o relatório financeiro amanhã às 15h prioridade alta',
      { title: 'Entregar o relatório financeiro', date: '2026-10-21', time: '15:00', priority: 'alta' }],
    ['ligar para o dentista sexta-feira às 9 e meia prioridade média',
      { title: 'Ligar para o dentista', date: '2026-10-23', time: '09:30', priority: 'media' }],
    ['pagar a conta de luz dia 25 prioridade baixa',
      { title: 'Pagar a conta de luz', date: '2026-10-25', time: null, priority: 'baixa' }],
    ['estudar inglês hoje às 14:30 por uma hora',
      { title: 'Estudar inglês', date: '2026-10-20', time: '14:30', durationMin: 60, priority: 'media', prioritySpecified: false }],
    ['reunião com a equipe dia 3 de novembro às 10 horas',
      { title: 'Reunião com a equipe', date: '2026-11-03', time: '10:00' }],
    ['tenho que comprar presente para a Ana até sábado, é urgente',
      { title: 'Comprar presente para a Ana', date: '2026-10-24', time: null, priority: 'alta' }],
    ['pegar as crianças na escola às duas da tarde',
      { title: 'Pegar as crianças na escola', date: '2026-10-20', dateSpecified: false, time: '14:00' }],
    ['consulta médica 05/11 às 8h',
      { title: 'Consulta médica', date: '2026-11-05', time: '08:00' }],
    ['academia amanhã de manhã',
      { title: 'Academia', date: '2026-10-21', time: '09:00' }],
    ['enviar proposta na próxima segunda com prioridade alta',
      { title: 'Enviar proposta', date: '2026-10-26', priority: 'alta' }],
    ['pagar a segunda via do boleto amanhã',
      { title: 'Pagar a segunda via do boleto', date: '2026-10-21' }],
    ['ir ao mercado às 3',
      { title: 'Ir ao mercado', time: '15:00' }],
    ['renovar passaporte daqui a 10 dias',
      { title: 'Renovar passaporte', date: '2026-10-30' }],
    ['festa às 8 da noite no sábado',
      { title: 'Festa', date: '2026-10-24', time: '20:00' }],
    ['almoço com cliente ao meio-dia e meia na quinta',
      { title: 'Almoço com cliente', date: '2026-10-22', time: '12:30' }],
    ['revisar contrato dia 15',
      { title: 'Revisar contrato', date: '2026-11-15' }],
    ['aniversário da mãe 2 de janeiro',
      { title: 'Aniversário da mãe', date: '2027-01-02', time: null }],
    ['entregar trabalho às vinte e uma horas de alta prioridade',
      { title: 'Entregar trabalho', time: '21:00', priority: 'alta' }],
    ['Treino de corrida terça que vem às 7 por 45 minutos',
      { title: 'Treino de corrida', date: '2026-10-27', time: '07:00', durationMin: 45 }],
    ['dentista dia 31',
      { title: 'Dentista', date: '2026-10-31' }],

    ['tenho um trabalho de história sobre a revolução francesa pra entregar até sexta prioridade alta',
      { title: 'Trabalho de história sobre a revolução francesa', category: 'trabalho', date: '2026-10-23', deadline: true, priority: 'alta' }],
    ['prova de cálculo na quinta às 10h',
      { title: 'Prova de cálculo', category: 'prova', date: '2026-10-22', time: '10:00', deadline: false }],
    ['estou sendo cobrado pelo relatório de vendas, prazo até amanhã',
      { title: 'Relatório de vendas', category: 'trabalho', date: '2026-10-21', deadline: true, priority: 'media' }],
    ['projeto de robótica tenho prazo até dia 30 sem pressa',
      { title: 'Projeto de robótica', category: 'projeto', date: '2026-10-30', deadline: true, priority: 'baixa' }],
    ['aula de inglês amanhã às 19h',
      { title: 'Aula de inglês', category: 'aula', date: '2026-10-21', time: '19:00' }],
    ['missão: limpar a garagem no sábado, é muito importante',
      { title: 'Missão: limpar a garagem', category: 'missao', date: '2026-10-24', priority: 'alta' }],
    ['tarefa de casa de matemática a entrega é dia 28',
      { title: 'Tarefa de casa de matemática', category: 'tarefa', date: '2026-10-28', deadline: true }],
    ['lista de exercícios de física, não é urgente, vence dia 2 de novembro',
      { title: 'Lista de exercícios de física', category: 'tarefa', date: '2026-11-02', deadline: true, priority: 'baixa' }],
    ['trabalho em grupo tem que estar pronto até quarta, prioridade média',
      { title: 'Trabalho em grupo', category: 'trabalho', date: '2026-10-21', deadline: true, priority: 'media', prioritySpecified: true }],
    ['seminário de biologia o prazo é segunda-feira e é urgente',
      { title: 'Seminário de biologia', category: 'trabalho', date: '2026-10-26', deadline: true, priority: 'alta' }],
    ['estudar para a prova de química que vai ser na sexta',
      { title: 'Estudar para a prova de química', category: 'prova', date: '2026-10-23', deadline: false }],
    ['o professor passou um trabalho de geografia pra semana que vem',
      { title: 'Trabalho de geografia', category: 'trabalho', date: '2026-10-27' }],
    ['entregar relatório até amanhã sem falta',
      { title: 'Entregar relatório', date: '2026-10-21', deadline: true, priority: 'alta' }],
    ['tô sendo cobrado pra sexta pelo relatório do mês',
      { title: 'Relatório do mês', category: 'trabalho', date: '2026-10-23', deadline: true }],
    ['ir para o trabalho amanhã às 8',
      { title: 'Ir para o trabalho', date: '2026-10-21', time: '08:00' }],
    ['tenho que terminar o tcc, a data limite é 15 de dezembro, prioridade máxima',
      { title: 'Tcc', category: 'trabalho', date: '2026-12-15', deadline: true, priority: 'alta' }],
    ['ler capítulo 3 quando der',
      { title: 'Ler capítulo 3', category: null, priority: 'baixa' }],
    ['dever de casa de português até depois de amanhã, a prioridade é baixa',
      { title: 'Dever de casa de português', category: 'tarefa', date: '2026-10-22', priority: 'baixa' }],
    ['comprar presente, isso não é prioridade',
      { title: 'Comprar presente', priority: 'baixa' }],
    ['simulado do enem domingo às 13h30',
      { title: 'Simulado do enem', category: 'prova', date: '2026-10-25', time: '13:30' }],
  ];

  let passed = 0;
  const rows = document.getElementById('rows');
  const results = [];
  for (const [phrase, expected] of CASES) {
    const got = parseTask(phrase, NOW);
    const ok = Object.entries(expected).every(([k, v]) => got[k] === v);
    if (ok) passed++;
    results.push({ phrase, ok, got });
    const tr = rows.insertRow();
    tr.className = ok ? 'ok' : 'fail';
    for (const cell of [phrase, JSON.stringify(expected, null, 1), JSON.stringify(got, null, 1)]) {
      const pre = document.createElement('pre');
      pre.textContent = cell;
      tr.insertCell().append(pre);
    }
  }
  document.getElementById('summary').textContent = `${passed}/${CASES.length} casos passaram`;
  window.testResults = { passed, total: CASES.length, failures: results.filter((r) => !r.ok) };
</script>
</body>
</html>
```

### `.gitignore`

```text
# Arquivos locais que não precisam ir para o GitHub
.claude/
.vscode/
*.log
```
