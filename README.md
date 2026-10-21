# Tarefas por Voz 🎙️ → Google Agenda

App web em que você **fala** uma tarefa ("Entregar o relatório amanhã às 15h,
prioridade alta") e ela vira um evento no seu **Google Agenda**, com cor e
lembretes de acordo com a prioridade. Você também pode marcar tarefas como
concluídas.

## Como funciona

| Você fala | O app entende |
|---|---|
| a tarefa | título do evento |
| **dia**: "hoje", "amanhã", "sexta-feira", "na próxima segunda", "dia 25", "3 de novembro", "05/11", "daqui a 10 dias" | data de entrega |
| **horário** (opcional): "às 15h", "às 9 e meia", "às duas da tarde", "meio-dia", "de manhã" | início do evento |
| **duração** (opcional): "por uma hora", "por 45 minutos" | fim do evento (padrão: 30 min) |
| **prioridade**: "prioridade alta / média / baixa", "é urgente" | cor + lembretes (padrão: média) |

Antes de salvar, o app mostra o que entendeu num formulário para você conferir e
corrigir. Se você não disser a data, ele coloca **hoje** e destaca o campo.

**Na agenda:**

- Sem horário → evento de **dia inteiro** na data de entrega.
- A prioridade aparece pela **cor** do evento:
  - Alta (vermelho): notificação 1 dia antes e 1h antes + e-mail 1 dia antes.
  - Média (amarelo): notificação 1h antes.
  - Baixa (verde): notificação 15 min antes.
- Para eventos de dia inteiro, os lembretes são às 9h da véspera (alta também 2 dias antes).
- Concluída: o título ganha "✓ " na frente, a cor fica cinza e os lembretes são removidos.

Os eventos criados pelo app são marcados internamente, então a lista do app só
mostra as suas tarefas, não as reuniões normais da agenda.

## Rodar no computador

Precisa do Python (já instalado) e do **Chrome ou Edge** (o reconhecimento de voz
não funciona no Firefox).

```bash
python -m http.server 8000 --bind 127.0.0.1
```

Abra http://localhost:8000. Sem configurar nada, o app roda em **modo
demonstração**: tudo funciona, mas as tarefas ficam só no navegador.

## Usar no celular (publicar no GitHub Pages, grátis)

O app é só um conjunto de arquivos estáticos, então não precisa de servidor
ligado: o **GitHub Pages** hospeda de graça e com **HTTPS**. O HTTPS é
obrigatório, porque o celular só libera o microfone e o login do Google em sites
seguros.

- Repositório: https://github.com/GustavoStaevie/Tarefas-Por-Voz
- Endereço do app: https://gustavostaevie.github.io/Tarefas-Por-Voz/

1. No GitHub, abra o repositório e vá em **Settings → Pages**:
   - Source: **Deploy from a branch**.
   - Branch: **main**, pasta **/ (root)**.
   - Clique em **Save**.

   Em 1 a 2 minutos o site fica no ar.
2. No Google Cloud, adicione `https://gustavostaevie.github.io` nas **Origens JavaScript
   autorizadas** (passo 4 da próxima seção). Coloque só a origem, sem `/Tarefas-Por-Voz`.
3. No celular, abra o endereço e instale o app na tela inicial:
   - **Android (Chrome):** menu ⋮ → **Adicionar à tela inicial** (ou **Instalar app**).
   - **iPhone (Safari):** botão Compartilhar → **Adicionar à Tela de Início**.

   Ele abre em tela cheia, como um app.

Para publicar uma atualização depois, rode no terminal:

```bash
git add .
git commit -m "Descreva a mudança"
git push
```

**Dicas para o celular:**

- **Android:** o microfone funciona melhor no Chrome.
- **iPhone:** o reconhecimento de voz do Safari é mais limitado. Se o botão do microfone não funcionar, toque no campo de texto e use o **microfone do próprio teclado** para ditar. O app entende a frase do mesmo jeito.
- **Login:** o acesso ao Google dura cerca de 1 hora. Depois disso o app pede para entrar de novo, e basta um toque.

## Conectar ao Google Agenda (uma vez só, ~10 min)

1. Acesse https://console.cloud.google.com e crie um projeto (ex.: "Tarefas por Voz").
2. Em **APIs e serviços → Biblioteca**, procure **Google Calendar API** e clique em **Ativar**.
3. Em **Google Auth Platform** (ou "Tela de permissão OAuth"):
   - Tipo de usuário: **Externo**.
   - Nome do app e seu e-mail de suporte.
   - Em **Público-alvo → Usuários de teste**, adicione o seu próprio e-mail do Google.
4. Em **Clientes** (ou **Credenciais → Criar credenciais → ID do cliente OAuth**):
   - Tipo: **Aplicativo da Web**.
   - **Origens JavaScript autorizadas**: `http://localhost:8000` (computador) e
     `https://gustavostaevie.github.io` (celular).
5. Copie o **ID do cliente** (termina em `.apps.googleusercontent.com`) e cole em
   [config.js](config.js):

   ```js
   export const GOOGLE_CLIENT_ID = '1234567890-abc.apps.googleusercontent.com';
   ```

6. Recarregue a página e clique em **Entrar com Google**. Como o app está "em
   teste", o Google mostra um aviso de app não verificado — clique em
   **Continuar** (é o seu próprio app).

O ID do cliente não é segredo (fica no navegador de qualquer forma), mas o app só
funciona para os e-mails cadastrados como usuários de teste.

Quer as tarefas numa agenda separada? Crie uma agenda "Tarefas" no Google Agenda
e cole o ID dela em `CALENDAR_ID` no `config.js`.

## Arquivos

- [index.html](index.html), [styles.css](styles.css) — interface.
- [app.js](app.js) — microfone, formulário de revisão e lista de tarefas.
- [parser.js](parser.js) — entende a frase em português (data, hora, prioridade…).
- [calendar.js](calendar.js) — cria/atualiza/exclui eventos no Google Agenda; também o modo demonstração.
- [dates.js](dates.js) — utilitários de data.
- [manifest.webmanifest](manifest.webmanifest), [sw.js](sw.js), [icons/](icons/) — deixam o app instalável no celular e abrindo sem internet.
- [tests.html](tests.html) — testes do parser: abra http://localhost:8000/tests.html.

## Próximos passos possíveis

- Ditar várias tarefas de uma vez ("… nova tarefa …").
- Editar uma tarefa já criada (data, prioridade).
- Tarefas recorrentes ("toda segunda às 8h").
