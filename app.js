(() => {
  'use strict';

  const STORAGE = {
    students: 'ecakep_students_v2',
    teachers: 'ecakep_teachers_v2',
    violations: 'ecakep_violations_v2',
    users: 'ecakep_users_v2',
    settings: 'ecakep_settings_v2'
  };

  const API_VERSION = 33;
  const APP_VERSION = '3.3';
  const APPS_SCRIPT_URL = String(window.ECAKEP_CONFIG?.APPS_SCRIPT_URL || '').trim();
  const POINTS = { Ringan: 5, Sedang: 10, Berat: 15 };
  const VIOLATIONS_BY_CLASS = {
    Ringan: [
      'Datang terlambat ke Sekolah',
      'Tidak membawa KARTU PELAJAR',
      'Tidak membawa buku CAKEP',
      'Tidak memakai seragam sesuai ketentuan sekolah',
      'Seragam tidak rapi',
      'Ke sekolah memakai sandal/sepatu sandal ketika jam aktif sekolah',
      'Tidak memakai sepatu ketika jam aktif sekolah maupun pulang sekolah',
      'Duduk di meja guru',
      'Keluar kelas tanpa izin',
      'Makan di kelas waktu KBM berlangsung',
      'Tidur di kelas saat KBM berlangsung',
      'Mengacau/mengganggu kondusivitas kelas baik kelas sendiri maupun kelas lain',
      'Berbicara kotor atau menghina orang lain',
      'Makan dan/atau minum sambil berdiri atau berjalan',
      'Menggunakan HP saat KBM tanpa seijin guru pengajar',
      'Mencontek/kerjasama dalam bentuk apapun pada saat ujian berlangsung',
      'Membaca komik/novel/bacaan lain yang tidak terkait dengan pembelajaran saat KBM berlangsung',
      'Tidak membawa buku yang sesuai dengan mata pelajaran (buku tulis maupun buku paket)',
      'Menggunakan dan atau membawa make up',
      'Menggunakan soft lens',
      'Menggunakan eyelash extension',
      'Memakai kutex/cat kuku',
      'Datang terlambat saat KBM tanpa alasan yang dapat dipertanggungjawabkan',
      'Tidak mengikuti KBM tanpa ijin',
      'Tidak mengerjakan tugas sekolah/pekerjaan rumah',
      'Tidak memakai atribut seragam dengan lengkap',
      'Membuang sampah tidak pada tempatnya',
      'Rambut panjang dan tidak sesuai dengan peraturan sekolah',
      'Memakai gelang, kalung, dan anting bagi peserta didik putra',
      'Memakai perhiasan secara berlebihan bagi peserta didik putri',
      'Pelanggaran lainnya'
    ],
    Sedang: [
      'Menggunakan/membuat surat ijin (keterangan) palsu',
      'Membolos/tidak masuk sekolah tanpa ijin',
      'Keluar lingkungan sekolah/pulang sebelum waktunya tanpa ijin',
      'Mencorat-coret tembok, bangku dan fasilitas lainnya pada lingkungan sekolah',
      'Tidak mengikuti apel rutin maupun peringatan hari nasional tanpa ijin',
      'Tidak mengikuti kegiatan hari besar keagamaan tanpa ijin',
      'Bersikap tidak sopan/menentang kepala sekolah, guru, dan pegawai sekolah lainnya',
      'Melecehkan simbol-simbol (identitas) sekolah, merusak logo, lagu mars dan hymne SMP ISLAM ALHUDA BRONDONG',
      'Melakukan sesuatu yang mengancam keselamatan orang lain dan diri sendiri',
      'Menyalahgunakan uang sekolah/kas kelas',
      'Mengecat rambut selain warna hitam',
      'Berbohong kepada guru atau orang tua',
      'Pelanggaran lainnya'
    ],
    Berat: [
      'Memalsu tanda tangan pejabat sekolah',
      'Membawa/menggunakan/menjual/mengedarkan obat terlarang dan atau minuman keras (beralkohol)',
      'Menjadi anggota perkumpulan anak-anak nakal (geng motor maupun geng terlarang lainnya)',
      'Berkelahi/main hakim sendiri/kekerasan fisik/melakukan penganiayaan',
      'Membawa, membaca atau mengedarkan buku, gambar dan media lainnya yang berbau pornografi',
      'Mencuri di sekolah dan/atau di luar sekolah',
      'Berurusan dengan pihak berwajib karena kenakalan remaja/kejahatan/kriminal',
      'Berjudi dalam bentuk apapun baik online maupun offline',
      'Dengan sengaja merusak sarana dan prasarana sekolah',
      'Membawa senjata tajam/alat berkelahi yang lain',
      'Melakukan segala jenis aktivitas yang tidak masuk akal dan bertentangan dengan syariat islam',
      'Merokok di dalam atau di luar sekolah',
      'Membawa/menggunakan/memperjualbelikan vapor (liquid) sejenisnya',
      'Menikah/menghamili/dihamili/berbuat asusila',
      'Mengambil milik/hak milik orang lain/pemalakan/mencuri',
      'Bertato permanen maupun non permanen',
      'Memakai anting (khusus peserta didik putra)',
      'Mengintimidasi kepala sekolah/guru/karyawan/sesama teman',
      'Pelanggaran lainnya'
    ]
  };
  let scannerStream = null;
  let scannerActive = false;
  const DEFAULT_ADMIN = {
    id: 'admin-default', username: 'admin', nama: 'Administrator', role: 'Admin', teacherId: '', studentId: '', kelas: '', aktif: true, password: 'admin123',
    passwordHash: '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9'
  };

  const HAD_V2_STUDENTS = Boolean(localStorage.getItem(STORAGE.students));

  const state = {
    students: migrateLocalStudents(load(STORAGE.students, load('ecakep_students_v1', []))),
    teachers: load(STORAGE.teachers, load('ecakep_teachers_v1', [])),
    violations: migrateLocalViolations(load(STORAGE.violations, load('ecakep_violations_v1', []))),
    users: load(STORAGE.users, [DEFAULT_ADMIN]),
    settings: load(STORAGE.settings, load('ecakep_settings_v1', { apiUrl: '' })),
    online: false,
    server: { configured: false, editable: false, apiUrl: '' },
    photoCache: new Map(), photoLoading: new Set(),
    currentView: 'dashboard', modalMode: null, editingId: null, selectedStudentProfileId: '', syncing: false,
    auth: { token: sessionStorage.getItem('ecakep_token') || '', user: JSON.parse(sessionStorage.getItem('ecakep_user') || 'null') },
    appLogo: localStorage.getItem('ecakep_app_logo') || 'assets/logo-ecakep.svg'
  };

  if (!state.users.length) state.users = [DEFAULT_ADMIN];
  if (!HAD_V2_STUDENTS) backfillLocalLegacyPoints();
  save(STORAGE.students, state.students); save(STORAGE.teachers, state.teachers); save(STORAGE.violations, state.violations); save(STORAGE.users, state.users);

  const titles = {
    dashboard: ['Pencatatan Kedisiplinan', 'Catat pelanggaran siswa dan kurangi poin secara otomatis.'],
    homeroom: ['Dashboard Wali Kelas', 'Pantau kondisi kedisiplinan siswa per kelas.'],
    history: ['Riwayat Pelanggaran', 'Lihat, cetak, cari, dan kelola catatan kedisiplinan.'],
    studentprofile: ['Profil Siswa', 'Informasi pribadi, foto, poin, dan riwayat pelanggaran siswa.'],
    students: ['Data Siswa', 'Kelola master siswa dan poin kedisiplinan.'],
    teachers: ['Data Guru', 'Kelola master data guru E-CAKEP.'],
    settings: ['Pengaturan', 'Status koneksi Google Spreadsheet dan Google Drive.'],
    users: ['Pengguna', 'Kelola akun Admin, Guru, dan Siswa serta hak akses aplikasi.'],
    studentportal: ['Profil Saya', 'Lihat ringkasan poin dan riwayat kedisiplinan Anda.']
  };

  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));

  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    bindNavigation(); bindForm(); bindStudents(); bindTeachers(); bindHistory(); bindHomeroom(); bindStudentProfile(); bindStudentPortal(); bindSettings(); bindModal(); bindUsers(); bindLogin(); bindMassPhotoInputs();
    updateClock(); setInterval(updateClock, 1000);
    state.online = false;
    await loadCentralServerConfig();
    await loadAppLogo();
    if (state.auth.token) {
      try {
        const res=await apiPost('session',{}), json=await parseApiJson(res);
        if (json.ok && json.user) { state.auth.user=json.user; saveSession(json.token||state.auth.token,json.user); enterApp(); refreshAll(); await syncFromServer(false); return; }
      } catch (_) {}
      clearSession();
    }
    showLogin();
  }

  function showLogin() {
    $('#loginScreen')?.classList.remove('hidden'); $('#appShell')?.classList.add('hidden');
    const s=$('#loginStatus'); if(s) s.textContent=state.server.configured?'Silakan masuk dengan akun Anda.':'URL Apps Script belum dikonfigurasi.';
    $('#loginUsername')?.focus();
  }
  function enterApp() {
    $('#loginScreen')?.classList.add('hidden'); $('#appShell')?.classList.remove('hidden');
    applyRoleUi(); renderCurrentUserAvatar(); switchView('dashboard');
    updateSyncUi(Boolean(state.server.configured && state.online), state.server.configured ? (state.online ? 'Terhubung' : 'Menghubungkan') : 'Belum dikonfigurasi');
  }
  function currentUser() { return state.auth.user; }
  function isAdmin() { return String(state.auth.user?.role||'') === 'Admin'; }
  function isStudentRole() { return String(state.auth.user?.role||'') === 'Siswa'; }
  function isStaff() { return ['Admin','Guru'].includes(String(state.auth.user?.role||'')); }
  function canView(view){ if(isAdmin())return true; if(isStudentRole())return view==='studentportal'; return ['dashboard','homeroom','history','students'].includes(view); }
  function linkedStudent() { const id=state.auth.user?.studentId; return id?state.students.find(s=>s.id===id)||null:null; }
  function renderCurrentUserAvatar() {
    const u=currentUser(); if(!u)return;
    const name=u.nama||u.username||'A';
    if($('#currentUserName'))$('#currentUserName').textContent=name;
    if($('#currentUserRole'))$('#currentUserRole').textContent=u.role||'Pengguna';
    if($('#currentUserAvatar'))$('#currentUserAvatar').textContent=initials(name);
  }
  function saveSession(token,user){state.auth={token,user};sessionStorage.setItem('ecakep_token',token);sessionStorage.setItem('ecakep_user',JSON.stringify(user));}
  function clearSession(){state.auth={token:'',user:null};sessionStorage.removeItem('ecakep_token');sessionStorage.removeItem('ecakep_user');}
  function bindLogin(){
    $('#loginForm')?.addEventListener('submit', async e=>{e.preventDefault();const btn=$('#loginBtn'),status=$('#loginStatus');btn.disabled=true;btn.textContent='Memeriksa...';status.textContent='Memvalidasi akun...';
      try{const username=String($('#loginUsername').value||'').trim(),password=String($('#loginPassword').value||'');if(!username||!password)throw new Error('Username dan password wajib diisi.');
        const json=await parseApiJson(await apiPost('login',{username,password}));if(!json.ok)throw new Error(json.message||'Login gagal.');
        saveSession(json.token,json.user);state.online=true;enterApp();refreshAll();await syncFromServer(false);status.textContent='Login berhasil.';
      }catch(err){status.textContent=err.message||'Login gagal.';toast('Login gagal',err.message||'Periksa username dan password.','error');}
      finally{btn.disabled=false;btn.textContent='Masuk';}
    });
    $('#togglePassword')?.addEventListener('click',()=>{const p=$('#loginPassword');p.type=p.type==='password'?'text':'password';});
    $('#logoutBtn')?.addEventListener('click',logout);
    $('#accountProfileBtn')?.addEventListener('click',showAccountProfile);
  }
  function showAccountProfile(){const u=currentUser();if(!u)return;const s=linkedStudent();const t=u.teacherId?state.teachers.find(x=>x.id===u.teacherId):null;const lines=[];lines.push(`<div class="profile-account-card">${avatarHtml(u.role==='Guru'?'teacher':u.role==='Siswa'?'student':'',u.role==='Guru'?t?.id:u.role==='Siswa'?s?.id:'',u.nama,'profile-avatar-lg')}<div><span class="eyebrow">PROFIL PENGGUNA</span><h3>${escHtml(u.nama)}</h3><p>${escHtml(u.role)} • @${escHtml(u.username)}</p></div></div>`);if(t)lines.push(`<div class="profile-info-grid"><div class="profile-info-item"><span>Jabatan</span><strong>${escHtml(t.jabatan||'-')}</strong></div><div class="profile-info-item"><span>Alamat</span><strong>${escHtml(t.alamat||'-')}</strong></div></div>`);if(s)lines.push(`<div class="profile-info-grid"><div class="profile-info-item"><span>NISN</span><strong>${escHtml(s.nisn)}</strong></div><div class="profile-info-item"><span>Kelas</span><strong>${escHtml(s.kelas)}</strong></div></div>`);const box=document.createElement('div');box.className='modal-backdrop';box.innerHTML=`<div class="modal"><div class="modal-head"><div><span class="eyebrow">AKUN</span><h3>Profil Saya</h3></div><button class="icon-btn" type="button">✕</button></div><div class="modal-body">${lines.join('')}<div class="modal-actions"><button class="btn secondary" type="button" data-profile-print-account>Cetak Profil</button><button class="btn primary" type="button" data-close-profile>Tutup</button></div></div></div>`;document.body.appendChild(box);box.querySelector('.icon-btn').onclick=()=>box.remove();box.querySelector('[data-close-profile]').onclick=()=>box.remove();box.querySelector('[data-profile-print-account]').onclick=()=>{if(s)printStudentProfile(s.id);else{toast('Profil siap','Gunakan halaman cetak untuk profil siswa atau simpan profil guru dari browser.','success');}}; }
  function logout(){clearSession();state.online=false;$('#appShell')?.classList.add('hidden');showLogin();$('#loginPassword').value='';toast('Anda telah keluar','Sesi E-CAKEP ditutup.','success');}

  function applyRoleUi() {
    const admin = isAdmin(), studentRole = isStudentRole();
    $$('.admin-only').forEach(el => el.classList.toggle('hidden', !admin));
    $$('.admin-only-control').forEach(el => el.classList.toggle('hidden', !admin));
    $$('.admin-only-inline').forEach(el => el.classList.toggle('hidden', !admin));
    $$('.staff-only').forEach(el => el.classList.toggle('hidden', studentRole));
    $$('.student-only').forEach(el => el.classList.toggle('hidden', !studentRole));
    if(studentRole) $$('.nav-item').forEach(el => el.classList.toggle('hidden', el.dataset.view !== 'studentportal'));
    renderTeacherOptions();
    applyAppLogo();
  }

  function bindNavigation() {
    $$('.nav-item').forEach(btn => btn.addEventListener('click', () => switchView(btn.dataset.view)));
    $$('[data-go]').forEach(btn => btn.addEventListener('click', () => switchView(btn.dataset.go)));
    $('#menuBtn').addEventListener('click', openSidebar); $('#overlay').addEventListener('click', closeSidebar);
    $('#syncNowBtn').addEventListener('click', () => syncFromServer(true));
  }

  function switchView(view) {
    if (!titles[view]) view = 'dashboard';
    if (!canView(view)) view = isStudentRole() ? 'studentportal' : 'dashboard';
    state.currentView = view;
    $$('.view').forEach(v => v.classList.toggle('active', v.id === `view-${view}`));
    $$('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.view === view || (view === 'studentprofile' && n.dataset.view === 'students')));
    if ($('#pageTitle')) $('#pageTitle').textContent = titles[view][0];
    if ($('#pageSubtitle')) $('#pageSubtitle').textContent = titles[view][1];
    closeSidebar();
    if (view === 'dashboard') renderDashboard();
    if (view === 'homeroom') renderHomeroom();
    if (view === 'history') renderHistory();
    if (view === 'students') renderStudents();
    if (view === 'studentprofile') renderStudentProfile();
    if (view === 'studentportal') renderStudentPortal();
    if (view === 'teachers') renderTeachers();
    if (view === 'settings') renderSettingsStatus();
    if (view === 'users') renderUsers();
  }
  function openSidebar() { $('#sidebar').classList.add('open'); $('#overlay').classList.add('show'); }
  function closeSidebar() { $('#sidebar').classList.remove('open'); $('#overlay').classList.remove('show'); }

  function bindForm() {
    $('#studentSearchInput').addEventListener('input', filterStudentSuggestions);
    $('#studentSearchInput').addEventListener('focus', filterStudentSuggestions);
    $('#studentSearchInput').addEventListener('keydown', handleStudentSearchKeydown);
    $('#classification').addEventListener('change', updatePointPreview);
    $('#violationForm').addEventListener('submit', saveViolation);
    $('#resetViolationBtn').addEventListener('click', () => setTimeout(() => { clearStudentSelection(); updatePointPreview(); updateClock(); }, 0));
    $('#chartYear').addEventListener('change', renderMonthlyChart);
    $('#scanStudentQrBtn').addEventListener('click', startQrScanner);
    $('#closeScannerBtn').addEventListener('click', stopQrScanner);
    $('#scannerBackdrop').addEventListener('click', e => { if (e.target === $('#scannerBackdrop')) stopQrScanner(); });
    document.addEventListener('click', e => { if (!e.target.closest('.student-picker')) hideStudentSuggestions(); });
  }

  async function saveViolation(e) {
    e.preventDefault();
    const student = state.students.find(s => s.id === $('#studentSelect').value); const teacher = state.teachers.find(t => t.id === $('#teacherSelect').value);
    if (!student || !teacher) return toast('Data belum lengkap', 'Pilih siswa dan guru terlebih dahulu.', 'error');
    const classification = $('#classification').value; const deduction = pointFor(classification);
    if (!deduction) return toast('Klasifikasi belum dipilih', 'Pilih Ringan, Sedang, atau Berat.', 'error');
    const violationType = $('#violationType').value.trim();
    if (!violationType || !(VIOLATIONS_BY_CLASS[classification] || []).includes(violationType)) return toast('Jenis pelanggaran belum dipilih', 'Pilih jenis pelanggaran yang sesuai dengan klasifikasi.', 'error');
    const now = new Date(); const before = Number.isFinite(Number(student.poin)) ? Number(student.poin) : 100; const remaining = Math.max(0, before - deduction);
    const item = { id: uid(), studentId: student.id, teacherId: teacher.id, nama: student.nama, guru: teacher.nama, nisn: student.nisn, jenisKelamin: student.jenisKelamin, kelas: student.kelas, klasifikasi: classification, pointPotongan: deduction, sisaPoin: remaining, jenisPelanggaran: violationType, keterangan: $('#notes').value.trim(), tanggal: formatDateISO(now), waktu: formatTime(now), createdAt: now.toISOString() };
    student.poin = remaining; student.updatedAt = now.toISOString();
    state.violations.unshift(item); persistCore(); refreshAll();
    $('#violationForm').reset(); clearStudentSelection(); updatePointPreview(); updateClock();
    toast('Pelanggaran tersimpan', `${item.nama} • -${deduction} poin • sisa ${remaining}`, 'success');
    const result = await pushAction('saveViolation', { data: item }, true);
    if (result?.violation) { const i=state.violations.findIndex(v=>v.id===result.violation.id); if(i>=0) state.violations[i]=result.violation; save(STORAGE.violations,state.violations); }
    if (result?.student) updateStudentFromServer(result.student);
  }

  function fillStudentIdentity() {
    const s = state.students.find(x => x.id === $('#studentSelect').value);
    $('#nisn').value = s?.nisn || ''; $('#gender').value = s?.jenisKelamin || ''; $('#className').value = s?.kelas || ''; $('#studentPoint').value = s ? normalizePoint(s.poin) : '';
  }
  function updatePointPreview() {
    $('#pointDeductionPreview').value = pointFor($('#classification').value) || 0;
    renderViolationTypeOptions();
  }
  function renderViolationTypeOptions() {
    const select = $('#violationType'); const cls = $('#classification').value; const list = VIOLATIONS_BY_CLASS[cls] || [];
    const previous = select.value; select.disabled = !list.length;
    select.innerHTML = list.length ? '<option value="">Pilih jenis pelanggaran...</option>' + list.map(v => `<option value="${escAttr(v)}">${escHtml(v)}</option>`).join('') : '<option value="">Pilih klasifikasi terlebih dahulu...</option>';
    if (list.includes(previous)) select.value = previous;
  }

  function studentLabel(s) { return `${s.nama} — NISN ${s.nisn} — ${s.kelas}`; }
  function setSelectedStudent(id) {
    const s = state.students.find(x => x.id === id); if (!s) return false;
    $('#studentSelect').value = s.id; $('#studentSearchInput').value = studentLabel(s); hideStudentSuggestions(); fillStudentIdentity(); return true;
  }
  function clearStudentSelection() {
    $('#studentSelect').value = ''; $('#studentSearchInput').value = ''; hideStudentSuggestions(); fillStudentIdentity();
  }
  function filterStudentSuggestions() {
    const input = $('#studentSearchInput'); const box = $('#studentSuggestions'); const q = input.value.trim().toLowerCase();
    const selected = state.students.find(s => s.id === $('#studentSelect').value);
    if (!selected || input.value !== studentLabel(selected)) $('#studentSelect').value = '';
    const rows = [...state.students].sort(sortByName).filter(s => !q || [s.nama,s.nisn,s.kelas].join(' ').toLowerCase().includes(q)).slice(0,10);
    if (!rows.length) { box.innerHTML = '<div class="suggestion-empty">Siswa tidak ditemukan.</div>'; box.classList.remove('hidden'); fillStudentIdentity(); return; }
    box.innerHTML = rows.map(s => `<button type="button" class="student-suggestion" data-student-suggest="${escAttr(s.id)}"><strong>${escHtml(s.nama)}</strong><span>NISN ${escHtml(s.nisn)} • ${escHtml(s.kelas)} • ${normalizePoint(s.poin)} poin</span></button>`).join('');
    box.classList.remove('hidden');
    $$('[data-student-suggest]').forEach(b => b.onclick = () => setSelectedStudent(b.dataset.studentSuggest));
    fillStudentIdentity();
  }
  function hideStudentSuggestions() { $('#studentSuggestions').classList.add('hidden'); }
  function handleStudentSearchKeydown(e) {
    if (e.key !== 'Enter') return; const first = $('#studentSuggestions [data-student-suggest]'); if (!first) return; e.preventDefault(); setSelectedStudent(first.dataset.studentSuggest);
  }

  async function startQrScanner() {
    if (!navigator.mediaDevices?.getUserMedia) return toast('Kamera tidak tersedia', 'Browser/perangkat ini tidak menyediakan akses kamera.', 'error');
    if (!('BarcodeDetector' in window)) return toast('Scan QR belum didukung', 'Gunakan pencarian manual, atau buka E-CAKEP dengan Chrome/Edge yang mendukung BarcodeDetector.', 'error');
    try {
      stopQrScanner(false); $('#scannerBackdrop').classList.remove('hidden'); $('#scannerStatus').textContent = 'Meminta akses kamera...';
      scannerStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
      const video = $('#scannerVideo'); video.srcObject = scannerStream; await video.play(); scannerActive = true; $('#scannerStatus').textContent = 'Arahkan kamera ke QR code pada kartu siswa.';
      const detector = new BarcodeDetector({ formats: ['qr_code'] });
      const scan = async () => {
        if (!scannerActive) return;
        try {
          const codes = await detector.detect(video);
          if (codes?.length) { const raw = codes[0].rawValue || ''; const student = findStudentFromQr(raw); if (student) { setSelectedStudent(student.id); stopQrScanner(); toast('Siswa ditemukan', `${student.nama} • ${student.nisn}`, 'success'); return; } $('#scannerStatus').textContent = `QR terbaca tetapi siswa tidak ditemukan: ${raw.slice(0,80)}`; }
        } catch (_) {}
        if (scannerActive) requestAnimationFrame(scan);
      };
      requestAnimationFrame(scan);
    } catch (err) { stopQrScanner(); toast('Kamera gagal dibuka', err?.message || 'Periksa izin kamera pada browser.', 'error'); }
  }
  function stopQrScanner(hide = true) {
    scannerActive = false; if (scannerStream) scannerStream.getTracks().forEach(t => t.stop()); scannerStream = null; const video = $('#scannerVideo'); if (video) video.srcObject = null; if (hide && $('#scannerBackdrop')) $('#scannerBackdrop').classList.add('hidden');
  }
  function findStudentFromQr(raw) {
    const text = String(raw || '').trim(); if (!text) return null; const candidates = [text];
    try { const obj = JSON.parse(text); ['nisn','NISN','nama','Nama','name','studentName'].forEach(k => { if (obj?.[k] != null) candidates.push(String(obj[k]).trim()); }); } catch (_) {}
    const nisnMatch = text.match(/nisn\s*[:=]\s*([0-9]+)/i); if (nisnMatch) candidates.push(nisnMatch[1]);
    const nameMatch = text.match(/nama\s*[:=]\s*([^;|,\n]+)/i); if (nameMatch) candidates.push(nameMatch[1].trim());
    for (const c of candidates) { const norm = c.toLowerCase(); const found = state.students.find(s => String(s.nisn).trim() === c.trim() || String(s.nama).trim().toLowerCase() === norm); if (found) return found; }
    return null;
  }
  function updateClock() { const now = new Date(); $('#dateField').value = new Intl.DateTimeFormat('id-ID',{day:'2-digit',month:'2-digit',year:'numeric'}).format(now); $('#timeField').value = formatTime(now); $('#todayChip').textContent = new Intl.DateTimeFormat('id-ID',{weekday:'short',day:'2-digit',month:'short',year:'numeric'}).format(now); }

  function bindStudents() {
    $('#addStudentBtn').addEventListener('click', () => openEntityModal('student')); $('#studentSearch').addEventListener('input', renderStudents);
    $('#studentClassFilter').addEventListener('change', renderStudents); $('#studentSort').addEventListener('change', renderStudents);
    $('#importStudentExcelBtn').addEventListener('click', () => $('#studentExcelInput').click()); $('#studentExcelInput').addEventListener('change', importStudentsExcel);
    $('#downloadStudentTemplateBtn').addEventListener('click', downloadStudentTemplate); $('#downloadStudentsExcelBtn').addEventListener('click', downloadStudentsExcel); $('#resetAllPointsBtn').addEventListener('click', resetAllPoints);
  }
  function bindTeachers() {
    $('#addTeacherBtn').addEventListener('click', () => openEntityModal('teacher')); $('#teacherSearch').addEventListener('input', renderTeachers);
    $('#importTeacherExcelBtn').addEventListener('click', () => $('#teacherExcelInput').click()); $('#teacherExcelInput').addEventListener('change', importTeachersExcel); $('#downloadTeacherTemplateBtn').addEventListener('click', downloadTeacherTemplate);
  }
  function bindUsers() { $('#addUserBtn').addEventListener('click', () => openEntityModal('user')); $('#userSearch').addEventListener('input', renderUsers); $('#importUserExcelBtn').addEventListener('click',()=>$('#userExcelInput').click()); $('#userExcelInput').addEventListener('change',importUsersExcel); $('#downloadUserTemplateBtn').addEventListener('click',downloadUserTemplate); }
  function bindHistory() { $('#historySearch').addEventListener('input', renderHistory); $('#historyClassFilter').addEventListener('change', renderHistory); $('#historyClassificationFilter').addEventListener('change', renderHistory); $('#exportHistoryBtn').addEventListener('click', exportHistoryExcel); }
  function bindHomeroom() { $('#homeroomClassSelect').addEventListener('change', renderHomeroom); }
  function bindStudentProfile() {
    $('#backToStudentsBtn').addEventListener('click', () => switchView('students'));
    $('#downloadProfileExcelBtn').addEventListener('click', () => { if (state.selectedStudentProfileId) downloadStudentRecapById(state.selectedStudentProfileId); });
    $('#profileEditStudentBtn').addEventListener('click', () => { if (isAdmin() && state.selectedStudentProfileId) openEntityModal('student', state.selectedStudentProfileId); });
    $('#profileResetStudentBtn').addEventListener('click', () => { if (isAdmin() && state.selectedStudentProfileId) resetStudentPoints(state.selectedStudentProfileId); });
    $('#studentProfilePhotoBtn').addEventListener('click', () => $('#studentProfilePhotoInput').click());
    $('#studentProfilePhotoInput').addEventListener('change', async e => { const file=e.target.files?.[0]; e.target.value=''; if(file&&state.selectedStudentProfileId) await uploadProfilePhoto('student',state.selectedStudentProfileId,file); });
    $('#studentProfilePhotoDeleteBtn').addEventListener('click', () => { if(state.selectedStudentProfileId) deleteProfilePhoto('student',state.selectedStudentProfileId); });
  }
  function bindStudentPortal() { $('#downloadMyRecapBtn')?.addEventListener('click',()=>{const s=linkedStudent();if(s)printStudentProfile(s.id);}); }

  function bindSettings() {
    $('#saveSettingsBtn')?.addEventListener('click', () => toast('Konfigurasi otomatis','URL Apps Script dibaca dari config.js.','success'));
    $('#testConnectionBtn')?.addEventListener('click', testConnection);
    $('#restoreLocalBtn')?.addEventListener('click', restoreLocalSnapshotToServer);
    $('#appLogoInput')?.addEventListener('change', handleAppLogoUpload);
    $('#resetAppLogoBtn')?.addEventListener('click', resetAppLogo);
  }
  function bindModal() { $('#closeModalBtn').addEventListener('click', closeModal); $('#modalBackdrop').addEventListener('click', e => { if (e.target === $('#modalBackdrop')) closeModal(); }); document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); }); }

  function openEntityModal(type, id = null) {
    if (!isAdmin() && ['student','teacher','user'].includes(type)) return;
    state.modalMode = type; state.editingId = id; const isEdit = Boolean(id); const form = $('#entityForm');
    if (type === 'student') {
      const d = isEdit ? state.students.find(x => x.id === id) : {};
      $('#modalEyebrow').textContent='DATA SISWA'; $('#modalTitle').textContent=`${isEdit?'Ubah':'Tambah'} Siswa`;
      form.innerHTML = `<div class="profile-upload-field"><div class="profile-avatar profile-avatar-lg" id="modalPhotoPreview">${avatarInnerHtml('student',d?.id,d?.nama||'S')}</div><div><strong>Foto Profil</strong><p>Opsional. Hanya Admin yang dapat mengubah foto.</p><input type="file" name="foto" accept="image/jpeg,image/png,image/webp"><small>Maksimal 1 MB. Foto akan diperkecil otomatis.</small></div></div><div class="field"><label>Nama <b>*</b></label><input name="nama" required value="${escAttr(d?.nama||'')}"></div><div class="field"><label>NISN <b>*</b></label><input name="nisn" required inputmode="numeric" value="${escAttr(d?.nisn||'')}"></div><div class="field"><label>Jenis Kelamin <b>*</b></label><select name="jenisKelamin" required><option value="">Pilih...</option><option ${d?.jenisKelamin==='Laki-laki'?'selected':''}>Laki-laki</option><option ${d?.jenisKelamin==='Perempuan'?'selected':''}>Perempuan</option></select></div><div class="field"><label>Kelas <b>*</b></label><input name="kelas" required value="${escAttr(d?.kelas||'')}"></div>${isEdit?`<div class="field"><label>Poin Saat Ini</label><input readonly value="${normalizePoint(d?.poin)}"><small>Poin hanya berubah melalui pelanggaran atau tombol reset.</small></div>`:''}<div class="modal-actions"><button type="button" class="btn secondary" data-cancel>Batal</button><button type="submit" class="btn primary">${isEdit?'Simpan Perubahan':'Tambah Siswa'}</button></div>`;
    } else if (type === 'teacher') {
      const d = isEdit ? state.teachers.find(x => x.id === id) : {};
      $('#modalEyebrow').textContent='DATA GURU'; $('#modalTitle').textContent=`${isEdit?'Ubah':'Tambah'} Guru`;
      form.innerHTML = `<div class="profile-upload-field"><div class="profile-avatar profile-avatar-lg" id="modalPhotoPreview">${avatarInnerHtml('teacher',d?.id,d?.nama||'G')}</div><div><strong>Foto Profil</strong><p>Opsional. Foto tampil pada akun Guru yang ditautkan.</p><input type="file" name="foto" accept="image/jpeg,image/png,image/webp"><small>Maksimal 1 MB. Foto akan diperkecil otomatis.</small></div></div><div class="field"><label>Nama <b>*</b></label><input name="nama" required value="${escAttr(d?.nama||'')}"></div><div class="field"><label>Alamat <b>*</b></label><textarea name="alamat" required rows="3">${escHtml(d?.alamat||'')}</textarea></div><div class="field"><label>Jabatan <b>*</b></label><input name="jabatan" required value="${escAttr(d?.jabatan||'')}" placeholder="Contoh: Wali Kelas 8A"></div><div class="modal-actions"><button type="button" class="btn secondary" data-cancel>Batal</button><button type="submit" class="btn primary">${isEdit?'Simpan Perubahan':'Tambah Guru'}</button></div>`;
    } else {
      const d = isEdit ? state.users.find(x => x.id === id) : {}; const teacherOptions = state.teachers.map(t=>`<option value="${escAttr(t.id)}" ${d?.teacherId===t.id?'selected':''}>${escHtml(t.nama)} — ${escHtml(t.jabatan||'-')}</option>`).join(''); const studentOptions=state.students.map(st=>`<option value="${escAttr(st.id)}" ${d?.studentId===st.id?'selected':''}>${escHtml(st.nama)} — ${escHtml(st.nisn)} — ${escHtml(st.kelas)}</option>`).join('');
      $('#modalEyebrow').textContent='AKUN PENGGUNA'; $('#modalTitle').textContent=`${isEdit?'Ubah':'Tambah'} Akun`;
      form.innerHTML = `<div class="field"><label>Username <b>*</b></label><input name="username" required value="${escAttr(d?.username||'')}" autocomplete="off"></div><div class="field"><label>Nama Pengguna <b>*</b></label><input name="nama" required value="${escAttr(d?.nama||'')}"></div><div class="field"><label>Role <b>*</b></label><select name="role" required><option value="Admin" ${d?.role==='Admin'?'selected':''}>Admin</option><option value="Guru" ${d?.role==='Guru'?'selected':''}>Guru</option><option value="Siswa" ${d?.role==='Siswa'?'selected':''}>Siswa</option></select></div><div class="field"><label>Tautkan ke Data Guru</label><select name="teacherId"><option value="">Tidak ditautkan</option>${teacherOptions}</select><small>Wajib untuk role Guru.</small></div><div class="field"><label>Tautkan ke Data Siswa</label><select name="studentId"><option value="">Tidak ditautkan</option>${studentOptions}</select><small>Wajib untuk role Siswa.</small></div><div class="field"><label>Kelas Wali</label><input name="kelas" value="${escAttr(d?.kelas||'')}" placeholder="Contoh: 8A"><small>Digunakan untuk Dashboard Wali Kelas pada akun Guru.</small></div><div class="field"><label>Password ${isEdit?'(kosongkan jika tidak diubah)':'*'}</label><input type="password" name="password" ${isEdit?'':'required'} autocomplete="new-password" minlength="6"></div><div class="field switch-field"><label><input type="checkbox" name="aktif" ${d?.aktif===false?'':'checked'}> Akun aktif</label></div><div class="modal-actions"><button type="button" class="btn secondary" data-cancel>Batal</button><button type="submit" class="btn primary">${isEdit?'Simpan Perubahan':'Tambah Akun'}</button></div>`;
    }
    form.onsubmit = saveEntity; form.querySelector('[data-cancel]').addEventListener('click', closeModal); const photoInput=form.querySelector('input[name="foto"]'); if(photoInput){photoInput.addEventListener('change',()=>{const file=photoInput.files?.[0];if(!file)return;if(file.size>1024*1024){toast('Foto terlalu besar','Ukuran maksimal foto adalah 1 MB.','error');photoInput.value='';return;}if(!/^image\/(jpeg|png|webp)$/i.test(file.type)){toast('Format foto tidak didukung','Gunakan JPG, PNG, atau WebP.','error');photoInput.value='';return;}const url=URL.createObjectURL(file),preview=$('#modalPhotoPreview');if(preview){preview.innerHTML=`<img src="${url}" alt="Pratinjau foto"><span class="avatar-fallback">${escHtml(initials(state.modalMode==='student'?(state.students.find(x=>x.id===state.editingId)?.nama||'S'):(state.teachers.find(x=>x.id===state.editingId)?.nama||'G')))}</span>`;preview.querySelector('img').onload=()=>URL.revokeObjectURL(url);}});} $('#modalBackdrop').classList.remove('hidden'); setTimeout(()=>form.querySelector('input:not([type=file]),select,textarea')?.focus(),50);
  }

  async function saveEntity(e) {
    e.preventDefault(); const fd = new FormData(e.currentTarget); const now = new Date().toISOString();
    if (state.modalMode === 'student') {
      const existing = state.students.find(x=>x.id===state.editingId); const item = { id: state.editingId||uid(), nama:String(fd.get('nama')).trim(), nisn:String(fd.get('nisn')).trim(), jenisKelamin:String(fd.get('jenisKelamin')).trim(), kelas:String(fd.get('kelas')).trim(), poin:existing?normalizePoint(existing.poin):100, resetAt:existing?.resetAt||'', updatedAt:now, photoId:existing?.photoId||'' };
      if (state.students.some(s=>s.nisn===item.nisn&&s.id!==item.id)) return toast('NISN sudah ada','Gunakan NISN yang berbeda.','error');
      const photoFile=e.currentTarget.querySelector('input[name="foto"]')?.files?.[0]||null;
      upsertLocal(state.students,item); state.students.sort(sortByName); save(STORAGE.students,state.students); await pushAction('saveStudent',{data:item},true); if(photoFile) await uploadProfilePhoto('student',item.id,photoFile,false); toast('Data siswa disimpan',item.nama,'success');
    } else if (state.modalMode === 'teacher') {
      const existing=state.teachers.find(x=>x.id===state.editingId); const item={id:state.editingId||uid(),nama:String(fd.get('nama')).trim(),alamat:String(fd.get('alamat')).trim(),jabatan:String(fd.get('jabatan')).trim(),updatedAt:now,photoId:existing?.photoId||''}; const photoFile=e.currentTarget.querySelector('input[name="foto"]')?.files?.[0]||null; upsertLocal(state.teachers,item); state.teachers.sort(sortByName); save(STORAGE.teachers,state.teachers); await pushAction('saveTeacher',{data:item},true); if(photoFile) await uploadProfilePhoto('teacher',item.id,photoFile,false); toast('Data guru disimpan',item.nama,'success');
    } else {
      const username=String(fd.get('username')).trim(); if(state.users.some(u=>u.username.toLowerCase()===username.toLowerCase()&&u.id!==state.editingId)) return toast('Username sudah digunakan','Pilih username lain.','error');
      const existing=state.users.find(x=>x.id===state.editingId); const password=String(fd.get('password')||''); const item={id:state.editingId||uid(),username,nama:String(fd.get('nama')).trim(),role:String(fd.get('role')),teacherId:String(fd.get('teacherId')||''),studentId:String(fd.get('studentId')||''),kelas:String(fd.get('kelas')||'').trim(),aktif:fd.get('aktif')==='on',passwordHash:password?await sha256(password):(existing?.passwordHash||''),password:password||existing?.password||'',updatedAt:now};
      if(item.role==='Guru'&&!item.teacherId) return toast('Guru belum ditautkan','Pilih Data Guru untuk akun dengan role Guru.','error'); if(item.role==='Siswa'&&!item.studentId) return toast('Siswa belum ditautkan','Pilih Data Siswa untuk akun Siswa.','error'); if(!existing && !item.passwordHash) return toast('Password diperlukan','Masukkan password minimal 6 karakter.','error');
      upsertLocal(state.users,item); save(STORAGE.users,state.users); const payload={data:{...sanitizeUser(item),password:password||''}}; const res=await pushAction('saveUser',payload,false); if(res===null&&state.server.configured) toast('Akun tersimpan lokal','Sinkronisasi akun ke server belum berhasil.','error'); else toast('Akun disimpan',item.username,'success');
    }
    closeModal(); refreshAll();
  }
  function closeModal(){ $('#modalBackdrop').classList.add('hidden'); state.modalMode=null; state.editingId=null; }

  async function deleteStudent(id){ if(!isAdmin())return; const s=state.students.find(x=>x.id===id); if(!s||!confirm(`Hapus data siswa ${s.nama}? Riwayat pelanggaran tidak ikut dihapus.`))return; state.students=state.students.filter(x=>x.id!==id); save(STORAGE.students,state.students); refreshAll(); await pushAction('deleteStudent',{id},false); toast('Data siswa dihapus',s.nama,'success'); }
  async function deleteTeacher(id){ if(!isAdmin())return; const t=state.teachers.find(x=>x.id===id); if(!t||!confirm(`Hapus data guru ${t.nama}?`))return; state.teachers=state.teachers.filter(x=>x.id!==id); save(STORAGE.teachers,state.teachers); refreshAll(); await pushAction('deleteTeacher',{id},false); toast('Data guru dihapus',t.nama,'success'); }
  async function deleteUser(id){ if(!isAdmin())return; const u=state.users.find(x=>x.id===id); if(!u)return; if(u.id===currentUser()?.id)return toast('Tidak dapat menghapus akun aktif','Logout dan gunakan akun admin lain.','error'); if(!confirm(`Hapus akun ${u.username}?`))return; state.users=state.users.filter(x=>x.id!==id); save(STORAGE.users,state.users); refreshAll(); await pushAction('deleteUser',{id},false); toast('Akun dihapus',u.username,'success'); }

  async function deleteViolation(id){ if(!isAdmin()) return toast('Akses ditolak','Hanya Admin yang dapat menghapus riwayat pelanggaran.','error'); const v=state.violations.find(x=>x.id===id); if(!v||!confirm(`Hapus catatan pelanggaran ${v.nama}? Poin akan dikembalikan bila catatan dibuat setelah reset terakhir.`))return; const s=state.students.find(x=>x.id===v.studentId); if(s && (!s.resetAt || String(v.createdAt)>=String(s.resetAt))) s.poin=Math.min(100,normalizePoint(s.poin)+Number(v.pointPotongan||pointFor(v.klasifikasi))); state.violations=state.violations.filter(x=>x.id!==id); persistCore(); refreshAll(); const res=await pushAction('deleteViolation',{id},false); if(res?.student)updateStudentFromServer(res.student); toast('Catatan dihapus',v.nama,'success'); }

  async function resetStudentPoints(id){ if(!isAdmin())return; const s=state.students.find(x=>x.id===id); if(!s||!confirm(`Reset poin ${s.nama} menjadi 100? Riwayat tetap disimpan.`))return; const now=new Date().toISOString(); s.poin=100;s.resetAt=now;s.updatedAt=now;save(STORAGE.students,state.students);refreshAll();const res=await pushAction('resetStudentPoints',{id},false);if(res?.student)updateStudentFromServer(res.student);toast('Poin direset',`${s.nama} kembali ke 100 poin.`,'success'); }
  async function resetAllPoints(){ if(!isAdmin()||!state.students.length)return; if(!confirm(`Reset poin SEMUA ${state.students.length} siswa menjadi 100? Riwayat pelanggaran tetap disimpan.`))return; const now=new Date().toISOString(); state.students.forEach(s=>{s.poin=100;s.resetAt=now;s.updatedAt=now;});save(STORAGE.students,state.students);refreshAll();await pushAction('resetAllStudentPoints',{},false);toast('Semua poin direset','Seluruh siswa kembali ke 100 poin.','success'); }

  function refreshAll(){ renderStudentOptions();renderTeacherOptions();renderDashboard();renderStudentClassFilter();renderStudents();renderTeachers();renderHistoryFilters();renderHistory();renderHomeroomClassOptions();renderHomeroom();renderStudentProfile();renderSettingsStatus();applyRoleUi();setTimeout(()=>hydrateProfilePhotos(document),0);}
  function renderStudentOptions(){ const current=$('#studentSelect').value;const selected=state.students.find(s=>s.id===current);if(selected){$('#studentSearchInput').value=studentLabel(selected);}else{$('#studentSelect').value='';if(!document.activeElement?.isSameNode($('#studentSearchInput')))$('#studentSearchInput').value='';}fillStudentIdentity(); }
  function renderTeacherOptions(){ const current=$('#teacherSelect').value;const sorted=[...state.teachers].sort(sortByName);$('#teacherSelect').innerHTML='<option value="">Pilih guru...</option>'+sorted.map(t=>`<option value="${escAttr(t.id)}">${escHtml(t.nama)}${t.jabatan?` — ${escHtml(t.jabatan)}`:''}</option>`).join(''); const u=currentUser(); if(!isAdmin()&&u?.teacherId&&sorted.some(t=>t.id===u.teacherId)){ $('#teacherSelect').value=u.teacherId; $('#teacherSelect').disabled=true; } else { $('#teacherSelect').disabled=false;if(sorted.some(t=>t.id===current))$('#teacherSelect').value=current; } }

  function renderDashboard(){ $('#statStudents').textContent=state.students.length;$('#statTeachers').textContent=state.teachers.length;$('#statViolations').textContent=state.violations.length;const today=formatDateISO(new Date());let scoped=visibleViolations();const todays=scoped.filter(v=>v.tanggal===today);$('#statToday').textContent=todays.length;const list=$('#recentViolations');if(!todays.length)list.innerHTML='<div class="empty-state"><strong>Belum ada catatan hari ini</strong><span>Pelanggaran yang dicatat akan muncul di sini.</span></div>';else list.innerHTML=todays.slice(0,7).map(v=>`<article class="recent-item"><div class="recent-top"><strong>${escHtml(v.nama)}</strong><span class="classification ${classificationClass(v.klasifikasi)}">${escHtml(v.klasifikasi)}</span></div><div class="recent-meta">${escHtml(v.kelas)} • ${escHtml(v.waktu)} • ${escHtml(v.guru)}</div><div class="recent-type">${escHtml(v.jenisPelanggaran)}</div><div class="recent-points">-${Number(v.pointPotongan||pointFor(v.klasifikasi))} poin • sisa ${Number.isFinite(Number(v.sisaPoin))?v.sisaPoin:'-'}</div></article>`).join(''); renderChartYearOptions();renderMonthlyChart(); }

  function visibleViolations(){ const u=currentUser(); if(!u||isAdmin())return state.violations; if(isStudentRole())return state.violations.filter(v=>v.studentId===u.studentId); if(!u.kelas)return state.violations; return state.violations.filter(v=>v.kelas===u.kelas); }
  function renderChartYearOptions(){ const current=String($('#chartYear').value||new Date().getFullYear());const years=[...new Set(state.violations.map(v=>String(v.tanggal||'').slice(0,4)).filter(Boolean).concat(String(new Date().getFullYear())))].sort().reverse();$('#chartYear').innerHTML=years.map(y=>`<option ${y===current?'selected':''}>${escHtml(y)}</option>`).join(''); }
  function renderMonthlyChart(){ const el=$('#monthlyChart');if(!el)return;const year=Number($('#chartYear').value||new Date().getFullYear());const data=Array(12).fill(0);visibleViolations().forEach(v=>{const d=String(v.tanggal||'');if(Number(d.slice(0,4))===year){const m=Number(d.slice(5,7));if(m>=1&&m<=12)data[m-1]++;}});const max=Math.max(1,...data);const months=['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];el.innerHTML=data.map((n,i)=>`<div class="bar-col" title="${months[i]}: ${n}"><div class="bar-value">${n}</div><div class="bar-track"><div class="bar-fill" style="height:${Math.max(n?8:0,(n/max)*100)}%"></div></div><div class="bar-label">${months[i]}</div></div>`).join('');const u=currentUser();$('#chartScopeText').textContent=!isAdmin()&&u?.kelas?`Kelas ${u.kelas}.`:'Seluruh siswa.'; }

  function renderStudentClassFilter(){ const el=$('#studentClassFilter');if(!el)return;const current=el.value;const classes=[...new Set(state.students.map(s=>s.kelas).filter(Boolean))].sort((a,b)=>String(a).localeCompare(String(b),'id',{numeric:true}));el.innerHTML='<option value="">Semua kelas</option>'+classes.map(c=>`<option value="${escAttr(c)}">Kelas ${escHtml(c)}</option>`).join('');if(classes.includes(current))el.value=current; }
  function sortedStudentRows(){ const q=($('#studentSearch')?.value||'').toLowerCase().trim();const cls=$('#studentClassFilter')?.value||'';const mode=$('#studentSort')?.value||'name-asc';let rows=[...state.students].filter(s=>[s.nama,s.nisn,s.kelas,s.jenisKelamin].join(' ').toLowerCase().includes(q)&&(!cls||s.kelas===cls));const name=(a,b)=>String(a.nama).localeCompare(String(b.nama),'id',{sensitivity:'base'});const kelas=(a,b)=>String(a.kelas).localeCompare(String(b.kelas),'id',{numeric:true,sensitivity:'base'})||name(a,b);if(mode==='name-desc')rows.sort((a,b)=>-name(a,b));else if(mode==='class-asc')rows.sort(kelas);else if(mode==='class-desc')rows.sort((a,b)=>-kelas(a,b));else if(mode==='point-asc')rows.sort((a,b)=>normalizePoint(a.poin)-normalizePoint(b.poin)||name(a,b));else if(mode==='point-desc')rows.sort((a,b)=>normalizePoint(b.poin)-normalizePoint(a.poin)||name(a,b));else rows.sort(name);return rows; }
  function renderStudents(){ const rows=sortedStudentRows();$('#studentCount').textContent=`${rows.length} siswa`;$('#studentTableBody').innerHTML=rows.map(s=>`<tr class="clickable-row"><td>${avatarHtml('student',s.id,s.nama,'avatar-sm')}</td><td><button class="profile-name-btn" data-open-student-profile="${escAttr(s.id)}"><strong>${escHtml(s.nama)}</strong></button></td><td>${escHtml(s.nisn)}</td><td>${escHtml(s.jenisKelamin)}</td><td>${escHtml(s.kelas)}</td><td><span class="point-badge ${pointClass(s.poin)}">${normalizePoint(s.poin)}</span></td><td><div class="row-actions"><button class="action-btn view" data-open-student-profile="${escAttr(s.id)}">Profil</button>${isAdmin()?`<button class="action-btn edit" data-edit-student="${escAttr(s.id)}">Ubah</button><button class="action-btn reset" data-reset-student="${escAttr(s.id)}">Reset 100</button><button class="action-btn delete" data-delete-student="${escAttr(s.id)}">Hapus</button>`:''}</div></td></tr>`).join('');$('#studentEmpty').classList.toggle('hidden',rows.length>0);$$('[data-open-student-profile]').forEach(b=>b.onclick=e=>{e.stopPropagation();openStudentProfile(b.dataset.openStudentProfile);});$$('[data-edit-student]').forEach(b=>b.onclick=()=>openEntityModal('student',b.dataset.editStudent));$$('[data-delete-student]').forEach(b=>b.onclick=()=>deleteStudent(b.dataset.deleteStudent));$$('[data-reset-student]').forEach(b=>b.onclick=()=>resetStudentPoints(b.dataset.resetStudent)); }
  function renderTeachers(){ const q=($('#teacherSearch')?.value||'').toLowerCase().trim();const rows=[...state.teachers].sort(sortByName).filter(t=>[t.nama,t.alamat,t.jabatan].join(' ').toLowerCase().includes(q));$('#teacherCount').textContent=`${rows.length} guru`;$('#teacherTableBody').innerHTML=rows.map(t=>`<tr><td>${avatarHtml('teacher',t.id,t.nama,'avatar-sm')}</td><td><strong>${escHtml(t.nama)}</strong></td><td>${escHtml(t.alamat)}</td><td>${escHtml(t.jabatan)}</td><td><div class="row-actions"><button class="action-btn edit" data-edit-teacher="${escAttr(t.id)}">Ubah</button><button class="action-btn delete" data-delete-teacher="${escAttr(t.id)}">Hapus</button></div></td></tr>`).join('');$('#teacherEmpty').classList.toggle('hidden',rows.length>0);$$('[data-edit-teacher]').forEach(b=>b.onclick=()=>openEntityModal('teacher',b.dataset.editTeacher));$$('[data-delete-teacher]').forEach(b=>b.onclick=()=>deleteTeacher(b.dataset.deleteTeacher)); }
  function renderUsers(){ if(!$('#userTableBody'))return;const q=($('#userSearch')?.value||'').toLowerCase().trim();const rows=[...state.users].filter(u=>[u.username,u.nama,u.role,u.kelas].join(' ').toLowerCase().includes(q));$('#userCount').textContent=`${rows.length} akun`;$('#userTableBody').innerHTML=rows.map(u=>{const t=state.teachers.find(x=>x.id===u.teacherId),st=state.students.find(x=>x.id===u.studentId);const photo=u.role==='Guru'?avatarHtml('teacher',t?.id||'',t?.nama||u.nama,'avatar-sm'):u.role==='Siswa'?avatarHtml('student',st?.id||'',st?.nama||u.nama,'avatar-sm'):avatarHtml('','',u.nama,'avatar-sm');const pw=u.password?`<span class="password-text">${escHtml(u.password)}</span>`:'<span class="muted">Belum tersedia</span>';return `<tr><td>${photo}</td><td><strong>${escHtml(u.username)}</strong></td><td>${escHtml(u.nama)}</td><td><span class="role-badge">${escHtml(u.role)}</span></td><td>${escHtml(t?.nama||'-')}</td><td>${st?`${escHtml(st.nama)}<br><span class="recent-meta">${escHtml(st.nisn)} • ${escHtml(st.kelas)}</span>`:'-'}</td><td>${escHtml(u.kelas||'-')}</td><td>${pw}</td><td>${u.aktif===false?'<span class="status-badge off">Nonaktif</span>':'<span class="status-badge on">Aktif</span>'}</td><td><div class="row-actions"><button class="action-btn edit" data-edit-user="${escAttr(u.id)}">Ubah</button><button class="action-btn delete" data-delete-user="${escAttr(u.id)}">Hapus</button></div></td></tr>`}).join('');$$('[data-edit-user]').forEach(b=>b.onclick=()=>openEntityModal('user',b.dataset.editUser));$$('[data-delete-user]').forEach(b=>b.onclick=()=>deleteUser(b.dataset.deleteUser)); }
  function renderHistoryFilters(){ const current=$('#historyClassFilter').value;const classes=getClasses();$('#historyClassFilter').innerHTML='<option value="">Semua kelas</option>'+classes.map(c=>`<option>${escHtml(c)}</option>`).join('');if(classes.includes(current))$('#historyClassFilter').value=current; }
  function filteredHistory(){ const q=($('#historySearch')?.value||'').toLowerCase().trim();const cls=$('#historyClassFilter')?.value||'';const classification=$('#historyClassificationFilter')?.value||'';return [...visibleViolations()].sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt))).filter(v=>[v.nama,v.nisn,v.kelas,v.guru,v.klasifikasi,v.jenisPelanggaran,v.keterangan].join(' ').toLowerCase().includes(q)&&(!cls||v.kelas===cls)&&(!classification||v.klasifikasi===classification)); }
  function renderHistory(){ const rows=filteredHistory();$('#historyTableBody').innerHTML=rows.map(v=>`<tr><td><strong>${escHtml(displayDate(v.tanggal))}</strong><br><span class="recent-meta">${escHtml(v.waktu)}</span></td><td><strong>${escHtml(v.nama)}</strong></td><td>${escHtml(v.nisn)}</td><td>${escHtml(v.kelas)}</td><td>${escHtml(v.guru)}</td><td><span class="classification ${classificationClass(v.klasifikasi)}">${escHtml(v.klasifikasi)}</span></td><td><strong>-${Number(v.pointPotongan||pointFor(v.klasifikasi))}</strong></td><td>${escHtml(v.sisaPoin??'-')}</td><td>${escHtml(v.jenisPelanggaran)}</td><td>${escHtml(v.keterangan||'-')}</td><td><div class="row-actions"><button class="action-btn print" data-print-violation="${escAttr(v.id)}">Cetak</button>${isAdmin()?`<button class="action-btn delete" data-delete-violation="${escAttr(v.id)}">Hapus</button>`:''}</div></td></tr>`).join('');$('#historyEmpty').classList.toggle('hidden',rows.length>0);$$('[data-print-violation]').forEach(b=>b.onclick=()=>printViolation(b.dataset.printViolation));$$('[data-delete-violation]').forEach(b=>b.onclick=()=>deleteViolation(b.dataset.deleteViolation)); }

  function openStudentProfile(id){ const s=state.students.find(x=>x.id===id);if(!s)return;if(isStudentRole()&&id!==currentUser()?.studentId)return;state.selectedStudentProfileId=id;switchView(isStudentRole()?'studentportal':'studentprofile'); }
  function renderStudentProfile(){ const root=$('#studentProfileName');if(!root)return;const id=state.selectedStudentProfileId;const s=state.students.find(x=>x.id===id);if(!s){if(state.currentView==='studentprofile')switchView('students');return;}$('#studentProfileName').textContent=s.nama;$('#studentProfileMeta').textContent=`NISN ${s.nisn} • Kelas ${s.kelas}`;setAvatarElement($('#studentProfileAvatar'),'student',s.id,s.nama);$('#studentProfileIdentity').innerHTML=`<div class="profile-info-item"><span>Nama Lengkap</span><strong>${escHtml(s.nama)}</strong></div><div class="profile-info-item"><span>NISN</span><strong>${escHtml(s.nisn)}</strong></div><div class="profile-info-item"><span>Jenis Kelamin</span><strong>${escHtml(s.jenisKelamin)}</strong></div><div class="profile-info-item"><span>Kelas</span><strong>${escHtml(s.kelas)}</strong></div>`;const rows=state.violations.filter(v=>v.studentId===id||(!v.studentId&&v.nisn===s.nisn)).sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)));const totalDeduct=rows.reduce((n,v)=>n+Number(v.pointPotongan||pointFor(v.klasifikasi)),0);$('#studentProfilePoint').textContent=normalizePoint(s.poin);$('#studentProfilePoint').className=`${pointClass(s.poin)}-text`;$('#studentProfileViolationCount').textContent=rows.length;$('#studentProfileDeduction').textContent=totalDeduct;$('#studentProfileLastDate').textContent=rows[0]?displayDate(rows[0].tanggal):'-';$('#studentProfileHistoryBody').innerHTML=rows.map(v=>`<tr><td><strong>${escHtml(displayDate(v.tanggal))}</strong><br><span class="recent-meta">${escHtml(v.waktu)}</span></td><td>${escHtml(v.guru)}</td><td><span class="classification ${classificationClass(v.klasifikasi)}">${escHtml(v.klasifikasi)}</span></td><td>-${Number(v.pointPotongan||pointFor(v.klasifikasi))}</td><td>${escHtml(v.sisaPoin??'-')}</td><td>${escHtml(v.jenisPelanggaran)}</td><td>${escHtml(v.keterangan||'-')}</td><td><div class="row-actions"><button class="action-btn print" data-profile-print="${escAttr(v.id)}">Cetak</button>${isAdmin()?`<button class="action-btn delete" data-profile-delete="${escAttr(v.id)}">Hapus</button>`:''}</div></td></tr>`).join('');$('#studentProfileEmpty').classList.toggle('hidden',rows.length>0);$$('[data-profile-print]').forEach(b=>b.onclick=()=>printViolation(b.dataset.profilePrint));$$('[data-profile-delete]').forEach(b=>b.onclick=()=>deleteViolation(b.dataset.profileDelete)); }
  function renderHomeroomClassOptions(){ const current=$('#homeroomClassSelect').value;const classes=getClasses();$('#homeroomClassSelect').innerHTML='<option value="">Pilih kelas</option>'+classes.map(c=>`<option>${escHtml(c)}</option>`).join('');if(classes.includes(current))$('#homeroomClassSelect').value=current; }
  function selectedHomeroomClass(){ const u=currentUser();return isAdmin()?$('#homeroomClassSelect').value:(u?.kelas||''); }
  function renderHomeroom(){ const cls=selectedHomeroomClass();$('#homeroomTitle').textContent=cls?`Ringkasan Kelas ${cls}`:'Ringkasan Kelas';const students=state.students.filter(s=>s.kelas===cls);const violations=state.violations.filter(v=>v.kelas===cls);const now=new Date(),ym=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;$('#homeStatStudents').textContent=students.length;$('#homeStatMonth').textContent=violations.filter(v=>String(v.tanggal).startsWith(ym)).length;$('#homeStatLow').textContent=students.filter(s=>normalizePoint(s.poin)<=70).length;$('#homeStatClean').textContent=students.filter(s=>!violations.some(v=>v.studentId===s.id||v.nisn===s.nisn)).length;$('#homeroomTableBody').innerHTML=students.sort(sortByName).map(s=>{const vv=violations.filter(v=>v.studentId===s.id||v.nisn===s.nisn).sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)));return `<tr><td><strong>${escHtml(s.nama)}</strong></td><td>${escHtml(s.nisn)}</td><td><span class="point-badge ${pointClass(s.poin)}">${normalizePoint(s.poin)}</span></td><td>${vv.length}</td><td>${vv[0]?`${escHtml(displayDate(vv[0].tanggal))} • ${escHtml(vv[0].jenisPelanggaran)}`:'-'}</td><td><button class="action-btn view" data-home-profile="${escAttr(s.id)}">Lihat Profil</button></td></tr>`}).join('');$('#homeroomEmpty').classList.toggle('hidden',Boolean(cls&&students.length));document.querySelector('#view-homeroom .table-wrap').classList.toggle('hidden',!cls||!students.length);$$('[data-home-profile]').forEach(b=>b.onclick=()=>openStudentProfile(b.dataset.homeProfile)); }

  function renderStudentPortal(){if(!$('#portalHistoryBody'))return;const s=linkedStudent();if(!isStudentRole())return;if(!s){$('#portalStudentName').textContent='Menu Siswa / Wali Murid';setAvatarElement($('#portalStudentAvatar'),'student','', 'S');$('#portalIdentity').innerHTML='<div class="info-box">Akun ini belum ditautkan ke Data Siswa. Hubungi Admin E-CAKEP.</div>';$('#portalHistoryBody').innerHTML='';$('#portalEmpty').classList.add('hidden');$('#downloadMyRecapBtn').disabled=true;return;}$('#downloadMyRecapBtn').disabled=false;$('#portalStudentName').textContent=s.nama;setAvatarElement($('#portalStudentAvatar'),'student',s.id,s.nama);$('#portalIdentity').innerHTML=`<div class="portal-id-item"><span>Nama</span><strong>${escHtml(s.nama)}</strong></div><div class="portal-id-item"><span>NISN</span><strong>${escHtml(s.nisn)}</strong></div><div class="portal-id-item"><span>Jenis Kelamin</span><strong>${escHtml(s.jenisKelamin)}</strong></div><div class="portal-id-item"><span>Kelas</span><strong>${escHtml(s.kelas)}</strong></div>`;const vv=state.violations.filter(v=>v.studentId===s.id||(!v.studentId&&v.nisn===s.nisn)).sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)));$('#portalPoint').textContent=normalizePoint(s.poin);$('#portalViolationCount').textContent=vv.length;$('#portalDeduction').textContent=vv.reduce((n,v)=>n+Number(v.pointPotongan||pointFor(v.klasifikasi)),0);$('#portalLastDate').textContent=vv[0]?displayDate(vv[0].tanggal):'-';$('#portalHistoryBody').innerHTML=vv.map(v=>`<tr><td><strong>${escHtml(displayDate(v.tanggal))}</strong><br><span class="recent-meta">${escHtml(v.waktu)}</span></td><td>${escHtml(v.guru)}</td><td><span class="classification ${classificationClass(v.klasifikasi)}">${escHtml(v.klasifikasi)}</span></td><td>-${Number(v.pointPotongan||pointFor(v.klasifikasi))}</td><td>${escHtml(v.sisaPoin??'-')}</td><td>${escHtml(v.jenisPelanggaran)}</td><td>${escHtml(v.keterangan||'-')}</td></tr>`).join('');$('#portalEmpty').classList.toggle('hidden',vv.length>0);}

  function photoKey(type,id){ return `${type}:${id}`; }
  function entityHasPhoto(type,id){
    const list=type==='student'?state.students:state.teachers;
    return Boolean(list.find(x=>x.id===id)?.photoId);
  }
  function initials(name){const parts=String(name||'?').trim().split(/\s+/).filter(Boolean);return (parts.slice(0,2).map(x=>x[0]).join('')||'?').toUpperCase();}
  function avatarInnerHtml(type,id,name){
    const fallback=`<span class="avatar-fallback">${escHtml(initials(name))}</span>`;
    if(!id || !entityHasPhoto(type,id)) return fallback;
    const key=photoKey(type,id), cached=state.photoCache.get(key);
    if(cached) return `<img src="${escAttr(cached)}" alt="Foto ${escAttr(name||'profil')}">${fallback}`;
    return `<img data-photo-key="${escAttr(key)}" alt="Foto ${escAttr(name||'profil')}" style="display:none">${fallback}`;
  }
  function avatarHtml(type,id,name,extra=''){return `<span class="profile-avatar ${extra}">${avatarInnerHtml(type,id,name)}</span>`;}
  function setAvatarElement(el,type,id,name){if(!el)return;el.innerHTML=avatarInnerHtml(type,id,name);hydrateProfilePhotos(el);}
  async function hydrateProfilePhotos(root=document){
    if(!state.server.configured) return;
    const imgs=[...root.querySelectorAll('img[data-photo-key]')].filter(img=>!img.src);
    const keys=[...new Set(imgs.map(img=>img.dataset.photoKey).filter(Boolean))].filter(k=>!state.photoCache.has(k)&&!state.photoLoading.has(k));
    if(!keys.length){ imgs.forEach(img=>{const v=state.photoCache.get(img.dataset.photoKey);if(v){img.src=v;img.style.display='block';}}); return; }
    keys.forEach(k=>state.photoLoading.add(k));
    try{
      for(let i=0;i<keys.length;i+=25){
        const batch=keys.slice(i,i+25).map(k=>{const [type,...rest]=k.split(':');return {type,id:rest.join(':')};});
        const res=await apiPost('getProfilePhotos',{items:batch}), json=assertBackend(await parseApiJson(res));
        if(json.ok && json.photos) Object.entries(json.photos).forEach(([k,v])=>{if(v)state.photoCache.set(k,v);});
      }
    }catch(_){}
    finally{keys.forEach(k=>state.photoLoading.delete(k));}
    [...root.querySelectorAll('img[data-photo-key]')].forEach(img=>{const v=state.photoCache.get(img.dataset.photoKey);if(v){img.src=v;img.style.display='block';}});
  }
  function refreshPhotoViews(){
    renderStudents();renderTeachers();renderStudentProfile();
    setTimeout(()=>hydrateProfilePhotos(document),0);
  }
  async function fileToCompressedJpeg(file){if(!file)throw new Error('Pilih file foto terlebih dahulu.');if(file.size>1024*1024)throw new Error('Ukuran foto maksimal 1 MB. Pilih foto yang lebih kecil.');if(!/^image\/(jpeg|png|webp)$/i.test(file.type))throw new Error('Format foto harus JPG, PNG, atau WebP.');const img=await new Promise((resolve,reject)=>{const i=new Image();const url=URL.createObjectURL(file);i.onload=()=>{URL.revokeObjectURL(url);resolve(i)};i.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('Foto tidak dapat dibaca.'))};i.src=url;});const max=480,scale=Math.min(1,max/Math.max(img.width,img.height)),w=Math.max(1,Math.round(img.width*scale)),h=Math.max(1,Math.round(img.height*scale));const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d');ctx.drawImage(img,0,0,w,h);return c.toDataURL('image/jpeg',0.76);}
  async function uploadProfilePhoto(type,id,file,showToast=true){
    if(!isAdmin())return false;
    try{
      const imageData=await fileToCompressedJpeg(file);
      const res=await apiPost('uploadProfilePhoto',{type,id,imageData}),json=assertBackend(await parseApiJson(res));
      if(!json.ok)throw new Error(json.message||'Foto gagal diunggah.');
      const list=type==='student'?state.students:state.teachers,entity=list.find(x=>x.id===id);
      if(entity)entity.photoId=json.photoId||entity.photoId||'drive';
      state.photoCache.set(photoKey(type,id),imageData);
      persistCore();refreshPhotoViews();
      if(showToast)toast('Foto profil disimpan','Foto tersimpan di Google Drive dan terhubung ke profil.','success');
      return true;
    }catch(err){toast('Upload foto gagal',err.message||'Foto tidak dapat disimpan.','error');return false;}
  }
  async function deleteProfilePhoto(type,id){
    if(!isAdmin()||!id)return;
    if(!confirm('Hapus foto profil ini dari Google Drive?'))return;
    try{
      const res=await apiPost('deleteProfilePhoto',{type,id}),json=assertBackend(await parseApiJson(res));
      if(!json.ok)throw new Error(json.message||'Foto gagal dihapus.');
      const list=type==='student'?state.students:state.teachers,entity=list.find(x=>x.id===id);
      if(entity)entity.photoId='';
      state.photoCache.delete(photoKey(type,id));
      persistCore();refreshPhotoViews();toast('Foto dihapus','Foto profil berhasil dihapus dari Google Drive.','success');
    }catch(err){toast('Gagal menghapus foto',err.message||'Coba kembali.','error');}
  }

  function printViolation(id){ const v=state.violations.find(x=>x.id===id);if(!v)return;const s=state.students.find(x=>x.id===v.studentId);const html=letterHtml(v,s);const w=window.open('','_blank','width=1200,height=800');if(!w)return toast('Popup diblokir','Izinkan popup browser untuk mencetak.','error');w.document.open();w.document.write(html);w.document.close();setTimeout(()=>{w.focus();w.print();},350); }
  function printStudentProfile(id){ const s=state.students.find(x=>x.id===id);if(!s)return;const rows=state.violations.filter(v=>v.studentId===id||v.nisn===s.nisn).sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)));const html=studentProfilePrintHtml(s,rows);const w=window.open('','_blank','width=1000,height=800');if(!w)return toast('Popup diblokir','Izinkan popup browser untuk mencetak.','error');w.document.open();w.document.write(html);w.document.close();setTimeout(()=>{w.focus();w.print();},350); }
  function letterHtml(v,s){ const logo=state.appLogoData||state.appLogo||'assets/logo-ecakep.svg'; const copy=label=>`<section class="copy"><div class="letter-head"><div class="print-brand"><img src="${escAttr(logo)}" alt="E-CAKEP"><div><h1>E-CAKEP</h1><p>CATATAN KEDISIPLINAN</p></div></div><span>${label}</span></div><table><tr><td>Nama</td><td>: <b>${escHtml(v.nama)}</b></td></tr><tr><td>NISN</td><td>: ${escHtml(v.nisn)}</td></tr><tr><td>Kelas</td><td>: ${escHtml(v.kelas)}</td></tr><tr><td>Tanggal / Waktu</td><td>: ${escHtml(displayDate(v.tanggal))} / ${escHtml(v.waktu)}</td></tr><tr><td>Guru Pencatat</td><td>: ${escHtml(v.guru)}</td></tr><tr><td>Klasifikasi</td><td>: ${escHtml(v.klasifikasi)} (-${Number(v.pointPotongan||pointFor(v.klasifikasi))} poin)</td></tr><tr><td>Jenis Pelanggaran</td><td>: <b>${escHtml(v.jenisPelanggaran)}</b></td></tr><tr><td>Keterangan</td><td>: ${escHtml(v.keterangan||'-')}</td></tr><tr><td>Sisa Poin</td><td>: <b>${escHtml(v.sisaPoin??normalizePoint(s?.poin))}</b> dari 100</td></tr></table><p class="notice">Surat ini merupakan catatan kedisiplinan siswa dan diharapkan menjadi bahan pembinaan bersama.</p><div class="sign"><div><p>Orang Tua/Wali</p><br><br><b>(__________________)</b></div><div><p>Guru / Wali Kelas</p><br><br><b>(${escHtml(v.guru)})</b></div></div></section>`;return `<!doctype html><html><head><meta charset="utf-8"><title>Catatan Pelanggaran - ${escAttr(v.nama)}</title><style>@page{size:330mm 210mm;margin:8mm}*{box-sizing:border-box}body{font-family:Arial,sans-serif;margin:0;color:#111}.sheet{display:flex;width:100%;height:190mm}.copy{width:50%;padding:7mm;position:relative}.copy:first-child{border-right:1px dashed #777}.letter-head{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #4c2a8a;padding-bottom:4mm;margin-bottom:5mm}.print-brand{display:flex;gap:3mm;align-items:center}.print-brand img{width:13mm;height:13mm;object-fit:contain}.letter-head h1{font-size:18px;margin:0}.letter-head p{font-size:10px;font-weight:bold;margin:1mm 0 0}.letter-head span{font-size:9px;border:1px solid #555;padding:2mm}table{width:100%;border-collapse:collapse;font-size:10px}td{padding:2mm 1mm;vertical-align:top}td:first-child{width:32%}.notice{font-size:9px;line-height:1.5;border:1px solid #aaa;padding:3mm;margin-top:5mm}.sign{display:flex;justify-content:space-between;text-align:center;font-size:9px;margin-top:8mm}.sign>div{width:42%}@media print{button{display:none}}</style></head><body><div class="sheet">${copy('ARSIP SEKOLAH')}${copy('ORANG TUA / WALI')}</div></body></html>`; }
  function studentProfilePrintHtml(s,rows){const logo=state.appLogoData||state.appLogo||'assets/logo-ecakep.svg';const total=rows.reduce((n,v)=>n+Number(v.pointPotongan||pointFor(v.klasifikasi)),0);return `<!doctype html><html><head><meta charset="utf-8"><title>Profil Siswa - ${escAttr(s.nama)}</title><style>@page{size:A4 portrait;margin:14mm}body{font-family:Arial,sans-serif;color:#172033;margin:0}.head{display:flex;align-items:center;gap:12px;border-bottom:3px solid #5b2aa6;padding-bottom:10px}.head img{width:56px;height:56px;object-fit:contain}.head h1{font-size:20px;margin:0}.head p{font-size:10px;margin:3px 0 0;color:#667085}.student{margin-top:18px;padding:14px;border:1px solid #dbe2ec;border-radius:10px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:8px 20px}.grid div{font-size:10px}.grid b{font-size:12px}.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:14px 0}.stat{border:1px solid #dbe2ec;padding:10px;border-radius:9px}.stat span{display:block;font-size:8px;color:#667085}.stat b{font-size:17px}.stat strong{color:#5b2aa6}table{width:100%;border-collapse:collapse;font-size:9px}th,td{border:1px solid #b8c0cc;padding:6px;text-align:left}th{background:#e9ddff;font-weight:bold}.foot{margin-top:16px;font-size:8px;color:#667085}.sign{margin-top:30px;display:flex;justify-content:flex-end;text-align:center}.sign>div{width:180px}</style></head><body><div class="head"><img src="${escAttr(logo)}"><div><h1>E-CAKEP</h1><p>CATATAN KEDISIPLINAN • PROFIL SISWA</p></div></div><div class="student"><div class="grid"><div>Nama<br><b>${escHtml(s.nama)}</b></div><div>NISN<br><b>${escHtml(s.nisn)}</b></div><div>Jenis Kelamin<br><b>${escHtml(s.jenisKelamin)}</b></div><div>Kelas<br><b>${escHtml(s.kelas)}</b></div></div></div><div class="stats"><div class="stat"><span>Poin Saat Ini</span><b><strong>${normalizePoint(s.poin)}</strong> / 100</b></div><div class="stat"><span>Total Pelanggaran</span><b>${rows.length}</b></div><div class="stat"><span>Total Potongan</span><b>${total} poin</b></div></div><h3>Riwayat Pelanggaran</h3>${rows.length?`<table><thead><tr><th>Tanggal</th><th>Guru</th><th>Klasifikasi</th><th>Jenis Pelanggaran</th><th>Potongan</th><th>Sisa Poin</th></tr></thead><tbody>${rows.map(v=>`<tr><td>${escHtml(displayDate(v.tanggal))}</td><td>${escHtml(v.guru)}</td><td>${escHtml(v.klasifikasi)}</td><td>${escHtml(v.jenisPelanggaran)}</td><td>-${Number(v.pointPotongan||pointFor(v.klasifikasi))}</td><td>${escHtml(v.sisaPoin??'-')}</td></tr>`).join('')}</tbody></table>`:'<p>Belum ada riwayat pelanggaran.</p>'}<div class="foot">Dicetak ${escHtml(new Intl.DateTimeFormat('id-ID',{dateStyle:'full',timeStyle:'short'}).format(new Date()))}. Dokumen ini merupakan ringkasan catatan kedisiplinan siswa.</div><div class="sign"><div>Guru / Wali Kelas<br><br><br>(${escHtml(currentUser()?.nama||'')})</div></div></body></html>`;}

  function downloadStudentRecapById(id){ const s=state.students.find(x=>x.id===id);if(!s)return;const rows=state.violations.filter(v=>v.studentId===id||v.nisn===s.nisn).sort((a,b)=>String(a.createdAt).localeCompare(String(b.createdAt)));const data=[['REKAP PELANGGARAN E-CAKEP'],[],['Nama',s.nama],['NISN',s.nisn],['Jenis Kelamin',s.jenisKelamin],['Kelas',s.kelas],['Poin Saat Ini',normalizePoint(s.poin)],[],['Tanggal','Waktu','Guru','Klasifikasi','Potongan Poin','Sisa Poin','Jenis Pelanggaran','Keterangan']].concat(rows.map(v=>[v.tanggal,v.waktu,v.guru,v.klasifikasi,Number(v.pointPotongan||pointFor(v.klasifikasi)),v.sisaPoin,v.jenisPelanggaran,v.keterangan||'']));writeExcelFile(`rekap_${safeFileName(s.nama)}_${formatDateISO(new Date())}.xlsx`,data,'Rekap'); }
  function exportHistoryExcel(){ const rows=[['Nama','Guru','NISN','Jenis Kelamin','Kelas','Klasifikasi','Potongan Poin','Sisa Poin','Jenis Pelanggaran','Keterangan','Tanggal','Waktu']].concat(filteredHistory().map(v=>[v.nama,v.guru,v.nisn,v.jenisKelamin,v.kelas,v.klasifikasi,Number(v.pointPotongan||pointFor(v.klasifikasi)),v.sisaPoin,v.jenisPelanggaran,v.keterangan||'',v.tanggal,v.waktu]));writeExcelFile(`riwayat_pelanggaran_ecakep_${formatDateISO(new Date())}.xlsx`,rows,'Riwayat'); }

  async function importStudentsExcel(e){ const file=e.target.files?.[0];if(!file)return;try{const parsed=await readExcelRows(file);if(!parsed.length)throw new Error('File Excel kosong.');const headers=parsed[0].map(normalizeHeader);const idx={nama:headers.indexOf('nama'),nisn:headers.indexOf('nisn'),jenisKelamin:headers.indexOf('jeniskelamin'),kelas:headers.indexOf('kelas')};if(Object.values(idx).some(i=>i<0))throw new Error('Header wajib: Nama, NISN, Jenis Kelamin, Kelas.');let added=0,updated=0,skipped=0;const changed=[];for(const row of parsed.slice(1)){const nama=String(row[idx.nama]||'').trim(),nisn=String(row[idx.nisn]||'').trim(),jenisKelamin=normalizeGender(row[idx.jenisKelamin]),kelas=String(row[idx.kelas]||'').trim();if(!nama||!nisn||!jenisKelamin||!kelas){skipped++;continue;}const existing=state.students.find(s=>s.nisn===nisn);const item={id:existing?.id||uid(),nama,nisn,jenisKelamin,kelas,poin:existing?normalizePoint(existing.poin):100,resetAt:existing?.resetAt||'',updatedAt:new Date().toISOString()};if(existing){Object.assign(existing,item);updated++;}else{state.students.push(item);added++;}changed.push(item);}state.students.sort(sortByName);save(STORAGE.students,state.students);refreshAll();toast('Impor Excel selesai',`${added} ditambah, ${updated} diperbarui${skipped?`, ${skipped} dilewati`:''}.`,'success');if(state.server.configured&&changed.length)await pushAction('bulkSaveStudents',{data:changed},true);}catch(err){toast('Impor gagal',err.message||'File Excel tidak dapat dibaca.','error');}finally{e.target.value='';} }
  function downloadStudentTemplate(){ writeExcelFile('template_data_siswa_ecakep.xlsx',[['Nama','NISN','Jenis Kelamin','Kelas'],['Ahmad Fauzan','0012345678','Laki-laki','8A'],['Siti Rahma','0012345679','Perempuan','8A']],'Data Siswa'); }
  function downloadStudentsExcel(){ const rows=[['Nama','NISN','Jenis Kelamin','Kelas','Poin']].concat([...state.students].sort(sortByName).map(s=>[s.nama,s.nisn,s.jenisKelamin,s.kelas,normalizePoint(s.poin)]));writeExcelFile(`data_siswa_ecakep_${formatDateISO(new Date())}.xlsx`,rows,'Data Siswa'); }
  async function downloadPhotoZipTemplate(type){if(!window.JSZip)return toast('Modul ZIP belum termuat','Muat ulang halaman lalu coba lagi.','error');const zip=new JSZip();const c=document.createElement('canvas');c.width=8;c.height=8;c.getContext('2d').fillRect(0,0,8,8);const data=c.toDataURL('image/jpeg',0.35).split(',')[1];const list=type==='student'?state.students.sort(sortByName).map(x=>({name:safeFileName(x.nisn||x.nama),label:x.nama})):state.teachers.sort(sortByName).map(x=>({name:safeFileName(x.nama),label:x.nama}));list.forEach(x=>zip.file(`${x.name}.jpg`,data,{base64:true}));zip.file('PETUNJUK.txt',type==='student'?'Ganti file JPG di dalam ZIP dengan foto siswa yang sesuai. Gunakan NISN sebagai nama file. Foto maksimal 1 MB per file.':'Ganti file JPG di dalam ZIP dengan foto guru yang sesuai. Gunakan nama guru sebagai nama file. Foto maksimal 1 MB per file.');const blob=await zip.generateAsync({type:'blob',compression:'DEFLATE'});downloadBlob(type==='student'?'template_foto_siswa_ecakep.zip':'template_foto_guru_ecakep.zip',blob,'application/zip');}
  function downloadStudentPhotoTemplate(){return downloadPhotoZipTemplate('student');}
  function downloadTeacherPhotoTemplate(){return downloadPhotoZipTemplate('teacher');}
  async function importTeachersExcel(e){ const file=e.target.files?.[0];if(!file)return;try{const parsed=await readExcelRows(file);if(!parsed.length)throw new Error('File Excel kosong.');const headers=parsed[0].map(normalizeHeader);const idx={nama:headers.indexOf('nama'),alamat:headers.indexOf('alamat'),jabatan:headers.indexOf('jabatan')};if(Object.values(idx).some(i=>i<0))throw new Error('Header wajib: Nama, Alamat, Jabatan.');let added=0,updated=0,skipped=0;const changed=[];for(const row of parsed.slice(1)){const nama=String(row[idx.nama]||'').trim(),alamat=String(row[idx.alamat]||'').trim(),jabatan=String(row[idx.jabatan]||'').trim();if(!nama||!alamat||!jabatan){skipped++;continue;}const existing=state.teachers.find(t=>String(t.nama).trim().toLowerCase()===nama.toLowerCase());const item={id:existing?.id||uid(),nama,alamat,jabatan,updatedAt:new Date().toISOString()};if(existing){Object.assign(existing,item);updated++;}else{state.teachers.push(item);added++;}changed.push(item);}state.teachers.sort(sortByName);save(STORAGE.teachers,state.teachers);refreshAll();toast('Impor guru selesai',`${added} ditambah, ${updated} diperbarui${skipped?`, ${skipped} dilewati`:''}.`,'success');if(state.server.configured&&changed.length)await pushAction('bulkSaveTeachers',{data:changed},true);}catch(err){toast('Impor guru gagal',err.message||'File Excel tidak dapat dibaca.','error');}finally{e.target.value='';} }
  function downloadTeacherTemplate(){ writeExcelFile('template_data_guru_ecakep.xlsx',[['Nama','Alamat','Jabatan'],['Budi Santoso','Jl. Pendidikan No. 1','Wali Kelas 8A'],['Siti Aminah','Jl. Sekolah No. 2','Guru BK']],'Data Guru'); }

  async function importUsersExcel(e){ const file=e.target.files?.[0];if(!file)return;try{const parsed=await readExcelRows(file);if(!parsed.length)throw new Error('File Excel kosong.');const h=parsed[0].map(normalizeHeader);const idx={username:h.indexOf('username'),password:h.indexOf('password'),nama:h.indexOf('namapengguna'),role:h.indexOf('role'),guru:h.indexOf('namaguru'),nisn:h.indexOf('nisnsiswa'),kelas:h.indexOf('kelaswali'),aktif:h.indexOf('aktif')};if(idx.username<0||idx.password<0||idx.nama<0||idx.role<0)throw new Error('Header wajib: Username, Password, Nama Pengguna, Role.');let added=0,updated=0,skipped=0;const changed=[];for(const row of parsed.slice(1)){const username=String(row[idx.username]||'').trim(),password=String(row[idx.password]||'').trim(),nama=String(row[idx.nama]||'').trim(),role=normalizeRole(row[idx.role]);if(!username||!nama||!role){skipped++;continue;}const existing=state.users.find(u=>String(u.username).toLowerCase()===username.toLowerCase());if(!existing&&password.length<6){skipped++;continue;}let teacherId='',studentId='',kelas=idx.kelas>=0?String(row[idx.kelas]||'').trim():'';if(role==='Guru'){const guru=idx.guru>=0?String(row[idx.guru]||'').trim():'';const teacher=state.teachers.find(t=>String(t.nama).trim().toLowerCase()===guru.toLowerCase());if(!teacher){skipped++;continue;}teacherId=teacher.id;}if(role==='Siswa'){const nisn=idx.nisn>=0?String(row[idx.nisn]||'').trim():'';const st=state.students.find(s=>String(s.nisn).trim()===nisn);if(!st){skipped++;continue;}studentId=st.id;kelas=st.kelas;}const aktif=idx.aktif<0?true:normalizeActive(row[idx.aktif]);const item={id:existing?.id||uid(),username,nama,role,teacherId,studentId,kelas,aktif,passwordHash:password?await sha256(password):(existing?.passwordHash||''),updatedAt:new Date().toISOString()};if(!item.passwordHash){skipped++;continue;}if(existing){Object.assign(existing,item);updated++;}else{state.users.push(item);added++;}changed.push({...sanitizeUser(item),password});}save(STORAGE.users,state.users);refreshAll();toast('Impor akun selesai',`${added} ditambah, ${updated} diperbarui${skipped?`, ${skipped} dilewati`:''}.`,'success');if(state.server.configured&&changed.length)await pushAction('bulkSaveUsers',{data:changed},true);}catch(err){toast('Impor akun gagal',err.message||'File Excel tidak dapat dibaca.','error');}finally{e.target.value='';} }
  function downloadUserTemplate(){ writeExcelFile('template_akun_pengguna_ecakep.xlsx',[['Username','Password','Nama Pengguna','Role','Nama Guru','NISN Siswa','Kelas Wali','Aktif'],['guru8a','password123','Budi Santoso','Guru','Budi Santoso','','8A','Ya'],['siswa0012345678','password123','Ahmad Fauzan','Siswa','','0012345678','','Ya']],'Akun Pengguna'); }

  function normalizeRole(v){const s=String(v||'').trim().toLowerCase();if(s==='admin')return'Admin';if(s==='guru')return'Guru';if(['siswa','siswa/wali','student'].includes(s))return'Siswa';return'';}
  function normalizeActive(v){const s=String(v??'').trim().toLowerCase();return !['tidak','no','false','0','nonaktif'].includes(s);}
  async function readExcelRows(file){
    if(!window.XLSX)throw new Error('Modul Excel belum termuat. Muat ulang halaman.');
    const data=await file.arrayBuffer();
    const wb=XLSX.read(data,{type:'array',cellDates:false});
    const first=wb.SheetNames[0];if(!first)return[];
    return XLSX.utils.sheet_to_json(wb.Sheets[first],{header:1,raw:false,defval:''});
  }
  async function writeExcelFile(filename,rows,sheetName='Data'){
    try{
      if(!window.XLSX)throw new Error('Modul Excel belum termuat. Muat ulang halaman.');
      const ws=XLSX.utils.aoa_to_sheet(rows);
      const range=XLSX.utils.decode_range(ws['!ref']||'A1:A1');
      const widths=[];
      for(let c=range.s.c;c<=range.e.c;c++){let max=10;for(let r=range.s.r;r<=range.e.r;r++){const cell=ws[XLSX.utils.encode_cell({r,c})];max=Math.min(48,Math.max(max,String(cell?.v??'').length+2));if(cell){cell.s={alignment:{vertical:'center',wrapText:true},border:{top:{style:'thin',color:{rgb:'000000'}},bottom:{style:'thin',color:{rgb:'000000'}},left:{style:'thin',color:{rgb:'000000'}},right:{style:'thin',color:{rgb:'000000'}}}};if(r===range.s.r){cell.s.font={bold:true,color:{rgb:'FFFFFF'}};cell.s.fill={fgColor:{rgb:'2563EB'}};cell.s.alignment={horizontal:'center',vertical:'center',wrapText:true};}}}widths.push({wch:max});}
      ws['!cols']=widths;
      const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,String(sheetName||'Data').slice(0,31));
      XLSX.writeFile(wb,filename,{compression:true});
    }catch(err){toast('Excel gagal',err.message||'Gagal membuat file Excel.','error');}
  }

  async function loadAppLogo(){
    try{
      const res=await apiPost('getAppLogo',{});const json=await parseApiJson(res);
      if(json.ok&&json.logo){state.appLogoData=json.logo;applyAppLogo();localStorage.setItem('ecakep_app_logo',json.logo);}
    }catch(_){applyAppLogo();}
  }
  function applyAppLogo(){const src=state.appLogoData||state.appLogo||'assets/logo-ecakep.svg';$$('[data-app-logo]').forEach(el=>{el.src=src;el.alt='Logo E-CAKEP';});const preview=$('#appLogoPreview');if(preview)preview.src=src;}
  async function handleAppLogoUpload(e){if(!isAdmin())return;const file=e.target.files?.[0];e.target.value='';if(!file)return;try{if(file.size>1024*1024)throw new Error('Ukuran logo maksimal 1 MB.');if(!/^image\/(jpeg|png|svg\+xml)$/i.test(file.type)&&!(/\.svg$/i.test(file.name)))throw new Error('Format logo harus JPG, PNG, atau SVG.');let data;if(/svg$/i.test(file.type)||/\.svg$/i.test(file.name)){data='data:image/svg+xml;base64,'+btoa(unescape(encodeURIComponent(await file.text())));}else{data=await fileToLogoJpeg(file);}const res=await apiPost('uploadAppLogo',{imageData:data}),json=await parseApiJson(res);if(!json.ok)throw new Error(json.message||'Logo gagal disimpan.');state.appLogoData=json.logo||data;localStorage.setItem('ecakep_app_logo',state.appLogoData);applyAppLogo();toast('Logo diperbarui','Logo aplikasi berhasil diganti dan digunakan di seluruh aplikasi.','success');}catch(err){toast('Logo gagal diperbarui',err.message||'File logo tidak dapat diproses.','error');}}
  async function fileToLogoJpeg(file){const img=await new Promise((resolve,reject)=>{const i=new Image(),url=URL.createObjectURL(file);i.onload=()=>{URL.revokeObjectURL(url);resolve(i)};i.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('Logo tidak dapat dibaca.'))};i.src=url;});const max=800,scale=Math.min(1,max/Math.max(img.width,img.height)),w=Math.max(1,Math.round(img.width*scale)),h=Math.max(1,Math.round(img.height*scale));const c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(img,0,0,w,h);return c.toDataURL('image/jpeg',0.82);}
  async function resetAppLogo(){if(!isAdmin())return;if(!confirm('Kembalikan logo aplikasi ke logo bawaan E-CAKEP?'))return;try{const res=await apiPost('resetAppLogo',{}),json=await parseApiJson(res);if(!json.ok)throw new Error(json.message||'Logo gagal direset.');state.appLogoData=json.logo;localStorage.setItem('ecakep_app_logo',json.logo);applyAppLogo();toast('Logo dikembalikan','Logo bawaan E-CAKEP aktif kembali.','success');}catch(err){toast('Gagal mengembalikan logo',err.message||'Coba kembali.','error');}}
  async function massUploadPhotos(type,file){if(!isAdmin())return;if(!window.JSZip)return toast('Modul ZIP belum termuat','Muat ulang halaman lalu coba lagi.','error');if(!file)return;try{if(file.size>25*1024*1024)throw new Error('Ukuran ZIP maksimal 25 MB.');const zip=await JSZip.loadAsync(file);const entries=Object.values(zip.files).filter(x=>!x.dir&&/\.(jpe?g|png|webp)$/i.test(x.name));if(!entries.length)throw new Error('ZIP tidak berisi foto JPG, PNG, atau WebP.');const targets=type==='student'?state.students:state.teachers;const items=[];let skipped=0;for(const entry of entries){const blob=await entry.async('blob');if(blob.size>1024*1024){skipped++;continue;}const f=new File([blob],entry.name,{type:blob.type||'image/jpeg'});const base=entry.name.split('/').pop().replace(/\.[^.]+$/,'');const norm=base.trim().toLowerCase();let entity;if(type==='student') entity=targets.find(x=>String(x.nisn).trim()===base.trim())||targets.find(x=>String(x.nama).trim().toLowerCase()===norm);else entity=targets.find(x=>String(x.nama).trim().toLowerCase()===norm);if(!entity){skipped++;continue;}const imageData=await fileToCompressedJpeg(f);items.push({type,id:entity.id,imageData});}if(!items.length)throw new Error('Tidak ada foto yang cocok dengan data. Gunakan NISN untuk nama file siswa atau nama guru untuk file guru.');let done=0;for(let i=0;i<items.length;i+=5){const batch=items.slice(i,i+5);const res=await apiPost('bulkUploadProfilePhotos',{items:batch});const json=await parseApiJson(res);if(!json.ok)throw new Error(json.message||'Upload foto massal gagal.');done+=Number(json.count||batch.length);}await syncFromServer(false);toast('Upload foto massal selesai',`${done} foto diproses${skipped?`, ${skipped} file dilewati`:''}.`,'success');}catch(err){toast('Upload foto massal gagal',err.message||'ZIP tidak dapat diproses.','error');}}
  function bindMassPhotoInputs(){ $('#studentMassPhotoInput')?.addEventListener('change',e=>{const f=e.target.files?.[0];e.target.value='';if(f)massUploadPhotos('student',f);}); $('#teacherMassPhotoInput')?.addEventListener('change',e=>{const f=e.target.files?.[0];e.target.value='';if(f)massUploadPhotos('teacher',f);}); $('#uploadStudentPhotosBtn')?.addEventListener('click',()=>$('#studentMassPhotoInput')?.click()); $('#uploadTeacherPhotosBtn')?.addEventListener('click',()=>$('#teacherMassPhotoInput')?.click()); $('#downloadStudentPhotoTemplateBtn')?.addEventListener('click',downloadStudentPhotoTemplate); $('#downloadTeacherPhotoTemplateBtn')?.addEventListener('click',downloadTeacherPhotoTemplate);}
  async function loadCentralServerConfig(){
    const url=normalizeApiUrl(APPS_SCRIPT_URL);
    const valid=/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/i.test(url);
    state.server={configured:valid,editable:false,apiUrl:valid?url:''};
    const input=$('#apiUrl');if(input){input.value=valid?url:'';input.disabled=true;input.placeholder='URL dibaca dari config.js';}
    const saveBtn=$('#saveSettingsBtn');if(saveBtn){saveBtn.disabled=true;saveBtn.textContent='Otomatis';}
    renderSettingsStatus();
    updateSyncUi(false,valid?'Siap':'Belum dikonfigurasi');
    return state.server;
  }

  async function saveCentralServerConfig(){throw new Error('URL Apps Script dibaca dari config.js.');}

  function assertBackend(json){
    if(!json || !json.ok) throw new Error(json?.message||'Server menolak permintaan.');
    if(Number(json.apiVersion||0)!==API_VERSION) throw new Error(`Backend belum E-CAKEP v3.3. Ditemukan API ${json.apiVersion||0}; dibutuhkan API ${API_VERSION}. Deploy ulang Code.gs v3.3.`);
    return json;
  }

  async function testConnection(){
    const btn=$('#testConnectionBtn'),original=btn.textContent;btn.disabled=true;btn.textContent='Menguji...';
    try{
      if(!state.server.configured)throw new Error('URL Google Apps Script belum valid pada config.js.');
      const res=await apiPost('ping',{}),json=assertBackend(await parseApiJson(res));
      if(!json.ok)throw new Error(json.message||'Koneksi Apps Script gagal.');
      state.online=true; updateSyncUi(true,'Web App aktif');
      toast('Koneksi berhasil',`${json.app||'E-CAKEP'} terhubung. Spreadsheet dan Google Drive siap digunakan.`,'success');
    }catch(err){updateSyncUi(false,'Gagal terhubung');toast('Koneksi gagal',err.message||'Periksa deployment Apps Script.','error');}
    finally{btn.disabled=false;btn.textContent=original;}
  }

  async function restoreLocalSnapshotToServer(){
    if(!isAdmin())return toast('Akses ditolak','Pemulihan data tersedia pada mode pengelola terbuka.','error');
    if(!state.server.configured)return toast('Belum dikonfigurasi','URL Apps Script belum valid pada aplikasi.','error');
    const ok=confirm(`Pulihkan data lokal ke Google Spreadsheet?\n\nData E-CAKEP pada Spreadsheet akan diganti dengan data yang saat ini tersimpan di browser ini.\n\nSiswa: ${state.students.length}\nGuru: ${state.teachers.length}\nPelanggaran: ${state.violations.length}`);
    if(!ok)return;
    const btn=$('#restoreLocalBtn');const original=btn?.textContent||'Pulihkan Lokal → Spreadsheet';if(btn){btn.disabled=true;btn.textContent='Mengunggah...';}
    try{
      const res=await pushAction('restoreLocalSnapshot',{data:{students:state.students,teachers:state.teachers,violations:state.violations}},true);
      if(!res?.ok)throw new Error('Server tidak mengonfirmasi pemulihan data.');
      const c=res.counts||{};
      toast('Spreadsheet dipulihkan',`${c.students??state.students.length} siswa, ${c.teachers??state.teachers.length} guru, ${c.violations??state.violations.length} pelanggaran berhasil diunggah.`,'success');
      await syncFromServer(false);
    }catch(err){toast('Pemulihan gagal',err.message||'Data lokal tetap aman.','error');}
    finally{if(btn){btn.disabled=false;btn.textContent=original;}}
  }

  async function syncFromServer(showToast=true){
    if(!state.server.configured){if(showToast)toast('Belum dikonfigurasi','URL Apps Script belum valid.','error');return;}
    if(state.syncing)return;state.syncing=true;setSyncingUi(true);
    try{
      const res=await apiPost('getAll',{}),json=assertBackend(await parseApiJson(res));
      if(!json.ok)throw new Error(json.message||'Gagal membaca data server.');
      if(Array.isArray(json.students))state.students=migrateLocalStudents(json.students);
      if(Array.isArray(json.teachers))state.teachers=json.teachers;
      if(Array.isArray(json.violations))state.violations=migrateLocalViolations(json.violations);
      if(Array.isArray(json.users))state.users=json.users.map(sanitizeUser);
      persistCore();state.photoCache.clear();refreshAll();
      state.online=true;updateSyncUi(true,'Terhubung');setTimeout(()=>hydrateProfilePhotos(document),0);
      if(showToast)toast('Sinkronisasi selesai','Data terbaru dari Google Spreadsheet telah dimuat.','success');
    }catch(err){state.online=false;updateSyncUi(false,'Server gagal');const msg=err.message||'Coba kembali.';if(showToast||/backend.*login|code\.gs.*tanpa login|api 32/i.test(msg))toast('Sinkronisasi gagal',msg,'error');}
    finally{state.syncing=false;setSyncingUi(false);}
  }

  async function pushAction(action,payload={},showError=true){
    if(!state.server.configured)return null;
    try{const res=await apiPost(action,payload),json=assertBackend(await parseApiJson(res));if(!json.ok)throw new Error(json.message||'Server menolak data.');state.online=true;updateSyncUi(true,'Terhubung');return json;}catch(err){state.online=false;updateSyncUi(false,'Belum sinkron');if(showError)toast('Belum tersinkron',err.message||'Gagal mengirim data ke Spreadsheet.','error');return null;}
  }

  const bridgePending=new Map();
  window.addEventListener('message',event=>{
    const data=event.data;
    if(!data||data.channel!=='ECAKEP_APPS_SCRIPT'||!data.requestId)return;
    const pending=bridgePending.get(data.requestId);if(!pending)return;
    clearTimeout(pending.timer);bridgePending.delete(data.requestId);
    pending.form?.remove();pending.iframe?.remove();
    pending.resolve(data.payload||{ok:false,message:'Respons Apps Script kosong.'});
  });

  function bridgeRequest(action,payload={}){
    return new Promise((resolve,reject)=>{
      if(!state.server.configured)return reject(new Error('URL Apps Script belum dikonfigurasi pada app.js.'));
      const requestId=`req-${Date.now()}-${Math.random().toString(36).slice(2)}-${uid()}`;
      const iframe=document.createElement('iframe');iframe.name=`ecakep_bridge_${requestId.replace(/[^a-z0-9]/gi,'')}`;iframe.style.display='none';
      const form=document.createElement('form');form.method='POST';form.action=state.server.apiUrl;form.target=iframe.name;form.style.display='none';
      const body={...(payload||{})};
      if(action!=='login' && action!=='ping' && state.auth.token) body.authToken=state.auth.token;
      const fields={action,payload:JSON.stringify(body),transport:'iframe',requestId,origin:location.origin};
      Object.entries(fields).forEach(([name,value])=>{const input=document.createElement('input');input.type='hidden';input.name=name;input.value=String(value??'');form.appendChild(input);});
      document.body.appendChild(iframe);document.body.appendChild(form);
      const timer=setTimeout(()=>{bridgePending.delete(requestId);form.remove();iframe.remove();reject(new Error('Google Apps Script tidak merespons dalam 35 detik. Periksa deployment dan koneksi internet.'));},35000);
      bridgePending.set(requestId,{resolve,reject,iframe,form,timer});
      form.submit();
    });
  }
  function responseLike(json){return{text:async()=>JSON.stringify(json),ok:Boolean(json?.ok),status:json?.ok?200:400};}
  async function apiGet(action){return responseLike(await bridgeRequest(action,{}));}
  async function apiPost(action,payload){return responseLike(await bridgeRequest(action,payload));}
  async function parseApiJson(res){const text=await res.text();try{return JSON.parse(text);}catch{throw new Error('Respons Google Apps Script tidak valid.');}}
  function updateSyncUi(online,label){$('#sidebarSyncDot').className=`status-dot ${online?'online':'offline'}`;$('#sidebarSyncText').textContent=label;}
  function setSyncingUi(on){$('#syncIcon').textContent=on?'…':'↻';$('#syncLabel').textContent=on?'Memuat':'Sinkronkan';}
  function renderSettingsStatus(){
    if(!$('#settingsStatus'))return;
    const has=Boolean(state.server.configured),active=Boolean(state.online);
    $('#settingsStatus').innerHTML=`<span class="status-dot ${has&&active?'online':'offline'}"></span><div><strong>${has?(active?'Google Spreadsheet terhubung':'Google Apps Script siap'):'Belum dikonfigurasi'}</strong><p>${has?(active?'Data tersinkron langsung ke Google Spreadsheet; foto profil tersimpan di Google Drive.':'Login Admin/Guru aktif. Gunakan Tes Koneksi untuk memeriksa server.'):'URL Apps Script pada config.js belum valid.'}</p></div>`;
  }

  function updateStudentFromServer(student){const i=state.students.findIndex(s=>s.id===student.id);if(i>=0)state.students[i]={...state.students[i],...student};else state.students.push(student);save(STORAGE.students,state.students);refreshAll();}
  function persistCore(){save(STORAGE.students,state.students);save(STORAGE.teachers,state.teachers);save(STORAGE.violations,state.violations);}
  function getClasses(){return [...new Set(state.students.map(s=>s.kelas).concat(state.violations.map(v=>v.kelas)).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'id',{numeric:true}));}
  function pointFor(c){return POINTS[String(c||'')]||0;}
  function normalizePoint(v){const n=Number(v);return Number.isFinite(n)?Math.max(0,Math.min(100,Math.round(n))):100;}
  function pointClass(v){const n=normalizePoint(v);return n<=50?'critical':n<=70?'warning':n<=85?'watch':'good';}

  function backfillLocalLegacyPoints(){
    const map=new Map(state.students.map(s=>[s.id,{student:s,current:100}]));
    [...state.violations].sort((a,b)=>String(a.createdAt||`${a.tanggal}T${a.waktu}`).localeCompare(String(b.createdAt||`${b.tanggal}T${b.waktu}`))).forEach(v=>{
      const rec=map.get(v.studentId); const ded=Number(v.pointPotongan||pointFor(v.klasifikasi)||0); v.pointPotongan=ded;
      if(rec){rec.current=Math.max(0,rec.current-ded);v.sisaPoin=rec.current;}
    });
    map.forEach(rec=>{rec.student.poin=rec.current;rec.student.resetAt=rec.student.resetAt||'';});
  }

  function migrateLocalStudents(arr){return(Array.isArray(arr)?arr:[]).map(s=>({...s,poin:normalizePoint(s.poin),resetAt:s.resetAt||''}));}
  function migrateLocalViolations(arr){return(Array.isArray(arr)?arr:[]).map(v=>({...v,pointPotongan:Number(v.pointPotongan||pointFor(v.klasifikasi)||0),sisaPoin:v.sisaPoin===''||v.sisaPoin==null?'':Number(v.sisaPoin)}));}
  function sanitizeUser(u){return{id:u.id,username:u.username,nama:u.nama,role:u.role,teacherId:u.teacherId||'',studentId:u.studentId||'',kelas:u.kelas||'',aktif:u.aktif!==false,password:u.password||'',updatedAt:u.updatedAt||''};}
  function upsertLocal(arr,item){const i=arr.findIndex(x=>x.id===item.id);i>=0?arr.splice(i,1,item):arr.push(item);}

  function normalizeHeader(s){return String(s||'').toLowerCase().replace(/[^a-z0-9]/g,'');}
  function normalizeGender(s){const v=String(s||'').trim().toLowerCase();if(['l','laki-laki','laki laki','pria','male'].includes(v))return'Laki-laki';if(['p','perempuan','wanita','female'].includes(v))return'Perempuan';return'';}
  function normalizeApiUrl(url){return String(url||'').trim().replace(/\s/g,'').replace(/\/$/,'');}
  function classificationClass(v){return String(v||'').toLowerCase().replace(/\s+/g,'-');}
  function sortByName(a,b){return String(a.nama).localeCompare(String(b.nama),'id',{sensitivity:'base'});}
  function formatDateISO(d){const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');return`${y}-${m}-${day}`;}
  function formatTime(d){return`${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`;}
  function displayDate(s){if(!s)return'-';const[y,m,d]=String(s).split('-');return y&&m&&d?`${d}/${m}/${y}`:s;}
  function uid(){return crypto.randomUUID?crypto.randomUUID():`id-${Date.now()}-${Math.random().toString(16).slice(2)}`;}
  function load(key,fallback){try{const raw=localStorage.getItem(key);return raw?JSON.parse(raw):fallback;}catch{return fallback;}}
  function save(key,value){localStorage.setItem(key,JSON.stringify(value));}
  function escHtml(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
  function escAttr(v){return escHtml(v);}
  function downloadBlob(name,content,type){const blob=new Blob([content],{type}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},500);}
  function safeFileName(v){return String(v||'siswa').replace(/[^a-z0-9_-]+/gi,'_').replace(/^_+|_+$/g,'');}
  function toast(title,message,type=''){const el=document.createElement('div');el.className=`toast ${type}`;el.innerHTML=`<strong>${escHtml(title)}</strong><span>${escHtml(message)}</span>`;$('#toastContainer').appendChild(el);setTimeout(()=>el.remove(),4500);}
  async function sha256(text){const buf=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(String(text)));return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');}
})();
