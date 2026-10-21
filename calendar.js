import { toISODate, toHHMM, fromISODate, fromDateAndTime, toLocalDateTime, addDays } from './dates.js';

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
    description: [`Prioridade: ${p.label}`, task.source ? `Ditado: "${task.source}"` : null, 'Criada pelo app Tarefas por Voz.']
      .filter(Boolean).join('\n'),
    colorId: task.done ? DONE_COLOR : p.colorId,
    extendedProperties: {
      private: { app: APP_TAG, priority: task.priority, done: String(!!task.done), source: task.source ?? '' },
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
