import { parseTask } from './parser.js';
import { GoogleBackend, DemoBackend, AuthError, PRIORITIES, DEFAULT_DURATION, describeReminders } from './calendar.js';
import { toISODate, addDays, fromISODate } from './dates.js';
import { GOOGLE_CLIENT_ID, CALENDAR_ID } from './config.js';

const $ = (sel) => document.querySelector(sel);

const backend = GOOGLE_CLIENT_ID.trim()
  ? new GoogleBackend(GOOGLE_CLIENT_ID.trim(), CALENDAR_ID)
  : new DemoBackend();

let tasks = [];
let draftSource = null;

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
  $('#f-title').value = parsed.title;
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
  draftSource = null;
}

function readDraft() {
  const time = $('#f-time').value || null;
  return {
    title: $('#f-title').value.trim(),
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
  return `${day}${time} · ${PRIORITIES[task.priority].label}`;
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
