'use strict';
/* ═══════════════════════════════════════════════
   ExamShield – app.js v2
   Clean state, Guest/Login, lifecycle, exam timer
═══════════════════════════════════════════════ */

// ─── App State ───────────────────────────────────────────────
const State = {
    mode: 'guest',          // 'guest' | 'logged-in'
    user: null,             // { name, email, role } when logged in
    exams: [],              // array of exam objects
    currentFile: null,
    pageCount: 0,
    uploadTimers: {},       // quizId → setInterval for countdown
};

// Exam statuses (lifecycle)
const STATUS = {
    UPLOADED: 'uploaded',
    PROCESSING: 'processing',
    ENCRYPTED: 'encrypted',
    LOCKED: 'locked',
    READY: 'ready',
    LIVE: 'live',
};

// Map of quizId -> ObjectURL for uploaded PDFs (in-memory only)
const pdfObjectURLs = {};

// Audit events (only populated when logged in)
const auditLog = [];

// ─── Navigation ──────────────────────────────────────────────
const PAGES = {
    dashboard: 'Dashboard',
    upload: 'Upload Paper',
    exams: 'My Exams',
    security: 'Security Audit',
    history: 'Upload History',
    success: 'Upload Complete',
};

function navigate(pageId, navEl) {
    // Gated pages need login
    if ((pageId === 'security' || pageId === 'history') && State.mode !== 'logged-in') {
        openLoginModal('Login to access ' + PAGES[pageId]);
        return false;
    }
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    const target = document.getElementById('page-' + pageId);
    if (target) target.classList.add('active');
    if (navEl) navEl.classList.add('active');

    const bc = document.getElementById('bcCurrent');
    if (bc) bc.textContent = PAGES[pageId] || pageId;

    // Lazy render
    if (pageId === 'dashboard') renderDashboard();
    if (pageId === 'exams') renderExamsPage();
    if (pageId === 'security') renderSecurity();
    if (pageId === 'history') renderHistory();

    return false;
}

function gatedNav(pageId, navEl) {
    if (State.mode !== 'logged-in') {
        openLoginModal('Login to access ' + PAGES[pageId]);
        return false;
    }
    return navigate(pageId, navEl);
}

// ─── Sidebar & Theme ─────────────────────────────────────────
function toggleSidebar() {
    const sb = document.getElementById('sidebar');
    const mn = document.getElementById('main');
    if (window.innerWidth <= 680) {
        sb.classList.toggle('mob-open');
    } else {
        sb.classList.toggle('collapsed');
        mn.classList.toggle('wide');
    }
}

function toggleTheme() {
    const body = document.body;
    const light = body.classList.contains('light-mode');
    body.classList.toggle('dark-mode', light);
    body.classList.toggle('light-mode', !light);
    const ico = document.getElementById('themeIco');
    ico.innerHTML = light
        ? '<path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke="currentColor" stroke-width="1.8" fill="currentColor" fill-opacity="0.1"/>'
        : '<circle cx="12" cy="12" r="5" stroke="currentColor" stroke-width="1.8"/><line x1="12" y1="1" x2="12" y2="3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><line x1="12" y1="21" x2="12" y2="23" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><line x1="1" y1="12" x2="3" y2="12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><line x1="21" y1="12" x2="23" y2="12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>';
}

// ─── Auth / Mode ─────────────────────────────────────────────
function setMode(mode) {
    if (mode === 'login') {
        openLoginModal();
        return;
    }
    applyGuestMode();
}

function applyGuestMode() {
    State.mode = 'guest';
    State.user = null;
    document.getElementById('guestBtn').classList.add('active');
    document.getElementById('loginBtn').classList.remove('active');
    document.getElementById('sidebarUser').innerHTML = '<span class="guest-label">👤 Guest Mode</span>';
    document.querySelectorAll('.nav-locked').forEach(el => el.style.opacity = '');
    addAudit('g', 'Viewing as Guest', 'Audit log and history require login', 'now');
    renderDashboard();
}

function applyLoggedIn(user) {
    State.mode = 'logged-in';
    State.user = user;
    document.getElementById('loginBtn').classList.add('active');
    document.getElementById('guestBtn').classList.remove('active');
    document.getElementById('sidebarUser').innerHTML = `
    <div class="avatar">${initials(user.name)}</div>
    <div><span class="user-name">${user.name}</span><span class="user-role">${user.role}</span></div>`;
    document.querySelectorAll('.nav-locked').forEach(el => el.style.opacity = '1');
    addAudit('g', 'Teacher Logged In', `${user.name} · LTI JWT issued`, 'just now');
    renderDashboard();
}

// Login modal
function openLoginModal(subtitle) {
    const el = document.getElementById('loginModal');
    el.classList.add('open');
    if (subtitle) document.querySelector('#loginModal .modal-sub').textContent = subtitle;
    document.getElementById('loginErr').classList.add('hidden');
}

function closeLoginModal(e) {
    if (e.target === document.getElementById('loginModal')) {
        document.getElementById('loginModal').classList.remove('open');
    }
}
function closeLoginModal2() {
    document.getElementById('loginModal').classList.remove('open');
}

function doLogin() {
    const email = document.getElementById('loginEmail').value.trim();
    const pass = document.getElementById('loginPass').value;

    if (!email || !pass) {
        showErr('loginErr', 'Please enter your email and password.');
        return;
    }
    if (!email.includes('@')) {
        showErr('loginErr', 'Please enter a valid email address.');
        return;
    }
    // Simulate JWT auth — any non-empty credentials pass
    const name = email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const user = { name: 'Prof. ' + name, email, role: 'Senior Examiner' };
    document.getElementById('loginModal').classList.remove('open');
    applyLoggedIn(user);
    toast('Welcome back, ' + user.name + '!', 'success');
}

function showErr(id, msg) {
    const el = document.getElementById(id);
    el.textContent = msg;
    el.classList.remove('hidden');
}

// ─── Dashboard Render ─────────────────────────────────────────
function renderDashboard() {
    const hasExams = State.exams.length > 0;

    // Greeting
    const greeting = State.user
        ? `Good ${timeOfDay()}, ${State.user.name} 👋`
        : 'Welcome to ExamShield';
    const el = document.getElementById('dashGreeting');
    if (el) el.textContent = greeting;

    // Empty state vs content
    toggle('dashEmpty', !hasExams);
    toggle('dashStats', hasExams);
    toggle('dashExamCards', hasExams);

    if (!hasExams) return;

    // Stats
    const total = State.exams.length;
    const encrypted = State.exams.filter(e => [STATUS.ENCRYPTED, STATUS.READY, STATUS.LIVE].includes(e.status)).length;
    const ready = State.exams.filter(e => e.status === STATUS.READY).length;
    const live = State.exams.filter(e => e.status === STATUS.LIVE).length;
    setText('statTotalVal', total);
    setText('statEncVal', encrypted);
    setText('statReadyVal', ready);
    setText('statLiveVal', live);
    setText('sidebarExamCount', total);

    // Exam cards
    const container = document.getElementById('dashExamCards');
    container.innerHTML = State.exams
        .slice().reverse()        // Newest first
        .slice(0, 6)
        .map(examCard).join('');
}

function examCard(exam) {
    const fmtCls = exam.fmt === 'PDF' ? 'pdf' : 'docx';
    const timeEl = exam.examDate ? examTimeInfo(exam) : '';
    const canView = exam.status === STATUS.LIVE || exam.manuallyUnlocked;
    const viewBtn = canView
        ? `<button class="ea-btn view-live" title="View question paper" onclick="event.stopPropagation();openViewPaper('${exam.quizId}')">
           <svg viewBox="0 0 24 24" fill="none" width="15"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.8"/></svg>
           </button>`
        : `<button class="ea-btn ea-lock" title="Locked – click to unlock with key" onclick="event.stopPropagation();openExamDetail('${exam.quizId}')">
           <svg viewBox="0 0 24 24" fill="none" width="14"><rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
           </button>`;
    return `
  <div class="ec" onclick="openExamDetail('${exam.quizId}')">
    <div class="ec-fmt ${fmtCls}">${exam.fmt}</div>
    <div class="ec-main">
      <div class="ec-title">${exam.title}</div>
      <div class="ec-meta">${exam.pages} pages · ${exam.course} · ${exam.uploadedAt}</div>
    </div>
    ${timeEl}
    <div class="ec-status ${exam.status}">${statusLabel(exam.status)}</div>
    <div class="ec-actions">
      ${viewBtn}
      <button class="ea-btn" title="Details" onclick="event.stopPropagation();openExamDetail('${exam.quizId}')">
        <svg viewBox="0 0 24 24" fill="none" width="14"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.8"/><line x1="12" y1="8" x2="12" y2="16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="12" cy="6" r="0.6" fill="currentColor" stroke="currentColor"/></svg>
      </button>
    </div>
  </div>`;
}

function examTimeInfo(exam) {
    const now = Date.now();
    const start = new Date(exam.examDate).getTime();
    const end = start + exam.duration * 60000;
    if (now >= start && now <= end) return '';         // Live – no countdown needed
    if (now < start) {
        const diff = start - now;
        return `<div class="ec-timer">
      <svg viewBox="0 0 24 24" fill="none" width="12"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.8"/><polyline points="12 6 12 12 16 14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
      ${fmtCountdown(diff)}
    </div>`;
    }
    return '';
}

// ─── Exams Page ───────────────────────────────────────────────
function renderExamsPage(q) {
    const container = document.getElementById('examsContent');
    const list = q
        ? State.exams.filter(e =>
            e.title.toLowerCase().includes(q.toLowerCase()) ||
            e.course.toLowerCase().includes(q.toLowerCase()) ||
            e.quizId.toLowerCase().includes(q.toLowerCase()))
        : State.exams;

    if (list.length === 0) {
        container.innerHTML = `
      <div class="exams-empty card">
        <svg viewBox="0 0 60 60" fill="none" width="60" height="60"><circle cx="30" cy="30" r="28" stroke="url(#ee1)" stroke-width="1.5" fill="url(#ee1)" fill-opacity="0.08"/><path d="M30 18v12M24 24l6-6 6 6" stroke="url(#ee1)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><rect x="20" y="33" width="20" height="10" rx="2" fill="url(#ee1)" fill-opacity="0.15" stroke="url(#ee1)" stroke-width="1.5"/><defs><linearGradient id="ee1" x1="2" y1="2" x2="58" y2="58" gradientUnits="userSpaceOnUse"><stop stop-color="#6366f1"/><stop offset="1" stop-color="#8b5cf6"/></linearGradient></defs></svg>
        <div class="empty-title">No question papers uploaded yet</div>
        <p class="empty-sub">Upload your first exam paper to get started.</p>
        <button class="btn-primary" onclick="navigate('upload', document.getElementById('nav-upload'))">
          <svg viewBox="0 0 24 24" fill="none" width="15"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><polyline points="17 8 12 3 7 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><line x1="12" y1="3" x2="12" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
          Upload Question Paper
        </button>
      </div>`;
        return;
    }

    container.innerHTML = `
    <div class="exam-table-wrap">
      <table class="exam-table">
        <thead>
          <tr>
            <th>Exam</th><th>Course</th><th>Pages</th><th>Format</th>
            <th>Encryption</th><th>Status</th><th>Exam Time</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${list.slice().reverse().map(examTableRow).join('')}
        </tbody>
      </table>
    </div>`;
}

function examTableRow(exam) {
    const fmtCls = exam.fmt === 'PDF' ? 'pdf' : 'docx';
    const now = Date.now();
    const start = exam.examDate ? new Date(exam.examDate).getTime() : null;
    const end = start ? start + exam.duration * 60000 : null;

    let timeCell = '—';
    if (start) {
        if (now < start) timeCell = `<div class="et-timer" id="tc-${exam.quizId}">⏳ ${fmtCountdown(start - now)}</div>`;
        else if (end && now <= end) timeCell = `<div class="et-timer" style="color:var(--live)">🔴 LIVE – ${fmtCountdown(end - now)} left</div>`;
        else timeCell = '<span style="color:var(--tx3)">Ended</span>';
    }

    const canView = exam.status === STATUS.LIVE || exam.manuallyUnlocked;
    const viewBtn = canView
        ? `<button class="ab view-live" title="View original paper" onclick="openViewPaper('${exam.quizId}')">
        <svg viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.8"/></svg>
       </button>`
        : `<button class="ab ab-lock" title="Locked – enter key to unlock" onclick="openExamDetail('${exam.quizId}')">
        <svg viewBox="0 0 24 24" fill="none"><rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
       </button>`;

    return `
    <tr>
      <td><div class="et-name">${exam.title}</div><div class="et-id">${exam.quizId}</div></td>
      <td><strong>${exam.course}</strong></td>
      <td>${exam.pages}</td>
      <td><span class="ec-fmt ${fmtCls}" style="width:auto;height:auto;padding:2px 8px;font-size:10px">${exam.fmt}</span></td>
      <td><span style="font-size:11px;font-weight:700;color:var(--ok);background:var(--ok-bg);border:1px solid rgba(16,185,129,.2);padding:2px 8px;border-radius:6px;display:inline-flex;align-items:center;gap:4px"><svg viewBox="0 0 24 24" fill="none" width="10"><rect x="3" y="11" width="18" height="11" rx="2" fill="currentColor" fill-opacity="0.3"/><path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>AES-256-GCM</span></td>
      <td><span class="ec-status ${exam.status}">${statusLabel(exam.status)}</span></td>
      <td>${timeCell}</td>
      <td>
        <div class="action-group">
          ${viewBtn}
          <button class="ab" title="Exam details" onclick="openExamDetail('${exam.quizId}')">
            <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.8"/><line x1="12" y1="8" x2="12" y2="16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="12" cy="6" r="0.6" fill="currentColor" stroke="currentColor"/></svg>
          </button>
          <button class="ab" title="Re-upload" onclick="navigate('upload',document.getElementById('nav-upload'))">
            <svg viewBox="0 0 24 24" fill="none"><polyline points="1 4 1 10 7 10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
          <button class="ab" title="Delete" onclick="deleteExam('${exam.quizId}')" style="color:var(--err)">
            <svg viewBox="0 0 24 24" fill="none"><polyline points="3 6 5 6 21 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M10 11v6M14 11v6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
          </button>
        </div>
      </td>
    </tr>`;
}

function filterExams(q) { renderExamsPage(q); }

function deleteExam(quizId) {
    State.exams = State.exams.filter(e => e.quizId !== quizId);
    clearInterval(State.uploadTimers[quizId]);
    delete State.uploadTimers[quizId];
    renderExamsPage();
    renderDashboard();
    setText('sidebarExamCount', State.exams.length);
    toast('Exam deleted', 'info');
    addAudit('o', 'Exam Record Deleted', quizId, 'just now');
}

// ─── Exam Detail Modal ────────────────────────────────────────
function openExamDetail(quizId) {
    const exam = State.exams.find(e => e.quizId === quizId);
    if (!exam) return;
    const modal = document.getElementById('viewModal');
    document.getElementById('viewModalTitle').textContent = exam.title;

    const now = Date.now();
    const start = exam.examDate ? new Date(exam.examDate).getTime() : null;
    const end = start ? start + exam.duration * 60000 : null;
    const isLive = start && now >= start && now <= end;
    const hasPdf = !!pdfObjectURLs[quizId];

    let countdown = '';
    if (start && now < start) {
        const diff = start - now;
        countdown = `<div class="detail-countdown"><svg viewBox="0 0 24 24" fill="none" width="14"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.8"/><polyline points="12 6 12 12 16 14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>Exam starts in <strong>${fmtCountdown(diff)}</strong></div>`;
    }

    let docPanel;
    if (isLive) {
        docPanel = `
        <div class="doc-state live">
          <div class="ds-icon"><svg viewBox="0 0 24 24" fill="none" width="28"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="rgba(16,185,129,.2)" stroke="#10b981" stroke-width="1.8"/><path d="M9 12l2 2 4-4" stroke="#10b981" stroke-width="1.8" stroke-linecap="round"/></svg></div>
          <div class="ds-label" style="color:var(--ok)">Exam Live – PDF Auto-Unlocked</div>
          <div class="ds-sub">The original uploaded document is now accessible.</div>
          <button class="btn-primary" style="justify-content:center;margin-top:8px" onclick="openViewPaper('${quizId}')">
            <svg viewBox="0 0 24 24" fill="none" width="16"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/></svg>
            View Question Paper
          </button>
        </div>`;
    } else if (exam.manuallyUnlocked && hasPdf) {
        docPanel = `
        <div class="doc-state unlocked">
          <div class="ds-icon"><svg viewBox="0 0 24 24" fill="none" width="28"><rect x="3" y="11" width="18" height="11" rx="2" fill="rgba(99,102,241,.15)" stroke="var(--brand-l)" stroke-width="1.8"/><path d="M7 11V7a5 5 0 0110 0" stroke="var(--brand-l)" stroke-width="1.8" stroke-linecap="round"/></svg></div>
          <div class="ds-label" style="color:var(--brand-l)">🔑 Unlocked with Encryption Key</div>
          <div class="ds-sub">Viewing original uploaded document.</div>
          <button class="btn-primary" style="justify-content:center;margin-top:8px" onclick="openViewPaper('${quizId}')">
            <svg viewBox="0 0 24 24" fill="none" width="16"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/></svg>
            View Original PDF
          </button>
          <button class="btn-ghost" style="justify-content:center;margin-top:6px" onclick="relockExam('${quizId}')">
            <svg viewBox="0 0 24 24" fill="none" width="14"><rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
            Re-lock
          </button>
        </div>`;
    } else {
        docPanel = `
        <div class="doc-state locked">
          <div class="ds-icon"><svg viewBox="0 0 24 24" fill="none" width="32"><rect x="3" y="11" width="18" height="11" rx="2" fill="rgba(245,158,11,.1)" stroke="var(--warn)" stroke-width="1.8"/><path d="M7 11V7a5 5 0 0110 0v4" stroke="var(--warn)" stroke-width="1.8" stroke-linecap="round"/></svg></div>
          <div class="ds-label">🔒 Question paper is encrypted and locked.</div>
          <div class="ds-sub">Paper will auto-unlock when the exam goes live${exam.examDate ? ' at ' + new Date(exam.examDate).toLocaleString('en-IN') : ''}.</div>
          ${hasPdf ? `<button class="btn-ghost" style="justify-content:center;margin-top:10px" onclick="promptUnlockKey('${quizId}')">
            <svg viewBox="0 0 24 24" fill="none" width="14"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
            Unlock with Encryption Key
          </button>` : '<div style="font-size:11.5px;color:var(--tx3);margin-top:8px">Non-PDF file – preview not available before exam</div>'}
        </div>`;
    }

    document.getElementById('viewModalBody').innerHTML = `
    <div style="display:flex;flex-direction:column;gap:14px">
      ${countdown}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div class="card" style="padding:12px"><div style="font-size:10px;font-weight:700;color:var(--tx3);text-transform:uppercase;letter-spacing:.06em">Quiz ID</div><div style="font-family:'JetBrains Mono',monospace;font-size:11.5px;color:var(--brand-l);margin-top:4px">${exam.quizId}</div></div>
        <div class="card" style="padding:12px"><div style="font-size:10px;font-weight:700;color:var(--tx3);text-transform:uppercase;letter-spacing:.06em">Status</div><div style="margin-top:6px"><span class="ec-status ${exam.status}">${statusLabel(exam.status)}</span></div></div>
        <div class="card" style="padding:12px"><div style="font-size:10px;font-weight:700;color:var(--tx3);text-transform:uppercase;letter-spacing:.06em">Pages</div><div style="font-size:24px;font-weight:800;color:var(--tx);margin-top:2px">${exam.pages}</div></div>
        <div class="card" style="padding:12px"><div style="font-size:10px;font-weight:700;color:var(--tx3);text-transform:uppercase;letter-spacing:.06em">Duration</div><div style="font-size:24px;font-weight:800;color:var(--tx);margin-top:2px">${exam.duration}<span style="font-size:13px;font-weight:500;color:var(--tx3)"> min</span></div></div>
      </div>
      ${docPanel}
      <div class="card glass-card" style="padding:14px">
        <div class="sc-head" style="margin-bottom:10px"><svg viewBox="0 0 24 24" fill="none" width="15"><rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>Security Metadata</div>
        <div class="sc-row"><span>Encryption</span><code>AES-256-GCM</code></div>
        <div class="sc-row"><span>Original File</span><code>${exam.originalFileName || exam.fmt}</code></div>
        <div class="sc-row"><span>Session Key</span><code>${exam.sessionKey}</code></div>
        <div class="sc-row"><span>SHA-256 Hash</span><code style="font-size:9.5px;word-break:break-all">${exam.hash}</code></div>
        <div class="sc-row"><span>S3 Object Key</span><code style="font-size:9.5px;word-break:break-all">${exam.s3Key}</code></div>
        <div class="sc-row"><span>Uploaded At</span><code>${exam.uploadedAt}</code></div>
      </div>
    </div>`;
    modal.classList.add('open');
}

function closeViewModal(e) {
    if (e.target === document.getElementById('viewModal')) {
        document.getElementById('viewModal').classList.remove('open');
    }
}

// ─── Prompt Key Unlock ────────────────────────────────────────
function promptUnlockKey(quizId) {
    const exam = State.exams.find(e => e.quizId === quizId);
    if (!exam) return;
    // Show key input inside modal body
    document.getElementById('viewModalBody').innerHTML += `
    <div class="key-unlock-box" id="keyUnlockBox">
      <div class="kub-title"><svg viewBox="0 0 24 24" fill="none" width="16"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" stroke="var(--brand-l)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>Enter Encryption Key to Unlock</div>
      <div style="display:flex;gap:8px;margin-top:10px">
        <div class="fi-wrap" style="flex:1"><input id="keyInput" class="fi" type="text" placeholder="${exam.sessionKey.substring(0,4)}••••••••" style="padding-left:12px;font-family:'JetBrains Mono',monospace;font-size:12px"/></div>
        <button class="btn-primary" onclick="verifyKeyAndUnlock('${quizId}')">
          <svg viewBox="0 0 24 24" fill="none" width="14"><path d="M5 12l5 5L20 7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Verify
        </button>
      </div>
      <div style="font-size:11px;color:var(--tx3);margin-top:6px">Hint: your session key is shown in Security Metadata above.</div>
    </div>`;
    document.getElementById('keyInput').focus();
}

function verifyKeyAndUnlock(quizId) {
    const exam = State.exams.find(e => e.quizId === quizId);
    if (!exam) return;
    const input = document.getElementById('keyInput');
    if (!input) return;
    if (input.value.trim() === exam.sessionKey) {
        exam.manuallyUnlocked = true;
        toast('🔑 Key verified! Document unlocked.', 'success');
        addAudit('p', 'Manual Key Unlock', exam.title + ' · Teacher verified encryption key', 'just now');
        document.getElementById('viewModal').classList.remove('open');
        setTimeout(() => openExamDetail(quizId), 250);
    } else {
        input.style.borderColor = 'var(--err)';
        toast('❌ Incorrect encryption key.', 'error');
    }
}

function relockExam(quizId) {
    const exam = State.exams.find(e => e.quizId === quizId);
    if (!exam) return;
    exam.manuallyUnlocked = false;
    toast('🔒 Document re-locked.', 'info');
    addAudit('b', 'Document Re-locked', exam.title, 'just now');
    document.getElementById('viewModal').classList.remove('open');
    setTimeout(() => openExamDetail(quizId), 250);
}

// ─── View Paper (Teacher, Exam Live or Manually Unlocked) ──────
function openViewPaper(quizId) {
    const exam = State.exams.find(e => e.quizId === quizId);
    if (!exam) return;

    const now = Date.now();
    const start = exam.examDate ? new Date(exam.examDate).getTime() : null;
    const end = start ? start + exam.duration * 60000 : null;
    const isLive = start && now >= start && now <= end;
    const canView = isLive || exam.manuallyUnlocked;

    if (!canView) {
        toast('🔒 Document is locked until exam time.', 'warn');
        return;
    }

    const pdfUrl = pdfObjectURLs[quizId];
    const statusStr = isLive ? '🔴 LIVE' : '🔑 Key-Unlocked';
    document.getElementById('viewModalTitle').textContent = '🔓 ' + exam.title;

    let viewerHtml;
    if (pdfUrl) {
        viewerHtml = `
        <div class="pdf-viewer-wrap">
          <div class="pdf-status-bar">
            <span class="psb-dot"></span>
            Viewing original uploaded PDF &nbsp;·&nbsp; <strong>${exam.originalFileName}</strong> &nbsp;·&nbsp; ${statusStr}
          </div>
          <iframe class="pdf-iframe" src="${pdfUrl}" title="Question Paper"></iframe>
        </div>`;
    } else {
        // Non-PDF fallback with page previews
        const pages = [];
        for (let i = 1; i <= Math.min(exam.pages, 12); i++) {
            const lw = [80,60,75,50,70,85,40,65,72,55];
            const linesHtml = lw.slice(0,7).map(w => `<div class="tl" style="width:${w}%"></div>`).join('');
            pages.push(`<div class="paper-page"><div class="pp-num">Page ${i}</div>${linesHtml}</div>`);
        }
        const remaining = exam.pages > 12 ? `<div style="text-align:center;color:var(--tx3);font-size:12px;padding:8px">+${exam.pages - 12} more pages</div>` : '';
        viewerHtml = `<div class="view-notice">📄 ${statusStr} – Viewing question paper. (PDF viewer requires original PDF upload.)</div><div class="paper-pages">${pages.join('')}</div>${remaining}`;
    }

    document.getElementById('viewModalBody').innerHTML = viewerHtml;
    document.getElementById('viewModal').classList.add('open');
    addAudit('o', 'Teacher Viewed Original Paper', exam.title + ' · ' + statusStr, 'just now');
}

// ─── Security & History Pages ─────────────────────────────────
function renderSecurity() {
    const logEl = document.getElementById('auditLogEl');
    if (!logEl) return;
    const entries = auditLog.length
        ? auditLog.slice().reverse().slice(0, 20)
        : [{ dot: 'b', action: 'System Ready', detail: 'AES-256-GCM active · SHA-256 hash ready · AWS S3 online', time: 'now' }];
    logEl.innerHTML = entries.map(e => `
    <div class="al-row">
      <div class="al-dot ${e.dot}"></div>
      <div><div class="al-action">${e.action}</div><div class="al-detail">${e.detail}</div></div>
      <div class="al-time">${e.time}</div>
    </div>`).join('');
}

function renderHistory() {
    const el = document.getElementById('historyEl');
    if (!el) return;
    if (State.exams.length === 0) {
        el.innerHTML = '<div class="card" style="text-align:center;padding:40px;color:var(--tx3)">No upload history yet. Upload your first exam paper.</div>';
        return;
    }
    const sorted = State.exams.slice().sort((a, b) => b.createdAt - a.createdAt);
    el.innerHTML = sorted.map(exam => `
    <div class="tl-entry">
      <div class="tl-date">${new Date(exam.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
      <div class="tl-card" onclick="openExamDetail('${exam.quizId}')">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px">
          <div class="tl-title">${exam.title}</div>
          <span class="ec-status ${exam.status}">${statusLabel(exam.status)}</span>
        </div>
        <div class="tl-meta">
          <span>${exam.pages} pages</span>
          <span>${exam.fmt}</span>
          <span>${exam.course}</span>
          <span>AES-256-GCM</span>
        </div>
        <div style="font-family:'JetBrains Mono',monospace;font-size:9.5px;color:var(--tx3);margin-top:6px;word-break:break-all">${exam.hash.substring(0, 40)}…</div>
      </div>
    </div>`).join('');
}

// ─── Upload Form ──────────────────────────────────────────────
let currentFile = null;
let pageCount = 0;

function vf(input) {
    if (input.value.trim().length > 0) input.classList.add('valid');
    else input.classList.remove('valid');
}

function onDragOver(e) { e.preventDefault(); document.getElementById('dropZone').classList.add('over'); }
function onDragLeave(e) { e.preventDefault(); document.getElementById('dropZone').classList.remove('over'); }
function onDrop(e) { e.preventDefault(); document.getElementById('dropZone').classList.remove('over'); const f = e.dataTransfer.files[0]; if (f) processFile(f); }
function onFileSelect(e) { const f = e.target.files[0]; if (f) processFile(f); }

function processFile(file) {
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['pdf', 'docx', 'doc'].includes(ext)) { toast('Invalid file type. Use PDF, DOCX or DOC.', 'error'); return; }
    if (file.size > 52428800) { toast('File too large. Max 50 MB.', 'error'); return; }

    currentFile = file;
    pageCount = Math.floor(Math.random() * 42) + 8;
    const sizeMB = (file.size / 1048576).toFixed(1);

    // File card
    document.getElementById('fileIco').innerHTML = fileIcon(ext);
    document.getElementById('fileNameTxt').textContent = file.name;
    document.getElementById('fileSizeTxt').textContent = sizeMB + ' MB';
    document.getElementById('filePagesTxt').textContent = 'Detecting pages…';
    document.getElementById('fileHash').textContent = 'SHA-256: computing…';
    document.getElementById('fileCard').classList.remove('hidden');

    setTimeout(() => {
        document.getElementById('filePagesTxt').textContent = pageCount + ' pages';
        document.getElementById('fileHash').textContent = 'SHA-256: ' + randHash(64);
        renderThumbs(pageCount);
        document.getElementById('sKeyDisp').textContent = 'sk-' + randHex(8);
        document.getElementById('sKeyDisp').classList.remove('dim');
    }, 900);
}

function fileIcon(ext) {
    const color = ext === 'pdf' ? '#ef4444' : '#3b82f6';
    const bg = ext === 'pdf' ? 'rgba(239,68,68,.12)' : 'rgba(59,130,246,.12)';
    return `<div style="width:40px;height:40px;border-radius:9px;background:${bg};display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;color:${color};">${ext.toUpperCase()}</div>`;
}

function renderThumbs(count) {
    const grid = document.getElementById('thumbGrid');
    grid.innerHTML = '';
    const show = Math.min(count, 6);
    for (let i = 1; i <= show; i++) {
        grid.innerHTML += `
      <div class="thumb-item" onclick="toast('Page ${i} – secure non-selectable view','info')" title="Page ${i}">
        <div class="tl" style="width:82%"></div><div class="tl m"></div><div class="tl" style="width:68%"></div>
        <div class="tl s"></div><div class="tl m"></div><div class="tl" style="width:74%"></div>
        <div class="thumb-lk"><svg viewBox="0 0 24 24" fill="none" width="8"><rect x="5" y="11" width="14" height="9" rx="1.5" fill="white"/><path d="M8 11V7a4 4 0 018 0v4" stroke="white" stroke-width="2" stroke-linecap="round"/></svg></div>
        <div class="thumb-pg">Pg ${i}</div>
      </div>`;
    }
    if (count > 6) {
        grid.innerHTML += `<div class="thumb-item" style="justify-content:center"><div style="font-size:11px;color:var(--tx3);font-weight:700;text-align:center">+${count - 6}<br>more</div></div>`;
    }
    document.getElementById('thumbCard').classList.remove('hidden');
}

function removeFile() {
    currentFile = null; pageCount = 0;
    document.getElementById('fileCard').classList.add('hidden');
    document.getElementById('thumbCard').classList.add('hidden');
    document.getElementById('sKeyDisp').textContent = 'Not generated';
    document.getElementById('sKeyDisp').classList.add('dim');
    document.getElementById('fileIn').value = '';
    toast('File removed', 'info');
}

function saveDraft() { toast('Draft saved locally', 'success'); }

function startUpload() {
    const quizId = document.getElementById('fQuizId').value.trim();
    const course = document.getElementById('fCourse').value.trim();
    const title = document.getElementById('fTitle').value.trim();
    const dateVal = document.getElementById('fDate').value;
    const duration = parseInt(document.getElementById('fDuration').value, 10);

    if (!quizId || !course || !title) { toast('Fill in all required exam details.', 'error'); return; }
    if (!currentFile) { toast('Please select a question paper file.', 'error'); return; }

    // Show pipeline
    document.getElementById('cardPipeline').classList.remove('hidden');
    document.getElementById('uploadActions').style.display = 'none';
    document.getElementById('cardPipeline').scrollIntoView({ behavior: 'smooth', block: 'start' });

    simulatePipeline({ quizId, course, title, dateVal, duration });
}

const STEPS = [
    { id: 1, label: 'Uploading to backend…', pct: 18, ms: 900 },
    { id: 2, label: 'Python: converting pages…', pct: 40, ms: 1400 },
    { id: 3, label: 'AES-256-GCM encrypting…', pct: 62, ms: 1100 },
    { id: 4, label: 'SHA-256 fingerprinting…', pct: 82, ms: 800 },
    { id: 5, label: 'Storing to AWS S3…', pct: 96, ms: 1000 },
];

function simulatePipeline(meta) {
    let i = 0;
    // Reset all steps
    for (let n = 1; n <= 5; n++) {
        document.getElementById(`ps${n}`).classList.remove('active', 'done');
        document.getElementById(`pst${n}`).innerHTML = '<div class="pipe-pend"></div>';
    }

    const tick = () => {
        if (i >= STEPS.length) { setTimeout(() => finalizeUpload(meta), 600); return; }
        const s = STEPS[i];
        // Mark previous done
        if (i > 0) {
            document.getElementById(`ps${STEPS[i - 1].id}`).classList.remove('active');
            document.getElementById(`ps${STEPS[i - 1].id}`).classList.add('done');
            document.getElementById(`pst${STEPS[i - 1].id}`).innerHTML = checkSvg();
        }
        document.getElementById(`ps${s.id}`).classList.add('active');
        document.getElementById(`pst${s.id}`).innerHTML = '<div class="pipe-spin"></div>';
        setProg(s.label, s.pct);
        i++; setTimeout(tick, s.ms);
    };
    tick();
}

function finalizeUpload(meta) {
    // Mark step 5 done
    document.getElementById('ps5').classList.remove('active');
    document.getElementById('ps5').classList.add('done');
    document.getElementById('pst5').innerHTML = checkSvg();
    setProg('Upload complete!', 100);

    const hash = randHash(64);
    const sessKey = 'sk-' + randHex(8) + '-' + randHex(4);
    const s3Key = `exam-questions/${meta.course}/${new Date().getFullYear()}/${meta.quizId}/${randId(10)}.enc`;
    const now = new Date();
    const timeStr = now.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    // Preserve the original uploaded PDF as an ObjectURL
    if (currentFile && currentFile.type === 'application/pdf') {
        if (pdfObjectURLs[meta.quizId]) URL.revokeObjectURL(pdfObjectURLs[meta.quizId]);
        pdfObjectURLs[meta.quizId] = URL.createObjectURL(currentFile);
    }

    // Determine initial status
    const examDate = meta.dateVal ? new Date(meta.dateVal).getTime() : null;
    const startsDiff = examDate ? examDate - Date.now() : null;
    let status = STATUS.LOCKED;
    if (startsDiff !== null && startsDiff <= 0) status = STATUS.LIVE;

    // Save exam
    const examObj = {
        quizId: meta.quizId, course: meta.course, title: meta.title,
        examDate: meta.dateVal, duration: meta.duration || 180,
        fmt: currentFile ? currentFile.name.split('.').pop().toUpperCase() : 'PDF',
        originalFileName: currentFile ? currentFile.name : '',
        pages: pageCount, hash, sessionKey: sessKey, s3Key,
        uploadedAt: timeStr, status,
        createdAt: now.getTime(),
        manuallyUnlocked: false,
    };
    State.exams.push(examObj);
    setText('sidebarExamCount', State.exams.length);

    addAudit('g', 'Upload Encrypted & Locked', meta.title + ' · AES-256-GCM · ' + sessKey, timeStr);
    addAudit('b', 'Stored to AWS S3', s3Key, timeStr);
    addAudit('p', 'SHA-256 Hash Generated', hash.substring(0, 20) + '…', timeStr);

    // Start lifecycle timer
    if (examDate && status === STATUS.LOCKED) startLifecycleTimer(meta.quizId, examDate, meta.duration || 180);

    // Populate success page
    document.getElementById('smTitle').textContent = meta.title;
    document.getElementById('smQuizId').textContent = meta.quizId;
    document.getElementById('smS3').textContent = s3Key;
    document.getElementById('smHash').textContent = hash.substring(0, 20) + '…' + hash.substring(52);
    document.getElementById('smPages').textContent = pageCount + ' pages (encrypted)';
    document.getElementById('smTime').textContent = timeStr;

    setTimeout(() => {
        navigate('success', null);
        document.querySelector('.main').scrollTo({ top: 0, behavior: 'smooth' });
    }, 600);
}

function startLifecycleTimer(quizId, startMs, durationMin) {
    const checkFn = () => {
        const now = Date.now();
        const end = startMs + durationMin * 60000;
        const exam = State.exams.find(e => e.quizId === quizId);
        if (!exam) { clearInterval(State.uploadTimers[quizId]); return; }

        if (now >= startMs && now <= end && exam.status !== STATUS.LIVE) {
            exam.status = STATUS.LIVE;
            exam.manuallyUnlocked = false;
            toast('🔴 Exam is now LIVE: ' + exam.title, 'warn');
            addAudit('o', 'Exam Started — Auto-Unlocked', exam.title + ' · PDF decrypted at exam time', 'now');
            renderDashboard();
            renderExamsPage();
        } else if (now > end && exam.status === STATUS.LIVE) {
            exam.status = STATUS.READY;
            clearInterval(State.uploadTimers[quizId]);
            toast('Exam ended: ' + exam.title, 'info');
            renderDashboard();
            renderExamsPage();
        }
    };
    State.uploadTimers[quizId] = setInterval(checkFn, 5000);
    checkFn();
}

function setProg(label, pct) {
    document.getElementById('progLbl').textContent = label;
    document.getElementById('progPct').textContent = pct + '%';
    document.getElementById('progFill').style.width = pct + '%';
}

function checkSvg() {
    return `<div class="pipe-check"><svg viewBox="0 0 24 24" fill="none" width="9"><path d="M20 6L9 17l-5-5" stroke="white" stroke-width="2.5" stroke-linecap="round"/></svg></div>`;
}

function resetUpload() {
    document.getElementById('cardPipeline').classList.add('hidden');
    document.getElementById('uploadActions').style.display = '';
    document.getElementById('fileCard').classList.add('hidden');
    document.getElementById('thumbCard').classList.add('hidden');
    ['fQuizId', 'fCourse', 'fTitle', 'fDate', 'fDuration'].forEach(id => {
        const el = document.getElementById(id);
        el.value = '';
        el.classList.remove('valid');
    });
    document.getElementById('fileIn').value = '';
    document.getElementById('sKeyDisp').textContent = 'Not generated';
    document.getElementById('sKeyDisp').classList.add('dim');
    setProg('Uploading…', 0);
    currentFile = null; pageCount = 0;
    for (let n = 1; n <= 5; n++) {
        document.getElementById(`ps${n}`)?.classList.remove('active', 'done');
        const st = document.getElementById(`pst${n}`);
        if (st) st.innerHTML = '<div class="pipe-pend"></div>';
    }
}

// ─── Toast ────────────────────────────────────────────────────
function toast(msg, type = 'info') {
    document.querySelectorAll('.toast-el').forEach(t => t.remove());
    const colors = {
        success: ['var(--ok-bg)', 'rgba(16,185,129,.3)', 'var(--ok)'],
        error: ['var(--err-bg)', 'rgba(239,68,68,.3)', 'var(--err)'],
        info: ['var(--brand-glow)', 'rgba(99,102,241,.3)', 'var(--brand-l)'],
        warn: ['var(--warn-bg)', 'rgba(245,158,11,.3)', 'var(--warn)'],
    };
    const [bg, bd, color] = colors[type] || colors.info;
    const el = document.createElement('div');
    el.className = 'toast-el';
    el.innerHTML = `<div style="position:fixed;bottom:22px;right:22px;z-index:9999;background:${bg};border:1px solid ${bd};color:${color};padding:11px 16px;border-radius:11px;font-size:13.5px;font-weight:600;box-shadow:0 8px 30px rgba(0,0,0,.25);display:flex;align-items:center;gap:9px;max-width:360px;font-family:'Inter',sans-serif;backdrop-filter:blur(8px);animation:toastIn 220ms cubic-bezier(.4,0,.2,1)both">${toastIco(type)}${msg}</div>`;
    if (!document.getElementById('toastKF')) {
        const s = document.createElement('style');
        s.id = 'toastKF';
        s.textContent = '@keyframes toastIn{from{transform:translateX(110%);opacity:0}to{transform:none;opacity:1}}';
        document.head.appendChild(s);
    }
    document.body.appendChild(el);
    setTimeout(() => {
        const inner = el.querySelector('div');
        if (inner) { inner.style.transition = 'all .3s'; inner.style.opacity = '0'; inner.style.transform = 'translateX(110%)'; }
        setTimeout(() => el.remove(), 320);
    }, 3500);
}

function toastIco(type) {
    if (type === 'success') return '<svg viewBox="0 0 24 24" fill="none" width="16" style="flex-shrink:0"><path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>';
    if (type === 'error') return '<svg viewBox="0 0 24 24" fill="none" width="16" style="flex-shrink:0"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.8"/><line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
    if (type === 'warn') return '<svg viewBox="0 0 24 24" fill="none" width="16" style="flex-shrink:0"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" stroke-width="1.8"/><line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="17" r=".6" fill="currentColor" stroke="currentColor"/></svg>';
    return '<svg viewBox="0 0 24 24" fill="none" width="16" style="flex-shrink:0"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.8"/><line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="12" cy="16" r=".6" fill="currentColor" stroke="currentColor"/></svg>';
}

// ─── Helpers ─────────────────────────────────────────────────
function toggle(id, show) {
    const el = document.getElementById(id);
    if (!el) return;
    show ? el.classList.remove('hidden') : el.classList.add('hidden');
}
function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}
function randHex(n) {
    return Array.from({ length: n }, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('');
}
function randHash(n) { return randHex(n); }
function randId(n) { return Array.from({ length: n }, () => Math.random().toString(36)[2]).join(''); }
function initials(name) { return name.split(' ').slice(-2).map(w => w[0]).join('').toUpperCase(); }
function timeOfDay() {
    const h = new Date().getHours();
    return h < 12 ? 'Morning' : h < 17 ? 'Afternoon' : 'Evening';
}
function statusLabel(s) {
    return {
        uploaded: 'Uploaded',
        processing: 'Processing',
        encrypted: 'Encrypted',
        locked: '🔒 Locked',
        ready: '✓ Exam Ready',
        live: '🔴 Exam Live'
    }[s] || s;
}
function fmtCountdown(ms) {
    if (ms < 0) return 'now';
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    const d = Math.floor(h / 24);
    if (d > 0) return `${d}d ${h % 24}h`;
    if (h > 0) return `${h}h ${m % 60}m`;
    if (m > 0) return `${m}m ${s % 60}s`;
    return s + 's';
}
function addAudit(dot, action, detail, time) {
    auditLog.push({ dot, action, detail, time });
    if (auditLog.length > 50) auditLog.shift();
}

// ─── Init ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    applyGuestMode();
    navigate('dashboard', document.getElementById('nav-dashboard'));
    setText('sidebarExamCount', '0');

    // Close modals on Escape
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            document.getElementById('loginModal').classList.remove('open');
            document.getElementById('viewModal').classList.remove('open');
        }
    });
});
