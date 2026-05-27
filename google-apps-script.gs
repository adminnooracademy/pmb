const ADMIN_PASSWORD_DEFAULT = 'ipimadmin2026';

const RESULT_HEADERS = [
  'ID','No Ujian','Username','Nama','Paket','Exam Key','Ujian','Nilai','Benar','Salah/Kosong','Total','Mulai','Submit','Durasi Detik','Auto Submit','Tab Keluar','Proctoring JSON','Detail JSON'
];

const ACTIVITY_HEADERS = [
  'Timestamp','No Ujian','Username','Nama','Ujian','Event','Detail','Proctoring JSON'
];

const PARTICIPANT_HEADERS = [
  'No Ujian','Username','Nama','Paket','Completed Exams','Status','First Locked At','Last Started At','Last Submitted At','Updated At','Reset At','Notes'
];

const PACKAGE_EXAMS = {
  arabic_math: ['arabic','math'],
  english_math: ['english','math']
};

function getAdminPassword_() {
  return PropertiesService.getScriptProperties().getProperty('ADMIN_PASSWORD') || ADMIN_PASSWORD_DEFAULT;
}

function output_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function normalizeNo_(value) {
  return String(value || '').trim().toUpperCase().replace(/\s+/g, '');
}

function normalizePackage_(value) {
  const key = String(value || '').trim();
  return PACKAGE_EXAMS[key] ? key : '';
}

function normalizeExamList_(value) {
  if (Array.isArray(value)) return value.map(String).map(s => s.trim()).filter(Boolean);
  return String(value || '').split(/[,\|]/).map(s => s.trim()).filter(Boolean);
}

function safeJson_(value, fallback) {
  try {
    if (typeof value === 'string') return JSON.parse(value);
    return value || fallback;
  } catch (err) {
    return fallback;
  }
}

function getOrCreateSheet_(name, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(name) || ss.insertSheet(name);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
  } else {
    const firstRow = sheet.getRange(1, 1, 1, Math.max(headers.length, sheet.getLastColumn())).getValues()[0];
    if (!firstRow[0]) sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
  return sheet;
}

function sheetToObjects_(sheet) {
  if (!sheet || sheet.getLastRow() < 2) return [];
  const values = sheet.getDataRange().getValues();
  const headers = values.shift().map(String);
  return values.map(row => {
    const o = {};
    headers.forEach((h, i) => o[h] = row[i]);
    return o;
  });
}

function resultRows_() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Hasil PMB');
  return sheetToObjects_(sheet).map(r => ({
    id: r['ID'] || '',
    noUjian: normalizeNo_(r['No Ujian'] || r['Username'] || ''),
    username: normalizeNo_(r['Username'] || r['No Ujian'] || ''),
    name: r['Nama'] || '',
    examPackage: r['Paket'] || '',
    examKey: r['Exam Key'] || '',
    examTitle: r['Ujian'] || '',
    score: Number(r['Nilai'] || 0),
    correct: Number(r['Benar'] || 0),
    wrong: Number(r['Salah/Kosong'] || 0),
    total: Number(r['Total'] || 0),
    startedAt: r['Mulai'] || '',
    submittedAt: r['Submit'] || '',
    durationSeconds: Number(r['Durasi Detik'] || 0),
    autoSubmitted: String(r['Auto Submit']).toLowerCase() === 'true',
    lostFocus: Number(r['Tab Keluar'] || 0),
    proctoring: safeJson_(r['Proctoring JSON'], {}),
    details: safeJson_(r['Detail JSON'], [])
  }));
}

function findParticipantRow_(sheet, noUjian) {
  const no = normalizeNo_(noUjian);
  if (!no || sheet.getLastRow() < 2) return -1;
  const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues();
  for (let i = 0; i < values.length; i++) {
    if (normalizeNo_(values[i][0]) === no) return i + 2;
  }
  return -1;
}

function readParticipantAtRow_(sheet, rowNumber) {
  if (rowNumber < 2) return null;
  const row = sheet.getRange(rowNumber, 1, 1, PARTICIPANT_HEADERS.length).getValues()[0];
  const o = {};
  PARTICIPANT_HEADERS.forEach((h, i) => o[h] = row[i]);
  return {
    noUjian: normalizeNo_(o['No Ujian']),
    username: normalizeNo_(o['Username'] || o['No Ujian']),
    name: o['Nama'] || '',
    package: normalizePackage_(o['Paket']),
    completedExams: normalizeExamList_(o['Completed Exams']),
    status: o['Status'] || '',
    lockedAt: o['First Locked At'] || '',
    lastStartedAt: o['Last Started At'] || '',
    lastSubmittedAt: o['Last Submitted At'] || '',
    updatedAt: o['Updated At'] || '',
    resetAt: o['Reset At'] || '',
    notes: o['Notes'] || ''
  };
}

function writeParticipant_(sheet, participant) {
  const no = normalizeNo_(participant.noUjian || participant.username);
  if (!no) throw new Error('No Ujian kosong.');
  const now = new Date().toISOString();
  let rowNumber = findParticipantRow_(sheet, no);
  const existing = rowNumber > 0 ? readParticipantAtRow_(sheet, rowNumber) : {};
  const merged = {
    noUjian: no,
    username: normalizeNo_(participant.username || existing.username || no),
    name: participant.name !== undefined ? participant.name : (existing.name || ''),
    package: participant.package !== undefined ? normalizePackage_(participant.package) : (existing.package || ''),
    completedExams: participant.completedExams !== undefined ? normalizeExamList_(participant.completedExams) : (existing.completedExams || []),
    status: participant.status !== undefined ? participant.status : (existing.status || ''),
    lockedAt: participant.lockedAt !== undefined ? participant.lockedAt : (existing.lockedAt || ''),
    lastStartedAt: participant.lastStartedAt !== undefined ? participant.lastStartedAt : (existing.lastStartedAt || ''),
    lastSubmittedAt: participant.lastSubmittedAt !== undefined ? participant.lastSubmittedAt : (existing.lastSubmittedAt || ''),
    updatedAt: participant.updatedAt || now,
    resetAt: participant.resetAt !== undefined ? participant.resetAt : (existing.resetAt || ''),
    notes: participant.notes !== undefined ? participant.notes : (existing.notes || '')
  };
  const values = [[
    merged.noUjian,
    merged.username,
    merged.name,
    merged.package,
    merged.completedExams.join('|'),
    merged.status,
    merged.lockedAt,
    merged.lastStartedAt,
    merged.lastSubmittedAt,
    merged.updatedAt,
    merged.resetAt,
    merged.notes
  ]];
  if (rowNumber < 2) {
    sheet.appendRow(values[0]);
  } else {
    sheet.getRange(rowNumber, 1, 1, PARTICIPANT_HEADERS.length).setValues(values);
  }
  return merged;
}

function completedExamKeysFromResults_(noUjian) {
  const no = normalizeNo_(noUjian);
  const keys = resultRows_()
    .filter(r => normalizeNo_(r.noUjian || r.username) === no)
    .map(r => r.examKey)
    .filter(Boolean);
  return Array.from(new Set(keys));
}

function getParticipant_(noUjian, name) {
  const no = normalizeNo_(noUjian);
  const sheet = getOrCreateSheet_('Peserta PMB', PARTICIPANT_HEADERS);
  const rowNumber = findParticipantRow_(sheet, no);
  const fromSheet = rowNumber > 0 ? readParticipantAtRow_(sheet, rowNumber) : {
    noUjian: no,
    username: no,
    name: name || '',
    package: '',
    completedExams: [],
    status: 'NEW',
    lockedAt: '',
    lastStartedAt: '',
    lastSubmittedAt: '',
    updatedAt: '',
    resetAt: '',
    notes: ''
  };

  const relatedResults = resultRows_().filter(r => normalizeNo_(r.noUjian || r.username) === no);
  const completed = Array.from(new Set([
    ...(fromSheet.completedExams || []),
    ...relatedResults.map(r => r.examKey).filter(Boolean)
  ]));
  const lastSubmittedAt = relatedResults
    .map(r => String(r.submittedAt || ''))
    .filter(Boolean)
    .sort()
    .pop() || fromSheet.lastSubmittedAt || '';

  return {
    ...fromSheet,
    name: fromSheet.name || name || '',
    completedExams: completed,
    lastSubmittedAt
  };
}

function deleteResultsForParticipant_(noUjian) {
  const no = normalizeNo_(noUjian);
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Hasil PMB');
  if (!sheet || sheet.getLastRow() < 2) return 0;
  let deleted = 0;
  const values = sheet.getRange(2, 2, sheet.getLastRow() - 1, 2).getValues(); // No Ujian, Username
  for (let i = values.length - 1; i >= 0; i--) {
    const rowNo = normalizeNo_(values[i][0] || values[i][1]);
    if (rowNo === no) {
      sheet.deleteRow(i + 2);
      deleted++;
    }
  }
  return deleted;
}

function resultIdExists_(id) {
  if (!id) return false;
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Hasil PMB');
  if (!sheet || sheet.getLastRow() < 2) return false;
  const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues();
  return values.some(r => String(r[0]) === String(id));
}

function packageAllowsExam_(packageKey, examKey) {
  const pkg = normalizePackage_(packageKey);
  if (!pkg) return true;
  return PACKAGE_EXAMS[pkg].indexOf(String(examKey || '')) !== -1;
}

function handleActivity_(data) {
  const sheet = getOrCreateSheet_('Aktivitas PMB', ACTIVITY_HEADERS);
  sheet.appendRow([
    data.timestamp || new Date().toISOString(),
    normalizeNo_(data.noUjian || data.username || ''),
    normalizeNo_(data.username || data.noUjian || ''),
    data.name || '',
    data.examTitle || data.examKey || '',
    data.eventType || '',
    data.detail || '',
    JSON.stringify(data.proctoring || {})
  ]);
  return output_({ok:true, type:'activity'});
}

function handleResult_(data) {
  const no = normalizeNo_(data.noUjian || data.username || data.participantKey || '');
  if (!no) return output_({ok:false, type:'result', error:'No Ujian kosong.'});

  const lock = LockService.getScriptLock();
  lock.waitLock(8000);
  try {
    const participantSheet = getOrCreateSheet_('Peserta PMB', PARTICIPANT_HEADERS);
    const participant = getParticipant_(no, data.name || '');
    const incomingPackage = normalizePackage_(data.examPackage || participant.package || '');
    const finalPackage = participant.package || incomingPackage;

    if (participant.package && incomingPackage && participant.package !== incomingPackage) {
      return output_({ok:false, type:'result', error:'Paket peserta tidak sesuai dengan paket yang sudah terkunci.'});
    }
    if (finalPackage && !packageAllowsExam_(finalPackage, data.examKey)) {
      return output_({ok:false, type:'result', error:'Mata ujian tidak sesuai dengan paket peserta.'});
    }
    if (resultIdExists_(data.id)) {
      return output_({ok:true, type:'result', duplicate:true});
    }

    const resultSheet = getOrCreateSheet_('Hasil PMB', RESULT_HEADERS);
    resultSheet.appendRow([
      data.id || ('R' + Date.now()),
      no,
      normalizeNo_(data.username || no),
      data.name || participant.name || '',
      finalPackage,
      data.examKey || '',
      data.examTitle || '',
      data.score || 0,
      data.correct || 0,
      data.wrong || 0,
      data.total || 0,
      data.startedAt || '',
      data.submittedAt || new Date().toISOString(),
      data.durationSeconds || 0,
      data.autoSubmitted || false,
      (data.proctoring && data.proctoring.tabHidden) || data.lostFocus || 0,
      JSON.stringify(data.proctoring || {}),
      JSON.stringify(data.details || [])
    ]);

    const completed = Array.from(new Set([...(participant.completedExams || []), String(data.examKey || '')].filter(Boolean)));
    writeParticipant_(participantSheet, {
      noUjian: no,
      username: data.username || no,
      name: data.name || participant.name || '',
      package: finalPackage,
      completedExams: completed,
      status: 'SUBMITTED',
      lockedAt: participant.lockedAt || new Date().toISOString(),
      lastSubmittedAt: data.submittedAt || new Date().toISOString(),
      notes: ''
    });

    return output_({ok:true, type:'result'});
  } finally {
    lock.releaseLock();
  }
}

function doPost(e) {
  try {
    const raw = e && e.postData && e.postData.contents ? e.postData.contents : '{}';
    const data = JSON.parse(raw);
    if (data.type === 'activity') return handleActivity_(data);
    return handleResult_(data);
  } catch (err) {
    return output_({ok:false, error:String(err && err.message ? err.message : err)});
  }
}

function handleLockPackage_(params) {
  const no = normalizeNo_(params.noUjian || params.username || '');
  const packageKey = normalizePackage_(params.package || '');
  if (!no) return output_({ok:false, type:'lockPackage', error:'No Ujian kosong.'});
  if (!packageKey) return output_({ok:false, type:'lockPackage', error:'Paket tidak valid.'});

  const lock = LockService.getScriptLock();
  lock.waitLock(8000);
  try {
    const sheet = getOrCreateSheet_('Peserta PMB', PARTICIPANT_HEADERS);
    const current = getParticipant_(no, params.name || '');
    if (current.package && current.package !== packageKey) {
      return output_({
        ok:false,
        type:'lockPackage',
        error:'Nomor ujian ini sudah terkunci pada paket lain. Hubungi admin untuk reset.',
        participant:current
      });
    }
    const now = new Date().toISOString();
    const updated = writeParticipant_(sheet, {
      noUjian:no,
      username:params.username || no,
      name:params.name || current.name || '',
      package:packageKey,
      completedExams:current.completedExams || [],
      status:'LOCKED',
      lockedAt:current.lockedAt || now,
      lastStartedAt:now,
      resetAt:current.resetAt || '',
      notes:'Package locked by participant'
    });
    return output_({ok:true, type:'lockPackage', participant:updated});
  } finally {
    lock.releaseLock();
  }
}

function handleReset_(params) {
  const adminPassword = String(params.adminPassword || '');
  if (adminPassword !== getAdminPassword_()) {
    return output_({ok:false, type:'reset', error:'Password admin untuk reset tidak valid.'});
  }
  const no = normalizeNo_(params.noUjian || '');
  if (!no) return output_({ok:false, type:'reset', error:'No Ujian kosong.'});

  const lock = LockService.getScriptLock();
  lock.waitLock(8000);
  try {
    const deleted = deleteResultsForParticipant_(no);
    const sheet = getOrCreateSheet_('Peserta PMB', PARTICIPANT_HEADERS);
    const current = getParticipant_(no, '');
    const now = new Date().toISOString();
    const updated = writeParticipant_(sheet, {
      noUjian:no,
      username:current.username || no,
      name:current.name || '',
      package:'',
      completedExams:[],
      status:'RESET_BY_ADMIN',
      lockedAt:'',
      lastStartedAt:'',
      lastSubmittedAt:'',
      resetAt:now,
      notes:`Reset by admin. Deleted results: ${deleted}`
    });
    return output_({ok:true, type:'reset', deletedResults:deleted, participant:updated});
  } finally {
    lock.releaseLock();
  }
}

function handleParticipants_(params) {
  const adminPassword = String(params.adminPassword || '');
  if (adminPassword !== getAdminPassword_()) {
    return output_({ok:false, type:'participants', error:'Password admin tidak valid.'});
  }
  const sheet = getOrCreateSheet_('Peserta PMB', PARTICIPANT_HEADERS);
  const participants = [];
  for (let row = 2; row <= sheet.getLastRow(); row++) {
    const p = readParticipantAtRow_(sheet, row);
    if (p && p.noUjian) participants.push(getParticipant_(p.noUjian, p.name || ''));
  }
  return output_({ok:true, type:'participants', participants});
}

function handleStatus_(params) {
  const no = normalizeNo_(params.noUjian || params.username || '');
  if (!no) return output_({ok:false, type:'status', error:'No Ujian kosong.'});
  return output_({ok:true, type:'status', participant:getParticipant_(no, params.name || '')});
}

function handleActivityList_() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Aktivitas PMB');
  const rows = sheetToObjects_(sheet).map(r => ({
    timestamp: r['Timestamp'] || '',
    noUjian: r['No Ujian'] || '',
    username: r['Username'] || '',
    name: r['Nama'] || '',
    examTitle: r['Ujian'] || '',
    eventType: r['Event'] || '',
    detail: r['Detail'] || '',
    proctoring: safeJson_(r['Proctoring JSON'], {})
  }));
  return output_({ok:true, type:'activity', activity:rows});
}

function handleResults_() {
  return output_({ok:true, type:'results', results:resultRows_()});
}

function doGet(e) {
  try {
    const params = e && e.parameter ? e.parameter : {};
    const action = params.action || 'results';

    if (action === 'ping') return output_({ok:true, type:'ping', time:new Date().toISOString()});
    if (action === 'status') return handleStatus_(params);
    if (action === 'lockPackage') return handleLockPackage_(params);
    if (action === 'reset') return handleReset_(params);
    if (action === 'participants') return handleParticipants_(params);
    if (action === 'activity') return handleActivityList_();

    return handleResults_();
  } catch (err) {
    return output_({ok:false, error:String(err && err.message ? err.message : err)});
  }
}
