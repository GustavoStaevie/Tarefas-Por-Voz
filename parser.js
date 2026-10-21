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

const PRIORITY_WORDS = {
  alta: 'alta', maxima: 'alta', urgente: 'alta',
  media: 'media', normal: 'media',
  baixa: 'baixa', minima: 'baixa',
};

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

const PRIORITY_RULES = [
  {
    re: '\\b(?:(?:com|de|e)\\s+)?(?:prioridade|urgencia|importancia)(?:\\s+(?:e|eh))?\\s+(alta|media|baixa|maxima|minima|normal|urgente)\\b',
    resolve: (m) => PRIORITY_WORDS[m[1]],
  },
  {
    re: '\\b(?:(?:com|de)\\s+)?(alta|media|baixa)\\s+prioridade\\b',
    resolve: (m) => PRIORITY_WORDS[m[1]],
  },
  {
    re: '\\b(?:(?:e|isso\\s+e)\\s+)?(?:urgente|urgentemente)\\b',
    resolve: () => 'alta',
  },
];

const DATE_RULES = [
  { re: `${PRE}\\bdepois\\s+de\\s+amanha\\b`, resolve: (m, now) => addDays(now, 2) },
  { re: `${PRE}\\bamanha\\b`, resolve: (m, now) => addDays(now, 1) },
  { re: `${PRE}\\bhoje\\b`, resolve: (m, now) => startOfDay(now) },
  {
    re: `${PRE}\\b(?:dia\\s+)?(\\d{1,2})\\/(\\d{1,2})(?:\\/(\\d{2,4}))?\\b`,
    resolve: (m, now) => explicitDate(now, Number(m[1]), Number(m[2]) - 1, m[3]),
  },
  {
    re: `${PRE}\\b(?:dia\\s+)?(${NUM})\\s+de\\s+(${MONTH_RE})(?:\\s+de\\s+(\\d{4}))?\\b`,
    resolve: (m, now) => explicitDate(now, toNumber(m[1]), MONTHS[m[2]], m[3]),
  },
  { re: `${PRE}\\bdia\\s+(${NUM})\\b`, resolve: (m, now) => dayOfMonth(now, toNumber(m[1])) },
  {
    re: `${PRE}\\b(?:(?:proxima|proximo)\\s+)?(?:(${WORKDAY_RE})[- ]feira|(sabado|domingo))${NEXT_WEEK}\\b`,
    resolve: (m, now) => nextWeekday(now, m[1] || m[2]),
  },
  {
    // sem preposição, "segunda via" virava segunda-feira
    re: `\\b(?:(?:para|pra|ate|na|nesta|nessa|proxima)\\s+){1,2}(${WORKDAY_RE})(?!\\s+(?:via|vez|chamada|opcao|parte|fase|etapa))${NEXT_WEEK}\\b`,
    resolve: (m, now) => nextWeekday(now, m[1]),
  },
  { re: `\\b(${WORKDAY_RE})\\s+que\\s+vem\\b`, resolve: (m, now) => nextWeekday(now, m[1]) },
  {
    re: `${PRE}\\b(?:daqui\\s+a|dentro\\s+de|em)\\s+(${NUM})\\s+dias?\\b`,
    resolve: (m, now) => addDays(now, toNumber(m[1])),
  },
  {
    re: `${PRE}\\b(?:semana\\s+que\\s+vem|proxima\\s+semana)\\b`,
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

const LEADING_FILLER = /^(?:(?:eu\s+)?(?:tenho\s+que|tenho\s+de|preciso\s+de|preciso|lembrar\s+de|me\s+lembre\s+de|lembre-me\s+de|lembrete\s+(?:de|para)|nova\s+tarefa|tarefa|adicionar|agendar)\s*[:,]?\s+)+/;
const TRAILING_CONNECTOR = /(?:[\s,;:.-]+(?:para|pra|ate|no|na|em|de|do|da|e|com|as|a|o|que))+[\s,;:.-]*$/;

function fold(text) {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function stripFolded(text, re) {
  const m = re.exec(fold(text));
  return m ? text.slice(0, m.index) + text.slice(m.index + m[0].length) : text;
}

function buildTitle(text, spans) {
  let out = '';
  let cursor = 0;
  for (const [start, end] of [...spans].sort((a, b) => a[0] - b[0])) {
    out += text.slice(cursor, start) + ' ';
    cursor = end;
  }
  out += text.slice(cursor);

  out = out.replace(/\s+/g, ' ').replace(/\s+([,;.!?])/g, '$1').trim();
  out = stripFolded(out, LEADING_FILLER);
  out = stripFolded(out, TRAILING_CONNECTOR);
  out = out.replace(/^[\s,;:.-]+|[\s,;:.-]+$/g, '').trim();
  return out.charAt(0).toUpperCase() + out.slice(1);
}

export function parseTask(input, now = new Date()) {
  const text = input.normalize('NFC').trim();
  const state = { folded: fold(text), spans: [] };

  const take = (rules) => {
    for (const rule of rules) {
      const m = rule.re.exec(state.folded);
      if (!m) continue;
      const value = rule.resolve(m, now);
      if (value == null) continue;
      const end = m.index + m[0].length;
      state.spans.push([m.index, end]);
      state.folded = state.folded.slice(0, m.index) + ' '.repeat(m[0].length) + state.folded.slice(end);
      return value;
    }
    return null;
  };

  const priority = take(COMPILED.priority);
  const date = take(COMPILED.date);
  const durationMin = take(COMPILED.duration);
  const time = take(COMPILED.time);

  return {
    title: buildTitle(text, state.spans),
    date: toISODate(date ?? now),
    dateSpecified: date != null,
    time,
    durationMin,
    priority: priority ?? 'media',
    prioritySpecified: priority != null,
    source: text,
  };
}
