// App Global State
let currentBlockId = 1;
let currentTab = 'todos'; // Default to Today's To-Do
let allLectures = [];
let currentSubjectFilter = 'All';
let flashcardsList = [];
let currentCardIndex = 0;
let currentStudyLectureId = null;
let currentStudyLanguage = 'en'; // Default academic medical English
let currentQuestionsList = [];
let currentQuestionsMode = 'all';
let selectedPastPaperFile = null;
let currentAudioId = null;
let currentSelectedText = "";

// Bilingual State
let currentAppLanguage = localStorage.getItem('nezaker_lang') || 'ar';
let allTodayTasks = [];
let currentTodoFilter = 'all';

const TRANSLATIONS = {
    ar: {
        nav_home: "الرئيسية وجلسات المذاكرة",
        nav_todos: "قائمة مهام اليوم (To-Do)",
        nav_planner: "جدول المذاكرة والتقويم",
        nav_lectures: "المحاضرات والمذاكرة الشاملة",
        nav_questions: "بنك الأسئلة والكاسيز",
        nav_flashcards: "بطاقات الاستذكار (SRS)",
        nav_redo: "الإعادة والمراجعة",
        nav_audio: "المحاضرات الصوتية والدكاترة",
        nav_filter: "فلترة امتحانات سابقة (PDF/Word)",
        nav_settings: "الإعدادات والـ API",
        search_placeholder: "ابحث عن أي محاضرة، مصطلح طبي، أو متلازمة سريرية...",
        rapid_quiz_btn: "اختبار سريع (10 أسئلة)",
        anas_btn: "ريكورد أنس بالتايم كود",
        future_doc: "طبيب المستقبل",
        lang_toggle: "English (EN)",
        todos_title: "قائمة مهام اليوم (Today's Study Mission) 🎯",
        todos_sub: "علم على المهام المنجزة واعرف بدقة ما المطلوب منك مذاكرته ومراجعته اليوم.",
        todos_progress_label: "إنجاز مهام اليوم:",
        urgent_review_title: "تنبيه مراجعة متباعدة لليوم:",
        btn_start_review_now: "ابدأ المراجعة الآن",
        planner_sub: "جدول دراسي متوازن يوزع عبء الصفحات بالتساوي دون تكديس، ويضع مراجعتين تراكميتين متباعدتين لكل محاضرة.",
        btn_adjust_schedule: "ضبط الإجازات وموازنة الجدول",
        stat_studied: "محاضرة تمت دراستها",
        stat_questions: "سؤال تم حله",
        tag_study: "دراسة جديدة",
        tag_quiz: "مراجعة أولى",
        tag_cards: "مراجعة ثانية",
        tag_final: "مراجعة ختامية",
        btn_start_study: "ابدأ المذاكرة",
        btn_solve_q: "حل الأسئلة",
        btn_rev_cards: "راجع البطاقات",
        btn_prev_exams: "امتحانات سابقة",
        add_custom_task: "إضافة مهمة شخصية",
        filter_all: "الكل",
        filter_pending: "المتبقية",
        filter_completed: "المكتملة",
        empty_todos: "لا توجد مهام في هذا التصنيف حالياً",
        empty_todos_sub: "استمر في التقدم الرائع أو أضف مهام شخصية جديدة!",
        cal_all_days: "عرض كل الأيام",
        cal_week: "الأسبوع",
        cal_today: "خطة اليوم",
        cal_off_day: "يوم إجازة واستراحة",
        cal_off_desc: "راحة ذهنية واستعادة نشاط لتثبيت المعلومات والتحصيل الطبي بصفاء ذهن.",
        cal_tasks_count: "مهام دراسية متوازنة",
        cal_view_btn: "عرض",
        fc_prev: "السابق",
        fc_flip: "اقلب البطاقة (Space)",
        fc_next: "التالي",
        add_lecture_btn: "+ إضافة محاضرة (PDF)",
        modal_add_lec_title: "إضافة محاضرة عبر ملف PDF",
        lbl_lec_title: "عنوان المحاضرة (Title):",
        lbl_lec_subject: "المادة الطبية (Subject):",
        lbl_lec_pages: "عدد الصفحات:",
        lbl_lec_num: "رقم المحاضرة:",
        lbl_lec_diff: "مستوى الصعوبة:",
        lbl_lec_notes: "ملاحظات أو نقاط رئيسية (اختياري):",
        lbl_lec_rebalance: "إعادة موازنة الجدول الدراسي تلقائياً لإدراج المحاضرة ومراجعاتها",
        btn_save_lec: "رفع ومعالجة المحاضرة",
        exp_saved: "شرح محفوظ",
        exp_regen: "إعادة التوليد"
    },
    en: {
        nav_home: "Home & Study Sessions",
        nav_todos: "Today's To-Do List",
        nav_planner: "Study Plan & Calendar",
        nav_lectures: "Lectures & Study Hub",
        nav_questions: "Question Bank & Cases",
        nav_flashcards: "Flashcards (SRS)",
        nav_redo: "Redo & Review",
        nav_audio: "Audio Lab & Lectures",
        nav_filter: "Past Papers Filter (PDF/Word)",
        nav_settings: "Settings & API",
        search_placeholder: "Search any lecture, medical term, or clinical syndrome...",
        rapid_quiz_btn: "Quick Quiz (10 Qs)",
        anas_btn: "Dr. Anas Audio & Timestamps",
        future_doc: "Future Doctor",
        lang_toggle: "العربية (AR)",
        todos_title: "Today's Study Mission 🎯",
        todos_sub: "Check off completed tasks and know exactly what to study and review today.",
        todos_progress_label: "Today's Progress:",
        urgent_review_title: "Spaced Review Due Today:",
        btn_start_review_now: "Start Review Now",
        planner_sub: "Balanced medical schedule distributing page workload evenly with 2 staggered reviews per lecture.",
        btn_adjust_schedule: "Adjust Off-Days & Balance",
        stat_studied: "Lectures Studied",
        stat_questions: "Questions Solved",
        tag_study: "New Study",
        tag_quiz: "Quiz Review",
        tag_cards: "Flashcard Review",
        tag_final: "Final Review",
        btn_start_study: "Start Study",
        btn_solve_q: "Solve Questions",
        btn_rev_cards: "Review Cards",
        btn_prev_exams: "Past Papers",
        add_custom_task: "Add Personal Task",
        filter_all: "All",
        filter_pending: "Pending",
        filter_completed: "Completed",
        empty_todos: "No tasks in this category right now",
        empty_todos_sub: "Keep up the great progress or add new personal tasks!",
        cal_all_days: "All Days",
        cal_week: "Week",
        cal_today: "Today's Mission",
        cal_off_day: "Off-Day / Rest Day",
        cal_off_desc: "Mental rest and recharge to consolidate medical knowledge.",
        cal_tasks_count: "Balanced Study Tasks",
        cal_view_btn: "View",
        fc_prev: "Previous",
        fc_flip: "Flip Card (Space)",
        fc_next: "Next",
        add_lecture_btn: "+ Add Lecture (PDF)",
        modal_add_lec_title: "Add Lecture via PDF",
        lbl_lec_title: "Lecture Title:",
        lbl_lec_subject: "Medical Subject:",
        lbl_lec_pages: "Page Count:",
        lbl_lec_num: "Lecture Number:",
        lbl_lec_diff: "Difficulty Level:",
        lbl_lec_notes: "Key Notes or Keywords (optional):",
        lbl_lec_rebalance: "Auto-rebalance study schedule to include this lecture and reviews",
        btn_save_lec: "Upload & Process Lecture",
        exp_saved: "Saved Explanation",
        exp_regen: "Regenerate"
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    requestDesktopNotificationPermission();
    applyAppLanguage(currentAppLanguage);
    initAudioSystemListeners();
    await loadInitialData();
});

// INITIAL LOADER
async function loadInitialData() {
    await loadBlocks();
    await loadDashboardStats();
    await loadHomeSessions();
    await loadCalendar();
    await loadLectures();
    await loadRedoSummaryBadge();
    await loadReferenceBooksList();
    await loadAppSettings();
    startRedoDueChecker();
}

function toggleGlobalAppLanguage() {
    currentAppLanguage = (currentAppLanguage === 'ar') ? 'en' : 'ar';
    localStorage.setItem('nezaker_lang', currentAppLanguage);
    applyAppLanguage(currentAppLanguage);
}

function applyAppLanguage(lang) {
    const dict = TRANSLATIONS[lang] || TRANSLATIONS['ar'];
    document.documentElement.lang = lang;
    document.documentElement.dir = (lang === 'ar') ? 'rtl' : 'ltr';

    const labelEl = document.getElementById('globalLangLabel');
    if (labelEl) labelEl.innerText = dict.lang_toggle;

    const searchInput = document.getElementById('globalSearchInput');
    if (searchInput && dict.search_placeholder) searchInput.placeholder = dict.search_placeholder;

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (dict[key]) el.innerText = dict[key];
    });

    if (allTodayTasks.length > 0) {
        renderFilteredTodos();
    }
}

// TAB NAVIGATION
function switchTab(tabId) {
    if (tabId === 'todos') tabId = 'home';
    currentTab = tabId;
    document.querySelectorAll('.tab-pane').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

    let targetPane = document.getElementById(`tab-${tabId}`);
    if (!targetPane) targetPane = document.getElementById(`tab-${tabId.replace('_', '-')}`);
    if (targetPane) targetPane.classList.add('active');

    const navLink = document.querySelector(`.nav-item[href="#${tabId}"]`);
    if (navLink) navLink.classList.add('active');

    if (tabId === 'home' || tabId === 'todos') {
        loadHomeSessions();
    }
    if (tabId === 'planner') {
        loadDashboardStats();
        loadCalendar();
    }
    if (tabId === 'lectures') loadLectures();
    if (tabId === 'questions') loadQuestions();
    if (tabId === 'flashcards') {
        loadFlashcardsHierarchy();
        loadFlashcards();
    }
    if (tabId === 'redo') loadRedoHubData();
    if (tabId === 'audio') loadAudioHistory();
    if (tabId === 'filter') {
        loadExamSources();
        loadFilterLectures();
    }
    if (tabId === 'tokens') {
        loadTokenStats();
    }
    if (tabId === 'formatives') {
        loadFormativeSourcesHistory();
    }
    if (tabId === 'book_auditor') {
        loadBookAuditorTab();
    }
    if (tabId === 'settings') {
        loadAppSettings();
    }
}

// ----------------- BACKGROUND TASKS & NOTIFICATION SYSTEM -----------------
let activeBgTasks = [];
let isBgTaskCollapsed = false;

// Audio Chime via Web Audio API
function playCompletionChime(type = 'success') {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        if (ctx.state === 'suspended') {
            ctx.resume();
        }
        const now = ctx.currentTime;
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc1.type = 'sine';
        osc2.type = 'sine';
        
        if (type === 'success') {
            // Uplifting two-tone chime (F5 698.46Hz -> A5 880Hz)
            osc1.frequency.setValueAtTime(698.46, now);
            osc1.frequency.exponentialRampToValueAtTime(880.00, now + 0.12);
            osc2.frequency.setValueAtTime(880.00, now + 0.12);
            osc2.frequency.exponentialRampToValueAtTime(1046.50, now + 0.28);
        } else if (type === 'error') {
            osc1.frequency.setValueAtTime(440.00, now);
            osc1.frequency.exponentialRampToValueAtTime(311.13, now + 0.22);
            osc2.frequency.setValueAtTime(311.13, now + 0.22);
        } else {
            osc1.frequency.setValueAtTime(523.25, now);
            osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.15);
        }
        
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);
        
        osc1.start(now);
        osc1.stop(now + 0.45);
        osc2.start(now + 0.1);
        osc2.stop(now + 0.45);
    } catch (e) {
        // AudioContext blocked or unsupported
    }
}

// Native Desktop Notifications
function requestDesktopNotificationPermission() {
    try {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    } catch (e) {}
}

function showDesktopNotification(title, body) {
    try {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, {
                body: body,
                dir: 'rtl',
                lang: 'ar'
            });
        }
    } catch (e) {}
}

// Interactive Toast Notification
function showToast({
    type = 'success',
    title = null,
    message = '',
    actionText = null,
    onAction = null,
    duration = 7000
}) {
    if (!title) {
        if (type === 'error' || type === 'danger') title = 'تنبيه خطأ ⚠️';
        else if (type === 'warning') title = 'تنبيه ⚠️';
        else if (type === 'info') title = 'معلومة ℹ️';
        else title = 'تمت العملية بنجاح';
    }
    playCompletionChime(type);
    showDesktopNotification(title, message);

    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `app-toast toast-${type}`;
    
    const iconClass = type === 'success' ? 'fa-circle-check toast-icon-success'
                    : type === 'error' ? 'fa-circle-xmark toast-icon-error'
                    : type === 'warning' ? 'fa-triangle-exclamation toast-icon-warning'
                    : 'fa-circle-info toast-icon-info';
                    
    let actionBtnHtml = '';
    if (actionText && typeof onAction === 'function') {
        actionBtnHtml = `<button class="toast-action-btn"><i class="fa-solid fa-arrow-left"></i> ${actionText}</button>`;
    }
    
    toast.innerHTML = `
        <div class="toast-header">
            <div class="toast-header-left">
                <i class="fa-solid ${iconClass}"></i>
                <span>${title}</span>
            </div>
            <button class="toast-close-btn" title="إغلاق">&times;</button>
        </div>
        <div class="toast-body">${message}</div>
        ${actionBtnHtml}
        <div class="toast-progress" style="transition: width ${duration}ms linear; width: 100%;"></div>
    `;
    
    const closeToast = () => {
        toast.classList.add('toast-hiding');
        setTimeout(() => {
            if (toast.parentNode) toast.remove();
        }, 300);
    };
    
    toast.querySelector('.toast-close-btn').onclick = (e) => {
        e.stopPropagation();
        closeToast();
    };
    
    if (actionText && typeof onAction === 'function') {
        const btn = toast.querySelector('.toast-action-btn');
        if (btn) {
            btn.onclick = (e) => {
                e.stopPropagation();
                closeToast();
                try { onAction(); } catch(err) { console.error(err); }
            };
        }
    }
    
    container.appendChild(toast);
    
    // Animate progress countdown bar
    setTimeout(() => {
        const bar = toast.querySelector('.toast-progress');
        if (bar) bar.style.width = '0%';
    }, 40);
    
    setTimeout(closeToast, duration);
}

// Global showNotification wrapper around showToast
function showNotification(message, type = 'info', title = null) {
    if (typeof showToast === 'function') {
        showToast({
            type: type,
            title: title || (type === 'success' ? 'تمت العملية بنجاح 🎉' : (type === 'error' ? 'تنبيه خطأ ⚠️' : 'إشعار ℹ️')),
            message: message
        });
    } else {
        alert(message);
    }
}
window.showNotification = showNotification;

// Background Task Activity Strip Manager
function updateBgTasksUI() {
    const strip = document.getElementById('backgroundTasksStrip');
    const countBadge = document.getElementById('bgTasksCountBadge');
    const titleEl = document.getElementById('loadingMessage');
    const subEl = document.getElementById('loadingSubMessage');
    const card = document.getElementById('bgTaskCard');
    
    if (!strip) return;
    
    if (activeBgTasks.length === 0) {
        strip.style.display = 'none';
        return;
    }
    
    strip.style.display = 'block';
    if (card) {
        if (isBgTaskCollapsed) {
            card.classList.add('collapsed');
        } else {
            card.classList.remove('collapsed');
        }
    }
    
    const topTask = activeBgTasks[activeBgTasks.length - 1];
    if (titleEl) titleEl.innerText = topTask.title || "جاري المعالجة بالذكاء الاصطناعي...";
    if (subEl) subEl.innerText = topTask.subMessage || "يمكنك متابعة التصفح واستخدام التطبيق بحرية...";
    
    if (countBadge) {
        if (activeBgTasks.length > 1) {
            countBadge.innerText = `${activeBgTasks.length} مهام قيد المعالجة`;
            countBadge.style.display = 'inline-block';
        } else {
            countBadge.style.display = 'none';
        }
    }
}

function toggleBgTaskCollapse() {
    isBgTaskCollapsed = !isBgTaskCollapsed;
    const icon = document.getElementById('bgTaskCollapseIcon');
    if (icon) {
        icon.className = isBgTaskCollapsed ? 'fa-solid fa-expand' : 'fa-solid fa-compress';
    }
    updateBgTasksUI();
}

function startBackgroundTask(taskId, title, subMessage) {
    const id = taskId || ('task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4));
    // Remove if existing id already present
    activeBgTasks = activeBgTasks.filter(t => t.id !== id);
    activeBgTasks.push({ id, title, subMessage });
    updateBgTasksUI();
    return id;
}

function finishBackgroundTask(taskId) {
    if (taskId) {
        activeBgTasks = activeBgTasks.filter(t => t.id !== taskId);
    } else {
        activeBgTasks.pop();
    }
    updateBgTasksUI();
}

// Non-blocking drop-in replacement for showLoading / hideLoading
function showLoading(message = "جاري المعالجة بالذكاء الاصطناعي...", subMessage = "يمكنك متابعة التصفح واستخدام التطبيق بحرية، سنشعرك فور الاكتمال...") {
    startBackgroundTask('legacy_task', message, subMessage);
}

function hideLoading() {
    finishBackgroundTask('legacy_task');
}

function openModal(id) {
    const el = document.getElementById(id);
    if (el) {
        el.style.display = 'flex';
    }
}

function closeModal(id) {
    const el = document.getElementById(id);
    if (el) {
        el.style.display = 'none';
    }
}

// Global Safe HTML Escaping
function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// ----------------- BLOCKS & STATS -----------------
async function loadBlocks() {
    try {
        const res = await fetch('/api/blocks');
        const data = await res.json();
        const selector = document.getElementById('blockSelector');
        if (selector) selector.innerHTML = '';

        const activeId = data.active_block_id || currentBlockId;

        data.blocks.forEach(b => {
            const opt = document.createElement('option');
            opt.value = b.id;
            opt.innerText = `${b.name} (${b.duration_weeks} أسابيع)`;
            if (b.id === activeId) {
                opt.selected = true;
                currentBlockId = b.id;
                const heroBlock = document.getElementById('heroBlockName');
                if (heroBlock) heroBlock.innerText = b.code || b.name;
                const headerActive = document.getElementById('headerActiveBookName');
                if (headerActive) headerActive.innerText = b.code || b.name;
                const stripActive = document.getElementById('homeActiveBookStripName');
                if (stripActive) stripActive.innerText = `${b.name} (${b.code || ''})`;
            }
            if (selector) selector.appendChild(opt);
        });

        // Block countdown in sidebar
        const activeBlock = data.blocks.find(b => b.id === activeId);
        const countdownEl = document.getElementById('blockCountdown');
        if (countdownEl && activeBlock) {
            if (activeBlock.days_left !== null && activeBlock.days_left !== undefined) {
                countdownEl.innerHTML = `<i class="fa-regular fa-clock"></i> متبقي على الامتحان: <strong>${activeBlock.days_left}</strong> يوم`;
            } else {
                countdownEl.innerHTML = `<i class="fa-solid fa-calendar"></i> المدة: ${activeBlock.duration_weeks} أسابيع`;
            }
        }
    } catch (e) {
        console.error("Failed to load blocks", e);
    }
}

async function changeActiveBlock() {
    const sel = document.getElementById('blockSelector');
    if (!sel) return;
    currentBlockId = parseInt(sel.value);
    await fetch(`/api/blocks/${currentBlockId}/select`, { method: 'POST' });
    await loadInitialData();
}

async function loadDashboardStats() {
    try {
        const lecRes = await fetch(`/api/lectures?block_id=${currentBlockId}`);
        const lecData = await lecRes.json();
        allLectures = lecData.lectures || [];

        const totalLec = allLectures.length;
        const studiedLec = allLectures.filter(l => l.is_studied).length;

        const statDone = document.getElementById('statLecturesDone');
        if (statDone) statDone.innerText = `${studiedLec} / ${totalLec}`;
        const progressPercent = totalLec > 0 ? Math.round((studiedLec / totalLec) * 100) : 0;
        const statPercent = document.getElementById('blockProgressPercent');
        if (statPercent) statPercent.innerText = `${progressPercent}%`;

        const qRes = await fetch(`/api/questions?block_id=${currentBlockId}&limit=1000`);
        const qData = await qRes.json();
        const statQuestions = document.getElementById('statQuestionsSolved');
        if (statQuestions) statQuestions.innerText = (qData.questions || []).length;
    } catch (e) {
        console.error("Stats error", e);
    }
}

// ----------------- HOME PAGE & BOOK WORKSPACES HUB (مكتبة كتبي وجلسات المذاكرة) -----------------
let allBookWorkspaces = [];

async function loadBookWorkspaces() {
    const grid = document.getElementById('bookWorkspacesGrid');
    if (!grid) return;

    try {
        const res = await fetch('/api/blocks');
        const data = await res.json();
        allBookWorkspaces = data.blocks || [];
        const activeId = data.active_block_id || currentBlockId;

        // Update home badge in sidebar
        const homeBadge = document.getElementById('homeSessionsBadge');
        if (homeBadge) {
            homeBadge.innerText = allBookWorkspaces.length;
            homeBadge.style.display = 'inline-block';
        }

        const activeBlock = allBookWorkspaces.find(b => b.id === activeId) || allBookWorkspaces[0];
        if (activeBlock) {
            currentBlockId = activeBlock.id;
            const headerActive = document.getElementById('headerActiveBookName');
            if (headerActive) headerActive.innerText = activeBlock.code || activeBlock.name;
            const stripActive = document.getElementById('homeActiveBookStripName');
            if (stripActive) stripActive.innerText = `${activeBlock.name} (${activeBlock.code || ''})`;
            const heroBlock = document.getElementById('heroBlockName');
            if (heroBlock) heroBlock.innerText = activeBlock.code || activeBlock.name;
        }

        // Render Book Cards
        let html = '';
        allBookWorkspaces.forEach(b => {
            const isActive = (b.id === activeId);
            const progress = b.progress_percent || 0;
            const daysText = (b.days_left !== null && b.days_left !== undefined) 
                ? `${b.days_left} يوم على الامتحان` 
                : `${b.duration_weeks || 4} أسابيع`;

            html += `
                <div class="dash-card book-workspace-card" style="display: flex; flex-direction: column; justify-content: space-between; border-radius: 16px; padding: 22px; position: relative; background: var(--bg-card); border: 2px solid ${isActive ? 'rgba(13, 148, 136, 0.7)' : 'var(--border-color)'}; box-shadow: ${isActive ? '0 8px 24px rgba(13, 148, 136, 0.18)' : 'none'}; transition: all 0.25s ease;">
                    <div>
                        <!-- Header: Title & Badges -->
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; margin-bottom: 12px;">
                            <div>
                                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                                    <span class="badge" style="background: rgba(59, 130, 246, 0.15); color: #60a5fa; font-weight: 700; font-size: 11px; padding: 3px 8px; border-radius: 6px;">${escapeHtml(b.code || 'BOOK')}</span>
                                    ${isActive 
                                        ? '<span class="badge" style="background: rgba(16, 185, 129, 0.2); color: #34d399; font-weight: 700; font-size: 11px; padding: 3px 8px; border-radius: 6px; border: 1px solid rgba(16, 185, 129, 0.4);"><i class="fa-solid fa-circle-check"></i> الكتاب النشط حالياً</span>' 
                                        : '<span class="badge" style="background: rgba(255,255,255,0.05); color: var(--text-muted); font-size: 11px; padding: 3px 8px; border-radius: 6px;">جلسة متاحة</span>'
                                    }
                                </div>
                                <h3 style="margin: 0; font-size: 18px; font-weight: 800; color: var(--text-main); line-height: 1.4;">${escapeHtml(b.name)}</h3>
                            </div>
                            ${allBookWorkspaces.length > 1 ? `
                                <button class="btn-icon-subtle" onclick="confirmDeleteBook(${b.id}, '${escapeHtml(b.name).replace(/'/g, "\\'")}')" title="حذف جلسة هذا الكتاب" style="color: #ef4444; opacity: 0.7; cursor: pointer; padding: 6px;">
                                    <i class="fa-regular fa-trash-can"></i>
                                </button>
                            ` : ''}
                        </div>

                        <!-- Description -->
                        <p style="font-size: 13px; color: var(--text-muted); margin: 0 0 16px 0; line-height: 1.5; min-height: 38px;">
                            ${escapeHtml(b.description || 'جلسة ومقرر دراسي مخصص يشمل المحاضرات، بنك الأسئلة، البطاقات والتفريغات الصوتية.')}
                        </p>

                        <!-- Stats Grid -->
                        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 16px;">
                            <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); border-radius: 10px; padding: 10px 12px;">
                                <div style="font-size: 11px; color: var(--text-muted); margin-bottom: 2px;"><i class="fa-solid fa-book-medical text-primary"></i> المحاضرات:</div>
                                <div style="font-size: 15px; font-weight: 800; color: var(--text-main);">${b.lectures_count} <span style="font-size: 11px; font-weight: normal; color: var(--text-muted);">(${b.studied_count} مدروسة)</span></div>
                            </div>
                            <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); border-radius: 10px; padding: 10px 12px;">
                                <div style="font-size: 11px; color: var(--text-muted); margin-bottom: 2px;"><i class="fa-solid fa-spell-check text-accent"></i> بنك الأسئلة:</div>
                                <div style="font-size: 15px; font-weight: 800; color: var(--text-main);">${b.questions_count} <span style="font-size: 11px; font-weight: normal; color: var(--text-muted);">سؤال</span></div>
                            </div>
                            <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); border-radius: 10px; padding: 10px 12px;">
                                <div style="font-size: 11px; color: var(--text-muted); margin-bottom: 2px;"><i class="fa-solid fa-layer-group" style="color: #f59e0b;"></i> بطاقات الاستذكار:</div>
                                <div style="font-size: 15px; font-weight: 800; color: var(--text-main);">${b.flashcards_count} <span style="font-size: 11px; font-weight: normal; color: var(--text-muted);">كارت</span></div>
                            </div>
                            <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); border-radius: 10px; padding: 10px 12px;">
                                <div style="font-size: 11px; color: var(--text-muted); margin-bottom: 2px;"><i class="fa-solid fa-microphone-lines" style="color: #a855f7;"></i> التسجيلات الصوتية:</div>
                                <div style="font-size: 15px; font-weight: 800; color: var(--text-main);">${b.audio_count} <span style="font-size: 11px; font-weight: normal; color: var(--text-muted);">ملف</span></div>
                            </div>
                        </div>

                        <!-- Progress Bar & Exam Info -->
                        <div style="margin-bottom: 18px;">
                            <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 6px;">
                                <span style="color: var(--text-muted);"><i class="fa-regular fa-calendar-check"></i> ${daysText}</span>
                                <span style="font-weight: 700; color: ${progress > 0 ? '#10b981' : 'var(--text-muted)'};">${progress}% إنجاز</span>
                            </div>
                            <div style="width: 100%; height: 7px; background: rgba(255,255,255,0.07); border-radius: 10px; overflow: hidden;">
                                <div style="width: ${progress}%; height: 100%; background: linear-gradient(90deg, #0d9488, #2563eb); border-radius: 10px; transition: width 0.3s ease;"></div>
                            </div>
                        </div>
                    </div>

                    <!-- Actions Bottom -->
                    <div>
                        <button class="btn ${isActive ? 'btn-primary' : 'btn-outline'}" onclick="selectAndEnterBook(${b.id}, 'lectures')" style="width: 100%; padding: 11px; font-weight: 700; font-size: 14px; display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 8px; border-radius: 10px; box-shadow: ${isActive ? '0 4px 14px rgba(13, 148, 136, 0.3)' : 'none'};">
                            <i class="fa-solid fa-door-open"></i>
                            <span>${isActive ? 'دخول ومتابعة مذاكرة الكتاب 🚀' : 'تفعيل والانتقال لمذاكرة الكتاب'}</span>
                        </button>
                        <div style="display: flex; gap: 6px;">
                            <button class="btn btn-xs btn-outline" onclick="selectAndEnterBook(${b.id}, 'questions')" style="flex: 1;" title="فتح بنك أسئلة هذا الكتاب">
                                <i class="fa-solid fa-spell-check"></i> الأسئلة
                            </button>
                            <button class="btn btn-xs btn-outline" onclick="selectAndEnterBook(${b.id}, 'flashcards')" style="flex: 1;" title="فتح بطاقات هذا الكتاب">
                                <i class="fa-solid fa-layer-group"></i> البطاقات
                            </button>
                            <button class="btn btn-xs btn-outline" onclick="selectAndEnterBook(${b.id}, 'audio')" style="flex: 1;" title="فتح التسجيلات الصوتية">
                                <i class="fa-solid fa-microphone-lines"></i> الصوتيات
                            </button>
                            <button class="btn btn-xs btn-outline" onclick="selectAndEnterBook(${b.id}, 'planner')" style="flex: 1;" title="فتح جدول هذا الكتاب">
                                <i class="fa-solid fa-calendar-days"></i> الجدول
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });

        // Add Dashed "+ Create New Book" Card
        html += `
            <div onclick="openCreateBookModal()" class="dash-card" style="border: 2px dashed rgba(13, 148, 136, 0.45); background: rgba(13, 148, 136, 0.03); border-radius: 16px; padding: 24px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; cursor: pointer; min-height: 320px; transition: all 0.25s ease;" onmouseenter="this.style.background='rgba(13, 148, 136, 0.08)'; this.style.borderColor='var(--primary)';" onmouseleave="this.style.background='rgba(13, 148, 136, 0.03)'; this.style.borderColor='rgba(13, 148, 136, 0.45)';">
                <div style="width: 58px; height: 58px; border-radius: 50%; background: rgba(13, 148, 136, 0.15); color: var(--primary-light); display: flex; align-items: center; justify-content: center; font-size: 24px; margin-bottom: 14px;">
                    <i class="fa-solid fa-plus"></i>
                </div>
                <h4 style="margin: 0 0 6px 0; font-size: 17px; font-weight: 800; color: var(--text-main);">+ إنشاء جلسة كتاب جديد</h4>
                <p style="margin: 0; font-size: 13px; color: var(--text-muted); max-width: 240px; line-height: 1.4;">
                    أضف مقرراً دراسياً مستقلاً (مثل CVS أو Pharma أو Pathology) بمحاضراته وجدوله الخاص.
                </p>
            </div>
        `;

        grid.innerHTML = html;
    } catch (e) {
        console.error("Failed to load book workspaces", e);
        grid.innerHTML = `<div style="color: #ef4444; padding: 20px; text-align: center;">تعذر تحميل جلسات الكتب: ${e.message}</div>`;
    }
}

// Global alias so all existing calls to loadHomeSessions work seamlessly
const loadHomeSessions = loadBookWorkspaces;

async function selectAndEnterBook(blockId, targetTab = 'lectures') {
    try {
        const res = await fetch(`/api/blocks/${blockId}/select`, { method: 'POST' });
        const data = await res.json();
        if (data.success) {
            currentBlockId = blockId;
            const sel = document.getElementById('blockSelector');
            if (sel) sel.value = blockId;

            const selectedBlock = allBookWorkspaces.find(b => b.id === blockId);
            const bookName = selectedBlock ? (selectedBlock.code || selectedBlock.name) : `المقرر #${blockId}`;

            const headerActive = document.getElementById('headerActiveBookName');
            if (headerActive) headerActive.innerText = selectedBlock ? (selectedBlock.code || selectedBlock.name) : '';
            const stripActive = document.getElementById('homeActiveBookStripName');
            if (stripActive) stripActive.innerText = selectedBlock ? `${selectedBlock.name} (${selectedBlock.code || ''})` : '';
            const heroBlock = document.getElementById('heroBlockName');
            if (heroBlock) heroBlock.innerText = selectedBlock ? (selectedBlock.code || selectedBlock.name) : '';

            await loadBlocks();
            await loadDashboardStats();
            
            switchTab(targetTab);

            showToast({
                type: 'success',
                title: 'تم تفعيل الكتاب',
                message: `أنت الآن تذاكر: ${bookName}`
            });
        }
    } catch (e) {
        console.error("Failed to select book", e);
        showToast({
            type: 'error',
            title: 'خطأ',
            message: "تعذر تفعيل الكتاب: " + e.message
        });
    }
}

function openCreateBookModal() {
    const modal = document.getElementById('createBookModal');
    if (!modal) return;

    const nameInp = document.getElementById('newBookName');
    if (nameInp) nameInp.value = '';
    const codeInp = document.getElementById('newBookCode');
    if (codeInp) codeInp.value = '';
    const descInp = document.getElementById('newBookDesc');
    if (descInp) descInp.value = '';
    const weeksInp = document.getElementById('newBookWeeks');
    if (weeksInp) weeksInp.value = '4';
    const hoursInp = document.getElementById('newBookDailyHours');
    if (hoursInp) hoursInp.value = '4';

    const examDateInp = document.getElementById('newBookExamDate');
    if (examDateInp) {
        const d = new Date();
        d.setDate(d.getDate() + 28);
        examDateInp.value = d.toISOString().split('T')[0];
    }

    openModal('createBookModal');
    if (nameInp) nameInp.focus();
}

function openNewBlockModal() {
    openCreateBookModal();
}

async function confirmCreateBook() {
    const name = (document.getElementById('newBookName')?.value || '').trim();
    if (!name) {
        alert("يرجى كتابة اسم الكتاب أو المقرر الدراسي.");
        return;
    }

    const code = (document.getElementById('newBookCode')?.value || '').trim().toUpperCase();
    const description = (document.getElementById('newBookDesc')?.value || '').trim();
    const durationWeeks = parseInt(document.getElementById('newBookWeeks')?.value || '4');
    const dailyHours = parseFloat(document.getElementById('newBookDailyHours')?.value || '4');
    const examDate = document.getElementById('newBookExamDate')?.value || null;

    try {
        const res = await fetch('/api/blocks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: name,
                code: code || name.split(' ')[0],
                description: description,
                duration_weeks: durationWeeks,
                daily_hours: dailyHours,
                exam_date: examDate
            })
        });

        const data = await res.json();
        if (data.success) {
            closeModal('createBookModal');
            currentBlockId = data.id;
            await loadBlocks();
            await loadBookWorkspaces();
            await loadDashboardStats();
            showToast({
                type: 'success',
                title: 'تم إنشاء الجلسة',
                message: `تم إنشاء جلسة "${name}" وتفعيلها بنجاح 📚`
            });
        } else {
            alert("حدث خطأ أثناء الإنشاء: " + (data.error || 'خطأ غير معروف'));
        }
    } catch (e) {
        console.error("Create book error:", e);
        alert("خطأ في الاتصال: " + e.message);
    }
}

async function confirmDeleteBook(blockId, bookName) {
    if (!confirm(`هل أنت متأكد من حذف جلسة "${bookName}"؟\nسيتم حذف جميع المحاضرات والأسئلة والبطاقات المرتبطة بهذا الكتاب نهائياً.`)) {
        return;
    }

    try {
        const res = await fetch(`/api/blocks/${blockId}/delete`, { method: 'POST' });
        const data = await res.json();
        if (data.success) {
            showToast({
                type: 'info',
                title: 'تم الحذف',
                message: `تم حذف جلسة "${bookName}" بنجاح`
            });
            await loadBlocks();
            await loadBookWorkspaces();
            await loadDashboardStats();
        } else {
            alert("تعذر حذف الجلسة: " + (data.error || 'خطأ غير معروف'));
        }
    } catch (e) {
        console.error("Delete book error:", e);
        alert("خطأ في الاتصال: " + e.message);
    }
}

// Helpers retained for backward compatibility
async function toggleSessionComplete(taskId, newStatus) {
    try {
        await fetch(`/api/todos/${taskId}/toggle`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ is_completed: newStatus })
        });
        await loadBookWorkspaces();
        if (typeof loadDashboardStats === 'function') loadDashboardStats();
    } catch (e) {
        console.error("Failed to toggle session", e);
    }
}

async function confirmDeleteStudySession(taskId) {
    try {
        await fetch(`/api/study_sessions/${taskId}/delete`, { method: 'POST' });
        await loadBookWorkspaces();
    } catch (e) {}
}

async function openAddStudySessionModal() {
    openCreateBookModal();
}

async function confirmAddStudySession() {
    await confirmCreateBook();
}

function openAddCustomTodoModal() {
    openCreateBookModal();
}

async function confirmAddCustomTodo() {
    await confirmCreateBook();
}

const loadTodos = loadBookWorkspaces;
const toggleTask = toggleSessionComplete;

let calendarTasks = [];
let calendarBlockInfo = {};
let calendarScheduleConfig = {};
let calendarAllDays = [];
let selectedCalendarWeek = 'all';

async function loadCalendar() {
    try {
        if (!allLectures || allLectures.length === 0) {
            const lecRes = await fetch(`/api/lectures?block_id=${currentBlockId}`);
            const lecData = await lecRes.json();
            allLectures = lecData.lectures || [];
        }
        populateScheduleLectureDropdown();

        const res = await fetch(`/api/calendar?block_id=${currentBlockId}`);
        const data = await res.json();
        calendarTasks = data.tasks || [];
        calendarBlockInfo = data.block || {};
        calendarScheduleConfig = data.schedule_config || {};

        buildCalendarStructure();
        renderCalendarWeekChips();
        renderCalendarTimeline();
    } catch (e) {
        console.error("Calendar load error", e);
    }
}

function buildCalendarStructure() {
    calendarAllDays = [];
    const grouped = {};
    calendarTasks.forEach(t => {
        if (!grouped[t.plan_date]) grouped[t.plan_date] = [];
        grouped[t.plan_date].push(t);
    });

    let startStr = calendarBlockInfo.start_date;
    if (!startStr && calendarTasks.length > 0) {
        startStr = calendarTasks[0].plan_date;
    }
    if (!startStr) {
        startStr = new Date().toISOString().split('T')[0];
    }

    const durationWeeks = parseInt(calendarBlockInfo.duration_weeks) || 5;
    const totalDays = durationWeeks * 7;

    const [sY, sM, sD] = startStr.split('-').map(Number);
    const startDateObj = new Date(sY, sM - 1, sD, 12, 0, 0);

    for (let i = 0; i < totalDays; i++) {
        const dObj = new Date(startDateObj.getTime() + i * 86400000);
        const y = dObj.getFullYear();
        const m = String(dObj.getMonth() + 1).padStart(2, '0');
        const d = String(dObj.getDate()).padStart(2, '0');
        const dateStr = `${y}-${m}-${d}`;

        const weekNumber = Math.floor(i / 7) + 1;
        const dayInWeek = (i % 7) + 1;
        const tasks = grouped[dateStr] || [];
        const isOffDay = (tasks.length === 0);

        calendarAllDays.push({
            dateStr: dateStr,
            dateObj: dObj,
            weekNumber: weekNumber,
            dayInWeek: dayInWeek,
            tasks: tasks,
            isOffDay: isOffDay
        });
    }
}

function renderCalendarWeekChips() {
    const chipsContainer = document.getElementById('calendarWeekChips');
    if (!chipsContainer) return;
    chipsContainer.innerHTML = '';

    const dict = TRANSLATIONS[currentAppLanguage] || TRANSLATIONS['ar'];
    const durationWeeks = parseInt(calendarBlockInfo.duration_weeks) || 5;

    // 1. All Days chip
    const allChip = document.createElement('button');
    allChip.className = `chip ${selectedCalendarWeek === 'all' ? 'active' : ''}`;
    allChip.innerHTML = `<i class="fa-solid fa-globe"></i> ${dict.cal_all_days} (${calendarAllDays.length})`;
    allChip.onclick = () => filterCalendarWeek('all');
    chipsContainer.appendChild(allChip);

    // 2. Week 1..N chips
    for (let w = 1; w <= durationWeeks; w++) {
        const wChip = document.createElement('button');
        wChip.className = `chip ${selectedCalendarWeek === w ? 'active' : ''}`;
        wChip.innerHTML = `<i class="fa-solid fa-calendar-week"></i> ${dict.cal_week} ${w}`;
        wChip.onclick = () => filterCalendarWeek(w);
        chipsContainer.appendChild(wChip);
    }

    // 3. Today chip
    const todayChip = document.createElement('button');
    todayChip.className = `chip ${selectedCalendarWeek === 'today' ? 'active' : ''}`;
    todayChip.innerHTML = `<i class="fa-solid fa-location-crosshairs"></i> ${dict.cal_today}`;
    todayChip.onclick = () => filterCalendarWeek('today');
    chipsContainer.appendChild(todayChip);
}

function filterCalendarWeek(week) {
    selectedCalendarWeek = week;
    renderCalendarWeekChips();
    renderCalendarTimeline();
}

function renderCalendarTimeline() {
    const container = document.getElementById('miniCalendarTimeline');
    if (!container) return;
    container.innerHTML = '';

    const dict = TRANSLATIONS[currentAppLanguage] || TRANSLATIONS['ar'];
    const isEn = currentAppLanguage === 'en';
    const locale = isEn ? 'en-US' : 'ar-EG';
    const todayStr = new Date().toISOString().split('T')[0];

    if (calendarAllDays.length === 0) {
        container.innerHTML = `<div class="empty-state-card">انقر على "ضبط الإجازات وموازنة الجدول" لبرمجة الخطة.</div>`;
        return;
    }

    let filteredDays = calendarAllDays;
    if (selectedCalendarWeek === 'today') {
        filteredDays = calendarAllDays.filter(d => d.dateStr === todayStr);
        if (filteredDays.length === 0) {
            filteredDays = [calendarAllDays[0]];
        }
    } else if (selectedCalendarWeek !== 'all') {
        const targetWeek = parseInt(selectedCalendarWeek);
        filteredDays = calendarAllDays.filter(d => d.weekNumber === targetWeek);
    }

    let currentRenderedWeek = null;

    filteredDays.forEach(day => {
        if (selectedCalendarWeek === 'all' && day.weekNumber !== currentRenderedWeek) {
            currentRenderedWeek = day.weekNumber;
            const weekHeader = document.createElement('div');
            weekHeader.className = 'calendar-week-header';
            weekHeader.style.padding = '10px 14px';
            weekHeader.style.margin = '16px 0 10px 0';
            weekHeader.style.borderRadius = 'var(--radius-sm)';
            weekHeader.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
            weekHeader.style.borderRight = (!isEn) ? '4px solid var(--primary)' : 'none';
            weekHeader.style.borderLeft = (isEn) ? '4px solid var(--primary)' : 'none';
            weekHeader.style.fontWeight = '700';
            weekHeader.style.fontSize = '14px';
            weekHeader.style.color = 'var(--primary-light)';
            weekHeader.innerHTML = `<i class="fa-solid fa-calendar-check"></i> ${dict.cal_week} ${day.weekNumber}`;
            container.appendChild(weekHeader);
        }

        const isToday = (day.dateStr === todayStr);
        const dayName = day.dateObj.toLocaleDateString(locale, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });

        const groupCard = document.createElement('div');
        groupCard.className = 'cal-day-group';
        groupCard.setAttribute('data-date', day.dateStr);
        groupCard.id = `cal-day-${day.dateStr}`;
        groupCard.style.padding = '14px 18px';
        groupCard.style.marginBottom = '12px';
        groupCard.style.borderRadius = 'var(--radius-md)';
        groupCard.style.transition = 'var(--transition)';

        if (day.isOffDay) {
            groupCard.style.backgroundColor = 'rgba(34, 197, 94, 0.04)';
            groupCard.style.border = isToday ? '2px solid #10b981' : '1px dashed rgba(34, 197, 94, 0.3)';
            groupCard.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; font-size:13.5px; font-weight:700; color:#10b981; flex-wrap:wrap; gap:8px;">
                    <span><i class="fa-solid fa-mug-hot"></i> ${dayName} ${isToday ? `<span class="badge-pulse" style="font-size:10px; margin-inline-start:8px;">📍 ${dict.cal_today}</span>` : ''}</span>
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span class="badge-tag" style="background: rgba(34, 197, 94, 0.15); color: #10b981; border: 1px solid rgba(34, 197, 94, 0.3);">
                            🌴 ${dict.cal_off_day}
                        </span>
                        <button class="btn btn-sm btn-outline-primary" style="font-size:11px; padding:3px 10px;" onclick="toggleCalendarDayRest('${day.dateStr}', false)" title="تحويل هذا اليوم إلى يوم مذاكرة وإعادة موازنة المهام">
                            <i class="fa-solid fa-book-open"></i> تحويل ليوم مذاكرة
                        </button>
                    </div>
                </div>
                <p style="font-size: 12px; color: var(--text-muted); margin: 6px 0 0 0;">
                    ${dict.cal_off_desc}
                </p>
            `;
            container.appendChild(groupCard);
            return;
        }

        groupCard.style.backgroundColor = isToday ? 'rgba(59, 130, 246, 0.08)' : 'var(--bg-card)';
        groupCard.style.border = isToday ? '2px solid var(--primary)' : '1px solid var(--border-color)';

        let tasksHtml = '';
        day.tasks.forEach(dt => {
            let badgeClass = 'tag-study';
            let subtab = 'explanation';
            let badgeText = dict.tag_study;

            if (dt.task_type === 'spaced_review_quiz') {
                badgeClass = 'tag-quiz';
                subtab = 'quiz';
                badgeText = dict.tag_quiz;
            } else if (dt.task_type === 'spaced_review_cards') {
                badgeClass = 'tag-cards';
                subtab = 'flashcards';
                badgeText = dict.tag_cards;
            } else if (dt.task_type === 'comprehensive_review') {
                badgeClass = 'tag-cases';
                subtab = 'flashcards';
                badgeText = '🔄 مراجعة شاملة';
            } else if (dt.task_type === 'final_block_revision') {
                badgeClass = 'tag-quiz';
                subtab = 'quiz';
                badgeText = dict.tag_final;
            } else if (dt.task_type === 'custom_task') {
                badgeClass = 'tag-cases';
                badgeText = isEn ? 'Personal Task' : 'مهمة شخصية';
                subtab = 'none';
            }

            let actionBtn = '';
            if (dt.task_type === 'comprehensive_review') {
                actionBtn = `
                    <div style="display: flex; gap: 6px; align-items: center;">
                        <button class="btn btn-sm btn-accent" style="font-size:11px; padding:3px 10px;" onclick="switchTab('flashcards')" title="بدء المراجعة الشاملة التراكمية بالبطاقات">
                            <i class="fa-solid fa-brain"></i> مراجعة شاملة
                        </button>
                    </div>
                `;
            } else if (dt.task_type !== 'custom_task' && dt.lecture_id) {
                actionBtn = `
                    <div style="display: flex; gap: 6px; align-items: center;">
                        <button class="btn btn-sm btn-subtle" style="font-size:11px; padding:3px 8px;" onclick="inspectLectureInSchedule(${dt.lecture_id})" title="استعلام وتتبع مواعيد هذه المحاضرة ومراجعاتها">
                            <i class="fa-solid fa-route text-primary"></i>
                        </button>
                        <button class="btn btn-sm btn-outline" style="font-size:11px; padding:3px 10px;" onclick="openLectureStudyCenter(${dt.lecture_id}, '${subtab}')">
                            ${dict.cal_view_btn}
                        </button>
                    </div>
                `;
            }

            const isDone = Boolean(dt.is_completed);
            const safeTitle = escapeHtml(dt.title).replace(/'/g, "\\'");
            const checkBtn = isDone
                ? `<button type="button" class="btn btn-sm" style="background:transparent; border:none; color:#10b981; cursor:pointer; padding:2px 6px; font-size:15px;" onclick="toggleTaskCompletionDirect(${dt.id}, false, event)" title="تم الإنجاز بنجاح (انقر للتراجع)">
                    <i class="fa-solid fa-circle-check"></i>
                   </button>`
                : `<button type="button" class="btn btn-sm" style="background:transparent; border:none; color:var(--text-muted); cursor:pointer; padding:2px 6px; font-size:15px;" onclick="promptTaskCompletion(${dt.id}, '${safeTitle}', event)" title="تعليم كمنجز">
                    <i class="fa-regular fa-circle"></i>
                   </button>`;

            const titleStyle = isDone
                ? 'font-weight:500; color: var(--text-muted); text-decoration: line-through;'
                : 'font-weight:500; color: var(--text-main);';

            tasksHtml += `
                <div style="font-size:13px; padding:8px 0; border-bottom:1px solid rgba(255,255,255,0.04); display:flex; justify-content:space-between; align-items:center; gap: 10px; ${isDone ? 'opacity: 0.8;' : ''}">
                    <div style="display:flex; align-items:center; gap:8px; flex: 1;">
                        ${checkBtn}
                        <span class="todo-tag ${badgeClass}" style="font-size:10px; padding:2px 8px; white-space: nowrap;">${badgeText}</span>
                        <span style="${titleStyle}">${dt.title}</span>
                    </div>
                    ${actionBtn}
                </div>
            `;
        });

        groupCard.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; font-size:13.5px; font-weight:700; color:var(--primary-light); margin-bottom:10px; flex-wrap:wrap; gap:8px;">
                <span><i class="fa-solid fa-calendar-day"></i> ${dayName} ${isToday ? `<span class="badge-pulse" style="font-size:10px; margin-inline-start:8px;">📍 ${dict.cal_today}</span>` : ''}</span>
                <div style="display:flex; align-items:center; gap:8px;">
                    <span class="badge-tag">${day.tasks.length} ${dict.cal_tasks_count}</span>
                    <button class="btn btn-sm btn-subtle" style="font-size:11px; padding:3px 8px; color: #f59e0b;" onclick="toggleCalendarDayRest('${day.dateStr}', true)" title="جعل هذا اليوم يوم راحة وإعادة توزيع المهام تلقائياً">
                        <i class="fa-solid fa-mug-hot"></i> راحة 🌴
                    </button>
                </div>
            </div>
            <div>${tasksHtml}</div>
        `;
        container.appendChild(groupCard);
    });
}

async function toggleCalendarDayRest(dateStr, makeOff) {
    const actionText = makeOff ? 'جعل هذا اليوم يوم راحة' : 'تحويل هذا اليوم ليوم مذاكرة';
    showLoading(
        `جاري ${actionText} وموازنة باقي الأيام...`,
        "يتم الآن إعادة توزيع المحاضرات والمراجعات بدقة بحسب عدد الصفحات."
    );
    try {
        const res = await fetch('/api/calendar/toggle_day_off', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                block_id: currentBlockId,
                date: dateStr,
                is_off: makeOff
            })
        });
        const data = await res.json();
        hideLoading();
        if (data.error) {
            showToast({ type: 'error', title: 'تنبيه', message: data.error });
            return;
        }
        await loadCalendar();
        await loadTodos();
        showToast({
            type: 'success',
            title: makeOff ? 'تم تعيين يوم الراحة بنجاح 🌴' : 'تم تفعيل يوم المذاكرة بنجاح 📖',
            message: `تم تحديث وإعادة موازنة جدول الأيام بنجاح.`
        });
    } catch (e) {
        hideLoading();
        showToast({ type: 'error', title: 'خطأ', message: 'تعذر تعديل الجدول: ' + e.message });
    }
}

// =========================================================================
// TASK COMPLETION & ADAPTIVE RESCHEDULING
// =========================================================================
let pendingCompletionTaskId = null;
let pendingCompletionTaskTitle = "";

function promptTaskCompletion(taskId, taskTitle, event) {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }
    pendingCompletionTaskId = taskId;
    pendingCompletionTaskTitle = taskTitle || "";
    const titleEl = document.getElementById("taskCompletionModalTitle");
    if (titleEl) {
        titleEl.textContent = taskTitle ? `المهمة: "${taskTitle}"` : "";
    }
    openModal("taskCompletionChoiceModal");
}

async function executeTaskCompletionNormal() {
    if (!pendingCompletionTaskId) return;
    const taskId = pendingCompletionTaskId;
    closeModal("taskCompletionChoiceModal");
    showLoading("جاري تسجيل الإنجاز...", "يتم حفظ حالة المهمة...");
    try {
        const res = await fetch(`/api/todos/${taskId}/toggle`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ is_completed: true })
        });
        const data = await res.json();
        hideLoading();
        if (data.success) {
            showToast({
                type: "success",
                title: "تم الإنجاز بنجاح 🎉",
                message: "تم حفظ إنجاز المهمة لليوم مع الحفاظ على مواعيد الجدول."
            });
            await loadCalendar();
            await loadTodos();
            if (typeof loadDashboardStats === 'function') loadDashboardStats();
            if (currentInspectedLectureSchedule && currentInspectedLectureSchedule.lecture) {
                await inspectLectureInSchedule(currentInspectedLectureSchedule.lecture.id);
            }
        } else {
            showToast({ type: "error", title: "خطأ", message: data.error || "فشل تسجيل الإنجاز" });
        }
    } catch (e) {
        hideLoading();
        showToast({ type: "error", title: "خطأ في الاتصال", message: e.message });
    } finally {
        pendingCompletionTaskId = null;
    }
}

async function executeTaskCompletionAdaptive() {
    if (!pendingCompletionTaskId) return;
    const taskId = pendingCompletionTaskId;
    closeModal("taskCompletionChoiceModal");
    showLoading(
        "جاري تسجيل الإنجاز وإعادة موازنة الجدول ⚡...",
        "يتم تحديث مواعيد المراجعات القادمة وموازنة الأعباء المتبقية بذكاء."
    );
    try {
        const res = await fetch('/api/schedule/rebalance_adaptive', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                block_id: currentBlockId || 1,
                task_id: taskId
            })
        });
        const data = await res.json();
        hideLoading();
        if (data.success) {
            showToast({
                type: "success",
                title: "تم الإنجاز وإعادة موازنة الجدول ⚡",
                message: data.message || "تم تحديث مواعيد المراجعات وموازنة الجدول بنجاح!"
            });
            await loadCalendar();
            await loadTodos();
            if (typeof loadDashboardStats === 'function') loadDashboardStats();
            if (currentInspectedLectureSchedule && currentInspectedLectureSchedule.lecture) {
                await inspectLectureInSchedule(currentInspectedLectureSchedule.lecture.id);
            }
        } else {
            showToast({ type: "error", title: "خطأ", message: data.error || "فشل إعادة موازنة الجدول" });
        }
    } catch (e) {
        hideLoading();
        showToast({ type: "error", title: "خطأ في الاتصال", message: e.message });
    } finally {
        pendingCompletionTaskId = null;
    }
}

async function toggleTaskCompletionDirect(taskId, newStatus, event) {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }
    if (!newStatus) {
        try {
            const res = await fetch(`/api/todos/${taskId}/toggle`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ is_completed: false })
            });
            const data = await res.json();
            if (data.success) {
                showToast({
                    type: "info",
                    title: "تم التراجع",
                    message: "تم إلغاء تحديد إنجاز المهمة."
                });
                await loadCalendar();
                await loadTodos();
                if (typeof loadDashboardStats === 'function') loadDashboardStats();
                if (currentInspectedLectureSchedule && currentInspectedLectureSchedule.lecture) {
                    await inspectLectureInSchedule(currentInspectedLectureSchedule.lecture.id);
                }
            }
        } catch (e) {
            showToast({ type: "error", title: "خطأ", message: e.message });
        }
    } else {
        promptTaskCompletion(taskId, "", event);
    }
}

window.promptTaskCompletion = promptTaskCompletion;
window.executeTaskCompletionNormal = executeTaskCompletionNormal;
window.executeTaskCompletionAdaptive = executeTaskCompletionAdaptive;
window.toggleTaskCompletionDirect = toggleTaskCompletionDirect;

let modalScheduleOffMode = 'detailed';
let modalOffDatesSet = new Set();
let modalForcedStudyDatesSet = new Set();

function openScheduleSettingsModal() {
    const startInput = document.getElementById('schedStartDate');
    const weeksInput = document.getElementById('schedDurationWeeks');

    const cfgStart = calendarScheduleConfig.start_date || calendarBlockInfo.start_date;
    if (startInput) {
        startInput.value = cfgStart || new Date().toISOString().split('T')[0];
    }
    const cfgWeeks = calendarScheduleConfig.duration_weeks || calendarBlockInfo.duration_weeks || 5;
    if (weeksInput) {
        weeksInput.value = cfgWeeks;
    }

    modalOffDatesSet = new Set(calendarScheduleConfig.off_dates || []);
    modalForcedStudyDatesSet = new Set(calendarScheduleConfig.force_study_dates || []);

    const offWeekdays = calendarScheduleConfig.off_days_weekdays !== undefined ? calendarScheduleConfig.off_days_weekdays : [4];
    document.querySelectorAll('.off-day-chk').forEach(chk => {
        chk.checked = offWeekdays.includes(parseInt(chk.value));
    });

    if (modalOffDatesSet.size === 0 && modalForcedStudyDatesSet.size === 0) {
        applyWeeklyPatternToDetailed(false);
    }

    renderDetailedWeeksOffGrid();
    document.getElementById('scheduleModal').style.display = 'flex';
}

function switchScheduleOffMode(mode) {
    modalScheduleOffMode = mode;
    const btnDetailed = document.getElementById('tabBtnDetailedOff');
    const btnWeekly = document.getElementById('tabBtnWeeklyOff');
    const secDetailed = document.getElementById('sectionDetailedOffDays');
    const secWeekly = document.getElementById('sectionWeeklyOffDays');

    if (mode === 'detailed') {
        if (btnDetailed) btnDetailed.classList.add('active');
        if (btnWeekly) btnWeekly.classList.remove('active');
        if (secDetailed) secDetailed.style.display = 'block';
        if (secWeekly) secWeekly.style.display = 'none';
        renderDetailedWeeksOffGrid();
    } else {
        if (btnDetailed) btnDetailed.classList.remove('active');
        if (btnWeekly) btnWeekly.classList.add('active');
        if (secDetailed) secDetailed.style.display = 'none';
        if (secWeekly) secWeekly.style.display = 'block';
    }
}

function onScheduleParamsChanged() {
    renderDetailedWeeksOffGrid();
}

function onWeeklyCheckboxesChanged() {
    if (modalScheduleOffMode === 'detailed') {
        renderDetailedWeeksOffGrid();
    }
}

function renderDetailedWeeksOffGrid() {
    const container = document.getElementById('detailedWeeksOffContainer');
    if (!container) return;
    container.innerHTML = '';

    const startInput = document.getElementById('schedStartDate');
    const weeksInput = document.getElementById('schedDurationWeeks');
    const startDateStr = (startInput && startInput.value) ? startInput.value : new Date().toISOString().split('T')[0];
    const durationWeeks = parseInt(weeksInput ? weeksInput.value : 5) || 5;

    const [sY, sM, sD] = startDateStr.split('-').map(Number);
    const startDateObj = new Date(sY, sM - 1, sD, 12, 0, 0);

    const checkedWeekdays = [];
    document.querySelectorAll('.off-day-chk:checked').forEach(c => checkedWeekdays.push(parseInt(c.value)));

    const dayNamesAr = ["الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت", "الأحد"];
    let totalOffCount = 0;
    let totalStudyCount = 0;

    for (let w = 1; w <= durationWeeks; w++) {
        const weekCard = document.createElement('div');
        weekCard.className = 'week-off-card';

        const weekHeader = document.createElement('div');
        weekHeader.className = 'week-off-card-title';
        weekHeader.innerHTML = `
            <span><i class="fa-solid fa-calendar-week"></i> الأسبوع ${w}</span>
            <span style="font-size: 11px; font-weight: normal; color: var(--text-muted);" id="week-off-count-${w}"></span>
        `;
        weekCard.appendChild(weekHeader);

        const grid = document.createElement('div');
        grid.className = 'week-off-days-grid';

        let weekOffCount = 0;

        for (let d = 0; d < 7; d++) {
            const dayIndex = (w - 1) * 7 + d;
            const dObj = new Date(startDateObj.getTime() + dayIndex * 86400000);
            const y = dObj.getFullYear();
            const m = String(dObj.getMonth() + 1).padStart(2, '0');
            const dayNum = String(dObj.getDate()).padStart(2, '0');
            const dateStr = `${y}-${m}-${dayNum}`;

            const pyWeekday = (dObj.getDay() + 6) % 7;
            const dayName = dayNamesAr[pyWeekday];

            const isWeeklyDefault = checkedWeekdays.includes(pyWeekday);
            const isOff = (isWeeklyDefault || modalOffDatesSet.has(dateStr)) && !modalForcedStudyDatesSet.has(dateStr);

            if (isOff) {
                totalOffCount++;
                weekOffCount++;
            } else {
                totalStudyCount++;
            }

            const chip = document.createElement('div');
            chip.className = `day-chip-toggle ${isOff ? 'is-off-day' : 'is-study-day'}`;
            chip.id = `modal-day-chip-${dateStr}`;
            chip.title = isOff ? 'انقر للتحويل إلى يوم مذاكرة' : 'انقر للتحويل إلى يوم راحة';
            chip.onclick = () => toggleModalDayOff(dateStr, pyWeekday);

            chip.innerHTML = `
                <div class="day-name">${dayName}</div>
                <div class="day-date">${dayNum}/${m}</div>
                <div class="day-status">
                    ${isOff ? '<i class="fa-solid fa-mug-hot"></i> راحة 🌴' : '<i class="fa-solid fa-book-open"></i> مذاكرة 📖'}
                </div>
            `;
            grid.appendChild(chip);
        }

        weekCard.appendChild(grid);
        container.appendChild(weekCard);

        const weekCountBadge = weekCard.querySelector(`#week-off-count-${w}`);
        if (weekCountBadge) {
            weekCountBadge.textContent = `${weekOffCount} أيام راحة | ${7 - weekOffCount} أيام دراسة`;
        }
    }

    const summaryEl = document.getElementById('detailedOffDaysSummary');
    if (summaryEl) {
        summaryEl.innerHTML = `
            <span>إجمالي أيام الخطة: <strong>${durationWeeks * 7} يوم</strong></span>
            <span style="margin: 0 8px;">•</span>
            <span style="color: #10b981;">أيام الراحة: <strong>${totalOffCount} يوم</strong> 🌴</span>
            <span style="margin: 0 8px;">•</span>
            <span style="color: var(--primary-light);">أيام المذاكرة الفعلية: <strong>${totalStudyCount} يوم</strong> 📖</span>
        `;
    }
}

function toggleModalDayOff(dateStr, pyWeekday) {
    const checkedWeekdays = [];
    document.querySelectorAll('.off-day-chk:checked').forEach(c => checkedWeekdays.push(parseInt(c.value)));
    const isWeeklyDefault = checkedWeekdays.includes(pyWeekday);

    const currentlyOff = (isWeeklyDefault || modalOffDatesSet.has(dateStr)) && !modalForcedStudyDatesSet.has(dateStr);

    if (currentlyOff) {
        if (modalOffDatesSet.has(dateStr)) {
            modalOffDatesSet.delete(dateStr);
        }
        if (isWeeklyDefault) {
            modalForcedStudyDatesSet.add(dateStr);
        }
    } else {
        modalOffDatesSet.add(dateStr);
        if (modalForcedStudyDatesSet.has(dateStr)) {
            modalForcedStudyDatesSet.delete(dateStr);
        }
    }

    renderDetailedWeeksOffGrid();
}

function applyWeeklyPatternToDetailed(reRender = true) {
    const startInput = document.getElementById('schedStartDate');
    const weeksInput = document.getElementById('schedDurationWeeks');
    const startDateStr = (startInput && startInput.value) ? startInput.value : new Date().toISOString().split('T')[0];
    const durationWeeks = parseInt(weeksInput ? weeksInput.value : 5) || 5;

    const [sY, sM, sD] = startDateStr.split('-').map(Number);
    const startDateObj = new Date(sY, sM - 1, sD, 12, 0, 0);

    const checkedWeekdays = [];
    document.querySelectorAll('.off-day-chk:checked').forEach(c => checkedWeekdays.push(parseInt(c.value)));

    modalOffDatesSet.clear();
    modalForcedStudyDatesSet.clear();

    for (let i = 0; i < durationWeeks * 7; i++) {
        const dObj = new Date(startDateObj.getTime() + i * 86400000);
        const y = dObj.getFullYear();
        const m = String(dObj.getMonth() + 1).padStart(2, '0');
        const dayNum = String(dObj.getDate()).padStart(2, '0');
        const dateStr = `${y}-${m}-${dayNum}`;
        const pyWeekday = (dObj.getDay() + 6) % 7;

        if (checkedWeekdays.includes(pyWeekday)) {
            modalOffDatesSet.add(dateStr);
        }
    }

    if (reRender) {
        renderDetailedWeeksOffGrid();
        showToast({
            type: 'info',
            title: 'تم الملء بالنمط الثابت',
            message: 'تم تطبيق الأيام الأسبوعية المحددة على كافة الأسابيع. يمكنك الآن تعديل أي يوم تريده بحرية.'
        });
    }
}

function clearAllOffDaysDetailed() {
    const startInput = document.getElementById('schedStartDate');
    const weeksInput = document.getElementById('schedDurationWeeks');
    const startDateStr = (startInput && startInput.value) ? startInput.value : new Date().toISOString().split('T')[0];
    const durationWeeks = parseInt(weeksInput ? weeksInput.value : 5) || 5;

    const [sY, sM, sD] = startDateStr.split('-').map(Number);
    const startDateObj = new Date(sY, sM - 1, sD, 12, 0, 0);

    modalOffDatesSet.clear();
    modalForcedStudyDatesSet.clear();

    for (let i = 0; i < durationWeeks * 7; i++) {
        const dObj = new Date(startDateObj.getTime() + i * 86400000);
        const y = dObj.getFullYear();
        const m = String(dObj.getMonth() + 1).padStart(2, '0');
        const dayNum = String(dObj.getDate()).padStart(2, '0');
        const dateStr = `${y}-${m}-${dayNum}`;
        modalForcedStudyDatesSet.add(dateStr);
    }

    renderDetailedWeeksOffGrid();
}

function openNewBlockModal() {
    const name = prompt("أدخل اسم البلوك أو الموديول الجديد (مثال: CVS أو Renal):");
    if (!name) return;
    const weeks = prompt("كم عدد أسابيع الموديول؟", "5");
    fetch('/api/blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name, duration_weeks: parseInt(weeks) || 5 })
    }).then(r => r.json()).then(data => {
        if (data.success) {
            loadBlocks();
            alert("تم إنشاء الموديول بنجاح!");
        }
    });
}

async function confirmGenerateScheduleV2() {
    const weeks = parseInt(document.getElementById('schedDurationWeeks').value);
    const startDate = document.getElementById('schedStartDate').value;

    const offWeekdays = [];
    document.querySelectorAll('.off-day-chk:checked').forEach(c => {
        offWeekdays.push(parseInt(c.value));
    });

    const offDatesList = Array.from(modalOffDatesSet);
    const forcedStudyList = Array.from(modalForcedStudyDatesSet);

    closeModal('scheduleModal');
    showLoading(
        "جاري موازنة جدول المذاكرة بحساب عدد الصفحات وتوزيع المراجعات بالتدرج...",
        "يتم الآن توزيع المحاضرات والمراجعات على أيام المذاكرة بدقة واستبعاد أيام الراحة المحددة."
    );

    try {
        const res = await fetch('/api/calendar/generate_v2', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                block_id: currentBlockId,
                duration_weeks: weeks,
                off_days_weekdays: offWeekdays,
                off_dates: offDatesList,
                force_study_dates: forcedStudyList,
                start_date: startDate
            })
        });
        const data = await res.json();
        hideLoading();

        if (data.error) {
            showToast({ type: 'error', title: 'تنبيه', message: data.error });
            return;
        }

        await loadCalendar();
        await loadTodos();
        showToast({
            type: 'success',
            title: 'تمت موازنة وتحديث الجدول بنجاح! 📅',
            message: `تم بنجاح توزيع المحاضرات والمراجعات على ${data.available_study_days || 'كافة'} يوم مذاكرة.`,
            actionText: 'عرض جدول المذاكرة',
            onAction: () => switchTab('planner'),
            duration: 8000
        });
    } catch (e) {
        hideLoading();
        showToast({
            type: 'error',
            title: 'خطأ في توليد الجدول',
            message: String(e),
            duration: 7000
        });
    }
}

// ----------------- LECTURE SCHEDULE INSPECTOR & ROADMAP -----------------
let currentInspectedLectureSchedule = null;

function populateScheduleLectureDropdown() {
    const sel = document.getElementById('scheduleLectureSelector');
    if (!sel) return;
    const currentVal = sel.value;
    sel.innerHTML = '<option value="">-- اختر محاضرة لعرض جدولها ومواعيدها --</option>';

    if (!allLectures || allLectures.length === 0) return;

    const subjectsMap = {};
    allLectures.forEach(l => {
        const s = l.subject || 'General';
        if (!subjectsMap[s]) subjectsMap[s] = [];
        subjectsMap[s].push(l);
    });

    Object.keys(subjectsMap).forEach(subj => {
        const optgroup = document.createElement('optgroup');
        optgroup.label = subj;
        subjectsMap[subj].forEach(l => {
            const opt = document.createElement('option');
            opt.value = l.id;
            opt.innerText = `${l.lecture_number > 0 ? '#' + l.lecture_number + ' - ' : ''}${l.title} (${l.page_count || 8} ص)`;
            optgroup.appendChild(opt);
        });
        sel.appendChild(optgroup);
    });

    if (currentVal) {
        sel.value = currentVal;
    }
}

async function onSelectLectureForSchedule(lectureId) {
    const resultBox = document.getElementById('lectureScheduleTimelineResult');
    const placeholder = document.getElementById('lectureSchedulePlaceholder');
    const quickActions = document.getElementById('inspectorQuickActions');

    if (!lectureId) {
        if (resultBox) resultBox.style.display = 'none';
        if (placeholder) placeholder.style.display = 'block';
        if (quickActions) quickActions.style.display = 'none';
        currentInspectedLectureSchedule = null;
        return;
    }

    try {
        const res = await fetch(`/api/lecture/${lectureId}/schedule`);
        const data = await res.json();
        if (!data.success) {
            alert("خطأ أثناء جلب مواعيد المحاضرة");
            return;
        }

        currentInspectedLectureSchedule = data;
        renderLectureScheduleTimeline(data);
    } catch (e) {
        console.error("Error loading lecture schedule", e);
    }
}

function renderLectureScheduleTimeline(data) {
    const resultBox = document.getElementById('lectureScheduleTimelineResult');
    const placeholder = document.getElementById('lectureSchedulePlaceholder');
    const quickActions = document.getElementById('inspectorQuickActions');
    if (!resultBox) return;

    const lec = data.lecture;
    const t = data.timeline;
    const m = data.mastery;

    if (placeholder) placeholder.style.display = 'none';
    if (quickActions) quickActions.style.display = 'flex';
    resultBox.style.display = 'block';

    resultBox.innerHTML = `
        <!-- Lecture Header Summary -->
        <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: var(--radius-md); padding: 14px 18px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
            <div>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span class="badge-tag" style="background: rgba(37, 99, 235, 0.2); color: #60a5fa; font-weight: 800;">#${lec.lecture_number > 0 ? lec.lecture_number : 'M'}</span>
                    <h4 style="margin: 0; font-size: 16px; font-weight: 800; color: var(--text-main);">${lec.title}</h4>
                </div>
                <div style="font-size: 12.5px; color: var(--text-muted); margin-top: 6px; display: flex; gap: 14px; flex-wrap: wrap;">
                    <span><i class="fa-solid fa-notes-medical text-primary"></i> المادة: <strong>${lec.subject}</strong></span>
                    <span><i class="fa-regular fa-file-lines"></i> الحجم: <strong>${lec.page_count} صفحة</strong></span>
                    <span><i class="fa-solid fa-chart-pie"></i> مستوى التقدم: <strong style="color: var(--primary-light);">${m.badge}</strong></span>
                </div>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
                <div class="progress-track" style="width: 140px; height: 10px;">
                    <div class="progress-fill" style="width: ${m.percent}%;"></div>
                </div>
                <span style="font-size: 13px; font-weight: 800; color: var(--primary-light);">${m.percent}%</span>
            </div>
        </div>

        <!-- 3-Step Visual Roadmap -->
        <div class="timeline-roadmap">
            <!-- Stage 1: First Study -->
            <div class="roadmap-step-card stage-study">
                <div class="step-header">
                    <div class="step-title">
                        <span class="step-num-badge">1</span>
                        <span>📖 المذاكرة الأولى</span>
                    </div>
                    <span class="badge-tag ${t.first_study.status_badge}">${t.first_study.status_text}</span>
                </div>

                <div class="step-date-box">
                    <div class="step-date-primary">
                        <i class="fa-regular fa-calendar text-accent"></i>
                        <span>${t.first_study.formatted_date}</span>
                    </div>
                    <div class="step-date-sub">
                        <i class="fa-solid fa-flag"></i> موعد بدء دراسة المحاضرة
                    </div>
                </div>

                <div class="step-meta">
                    <span><i class="fa-regular fa-file-lines"></i> العبء: <strong>${t.first_study.workload}</strong></span>
                    ${t.first_study.is_completed ? `<span style="color: #10b981;"><i class="fa-solid fa-circle-check"></i> مكتملة</span>` : `<span style="color: var(--text-muted);"><i class="fa-regular fa-clock"></i> بانتظار البدء</span>`}
                </div>

                <div class="step-actions">
                    <button class="btn btn-sm btn-primary" style="flex: 1;" onclick="openLectureStudyCenter(${lec.id}, 'explanation')">
                        <i class="fa-solid fa-book-open-reader"></i> ابدأ المذاكرة
                    </button>
                    ${t.first_study.exists ? (
                        t.first_study.is_completed ? `
                            <button class="btn btn-sm" style="color: #10b981; border: 1px solid rgba(16,185,129,0.3);" onclick="toggleTaskCompletionDirect(${t.first_study.task_id}, false, event)" title="إلغاء الإنجاز">
                                <i class="fa-solid fa-circle-check"></i> مكتمل
                            </button>
                        ` : `
                            <button class="btn btn-sm btn-outline-success" onclick="promptTaskCompletion(${t.first_study.task_id}, '${escapeHtml(t.first_study.title).replace(/'/g, "\\'")}', event)" title="تعليم كمنجز">
                                <i class="fa-regular fa-circle-check"></i> إنجاز
                            </button>
                        `
                    ) : ''}
                    <button class="btn btn-sm btn-outline" onclick="jumpToLectureCalendarDay('${t.first_study.date}')" title="الانتقال لليوم في التقويم">
                        <i class="fa-solid fa-calendar-day"></i> اليوم
                    </button>
                </div>
            </div>

            <!-- Stage 2: Spaced Review 1 (Quiz & Active Recall) -->
            <div class="roadmap-step-card stage-rev1">
                <div class="step-header">
                    <div class="step-title">
                        <span class="step-num-badge">2</span>
                        <span>🔔 مراجعة أولى (استرجاع نشط)</span>
                    </div>
                    <span class="badge-tag ${t.review_1.status_badge}">${t.review_1.status_text}</span>
                </div>

                <div class="step-date-box">
                    <div class="step-date-primary">
                        <i class="fa-regular fa-calendar text-warning"></i>
                        <span>${t.review_1.formatted_date}</span>
                    </div>
                    <div class="step-date-sub">
                        <i class="fa-solid fa-hourglass-half"></i> ${t.review_1.days_diff_text || 'بعد يوم من المذاكرة الأولى'}
                    </div>
                </div>

                <div class="step-meta">
                    <span><i class="fa-solid fa-spell-check"></i> المستهدف: <strong>${t.review_1.workload}</strong></span>
                    ${t.review_1.is_completed ? `<span style="color: #10b981;"><i class="fa-solid fa-circle-check"></i> مكتملة</span>` : `<span style="color: var(--text-muted);"><i class="fa-solid fa-brain"></i> Active Recall</span>`}
                </div>

                <div class="step-actions">
                    <button class="btn btn-sm btn-warning" style="flex: 1;" onclick="openLectureStudyCenter(${lec.id}, 'quiz')">
                        <i class="fa-solid fa-spell-check"></i> حل أسئلة
                    </button>
                    ${t.review_1.exists ? (
                        t.review_1.is_completed ? `
                            <button class="btn btn-sm" style="color: #10b981; border: 1px solid rgba(16,185,129,0.3);" onclick="toggleTaskCompletionDirect(${t.review_1.task_id}, false, event)" title="إلغاء الإنجاز">
                                <i class="fa-solid fa-circle-check"></i> مكتمل
                            </button>
                        ` : `
                            <button class="btn btn-sm btn-outline-success" onclick="promptTaskCompletion(${t.review_1.task_id}, '${escapeHtml(t.review_1.title).replace(/'/g, "\\'")}', event)" title="تعليم كمنجز">
                                <i class="fa-regular fa-circle-check"></i> إنجاز
                            </button>
                        `
                    ) : ''}
                    <button class="btn btn-sm btn-outline" onclick="jumpToLectureCalendarDay('${t.review_1.date}')" title="الانتقال لليوم في التقويم">
                        <i class="fa-solid fa-calendar-day"></i> اليوم
                    </button>
                </div>
            </div>

            <!-- Stage 3: Second Spaced Review (Cards & Long-term Mastery) -->
            <div class="roadmap-step-card stage-rev2">
                <div class="step-header">
                    <div class="step-title">
                        <span class="step-num-badge">3</span>
                        <span>🧠 مراجعة ثانية (تثبيت طويل المدى)</span>
                    </div>
                    <span class="badge-tag ${t.review_2 ? t.review_2.status_badge : 'tag-pending'}">${t.review_2 ? t.review_2.status_text : 'غير مجدول'}</span>
                </div>

                <div class="step-date-box">
                    <div class="step-date-primary">
                        <i class="fa-regular fa-calendar text-info"></i>
                        <span>${t.review_2 ? t.review_2.formatted_date : 'غير مجدول'}</span>
                    </div>
                    <div class="step-date-sub">
                        <i class="fa-solid fa-hourglass-half"></i> ${(t.review_2 && t.review_2.days_diff_text) || 'بعد 4 أيام من المراجعة الأولى'}
                    </div>
                </div>

                <div class="step-meta">
                    <span><i class="fa-solid fa-layer-group"></i> المستهدف: <strong>${t.review_2 ? t.review_2.workload : '20 بطاقة وحالة'}</strong></span>
                    ${(t.review_2 && t.review_2.is_completed) ? `<span style="color: #10b981;"><i class="fa-solid fa-circle-check"></i> مكتملة</span>` : `<span style="color: var(--text-muted);"><i class="fa-solid fa-brain"></i> Long-term Retention</span>`}
                </div>

                <div class="step-actions">
                    <button class="btn btn-sm btn-info" style="flex: 1;" onclick="openLectureStudyCenter(${lec.id}, 'flashcards')">
                        <i class="fa-solid fa-layer-group"></i> مراجعة البطاقات
                    </button>
                    ${(t.review_2 && t.review_2.exists) ? (
                        t.review_2.is_completed ? `
                            <button class="btn btn-sm" style="color: #10b981; border: 1px solid rgba(16,185,129,0.3);" onclick="toggleTaskCompletionDirect(${t.review_2.task_id}, false, event)" title="إلغاء الإنجاز">
                                <i class="fa-solid fa-circle-check"></i> مكتمل
                            </button>
                        ` : `
                            <button class="btn btn-sm btn-outline-success" onclick="promptTaskCompletion(${t.review_2.task_id}, '${escapeHtml(t.review_2.title).replace(/'/g, "\\'")}', event)" title="تعليم كمنجز">
                                <i class="fa-regular fa-circle-check"></i> إنجاز
                            </button>
                        `
                    ) : ''}
                    <button class="btn btn-sm btn-outline" onclick="jumpToLectureCalendarDay('${t.review_2 ? t.review_2.date : ''}')" title="الانتقال لليوم في التقويم">
                        <i class="fa-solid fa-calendar-day"></i> اليوم
                    </button>
                </div>
            </div>
        </div>
    `;
}

async function inspectLectureInSchedule(lectureId) {
    if (currentTab !== 'planner') {
        switchTab('planner');
    }
    if (!allLectures || allLectures.length === 0) {
        await loadCalendar();
    } else {
        populateScheduleLectureDropdown();
    }

    const sel = document.getElementById('scheduleLectureSelector');
    if (sel) {
        sel.value = lectureId;
        await onSelectLectureForSchedule(lectureId);
        const card = document.getElementById('lectureScheduleInspectorCard');
        if (card) {
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
}

function jumpToLectureCalendarDay(targetDate) {
    if (!targetDate && currentInspectedLectureSchedule) {
        targetDate = currentInspectedLectureSchedule.timeline.first_study.date;
    }
    if (!targetDate) return;

    if (selectedCalendarWeek !== 'all') {
        filterCalendarWeek('all');
    }

    setTimeout(() => {
        const dayEl = document.getElementById(`cal-day-${targetDate}`);
        if (dayEl) {
            dayEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            dayEl.classList.remove('highlight-cal-day');
            void dayEl.offsetWidth; // trigger reflow
            dayEl.classList.add('highlight-cal-day');
            setTimeout(() => dayEl.classList.remove('highlight-cal-day'), 3000);
        }
    }, 150);
}

function openSelectedLectureStudyHub() {
    if (currentInspectedLectureSchedule && currentInspectedLectureSchedule.lecture) {
        openLectureStudyCenter(currentInspectedLectureSchedule.lecture.id);
    }
}

async function loadModalScheduleBanner(lecId) {
    const banner = document.getElementById('studyModalScheduleBanner');
    if (!banner) return;
    try {
        const res = await fetch(`/api/lecture/${lecId}/schedule`);
        const data = await res.json();
        if (data.success && data.timeline) {
            banner.style.display = 'flex';
            const t = data.timeline;
            banner.innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                    <span style="font-weight: 700; color: var(--primary-light);"><i class="fa-solid fa-route"></i> مواعيد المحاضرة في الجدول:</span>
                    <span class="badge-tag ${t.first_study.status_badge}">📖 المذاكرة الأولى: ${t.first_study.day_name} (${t.first_study.date})</span>
                    <span class="badge-tag ${t.review_1.status_badge}">🔔 مراجعة المحاضرة: ${t.review_1.day_name} (${t.review_1.date})</span>
                </div>
                <div>
                    <button class="btn btn-sm btn-outline" style="font-size: 11px; padding: 3px 10px;" onclick="closeModal('lectureStudyCenterModal'); inspectLectureInSchedule(${lecId});">
                        <i class="fa-solid fa-calendar-days"></i> عرض الخارطة الزمنية كاملة
                    </button>
                </div>
            `;
        } else {
            banner.style.display = 'none';
        }
    } catch (e) {
        banner.style.display = 'none';
    }
}

// ----------------- LECTURES & UNIFIED STUDY HUB -----------------
async function loadLectures() {
    try {
        const res = await fetch(`/api/lectures?block_id=${currentBlockId}`);
        const data = await res.json();
        allLectures = data.lectures || [];

        populateDropdowns();
        renderSubjectChips(data.subjects || []);
        renderLecturesGrid();
    } catch (e) {
        console.error(e);
    }
}

function renderSubjectChips(subjects) {
    const container = document.getElementById('subjectFilterChips');
    container.innerHTML = `<button class="chip ${currentSubjectFilter === 'All' ? 'active' : ''}" onclick="filterBySubject('All')">الكل (${allLectures.length})</button>`;

    subjects.forEach(subj => {
        const count = allLectures.filter(l => l.subject === subj).length;
        const btn = document.createElement('button');
        btn.className = `chip ${currentSubjectFilter === subj ? 'active' : ''}`;
        btn.innerText = `${subj} (${count})`;
        btn.onclick = () => filterBySubject(subj);
        container.appendChild(btn);
    });
}

function filterBySubject(subj) {
    currentSubjectFilter = subj;
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    renderLecturesGrid();
}

function renderLecturesGrid() {
    const grid = document.getElementById('lecturesGrid');
    grid.innerHTML = '';

    const filtered = currentSubjectFilter === 'All' 
        ? allLectures 
        : allLectures.filter(l => l.subject === currentSubjectFilter);

    filtered.forEach(lec => {
        const card = document.createElement('div');
        card.className = 'lecture-card';
        card.innerHTML = `
            <div class="lec-header">
                <span class="lec-num">#${lec.lecture_number > 0 ? lec.lecture_number : 'M'}</span>
                <span class="lec-subject">${lec.subject}</span>
            </div>
            <div class="lec-title" title="${lec.title}">${lec.title}</div>
            <div class="lec-meta">
                <span><i class="fa-regular fa-file-lines"></i> ${lec.page_count} صفحة</span>
                <span><i class="fa-solid fa-file-word text-primary"></i> بنك Word متاح</span>
            </div>
            <div class="lec-actions" style="display: flex; flex-direction: column; gap: 8px;">
                <button class="btn btn-primary" onclick="openLectureStudyCenter(${lec.id})">
                    <i class="fa-solid fa-book-open-reader"></i> افتح مركز المذاكرة والأسئلة
                </button>
                <button class="btn btn-warning btn-smart-review" style="font-weight: 700; background: linear-gradient(135deg, #f59e0b, #d97706); border: none; color: #1e1e24;" onclick="event.stopPropagation(); openSmartLectureReviewHub(${lec.id})">
                    <i class="fa-solid fa-bullseye"></i> راجع المحاضرة (مراجعة ذكية مركزة) 🎯
                </button>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
                    <button class="btn btn-sm btn-outline" style="font-size: 11px; border-color: rgba(13, 148, 136, 0.4); color: var(--primary-light);" onclick="inspectLectureInSchedule(${lec.id})" title="مواعيد المحاضرة في جدول المذاكرة">
                        <i class="fa-solid fa-route"></i> المواعيد
                    </button>
                    <button class="btn btn-sm btn-outline" style="font-size: 11px; border-color: rgba(37, 99, 235, 0.4); color: #60a5fa;" onclick="event.stopPropagation(); openLectureStudyCenter(${lec.id}, 'numbers')" title="سحب وتصدير أرقام وثوابت المحاضرة">
                        <i class="fa-solid fa-calculator"></i> الأرقام والثوابت
                    </button>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 4px;">
                    <button class="btn btn-sm btn-outline" style="font-size: 10.5px; padding: 4px 2px; border-color: rgba(37, 99, 235, 0.4); color: #60a5fa;" onclick="event.stopPropagation(); openReplaceLecturePdfModal(${lec.id})" title="تبديل أو تحديث ملف الـ PDF بمحاضرة أخرى">
                        <i class="fa-solid fa-file-arrow-up"></i> تبديل PDF
                    </button>
                    <button class="btn btn-sm btn-outline-danger" style="font-size: 10.5px; padding: 4px 2px;" onclick="event.stopPropagation(); confirmResetLecture(${lec.id})" title="تصفير أسئلة وبطاقات المحاضرة">
                        <i class="fa-solid fa-rotate-left"></i> تصفير
                    </button>
                    <button class="btn btn-sm btn-outline-danger" style="font-size: 10.5px; padding: 4px 2px; background: rgba(239, 68, 68, 0.1);" onclick="event.stopPropagation(); confirmDeleteLecture(${lec.id})" title="حذف المحاضرة نهائياً من المنهج">
                        <i class="fa-solid fa-trash-can"></i> حذف
                    </button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

function populateDropdowns() {
    const qSel = document.getElementById('questionsLectureFilter');
    const fSel = document.getElementById('flashcardsLectureFilter');
    const deltaSel = document.getElementById('deltaLectureSelect');

    if (qSel) qSel.innerHTML = '<option value="">جميع المحاضرات</option>';
    if (fSel) fSel.innerHTML = '<option value="">جميع المحاضرات</option>';
    if (deltaSel) deltaSel.innerHTML = '<option value="">اختر المحاضرة لمقارنتها بالريكورد...</option>';

    populateScheduleLectureDropdown();

    allLectures.forEach(l => {
        const opt = document.createElement('option');
        opt.value = l.id;
        opt.innerText = `[${l.subject}] ${l.title}`;

        if (qSel) qSel.appendChild(opt.cloneNode(true));
        if (fSel) fSel.appendChild(opt.cloneNode(true));
        if (deltaSel) deltaSel.appendChild(opt.cloneNode(true));
    });
}

// ----------------- UNIFIED LECTURE STUDY CENTER MODAL -----------------
async function openLectureStudyCenter(lecId, defaultSubtab = 'explanation') {
    currentStudyLectureId = lecId;
    const lec = allLectures.find(l => l.id === lecId);
    if (!lec) return;

    document.getElementById('studyModalLecTitle').innerText = `${lec.title}`;
    document.getElementById('studyModalLecMeta').innerText = `المادة: ${lec.subject} • ${lec.page_count} صفحة • بنك أسئلة Word مخصص`;

    const pdfBtn = document.getElementById('btnStudyModalOpenPdf');
    if (pdfBtn) {
        pdfBtn.style.display = (lec.file_path ? 'inline-flex' : 'none');
    }

    const toggleBtnLbl = document.getElementById('lblToggleLangModal');
    if (toggleBtnLbl) {
        toggleBtnLbl.innerText = (currentStudyLanguage === 'en') ? "عرض بالعربية (شرح مبسط)" : "عرض بالإنجليزية (English)";
    }

    // Reset comparisons banner initially
    const compBanner = document.getElementById('modalComparisonsBanner');
    if (compBanner) compBanner.style.display = 'none';

    document.getElementById('lectureStudyCenterModal').style.display = 'flex';
    switchStudySubtab(defaultSubtab);

    // Load schedule banner
    loadModalScheduleBanner(lecId);

    // Load images & explanation
    await loadModalLectureImages(lecId);
    await loadModalExplanation(lecId, currentStudyLanguage);

    // Check if comparisons already exist in background to show banner
    if (lec.comparisons_json && compBanner) {
        compBanner.style.display = 'flex';
    }
}

function switchStudySubtab(tabName) {
    document.querySelectorAll('.subtab-btn').forEach(b => {
        b.classList.remove('active');
        if (b.getAttribute('data-subtab') === tabName) {
            b.classList.add('active');
        }
    });

    const expPane = document.getElementById('subpane-explanation');
    const compPane = document.getElementById('subpane-comparisons');
    const numbersPane = document.getElementById('subpane-numbers');
    const quizPane = document.getElementById('subpane-quiz');
    const cardsPane = document.getElementById('subpane-flashcards');

    if (expPane) expPane.style.display = (tabName === 'explanation') ? 'block' : 'none';
    if (compPane) compPane.style.display = (tabName === 'comparisons') ? 'block' : 'none';
    if (numbersPane) numbersPane.style.display = (tabName === 'numbers') ? 'block' : 'none';
    if (quizPane) quizPane.style.display = (tabName === 'quiz') ? 'block' : 'none';
    if (cardsPane) cardsPane.style.display = (tabName === 'flashcards') ? 'block' : 'none';

    if (tabName === 'comparisons') loadModalComparisons(currentStudyLectureId);
    if (tabName === 'numbers') loadLectureNumbers(currentStudyLectureId);
    if (tabName === 'quiz') loadModalQuestions(currentStudyLectureId);
    if (tabName === 'flashcards') loadModalFlashcards(currentStudyLectureId);
}

let currentModalLectureSlides = [];
let currentModalSlideIndex = 0;

async function loadModalLectureImages(lecId) {
    const strip = document.getElementById('modalImagesStrip');
    const container = document.getElementById('modalImagesContainer');
    const countBadge = document.getElementById('modalImagesCountBadge');
    if (!container || !strip) return;

    try {
        const res = await fetch(`/api/lecture/${lecId}/images`);
        const data = await res.json();
        if (data.images && data.images.length > 0) {
            currentModalLectureSlides = data.images.map((item, idx) => {
                if (typeof item === 'object' && item !== null) {
                    return {
                        url: item.url,
                        page: item.page || (idx + 1)
                    };
                }
                return {
                    url: item,
                    page: idx + 1
                };
            });

            strip.style.display = 'block';
            if (countBadge) {
                countBadge.innerText = `(${currentModalLectureSlides.length} شريحة)`;
            }

            container.innerHTML = currentModalLectureSlides.map((slide, idx) => `
                <div class="slide-thumb-card" onclick="openSlideFullscreen(${idx})" title="شريحة ${slide.page} - انقر للتكبير">
                    <img src="${slide.url}" alt="شريحة ${slide.page}" loading="lazy">
                    <span class="slide-thumb-badge"><i class="fa-regular fa-file-lines"></i> ${slide.page}</span>
                </div>
            `).join('');
        } else {
            currentModalLectureSlides = [];
            strip.style.display = 'none';
            if (countBadge) countBadge.innerText = '';
        }
    } catch (e) {
        currentModalLectureSlides = [];
        strip.style.display = 'none';
        if (countBadge) countBadge.innerText = '';
    }
}

function openSlideFullscreen(index) {
    if (!currentModalLectureSlides || currentModalLectureSlides.length === 0) return;
    currentModalSlideIndex = Math.max(0, Math.min(index, currentModalLectureSlides.length - 1));
    updateSlideModalView();
    const modal = document.getElementById('imagePreviewModal');
    if (modal) modal.style.display = 'flex';
}

function updateSlideModalView() {
    const slide = currentModalLectureSlides[currentModalSlideIndex];
    if (!slide) return;
    const imgEl = document.getElementById('fullscreenImageSrc');
    if (imgEl) imgEl.src = slide.url;

    const infoEl = document.getElementById('imageModalSlideInfo');
    if (infoEl) {
        infoEl.innerHTML = `<i class="fa-solid fa-file-image text-primary"></i> شريحة ${slide.page} من ${currentModalLectureSlides.length}`;
    }

    const newTabBtn = document.getElementById('imageModalNewTabBtn');
    if (newTabBtn) {
        newTabBtn.href = slide.url;
    }

    const prevBtn = document.getElementById('imageModalPrevBtn');
    if (prevBtn) {
        prevBtn.style.visibility = (currentModalSlideIndex > 0) ? 'visible' : 'hidden';
    }

    const nextBtn = document.getElementById('imageModalNextBtn');
    if (nextBtn) {
        nextBtn.style.visibility = (currentModalSlideIndex < currentModalLectureSlides.length - 1) ? 'visible' : 'hidden';
    }
}

function navigateSlidePreview(delta) {
    if (!currentModalLectureSlides || currentModalLectureSlides.length === 0) return;
    const newIdx = currentModalSlideIndex + delta;
    if (newIdx >= 0 && newIdx < currentModalLectureSlides.length) {
        currentModalSlideIndex = newIdx;
        updateSlideModalView();
    }
}

// --- MARKDOWN & LATEX MATH RENDERING ENGINE ---
function renderMarkdownWithMath(markdownText) {
    if (!markdownText) return '';
    let text = String(markdownText);

    // Normalize unicode dashes in math blocks (e.g. 70–100 -> 70-100)
    text = text.replace(/\$([^\$\n]+?)\$/g, (m, f) => {
        return '$' + f.replace(/[\u2013\u2014]/g, '-') + '$';
    });

    const mathBlocks = [];
    // 1. Protect/render display math: $$ ... $$
    let processed = text.replace(/\$\$([\s\S]*?)\$\$/g, (match, formula) => {
        const id = `___MATH_BLOCK_${mathBlocks.length}___`;
        const cleanFormula = formula.trim().replace(/[\u2013\u2014]/g, '-');
        let renderedHtml = '';
        if (window.katex) {
            try {
                renderedHtml = `<div class="katex-display-wrapper" dir="ltr">${window.katex.renderToString(cleanFormula, { displayMode: true, throwOnError: false })}</div>`;
            } catch (e) {
                renderedHtml = `<div class="katex-display-wrapper" dir="ltr">$$${cleanFormula}$$</div>`;
            }
        } else {
            renderedHtml = `<div class="katex-display-wrapper" dir="ltr">$$${cleanFormula}$$</div>`;
        }
        mathBlocks.push(renderedHtml);
        return id;
    });

    // 2. Protect/render inline math: $ ... $
    const inlineMath = [];
    processed = processed.replace(/(^|[^\\])\$([^\$\n]+?)\$/g, (match, prefix, formula) => {
        const id = `___MATH_INLINE_${inlineMath.length}___`;
        const cleanFormula = formula.trim().replace(/[\u2013\u2014]/g, '-');
        let renderedHtml = '';
        if (window.katex) {
            try {
                renderedHtml = `<span class="katex-inline-wrapper" dir="ltr">${window.katex.renderToString(cleanFormula, { displayMode: false, throwOnError: false })}</span>`;
            } catch (e) {
                renderedHtml = `<span class="katex-inline-wrapper" dir="ltr">$${cleanFormula}$</span>`;
            }
        } else {
            renderedHtml = `<span class="katex-inline-wrapper" dir="ltr">$${cleanFormula}$</span>`;
        }
        inlineMath.push(renderedHtml);
        return prefix + id;
    });

    // 3. Parse Markdown
    let html = (typeof marked !== 'undefined') ? marked.parse(processed) : processed;

    // 4. Restore math blocks
    mathBlocks.forEach((rendered, i) => {
        const placeholder = `___MATH_BLOCK_${i}___`;
        html = html.split(`<p>${placeholder}</p>`).join(rendered);
        html = html.split(placeholder).join(rendered);
    });

    inlineMath.forEach((rendered, i) => {
        const placeholder = `___MATH_INLINE_${i}___`;
        html = html.split(placeholder).join(rendered);
    });

    return html;
}

async function loadModalExplanation(lecId, lang = 'ar', force = false) {
    const contentArea = document.getElementById('modalExplanationArea');
    const badge = document.getElementById('modalExplanationStatusBadge');
    if (badge) badge.style.display = 'none';

    contentArea.innerHTML = `
        <div class="empty-state-card">
            <div class="spinner"></div>
            <h4>${force ? 'جاري إعادة تفكيك وشرح المحاضرة بأسلوب وافٍ ومتعمق...' : (lang === 'en' ? 'Generating comprehensive, detailed in-depth explanation...' : 'جاري تفكيك وشرح المحاضرة بأسلوب وافٍ ومتعمق...')}</h4>
            <p>يتم إعداد شرح شامل ومفصل لكل سلايد يوضح الآليات الفسيولوجية، العلاقات التشريحية، فخاخ الامتحانات، وتفسير الرسومات التوضيحية بعمق دون اختصار مخل.</p>
        </div>
    `;

    try {
        const res = await fetch(`/api/lecture/${lecId}/explain_exhaustive`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ language: lang, force: force })
        });
        const data = await res.json();
        if (data.explanation) {
            // Determine primary language and set base text direction
            const arabicCharCount = (data.explanation.match(/[\u0600-\u06FF]/g) || []).length;
            const isEnglish = (lang === 'en') || (arabicCharCount < 40);

            if (isEnglish) {
                contentArea.setAttribute('dir', 'ltr');
                contentArea.classList.add('lang-en');
                contentArea.classList.remove('lang-ar');
            } else {
                contentArea.setAttribute('dir', 'rtl');
                contentArea.classList.add('lang-ar');
                contentArea.classList.remove('lang-en');
            }

            contentArea.innerHTML = renderMarkdownWithMath(data.explanation);

            // Assign dir="auto" to all block elements for automatic bidirectional alignment
            contentArea.querySelectorAll('p, li, h1, h2, h3, h4, h5, h6, blockquote').forEach(el => {
                el.setAttribute('dir', 'auto');
            });

            // 1. Convert mermaid pre code blocks to div.mermaid with explicit dir="ltr"
            contentArea.querySelectorAll('pre code.language-mermaid').forEach(codeEl => {
                const pre = codeEl.closest('pre');
                const div = document.createElement('div');
                div.className = 'mermaid';
                div.setAttribute('dir', 'ltr');
                div.textContent = codeEl.textContent;
                if (pre && pre.parentNode) {
                    pre.parentNode.replaceChild(div, pre);
                }
            });

            // 2. Render mermaid diagrams if library loaded
            if (window.mermaid) {
                try {
                    window.mermaid.run({ nodes: contentArea.querySelectorAll('.mermaid') });
                } catch (merErr) {
                    console.log("[MERMAID] Render notice:", merErr);
                }
            }

            // 3. Fallback KaTeX auto-render on any remaining elements
            if (window.renderMathInElement) {
                try {
                    renderMathInElement(contentArea, {
                        delimiters: [
                            { left: '$$', right: '$$', display: true },
                            { left: '\\[', right: '\\]', display: true },
                            { left: '$', right: '$', display: false },
                            { left: '\\(', right: '\\)', display: false }
                        ],
                        throwOnError: false
                    });
                } catch (kErr) {
                    console.warn("[KaTeX] Auto-render notice:", kErr);
                }
            }

            // 4. Make all images inside explanation clickable to open in fullscreen preview
            contentArea.querySelectorAll('img').forEach(img => {
                img.style.cursor = 'zoom-in';
                img.title = 'انقر لتكبير الصورة / الرسمة التوضيحية';
                img.onclick = () => {
                    openCustomImageFullscreen(img.src, img.alt || 'رسم توضيحي للشرح الطبي');
                };
            });

            if (badge) {
                badge.style.display = 'inline-flex';
                const dict = TRANSLATIONS[currentAppLanguage] || TRANSLATIONS['ar'];
                badge.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> ${dict.exp_saved}`;
            }
        } else {
            contentArea.innerHTML = `<div class="empty-state-card text-danger">تعذر استخراج الشرح: ${data.error}</div>`;
        }
    } catch (e) {
        contentArea.innerHTML = `<div class="empty-state-card text-danger">خطأ: ${e}</div>`;
    }
}

function openCustomImageFullscreen(src, title = "رسم توضيحي للشرح الطبي") {
    const modal = document.getElementById('imagePreviewModal');
    const imgEl = document.getElementById('fullscreenImageSrc');
    const infoEl = document.getElementById('imageModalSlideInfo');
    const newTabBtn = document.getElementById('imageModalNewTabBtn');
    const prevBtn = document.getElementById('imageModalPrevBtn');
    const nextBtn = document.getElementById('imageModalNextBtn');

    if (!modal || !imgEl) return;
    imgEl.src = src;
    if (infoEl) infoEl.innerHTML = `<i class="fa-solid fa-file-image text-primary"></i> ${title}`;
    if (newTabBtn) newTabBtn.href = src;
    if (prevBtn) prevBtn.style.visibility = 'hidden';
    if (nextBtn) nextBtn.style.visibility = 'hidden';
    modal.style.display = 'flex';
}

async function forceRegenerateModalExplanation() {
    if (!currentStudyLectureId) return;
    if (confirm("هل تريد بالتأكيد إعادة توليد الشرح بالذكاء الاصطناعي بأسلوب مفصل ومتعمق؟")) {
        await loadModalExplanation(currentStudyLectureId, currentStudyLanguage, true);
    }
}

async function toggleModalLanguage() {
    if (!currentStudyLectureId) return;
    currentStudyLanguage = (currentStudyLanguage === 'en') ? 'ar' : 'en';
    const toggleBtnLbl = document.getElementById('lblToggleLangModal');
    if (toggleBtnLbl) {
        toggleBtnLbl.innerText = (currentStudyLanguage === 'en') ? "عرض بالعربية (شرح مفصل)" : "عرض بالإنجليزية (English)";
    }
    await loadModalExplanation(currentStudyLectureId, currentStudyLanguage);
}

// Text Selection Re-explain inside Modal
function checkTextSelectionModal(event) {
    const selection = window.getSelection();
    const text = selection.toString().trim();
    const tooltip = document.getElementById('selectionTooltipModal');

    if (text.length > 5) {
        currentSelectedText = text;
        tooltip.style.display = 'block';
        tooltip.style.left = `${event.pageX - 80}px`;
        tooltip.style.top = `${event.pageY - 40}px`;
    } else {
        tooltip.style.display = 'none';
    }
}

async function reExplainSelectedTextModal() {
    document.getElementById('selectionTooltipModal').style.display = 'none';
    if (!currentSelectedText || !currentStudyLectureId) return;

    showLoading("جاري إعادة شرح الجزء المحدد بتبسيط وأمثلة سريرية...");
    try {
        const lec = allLectures.find(l => l.id === currentStudyLectureId);
        const res = await fetch('/api/ai/re_explain', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                selected_text: currentSelectedText,
                lecture_title: lec ? lec.title : 'Medical Lecture'
            })
        });
        const data = await res.json();
        hideLoading();

        const contentArea = document.getElementById('modalExplanationArea');
        const box = document.createElement('div');
        box.className = 'q-explanation-box';
        box.style.border = '2px solid var(--primary)';
        box.style.margin = '20px 0';
        box.innerHTML = `
            <div style="font-size:12px; color:var(--text-subtle); margin-bottom:6px;"><i class="fa-solid fa-quote-right"></i> النص المحدد: <em>"${currentSelectedText}"</em></div>
            <h5><i class="fa-solid fa-wand-magic-sparkles text-primary"></i> إعادة الشرح المفصل:</h5>
            <div>${renderMarkdownWithMath(data.explanation || '')}</div>
        `;
        contentArea.appendChild(box);
        if (window.renderMathInElement) {
            try {
                renderMathInElement(box, {
                    delimiters: [
                        { left: '$$', right: '$$', display: true },
                        { left: '\\[', right: '\\]', display: true },
                        { left: '$', right: '$', display: false },
                        { left: '\\(', right: '\\)', display: false }
                    ],
                    throwOnError: false
                });
            } catch(e) {}
        }
        contentArea.scrollTop = contentArea.scrollHeight;
    } catch (e) {
        hideLoading();
        alert("خطأ: " + e);
    }
}

async function openCurrentLectureWordDocFromModal() {
    if (currentStudyLectureId) {
        await openWordDocForLecture(currentStudyLectureId);
    }
}

async function openCurrentLecturePdfFromModal() {
    if (!currentStudyLectureId) return;
    showLoading("جاري فتح ملف الـ PDF الأصلي للمحاضرة...");
    try {
        const res = await fetch(`/api/lecture/${currentStudyLectureId}/open_pdf`, { method: 'POST' });
        const data = await res.json();
        hideLoading();
        if (data.success) {
            showToast({
                type: 'success',
                title: 'تم فتح ملف الـ PDF 📄',
                message: 'تم فتح ملف المحاضرة الأصلي في قارئ PDF الافتراضي بنجاح.'
            });
        } else {
            showToast({
                type: 'warning',
                title: 'تعذر فتح ملف الـ PDF',
                message: data.error || 'الملف غير موجود أو يتعذر فتحه.'
            });
        }
    } catch (e) {
        hideLoading();
        showToast({
            type: 'error',
            title: 'خطأ أثناء فتح ملف الـ PDF',
            message: String(e)
        });
    }
}

async function openCurrentLectureWordDoc() {
    const sel = document.getElementById('questionsLectureFilter').value;
    const lecId = sel ? parseInt(sel) : (allLectures[0] ? allLectures[0].id : 1);
    await openWordDocForLecture(lecId);
}

async function openWordDocForLecture(lecId) {
    await openWordBatchExportModal(lecId);
}

// ----------------- QUESTIONS INSIDE MODAL & QUESTIONS TAB -----------------
let currentModalQuestionsMode = 'all';

function setModalQuestionsMode(mode, targetBtn = null) {
    currentModalQuestionsMode = mode;
    const container = document.querySelector('#subpane-quiz .questions-mode-selector');
    if (container) {
        container.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
    }
    if (targetBtn) {
        targetBtn.classList.add('active');
    } else {
        const idMap = { all: 'modalBtnModeAll', normal: 'modalBtnModeNormal', cases: 'modalBtnModeCases' };
        const el = document.getElementById(idMap[mode]);
        if (el) el.classList.add('active');
    }
    if (currentStudyLectureId) {
        loadModalQuestions(currentStudyLectureId);
    }
}

async function loadModalQuestions(lecId) {
    const feed = document.getElementById('modalQuestionsFeed');
    feed.innerHTML = '<div class="empty-state-sm">جاري تحميل الأسئلة...</div>';

    const batchFilterEl = document.getElementById('modalQuestionsBatchFilter');
    const selectedBatch = batchFilterEl ? batchFilterEl.value : 'all';

    try {
        // Fetch batches available for this lecture
        const bRes = await fetch(`/api/lecture/${lecId}/batches`);
        const bData = await bRes.json();
        const batches = bData.batches || [];
        const batchDetails = bData.batch_details || [];
        
        if (batchFilterEl) {
            const curVal = batchFilterEl.value;
            batchFilterEl.innerHTML = '<option value="all">كل الدفعات (All Batches)</option>';
            if (batchDetails.length > 0) {
                batchDetails.forEach(bInfo => {
                    const opt = document.createElement('option');
                    opt.value = bInfo.batch_number;
                    opt.innerText = bInfo.display_title;
                    if (String(bInfo.batch_number) === curVal) opt.selected = true;
                    batchFilterEl.appendChild(opt);
                });
            } else {
                batches.forEach(b => {
                    const opt = document.createElement('option');
                    opt.value = b;
                    opt.innerText = `باتش ${b}`;
                    if (String(b) === curVal) opt.selected = true;
                    batchFilterEl.appendChild(opt);
                });
            }
            const btnModalQuiz = document.getElementById('btnStartModalBatchQuiz');
            if (btnModalQuiz) {
                btnModalQuiz.style.display = (batchFilterEl.value !== 'all' && batches.length > 0) ? 'inline-flex' : 'none';
            }
        }

        let url = `/api/questions?block_id=${currentBlockId}&lecture_id=${lecId}&limit=100`;
        if (selectedBatch && selectedBatch !== 'all') {
            url += `&batch_number=${selectedBatch}`;
        }
        if (currentModalQuestionsMode === 'cases') {
            url += `&mode=cases`;
        } else if (currentModalQuestionsMode === 'normal' || currentModalQuestionsMode === 'mcq') {
            url += `&mode=normal`;
        }

        const res = await fetch(url);
        const data = await res.json();
        const questions = data.questions || [];

        const countBadge = document.getElementById('modalQuestionsCountBadge');
        if (countBadge) {
            let label = `${questions.length} سؤال مسجل`;
            if (bData.mcq_count !== undefined && bData.case_count !== undefined) {
                label = `إجمالي المحاضرة: ${bData.total || questions.length} سؤال (${bData.mcq_count} MCQ طبيعي + ${bData.case_count} حالة سريرية)`;
                if (currentModalQuestionsMode === 'cases') label += ` — المعروض: ${questions.length} كاسيز`;
                else if (currentModalQuestionsMode === 'normal') label += ` — المعروض: ${questions.length} MCQs`;
            }
            countBadge.innerText = label;
        }

        if (questions.length === 0) {
            feed.innerHTML = `
                <div class="empty-state-card">
                    <i class="fa-solid fa-spell-check fa-2x text-muted mb-2"></i>
                    <h4>لا توجد أسئلة تطابق هذا الفلتر</h4>
                    <p>يمكنك استخدام أزرار التوليد بالأعلى لإضافة أسئلة طبيعية أو حالات سريرية جديدة فوراً.</p>
                </div>
            `;
            return;
        }

        feed.innerHTML = '';
        questions.forEach(q => {
            feed.appendChild(renderQuestionCard(q));
        });

        const btnModalQuiz = document.getElementById('btnStartModalBatchQuiz');
        if (btnModalQuiz) {
            btnModalQuiz.style.display = (questions.length > 0) ? 'inline-flex' : 'none';
        }
    } catch (e) {
        console.error(e);
    }
}

function onModalQuestionsBatchFilterChange() {
    filterModalQuestionsByBatch();
}

function filterModalQuestionsByBatch() {
    if (currentStudyLectureId) {
        loadModalQuestions(currentStudyLectureId);
    }
}

async function triggerMassiveGenForCurrentStudyModal() {
    if (currentStudyLectureId) {
        await triggerMassiveGeneration(currentStudyLectureId);
        await loadModalQuestions(currentStudyLectureId);
    }
}

async function triggerMassiveGenModal(type = 'all') {
    openQuestionGenModal(null, type);
}

// --- SEPARATE QUESTION GENERATION MODAL HANDLERS ---
let selectedGenQuestionType = 'normal'; // 'normal', 'case', 'all'
let selectedNormalCount = 25;
let selectedCaseCount = 10;

function openQuestionGenModal(targetLecId = null, initialType = 'all') {
    if (initialType === 'mcq') initialType = 'normal';
    const select = document.getElementById('genQuestionsLectureSelect');
    if (select) {
        select.innerHTML = '';
        allLectures.forEach(l => {
            const opt = document.createElement('option');
            opt.value = l.id;
            opt.innerText = `${l.lecture_number ? '#' + l.lecture_number + ' ' : ''}${l.title}`;
            select.appendChild(opt);
        });
        // Sanitize targetLecId (parseInt may return NaN)
        const sanitized = (targetLecId && !isNaN(targetLecId)) ? parseInt(targetLecId) : null;
        const activeQFilter = parseInt(document.getElementById('questionsLectureFilter')?.value) || null;
        const chosenId = sanitized || currentStudyLectureId || activeQFilter || (allLectures[0] ? allLectures[0].id : 1);
        select.value = chosenId;
    }

    const nameInput = document.getElementById('genBatchCustomNameInput');
    if (nameInput) nameInput.value = '';

    selectGenQuestionType(initialType);
    openModal('generateQuestionsModal');
}

function selectGenQuestionType(type) {
    if (type === 'mcq') type = 'normal';
    selectedGenQuestionType = type;
    const cards = {
        'normal': document.getElementById('cardTypeNormal'),
        'case': document.getElementById('cardTypeCase'),
        'all': document.getElementById('cardTypeAll')
    };

    Object.keys(cards).forEach(k => {
        const card = cards[k];
        if (!card) return;
        if (k === type) {
            card.classList.add('active');
            card.style.borderColor = (k === 'case') ? 'var(--accent)' : ((k === 'all') ? 'var(--warning)' : 'var(--primary)');
            card.style.background = (k === 'case') ? 'rgba(37, 99, 235, 0.12)' : ((k === 'all') ? 'rgba(234, 179, 8, 0.12)' : 'rgba(13, 148, 136, 0.12)');
        } else {
            card.classList.remove('active');
            card.style.borderColor = 'var(--border-color)';
            card.style.background = 'var(--bg-card)';
        }
    });

    const normalSection = document.getElementById('genNormalCountSection');
    const caseSection = document.getElementById('genCaseCountSection');
    const infoText = document.getElementById('genTypeInfoText');

    if (type === 'normal') {
        if (normalSection) normalSection.style.display = 'block';
        if (caseSection) caseSection.style.display = 'none';
        if (infoText) {
            infoText.innerHTML = `<strong>أسئلة طبيعية ومفاهيمية (MCQs):</strong> تركز على استيعاب المصطلحات، التفاصيل التشريحية، الآليات الفسيولوجية، والتداخلات الدوائية المذكورة في المحاضرة بشكل مباشر وسريع دون سيناريوهات طويلة.`;
        }
    } else if (type === 'case') {
        if (normalSection) normalSection.style.display = 'none';
        if (caseSection) caseSection.style.display = 'block';
        if (infoText) {
            infoText.innerHTML = `<strong>حالات سريرية فقط (Clinical Cases):</strong> سيناريوهات طبية متكاملة لمرضى (العمر، الجنس، الشكوى الرئيسية، العلامات الحيوية، الفحص السريري، والنتائج المخبرية) مع أسئلة تحليلية عن التشخيص، الآلية المرضية، أو التدبير الدوائي.`;
        }
    } else { // 'all'
        if (normalSection) normalSection.style.display = 'block';
        if (caseSection) caseSection.style.display = 'block';
        if (infoText) {
            infoText.innerHTML = `<strong>توليد مشترك (أسئلة طبيعية + كاسيز):</strong> يقوم الذكاء الاصطناعي بتوليد تشكيلة متوازنة وشاملة تغطي المفاهيم النظرية المباشرة بالإضافة للسيناريوهات والحالات السريرية.`;
        }
    }
}

function setNormalCountChoice(cnt) {
    selectedNormalCount = cnt;
    const inp = document.getElementById('genNormalCountInput');
    if (inp) inp.value = cnt;
    document.querySelectorAll('#normalCountChipsContainer .chip').forEach(b => {
        b.classList.toggle('active', b.innerText.includes(`${cnt} `));
    });
}

function syncNormalCountInput() {
    const inp = document.getElementById('genNormalCountInput');
    if (!inp) return;
    selectedNormalCount = parseInt(inp.value) || 25;
    document.querySelectorAll('#normalCountChipsContainer .chip').forEach(b => {
        b.classList.toggle('active', b.innerText.includes(`${selectedNormalCount} `));
    });
}

function setCaseCountChoice(cnt) {
    selectedCaseCount = cnt;
    const inp = document.getElementById('genCaseCountInput');
    if (inp) inp.value = cnt;
    document.querySelectorAll('#caseCountChipsContainer .chip').forEach(b => {
        b.classList.toggle('active', b.innerText.includes(`${cnt} `));
    });
}

function syncCaseCountInput() {
    const inp = document.getElementById('genCaseCountInput');
    if (!inp) return;
    selectedCaseCount = parseInt(inp.value) || 10;
    document.querySelectorAll('#caseCountChipsContainer .chip').forEach(b => {
        b.classList.toggle('active', b.innerText.includes(`${selectedCaseCount} `));
    });
}

let selectedGenDifficultyStyle = 'simple';

function selectGenQuestionDifficulty(style) {
    selectedGenDifficultyStyle = style;
    const cards = {
        'simple': document.getElementById('cardDiffSimple'),
        'moderate': document.getElementById('cardDiffModerate'),
        'advanced': document.getElementById('cardDiffAdvanced')
    };
    Object.keys(cards).forEach(k => {
        const card = cards[k];
        if (!card) return;
        if (k === style) {
            card.classList.add('active');
            card.style.borderColor = (k === 'simple') ? '#10b981' : ((k === 'moderate') ? 'var(--primary)' : 'var(--warning)');
            card.style.background = (k === 'simple') ? 'rgba(16, 185, 129, 0.12)' : ((k === 'moderate') ? 'rgba(37, 99, 235, 0.12)' : 'rgba(234, 179, 8, 0.12)');
        } else {
            card.classList.remove('active');
            card.style.borderColor = 'var(--border-color)';
            card.style.background = 'var(--bg-card)';
        }
    });
}
window.selectGenQuestionDifficulty = selectGenQuestionDifficulty;

async function confirmGenerateQuestions() {
    const select = document.getElementById('genQuestionsLectureSelect');
    const lecId = select ? parseInt(select.value) : (allLectures[0]?.id || 1);
    const customName = document.getElementById('genBatchCustomNameInput')?.value?.trim() || '';
    closeModal('generateQuestionsModal');

    const mcqCnt = (selectedGenQuestionType === 'case') ? 0 : selectedNormalCount;
    const caseCnt = (selectedGenQuestionType === 'normal') ? 0 : selectedCaseCount;

    await triggerMassiveGeneration(lecId, {
        type: selectedGenQuestionType,
        mcq_count: mcqCnt,
        case_count: caseCnt,
        batch_name: customName,
        difficulty_style: selectedGenDifficultyStyle || 'simple'
    });
}

// --- ADD CUSTOM QUESTION MANUALLY HANDLERS ---
function openAddCustomQuestionModal(targetLecId = null) {
    const select = document.getElementById('customQuesLectureSelect');
    if (select) {
        select.innerHTML = '';
        allLectures.forEach(l => {
            const opt = document.createElement('option');
            opt.value = l.id;
            opt.innerText = `${l.lecture_number ? '#' + l.lecture_number + ' ' : ''}${l.title}`;
            select.appendChild(opt);
        });
        const activeFilter = document.getElementById('questionsLectureFilter')?.value;
        const chosenId = targetLecId || currentStudyLectureId || (activeFilter ? parseInt(activeFilter) : null) || (allLectures[0] ? allLectures[0].id : 1);
        select.value = chosenId;
    }

    const typeSel = document.getElementById('customQuesTypeSelect');
    if (typeSel) typeSel.value = 'mcq';
    toggleCustomQuestionTypeUI();

    ['customQuesScenarioInput', 'customQuesPromptInput', 'customQuesOptA', 'customQuesOptB', 'customQuesOptC', 'customQuesOptD', 'customQuesExplanationInput', 'customQuesNewBatchInput'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });

    onCustomQuesLectureChange();
    openModal('addCustomQuestionModal');
}

async function onCustomQuesLectureChange() {
    const lecId = document.getElementById('customQuesLectureSelect')?.value;
    const batchSel = document.getElementById('customQuesBatchSelect');
    if (!batchSel) return;
    batchSel.innerHTML = '<option value="__new__" selected>➕ إنشاء دفعة / باتش جديد وتسميته...</option>';
    if (lecId) {
        try {
            const res = await fetch(`/api/lecture/${lecId}/batches`);
            const data = await res.json();
            if (data.batch_details && data.batch_details.length > 0) {
                data.batch_details.forEach(b => {
                    const opt = document.createElement('option');
                    opt.value = b.batch_name;
                    opt.innerText = `📂 ${b.display_title}`;
                    batchSel.appendChild(opt);
                });
            }
        } catch (e) {}
    }
    onCustomQuesBatchChange();
}

function onCustomQuesBatchChange() {
    const batchSel = document.getElementById('customQuesBatchSelect');
    const newGroup = document.getElementById('customQuesNewBatchGroup');
    if (newGroup) {
        newGroup.style.display = (batchSel && batchSel.value === '__new__') ? 'block' : 'none';
    }
}

function toggleCustomQuestionTypeUI() {
    const type = document.getElementById('customQuesTypeSelect')?.value || 'mcq';
    const group = document.getElementById('customQuesScenarioGroup');
    if (group) {
        group.style.display = (type === 'case') ? 'block' : 'none';
    }
}

async function confirmAddCustomQuestion() {
    const lecture_id = parseInt(document.getElementById('customQuesLectureSelect')?.value);
    const question_type = document.getElementById('customQuesTypeSelect')?.value || 'mcq';
    const case_scenario = document.getElementById('customQuesScenarioInput')?.value?.trim() || '';
    const question_text = document.getElementById('customQuesPromptInput')?.value?.trim() || '';
    const option_a = document.getElementById('customQuesOptA')?.value?.trim() || '';
    const option_b = document.getElementById('customQuesOptB')?.value?.trim() || '';
    const option_c = document.getElementById('customQuesOptC')?.value?.trim() || '';
    const option_d = document.getElementById('customQuesOptD')?.value?.trim() || '';
    const correct_option = document.getElementById('customQuesCorrectSelect')?.value || 'A';
    const difficulty = document.getElementById('customQuesDifficultySelect')?.value || 'medium';
    const explanation = document.getElementById('customQuesExplanationInput')?.value?.trim() || '';

    if (!question_text || !option_a || !option_b) {
        alert('يرجى ملء نص السؤال وخياري (A) و (B) على الأقل.');
        return;
    }

    const batchSel = document.getElementById('customQuesBatchSelect');
    let batch_name = "";
    if (batchSel && batchSel.value === '__new__') {
        batch_name = (document.getElementById('customQuesNewBatchInput')?.value || "").trim() || "إضافة يدوية";
    } else if (batchSel && batchSel.value) {
        batch_name = batchSel.value;
    }

    try {
        const res = await fetch('/api/questions/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                lecture_id, question_type, case_scenario, question_text,
                option_a, option_b, option_c, option_d,
                correct_option, difficulty, explanation, explanation_arabic: explanation,
                batch_name: batch_name
            })
        });
        const data = await res.json();
        if (data.success) {
            closeModal('addCustomQuestionModal');
            showToast({
                type: 'success',
                title: 'تم حفظ السؤال بنجاح! 🎉',
                message: `تم حفظ السؤال في دفعة (${data.batch_name}) بنجاح ومزامنة ملف Word.`
            });
            if (currentStudyLectureId === lecture_id) {
                loadModalQuestions(lecture_id);
            }
            const qTab = document.getElementById('tab-questions');
            if (qTab && qTab.classList.contains('active')) {
                loadQuestions();
            }
        } else {
            alert(data.error || 'حدث خطأ أثناء حفظ السؤال');
        }
    } catch(e) {
        alert(String(e));
    }
}

async function triggerMassiveGeneration(lecId, options = {}) {
    const lec = allLectures.find(l => l.id === lecId);
    const lecTitle = lec ? lec.title : `المحاضرة #${lecId}`;
    const taskId = `q_gen_${lecId}_${Date.now()}`;
    const qType = options.type || 'all';
    const typeLabel = (qType === 'case') ? 'حالات سريرية' : ((qType === 'normal' || qType === 'mcq') ? 'أسئلة طبيعية' : 'أسئلة وكاسيز');

    startBackgroundTask(
        taskId,
        `توليد ${typeLabel}: ${lecTitle}`,
        "يقوم Gemini بابتكار الأسئلة وفحص التكرار وتوثيق الدفعة في ملف Word..."
    );

    showToast({
        type: 'info',
        title: `بدأ توليد ${typeLabel} في الخلفية 🚀`,
        message: `جاري توليد دفعة لمحاضرة "${lecTitle}". يمكنك مواصلة المذاكرة والتصفح بحرية!`,
        duration: 4500
    });

    try {
        const bodyPayload = {
            type: qType,
            mcq_count: options.mcq_count !== undefined ? options.mcq_count : (qType === 'case' ? 0 : 30),
            case_count: options.case_count !== undefined ? options.case_count : (qType in {normal:1, mcq:1} ? 0 : 10),
            batch_name: options.batch_name || '',
            difficulty_style: options.difficulty_style || 'simple'
        };

        const res = await fetch(`/api/lecture/${lecId}/generate_massive_questions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyPayload)
        });
        const data = await res.json();
        finishBackgroundTask(taskId);

        if (data.success) {
            const batchNum = data.batch_number || 1;
            if (currentStudyLectureId === lecId) {
                loadModalQuestions(lecId);
            }
            const questionsTab = document.getElementById('tab-questions');
            if (questionsTab && questionsTab.classList.contains('active')) {
                loadQuestions();
            }

            let msg = `تم بنجاح توليد وحفظ ${data.questions_generated} سؤال كـ (باتش ${batchNum}: ${data.batch_name || ''})، وإلحاقها بملف Word!`;
            if (data.novelty_status === 'approaching_limit') {
                msg += ' (تمت تغطية معظم أفكار المحاضرة)';
            }

            showToast({
                type: 'success',
                title: `اكتمل توليد ${data.batch_name || 'الباتش'}! 🎉`,
                message: msg,
                actionText: 'عرض بنك الأسئلة الآن',
                onAction: () => {
                    switchTab('questions');
                    const filter = document.getElementById('questionsLectureFilter');
                    if (filter) {
                        filter.value = lecId;
                        if (qType === 'case') setQuestionsMode('cases');
                        else if (qType === 'normal' || qType === 'mcq') setQuestionsMode('normal');
                        else setQuestionsMode('all');
                    }
                },
                duration: 9000
            });
        } else {
            showToast({
                type: 'error',
                title: 'تعذر توليد الأسئلة',
                message: data.error || 'حدث خطأ غير متوقع أثناء توليد الأسئلة.',
                duration: 7000
            });
        }
    } catch (e) {
        finishBackgroundTask(taskId);
        showToast({
            type: 'error',
            title: 'خطأ أثناء توليد الأسئلة',
            message: String(e),
            duration: 7000
        });
    }
}

function renderQuestionCard(q) {
    window.allRenderedQuestions = window.allRenderedQuestions || {};
    window.allRenderedQuestions[q.id] = q;

    const card = document.createElement('div');
    card.className = 'question-card';
    card.id = `q-card-${q.id}`;
    const isCase = q.question_type === 'case' || (q.case_scenario && q.case_scenario.length > 5);

    const userSelected = (q.user_selected_option || '').trim().toUpperCase();
    const correctOpt = (q.correct_option || '').trim().toUpperCase();
    const hasAnswered = !!userSelected;
    const isCorrect = hasAnswered && (userSelected === correctOpt);

    let solvedBadgeHtml = '';
    if (hasAnswered) {
        solvedBadgeHtml = isCorrect 
            ? `<span class="badge-solved correct" id="badge-solved-${q.id}"><i class="fa-solid fa-circle-check"></i> تم الحل بنجاح</span>`
            : `<span class="badge-solved wrong" id="badge-solved-${q.id}"><i class="fa-solid fa-circle-xmark"></i> إجابة سابقة (${userSelected})</span>`;
    }

    let resetBtnHtml = '';
    if (hasAnswered) {
        resetBtnHtml = `<button class="btn-reset-q" id="btn-reset-q-${q.id}" onclick="resetSingleQuestionAnswer(${q.id})" title="تصفير إجابة هذا السؤال وإعادة حله"><i class="fa-solid fa-rotate-left"></i> إعادة الحل</button>`;
    }

    const options = [
        { letter: 'A', text: q.option_a },
        { letter: 'B', text: q.option_b },
        { letter: 'C', text: q.option_c },
        { letter: 'D', text: q.option_d }
    ];

    let optionsHtml = '';
    options.forEach(opt => {
        let optClass = 'q-opt-btn';
        let disabledAttr = '';
        if (hasAnswered) {
            disabledAttr = 'disabled';
            if (opt.letter === correctOpt) {
                optClass += ' correct';
            } else if (opt.letter === userSelected && !isCorrect) {
                optClass += ' wrong';
            }
        }
        optionsHtml += `<button class="${optClass}" ${disabledAttr} onclick="submitAnswer(${q.id}, '${opt.letter}')"><strong>${opt.letter}:</strong> <span dir="auto">${opt.text}</span></button>`;
    });

    let expDisplay = hasAnswered ? 'block' : 'none';
    let expContent = '';
    if (hasAnswered) {
        expContent = `<strong>الإجابة الصحيحة: (${q.correct_option})</strong> - ${isCorrect ? '✅ إجابتك صحيحة!' : `❌ إجابتك السابقة: (${userSelected})`}<br>${q.explanation_arabic || q.explanation || ''}`;
        if (q.lecture_evidence) {
            expContent += `<div style="margin-top: 8px; padding-top: 8px; border-top: 1px dashed rgba(255,255,255,0.15); color: #6ee7b7;"><i class="fa-solid fa-bookmark"></i> <strong>المرجع في المحاضرة:</strong> ${q.lecture_evidence}</div>`;
        }
    }

    card.innerHTML = `
        <div class="q-header">
            <span class="q-badge ${isCase ? 'q-badge-case' : 'q-badge-mcq'}">
                <i class="fa-solid ${isCase ? 'fa-stethoscope' : 'fa-file-lines'}"></i> 
                ${isCase ? 'Clinical Vignette / حالة سريرية' : 'Multiple Choice Question (MCQ)'}
            </span>
            <span class="badge-batch"><i class="fa-solid fa-layer-group"></i> باتش ${q.batch_number || 1}${q.batch_name ? ' — ' + q.batch_name : ''}</span>
            ${q.source_file ? `<span class="badge-source" style="font-size: 11.5px; opacity: 0.9; color: var(--primary-light); background: rgba(13,148,136,0.1); padding: 2px 8px; border-radius: 4px;"><i class="fa-solid fa-file-pdf"></i> ${q.source_file}</span>` : ''}
            <span style="font-size: 12px; color: var(--text-subtle);">${q.lecture_title || ''}</span>
            <div id="q-status-actions-${q.id}" style="display: inline-flex; align-items: center; gap: 6px;">
                ${solvedBadgeHtml}
                ${resetBtnHtml}
            </div>
            <button class="btn-edit-q btn-simplify-q" style="background: rgba(16,185,129,0.12); color: #10b981; border: 1px solid rgba(16,185,129,0.3); font-size: 11px; padding: 3px 8px; border-radius: 6px; cursor: pointer;" title="تبسيط هذا السؤال وجعله سهلاً ومباشراً بالـ AI" onclick="simplifyQuestionDirect(${q.id}, event)">
                <i class="fa-solid fa-wand-magic-sparkles"></i> تبسيط السؤال
            </button>
            <button class="btn-edit-q" title="تعديل هذا السؤال ومزامنة ملف Word" onclick="openEditQuestionModal(${q.id})">
                <i class="fa-solid fa-pen-to-square"></i> تعديل
            </button>
            <button class="btn-bookmark ${q.is_bookmarked ? 'bookmarked' : ''}" onclick="toggleBookmark(${q.id})">
                <i class="fa-solid fa-star"></i>
            </button>
        </div>

        ${isCase ? `<div class="case-scenario-box" dir="auto"><i class="fa-solid fa-notes-medical text-accent"></i> ${q.case_scenario}</div>` : ''}

        <div class="q-prompt" dir="auto">${q.question_text}</div>

        <div class="q-options" id="opt-group-${q.id}">
            ${optionsHtml}
        </div>

        <div class="q-explanation-box" id="exp-box-${q.id}" style="display: ${expDisplay};">
            <h5><i class="fa-solid fa-lightbulb"></i> الشرح والتعليل الطبي:</h5>
            <p id="exp-text-${q.id}">${expContent}</p>
        </div>

        ${q.lecture_evidence ? `
            <div class="q-lecture-evidence-box" style="margin-top: 10px; background: rgba(16, 185, 129, 0.08); border-right: 4px solid #10b981; border-radius: 0 8px 8px 0; padding: 8px 12px; font-size: 12.5px; color: #a7f3d0; line-height: 1.5;">
                <strong style="color: #6ee7b7;"><i class="fa-solid fa-book-bookmark"></i> موضع المعلومة في المحاضرة / المنهج:</strong>
                <div style="margin-top: 3px; color: #f1f5f9;">${q.lecture_evidence}</div>
            </div>
        ` : ''}
    `;
    return card;
}

async function simplifyQuestionDirect(qId, event) {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }
    const btn = event ? (event.currentTarget || event.target.closest('button')) : null;
    const oldHtml = btn ? btn.innerHTML : '';
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري التبسيط...';
    }

    try {
        const res = await fetch(`/api/questions/${qId}/simplify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await res.json();
        if (data.success && data.question) {
            window.allRenderedQuestions = window.allRenderedQuestions || {};
            window.allRenderedQuestions[qId] = data.question;

            const existingCard = document.getElementById(`q-card-${qId}`);
            if (existingCard && existingCard.parentNode) {
                const newCard = renderQuestionCard(data.question);
                newCard.style.boxShadow = '0 0 15px rgba(16,185,129,0.4)';
                existingCard.parentNode.replaceChild(newCard, existingCard);
            }

            showToast({
                type: 'success',
                title: 'تم تبسيط السؤال بنجاح ✨',
                message: 'تمت إزالة أي تعقيد وأصبح السؤال مباشراً وسهل الفهم.'
            });
        } else {
            showToast({
                type: 'error',
                title: 'تعذر التبسيط',
                message: data.error || 'حدث خطأ أثناء تبسيط السؤال'
            });
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = oldHtml;
            }
        }
    } catch (e) {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = oldHtml;
        }
        showToast({
            type: 'error',
            title: 'خطأ في الاتصال',
            message: String(e)
        });
    }
}
window.simplifyQuestionDirect = simplifyQuestionDirect;

async function submitAnswer(qId, selectedOption) {
    try {
        const res = await fetch(`/api/question/${qId}/answer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ option: selectedOption })
        });
        const data = await res.json();

        const q = (window.allRenderedQuestions && window.allRenderedQuestions[qId]) || {};
        q.user_selected_option = selectedOption;
        q.last_answer_correct = data.is_correct ? 1 : 0;

        const optGroup = document.getElementById(`opt-group-${qId}`);
        if (optGroup) {
            const buttons = optGroup.querySelectorAll('.q-opt-btn');
            buttons.forEach(btn => {
                btn.disabled = true;
                const optLetter = btn.innerText.trim().charAt(0);
                if (optLetter === data.correct_option) {
                    btn.classList.add('correct');
                } else if (optLetter === selectedOption && !data.is_correct) {
                    btn.classList.add('wrong');
                }
            });
        }

        const expBox = document.getElementById(`exp-box-${qId}`);
        const expText = document.getElementById(`exp-text-${qId}`);
        let expHtml = `<strong>الإجابة الصحيحة: (${data.correct_option})</strong> - ${data.is_correct ? '✅ إجابة صحيحة!' : `❌ إجابتك: (${selectedOption})`}<br>${data.explanation_arabic || data.explanation || ''}`;
        if (data.lecture_evidence) {
            expHtml += `<div style="margin-top: 8px; padding-top: 8px; border-top: 1px dashed rgba(255,255,255,0.15); color: #6ee7b7;"><i class="fa-solid fa-bookmark"></i> <strong>المرجع في المحاضرة:</strong> ${data.lecture_evidence}</div>`;
        }
        if (expText) expText.innerHTML = expHtml;
        if (expBox) expBox.style.display = 'block';

        const actionsContainer = document.getElementById(`q-status-actions-${qId}`);
        if (actionsContainer) {
            const badgeHtml = data.is_correct
                ? `<span class="badge-solved correct" id="badge-solved-${qId}"><i class="fa-solid fa-circle-check"></i> تم الحل بنجاح</span>`
                : `<span class="badge-solved wrong" id="badge-solved-${qId}"><i class="fa-solid fa-circle-xmark"></i> إجابة سابقة (${selectedOption})</span>`;
            const resetBtnHtml = `<button class="btn-reset-q" id="btn-reset-q-${qId}" onclick="resetSingleQuestionAnswer(${qId})" title="تصفير إجابة هذا السؤال وإعادة حله"><i class="fa-solid fa-rotate-left"></i> إعادة الحل</button>`;
            actionsContainer.innerHTML = `${badgeHtml} ${resetBtnHtml}`;
        }
    } catch (e) {
        console.error("Answer failed", e);
    }
}

async function resetSingleQuestionAnswer(qId) {
    try {
        const res = await fetch(`/api/question/${qId}/reset_answer`, { method: 'POST' });
        const data = await res.json();
        if (data.success) {
            const q = (window.allRenderedQuestions && window.allRenderedQuestions[qId]) || {};
            q.user_selected_option = '';
            q.last_answer_correct = null;

            const optGroup = document.getElementById(`opt-group-${qId}`);
            if (optGroup) {
                const buttons = optGroup.querySelectorAll('.q-opt-btn');
                buttons.forEach(btn => {
                    btn.disabled = false;
                    btn.className = 'q-opt-btn';
                });
            }

            const expBox = document.getElementById(`exp-box-${qId}`);
            if (expBox) expBox.style.display = 'none';

            const actionsContainer = document.getElementById(`q-status-actions-${qId}`);
            if (actionsContainer) actionsContainer.innerHTML = '';

            showToast({ type: 'info', title: 'تمت إعادة تعيين السؤال 🔄', message: 'يمكنك الآن حل السؤال مرة أخرى.', duration: 2500 });
        }
    } catch (e) {
        console.error("Reset answer failed", e);
    }
}

async function resetCurrentBatchAnswers() {
    if (!currentStudyLectureId) return;

    const filterEl = document.getElementById('modalQuestionsBatchFilter');
    const batchVal = filterEl ? filterEl.value : 'all';
    const batchNum = (batchVal && batchVal !== 'all') ? parseInt(batchVal) : null;
    const batchLabel = (batchNum !== null) ? `الباتش ${batchNum}` : 'جميع أسئلة المحاضرة';

    if (!confirm(`هل تريد بالتأكيد تصفير ومسح كافة إجاباتك السابقة لـ (${batchLabel})؟\n\nستتمكن من إعادة حل كافة الأسئلة كأنها جديدة تماماً.`)) {
        return;
    }

    showLoading("جاري تصفير إجابات الأسئلة...", "يتم مسح الإجابات المحفوظة للبدء من جديد");
    try {
        const res = await fetch(`/api/lecture/${currentStudyLectureId}/reset_answers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ batch_number: batchNum })
        });
        const data = await res.json();
        hideLoading();
        if (data.success) {
            showToast({
                type: 'success',
                title: 'تم تصفير الحلول بنجاح 🔄',
                message: `تم مسح إجابات (${batchLabel}) بنجاح.`,
                duration: 3500
            });
            await loadModalQuestions(currentStudyLectureId);
        } else {
            alert("حدث خطأ أثناء تصفير الإجابات: " + (data.error || "خطأ غير معروف"));
        }
    } catch (e) {
        hideLoading();
        alert("خطأ في الاتصال بالخادم: " + e);
    }
}

async function toggleBookmark(qId) {
    const res = await fetch(`/api/question/${qId}/bookmark`, { method: 'POST' });
    const data = await res.json();
    const btn = document.querySelector(`#q-card-${qId} .btn-bookmark`);
    if (data.is_bookmarked) {
        btn.classList.add('bookmarked');
    } else {
        btn.classList.remove('bookmarked');
    }
}

function onQuestionsBatchFilterChange() {
    loadQuestions();
}

async function loadQuestions() {
    const lecFilter = document.getElementById('questionsLectureFilter').value;
    const batchFilterEl = document.getElementById('questionsBatchFilter');
    const batchFilter = batchFilterEl ? batchFilterEl.value : 'all';

    const resetBtn = document.getElementById('btnResetQuestionsLec');
    if (resetBtn) {
        resetBtn.style.display = lecFilter ? 'inline-flex' : 'none';
    }

    // Populate batches for the chosen lecture dynamically
    if (lecFilter && batchFilterEl) {
        try {
            const bRes = await fetch(`/api/lecture/${lecFilter}/batches`);
            const bData = await bRes.json();
            const batches = bData.batches || [];
            const batchDetails = bData.batch_details || [];
            const prevVal = batchFilterEl.value;
            batchFilterEl.innerHTML = '<option value="all">كل الدفعات (All Batches)</option>';
            if (batchDetails.length > 0) {
                batchDetails.forEach(bInfo => {
                    const opt = document.createElement('option');
                    opt.value = bInfo.batch_number;
                    opt.innerText = bInfo.display_title;
                    if (String(bInfo.batch_number) === prevVal) opt.selected = true;
                    batchFilterEl.appendChild(opt);
                });
            } else {
                batches.forEach(b => {
                    const opt = document.createElement('option');
                    opt.value = b;
                    opt.innerText = `باتش ${b}`;
                    if (String(b) === prevVal) opt.selected = true;
                    batchFilterEl.appendChild(opt);
                });
            }
        } catch(e) {}
    } else if (batchFilterEl && !lecFilter) {
        batchFilterEl.innerHTML = '<option value="all">كل الدفعات (All Batches)</option>';
    }

    let url = `/api/questions?block_id=${currentBlockId}&limit=100`;
    if (lecFilter) url += `&lecture_id=${lecFilter}`;
    if (batchFilter && batchFilter !== 'all') url += `&batch_number=${batchFilter}`;
    if (currentQuestionsMode === 'cases') url += `&mode=cases`;
    if (currentQuestionsMode === 'normal' || currentQuestionsMode === 'mcq') url += `&mode=normal`;
    if (currentQuestionsMode === 'bookmarked') url += `&mode=bookmarked`;

    try {
        const res = await fetch(url);
        const data = await res.json();
        currentQuestionsList = data.questions || [];
        
        const feed = document.getElementById('questionsFeed');
        feed.innerHTML = '';
        const btnBatchQuiz = document.getElementById('btnStartBatchQuizTab');
        const btnResetTab = document.getElementById('btnResetBatchAnswersTab');
        if (currentQuestionsList.length === 0) {
            if (btnBatchQuiz) btnBatchQuiz.style.display = 'none';
            if (btnResetTab) btnResetTab.style.display = 'none';
            feed.innerHTML = `<div class="empty-state-card">لا توجد أسئلة محفوظة بعد. اضغط على زر التوليد لصياغة باتش جديد.</div>`;
            return;
        }
        if (btnBatchQuiz) {
            btnBatchQuiz.style.display = 'inline-flex';
        }
        if (btnResetTab) {
            btnResetTab.style.display = lecFilter ? 'inline-flex' : 'none';
        }
        currentQuestionsList.forEach(q => {
            feed.appendChild(renderQuestionCard(q));
        });
    } catch (e) {
        console.error(e);
    }
}

async function resetBatchAnswersFromTab() {
    const lecFilter = document.getElementById('questionsLectureFilter')?.value;
    if (!lecFilter) {
        showToast({ type: 'warning', title: 'يرجى اختيار محاضرة', message: 'يرجى اختيار محاضرة محددة لتصفير حلولها.' });
        return;
    }
    const batchFilterEl = document.getElementById('questionsBatchFilter');
    const batchVal = batchFilterEl ? batchFilterEl.value : 'all';
    const batchNum = (batchVal && batchVal !== 'all') ? parseInt(batchVal) : null;
    const batchLabel = (batchNum !== null) ? `الباتش ${batchNum}` : 'جميع أسئلة المحاضرة';

    if (!confirm(`هل تريد بالتأكيد تصفير ومسح كافة إجاباتك السابقة لـ (${batchLabel})؟\n\nستتمكن من إعادة حل كافة الأسئلة كأنها جديدة تماماً.`)) {
        return;
    }

    showLoading("جاري تصفير إجابات الأسئلة...", "يتم مسح الإجابات المحفوظة للبدء من جديد");
    try {
        const res = await fetch(`/api/lecture/${lecFilter}/reset_answers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ batch_number: batchNum })
        });
        const data = await res.json();
        hideLoading();
        if (data.success) {
            showToast({
                type: 'success',
                title: 'تم تصفير الحلول بنجاح 🔄',
                message: `تم مسح إجابات (${batchLabel}) بنجاح.`,
                duration: 3500
            });
            await loadQuestions();
        } else {
            alert("حدث خطأ أثناء تصفير الإجابات: " + (data.error || "خطأ غير معروف"));
        }
    } catch (e) {
        hideLoading();
        alert("خطأ في الاتصال بالخادم: " + e);
    }
}

// ----------------- RESET LECTURE QUESTIONS & FLASHCARDS -----------------
async function confirmResetLecture(lecId, lectureTitle = '') {
    if (!lecId) return;
    const lec = allLectures.find(l => l.id === parseInt(lecId));
    const title = lectureTitle || (lec ? lec.title : `المحاضرة #${lecId}`);

    const confirmed = confirm(
        `⚠️ تصفير أسئلة وبطاقات المحاضرة:\n"${title}"\n\n` +
        `• سيتم حذف كافة أسئلة الـ MCQs والكاسيز التابعة لها.\n` +
        `• سيتم حذف جميع بطاقات الاستذكار (Flashcards) التابعة لها.\n` +
        `• سيتم حذف وتصفير ملف الـ Word المجمع للمحاضرة.\n` +
        `• التوليد القادم سيبدأ نظيفاً من (باتش 1).\n\n` +
        `هل أنت متأكد من رغبتك في المتابعة والتصفير؟`
    );

    if (!confirmed) return;

    showLoading("جاري تصفير أسئلة وبطاقات المحاضرة...", "يتم مسح السجلات وإعادة تهيئة ملف الـ Word");

    try {
        const res = await fetch(`/api/lecture/${lecId}/reset`, { method: 'POST' });
        const data = await res.json();
        hideLoading();

        if (data.success) {
            showToast({
                type: 'success',
                title: 'تم تصفير المحاضرة بنجاح 🔄',
                message: `تم حذف ${data.deleted_questions} سؤال و ${data.deleted_flashcards} بطاقة. سيبدأ التوليد القادم من باتش 1.`
            });

            // Update modal if open for this lecture
            if (currentStudyLectureId === parseInt(lecId)) {
                await loadModalQuestions(lecId);
                await loadModalFlashcards(lecId);
            }

            // Update main questions tab if open
            const qTab = document.getElementById('tab-questions');
            if (qTab && qTab.classList.contains('active')) {
                await loadQuestions();
            }

            // Update flashcards tab if open
            const fTab = document.getElementById('tab-flashcards');
            if (fTab && fTab.classList.contains('active')) {
                await loadFlashcards();
            }

            await loadDashboardStats();
            await loadLectures();
        } else {
            showToast({
                type: 'error',
                title: 'تعذر تصفير المحاضرة',
                message: data.error || 'حدث خطأ أثناء تصفير المحاضرة.'
            });
        }
    } catch (e) {
        hideLoading();
        showToast({
            type: 'error',
            title: 'خطأ أثناء التصفير',
            message: String(e)
        });
    }
}

function confirmResetCurrentLecture() {
    if (currentStudyLectureId) {
        const lec = allLectures.find(l => l.id === currentStudyLectureId);
        confirmResetLecture(currentStudyLectureId, lec ? lec.title : '');
    }
}

function confirmResetSelectedLectureQuestionsTab() {
    const sel = document.getElementById('questionsLectureFilter').value;
    if (sel) {
        confirmResetLecture(parseInt(sel));
    }
}

function confirmResetSelectedLectureFlashcardsTab() {
    const sel = document.getElementById('flashcardsLectureFilter').value;
    if (sel) {
        confirmResetLecture(parseInt(sel));
    }
}

// ----------------- DELETE LECTURE -----------------
async function confirmDeleteLecture(lecId, lectureTitle = '') {
    if (!lecId) return;
    const lec = allLectures.find(l => l.id === parseInt(lecId));
    const title = lectureTitle || (lec ? lec.title : `المحاضرة #${lecId}`);

    const confirmed = confirm(
        `🚨 حذف المحاضرة نهائياً:\n"${title}"\n\n` +
        `• سيتم مسح المحاضرة بالكامل من المنهج وقاعدة البيانات.\n` +
        `• سيتم مسح جميع أسئلتها وبطاقات الاستذكار (Flashcards) التابعة لها.\n` +
        `• سيتم مسح مهامها من جدول المذاكرة وإعادة موازنة خطة المذاكرة.\n` +
        `• سيتم مسح ملف الـ Word وصور السلايدات وملف الـ PDF التابع لها من القرص.\n\n` +
        `⚠️ هذا الإجراء نهائي ولا يمكن التراجع عنه!\n` +
        `هل أنت متأكد تماماً من رغبتك في حذف المحاضرة نهائياً؟`
    );

    if (!confirmed) return;

    showLoading("جاري حذف المحاضرة وجميع سجلاتها...", "يتم تنظيف الأسئلة والبطاقات والجدول والملفات");

    try {
        const res = await fetch(`/api/lecture/${lecId}/delete`, { method: 'POST' });
        const data = await res.json();
        hideLoading();

        if (data.success) {
            // If study center modal is open for this lecture, close it
            if (currentStudyLectureId === parseInt(lecId)) {
                closeModal('lectureStudyCenterModal');
                currentStudyLectureId = null;
            }

            showToast({
                type: 'success',
                title: 'تم حذف المحاضرة بنجاح 🗑️',
                message: data.message || `تم حذف محاضرة "${title}" بنجاح.`
            });

            await loadLectures();
            await loadCalendar();
            await loadDashboardStats();
            await loadTodos();

            // Refresh questions tab if active
            const qTab = document.getElementById('tab-questions');
            if (qTab && qTab.classList.contains('active')) {
                await loadQuestions();
            }

            // Refresh flashcards tab if active
            const fTab = document.getElementById('tab-flashcards');
            if (fTab && fTab.classList.contains('active')) {
                await loadFlashcards();
            }
        } else {
            showToast({
                type: 'error',
                title: 'تعذر حذف المحاضرة',
                message: data.error || 'حدث خطأ أثناء حذف المحاضرة.'
            });
        }
    } catch (e) {
        hideLoading();
        showToast({
            type: 'error',
            title: 'خطأ أثناء الحذف',
            message: String(e)
        });
    }
}

function confirmDeleteCurrentLecture() {
    if (currentStudyLectureId) {
        const lec = allLectures.find(l => l.id === currentStudyLectureId);
        confirmDeleteLecture(currentStudyLectureId, lec ? lec.title : '');
    }
}

// ----------------- REPLACE LECTURE PDF -----------------
let targetReplaceLectureId = null;
let selectedReplacePdfFile = null;

function openReplaceLecturePdfModal(lecId) {
    targetReplaceLectureId = parseInt(lecId);
    const lec = allLectures.find(l => l.id === targetReplaceLectureId);
    if (!lec) {
        showToast({ type: 'error', title: 'خطأ', message: 'لم يتم العثور على بيانات المحاضرة.' });
        return;
    }

    // Set modal title & current info
    const titleEl = document.getElementById('replaceLecCurrentName');
    if (titleEl) titleEl.innerText = `${lec.title} (محاضرة #${lec.lecture_number > 0 ? lec.lecture_number : 'M'})`;

    const metaEl = document.getElementById('replaceLecCurrentMeta');
    const fileName = lec.file_path ? lec.file_path.split(/[\\/]/).pop() : 'غير محدد';
    if (metaEl) {
        metaEl.innerHTML = `
            <span><i class="fa-solid fa-file-pdf"></i> الملف الحالي: <strong>${fileName}</strong></span>
            <span><i class="fa-regular fa-file-lines"></i> ${lec.page_count} صفحة/شريحة</span>
            <span><i class="fa-solid fa-tag"></i> المادة: ${lec.subject}</span>
        `;
    }

    // Reset inputs
    clearReplaceSelectedPdf();
    const chkResetExp = document.getElementById('replaceLecResetExp');
    if (chkResetExp) chkResetExp.checked = true;
    const chkResetQ = document.getElementById('replaceLecResetQuestions');
    if (chkResetQ) chkResetQ.checked = false;
    const chkUpdateTitle = document.getElementById('replaceLecUpdateTitle');
    if (chkUpdateTitle) chkUpdateTitle.checked = false;
    const chkRebalance = document.getElementById('replaceLecRebalance');
    if (chkRebalance) chkRebalance.checked = true;

    // Open modal
    const modal = document.getElementById('replaceLecturePdfModal');
    if (modal) modal.style.display = 'flex';
}

function triggerReplaceLecturePdfSelect() {
    const input = document.getElementById('replaceLecturePdfInput');
    if (input) {
        input.value = '';
        input.click();
    }
}

function handleReplaceLecturePdfSelected(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const ext = file.name.split('.').pop().toLowerCase();
    if (!['pdf', 'pptx', 'ppt'].includes(ext)) {
        alert('يرجى اختيار ملف PDF أو PowerPoint (.pdf, .pptx, .ppt)');
        clearReplaceSelectedPdf();
        return;
    }

    selectedReplacePdfFile = file;

    const defaultState = document.getElementById('replaceDropzoneDefaultState');
    const selectedState = document.getElementById('replaceDropzoneSelectedState');
    const nameEl = document.getElementById('replaceSelectedFileName');
    const sizeEl = document.getElementById('replaceSelectedFileSize');
    const badgeEl = document.getElementById('replaceSelectedFileBadge');
    const iconEl = document.getElementById('replaceSelectedFileIcon');

    if (defaultState) defaultState.style.display = 'none';
    if (selectedState) selectedState.style.display = 'block';

    if (nameEl) nameEl.innerText = file.name;
    if (sizeEl) sizeEl.innerText = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
    if (badgeEl) badgeEl.innerText = ext.toUpperCase();

    if (iconEl) {
        if (ext === 'pdf') {
            iconEl.className = 'fa-solid fa-file-pdf fa-3x';
            iconEl.style.color = '#ef4444';
        } else {
            iconEl.className = 'fa-solid fa-file-powerpoint fa-3x';
            iconEl.style.color = '#f97316';
        }
    }
}

function clearReplaceSelectedPdf() {
    selectedReplacePdfFile = null;
    const input = document.getElementById('replaceLecturePdfInput');
    if (input) input.value = '';

    const defaultState = document.getElementById('replaceDropzoneDefaultState');
    const selectedState = document.getElementById('replaceDropzoneSelectedState');
    if (defaultState) defaultState.style.display = 'block';
    if (selectedState) selectedState.style.display = 'none';
}

async function submitReplaceLecturePdf() {
    if (!targetReplaceLectureId) return;
    if (!selectedReplacePdfFile) {
        alert('يرجى اختيار ملف الـ PDF أو PowerPoint الجديد أولاً لاستبداله.');
        return;
    }

    const resetExp = document.getElementById('replaceLecResetExp') ? document.getElementById('replaceLecResetExp').checked : true;
    const resetQ = document.getElementById('replaceLecResetQuestions') ? document.getElementById('replaceLecResetQuestions').checked : false;
    const updateTitle = document.getElementById('replaceLecUpdateTitle') ? document.getElementById('replaceLecUpdateTitle').checked : false;
    const rebalance = document.getElementById('replaceLecRebalance') ? document.getElementById('replaceLecRebalance').checked : true;

    closeModal('replaceLecturePdfModal');
    showLoading('جاري رفع واستبدال ملف المحاضرة ومعالجة السلايدات والنصوص وتحديث الكاش والجدول...');

    const formData = new FormData();
    formData.append('pdf_file', selectedReplacePdfFile);
    formData.append('reset_explanation', resetExp);
    formData.append('reset_questions', resetQ);
    formData.append('update_title', updateTitle);
    formData.append('rebalance_schedule', rebalance);

    try {
        const res = await fetch(`/api/lecture/${targetReplaceLectureId}/replace_pdf`, {
            method: 'POST',
            body: formData
        });
        const data = await res.json();
        hideLoading();

        if (data.success) {
            clearReplaceSelectedPdf();

            showToast({
                type: 'success',
                title: 'تم استبدال ملف المحاضرة بنجاح! 📄🔄',
                message: data.message || `تم تحديث ملف المحاضرة (${data.page_count} صفحة/شريحة).`,
                duration: 8000
            });

            await loadLectures();
            await loadCalendar();
            await loadDashboardStats();
            await loadTodos();

            // If the Study Center modal is open for this lecture, refresh its content and title
            if (currentStudyLectureId === targetReplaceLectureId) {
                const refreshedLec = allLectures.find(l => l.id === targetReplaceLectureId);
                if (refreshedLec) {
                    const titleEl = document.getElementById('studyModalLecTitle');
                    if (titleEl) titleEl.innerText = refreshedLec.title;
                    const metaEl = document.getElementById('studyModalLecMeta');
                    if (metaEl) metaEl.innerText = `المادة: ${refreshedLec.subject} • ${refreshedLec.page_count} صفحة • بنك أسئلة Word مخصص`;
                }
                await loadModalLectureImages(targetReplaceLectureId);
                await loadModalExplanation(targetReplaceLectureId, currentStudyLanguage, true);
                if (resetQ) {
                    await loadModalQuestions(targetReplaceLectureId);
                    await loadModalFlashcards(targetReplaceLectureId);
                }
            }
        } else {
            showToast({
                type: 'error',
                title: 'تعذر استبدال ملف المحاضرة',
                message: data.error || 'حدث خطأ أثناء معالجة الملف الجديد.',
                duration: 7000
            });
        }
    } catch (e) {
        hideLoading();
        showToast({
            type: 'error',
            title: 'خطأ أثناء استبدال الملف',
            message: String(e),
            duration: 7000
        });
    }
}

function setQuestionsMode(mode, targetBtn = null) {
    currentQuestionsMode = mode;
    const container = document.querySelector('#tab-questions .questions-mode-selector');
    if (container) {
        container.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
    }
    if (targetBtn) {
        targetBtn.classList.add('active');
    } else {
        const idMap = { all: 'btnModeAll', normal: 'btnModeNormal', mcq: 'btnModeNormal', cases: 'btnModeCases', bookmarked: 'btnModeBookmarked' };
        const el = document.getElementById(idMap[mode]);
        if (el) el.classList.add('active');
    }
    loadQuestions();
}

function openRapidQuiz() {
    switchTab('questions');
    currentQuestionsMode = 'random_quiz';
    loadQuestions();
}

// ----------------- CUSTOM QUIZ FROM PDF & INTERACTIVE QUIZ SOLVER -----------------
let selectedPdfQuizFile = null;

// Interactive Quiz State
let interactiveQuizQuestions = [];
let interactiveQuizCurrentIndex = 0;
let interactiveQuizAnswers = {}; // { [qId]: { selectedOption, isCorrect, correctOption, explanation } }
let interactiveQuizTimerInterval = null;
let interactiveQuizSecondsElapsed = 0;
let interactiveQuizInstantFeedback = true;
let currentInteractiveQuizMeta = { batchNumber: null, batchName: '', lectureId: null, lectureTitle: '' };

// --- PDF QUIZ MODAL ---
async function openCreatePdfQuizModal(preferredLecId = null) {
    selectedPdfQuizFile = null;
    const dropDefault = document.getElementById('pdfQuizDropzoneDefault');
    const dropSelected = document.getElementById('pdfQuizDropzoneSelected');
    const fileInput = document.getElementById('pdfQuizFileInput');
    if (dropDefault) dropDefault.style.display = 'block';
    if (dropSelected) dropSelected.style.display = 'none';
    if (fileInput) fileInput.value = '';

    const nameInput = document.getElementById('pdfQuizNameInput');
    if (nameInput) nameInput.value = '';

    const mcqCountInput = document.getElementById('pdfQuizMcqCount');
    if (mcqCountInput) mcqCountInput.value = 20;

    const caseCountInput = document.getElementById('pdfQuizCaseCount');
    if (caseCountInput) caseCountInput.value = 5;

    switchPdfQuizSource('upload');

    // Populate lectures dropdown
    const lecSelect = document.getElementById('pdfQuizLectureSelect');
    if (lecSelect) {
        lecSelect.innerHTML = '';
        allLectures.forEach(lec => {
            const opt = document.createElement('option');
            opt.value = lec.id;
            opt.innerText = `#${lec.lecture_number} - ${lec.title} (${lec.subject})`;
            if (preferredLecId && parseInt(preferredLecId) === lec.id) {
                opt.selected = true;
            }
            lecSelect.appendChild(opt);
        });
        if (!preferredLecId && allLectures.length > 0) {
            lecSelect.value = allLectures[0].id;
        }
    }

    // Populate existing PDFs dropdown
    const existSelect = document.getElementById('pdfQuizExistingSelect');
    if (existSelect) {
        existSelect.innerHTML = '<option value="">جاري تحميل الملفات المتوفرة...</option>';
        try {
            const res = await fetch('/api/pdfs');
            const data = await res.json();
            const pdfs = (data.pdfs && data.pdfs.length > 0) ? data.pdfs : [
                ...(data.lecture_pdfs || []).map(l => ({ path: l.file_path, display_name: `#${l.lecture_number} - ${l.title} (${l.subject})`, category: 'lecture' })),
                ...(data.uploaded_pdfs || []).map(u => ({ path: u.file_path, display_name: u.filename, category: 'uploaded' }))
            ];
            existSelect.innerHTML = '<option value="">-- اختر ملف PDF مسجل في المنصة --</option>';
            pdfs.forEach(p => {
                const opt = document.createElement('option');
                opt.value = p.path;
                opt.innerText = `${p.category === 'lecture' ? '📖 محاضرة: ' : '📁 ملف: '}${p.display_name}`;
                existSelect.appendChild(opt);
            });
        } catch (e) {
            existSelect.innerHTML = '<option value="">تعذر جلب الملفات</option>';
        }
    }

    openModal('createPdfQuizModal');
}

function switchPdfQuizSource(source) {
    const uploadSec = document.getElementById('pdfQuizUploadSection');
    const existSec = document.getElementById('pdfQuizExistingSection');
    const btnUpload = document.getElementById('btnPdfSourceUpload');
    const btnExist = document.getElementById('btnPdfSourceExisting');

    if (source === 'upload') {
        if (uploadSec) uploadSec.style.display = 'block';
        if (existSec) existSec.style.display = 'none';
        if (btnUpload) btnUpload.classList.add('active');
        if (btnExist) btnExist.classList.remove('active');
    } else {
        if (uploadSec) uploadSec.style.display = 'none';
        if (existSec) existSec.style.display = 'block';
        if (btnUpload) btnUpload.classList.remove('active');
        if (btnExist) btnExist.classList.add('active');
    }
}

function triggerPdfQuizFileSelect() {
    const fileInput = document.getElementById('pdfQuizFileInput');
    if (fileInput) fileInput.click();
}

function handlePdfQuizFileSelected(event) {
    const file = event.target.files[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf')) {
        showToast({ type: 'error', title: 'ملف غير مدعوم', message: 'يرجى اختيار ملف PDF فقط (.pdf)' });
        return;
    }

    selectedPdfQuizFile = file;
    const nameEl = document.getElementById('pdfQuizSelectedFileName');
    const sizeEl = document.getElementById('pdfQuizSelectedFileSize');
    const dropDefault = document.getElementById('pdfQuizDropzoneDefault');
    const dropSelected = document.getElementById('pdfQuizDropzoneSelected');

    if (nameEl) nameEl.innerText = file.name;
    if (sizeEl) sizeEl.innerText = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
    if (dropDefault) dropDefault.style.display = 'none';
    if (dropSelected) dropSelected.style.display = 'block';

    // Auto suggest quiz name if empty
    const nameInput = document.getElementById('pdfQuizNameInput');
    if (nameInput && !nameInput.value.trim()) {
        const clean = file.name.replace(/\.[^/.]+$/, '').replace(/[_\-]/g, ' ');
        nameInput.value = `كويز ${clean}`;
    }
}

function clearPdfQuizFile(event) {
    if (event) event.stopPropagation();
    selectedPdfQuizFile = null;
    const fileInput = document.getElementById('pdfQuizFileInput');
    if (fileInput) fileInput.value = '';
    const dropDefault = document.getElementById('pdfQuizDropzoneDefault');
    const dropSelected = document.getElementById('pdfQuizDropzoneSelected');
    if (dropDefault) dropDefault.style.display = 'block';
    if (dropSelected) dropSelected.style.display = 'none';
}

async function confirmGeneratePdfQuiz() {
    const lecSelect = document.getElementById('pdfQuizLectureSelect');
    const lecId = lecSelect ? parseInt(lecSelect.value) : null;
    if (!lecId) {
        showToast({ type: 'error', title: 'اختر المحاضرة', message: 'يرجى تحديد المحاضرة المستهدفة لإلحاق الأسئلة بها.' });
        return;
    }

    const isUpload = document.getElementById('btnPdfSourceUpload').classList.contains('active');
    const existingSelect = document.getElementById('pdfQuizExistingSelect');
    const existingPath = existingSelect ? existingSelect.value : '';

    if (isUpload && !selectedPdfQuizFile) {
        showToast({ type: 'error', title: 'ملف PDF مفقود', message: 'يرجى رفع ملف الـ PDF أولاً أو سحبه هنا.' });
        return;
    }
    if (!isUpload && !existingPath) {
        showToast({ type: 'error', title: 'اختر ملف PDF', message: 'يرجى اختيار ملف PDF موجود من القائمة المنسدلة.' });
        return;
    }

    const quizName = (document.getElementById('pdfQuizNameInput').value || '').trim();
    const mcqCount = parseInt(document.getElementById('pdfQuizMcqCount').value) || 20;
    const caseCount = parseInt(document.getElementById('pdfQuizCaseCount').value) || 5;

    const lec = allLectures.find(l => l.id === lecId);
    const lecTitle = lec ? lec.title : `المحاضرة #${lecId}`;

    closeModal('createPdfQuizModal');

    const taskId = `pdf_quiz_${Date.now()}`;
    const displayName = quizName || 'كويز مخصص من PDF';

    startBackgroundTask(
        taskId,
        `توليد واشتقاق "${displayName}"`,
        `يقوم الذكاء الاصطناعي باستخراج الأسئلة من الـ PDF وربطها بمحاضرة: ${lecTitle}...`
    );

    showToast({
        type: 'info',
        title: 'بدأ استخراج وتوليد الكويز 🚀',
        message: `جاري قراءة الـ PDF وتوليد الأسئلة لـ "${lecTitle}". سنشعرك فور الجاهزية!`,
        duration: 5000
    });

    try {
        const formData = new FormData();
        formData.append('lecture_id', lecId);
        formData.append('quiz_name', quizName);
        formData.append('mcq_count', mcqCount);
        formData.append('case_count', caseCount);

        if (isUpload && selectedPdfQuizFile) {
            formData.append('pdf_file', selectedPdfQuizFile);
        } else if (existingPath) {
            formData.append('pdf_path', existingPath);
        }

        const res = await fetch('/api/questions/generate_from_pdf', {
            method: 'POST',
            body: formData
        });
        const data = await res.json();
        finishBackgroundTask(taskId);

        if (data.success) {
            const batchNum = data.batch_number || 1;
            const finalBatchName = data.batch_name || displayName;

            // Refresh views
            if (currentStudyLectureId === lecId) {
                await loadModalQuestions(lecId);
            }
            const qTab = document.getElementById('tab-questions');
            if (qTab && qTab.classList.contains('active')) {
                const filter = document.getElementById('questionsLectureFilter');
                if (filter) filter.value = lecId;
                await loadQuestions();
                const bFilter = document.getElementById('questionsBatchFilter');
                if (bFilter) {
                    bFilter.value = batchNum;
                    onQuestionsBatchFilterChange();
                }
            }

            showToast({
                type: 'success',
                title: `اكتمل توليد "${finalBatchName}"! 🎉`,
                message: `تم توليد ${data.questions_generated} سؤال وحفظها بنجاح مع إلحاقها بملف Word!`,
                actionText: '🎯 حل هذا الكويز الآن',
                onAction: () => {
                    launchInteractiveQuiz(lecId, batchNum, null, finalBatchName);
                },
                duration: 12000
            });
        } else {
            showToast({
                type: 'error',
                title: 'فشل توليد الكويز من PDF',
                message: data.error || 'حدث خطأ أثناء معالجة ملف الـ PDF.',
                duration: 8000
            });
        }
    } catch (e) {
        finishBackgroundTask(taskId);
        showToast({
            type: 'error',
            title: 'خطأ اتصال',
            message: String(e),
            duration: 8000
        });
    }
}

// --- INTERACTIVE QUIZ SOLVER ---
function startInteractiveQuizFromTab() {
    const lecFilter = document.getElementById('questionsLectureFilter')?.value;
    const batchFilterEl = document.getElementById('questionsBatchFilter');
    const batchVal = batchFilterEl ? batchFilterEl.value : 'all';

    const chosenLecId = lecFilter ? parseInt(lecFilter) : (allLectures[0] ? allLectures[0].id : null);
    const selectedOptionText = (batchVal && batchVal !== 'all' && batchFilterEl?.options[batchFilterEl.selectedIndex]?.innerText) || 'اختبار شامل';
    const batchNum = (batchVal && batchVal !== 'all') ? parseInt(batchVal) : null;
    launchInteractiveQuiz(chosenLecId, batchNum, null, selectedOptionText);
}

function startInteractiveQuizFromModal() {
    const lecId = currentStudyLectureId || (allLectures[0] ? allLectures[0].id : 1);
    const batchFilterEl = document.getElementById('modalQuestionsBatchFilter');
    const batchVal = batchFilterEl ? batchFilterEl.value : 'all';

    const selectedOptionText = (batchVal && batchVal !== 'all' && batchFilterEl?.options[batchFilterEl.selectedIndex]?.innerText) || 'اختبار شامل للمحاضرة';
    const batchNum = (batchVal && batchVal !== 'all') ? parseInt(batchVal) : null;
    launchInteractiveQuiz(lecId, batchNum, null, selectedOptionText);
}

async function launchInteractiveQuiz(lectureId, batchNumber, questionsList = null, quizTitle = '') {
    showLoading('جاري تحضير بيئة الاختبار التفاعلي...', 'يتم جلب الأسئلة وتجهيز مؤقت الامتحان');
    try {
        let questions = (questionsList && questionsList.length > 0) ? questionsList : null;
        if (!questions) {
            let qUrl = `/api/questions?block_id=${currentBlockId}&limit=200`;
            if (lectureId) {
                qUrl += `&lecture_id=${lectureId}`;
            }
            if (batchNumber && batchNumber !== 'all' && !isNaN(parseInt(batchNumber))) {
                qUrl += `&batch_number=${parseInt(batchNumber)}`;
            }
            const res = await fetch(qUrl);
            const data = await res.json();
            questions = data.questions || [];
        }

        hideLoading();

        if (questions.length === 0) {
            showToast({ type: 'warning', title: 'لا توجد أسئلة بعد', message: 'لم يتم العثور على أي أسئلة لهذا الاختبار. يمكنك توليد أسئلة للمحاضرة أولاً.' });
            return;
        }

        // Initialize state & load previous answers
        interactiveQuizQuestions = questions;
        interactiveQuizAnswers = {};
        interactiveQuizSecondsElapsed = 0;

        let firstUnansweredIndex = -1;
        questions.forEach((q, idx) => {
            const userSel = (q.user_selected_option || '').trim().toUpperCase();
            if (userSel) {
                const corr = (q.correct_option || '').trim().toUpperCase();
                interactiveQuizAnswers[q.id] = {
                    selectedOption: userSel,
                    isCorrect: (userSel === corr),
                    correctOption: corr,
                    explanation: q.explanation_arabic || q.explanation || ''
                };
            } else if (firstUnansweredIndex === -1) {
                firstUnansweredIndex = idx;
            }
        });

        interactiveQuizCurrentIndex = (firstUnansweredIndex !== -1) ? firstUnansweredIndex : 0;

        const toggleEl = document.getElementById('quizInstantFeedbackToggle');
        interactiveQuizInstantFeedback = toggleEl ? toggleEl.checked : true;

        const lec = allLectures.find(l => l.id === parseInt(lectureId));
        const lecTitle = lec ? lec.title : (lectureId ? `المحاضرة #${lectureId}` : 'جميع المحاضرات');
        const firstQ = questions[0] || {};
        const displayQuizName = firstQ.batch_name || quizTitle || (batchNumber ? `باتش ${batchNumber}` : 'اختبار تفاعلي');

        currentInteractiveQuizMeta = {
            batchNumber: batchNumber,
            batchName: displayQuizName,
            lectureId: lectureId,
            lectureTitle: lecTitle
        };

        // Header elements
        const titleEl = document.getElementById('quizHeaderTitle');
        const batchBadgeEl = document.getElementById('quizHeaderBatchBadge');
        const lecNameEl = document.getElementById('quizHeaderLectureName');

        if (titleEl) titleEl.innerText = displayQuizName;
        if (batchBadgeEl) batchBadgeEl.innerText = batchNumber ? `باتش ${batchNumber}` : 'شامل';
        if (lecNameEl) lecNameEl.innerText = `${lec ? `#${lec.lecture_number} - ${lec.title} (${lec.subject})` : lecTitle}`;

        // Reset views
        const activeScreen = document.getElementById('quizActiveScreen');
        const resultsScreen = document.getElementById('quizResultsScreen');
        const footer = document.getElementById('quizModalFooter');
        const reviewListContainer = document.getElementById('quizReviewListContainer');

        if (activeScreen) activeScreen.style.display = 'flex';
        if (resultsScreen) resultsScreen.style.display = 'none';
        if (footer) footer.style.display = 'flex';
        if (reviewListContainer) reviewListContainer.style.display = 'none';

        // Start Stopwatch
        clearInterval(interactiveQuizTimerInterval);
        const timerDisp = document.getElementById('quizTimerDisplay');
        if (timerDisp) timerDisp.innerText = '00:00';
        interactiveQuizTimerInterval = setInterval(() => {
            interactiveQuizSecondsElapsed++;
            const mins = String(Math.floor(interactiveQuizSecondsElapsed / 60)).padStart(2, '0');
            const secs = String(interactiveQuizSecondsElapsed % 60).padStart(2, '0');
            if (timerDisp) timerDisp.innerText = `${mins}:${secs}`;
        }, 1000);

        renderCurrentQuizQuestion();
        renderQuizJumpButtons();
        openModal('interactiveQuizModal');
    } catch (e) {
        hideLoading();
        showToast({ type: 'error', title: 'خطأ', message: String(e) });
    }
}

function renderCurrentQuizQuestion() {
    if (!interactiveQuizQuestions || interactiveQuizQuestions.length === 0) return;
    const q = interactiveQuizQuestions[interactiveQuizCurrentIndex];
    const total = interactiveQuizQuestions.length;

    // Update Progress
    const progText = document.getElementById('quizProgressText');
    const progBar = document.getElementById('quizProgressBar');
    if (progText) progText.innerText = `السؤال ${interactiveQuizCurrentIndex + 1} من ${total}`;
    if (progBar) progBar.style.width = `${Math.round(((interactiveQuizCurrentIndex + 1) / total) * 100)}%`;

    // Counts badge
    let correctCount = 0;
    let wrongCount = 0;
    Object.values(interactiveQuizAnswers).forEach(a => {
        if (a.isCorrect) correctCount++;
        else wrongCount++;
    });
    const cBadge = document.getElementById('quizCorrectCountBadge');
    const wBadge = document.getElementById('quizWrongCountBadge');
    const rBadge = document.getElementById('quizRemainingBadge');
    if (cBadge) cBadge.innerText = `صحيح: ${correctCount}`;
    if (wBadge) wBadge.innerText = `خاطئ: ${wrongCount}`;
    if (rBadge) rBadge.innerText = `المتبقي: ${total - Object.keys(interactiveQuizAnswers).length}`;

    // Case Scenario
    const caseBox = document.getElementById('quizCaseScenarioBox');
    const caseText = document.getElementById('quizCaseScenarioText');
    const isCase = q.question_type === 'case' || (q.case_scenario && q.case_scenario.length > 5);
    if (isCase && q.case_scenario) {
        if (caseBox) caseBox.style.display = 'block';
        if (caseText) caseText.innerText = q.case_scenario;
    } else {
        if (caseBox) caseBox.style.display = 'none';
    }

    // Question Type & Meta
    const typeBadge = document.getElementById('quizQuestionTypeBadge');
    if (typeBadge) typeBadge.innerText = isCase ? '🩺 Clinical Vignette / حالة سريرية' : '📝 Multiple Choice Question (MCQ)';
    const metaEl = document.getElementById('quizQuestionMeta');
    if (metaEl) metaEl.innerText = q.lecture_title || '';

    // Prompt
    const promptEl = document.getElementById('quizQuestionPrompt');
    if (promptEl) promptEl.innerText = q.question_text;

    // Options
    const optContainer = document.getElementById('quizOptionsContainer');
    if (optContainer) {
        optContainer.innerHTML = '';
        const options = [
            { letter: 'A', text: q.option_a },
            { letter: 'B', text: q.option_b },
            { letter: 'C', text: q.option_c },
            { letter: 'D', text: q.option_d }
        ];

        const existingAnswer = interactiveQuizAnswers[q.id];

        options.forEach(opt => {
            const item = document.createElement('div');
            item.className = 'quiz-opt-item';
            
            let statusIcon = '<i class="fa-regular fa-circle opt-status-icon"></i>';

            if (existingAnswer) {
                item.classList.add('locked');
                if (opt.letter === existingAnswer.selectedOption) {
                    item.classList.add('selected');
                }
                if (interactiveQuizInstantFeedback) {
                    if (opt.letter === existingAnswer.correctOption) {
                        item.classList.add('correct');
                        statusIcon = '<i class="fa-solid fa-circle-check opt-status-icon"></i>';
                    } else if (opt.letter === existingAnswer.selectedOption && !existingAnswer.isCorrect) {
                        item.classList.add('wrong');
                        statusIcon = '<i class="fa-solid fa-circle-xmark opt-status-icon"></i>';
                    }
                }
            } else {
                item.onclick = () => handleSelectQuizOption(opt.letter);
            }

            item.innerHTML = `
                <div class="opt-letter">${opt.letter}</div>
                <div class="opt-text">${opt.text}</div>
                ${statusIcon}
            `;
            optContainer.appendChild(item);
        });
    }

    // Explanation Box
    const expBox = document.getElementById('quizExplanationBox');
    const expContent = document.getElementById('quizExplanationContent');
    const existingAns = interactiveQuizAnswers[q.id];

    if (existingAns && interactiveQuizInstantFeedback) {
        if (expBox) expBox.style.display = 'block';
        if (expContent) {
            expContent.innerHTML = `
                <div style="font-weight: 700; color: ${existingAns.isCorrect ? '#10b981' : '#ef4444'}; margin-bottom: 6px;">
                    ${existingAns.isCorrect ? '✅ إجابة صحيحة وموفقة!' : `❌ إجابة غير دقيقة. الإجابة الصحيحة هي: (${existingAns.correctOption})`}
                </div>
                <div>${existingAns.explanation || 'لا يوجد شرح إضافي مسجل.'}</div>
            `;
        }
    } else {
        if (expBox) expBox.style.display = 'none';
    }

    // Nav buttons
    const btnPrev = document.getElementById('btnQuizPrev');
    const btnNext = document.getElementById('btnQuizNext');
    if (btnPrev) btnPrev.disabled = (interactiveQuizCurrentIndex === 0);
    if (btnNext) {
        if (interactiveQuizCurrentIndex === total - 1) {
            btnNext.innerHTML = '<i class="fa-solid fa-flag-checkered"></i> إنهاء وتسليم';
        } else {
            btnNext.innerHTML = 'التالي <i class="fa-solid fa-arrow-left"></i>';
        }
    }
}

function handleSelectQuizOption(letter) {
    const q = interactiveQuizQuestions[interactiveQuizCurrentIndex];
    if (!q) return;

    if (interactiveQuizAnswers[q.id] && interactiveQuizInstantFeedback) return;

    const correctOption = (q.correct_option || '').toUpperCase().trim();
    const isCorrect = (letter.toUpperCase().trim() === correctOption);
    const explanation = q.explanation_arabic || q.explanation || '';

    interactiveQuizAnswers[q.id] = {
        selectedOption: letter,
        isCorrect: isCorrect,
        correctOption: correctOption,
        explanation: explanation
    };
    q.user_selected_option = letter;
    q.last_answer_correct = isCorrect ? 1 : 0;

    // Save answer in DB in background
    fetch(`/api/question/${q.id}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ option: letter })
    }).catch(err => console.error("Error logging answer", err));

    renderCurrentQuizQuestion();
    renderQuizJumpButtons();
}

function renderQuizJumpButtons() {
    const strip = document.getElementById('quizJumpButtonsStrip');
    if (!strip) return;
    strip.innerHTML = '';

    interactiveQuizQuestions.forEach((q, idx) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'quiz-jump-btn';
        btn.innerText = idx + 1;

        if (idx === interactiveQuizCurrentIndex) {
            btn.classList.add('current');
        }

        const ans = interactiveQuizAnswers[q.id];
        if (ans) {
            if (interactiveQuizInstantFeedback) {
                if (ans.isCorrect) btn.classList.add('is-correct');
                else btn.classList.add('is-wrong');
            } else {
                btn.classList.add('answered');
            }
        }

        btn.onclick = () => jumpToQuizQuestion(idx);
        strip.appendChild(btn);
    });
}

function quizNextQuestion() {
    if (interactiveQuizCurrentIndex < interactiveQuizQuestions.length - 1) {
        interactiveQuizCurrentIndex++;
        renderCurrentQuizQuestion();
        renderQuizJumpButtons();
    } else {
        quizFinishAndSubmit();
    }
}

function quizPrevQuestion() {
    if (interactiveQuizCurrentIndex > 0) {
        interactiveQuizCurrentIndex--;
        renderCurrentQuizQuestion();
        renderQuizJumpButtons();
    }
}

function jumpToQuizQuestion(idx) {
    if (idx >= 0 && idx < interactiveQuizQuestions.length) {
        interactiveQuizCurrentIndex = idx;
        renderCurrentQuizQuestion();
        renderQuizJumpButtons();
    }
}

function toggleQuizInstantFeedback() {
    const toggleEl = document.getElementById('quizInstantFeedbackToggle');
    interactiveQuizInstantFeedback = toggleEl ? toggleEl.checked : true;
    renderCurrentQuizQuestion();
    renderQuizJumpButtons();
}

function quizFinishAndSubmit() {
    const total = interactiveQuizQuestions.length;
    const answeredCount = Object.keys(interactiveQuizAnswers).length;

    if (answeredCount < total) {
        const unanswered = total - answeredCount;
        const conf = confirm(`⚠️ تنبيه: يتبقى لديك ${unanswered} أسئلة لم تجب عليها بعد.\n\nهل أنت متأكد من رغبتك في تسليم الاختبار الآن وعرض النتيجة؟`);
        if (!conf) return;
    }

    clearInterval(interactiveQuizTimerInterval);

    // Grade
    let correctCount = 0;
    Object.values(interactiveQuizAnswers).forEach(a => {
        if (a.isCorrect) correctCount++;
    });

    const percent = Math.round((correctCount / total) * 100);
    const mins = Math.floor(interactiveQuizSecondsElapsed / 60);
    const secs = interactiveQuizSecondsElapsed % 60;
    const timeFormatted = `${mins} دقيقة و ${secs} ثانية`;

    // Hide active screen & footer, show results screen
    const activeScreen = document.getElementById('quizActiveScreen');
    const resultsScreen = document.getElementById('quizResultsScreen');
    const footer = document.getElementById('quizModalFooter');

    if (activeScreen) activeScreen.style.display = 'none';
    if (resultsScreen) resultsScreen.style.display = 'flex';
    if (footer) footer.style.display = 'none';

    // Populate score
    const scorePctEl = document.getElementById('quizScorePercentage');
    const scoreFracEl = document.getElementById('quizScoreFraction');
    const timeResEl = document.getElementById('quizTimeTakenResult');
    const accResEl = document.getElementById('quizAccuracyResult');
    const emojiEl = document.getElementById('quizResultEmoji');
    const headingEl = document.getElementById('quizResultHeading');
    const subEl = document.getElementById('quizResultSub');

    if (scorePctEl) scorePctEl.innerText = `${percent}%`;
    if (scoreFracEl) scoreFracEl.innerText = `${correctCount} من ${total} إجابة صحيحة`;
    if (timeResEl) timeResEl.innerText = timeFormatted;
    if (accResEl) accResEl.innerText = `${percent}%`;

    if (percent >= 85) {
        if (emojiEl) emojiEl.innerText = '🌟';
        if (headingEl) headingEl.innerText = 'أداء ممتاز وطبيب متمكن!';
        if (subEl) subEl.innerText = 'استيعاب رائع للمفاهيم الطبية والتشخيصية. أحسنت صنعاً!';
    } else if (percent >= 70) {
        if (emojiEl) emojiEl.innerText = '👍';
        if (headingEl) headingEl.innerText = 'أداء جيد جداً!';
        if (subEl) subEl.innerText = 'فهم قوي لمعظم الحالات، راجع النقاط الخاطئة لتثبيت المعرفة.';
    } else if (percent >= 50) {
        if (emojiEl) emojiEl.innerText = '📖';
        if (headingEl) headingEl.innerText = 'مستوى متوسط - بحاجة لتثبيت';
        if (subEl) subEl.innerText = 'راجع الشرح والتعليلات الطبية واستعن ببطاقات الاستذكار النشط.';
    } else {
        if (emojiEl) emojiEl.innerText = '⚠️';
        if (headingEl) headingEl.innerText = 'بحاجة لإعادة قراءة المحاضرة';
        if (subEl) subEl.innerText = 'يوصى بقراءة الشرح الشامل أولاً ثم إعادة خوض الاختبار لتثبيت الأساسيات.';
    }

    // Mistakes button
    const btnWrong = document.getElementById('btnReviewWrongQuestions');
    const wrongCount = total - correctCount;
    if (btnWrong) {
        btnWrong.style.display = (wrongCount > 0) ? 'inline-flex' : 'none';
        btnWrong.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> مراجعة الأسئلة الخاطئة فقط (${wrongCount})`;
    }

    // Render full review list
    renderQuizReviewList(false);
}

function renderQuizReviewList(onlyMistakes = false) {
    const listEl = document.getElementById('quizReviewList');
    const container = document.getElementById('quizReviewListContainer');
    if (!listEl || !container) return;

    listEl.innerHTML = '';
    container.style.display = 'block';

    const questionsToDisplay = onlyMistakes
        ? interactiveQuizQuestions.filter(q => {
            const a = interactiveQuizAnswers[q.id];
            return !a || !a.isCorrect;
        })
        : interactiveQuizQuestions;

    if (questionsToDisplay.length === 0) {
        listEl.innerHTML = '<div class="alert-info-box" style="text-align:center;">🎉 لا توجد أخطاء لمراجعتها! كل الإجابات صحيحة.</div>';
        return;
    }

    questionsToDisplay.forEach((q, idx) => {
        const ans = interactiveQuizAnswers[q.id];
        const isCorrect = ans ? ans.isCorrect : false;
        const selectedOpt = ans ? ans.selectedOption : 'لم يُجب';
        const correctOpt = (q.correct_option || '').toUpperCase();

        const card = document.createElement('div');
        card.className = 'redo-card';
        if (isCorrect) card.classList.add('is-resolved');

        const isCase = q.question_type === 'case' || (q.case_scenario && q.case_scenario.length > 5);

        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <span style="font-weight: 700; color: var(--primary-light); font-size: 13.5px;">سؤال ${idx + 1}</span>
                <span class="${isCorrect ? 'redo-tag-resolved' : 'redo-tag-mistake'}">
                    ${isCorrect ? '✅ إجابة صحيحة' : '❌ إجابة خاطئة'}
                </span>
            </div>

            ${isCase ? `<div class="case-scenario-box" style="margin-bottom: 8px; font-size: 13px;"><i class="fa-solid fa-notes-medical text-accent"></i> ${q.case_scenario}</div>` : ''}

            <div style="font-weight: 700; font-size: 14.5px; line-height: 1.6; margin-bottom: 12px; color: var(--text-main);">${q.question_text}</div>

            <div style="display: grid; grid-template-columns: 1fr; gap: 6px; margin-bottom: 12px;">
                ${['A', 'B', 'C', 'D'].map(letter => {
                    const optKey = `option_${letter.toLowerCase()}`;
                    const optText = q[optKey] || '';
                    let optClass = '';
                    let tag = '';
                    if (letter === correctOpt) {
                        optClass = 'background: rgba(16,185,129,0.15); border: 1px solid #10b981; color: #a7f3d0;';
                        tag = ' <strong style="color: #10b981;">(الإجابة الصحيحة)</strong>';
                    } else if (letter === selectedOpt && !isCorrect) {
                        optClass = 'background: rgba(239,68,68,0.15); border: 1px solid #ef4444; color: #fca5a5;';
                        tag = ' <strong style="color: #ef4444;">(إجابتك)</strong>';
                    } else {
                        optClass = 'background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);';
                    }
                    return `<div style="padding: 8px 12px; border-radius: 6px; font-size: 13px; ${optClass}"><strong>${letter}:</strong> ${optText}${tag}</div>`;
                }).join('')}
            </div>

            <div style="background: rgba(15,23,42,0.6); padding: 10px 14px; border-radius: 6px; font-size: 12.5px; line-height: 1.6; border: 1px solid rgba(255,255,255,0.08);">
                <strong style="color: var(--primary-light);"><i class="fa-solid fa-lightbulb text-warning"></i> التعليل الطبي:</strong><br>
                ${q.explanation_arabic || q.explanation || 'لا يوجد شرح إضافي.'}
            </div>
        `;
        listEl.appendChild(card);
    });

    container.scrollIntoView({ behavior: 'smooth' });
}

function reviewQuizMistakes() {
    renderQuizReviewList(true);
}

function reviewAllQuizQuestions() {
    renderQuizReviewList(false);
}

async function resetInteractiveQuizCurrentAnswers(skipConfirm = false) {
    if (!skipConfirm) {
        if (!confirm('هل تريد بالتأكيد تصفير ومسح كافة إجاباتك السابقة لهذا الاختبار؟\n\nستتمكن من إعادة حل كافة الأسئلة كأنها جديدة تماماً.')) {
            return;
        }
    }

    const lecId = currentInteractiveQuizMeta?.lectureId;
    const batchNum = currentInteractiveQuizMeta?.batchNumber;

    showLoading('جاري تصفير إجابات الاختبار...', 'يتم مسح الإجابات للبدء من جديد');
    try {
        if (lecId) {
            await fetch(`/api/lecture/${lecId}/reset_answers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ batch_number: batchNum || null })
            });
        } else if (interactiveQuizQuestions && interactiveQuizQuestions.length > 0) {
            await Promise.all(interactiveQuizQuestions.map(q =>
                fetch(`/api/question/${q.id}/reset_answer`, { method: 'POST' })
            ));
        }

        // Reset local quiz state
        interactiveQuizAnswers = {};
        interactiveQuizCurrentIndex = 0;
        interactiveQuizSecondsElapsed = 0;

        if (interactiveQuizQuestions && interactiveQuizQuestions.length > 0) {
            interactiveQuizQuestions.forEach(q => {
                q.user_selected_option = '';
                q.last_answer_correct = null;
            });
        }

        hideLoading();

        // Switch to active screen if was on results
        const activeScreen = document.getElementById('quizActiveScreen');
        const resultsScreen = document.getElementById('quizResultsScreen');
        const footer = document.getElementById('quizModalFooter');
        const reviewListContainer = document.getElementById('quizReviewListContainer');

        if (activeScreen) activeScreen.style.display = 'flex';
        if (resultsScreen) resultsScreen.style.display = 'none';
        if (footer) footer.style.display = 'flex';
        if (reviewListContainer) reviewListContainer.style.display = 'none';

        // Reset timer
        clearInterval(interactiveQuizTimerInterval);
        const timerDisp = document.getElementById('quizTimerDisplay');
        if (timerDisp) timerDisp.innerText = '00:00';
        interactiveQuizTimerInterval = setInterval(() => {
            interactiveQuizSecondsElapsed++;
            const mins = String(Math.floor(interactiveQuizSecondsElapsed / 60)).padStart(2, '0');
            const secs = String(interactiveQuizSecondsElapsed % 60).padStart(2, '0');
            if (timerDisp) timerDisp.innerText = `${mins}:${secs}`;
        }, 1000);

        renderCurrentQuizQuestion();
        renderQuizJumpButtons();

        showToast({
            type: 'success',
            title: 'تم تصفير الاختبار 🔄',
            message: 'تم مسح الإجابات بنجاح، يمكنك الآن حل الأسئلة من جديد.',
            duration: 3000
        });

        // Also refresh background views if open
        if (currentStudyLectureId) {
            loadModalQuestions(currentStudyLectureId);
        }
        const qTab = document.getElementById('tab-questions');
        if (qTab && qTab.classList.contains('active')) {
            loadQuestions();
        }
    } catch (e) {
        hideLoading();
        showToast({ type: 'error', title: 'خطأ', message: String(e) });
    }
}

async function restartInteractiveQuiz() {
    await resetInteractiveQuizCurrentAnswers(true);
}

function closeInteractiveQuiz() {
    clearInterval(interactiveQuizTimerInterval);
    closeModal('interactiveQuizModal');

    // If on questions tab or study center, refresh
    const qTab = document.getElementById('tab-questions');
    if (qTab && qTab.classList.contains('active')) {
        loadQuestions();
    }
    if (currentStudyLectureId) {
        loadModalQuestions(currentStudyLectureId);
    }
}


// ----------------- FLASHCARDS INSIDE MODAL & TAB -----------------
async function loadModalFlashcards(lecId) {
    const container = document.getElementById('modalFlashcardsContainer');
    container.innerHTML = '<div class="empty-state-sm">جاري تحميل البطاقات...</div>';

    try {
        const res = await fetch(`/api/flashcards?block_id=${currentBlockId}&lecture_id=${lecId}`);
        const data = await res.json();
        const cards = data.flashcards || [];

        if (cards.length === 0) {
            container.innerHTML = `
                <div class="empty-state-card">
                    <i class="fa-solid fa-layer-group fa-2x text-muted mb-2"></i>
                    <h4>لا توجد بطاقات محفوظة لهذه المحاضرة</h4>
                    <p>اضغط على زر "توليد بطاقات بالذكاء الاصطناعي" لصياغتها وحفظها بشكل دائم.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `<div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">` +
            cards.map(c => {
                const frontDir = /[\u0600-\u06FF]/.test(c.front || '') ? 'rtl' : 'ltr';
                const backDir = /[\u0600-\u06FF]/.test(c.back || '') ? 'rtl' : 'ltr';
                return `
                <div class="cal-task-card" id="modalCard_${c.id}" style="position:relative; transition: all 0.2s;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                        <span style="font-size:11px; color:var(--primary-light); font-weight:700;">${c.subdeck || 'بطاقة استذكار'}</span>
                        <div style="display:flex; gap:6px;">
                            <button class="btn btn-xs btn-outline" onclick="openEditFlashcardModal(${c.id})" title="تعديل البطاقة" style="border-color:rgba(245, 158, 11, 0.4); color:#fbbf24; padding:2px 7px;">
                                <i class="fa-solid fa-pen-to-square"></i>
                            </button>
                            <button class="btn btn-xs btn-outline-danger" onclick="confirmDeleteFlashcard(${c.id}, ${lecId})" title="حذف البطاقة" style="padding:2px 7px;">
                                <i class="fa-solid fa-trash-can"></i>
                            </button>
                        </div>
                    </div>
                    <div style="font-weight:700; margin:4px 0;" dir="${frontDir}">${c.front}</div>
                    <div style="font-size:13px; color:var(--text-muted); border-top:1px solid rgba(255,255,255,0.05); padding-top:4px;" dir="${backDir}">${c.back}</div>
                </div>
            `;}).join('') + `</div>`;
    } catch (e) {
        console.error(e);
    }
}

// ----------------- FLASHCARD COUNT & CUSTOM CREATION HANDLERS -----------------
let selectedFlashcardCountChoice = 25;

function setFlashcardCountChoice(count) {
    selectedFlashcardCountChoice = count;
    const input = document.getElementById('genFlashcardsCountInput');
    if (input) input.value = count;

    const container = document.getElementById('flashcardCountChipsContainer');
    if (container) {
        container.querySelectorAll('.chip').forEach(btn => {
            const btnText = btn.innerText;
            if (btnText.includes(`${count} `)) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }
}

function syncFlashcardCountInput() {
    const input = document.getElementById('genFlashcardsCountInput');
    if (!input) return;
    const val = parseInt(input.value) || 25;
    selectedFlashcardCountChoice = val;

    const container = document.getElementById('flashcardCountChipsContainer');
    if (container) {
        container.querySelectorAll('.chip').forEach(btn => {
            const btnText = btn.innerText;
            if (btnText.startsWith(`${val} `)) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }
}

async function checkExistingFlashcardsCount(lecId) {
    const section = document.getElementById('genFlashcardsExistingSection');
    const countEl = document.getElementById('genExistingFlashcardsCount');
    if (!section || !lecId) return;

    try {
        const res = await fetch(`/api/lecture/${lecId}/flashcards_summary`);
        const data = await res.json();
        const total = data.total_cards || 0;
        if (total > 0) {
            if (countEl) countEl.innerText = total;
            section.style.display = 'block';
            // Default to replace
            const replaceRadio = document.querySelector('input[name="genFlashcardModeRadio"][value="replace"]');
            if (replaceRadio) replaceRadio.checked = true;
        } else {
            section.style.display = 'none';
        }
    } catch (e) {
        section.style.display = 'none';
    }
}

function onGenFlashcardsLectureChange() {
    const select = document.getElementById('genFlashcardsLectureSelect');
    if (select && select.value) {
        checkExistingFlashcardsCount(parseInt(select.value));
    }
}

async function openFlashcardGenModal(targetLecId = null) {
    const select = document.getElementById('genFlashcardsLectureSelect');
    let chosenLecId = null;
    if (select) {
        select.innerHTML = '';
        allLectures.forEach(l => {
            const opt = document.createElement('option');
            opt.value = l.id;
            opt.innerText = `${l.lecture_number ? '#' + l.lecture_number + ' ' : ''}${l.title}`;
            select.appendChild(opt);
        });

        // Sanitize targetLecId (parseInt may return NaN)
        const sanitized = (targetLecId && !isNaN(targetLecId)) ? parseInt(targetLecId) : null;
        const tabFilterVal = parseInt(document.getElementById('flashcardsLectureFilter')?.value) || null;
        chosenLecId = sanitized || currentStudyLectureId || tabFilterVal || (allLectures[0] ? allLectures[0].id : null);
        if (chosenLecId) {
            select.value = chosenLecId;
        }
    }

    setFlashcardCountChoice(25);
    if (chosenLecId) {
        checkExistingFlashcardsCount(chosenLecId);
    }

    document.getElementById('generateFlashcardsModal').style.display = 'flex';
}

async function confirmGenerateFlashcards() {
    const select = document.getElementById('genFlashcardsLectureSelect');
    const input = document.getElementById('genFlashcardsCountInput');
    if (!select || !select.value) {
        alert("يرجى اختيار المحاضرة أولاً");
        return;
    }

    const lecId = parseInt(select.value);
    const selectedMode = document.querySelector('input[name="genFlashcardModeRadio"]:checked')?.value || 'replace';

    // If user chose to simply view existing cards
    if (selectedMode === 'view_existing') {
        closeModal('generateFlashcardsModal');
        switchTab('flashcards');
        const filter = document.getElementById('flashcardsLectureFilter');
        if (filter) {
            filter.value = lecId;
            loadFlashcards();
        }
        return;
    }

    let count = parseInt(input.value) || 25;
    if (count < 5) count = 5;
    if (count > 75) count = 75;

    closeModal('generateFlashcardsModal');

    const lec = allLectures.find(l => l.id === lecId);
    const lecTitle = lec ? lec.title : `المحاضرة #${lecId}`;
    const taskId = `flashcards_gen_${lecId}_${Date.now()}`;

    const modeLabel = (selectedMode === 'replace') ? 'استبدال وتوليد بطاقات جديدة' : 'توليد بطاقات تكميلية';

    startBackgroundTask(
        taskId,
        `${modeLabel}: ${lecTitle}`,
        `يقوم الذكاء الاصطناعي بصياغة ${count} بطاقة حفظ نشط مباشرة دون تكرار...`
    );

    showToast({
        type: 'info',
        title: 'بدأ توليد البطاقات في الخلفية 🗂️',
        message: (selectedMode === 'replace') 
            ? `جاري استبدال البطاقات القديمة وتوليد ${count} بطاقة استذكار جديدة ونقية لمحاضرة "${lecTitle}".`
            : `جاري توليد ${count} بطاقة إضافية بدون تكرار لمحاضرة "${lecTitle}".`,
        duration: 4500
    });

    try {
        const res = await fetch(`/api/lecture/${lecId}/generate_exhaustive_flashcards`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ count: count, mode: selectedMode })
        });
        const data = await res.json();
        finishBackgroundTask(taskId);

        if (data.success) {
            if (currentStudyLectureId === lecId) {
                await loadModalFlashcards(lecId);
            }
            const flashcardsTab = document.getElementById('tab-flashcards');
            if (flashcardsTab && flashcardsTab.classList.contains('active')) {
                await loadFlashcards();
            }

            showToast({
                type: 'success',
                title: 'اكتمل توليد بطاقات الاستذكار! 🎉',
                message: `تم بنجاح حفظ ${data.cards_generated} بطاقة استذكار نشط لمحاضرة "${lecTitle}".`,
                actionText: 'استعراض البطاقات الآن',
                onAction: () => {
                    switchTab('flashcards');
                    const filter = document.getElementById('flashcardsLectureFilter');
                    if (filter) {
                        filter.value = lecId;
                        loadFlashcards();
                    }
                },
                duration: 9000
            });
            showToast({
                type: 'error',
                title: 'خطأ أثناء توليد البطاقات',
                message: data.error || 'تعذر توليد البطاقات',
                duration: 7000
            });
        }
    } catch (e) {
        finishBackgroundTask(taskId);
        showToast({
            type: 'error',
            title: 'خطأ في الاتصال',
            message: 'تعذر إكمال توليد البطاقات: ' + (e.message || String(e)),
            duration: 7000
        });
    }
}

// ----------------- CUSTOM FLASHCARD ADDITION -----------------
function openAddCustomFlashcardModal(targetLecId = null) {
    const select = document.getElementById('customFlashcardLectureSelect');
    if (select) {
        select.innerHTML = '';
        allLectures.forEach(l => {
            const opt = document.createElement('option');
            opt.value = l.id;
            opt.innerText = `[${l.subject}] #${l.lecture_number} ${l.title}`;
            select.appendChild(opt);
        });

        let chosenLecId = targetLecId;
        if (!chosenLecId && currentStudyLectureId) chosenLecId = currentStudyLectureId;
        if (!chosenLecId) {
            const tabFilter = document.getElementById('flashcardsLectureFilter');
            if (tabFilter && tabFilter.value) chosenLecId = parseInt(tabFilter.value);
        }
        if (chosenLecId) {
            select.value = chosenLecId;
        }
    }

    const frontInput = document.getElementById('customFlashcardFront');
    const backInput = document.getElementById('customFlashcardBack');
    const subdeckInput = document.getElementById('customFlashcardSubdeck');

    if (frontInput) frontInput.value = '';
    if (backInput) backInput.value = '';
    if (subdeckInput) subdeckInput.value = '';

    document.getElementById('addCustomFlashcardModal').style.display = 'flex';
    if (frontInput) setTimeout(() => frontInput.focus(), 100);
}

async function confirmAddCustomFlashcard() {
    const front = document.getElementById('customFlashcardFront').value.trim();
    const back = document.getElementById('customFlashcardBack').value.trim();
    const subdeck = document.getElementById('customFlashcardSubdeck').value.trim();
    const select = document.getElementById('customFlashcardLectureSelect');
    const lecId = select && select.value ? parseInt(select.value) : null;

    if (!front || !back) {
        alert("يرجى كتابة السؤال والإجابة لحفظ البطاقة.");
        return;
    }

    closeModal('addCustomFlashcardModal');
    showLoading("جاري حفظ البطاقة في نظام التكرار المتباعد...");

    try {
        const res = await fetch('/api/flashcards/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                front: front,
                back: back,
                subdeck: subdeck,
                lecture_id: lecId,
                block_id: currentBlockId
            })
        });
        const data = await res.json();
        hideLoading();

        if (data.success) {
            showToast({
                type: 'success',
                title: 'تمت إضافة البطاقة بنجاح! 🗂️',
                message: 'تم إدراج بطاقتك المخصصة وجدولتها بنجاح.',
                duration: 4000
            });

            if (currentStudyLectureId && currentStudyLectureId === lecId) {
                await loadModalFlashcards(lecId);
            }
            const filterVal = document.getElementById('flashcardsLectureFilter').value;
            if (!filterVal || parseInt(filterVal) === lecId) {
                await loadFlashcards();
            }
        } else {
            alert("خطأ: " + (data.error || "تعذر إضافة البطاقة"));
        }
    } catch (e) {
        hideLoading();
        alert("خطأ أثناء حفظ البطاقة: " + e);
    }
}

// Backward compatibility alias
function triggerFlashcardGenForCurrentStudyModal() {
    openFlashcardGenModal(currentStudyLectureId);
}

// ----------------- EXPORT FLASHCARDS (ANKI APKG & JSON) -----------------
function exportFlashcards(format, specificLecId = null) {
    let lecId = specificLecId;
    if (!lecId) {
        const filterElem = document.getElementById('flashcardsLectureFilter');
        if (filterElem && filterElem.value) {
            lecId = filterElem.value;
        }
    }

    let url = `/api/flashcards/export/${format}?block_id=${currentBlockId}`;
    if (lecId && lecId !== 'all') {
        url += `&lecture_id=${lecId}`;
    }

    if (typeof showToast === 'function') {
        const label = format === 'apkg' ? 'حزمة Anki (.apkg)' : 'ملف JSON (.json)';
        showToast({
            type: 'info',
            title: 'تصدير البطاقات',
            message: `جاري تجهيز وتحميل ${label}...`
        });
    }

    const a = document.createElement('a');
    a.href = url;
    a.download = '';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

let flashcardsTreeData = [];
let selectedFlashcardSubject = 'all';
let selectedFlashcardLectureId = null;
let currentFlashcardViewMode = 'arena'; // 'arena' or 'list'

const subjectIconsMap = {
    'Anatomy': 'fa-solid fa-bone text-amber-400',
    'Anatomy & Embryology': 'fa-solid fa-bone text-amber-400',
    'Histology': 'fa-solid fa-microscope text-purple-400',
    'Physiology': 'fa-solid fa-brain text-sky-400',
    'Biochemistry': 'fa-solid fa-flask-vial text-emerald-400',
    'Pathology': 'fa-solid fa-virus text-red-400',
    'Pharmacology': 'fa-solid fa-capsules text-pink-400',
    'Microbiology': 'fa-solid fa-bacterium text-teal-400',
    'Parasitology': 'fa-solid fa-bug text-orange-400'
};

async function loadFlashcardsHierarchy() {
    try {
        const res = await fetch(`/api/flashcards/tree?block_id=${currentBlockId}`);
        const data = await res.json();
        flashcardsTreeData = data.subjects || [];

        // Render Subject Pills
        const pillsContainer = document.getElementById('flashcardsSubjectPills');
        if (pillsContainer) {
            let totalAllCards = flashcardsTreeData.reduce((acc, s) => acc + (s.total_cards || 0), 0);
            let html = `<button class="chip ${selectedFlashcardSubject === 'all' ? 'active' : ''}" onclick="selectSubjectFilter('all')"><i class="fa-solid fa-globe text-primary"></i> 🌟 جميع المواد (${totalAllCards})</button>`;

            flashcardsTreeData.forEach(s => {
                const icon = subjectIconsMap[s.name] || 'fa-solid fa-book-medical text-primary';
                const isActive = selectedFlashcardSubject === s.name;
                html += `<button class="chip ${isActive ? 'active' : ''}" onclick="selectSubjectFilter('${s.name}')"><i class="${icon}"></i> ${s.name} <span class="badge-count" style="margin-right:4px; opacity:0.85;">(${s.total_cards})</span></button>`;
            });
            pillsContainer.innerHTML = html;
        }

        // Render Dropdown <optgroup>
        const filterSel = document.getElementById('flashcardsLectureFilter');
        if (filterSel) {
            const currentVal = filterSel.value;
            let opts = '<option value="">جميع المحاضرات والمواد</option>';
            flashcardsTreeData.forEach(s => {
                opts += `<optgroup label="${s.name} (${s.total_cards} بطاقة)">`;
                s.lectures.forEach(l => {
                    const sel = (currentVal && currentVal == l.id) ? 'selected' : '';
                    opts += `<option value="${l.id}" ${sel}>#${l.lecture_number || ''} ${l.title} (${l.total_cards})</option>`;
                });
                opts += `</optgroup>`;
            });
            filterSel.innerHTML = opts;
        }

        renderLecturePillsForActiveSubject();
    } catch (e) {
        console.error("Error loading flashcards hierarchy:", e);
    }
}

function renderLecturePillsForActiveSubject() {
    const container = document.getElementById('flashcardsLecturePillsContainer');
    const pills = document.getElementById('flashcardsLecturePills');
    const breadcrumb = document.getElementById('activeHierarchyBreadcrumb');
    if (!container || !pills) return;

    if (selectedFlashcardSubject === 'all') {
        container.style.display = 'none';
        if (breadcrumb) breadcrumb.innerHTML = '';
        return;
    }

    const subjObj = flashcardsTreeData.find(s => s.name === selectedFlashcardSubject);
    if (!subjObj || !subjObj.lectures || subjObj.lectures.length === 0) {
        container.style.display = 'none';
        if (breadcrumb) breadcrumb.innerHTML = `➔ ${selectedFlashcardSubject}`;
        return;
    }

    container.style.display = 'block';
    if (breadcrumb) {
        const activeLec = subjObj.lectures.find(l => l.id == selectedFlashcardLectureId);
        breadcrumb.innerHTML = `➔ <strong>${selectedFlashcardSubject}</strong>` + (activeLec ? ` ➔ <span>${activeLec.title}</span>` : ' (كل المحاضرات)');
    }

    let html = `<button class="chip ${!selectedFlashcardLectureId ? 'active' : ''}" onclick="selectLecturePill(null)"><i class="fa-solid fa-layer-group text-accent"></i> كل محاضرات ${subjObj.name} (${subjObj.total_cards})</button>`;

    subjObj.lectures.forEach(l => {
        const isActive = selectedFlashcardLectureId == l.id;
        html += `<button class="chip ${isActive ? 'active' : ''}" onclick="selectLecturePill(${l.id})"><i class="fa-regular fa-file-lines"></i> #${l.lecture_number || ''} ${l.title} <span class="badge-count" style="margin-right:4px; opacity:0.85;">(${l.total_cards})</span></button>`;
    });

    pills.innerHTML = html;
}

function selectSubjectFilter(subjName) {
    selectedFlashcardSubject = subjName;
    selectedFlashcardLectureId = null;

    const filterSel = document.getElementById('flashcardsLectureFilter');
    if (filterSel) filterSel.value = "";

    loadFlashcardsHierarchy();
    loadFlashcards();
}

function selectLecturePill(lecId) {
    selectedFlashcardLectureId = lecId;
    const filterSel = document.getElementById('flashcardsLectureFilter');
    if (filterSel) {
        filterSel.value = lecId || "";
    }
    renderLecturePillsForActiveSubject();
    loadFlashcards();
}

function onFlashcardsLectureFilterChange() {
    const filterSel = document.getElementById('flashcardsLectureFilter');
    const val = filterSel ? filterSel.value : "";
    selectedFlashcardLectureId = val ? parseInt(val) : null;

    if (val && flashcardsTreeData.length > 0) {
        for (const s of flashcardsTreeData) {
            const found = s.lectures.find(l => l.id == val);
            if (found) {
                selectedFlashcardSubject = s.name;
                break;
            }
        }
    } else {
        selectedFlashcardSubject = 'all';
    }

    loadFlashcardsHierarchy();
    loadFlashcards();
}

async function loadFlashcards() {
    if (flashcardsTreeData.length === 0) {
        loadFlashcardsHierarchy();
    }
    const onlyDue = document.getElementById('onlyDueCheckbox')?.checked;
    const onlyMistakes = document.getElementById('onlyMistakesFlashcardsCheckbox')?.checked;

    const resetBtn = document.getElementById('btnResetFlashcardsLec');
    if (resetBtn) {
        resetBtn.style.display = selectedFlashcardLectureId ? 'inline-flex' : 'none';
    }

    let url = `/api/flashcards?block_id=${currentBlockId}`;
    if (selectedFlashcardLectureId) {
        url += `&lecture_id=${selectedFlashcardLectureId}`;
    } else if (selectedFlashcardSubject && selectedFlashcardSubject !== 'all') {
        url += `&subject=${encodeURIComponent(selectedFlashcardSubject)}`;
    }

    if (onlyDue) url += `&only_due=true`;
    if (onlyMistakes) url += `&only_mistakes=true`;

    try {
        const res = await fetch(url);
        const data = await res.json();
        flashcardsList = data.flashcards || [];
        currentCardIndex = 0;

        const countEl = document.getElementById('totalCardsInDeck');
        if (countEl) countEl.innerText = flashcardsList.length;

        if (currentFlashcardViewMode === 'arena') {
            renderActiveFlashcard();
        } else {
            renderFlashcardsListView();
        }
    } catch (e) {
        console.error(e);
    }
}

function applyCardTextWithDirection(element, text) {
    if (!element) return;
    const str = String(text || '');
    element.innerText = str;
    const hasArabic = /[\u0600-\u06FF]/.test(str);
    const dir = hasArabic ? 'rtl' : 'ltr';
    element.setAttribute('dir', dir);
    element.style.direction = dir;
    element.style.textAlign = 'center';
}

function renderActiveFlashcard() {
    const inner = document.getElementById('flashcardInner');
    if (inner) inner.classList.remove('flipped');
    const srsActions = document.getElementById('srsActions');
    if (srsActions) srsActions.style.display = 'none';

    const currentCardIndexEl = document.getElementById('currentCardIndex');
    const badgeEl = document.getElementById('currentCardLectureBadge');

    if (flashcardsList.length === 0) {
        applyCardTextWithDirection(document.getElementById('cardFrontText'), "لا توجد بطاقات مطابقة للتصفية الحالية 🎉");
        applyCardTextWithDirection(document.getElementById('cardBackText'), "اختر مادة أو محاضرة أخرى، أو ألغِ تفعيل خيار (المستحقة اليوم فقط).");
        if (currentCardIndexEl) currentCardIndexEl.innerText = 0;
        if (badgeEl) badgeEl.innerText = "فارغ";
        return;
    }

    const card = flashcardsList[currentCardIndex];
    if (currentCardIndexEl) currentCardIndexEl.innerText = currentCardIndex + 1;

    if (badgeEl) {
        const subj = card.lecture_subject || 'عام';
        const lecTitle = card.lecture_title || (card.lecture_number ? `#${card.lecture_number}` : 'بطاقة عامة');
        badgeEl.innerHTML = `<i class="fa-solid fa-folder-tree text-accent"></i> <strong>${subj}</strong> ➔ <span>${lecTitle}</span>`;
    }

    const subdeckEl = document.getElementById('cardSubdeck');
    if (subdeckEl) subdeckEl.innerText = card.subdeck || '';
    applyCardTextWithDirection(document.getElementById('cardFrontText'), card.front);
    applyCardTextWithDirection(document.getElementById('cardBackText'), card.back);
}

function flipCurrentCard() {
    const inner = document.getElementById('flashcardInner');
    if (!inner) return;
    inner.classList.toggle('flipped');
    const srsActions = document.getElementById('srsActions');
    if (inner.classList.contains('flipped') && flashcardsList.length > 0) {
        if (srsActions) srsActions.style.display = 'grid';
    } else {
        if (srsActions) srsActions.style.display = 'none';
    }
}

async function rateFlashcard(quality) {
    if (flashcardsList.length === 0) return;
    const card = flashcardsList[currentCardIndex];

    try {
        await fetch(`/api/flashcard/${card.id}/review`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quality: quality })
        });

        currentCardIndex++;
        if (currentCardIndex >= flashcardsList.length) {
            currentCardIndex = 0;
        }
        renderActiveFlashcard();
    } catch (e) {
        console.error(e);
    }
}

function prevFlashcard() {
    if (flashcardsList.length === 0) return;
    if (currentCardIndex > 0) {
        currentCardIndex--;
    } else {
        currentCardIndex = flashcardsList.length - 1;
    }
    renderActiveFlashcard();
}

function nextFlashcard() {
    if (flashcardsList.length === 0) return;
    if (currentCardIndex < flashcardsList.length - 1) {
        currentCardIndex++;
    } else {
        currentCardIndex = 0;
    }
    renderActiveFlashcard();
}

function switchFlashcardViewMode(mode) {
    currentFlashcardViewMode = mode;
    const btnArena = document.getElementById('btnModeArena');
    const btnList = document.getElementById('btnModeList');
    const arenaEl = document.getElementById('flashcardArena');
    const listEl = document.getElementById('flashcardsListArena');

    if (mode === 'arena') {
        if (btnArena) btnArena.className = 'btn btn-xs btn-primary';
        if (btnList) btnList.className = 'btn btn-xs btn-outline';
        if (arenaEl) arenaEl.style.display = 'block';
        if (listEl) listEl.style.display = 'none';
        renderActiveFlashcard();
    } else {
        if (btnList) btnList.className = 'btn btn-xs btn-primary';
        if (btnArena) btnArena.className = 'btn btn-xs btn-outline';
        if (arenaEl) arenaEl.style.display = 'none';
        if (listEl) listEl.style.display = 'block';
        renderFlashcardsListView();
    }
}

function renderFlashcardsListView(filteredCards = null) {
    const container = document.getElementById('flashcardsListItems');
    const badge = document.getElementById('flashcardsListCountBadge');
    if (!container) return;

    const cards = filteredCards || flashcardsList;
    if (badge) badge.innerText = `${cards.length} بطاقة`;

    if (cards.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 30px; color: var(--text-muted);">
                <i class="fa-solid fa-box-open fa-2x mb-2" style="opacity: 0.5;"></i>
                <p>لا توجد بطاقات مطابقة للبحث أو التصفية الحالية.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = cards.map(c => {
        const frontDir = /[\u0600-\u06FF]/.test(c.front || '') ? 'rtl' : 'ltr';
        const backDir = /[\u0600-\u06FF]/.test(c.back || '') ? 'rtl' : 'ltr';
        const subj = c.lecture_subject || 'عام';
        const lec = c.lecture_title || 'مخصصة';
        return `
        <div class="cal-task-card" id="listCard_${c.id}" style="display:flex; flex-direction:column; justify-content:space-between; background:rgba(0,0,0,0.25); border:1px solid rgba(255,255,255,0.07); padding:14px; border-radius:12px; transition:all 0.2s;">
            <div>
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px; gap:8px;">
                    <span class="badge" style="font-size:10.5px; background:rgba(14,165,233,0.15); color:#38bdf8; border:1px solid rgba(14,165,233,0.3); padding:2px 8px; border-radius:5px;">
                        ${subj} ➔ ${lec}
                    </span>
                    <div style="display:flex; gap:6px;">
                        <button class="btn btn-xs btn-outline" onclick="openEditFlashcardModal(${c.id})" title="تعديل البطاقة" style="border-color:rgba(245, 158, 11, 0.4); color:#fbbf24; padding:3px 8px;">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button class="btn btn-xs btn-outline-danger" onclick="confirmDeleteFlashcard(${c.id})" title="حذف البطاقة" style="padding:3px 8px;">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </div>
                <div style="font-weight:700; font-size:13.5px; margin-bottom:6px; color:var(--text-main);" dir="${frontDir}">${c.front}</div>
                <div style="font-size:12.5px; color:var(--text-muted); border-top:1px solid rgba(255,255,255,0.06); padding-top:6px; line-height:1.5;" dir="${backDir}">${c.back}</div>
            </div>
            <div style="margin-top:10px; font-size:11px; color:var(--primary-light); opacity:0.8;">
                🏷️ ${c.subdeck || 'بطاقة استذكار'}
            </div>
        </div>
        `;
    }).join('');
}

function filterFlashcardsListView() {
    const q = document.getElementById('flashcardsSearchInput')?.value.toLowerCase().trim() || '';
    if (!q) {
        renderFlashcardsListView(flashcardsList);
        return;
    }
    const filtered = flashcardsList.filter(c => 
        (c.front && c.front.toLowerCase().includes(q)) ||
        (c.back && c.back.toLowerCase().includes(q)) ||
        (c.subdeck && c.subdeck.toLowerCase().includes(q)) ||
        (c.lecture_title && c.lecture_title.toLowerCase().includes(q))
    );
    renderFlashcardsListView(filtered);
}

// ----------------- EDIT & DELETE FLASHCARD HANDLERS -----------------
function editActiveCard() {
    if (flashcardsList.length === 0) return;
    const card = flashcardsList[currentCardIndex];
    if (card) openEditFlashcardModal(card);
}

function deleteActiveCard() {
    if (flashcardsList.length === 0) return;
    const card = flashcardsList[currentCardIndex];
    if (card) confirmDeleteFlashcard(card.id);
}

async function openEditFlashcardModal(cardOrId) {
    let card = null;
    if (typeof cardOrId === 'object' && cardOrId !== null) {
        card = cardOrId;
    } else {
        card = flashcardsList.find(c => c.id == cardOrId);
        if (!card) {
            try {
                const res = await fetch(`/api/flashcards?block_id=${currentBlockId}`);
                const data = await res.json();
                card = (data.flashcards || []).find(c => c.id == cardOrId);
            } catch (e) {}
        }
    }

    if (!card) {
        alert("لم يتم العثور على بيانات البطاقة!");
        return;
    }

    document.getElementById('editFlashcardId').value = card.id;
    document.getElementById('editFlashcardFront').value = card.front || '';
    document.getElementById('editFlashcardBack').value = card.back || '';
    document.getElementById('editFlashcardSubdeck').value = card.subdeck || '';

    // Populate lectures dropdown
    const select = document.getElementById('editFlashcardLectureSelect');
    if (select) {
        select.innerHTML = '<option value="">(بطاقة عامة بدون ربط بمحاضرة)</option>';
        allLectures.forEach(l => {
            const opt = document.createElement('option');
            opt.value = l.id;
            opt.innerText = `[${l.subject || 'عام'}] #${l.lecture_number || ''} ${l.title}`;
            if (l.id == card.lecture_id) opt.selected = true;
            select.appendChild(opt);
        });
    }

    document.getElementById('editFlashcardModal').style.display = 'flex';
}

async function confirmSaveEditedFlashcard() {
    const cardId = document.getElementById('editFlashcardId').value;
    const front = document.getElementById('editFlashcardFront').value.trim();
    const back = document.getElementById('editFlashcardBack').value.trim();
    const subdeck = document.getElementById('editFlashcardSubdeck').value.trim();
    const lecSelect = document.getElementById('editFlashcardLectureSelect');
    const lecture_id = lecSelect ? (parseInt(lecSelect.value) || null) : null;

    if (!front || !back) {
        alert("يرجى كتابة السؤال والإجابة قبل الحفظ.");
        return;
    }

    try {
        const res = await fetch(`/api/flashcard/${cardId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ front, back, subdeck, lecture_id })
        });
        const data = await res.json();

        if (!data.success) {
            alert(data.error || "حدث خطأ أثناء تعديل البطاقة.");
            return;
        }

        closeModal('editFlashcardModal');

        // Update local list
        const idx = flashcardsList.findIndex(c => c.id == cardId);
        if (idx !== -1) {
            flashcardsList[idx] = { ...flashcardsList[idx], ...data.flashcard };
        }

        if (currentFlashcardViewMode === 'arena') {
            renderActiveFlashcard();
        } else {
            renderFlashcardsListView();
        }

        // If inside study center modal
        if (typeof currentStudyLectureId !== 'undefined' && currentStudyLectureId) {
            loadModalFlashcards(currentStudyLectureId);
        }

        if (typeof showToastNotification === 'function') {
            showToastNotification({
                type: 'success',
                title: 'تم التعديل',
                message: 'تم حفظ تعديلات البطاقة بنجاح ✅'
            });
        }
    } catch (e) {
        console.error(e);
        alert("حدث خطأ أثناء حفظ التعديلات.");
    }
}

async function confirmDeleteFlashcard(cardId, modalLecId = null) {
    if (!confirm("هل أنت متأكد من حذف هذه البطاقة نهائياً؟")) return;

    try {
        const res = await fetch(`/api/flashcard/${cardId}`, {
            method: 'DELETE'
        });
        const data = await res.json();

        if (!data.success) {
            alert(data.error || "تعذر حذف البطاقة.");
            return;
        }

        // Remove from local list
        const idx = flashcardsList.findIndex(c => c.id == cardId);
        if (idx !== -1) {
            flashcardsList.splice(idx, 1);
            if (currentCardIndex >= flashcardsList.length) {
                currentCardIndex = Math.max(0, flashcardsList.length - 1);
            }
        }

        const totalEl = document.getElementById('totalCardsInDeck');
        if (totalEl) totalEl.innerText = flashcardsList.length;

        if (currentFlashcardViewMode === 'arena') {
            renderActiveFlashcard();
        } else {
            renderFlashcardsListView();
        }

        // If called from Lecture study modal
        if (modalLecId) {
            const el = document.getElementById(`modalCard_${cardId}`);
            if (el) el.remove();
        }

        // Refresh counts
        loadFlashcardsHierarchy();

        if (typeof showToastNotification === 'function') {
            showToastNotification({
                type: 'info',
                title: 'تم الحذف',
                message: 'تم حذف البطاقة نهائياً 🗑️'
            });
        }
    } catch (e) {
        console.error(e);
        alert("حدث خطأ أثناء حذف البطاقة.");
    }
}


// Global Keyboard Navigation for Flashcards
window.addEventListener('keydown', (e) => {
    if (currentTab === 'flashcards' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
        if (e.code === 'Space') {
            e.preventDefault();
            flipCurrentCard();
        } else if (e.code === 'ArrowLeft') {
            e.preventDefault();
            if (currentAppLanguage === 'ar') prevFlashcard(); else nextFlashcard();
        } else if (e.code === 'ArrowRight') {
            e.preventDefault();
            if (currentAppLanguage === 'ar') nextFlashcard(); else prevFlashcard();
        } else if (['Digit1', 'Digit2', 'Digit3', 'Digit4'].includes(e.code)) {
            const quality = parseInt(e.code.replace('Digit', ''));
            rateFlashcard(quality);
        }
    }
});

function triggerFlashcardGenModal() {
    openFlashcardGenModal();
}

// ----------------- ADD LECTURE HANDLERS (PDF / PPTX / ZIP / FOLDER) -----------------
let currentAddLectureTab = 'single';
let selectedLecturePdfFile = null;
let selectedLectureZipFile = null;
let selectedLectureFolderFiles = [];

function switchAddLectureTab(tabName) {
    currentAddLectureTab = tabName;

    const btnSingle = document.getElementById('tabBtnLecSingle');
    const btnZip = document.getElementById('tabBtnLecZip');
    const btnFolder = document.getElementById('tabBtnLecFolder');

    if (btnSingle) {
        btnSingle.className = tabName === 'single' ? 'btn btn-sm btn-primary add-lec-tab-btn' : 'btn btn-sm btn-outline add-lec-tab-btn';
    }
    if (btnZip) {
        btnZip.className = tabName === 'zip' ? 'btn btn-sm btn-primary add-lec-tab-btn' : 'btn btn-sm btn-outline add-lec-tab-btn';
    }
    if (btnFolder) {
        btnFolder.className = tabName === 'folder' ? 'btn btn-sm btn-primary add-lec-tab-btn' : 'btn btn-sm btn-outline add-lec-tab-btn';
    }

    const contentSingle = document.getElementById('addLecTabContentSingle');
    const contentZip = document.getElementById('addLecTabContentZip');
    const contentFolder = document.getElementById('addLecTabContentFolder');

    if (contentSingle) contentSingle.style.display = tabName === 'single' ? 'block' : 'none';
    if (contentZip) contentZip.style.display = tabName === 'zip' ? 'block' : 'none';
    if (contentFolder) contentFolder.style.display = tabName === 'folder' ? 'block' : 'none';
}

function setupPdfDropzoneEvents() {
    const dropzone = document.getElementById('pdfUploadDropzone');
    if (!dropzone || dropzone.dataset.eventsBound) return;
    dropzone.dataset.eventsBound = "true";

    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove('dragover');
    });

    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove('dragover');
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const f = e.dataTransfer.files[0];
            const nameLower = f.name.toLowerCase();
            if (nameLower.endsWith('.zip')) {
                switchAddLectureTab('zip');
                processSelectedLectureZip(f);
            } else {
                processSelectedLecturePdf(f);
            }
        }
    });
}

function triggerLecturePdfSelect() {
    const fin = document.getElementById('lecturePdfFileInput');
    if (fin) fin.click();
}

function handleLecturePdfSelected(e) {
    if (e.target && e.target.files && e.target.files.length > 0) {
        const f = e.target.files[0];
        const nameLower = f.name.toLowerCase();
        if (nameLower.endsWith('.zip')) {
            switchAddLectureTab('zip');
            processSelectedLectureZip(f);
        } else {
            processSelectedLecturePdf(f);
        }
    }
}

function clearSelectedLecturePdf(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    selectedLecturePdfFile = null;
    const fin = document.getElementById('lecturePdfFileInput');
    if (fin) fin.value = '';

    const dropzone = document.getElementById('pdfUploadDropzone');
    if (dropzone) dropzone.classList.remove('has-file');

    const defState = document.getElementById('dropzoneDefaultState');
    if (defState) defState.style.display = 'block';

    const selState = document.getElementById('dropzoneSelectedState');
    if (selState) selState.style.display = 'none';

    const titleInput = document.getElementById('newLectureTitle');
    if (titleInput) titleInput.value = '';

    const pagesInput = document.getElementById('newLecturePages');
    if (pagesInput) pagesInput.value = '';

    const numInput = document.getElementById('newLectureNumber');
    if (numInput) numInput.value = '';
}

function detectMedicalSubjectFromFilename(filename, lecNum) {
    const lower = filename.toLowerCase();
    if ((lecNum >= 1 && lecNum <= 19) || lower.includes("scalp") || lower.includes("neck") || lower.includes("orbit") || lower.includes("meninges") || lower.includes("spinal cord") || lower.includes("brainstem") || lower.includes("cerebrum") || lower.includes("cerebellum") || lower.includes("tract")) {
        return "Anatomy & Embryology";
    }
    if ((lecNum >= 20 && lecNum <= 24) || lower.includes("nervous tissue") || lower.includes("cortex") || lower.includes("histology")) {
        return "Histology";
    }
    if ((lecNum >= 25 && lecNum <= 46) || lower.includes("synapse") || lower.includes("somatosensory") || lower.includes("pain") || lower.includes("reflex") || lower.includes("vestibular") || lower.includes("basal ganglia") || lower.includes("thalamus") || lower.includes("sleep") || lower.includes("hearing")) {
        return "Physiology";
    }
    if ((lecNum >= 47 && lecNum <= 48) || lower.includes("metabolism") || lower.includes("neurotransmitter") || lower.includes("biochem")) {
        return "Biochemistry";
    }
    if ((lecNum >= 49 && lecNum <= 50) || lower.includes("tumor") || lower.includes("pathol") || lower.includes("infarct")) {
        return "Pathology";
    }
    if ((lecNum >= 51 && lecNum <= 55) || lower.includes("meningitis") || lower.includes("encephalitis") || lower.includes("tetanus") || lower.includes("micro") || lower.includes("bacter") || lower.includes("virus")) {
        return "Microbiology";
    }
    if ((lecNum >= 56 && lecNum <= 58) || lower.includes("parasit") || lower.includes("helminth") || lower.includes("protozoa")) {
        return "Parasitology";
    }
    if ((lecNum >= 59 && lecNum <= 65) || lower.includes("drug") || lower.includes("pharm") || lower.includes("depress") || lower.includes("sedative") || lower.includes("epilepsy") || lower.includes("anaesthetic")) {
        return "Pharmacology";
    }
    if (lower.includes("anat") || lower.includes("embryo")) return "Anatomy & Embryology";
    if (lower.includes("histo")) return "Histology";
    if (lower.includes("physio")) return "Physiology";
    if (lower.includes("biochem")) return "Biochemistry";
    if (lower.includes("patho")) return "Pathology";
    if (lower.includes("micro")) return "Microbiology";
    if (lower.includes("para")) return "Parasitology";
    if (lower.includes("pharm")) return "Pharmacology";
    return "General Medicine";
}

function processSelectedLecturePdf(file) {
    if (!file) return;
    const lowerName = file.name.toLowerCase();
    const isPdf = lowerName.endsWith('.pdf');
    const isPptx = lowerName.endsWith('.pptx') || lowerName.endsWith('.ppt');

    if (!isPdf && !isPptx) {
        alert("يرجى اختيار ملف بصيغة PDF (.pdf) أو PowerPoint (.pptx / .ppt)");
        return;
    }

    selectedLecturePdfFile = file;

    // Update Dropzone visual state
    const dropzone = document.getElementById('pdfUploadDropzone');
    if (dropzone) dropzone.classList.add('has-file');

    const defState = document.getElementById('dropzoneDefaultState');
    if (defState) defState.style.display = 'none';

    const selState = document.getElementById('dropzoneSelectedState');
    if (selState) selState.style.display = 'block';

    // File icon & badge
    const iconEl = document.getElementById('selectedLecFileIcon');
    const badgeEl = document.getElementById('selectedPdfBadge');
    if (isPptx) {
        if (iconEl) {
            iconEl.className = 'fa-solid fa-file-powerpoint fa-3x';
            iconEl.style.color = '#f97316';
        }
        if (badgeEl) {
            badgeEl.innerText = 'PowerPoint';
            badgeEl.style.background = 'rgba(249, 115, 22, 0.15)';
            badgeEl.style.color = '#fb923c';
        }
    } else {
        if (iconEl) {
            iconEl.className = 'fa-solid fa-file-pdf fa-3x';
            iconEl.style.color = '#ef4444';
        }
        if (badgeEl) {
            badgeEl.innerText = 'PDF';
            badgeEl.style.background = 'rgba(239, 68, 68, 0.15)';
            badgeEl.style.color = '#f87171';
        }
    }

    const nameEl = document.getElementById('selectedPdfName');
    if (nameEl) nameEl.innerText = file.name;

    const sizeEl = document.getElementById('selectedPdfSize');
    const sizeKB = Math.round(file.size / 1024);
    const sizeText = sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB} KB`;
    if (sizeEl) sizeEl.innerText = sizeText;

    // Auto-extract Title, Lecture Number, and Subject
    const rawName = file.name.replace(/\.(pdf|pptx|ppt)$/i, '').trim();
    let detectedNumber = null;
    const numMatch = rawName.match(/^(\d+)/) || rawName.match(/Lecture\s*\(?(\d+)\)?/i);
    if (numMatch) {
        detectedNumber = parseInt(numMatch[1]);
    }

    let cleanTitle = rawName
        .replace(/^\d+\s*[-_.]\s*/, '')
        .replace(/^\s*Lecture\s*\(?\d+\)?\s*[:-_.]?\s*/i, '')
        .replace(/^[_\s-]+|[_\s-]+$/g, '')
        .trim();

    if (!cleanTitle) cleanTitle = rawName;

    const detectedSubject = detectMedicalSubjectFromFilename(rawName, detectedNumber || 0);

    const titleInput = document.getElementById('newLectureTitle');
    if (titleInput) titleInput.value = cleanTitle;

    const numInput = document.getElementById('newLectureNumber');
    if (numInput) numInput.value = (detectedNumber !== null ? detectedNumber : (allLectures.length + 1));

    const subjSelect = document.getElementById('newLectureSubject');
    if (subjSelect) {
        for (let opt of subjSelect.options) {
            if (opt.value === detectedSubject) {
                subjSelect.value = detectedSubject;
                break;
            }
        }
    }

    const pagesInput = document.getElementById('newLecturePages');
    if (pagesInput) pagesInput.value = isPptx ? "يُحسب عدد الشرائح تلقائياً" : "يُحسب تلقائياً من الـ PDF";
}

// ----------------- ZIP ARCHIVE DROPZONE & IMPORT HANDLERS -----------------
function setupZipDropzoneEvents() {
    const dropzone = document.getElementById('zipUploadDropzone');
    if (!dropzone || dropzone.dataset.eventsBound) return;
    dropzone.dataset.eventsBound = "true";

    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove('dragover');
    });

    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove('dragover');
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processSelectedLectureZip(e.dataTransfer.files[0]);
        }
    });
}

function triggerLectureZipSelect() {
    const fin = document.getElementById('lectureZipFileInput');
    if (fin) fin.click();
}

function handleLectureZipSelected(e) {
    if (e.target && e.target.files && e.target.files.length > 0) {
        processSelectedLectureZip(e.target.files[0]);
    }
}

function processSelectedLectureZip(file) {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.zip')) {
        alert("يرجى اختيار ملف أرشيف بصيغة ZIP (.zip)");
        return;
    }

    selectedLectureZipFile = file;

    const dropzone = document.getElementById('zipUploadDropzone');
    if (dropzone) dropzone.classList.add('has-file');

    const defState = document.getElementById('zipDropzoneDefaultState');
    if (defState) defState.style.display = 'none';

    const selState = document.getElementById('zipDropzoneSelectedState');
    if (selState) selState.style.display = 'block';

    const nameEl = document.getElementById('selectedZipName');
    if (nameEl) nameEl.innerText = file.name;

    const sizeEl = document.getElementById('selectedZipSize');
    const sizeKB = Math.round(file.size / 1024);
    const sizeText = sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB} KB`;
    if (sizeEl) sizeEl.innerText = sizeText;
}

function clearSelectedLectureZip(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    selectedLectureZipFile = null;
    const fin = document.getElementById('lectureZipFileInput');
    if (fin) fin.value = '';

    const dropzone = document.getElementById('zipUploadDropzone');
    if (dropzone) dropzone.classList.remove('has-file');

    const defState = document.getElementById('zipDropzoneDefaultState');
    if (defState) defState.style.display = 'block';

    const selState = document.getElementById('zipDropzoneSelectedState');
    if (selState) selState.style.display = 'none';
}

async function confirmImportZipLecture() {
    if (!selectedLectureZipFile) {
        alert("يرجى اختيار أو سحب ملف الـ ZIP أولاً لفك ضغطه واستيراد محاضراته.");
        return;
    }

    const rebalance = document.getElementById('zipLectureRebalance') ? document.getElementById('zipLectureRebalance').checked : true;

    closeModal('addLectureModal');
    showLoading("جاري رفع وفك ضغط الأرشيف واستخراج المحاضرات والسلايدات والنصوص وتحديث الجدول الدراسي...");

    const formData = new FormData();
    formData.append('zip_file', selectedLectureZipFile);
    formData.append('block_id', currentBlockId);
    formData.append('rebalance_schedule', rebalance);

    try {
        const res = await fetch('/api/lectures/import_zip', {
            method: 'POST',
            body: formData
        });
        const data = await res.json();
        hideLoading();

        if (data.success) {
            clearSelectedLectureZip();
            await loadLectures();
            await loadCalendar();
            await loadDashboardStats();
            await loadTodos();
            if (typeof loadBookWorkspaces === 'function') await loadBookWorkspaces();
            showToast({
                type: 'success',
                title: 'تم استيراد المحاضرات بنجاح! 📦',
                message: `تم استخراج واستيراد ${data.imported_count} محاضرة من ملف الـ ZIP وتحديث الجدول الدراسي.`,
                actionText: 'عرض المحاضرات',
                onAction: () => switchTab('lectures'),
                duration: 9000
            });
        } else {
            showToast({
                type: 'error',
                title: 'تعذر استيراد أرشيف ZIP',
                message: data.error || 'حدث خطأ أثناء استيراد الأرشيف.',
                duration: 7000
            });
        }
    } catch (e) {
        hideLoading();
        showToast({
            type: 'error',
            title: 'خطأ أثناء استيراد أرشيف ZIP',
            message: String(e),
            duration: 7000
        });
    }
}

// ----------------- FOLDER IMPORT HANDLERS (PICKER & LOCAL PATH) -----------------
function triggerLectureFolderSelect() {
    const fin = document.getElementById('lectureFolderPickerInput');
    if (fin) fin.click();
}

function handleLectureFolderPicked(e) {
    const files = e.target && e.target.files ? Array.from(e.target.files) : [];
    if (!files.length) return;

    const validFiles = files.filter(f => {
        const ext = f.name.toLowerCase();
        return ext.endsWith('.pdf') || ext.endsWith('.pptx') || ext.endsWith('.ppt');
    });

    if (!validFiles.length) {
        alert("لم يتم العثور على أي ملفات PDF أو PowerPoint (.pdf, .pptx, .ppt) داخل المجلد المختار.");
        return;
    }

    selectedLectureFolderFiles = validFiles;

    const defState = document.getElementById('folderPickerDefaultState');
    if (defState) defState.style.display = 'none';

    const selState = document.getElementById('folderPickerSelectedState');
    if (selState) selState.style.display = 'block';

    const summaryEl = document.getElementById('selectedFolderSummary');
    if (summaryEl) summaryEl.innerText = `تم العثور على ${validFiles.length} ملف محاضرة جاهز للاستيراد`;

    const totalBytes = validFiles.reduce((acc, f) => acc + (f.size || 0), 0);
    const totalMB = (totalBytes / (1024 * 1024)).toFixed(1);
    const folderName = validFiles[0].webkitRelativePath ? validFiles[0].webkitRelativePath.split('/')[0] : 'المجلد المختار';

    const detailsEl = document.getElementById('selectedFolderDetails');
    if (detailsEl) detailsEl.innerText = `مجلد: "${folderName}" (${totalMB} MB إجمالي)`;
}

function clearSelectedFolderPicker(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    selectedLectureFolderFiles = [];
    const fin = document.getElementById('lectureFolderPickerInput');
    if (fin) fin.value = '';

    const defState = document.getElementById('folderPickerDefaultState');
    if (defState) defState.style.display = 'block';

    const selState = document.getElementById('folderPickerSelectedState');
    if (selState) selState.style.display = 'none';
}

async function confirmImportFolderLectures() {
    const pathInput = document.getElementById('localFolderPathInput');
    const localPath = pathInput ? pathInput.value.trim() : '';
    const rebalance = document.getElementById('folderLectureRebalance') ? document.getElementById('folderLectureRebalance').checked : true;

    // Case 1: Direct local path provided
    if (localPath) {
        closeModal('addLectureModal');
        showLoading(`جاري فحص المجلد المحلي "${localPath}" واستيراد المحاضرات وتحديث الجدول الدراسي...`);

        try {
            const res = await fetch('/api/lectures/import_folder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    folder_path: localPath,
                    block_id: currentBlockId,
                    rebalance_schedule: rebalance
                })
            });
            const data = await res.json();
            hideLoading();

            if (data.success) {
                if (pathInput) pathInput.value = '';
                clearSelectedFolderPicker();
                await loadLectures();
                await loadCalendar();
                await loadDashboardStats();
                await loadTodos();
                if (typeof loadBookWorkspaces === 'function') await loadBookWorkspaces();
                showToast({
                    type: 'success',
                    title: 'تم استيراد محاضرات المجلد بنجاح! 📂',
                    message: `تم فحص المجلد واستيراد ${data.imported_count} محاضرة وتحديث الجدول الدراسي.`,
                    actionText: 'عرض المحاضرات',
                    onAction: () => switchTab('lectures'),
                    duration: 9000
                });
            } else {
                showToast({
                    type: 'error',
                    title: 'تعذر استيراد المجلد',
                    message: data.error || 'تأكد من صحة مسار المجلد.',
                    duration: 7000
                });
            }
        } catch (e) {
            hideLoading();
            showToast({
                type: 'error',
                title: 'خطأ أثناء استيراد المجلد المحلي',
                message: String(e),
                duration: 7000
            });
        }
        return;
    }

    // Case 2: Selected files via folder picker
    if (selectedLectureFolderFiles.length > 0) {
        closeModal('addLectureModal');
        showLoading(`جاري رفع ومعالجة ${selectedLectureFolderFiles.length} محاضرة من المجلد وتحديث الجدول الدراسي...`);

        const formData = new FormData();
        for (let f of selectedLectureFolderFiles) {
            formData.append('files', f);
        }
        formData.append('block_id', currentBlockId);
        formData.append('rebalance_schedule', rebalance);

        try {
            const res = await fetch('/api/lectures/batch_upload', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            hideLoading();

            if (data.success) {
                clearSelectedFolderPicker();
                await loadLectures();
                await loadCalendar();
                await loadDashboardStats();
                await loadTodos();
                if (typeof loadBookWorkspaces === 'function') await loadBookWorkspaces();
                showToast({
                    type: 'success',
                    title: 'تم استيراد المحاضرات بنجاح! 📁',
                    message: `تم رفع ومعالجة ${data.imported_count} محاضرة من المجلد وتحديث الجدول الدراسي.`,
                    actionText: 'عرض المحاضرات',
                    onAction: () => switchTab('lectures'),
                    duration: 9000
                });
            } else {
                showToast({
                    type: 'error',
                    title: 'تعذر استيراد ملفات المجلد',
                    message: data.error || 'حدث خطأ أثناء الرفع.',
                    duration: 7000
                });
            }
        } catch (e) {
            hideLoading();
            showToast({
                type: 'error',
                title: 'خطأ أثناء رفع ملفات المجلد',
                message: String(e),
                duration: 7000
            });
        }
        return;
    }

    alert("يرجى اختيار مجلد عبر المتصفح أو إدخال مسار المجلد على جهازك أولاً.");
}

function openAddLectureModal() {
    switchAddLectureTab('single');
    clearSelectedLecturePdf();
    clearSelectedLectureZip();
    clearSelectedFolderPicker();
    setupPdfDropzoneEvents();
    setupZipDropzoneEvents();

    const titleInput = document.getElementById('newLectureTitle');
    const pagesInput = document.getElementById('newLecturePages');
    const numInput = document.getElementById('newLectureNumber');
    const notesInput = document.getElementById('newLectureNotes');
    const pathInput = document.getElementById('localFolderPathInput');

    if (titleInput) titleInput.value = '';
    if (pagesInput) pagesInput.value = '';
    if (numInput) numInput.value = (allLectures.length + 1);
    if (notesInput) notesInput.value = '';
    if (pathInput) pathInput.value = '';

    document.getElementById('addLectureModal').style.display = 'flex';
}

async function confirmAddLecture() {
    if (!selectedLecturePdfFile) {
        alert("يرجى اختيار أو سحب ملف الـ PDF أو PowerPoint أولاً لإضافته للمنهج.");
        return;
    }

    const title = document.getElementById('newLectureTitle').value.trim();
    if (!title) {
        alert("يرجى التأكد من عنوان المحاضرة");
        return;
    }

    const subject = document.getElementById('newLectureSubject').value;
    const lecNum = parseInt(document.getElementById('newLectureNumber').value) || (allLectures.length + 1);
    const diff = parseInt(document.getElementById('newLectureDifficulty').value) || 2;
    const notes = document.getElementById('newLectureNotes').value.trim();
    const rebalance = document.getElementById('newLectureRebalance') ? document.getElementById('newLectureRebalance').checked : true;

    closeModal('addLectureModal');
    showLoading("جاري رفع ومعالجة ملف المحاضرة واستخراج السلايدات والنصوص وتحديث الجدول...");

    const formData = new FormData();
    formData.append('pdf_file', selectedLecturePdfFile);
    formData.append('block_id', currentBlockId);
    formData.append('title', title);
    formData.append('subject', subject);
    formData.append('lecture_number', lecNum);
    formData.append('difficulty', diff);
    formData.append('notes', notes);
    formData.append('rebalance_schedule', rebalance);

    try {
        const res = await fetch('/api/lectures/add', {
            method: 'POST',
            body: formData
        });
        const data = await res.json();
        hideLoading();

        if (data.success) {
            clearSelectedLecturePdf();
            await loadLectures();
            await loadCalendar();
            await loadDashboardStats();
            await loadTodos();
            if (typeof loadBookWorkspaces === 'function') await loadBookWorkspaces();
            showToast({
                type: 'success',
                title: 'تمت إضافة المحاضرة بنجاح! 📚',
                message: `تمت معالجة "${data.title}" (${data.page_count} صفحة/شريحة) وتحديث خطة المذاكرة والجدول.`,
                actionText: 'عرض المحاضرات',
                onAction: () => switchTab('lectures'),
                duration: 8000
            });
        } else {
            showToast({
                type: 'error',
                title: 'تعذر إضافة المحاضرة',
                message: data.error || 'تعذر إضافة المحاضرة.',
                duration: 7000
            });
        }
    } catch (e) {
        hideLoading();
        showToast({
            type: 'error',
            title: 'خطأ أثناء رفع ومعالجة المحاضرة',
            message: String(e),
            duration: 7000
        });
    }
}

// ----------------- AUDIO UPLOAD & PLAYER & TIMESTAMPS -----------------
function triggerAudioFileInput() {
    const input = document.getElementById('audioFileInput');
    if (input) {
        input.value = '';
        input.click();
    }
}

function handleAudioFileSelect(event) {
    const file = event.target.files && event.target.files[0];
    if (file) {
        processAudioFile(file);
    }
}

function handleAudioDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
    const zone = document.getElementById('audioDropZone');
    if (zone) zone.classList.add('drag-active');
}

function handleAudioDragLeave(event) {
    event.preventDefault();
    event.stopPropagation();
    const zone = document.getElementById('audioDropZone');
    if (zone) zone.classList.remove('drag-active');
}

function handleAudioDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    const zone = document.getElementById('audioDropZone');
    if (zone) zone.classList.remove('drag-active');

    const dt = event.dataTransfer;
    if (dt && dt.files && dt.files.length > 0) {
        processAudioFile(dt.files[0]);
    }
}

// Backward compatibility alias
function handleAudioUpload(event) {
    handleAudioFileSelect(event);
}

async function processAudioFile(file) {
    if (!file) return;

    const statusEl = document.getElementById('audioUploadStatus');
    if (statusEl) statusEl.innerText = `جاري رفع ومعالجة: ${file.name} (${Math.round(file.size / 1024)} KB)...`;

    showLoading(
        `جاري تفريغ الريكورد الصوتي: ${file.name}...`,
        "يقوم الذكاء الاصطناعي باستخراج التايم كود الزمني الدقيق [MM:SS] وربطه بالمشغل المدمج..."
    );

    const formData = new FormData();
    formData.append('file', file);
    formData.append('audio', file);

    try {
        const res = await fetch('/api/audio/upload_and_transcribe', {
            method: 'POST',
            body: formData
        });
        const data = await res.json();
        hideLoading();

        if (data.success) {
            currentAudioId = data.id;
            if (statusEl) statusEl.innerText = `تم تفريغ وربط: ${file.name}`;
            document.getElementById('audioPlayerTitle').innerText = data.filename || file.name;
            document.getElementById('mainAudioPlayer').src = data.audio_url;
            document.getElementById('transcriptTitle').innerText = `تفريغ: ${file.name} (مع التايم كود)`;

            const parsedHtml = parseTimestampsToClickable(marked.parse(data.content));
            document.getElementById('transcriptOutput').innerHTML = parsedHtml;

            await loadAudioHistory();
            showNotification("تم بنجاح تفريغ التسجيل الصوتي واستخراج التايم كود وربطه بالمشغل المدمج! 🎙️", 'success');
        } else {
            showNotification("تعذر تفريغ الملف الصوتي: " + (data.error || "خطأ غير معروف"), 'error');
            if (statusEl) statusEl.innerText = "اسحب وأفلت الملف الصوتي هنا، أو انقر للاختيار";
        }
    } catch (e) {
        hideLoading();
        showNotification("خطأ أثناء رفع ومعالجة الصوت: " + e, 'error');
        if (statusEl) statusEl.innerText = "اسحب وأفلت الملف الصوتي هنا، أو انقر للاختيار";
    }
}

// --- ADVANCED AUDIO & VOICE PLAYBACK CONTROLLER SYSTEM ---

function formatAudioTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function stopAudioPlayback() {
    const player = document.getElementById('mainAudioPlayer');
    if (player) {
        player.pause();
        player.currentTime = 0;
        updateAudioUIState(false);
        showToast({
            type: 'info',
            title: 'إيقاف الفويس ⏹️',
            message: 'تم إيقاف تشغيل التسجيل الصوتي وإعادته للبداية.',
            duration: 2500
        });
    }
}

function pauseAudioPlayback() {
    const player = document.getElementById('mainAudioPlayer');
    if (player && !player.paused) {
        player.pause();
        updateAudioUIState(false);
    }
}

function playAudioPlayback() {
    const player = document.getElementById('mainAudioPlayer');
    if (player) {
        if (!player.src || player.src.endsWith('#') || player.src.endsWith('/')) {
            player.src = '/api/audio/stream/anas.ogg';
            const title = document.getElementById('audioPlayerTitle');
            if (title && (!title.innerText || title.innerText.includes('لا يوجد'))) {
                title.innerText = 'تفريغ ريكورد أنس (محاضرة صوتية)';
            }
        }
        player.play().catch(() => {});
        updateAudioUIState(true);
    }
}

function toggleAudioPlayPause() {
    const player = document.getElementById('mainAudioPlayer');
    if (!player) return;
    if (player.paused) {
        playAudioPlayback();
    } else {
        pauseAudioPlayback();
    }
}

function seekAudioRelative(deltaSeconds) {
    const player = document.getElementById('mainAudioPlayer');
    if (!player) return;
    const target = Math.max(0, Math.min(player.duration || 999999, player.currentTime + deltaSeconds));
    player.currentTime = target;
    if (player.paused) {
        player.play().catch(() => {});
    }
}

function seekAudio(seconds) {
    const player = document.getElementById('mainAudioPlayer');
    if (!player) return;
    player.currentTime = seconds;
    player.play().catch(() => {});
}

function toggleAudioMute() {
    const player = document.getElementById('mainAudioPlayer');
    if (!player) return;
    player.muted = !player.muted;
    const muteIcons = [document.getElementById('mainMuteIcon'), document.getElementById('floatingMuteIcon')];
    muteIcons.forEach(icon => {
        if (!icon) return;
        icon.className = player.muted ? 'fa-solid fa-volume-xmark text-danger' : 'fa-solid fa-volume-high';
    });
}

function setAudioSpeed(speed) {
    const player = document.getElementById('mainAudioPlayer');
    if (player) {
        player.playbackRate = speed;
    }
    document.querySelectorAll('.btn-speed').forEach(b => {
        if (b.innerText === `${speed}x` || parseFloat(b.innerText) === speed) {
            b.classList.add('active');
        } else {
            b.classList.remove('active');
        }
    });
}

function onFloatingAudioSliderInput(e) {
    const player = document.getElementById('mainAudioPlayer');
    if (!player || !player.duration) return;
    const percent = parseFloat(e.target.value);
    player.currentTime = (percent / 100) * player.duration;
}

function hideFloatingAudioPlayer() {
    const floating = document.getElementById('floatingAudioPlayer');
    if (floating) {
        floating.style.display = 'none';
    }
}

function updateAudioUIState(isPlaying) {
    const player = document.getElementById('mainAudioPlayer');
    const hasSource = player && player.src && !player.src.endsWith('#') && !player.src.endsWith('/');

    // Header Pill
    const headerPill = document.getElementById('globalAudioControlContainer');
    const headerName = document.getElementById('globalAudioHeaderName');
    const mainTitle = document.getElementById('audioPlayerTitle')?.innerText || 'محاضرة صوتية';

    if (headerPill) {
        headerPill.style.display = (hasSource && (isPlaying || (player && player.currentTime > 0))) ? 'inline-flex' : 'none';
        if (headerName) {
            headerName.innerText = mainTitle.length > 22 ? (mainTitle.substring(0, 20) + '...') : mainTitle;
        }
    }

    // Floating Player
    const floating = document.getElementById('floatingAudioPlayer');
    const floatingTitle = document.getElementById('floatingAudioTitle');
    if (floating) {
        floating.style.display = (hasSource && (isPlaying || (player && player.currentTime > 0))) ? 'flex' : 'none';
        floating.classList.toggle('paused', !isPlaying);
        if (floatingTitle) {
            floatingTitle.innerText = mainTitle;
        }
    }

    // Disc spinning icons
    const discIcons = [
        document.getElementById('mainPlayerDiscIcon'),
        document.getElementById('floatingPlayerDiscIcon')
    ];
    discIcons.forEach(icon => {
        if (icon) icon.classList.toggle('fa-spin', isPlaying);
    });

    // Play/Pause button icons
    const playPauseIcons = [
        document.getElementById('mainPlayPauseIcon'),
        document.getElementById('floatingPlayPauseIcon'),
        document.getElementById('globalAudioPauseIcon')
    ];
    playPauseIcons.forEach(icon => {
        if (!icon) return;
        icon.className = isPlaying ? 'fa-solid fa-pause' : 'fa-solid fa-play';
    });
}

function initAudioSystemListeners() {
    const player = document.getElementById('mainAudioPlayer');
    if (!player) return;

    player.addEventListener('play', () => updateAudioUIState(true));
    player.addEventListener('pause', () => updateAudioUIState(false));
    player.addEventListener('ended', () => {
        updateAudioUIState(false);
        const slider = document.getElementById('floatingAudioSeekSlider');
        if (slider) slider.value = 0;
    });

    player.addEventListener('timeupdate', () => {
        const cur = player.currentTime || 0;
        const dur = player.duration || 0;
        const curFormatted = formatAudioTime(cur);
        const durFormatted = dur ? formatAudioTime(dur) : '--:--';

        const timeDisplay = document.getElementById('floatingAudioTime');
        if (timeDisplay) {
            timeDisplay.innerText = `${curFormatted} / ${durFormatted}`;
        }

        const slider = document.getElementById('floatingAudioSeekSlider');
        if (slider && dur > 0) {
            slider.value = (cur / dur) * 100;
        }
    });

    player.addEventListener('loadedmetadata', () => {
        updateAudioUIState(!player.paused);
    });
}

function parseTimestampsToClickable(text) {
    return text.replace(/\[(\d{1,2}):(\d{2})\]/g, (match, m, s) => {
        const totalSec = parseInt(m) * 60 + parseInt(s);
        return `<span class="timestamp-tag" onclick="seekAudio(${totalSec})">${match} ▶</span>`;
    });
}

async function triggerAnasTimestampDemo() {
    showLoading("جاري تفريغ ريكورد أنس (anas.ogg) مع استخراج التايم كود الدقيق...");
    switchTab('audio');

    try {
        const res = await fetch('/api/audio/transcribe_anas_timestamps', { method: 'POST' });
        const data = await res.json();
        hideLoading();

        if (data.content) {
            currentAudioId = data.id;
            document.getElementById('audioPlayerTitle').innerText = "تفريغ ريكورد أنس (محاضرة صوتية)";
            document.getElementById('mainAudioPlayer').src = data.audio_url || "/api/audio/stream/anas.ogg";
            document.getElementById('transcriptTitle').innerText = "تفريغ ريكورد أنس (مع التايم كود)";

            const parsedHtml = parseTimestampsToClickable(marked.parse(data.content));
            document.getElementById('transcriptOutput').innerHTML = parsedHtml;

            await loadAudioHistory();
        } else {
            alert("تعذر التفريغ: " + data.error);
        }
    } catch (e) {
        hideLoading();
        alert("خطأ: " + e);
    }
}

async function compareDoctorDelta() {
    const lecId = document.getElementById('deltaLectureSelect').value;
    if (!lecId) {
        alert("يرجى اختيار المحاضرة الموازية للريكورد لمقارنتها");
        return;
    }
    if (!currentAudioId) {
        alert("يرجى اختيار أو رفع تسجيل صوتي أولاً");
        return;
    }

    showLoading("جاري مقارنة ما قاله الدكتور بنص شرائح المحاضرة واستخراج إضافات الامتحان...");
    try {
        const res = await fetch('/api/audio/compare_doctor_delta', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                audio_id: currentAudioId,
                lecture_id: parseInt(lecId)
            })
        });
        const data = await res.json();
        hideLoading();

        if (data.doctor_delta) {
            const reportDiv = document.createElement('div');
            reportDiv.className = 'q-explanation-box';
            reportDiv.style.border = '2px solid var(--warning)';
            reportDiv.style.marginTop = '20px';
            reportDiv.innerHTML = `
                <h4 style="color:var(--warning); margin-bottom:12px;"><i class="fa-solid fa-certificate"></i> تقرير إضافات الدكتور الحصرية (Doctor Delta Report):</h4>
                <div>${marked.parse(data.doctor_delta)}</div>
            `;
            document.getElementById('transcriptOutput').prepend(reportDiv);
            alert("تم إعداد تقرير إضافات وتلميحات الدكتور بنجاح!");
        } else {
            alert("تعذر إعداد التقرير: " + data.error);
        }
    } catch (e) {
        hideLoading();
        alert("خطأ: " + e);
    }
}

async function loadAudioHistory() {
    try {
        const res = await fetch('/api/audio/notes');
        const data = await res.json();
        const list = document.getElementById('transcriptsHistoryList');
        list.innerHTML = '';

        (data.notes || []).forEach(n => {
            const item = document.createElement('div');
            item.style.padding = '8px 12px';
            item.style.backgroundColor = 'var(--bg-subtle)';
            item.style.borderRadius = 'var(--radius-sm)';
            item.style.marginBottom = '8px';
            item.style.cursor = 'pointer';
            item.innerHTML = `<strong>${n.title}</strong> <span style="font-size:11px; color:var(--text-subtle);">(${n.audio_filename})</span>`;
            item.onclick = () => {
                currentAudioId = n.id;
                window.currentActiveAudioNote = n;
                document.getElementById('transcriptTitle').innerText = n.title;
                document.getElementById('audioPlayerTitle').innerText = n.title;
                document.getElementById('mainAudioPlayer').src = `/api/audio/stream/${n.audio_filename}`;

                const raw = n.timestamps_transcript || n.transcript || n.ai_summary;
                document.getElementById('transcriptOutput').innerHTML = parseTimestampsToClickable(marked.parse(raw));
            };
            list.appendChild(item);
        });
    } catch (e) {
        console.error(e);
    }
}

function copyTranscript() {
    const text = document.getElementById('transcriptOutput').innerText;
    navigator.clipboard.writeText(text);
    alert("تم نسخ التفريغ الطبي بنجاح!");
}

async function fixCurrentTranscriptEnglish() {
    const btn = document.getElementById('btnFixEnglishTerms');
    const originalHtml = btn ? btn.innerHTML : '';
    
    const transcriptEl = document.getElementById('transcriptOutput');
    const currentText = transcriptEl ? transcriptEl.innerText.trim() : '';

    if (!currentText || currentText.includes("ارفع ريكورد أو اضغط على ريكورد أنس")) {
        alert("يرجى تشغيل أو رفع تسجيل صوتي لتفريغه وتصحيح مصطلحاته أولاً.");
        return;
    }

    if (btn) {
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري التدقيق والتعريب العكسي...';
        btn.disabled = true;
    }
    showLoading("جاري فحص المصطلحات الطبية المكتوبة بحروف عربية وتحويلها إلى الإنجليزية الطبية الأصلية (Latin Script)...");

    try {
        let res, data;
        if (typeof currentAudioId !== 'undefined' && currentAudioId) {
            res = await fetch(`/api/audio/${currentAudioId}/sanitize_english`, { method: 'POST' });
            data = await res.json();
        } else {
            res = await fetch(`/api/audio/sanitize_text`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: currentText })
            });
            data = await res.json();
        }

        hideLoading();
        if (btn) {
            btn.innerHTML = originalHtml;
            btn.disabled = false;
        }

        if (data.content) {
            const parsedHtml = parseTimestampsToClickable(marked.parse(data.content));
            transcriptEl.innerHTML = parsedHtml;
            alert("تم تصحيح جميع المصطلحات والكلمات الإنجليزية المعربة بنجاح وتثبيت المصطلحات اللاتينية الصحيحة!");
            if (typeof loadAudioHistory === 'function') {
                await loadAudioHistory();
            }
        } else {
            alert("تعذر التصحيح: " + (data.error || "خطأ غير معروف"));
        }
    } catch (e) {
        hideLoading();
        if (btn) {
            btn.innerHTML = originalHtml;
            btn.disabled = false;
        }
        alert("حدث خطأ أثناء التصحيح: " + e);
    }
}

// ----------------- SMART LECTURE COMPARISONS & PDF -----------------
let currentLectureComparisonsData = null;

async function loadModalComparisons(lecId, force = false) {
    const container = document.getElementById('modalComparisonsArea');
    if (!container) return;

    const lec = allLectures.find(l => l.id === lecId);
    const lecTitle = lec ? lec.title : "المحاضرة";

    container.innerHTML = `
        <div class="empty-state-card" style="padding: 40px 20px;">
            <div class="spinner"></div>
            <h4 style="margin-top: 14px; color: var(--primary-light);">
                ${force ? 'جاري إعادة استكشاف ومقارنة مواضيع المحاضرة بالذكاء الاصطناعي...' : 'جاري فحص واستخراج مقارنات وفروقات المحاضرة...'}
            </h4>
            <p style="color: var(--text-muted); font-size: 13px; max-width: 600px; margin: 8px auto 0 auto;">
                يقوم الذكاء الاصطناعي الآن بمسح محتوى المحاضرة بدقة، والبحث عن أي مفاهيم، مسارات تشريحية، آليات فسيولوجية، أو أمراض متشابهة لإنشاء جداول مقارنة سريرية شاملة.
            </p>
        </div>
    `;

    try {
        const res = await fetch(`/api/lecture/${lecId}/comparisons`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ force: force })
        });
        const resp = await res.json();
        if (resp.success && resp.data) {
            currentLectureComparisonsData = resp.data;
            renderModalComparisons(resp.data, lecTitle);

            // Update banner in explanation tab
            const banner = document.getElementById('modalComparisonsBanner');
            if (banner && resp.data.comparisons && resp.data.comparisons.length > 0) {
                banner.style.display = 'flex';
            }
        } else {
            container.innerHTML = `
                <div class="empty-state-card text-danger">
                    <i class="fa-solid fa-circle-exclamation fa-2x mb-2"></i>
                    <h4>تعذر استخراج المقارنات</h4>
                    <p>${resp.error || 'حدث خطأ غير متوقع'}</p>
                    <button class="btn btn-sm btn-primary mt-2" onclick="loadModalComparisons(${lecId}, true)">إعادة المحاولة</button>
                </div>
            `;
        }
    } catch (e) {
        container.innerHTML = `
            <div class="empty-state-card text-danger">
                <i class="fa-solid fa-triangle-exclamation fa-2x mb-2"></i>
                <h4>خطأ في الاتصال بالخادم</h4>
                <p>${e}</p>
                <button class="btn btn-sm btn-primary mt-2" onclick="loadModalComparisons(${lecId}, true)">إعادة المحاولة</button>
            </div>
        `;
    }
}

function renderModalComparisons(data, lecTitle = "") {
    const container = document.getElementById('modalComparisonsArea');
    if (!container) return;

    if (!data.comparisons || data.comparisons.length === 0) {
        container.innerHTML = `
            <div class="empty-state-card" style="padding: 40px 20px;">
                <i class="fa-solid fa-scale-balanced fa-3x" style="color: var(--text-muted); opacity: 0.5; margin-bottom: 12px;"></i>
                <h4>لا توجد مقارنات مباشرة مسجلة في المحاضرة</h4>
                <p style="color: var(--text-muted); font-size: 13px; max-width: 500px; margin: 6px auto 14px auto;">
                    يمكنك طلب توليد مقارنات متقدمة أو مقارنة تفاضلية (Differential Diagnoses) للآليات والأنواع المشابهة.
                </p>
                <button class="btn btn-primary" onclick="forceRegenerateModalComparisons()">
                    <i class="fa-solid fa-wand-magic-sparkles"></i> استكشاف وتوليد مقارنات الآن
                </button>
            </div>
        `;
        return;
    }

    let html = '';

    // Overview Box
    if (data.overview) {
        html += `
            <div class="comp-overview-card" style="background: linear-gradient(135deg, rgba(13,148,136,0.1), rgba(37,99,235,0.08)); border: 1px solid rgba(13,148,136,0.25); border-radius: 12px; padding: 16px 20px; margin-bottom: 22px; display: flex; gap: 14px; align-items: flex-start;">
                <div style="background: var(--primary); color: #fff; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px;">
                    <i class="fa-solid fa-circle-info"></i>
                </div>
                <div>
                    <strong style="color: var(--primary-light); font-size: 14px;">أهمية المقارنات في هذه المحاضرة:</strong>
                    <p style="margin: 4px 0 0 0; font-size: 13px; line-height: 1.6; color: var(--text-main);">${data.overview}</p>
                </div>
            </div>
        `;
    }

    // Comparisons List
    data.comparisons.forEach((comp, idx) => {
        const entities = comp.entities || [];
        const importanceBadge = comp.importance ? `<span class="badge-tag" style="background: rgba(245,158,11,0.15); color: #f59e0b; border: 1px solid rgba(245,158,11,0.3); font-size: 11px;"><i class="fa-solid fa-star"></i> ${comp.importance}</span>` : '';

        let tableHeaders = `<th class="aspect-th">وجه المقارنة (Feature)</th>`;
        entities.forEach(ent => {
            tableHeaders += `<th class="entity-th">${ent}</th>`;
        });

        let tableRows = '';
        (comp.table || []).forEach(row => {
            let rowCells = `<td class="aspect-cell">${row.aspect}</td>`;
            (row.values || []).forEach(val => {
                rowCells += `<td>${val}</td>`;
            });
            tableRows += `<tr>${rowCells}</tr>`;
        });

        html += `
            <div class="comp-card-item" id="comp-item-${comp.id || idx}">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 12px; flex-wrap: wrap; gap: 10px;">
                    <div>
                        <div style="font-size: 17px; font-weight: 800; color: var(--text-main); display: flex; align-items: center; gap: 8px; direction: ltr; text-align: right;">
                            <i class="fa-solid fa-scale-balanced text-accent"></i> ${comp.title_en || comp.title || comp.title_ar}
                        </div>
                    </div>
                    <div>${importanceBadge}</div>
                </div>

                ${comp.summary ? `<p style="font-size: 13px; color: var(--text-muted); margin-bottom: 16px; line-height: 1.6;">${comp.summary}</p>` : ''}

                <!-- Responsive Table Wrapper -->
                <div class="comp-table-wrapper">
                    <table class="smart-comp-table">
                        <thead>
                            <tr>${tableHeaders}</tr>
                        </thead>
                        <tbody>
                            ${tableRows}
                        </tbody>
                    </table>
                </div>

                <!-- High-Yield Pearls, MCQ Traps & Mnemonics -->
                <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 14px;">
                    ${comp.high_yield_pearl ? `
                        <div style="background: rgba(34, 197, 94, 0.08); border-right: 4px solid #16a34a; padding: 10px 14px; border-radius: 8px; font-size: 13px; color: #86efac; display: flex; gap: 10px; align-items: flex-start;">
                            <i class="fa-solid fa-gem" style="margin-top: 3px; color: #22c55e;"></i>
                            <div>
                                <strong style="color: #4ade80;">الدرة السريرية (High-Yield Pearl):</strong>
                                <span style="margin-right: 4px; color: var(--text-main);">${comp.high_yield_pearl}</span>
                            </div>
                        </div>
                    ` : ''}

                    ${comp.mcq_trap ? `
                        <div style="background: rgba(239, 68, 68, 0.08); border-right: 4px solid #dc2626; padding: 10px 14px; border-radius: 8px; font-size: 13px; color: #fca5a5; display: flex; gap: 10px; align-items: flex-start;">
                            <i class="fa-solid fa-triangle-exclamation" style="margin-top: 3px; color: #ef4444;"></i>
                            <div>
                                <strong style="color: #f87171;">فخ الامتحان (USMLE / Board Trap):</strong>
                                <span style="margin-right: 4px; color: var(--text-main);">${comp.mcq_trap}</span>
                            </div>
                        </div>
                    ` : ''}

                    ${comp.mnemonic ? `
                        <div style="background: rgba(59, 130, 246, 0.08); border-right: 4px solid #2563eb; padding: 10px 14px; border-radius: 8px; font-size: 13px; color: #93c5fd; display: flex; gap: 10px; align-items: flex-start;">
                            <i class="fa-solid fa-lightbulb" style="margin-top: 3px; color: #3b82f6;"></i>
                            <div>
                                <strong style="color: #60a5fa;">وسيلة التذكر (Mnemonic):</strong>
                                <span style="margin-right: 4px; color: var(--text-main); font-weight: 700;">${comp.mnemonic}</span>
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

function openModalComparisonsPrintView() {
    if (!currentStudyLectureId) return;
    window.open(`/api/lecture/${currentStudyLectureId}/comparisons/print_view`, '_blank');
}

function forceRegenerateModalComparisons() {
    if (!currentStudyLectureId) return;
    if (confirm("هل تريد بالتأكيد إعادة فحص واستخراج مقارنات جديدة لهذه المحاضرة بالذكاء الاصطناعي؟")) {
        loadModalComparisons(currentStudyLectureId, true);
    }
}

function downloadModalComparisonsPdf() {
    if (!currentStudyLectureId) return;
    openModalComparisonsPrintView();
}

function openModalExplanationPrintView() {
    if (!currentStudyLectureId) return;
    window.open(`/api/lecture/${currentStudyLectureId}/explanation/print_view?lang=${currentStudyLanguage}`, '_blank');
}

// =========================================================================
// 🔢 LECTURE NUMBERS, CONSTANTS & BIOMETRICS (سحب وتصدير الأرقام والثوابت)
// =========================================================================
let currentLectureNumbersData = null;

async function loadLectureNumbers(lecId, force = false) {
    const container = document.getElementById('modalNumbersArea');
    if (!container) return;

    const lec = allLectures.find(l => l.id === lecId);
    const lecTitle = lec ? lec.title : "المحاضرة";

    container.innerHTML = `
        <div class="empty-state-card" style="padding: 40px 20px;">
            <div class="spinner"></div>
            <h4 style="margin-top: 14px; color: var(--primary-light);">
                ${force ? 'جاري إعادة سحب وفحص أرقام وثوابت المحاضرة بالذكاء الاصطناعي...' : 'جاري فحص واستخراج الأرقام والمعدلات والقياسات...'}
            </h4>
            <p style="color: var(--text-muted); font-size: 13px; max-width: 600px; margin: 8px auto 0 auto;">
                يقوم الذكاء الاصطناعي بمسح كافة السلايدات والنصوص لاستخراج جميع الأبعاد، المعدلات المخبرية، النسب المئوية، المستويات الفقرية، والجرعات وتجهيزها للاستذكار ولتنزيل الـ PDF.
            </p>
        </div>
    `;

    try {
        const res = await fetch(`/api/lecture/${lecId}/numbers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ force: force })
        });
        const resp = await res.json();
        if (resp.success && resp.data) {
            currentLectureNumbersData = resp.data;
            renderLectureNumbers(resp.data, lecTitle);
        } else {
            container.innerHTML = `
                <div class="empty-state-card text-danger">
                    <i class="fa-solid fa-circle-exclamation fa-2x mb-2"></i>
                    <h4>تعذر استخراج الأرقام</h4>
                    <p>${resp.error || 'حدث خطأ غير متوقع'}</p>
                    <button class="btn btn-sm btn-primary mt-2" onclick="loadLectureNumbers(${lecId}, true)">إعادة المحاولة</button>
                </div>
            `;
        }
    } catch (e) {
        container.innerHTML = `
            <div class="empty-state-card text-danger">
                <i class="fa-solid fa-triangle-exclamation fa-2x mb-2"></i>
                <h4>خطأ في الاتصال بالخادم</h4>
                <p>${e}</p>
                <button class="btn btn-sm btn-primary mt-2" onclick="loadLectureNumbers(${lecId}, true)">إعادة المحاولة</button>
            </div>
        `;
    }
}

function renderLectureNumbers(data, lecTitle = "") {
    const container = document.getElementById('modalNumbersArea');
    const countBadge = document.getElementById('numbersCountBadge');
    if (!container) return;

    const categories = data.categories || [];
    let totalItems = 0;
    categories.forEach(c => totalItems += (c.items || []).length);

    if (countBadge) {
        countBadge.innerText = `${totalItems} قيمة وثابت مستخرج`;
    }

    if (data.no_pdf) {
        container.innerHTML = `
            <div class="empty-state-card" style="padding: 40px 20px;">
                <i class="fa-solid fa-file-arrow-up fa-3x" style="color: #60a5fa; margin-bottom: 14px;"></i>
                <h4 style="color: var(--text-main);">لم يتم رفع ملف السلايدات (PDF) لهذه المحاضرة بعد</h4>
                <p style="color: var(--text-muted); font-size: 13px; max-width: 500px; margin: 8px auto 16px auto; line-height: 1.6;">
                    تم إنشاء عنوان هذه المحاضرة تلقائياً من جدول الكلية. لاستخراج الأرقام والثوابت الطبية وتحويلها إلى فلاش كاردز أو ملف PDF، يرجى رفع ملف الـ PDF الخاص بها:
                </p>
                <div style="display: flex; justify-content: center; gap: 10px;">
                    <label class="btn btn-sm btn-primary" style="cursor: pointer; display: inline-flex; align-items: center; gap: 8px; padding: 9px 20px; font-weight: 700;">
                        <i class="fa-solid fa-cloud-arrow-up"></i> <span>رفع ملف PDF لهذه المحاضرة الآن</span>
                        <input type="file" accept=".pdf,.pptx,.ppt" style="display: none;" onchange="uploadLecturePdfFile(event, ${currentStudyLectureId})">
                    </label>
                </div>
            </div>
        `;
        return;
    }

    if (categories.length === 0 || totalItems === 0) {
        container.innerHTML = `
            <div class="empty-state-card" style="padding: 40px 20px;">
                <i class="fa-solid fa-calculator fa-3x" style="color: var(--text-muted); opacity: 0.5; margin-bottom: 12px;"></i>
                <h4>لم يتم العثور على أرقام أو ثوابت عددية محددة</h4>
                <p style="color: var(--text-muted); font-size: 13px;">تأكد من وجود نص أو ملف PDF كامل للمحاضرة ثم حاول مجدداً.</p>
                <button class="btn btn-sm btn-primary mt-2" onclick="loadLectureNumbers(currentStudyLectureId, true)">إعادة السحب بالذكاء الاصطناعي</button>
            </div>
        `;
        return;
    }

    let html = '';

    // Summary Banner
    if (data.summary_arabic) {
        html += `
            <div style="background: linear-gradient(135deg, rgba(37,99,235,0.08), rgba(16,185,129,0.06)); border: 1px solid rgba(37,99,235,0.25); border-radius: 12px; padding: 16px; margin-bottom: 20px;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px; color: #60a5fa; font-size: 14px; font-weight: 700;">
                    <i class="fa-solid fa-lightbulb"></i> <span>نظرة عامة وفخاخ امتحانات الـ MCQs:</span>
                </div>
                <p style="margin: 0; font-size: 13px; line-height: 1.7; color: var(--text-main);">
                    ${escapeHtml(data.summary_arabic)}
                </p>
            </div>
        `;
    }

    // Categories Loop
    categories.forEach((cat, catIdx) => {
        const items = cat.items || [];
        if (items.length === 0) return;

        html += `
            <div class="numbers-category-card mb-4" data-category="${escapeHtml(cat.category_name)}" style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 14px; overflow: hidden; box-shadow: var(--shadow-sm);">
                <div style="background: var(--bg-subtle); padding: 12px 18px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
                    <h5 style="margin: 0; font-size: 14px; font-weight: 700; color: var(--primary-light); display: flex; align-items: center; gap: 8px;">
                        <i class="fa-solid fa-layer-group text-accent"></i> <span>${escapeHtml(cat.category_name)}</span>
                    </h5>
                    <span class="badge-tag" style="background: rgba(16,185,129,0.12); color: #10b981; font-size: 11px;">${items.length} قيم</span>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 14px; padding: 16px;">
        `;

        items.forEach((item, itemIdx) => {
            html += `
                <div class="number-item-box" style="background: var(--bg-main); border: 1px solid var(--border-color); border-radius: 10px; padding: 14px; display: flex; flex-direction: column; justify-content: space-between; transition: transform 0.15s ease, border-color 0.15s ease;">
                    <div>
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; gap: 10px;">
                            <span style="background: linear-gradient(135deg, rgba(37,99,235,0.18), rgba(59,130,246,0.1)); color: #60a5fa; border: 1px solid rgba(59,130,246,0.3); font-weight: 800; font-size: 13.5px; padding: 4px 10px; border-radius: 8px; font-family: monospace;" dir="ltr">
                                ${escapeHtml(item.value)}
                            </span>
                            ${item.unit_or_type ? `<span style="font-size: 10.5px; color: var(--text-muted); background: var(--bg-subtle); padding: 2px 6px; border-radius: 4px;">${escapeHtml(item.unit_or_type)}</span>` : ''}
                        </div>
                        
                        <h6 style="margin: 0 0 6px 0; font-size: 13px; font-weight: 700; color: var(--text-main);" dir="auto">
                            ${escapeHtml(item.concept)}
                        </h6>
                        
                        ${item.context ? `
                            <p style="margin: 0 0 8px 0; font-size: 12px; color: var(--text-subtle); line-height: 1.5;" dir="auto">
                                <b style="color: var(--text-muted);">السياق:</b> ${escapeHtml(item.context)}
                            </p>
                        ` : ''}
                        
                        ${item.clinical_significance ? `
                            <div style="background: rgba(239, 68, 68, 0.06); border-right: 3px solid #ef4444; padding: 6px 10px; border-radius: 4px; font-size: 11.5px; color: #fca5a5; line-height: 1.5; margin-top: 6px;" dir="auto">
                                <strong>⚡ فخ امتحان / ربط سريري:</strong> ${escapeHtml(item.clinical_significance)}
                            </div>
                        ` : ''}
                    </div>

                    ${item.flashcard_front ? `
                        <div style="margin-top: 10px; padding-top: 8px; border-top: 1px dashed var(--border-color); display: flex; align-items: center; justify-content: space-between; font-size: 11px; color: var(--text-muted);">
                            <span><i class="fa-solid fa-layer-group text-primary"></i> جاهز ككرت فلاش</span>
                            <span style="color: var(--primary-light);">${escapeHtml(item.flashcard_front.substring(0, 35))}...</span>
                        </div>
                    ` : ''}
                </div>
            `;
        });

        html += `
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

function filterNumbersCards() {
    const input = document.getElementById('numbersSearchInput');
    if (!input) return;
    const term = input.value.trim().toLowerCase();
    
    document.querySelectorAll('.number-item-box').forEach(box => {
        const text = box.innerText.toLowerCase();
        box.style.display = text.includes(term) ? 'flex' : 'none';
    });

    // Hide empty category containers
    document.querySelectorAll('.numbers-category-card').forEach(card => {
        const visibleBoxes = Array.from(card.querySelectorAll('.number-item-box')).filter(b => b.style.display !== 'none');
        card.style.display = visibleBoxes.length > 0 ? 'block' : 'none';
    });
}

async function uploadLecturePdfFile(event, lecId) {
    if (!lecId) lecId = currentStudyLectureId;
    const file = event.target.files[0];
    if (!file || !lecId) return;

    showLoading(`جاري رفع ومعالجة ملف المحاضرة: ${file.name}...`, "يتم استخراج النصوص وتحضير السلايدات");
    const formData = new FormData();
    formData.append('file', file);

    try {
        const res = await fetch(`/api/lecture/${lecId}/upload_pdf`, {
            method: 'POST',
            body: formData
        });
        const data = await res.json();
        hideLoading();
        if (data.success) {
            showNotification("تم رفع ملف المحاضرة بنجاح! جاري الآن استخراج الأرقام والثوابت... 🔢", 'success');
            if (typeof loadLectures === 'function') await loadLectures();
            loadLectureNumbers(lecId, true);
        } else {
            showNotification("خطأ أثناء رفع الملف: " + (data.error || ""), 'error');
        }
    } catch (e) {
        hideLoading();
        showNotification("فشل الاتصال أثناء رفع الملف: " + e, 'error');
    }
}
window.uploadLecturePdfFile = uploadLecturePdfFile;

function downloadLectureNumbersPdf(lecId) {
    if (!lecId) lecId = currentStudyLectureId;
    if (!lecId) return;
    showNotification("جاري تجهيز وتنزيل ملف PDF الأرقام والثوابت...", "info");
    window.location.href = `/api/lecture/${lecId}/numbers/export_pdf`;
}

async function convertNumbersToFlashcards(lecId) {
    if (!lecId) lecId = currentStudyLectureId;
    if (!lecId) return;

    if (!confirm("هل تريد تحويل كافة الأرقام والثوابت المستخرجة إلى كروت فلاش (Flashcards) في سطح المحاضرة؟")) {
        return;
    }

    showLoading("جاري تحويل الأرقام إلى كروت فلاش...", "يتم حفظ الكروت في قاعدة البيانات");
    try {
        const res = await fetch(`/api/lecture/${lecId}/numbers/create_flashcards`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });
        const data = await res.json();
        hideLoading();
        if (data.success) {
            playCompletionChime('success');
            showNotification(`تم إنشاء ${data.created_count} كرت فلاش جديد للأرقام والثوابت بنجاح! 🗂️`, 'success');
            await loadFlashcards();
            if (typeof loadModalFlashcards === 'function') {
                loadModalFlashcards(lecId);
            }
        } else {
            alert("حدث خطأ أثناء إنشاء الكروت: " + (data.error || ""));
        }
    } catch (e) {
        hideLoading();
        alert("فشل الاتصال بالخادم: " + e);
    }
}
window.loadLectureNumbers = loadLectureNumbers;
window.renderLectureNumbers = renderLectureNumbers;
window.filterNumbersCards = filterNumbersCards;
window.downloadLectureNumbersPdf = downloadLectureNumbersPdf;
window.convertNumbersToFlashcards = convertNumbersToFlashcards;

// =========================================================================
// 📅 SMART SYLLABUS & SCHEDULE IMPORT (استيراد وتقسيم جدول المحاضرات الذكي)
// =========================================================================
let currentParsedSyllabusData = null;
let currentSyllabusUploadedFile = null;
let syllabusSelectedOffDatesSet = new Set();

function openImportSyllabusModal() {
    try {
        currentParsedSyllabusData = null;
        currentSyllabusUploadedFile = null;

        const fileInput = document.getElementById('syllabusFileInput');
        if (fileInput) fileInput.value = '';
        const textInput = document.getElementById('syllabusTextInput');
        if (textInput) textInput.value = '';

        const fileInfo = document.getElementById('syllabusSelectedFileInfo');
        if (fileInfo) fileInfo.style.display = 'none';

        const previewContainer = document.getElementById('syllabusExtractedPreviewContainer');
        if (previewContainer) previewContainer.style.display = 'none';

        const btnApply = document.getElementById('btnApplySyllabusSchedule');
        if (btnApply) btnApply.disabled = true;

        // Set default start date to 2026-09-20 (Block start) or today
        const startDateInput = document.getElementById('syllabusStartDate');
        if (startDateInput && !startDateInput.value) {
            startDateInput.value = '2026-09-20';
        }

        // Initialize default off days (Fridays)
        applySyllabusPresetOffDays('fri');
    } catch (err) {
        console.warn('Error resetting syllabus modal state:', err);
    }

    const modal = document.getElementById('importSyllabusModal');
    if (modal) {
        modal.style.display = 'flex';
    }
    renderSyllabusOffDaysGrid();
}
window.openImportSyllabusModal = openImportSyllabusModal;

function setSyllabusStartDate(preset) {
    const input = document.getElementById('syllabusStartDate');
    if (!input) return;
    let targetDateStr = '2026-09-20';
    if (preset === 'today') {
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        targetDateStr = `${y}-${m}-${d}`;
    } else if (preset === 'next_sat') {
        const now = new Date();
        const day = now.getDay(); // 0 is Sun, 6 is Sat
        const diff = (6 - day + 7) % 7 || 7;
        const nextSat = new Date(now.getTime() + diff * 86400000);
        const y = nextSat.getFullYear();
        const m = String(nextSat.getMonth() + 1).padStart(2, '0');
        const d = String(nextSat.getDate()).padStart(2, '0');
        targetDateStr = `${y}-${m}-${d}`;
    } else if (preset) {
        targetDateStr = preset;
    }
    input.value = targetDateStr;
    onSyllabusStartDateChanged();
}
window.setSyllabusStartDate = setSyllabusStartDate;

function onSyllabusStartDateChanged() {
    applySyllabusPresetOffDays('fri');
    renderSyllabusOffDaysGrid();
}
window.onSyllabusStartDateChanged = onSyllabusStartDateChanged;

function renderSyllabusOffDaysGrid() {
    const container = document.getElementById('syllabusDetailedWeeksOffContainer');
    if (!container) return;
    container.innerHTML = '';

    const startInput = document.getElementById('syllabusStartDate');
    const weeksInput = document.getElementById('syllabusDurationWeeks');
    const startDateStr = (startInput && startInput.value) ? startInput.value : '2026-09-20';
    const durationWeeks = parseInt(weeksInput ? weeksInput.value : 7) || 7;

    let [sY, sM, sD] = (startDateStr || '').split('-').map(Number);
    if (!sY || !sM || !sD || isNaN(sY) || isNaN(sM) || isNaN(sD)) {
        const today = new Date();
        sY = today.getFullYear();
        sM = today.getMonth() + 1;
        sD = today.getDate();
    }
    const startDateObj = new Date(sY, sM - 1, sD, 12, 0, 0);

    const dayNamesAr = ["الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت", "الأحد"];
    let totalOffCount = 0;
    let totalStudyCount = 0;

    for (let w = 1; w <= durationWeeks; w++) {
        const weekCard = document.createElement('div');
        weekCard.className = 'week-off-card';

        const weekHeader = document.createElement('div');
        weekHeader.className = 'week-off-card-title';
        weekHeader.innerHTML = `
            <span><i class="fa-solid fa-calendar-week"></i> الأسبوع ${w}</span>
            <span style="font-size: 11px; font-weight: normal; color: var(--text-muted);" id="syllabus-week-off-count-${w}"></span>
        `;
        weekCard.appendChild(weekHeader);

        const grid = document.createElement('div');
        grid.className = 'week-off-days-grid';

        let weekOffCount = 0;

        for (let d = 0; d < 7; d++) {
            const dayIndex = (w - 1) * 7 + d;
            const dObj = new Date(startDateObj.getTime() + dayIndex * 86400000);
            const y = dObj.getFullYear();
            const m = String(dObj.getMonth() + 1).padStart(2, '0');
            const dayNum = String(dObj.getDate()).padStart(2, '0');
            const dateStr = `${y}-${m}-${dayNum}`;

            const pyWeekday = (dObj.getDay() + 6) % 7;
            const dayName = dayNamesAr[pyWeekday];

            const isOff = syllabusSelectedOffDatesSet.has(dateStr);

            if (isOff) {
                totalOffCount++;
                weekOffCount++;
            } else {
                totalStudyCount++;
            }

            const chip = document.createElement('div');
            chip.className = `day-chip-toggle ${isOff ? 'is-off-day' : 'is-study-day'}`;
            chip.id = `syllabus-chip-${dateStr}`;
            chip.title = isOff ? 'انقر للتحويل إلى يوم مذاكرة 📖' : 'انقر للتحويل إلى يوم راحة / إجازة 🌴';
            chip.onclick = () => toggleSyllabusOffDate(dateStr);

            chip.innerHTML = `
                <div class="day-name">${dayName}</div>
                <div class="day-date">${dayNum}/${m}</div>
                <div class="day-status">
                    ${isOff ? '<i class="fa-solid fa-mug-hot"></i> راحة 🌴' : '<i class="fa-solid fa-book-open"></i> مذاكرة 📖'}
                </div>
            `;
            grid.appendChild(chip);
        }

        weekCard.appendChild(grid);
        container.appendChild(weekCard);

        const weekCountBadge = weekCard.querySelector(`#syllabus-week-off-count-${w}`);
        if (weekCountBadge) {
            weekCountBadge.textContent = `${weekOffCount} أيام راحة | ${7 - weekOffCount} أيام دراسة`;
        }
    }

    const countOffEl = document.getElementById('syllabusOffDaysCount');
    if (countOffEl) countOffEl.innerText = totalOffCount;
    const countStudyEl = document.getElementById('syllabusStudyDaysCount');
    if (countStudyEl) countStudyEl.innerText = totalStudyCount;
}
window.renderSyllabusOffDaysGrid = renderSyllabusOffDaysGrid;

function toggleSyllabusOffDate(dateStr) {
    if (syllabusSelectedOffDatesSet.has(dateStr)) {
        syllabusSelectedOffDatesSet.delete(dateStr);
    } else {
        syllabusSelectedOffDatesSet.add(dateStr);
    }
    renderSyllabusOffDaysGrid();
}
window.toggleSyllabusOffDate = toggleSyllabusOffDate;

function applySyllabusPresetOffDays(type) {
    syllabusSelectedOffDatesSet.clear();

    const startInput = document.getElementById('syllabusStartDate');
    const weeksInput = document.getElementById('syllabusDurationWeeks');
    const startDateStr = (startInput && startInput.value) ? startInput.value : '2026-09-20';
    const durationWeeks = parseInt(weeksInput ? weeksInput.value : 7) || 7;

    let [sY, sM, sD] = (startDateStr || '').split('-').map(Number);
    if (!sY || !sM || !sD || isNaN(sY) || isNaN(sM) || isNaN(sD)) {
        const today = new Date();
        sY = today.getFullYear();
        sM = today.getMonth() + 1;
        sD = today.getDate();
    }
    const startDateObj = new Date(sY, sM - 1, sD, 12, 0, 0);

    const targetWeekdays = [];
    if (type === 'fri') targetWeekdays.push(4); // Friday
    if (type === 'fri_sat') {
        targetWeekdays.push(4); // Friday
        targetWeekdays.push(5); // Saturday
    }

    if (targetWeekdays.length > 0) {
        for (let i = 0; i < durationWeeks * 7; i++) {
            const dObj = new Date(startDateObj.getTime() + i * 86400000);
            const pyWeekday = (dObj.getDay() + 6) % 7;
            if (targetWeekdays.includes(pyWeekday)) {
                const y = dObj.getFullYear();
                const m = String(dObj.getMonth() + 1).padStart(2, '0');
                const d = String(dObj.getDate()).padStart(2, '0');
                syllabusSelectedOffDatesSet.add(`${y}-${m}-${d}`);
            }
        }
    }

    renderSyllabusOffDaysGrid();
}
window.applySyllabusPresetOffDays = applySyllabusPresetOffDays;

async function loadMiniaPresetSyllabus() {
    const btn = document.getElementById('btnLoadMiniaPreset');
    const originalHtml = btn ? btn.innerHTML : '';
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> <span>جاري تفريغ جدول كلية الطب جامعة المنيا...</span>`;
    }

    try {
        const res = await fetch('/api/schedule/preset_minia_neu312');
        const data = await res.json();
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalHtml;
        }

        if (data.success && data.lectures) {
            currentParsedSyllabusData = data;
            
            // Set start date to 2026-09-20
            const startDateInput = document.getElementById('syllabusStartDate');
            if (startDateInput) startDateInput.value = data.start_date || '2026-09-20';

            const durationInput = document.getElementById('syllabusDurationWeeks');
            if (durationInput) durationInput.value = data.duration_weeks || 7;

            // Default preset to Friday off, student can customize freely
            applySyllabusPresetOffDays('fri');

            // Render Preview Table
            renderParsedSyllabusPreview(data);

            showNotification(`تم تفريغ جدول المنيا NEU-312 بنجاح (${data.lectures.length} محاضرة - 7 أسابيع)! يمكنك الآن اختيار أيام إجازتك بالتقويم واعتماد الجدول 📅`, 'success');
            
            // Scroll preview into view
            const prev = document.getElementById('syllabusExtractedPreviewContainer');
            if (prev) {
                prev.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        } else {
            alert("حدث خطأ أثناء تحميل جدول المنيا: " + (data.error || ""));
        }
    } catch (e) {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalHtml;
        }
        alert("فشل الاتصال بالخادم: " + e);
    }
}
window.loadMiniaPresetSyllabus = loadMiniaPresetSyllabus;

function onSyllabusFileSelected(event) {
    const file = event.target.files[0];
    if (!file) return;

    currentSyllabusUploadedFile = file;
    const fileInfo = document.getElementById('syllabusSelectedFileInfo');
    const fileName = document.getElementById('syllabusFileName');
    if (fileInfo && fileName) {
        const sizeKb = Math.round(file.size / 1024);
        fileName.innerHTML = `<i class="fa-solid fa-file me-2 text-primary"></i> <b>${escapeHtml(file.name)}</b> (${sizeKb} KB)`;
        fileInfo.style.display = 'flex';
    }
}

function clearSyllabusFile() {
    currentSyllabusUploadedFile = null;
    const fileInput = document.getElementById('syllabusFileInput');
    if (fileInput) fileInput.value = '';
    const fileInfo = document.getElementById('syllabusSelectedFileInfo');
    if (fileInfo) fileInfo.style.display = 'none';
}

async function parseSyllabusWithAI() {
    const textInput = document.getElementById('syllabusTextInput');
    const text = textInput ? textInput.value.trim() : '';

    if (!currentSyllabusUploadedFile && !text) {
        alert("يرجى اختيار ملف الجدول (صورة / PDF / Excel / Word) أو لصق نص الجدول أولاً.");
        return;
    }

    const btn = document.getElementById('btnParseSyllabus');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> <span>جاري فحص واستخراج المحاضرات بالذكاء الاصطناعي...</span>`;

    const formData = new FormData();
    if (currentSyllabusUploadedFile) {
        formData.append('file', currentSyllabusUploadedFile);
    }
    if (text) {
        formData.append('schedule_text', text);
    }

    try {
        const res = await fetch('/api/schedule/parse_schedule', {
            method: 'POST',
            body: formData
        });
        const resp = await res.json();
        btn.disabled = false;
        btn.innerHTML = originalText;

        if (resp.success && resp.data && resp.data.lectures && resp.data.lectures.length > 0) {
            currentParsedSyllabusData = resp.data;
            renderParsedSyllabusPreview(resp.data);
            showNotification(`تم استخراج ${resp.data.lectures.length} محاضرة بنجاح من الجدول!`, 'success');
        } else {
            alert("لم يتم العثور على محاضرات في هذا المستند أو النص: " + (resp.error || "يرجى التحقق من الملف أو النص المرفق."));
        }
    } catch (e) {
        btn.disabled = false;
        btn.innerHTML = originalText;
        alert("فشل الاتصال بالخادم أثناء تحليل الجدول: " + e);
    }
}

function renderParsedSyllabusPreview(data) {
    const previewContainer = document.getElementById('syllabusExtractedPreviewContainer');
    const tbody = document.getElementById('syllabusExtractedLecturesTableBody');
    const badgeCount = document.getElementById('parsedLecCountBadge');
    const blockBadge = document.getElementById('detectedBlockNameBadge');
    const btnApply = document.getElementById('btnApplySyllabusSchedule');

    if (!previewContainer || !tbody) return;

    const lecs = data.lectures || [];
    if (badgeCount) badgeCount.innerText = lecs.length;
    if (blockBadge) {
        blockBadge.innerText = data.block_name_detected ? `البلوك المقترح: ${data.block_name_detected}` : '';
        blockBadge.style.display = data.block_name_detected ? 'inline-block' : 'none';
    }

    let rowsHtml = '';
    lecs.forEach((lec, idx) => {
        rowsHtml += `
            <tr>
                <td style="text-align: center; font-weight: 700; color: var(--text-muted);">${lec.lecture_number || idx + 1}</td>
                <td>
                    <div style="font-weight: 600; color: var(--text-main);">${escapeHtml(lec.title)}</div>
                    ${lec.title_arabic ? `<small style="color: var(--text-muted);">${escapeHtml(lec.title_arabic)}</small>` : ''}
                </td>
                <td><span class="badge-tag" style="background: rgba(37,99,235,0.12); color: #93c5fd; font-size: 11px;">${escapeHtml(lec.subject || 'General')}</span></td>
                <td style="text-align: center; font-size: 11px; color: var(--primary-light);">
                    ${lec.original_date_str ? `<span style="background: rgba(37,99,235,0.1); padding: 3px 8px; border-radius: 6px; display: inline-block;"><i class="fa-solid fa-building-columns"></i> ${escapeHtml(lec.original_date_str)}</span>` : (lec.week_number ? `الأسبوع ${lec.week_number}` : '-')}
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = rowsHtml;
    previewContainer.style.display = 'block';

    if (btnApply) {
        btnApply.disabled = false;
    }
}

async function applySyllabusScheduleToDatabase() {
    if (!currentParsedSyllabusData || !currentParsedSyllabusData.lectures || currentParsedSyllabusData.lectures.length === 0) {
        alert("يرجى قراءة وفحص المحاضرات أولاً.");
        return;
    }

    const startDate = document.getElementById('syllabusStartDate').value || '2026-09-20';
    const durationWeeks = parseInt(document.getElementById('syllabusDurationWeeks').value || 7);
    
    // Read exact custom off-dates from the interactive calendar selector
    const offDates = Array.from(syllabusSelectedOffDatesSet);

    const includeRev1 = document.getElementById('chkReview1') ? document.getElementById('chkReview1').checked : true;
    const includeRev2 = document.getElementById('chkReview2') ? document.getElementById('chkReview2').checked : true;
    const includeFinal = document.getElementById('chkFinalDrill') ? document.getElementById('chkFinalDrill').checked : true;
    const replaceEmpty = document.getElementById('chkReplaceEmptyLectures') ? document.getElementById('chkReplaceEmptyLectures').checked : true;

    const payload = {
        block_id: currentActiveBlockId || 1,
        lectures: currentParsedSyllabusData.lectures,
        start_date: startDate,
        duration_weeks: durationWeeks,
        off_days_weekdays: [],
        off_dates: offDates,
        include_first_review: includeRev1,
        include_second_review: includeRev2,
        include_final_drill: includeFinal,
        replace_existing_lectures: replaceEmpty
    };

    showLoading("جاري تطبيق واعتماد الجدول الدراسي...", "يتم تنظيم المذاكرة الأولى والمراجعة الأولى والمراجعة الثانية وأيام الإجازة");

    try {
        const res = await fetch('/api/schedule/apply_custom_plan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const resp = await res.json();
        hideLoading();

        if (resp.success) {
            if (typeof playCompletionChime === 'function') playCompletionChime('success');
            closeModal('importSyllabusModal');
            showNotification(`تم اعتماد الجدول الدراسي بنجاح! تم جدولة ${resp.total_lectures} محاضرة و ${resp.total_tasks_created} مهمة دراسية ومراجعات في التقويم. 📅`, 'success');
            
            // Reload Calendar, stats and lectures safely
            if (typeof loadCalendar === 'function') await loadCalendar();
            if (typeof loadDashboardStats === 'function') await loadDashboardStats();
            if (typeof loadLectures === 'function') await loadLectures();
            if (typeof switchTab === 'function') switchTab('planner');
        } else {
            alert("حدث خطأ أثناء اعتماد الخطة: " + (resp.error || ""));
        }
    } catch (e) {
        hideLoading();
        alert("فشل الاتصال بالخادم: " + e);
    }
}
window.onSyllabusFileSelected = onSyllabusFileSelected;
window.clearSyllabusFile = clearSyllabusFile;
window.parseSyllabusWithAI = parseSyllabusWithAI;
window.renderParsedSyllabusPreview = renderParsedSyllabusPreview;
window.applySyllabusScheduleToDatabase = applySyllabusScheduleToDatabase;

// ----------------- PAST PAPERS FILTER V2 -----------------
let matchedPastQuestions = [];

function handlePastPaperFileUpload(e) {
    const file = e.target.files[0];
    if (file) {
        selectedPastPaperFile = file;
        document.getElementById('pastPaperFileName').innerText = `تم اختيار: ${file.name}`;
    }
}

async function processPastPaperFilter() {
    const rawText = document.getElementById('rawQuestionsText').value.trim();
    if (!rawText && !selectedPastPaperFile) {
        alert("يرجى اختيار ملف امتحان (PDF أو Word) أو لصق نص الأسئلة");
        return;
    }

    showLoading("يقوم الذكاء الاصطناعي الآن بقراءة الامتحان وفحص الـ 67 محاضرة لمطابقة الأسئلة بالمنهج...");
    
    const formData = new FormData();
    formData.append('block_id', currentBlockId);
    if (rawText) formData.append('content', rawText);
    if (selectedPastPaperFile) formData.append('file', selectedPastPaperFile);

    try {
        const res = await fetch('/api/past_papers/match', {
            method: 'POST',
            body: formData
        });
        const data = await res.json();
        hideLoading();

        matchedPastQuestions = data.matched_questions || [];
        renderMatchedPastQuestions();
    } catch (e) {
        hideLoading();
        alert("خطأ: " + e);
    }
}

function renderMatchedPastQuestions() {
    const container = document.getElementById('filteredResultsList');
    const approveBtn = document.getElementById('btnApproveQuestions');
    container.innerHTML = '';

    if (matchedPastQuestions.length === 0) {
        container.innerHTML = `<div class="empty-state-card">لم يتم العثور على أسئلة مطابقة واضحة لهذا المنهج.</div>`;
        approveBtn.style.display = 'none';
        return;
    }

    approveBtn.style.display = 'block';

    matchedPastQuestions.forEach((q, idx) => {
        const div = document.createElement('div');
        div.className = 'case-scenario-box';
        div.style.marginBottom = '12px';
        div.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                <label style="cursor:pointer; display:flex; align-items:center; gap:8px;">
                    <input type="checkbox" class="past-q-chk" data-idx="${idx}" checked>
                    <span class="todo-tag tag-study">${q.matched_lecture_title || 'محاضرة في المنهج'}</span>
                </label>
                <span style="font-size:11px; color:var(--text-subtle);">الإجابة: (${q.correct_option})</span>
            </div>
            <p><strong>${q.question_text}</strong></p>
            <div style="font-size:12px; color:var(--text-muted); margin-top:4px;">${q.explanation || ''}</div>
        `;
        container.appendChild(div);
    });
}

async function approveSelectedPastQuestions() {
    const selected = [];
    document.querySelectorAll('.past-q-chk:checked').forEach(chk => {
        const idx = parseInt(chk.getAttribute('data-idx'));
        if (matchedPastQuestions[idx]) {
            selected.push(matchedPastQuestions[idx]);
        }
    });

    if (selected.length === 0) {
        alert("يرجى تحديد سؤال واحد على الأقل للموافقة عليه");
        return;
    }

    showLoading("جاري حفظ الأسئلة المعتمدة في بنوك الأسئلة وإلحاقها بملفات Word للمحاضرات...");
    try {
        const res = await fetch('/api/past_papers/approve_and_save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                approved_questions: selected,
                block_id: currentBlockId
            })
        });
        const data = await res.json();
        hideLoading();

        alert(`تم بنجاح اعتماد وحفظ ${data.saved_count} سؤال وإضافتها لملفات Word لكل محاضرة بنجاح!`);
        document.getElementById('btnApproveQuestions').style.display = 'none';
        matchedPastQuestions = [];
        renderMatchedPastQuestions();
    } catch (e) {
        hideLoading();
        alert("خطأ: " + e);
    }
}

// ----------------- SETTINGS & UTILITIES -----------------
function toggleProviderSettingsFields() {
    const provider = document.getElementById('settingAiProvider')?.value || 'gemini';
    const geminiBlock = document.getElementById('geminiSettingsBlock');
    const groqBlock = document.getElementById('groqSettingsBlock');
    const ollamaBlock = document.getElementById('ollamaSettingsBlock');

    if (geminiBlock) geminiBlock.style.display = (provider === 'gemini') ? 'block' : 'none';
    if (groqBlock) groqBlock.style.display = (provider === 'groq') ? 'block' : 'none';
    if (ollamaBlock) ollamaBlock.style.display = (provider === 'ollama') ? 'block' : 'none';
}
window.toggleProviderSettingsFields = toggleProviderSettingsFields;

async function loadAppSettings() {
    try {
        const res = await fetch('/api/settings');
        const data = await res.json();
        if (data && data.settings) {
            const providerSelect = document.getElementById('settingAiProvider');
            const apiKeyInput = document.getElementById('settingApiKey');
            const groqKeyInput = document.getElementById('settingGroqApiKey');
            const modelSelect = document.getElementById('settingPrimaryModel');
            
            if (providerSelect && data.settings.ai_provider) {
                providerSelect.value = data.settings.ai_provider;
            }
            if (apiKeyInput && data.settings.gemini_api_key) {
                apiKeyInput.value = data.settings.gemini_api_key;
            }
            if (groqKeyInput && data.settings.groq_api_key) {
                groqKeyInput.value = data.settings.groq_api_key;
            }
            if (modelSelect && data.settings.primary_model) {
                modelSelect.value = data.settings.primary_model;
            }
            toggleProviderSettingsFields();
        }
    } catch (e) {
        console.error("Failed to load app settings:", e);
    }
}

async function saveAppSettings() {
    const provider = document.getElementById('settingAiProvider')?.value || 'gemini';
    const key = document.getElementById('settingApiKey')?.value?.trim() || '';
    const groqKey = document.getElementById('settingGroqApiKey')?.value?.trim() || '';
    const model = document.getElementById('settingPrimaryModel')?.value || 'gemini-3.6-flash';

    const payload = {
        ai_provider: provider,
        primary_model: model,
        gemini_api_key: key,
        groq_api_key: groqKey
    };

    try {
        const res = await fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data && data.success) {
            if (typeof showNotification === 'function') {
                showNotification("تم حفظ إعدادات الذكاء الاصطناعي بنجاح! تم اعتماد المزود والنموذج.", "success");
            } else {
                alert("تم حفظ إعدادات الذكاء الاصطناعي بنجاح! تم اعتماد المزود والنموذج.");
            }
        } else {
            alert("حدث خطأ أثناء حفظ الإعدادات: " + (data.error || ""));
        }
    } catch (e) {
        alert("فشل الاتصال بالخادم: " + e);
    }
}

async function testAiConnectionFromUI() {
    const btn = document.getElementById('btnTestAiConnection');
    const resultBox = document.getElementById('aiTestResultBox');
    if (!resultBox) return;

    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري فحص الاتصال بالذكاء الاصطناعي...';
    }

    resultBox.style.display = 'block';
    resultBox.innerHTML = `
        <div style="background: rgba(59, 130, 246, 0.08); border: 1px solid rgba(59, 130, 246, 0.25); border-radius: 8px; padding: 12px; font-size: 13px; color: #93c5fd; display: flex; align-items: center; gap: 10px;">
            <i class="fa-solid fa-circle-notch fa-spin"></i> يتم إرسال طلب تجريبي واختبار سرعة الاستجابة...
        </div>
    `;

    try {
        const res = await fetch('/api/ai/test', { method: 'POST' });
        const data = await res.json();

        if (data.success) {
            resultBox.innerHTML = `
                <div style="background: rgba(16, 185, 129, 0.12); border: 1px solid #10b981; border-radius: 8px; padding: 14px; font-size: 13px; color: #a7f3d0; line-height: 1.6;">
                    <div style="font-weight: 700; font-size: 14px; margin-bottom: 4px; display: flex; align-items: center; gap: 8px;">
                        <i class="fa-solid fa-circle-check" style="color: #10b981; font-size: 16px;"></i>
                        <span>الاتصال بالذكاء الاصطناعي سليم ونشط بنسبة 100%!</span>
                    </div>
                    <div><strong>المزود الحالي:</strong> ${data.provider || 'gemini'} | <strong>النموذج النشط:</strong> <code style="background: rgba(0,0,0,0.3); padding: 2px 6px; border-radius: 4px; color: #6ee7b7;">${data.model}</code></div>
                    <div style="margin-top: 4px;"><strong>سرعة الاستجابة:</strong> <span style="color: #6ee7b7; font-weight: 700;">${data.latency_ms} مللي ثانية</span> ⚡</div>
                </div>
            `;
        } else {
            resultBox.innerHTML = `
                <div style="background: rgba(239, 68, 68, 0.12); border: 1px solid #ef4444; border-radius: 8px; padding: 14px; font-size: 13px; color: #fca5a5; line-height: 1.6;">
                    <div style="font-weight: 700; font-size: 14px; margin-bottom: 4px; display: flex; align-items: center; gap: 8px;">
                        <i class="fa-solid fa-triangle-exclamation" style="color: #ef4444; font-size: 16px;"></i>
                        <span>تعذر إتمام اختبار الاتصال</span>
                    </div>
                    <div style="margin-bottom: 8px;">${data.message || data.error}</div>
                    <div style="font-size: 12px; color: #cbd5e1; border-top: 1px dashed rgba(255,255,255,0.15); padding-top: 8px;">
                        💡 <strong>حلول بديلة مجانية:</strong>
                        <ul style="margin: 4px 0 0 20px; padding: 0;">
                            <li>يمكنك التبديل إلى مزود <strong>Groq Cloud AI</strong> المجاني تماماً (Llama 3.3 70B) عبر القائمة المنسدلة بالأعلى.</li>
                            <li>أو إنشاء مفتاح Google AI Studio مجاني جديد وفوري.</li>
                        </ul>
                    </div>
                </div>
            `;
        }
    } catch (e) {
        resultBox.innerHTML = `
            <div style="background: rgba(239, 68, 68, 0.12); border: 1px solid #ef4444; border-radius: 8px; padding: 12px; font-size: 13px; color: #fca5a5;">
                <i class="fa-solid fa-circle-xmark"></i> خطأ في الشبكة أو الخادم: ${e.message}
            </div>
        `;
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-stethoscope"></i> فحص واختبار اتصال الذكاء الاصطناعي الآن';
        }
    }
}
window.testAiConnectionFromUI = testAiConnectionFromUI;

async function triggerFactoryResetApp() {
    const c1 = confirm(
        "⚠️ تحذير شديد الأهمية:\n\n" +
        "أنت على وشك إعادة ضبط المصنع ومسح كافة بيانات التطبيق بالكامل:\n" +
        "• حذف جميع المحاضرات وملفات الـ PDF.\n" +
        "• حذف كافة بنوك الأسئلة ونتائج الامتحانات.\n" +
        "• حذف كافة الكروت الذكية (Flashcards).\n" +
        "• حذف التسجيلات الصوتية والتفريغات وملفات الامتحانات السابقة.\n\n" +
        "ملحوظة: سيتم الحفاظ بأمان على مفتاح Gemini API وإعدادات النماذج واللغة والوضع الداكن.\n\n" +
        "هل أنت متأكد تماماً وتريد المتابعة؟"
    );
    if (!c1) return;

    const phrase = prompt("للتأكيد النهائي، اكتب كلمة 'تصفير' أو 'reset' في المربع أدناه:");
    if (!phrase || (phrase.trim() !== 'تصفير' && phrase.trim().toLowerCase() !== 'reset')) {
        alert("تم إلغاء عملية إعادة ضبط المصنع.");
        return;
    }

    showLoading("جاري إعادة ضبط المصنع وتصفير بيانات التطبيق...", "يرجى الانتظار لحظات");

    try {
        const res = await fetch('/api/settings/reset_data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await res.json();
        hideLoading();

        if (res.ok && data.success) {
            alert("تمت إعادة ضبط المصنع بنجاح! سيتم الآن إعادة تحميل التطبيق نظيفاً تماماً كأنك تستخدمه لأول مرة.");
            window.location.reload();
        } else {
            alert(data.error || "حدث خطأ أثناء محاولة تصفير البيانات.");
        }
    } catch (e) {
        hideLoading();
        alert("فشل الاتصال بالخادم لإعادة ضبط المصنع: " + (e.message || e));
    }
}

function showFullscreenImage(url) {
    const imgEl = document.getElementById('fullscreenImageSrc');
    if (imgEl) imgEl.src = url;
    const infoEl = document.getElementById('imageModalSlideInfo');
    if (infoEl) infoEl.innerHTML = `<i class="fa-solid fa-file-image text-primary"></i> عرض الصورة`;
    const newTabBtn = document.getElementById('imageModalNewTabBtn');
    if (newTabBtn) newTabBtn.href = url;
    const prevBtn = document.getElementById('imageModalPrevBtn');
    if (prevBtn) prevBtn.style.visibility = 'hidden';
    const nextBtn = document.getElementById('imageModalNextBtn');
    if (nextBtn) nextBtn.style.visibility = 'hidden';
    const modal = document.getElementById('imagePreviewModal');
    if (modal) modal.style.display = 'flex';
}

// Keyboard shortcuts for image slide preview
document.addEventListener('keydown', (e) => {
    const modal = document.getElementById('imagePreviewModal');
    if (modal && modal.style.display === 'flex') {
        if (e.key === 'Escape') {
            closeModal('imagePreviewModal');
        } else if (e.key === 'ArrowLeft') {
            navigateSlidePreview(1);
        } else if (e.key === 'ArrowRight') {
            navigateSlidePreview(-1);
        }
    }
});

function handleGlobalSearch(e) {
    const q = e.target.value.toLowerCase().trim();
    if (!q) {
        renderLecturesGrid();
        return;
    }
    const filtered = allLectures.filter(l => 
        l.title.toLowerCase().includes(q) || 
        l.subject.toLowerCase().includes(q)
    );
    const grid = document.getElementById('lecturesGrid');
    grid.innerHTML = '';
    filtered.forEach(lec => {
        const card = document.createElement('div');
        card.className = 'lecture-card';
        card.innerHTML = `
            <div class="lec-header">
                <span class="lec-num">#${lec.lecture_number}</span>
                <span class="lec-subject">${lec.subject}</span>
            </div>
            <div class="lec-title">${lec.title}</div>
            <div class="lec-actions">
                <button class="btn btn-primary" style="grid-column: span 2;" onclick="openLectureStudyCenter(${lec.id})">
                    <i class="fa-solid fa-book-open-reader"></i> افتح مركز المذاكرة والأسئلة
                </button>
            </div>
        `;
        grid.appendChild(card);
    });
}

// ==========================================
// EXAM AI FILTER & PDF OCR MATCHER ENGINE
// ==========================================
let allFilterLecturesList = [];
let currentAllQuestions = [];
let currentMatchedQuestions = [];
let currentRejectedQuestions = [];
let currentExamStats = {};
let allExamSourcesList = [];
let selectedExamSourceFiles = new Set();
let activeQuestionsTab = 'all';

const EXAM_SUBJECT_COLORS = {
    'Anatomy & Embryology': '#60a5fa',
    'Physiology': '#f43f5e',
    'Pharmacology': '#10b981',
    'Histology': '#a855f7',
    'Microbiology': '#f59e0b',
    'Pathology': '#ef4444',
    'Parasitology': '#14b8a6',
    'Biochemistry': '#ec4899',
    'General Medicine': '#8b5cf6'
};

async function loadExamSources() {
    try {
        const res = await fetch('/api/exam_sources');
        const data = await res.json();
        allExamSourcesList = data.sources || [];

        // Auto-select files if no selection has been made yet
        if (selectedExamSourceFiles.size === 0) {
            allExamSourcesList.forEach(s => selectedExamSourceFiles.add(s.filename));
        }

        renderExamSourcesGrid();

        const totalBadge = document.getElementById('totalCachedPagesCount');
        if (totalBadge) totalBadge.innerText = data.total_cached_pages || 0;
        updateSelectedSourcesBadge();
    } catch (e) {
        console.error('Error loading exam sources:', e);
    }
}

function renderExamSourcesGrid() {
    const container = document.getElementById('examSourcesGrid');
    if (!container) return;

    container.innerHTML = '';
    if (allExamSourcesList.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 24px 15px; border: 1px dashed rgba(255,255,255,0.1); border-radius: 8px; background: rgba(255,255,255,0.01);">
                <i class="fa-solid fa-file-pdf fa-2x" style="color: #64748b; margin-bottom: 8px;"></i>
                <div style="font-weight: 600; font-size: 13.5px; color: var(--text-main);">لم تقم برفع أي ملف امتحان بعد</div>
                <div style="font-size: 12px; margin-top: 4px; color: var(--text-muted);">انقر على الصندوق أعلاه أو اسحب ملفات الـ PDF لامتحاناتك للبدء فوراً.</div>
            </div>
        `;
        return;
    }

    allExamSourcesList.forEach(s => {
        const isSelected = selectedExamSourceFiles.has(s.filename);
        const card = document.createElement('div');
        card.className = `exam-source-card ${isSelected ? 'selected' : ''}`;
        card.setAttribute('data-filename', s.filename);

        card.innerHTML = `
            <input type="checkbox" class="exam-source-chk" value="${encodeURIComponent(s.filename)}" ${isSelected ? 'checked' : ''} onchange="toggleExamSourceSelection('${s.filename.replace(/'/g, "\\'")}')">
            <div class="exam-source-info" onclick="toggleExamSourceSelection('${s.filename.replace(/'/g, "\\'")}')">
                <div class="exam-source-title" title="${s.filename}">
                    <i class="fa-solid fa-file-pdf" style="color: #ef4444; flex-shrink: 0;"></i>
                    <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${s.filename}</span>
                </div>
                <div class="exam-source-meta" style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                    <span>${s.size_mb || 1} MB</span>
                    <span>•</span>
                    <span>${s.total_pages} صفحة</span>
                    <span>•</span>
                    <span style="color: #10b981; font-weight: 600;"><i class="fa-solid fa-check"></i> ${s.cached_pages || s.total_pages} ص بالكاش</span>
                    ${(s.extracted_questions_count && s.extracted_questions_count > 0) ? `
                        <span>•</span>
                        <span style="color: #38bdf8; font-weight: 700; background: rgba(56, 189, 248, 0.12); padding: 2px 8px; border-radius: 6px;"><i class="fa-solid fa-box-archive"></i> ${s.extracted_questions_count} مفرغ بالكاش ⚡</span>
                        <button type="button" class="btn btn-xs btn-outline" style="font-size: 11px; padding: 2px 8px; border-radius: 4px;" onclick="event.stopPropagation(); openFileCachedQuestionsModal('${s.filename.replace(/'/g, "\\'")}')" title="معاينة الأسئلة المفرغة والمحفوظة من هذا الملف">
                            <i class="fa-solid fa-eye"></i> معاينة الأسئلة
                        </button>
                    ` : ''}
                </div>
            </div>
            <button class="exam-delete-btn" onclick="deleteExamSource('${s.filename.replace(/'/g, "\\'")}')" title="حذف هذا الملف من القائمة">
                <i class="fa-solid fa-trash"></i>
            </button>
        `;
        container.appendChild(card);
    });

    updateSelectedSourcesBadge();
}

function toggleExamSourceSelection(filename) {
    if (selectedExamSourceFiles.has(filename)) {
        selectedExamSourceFiles.delete(filename);
    } else {
        selectedExamSourceFiles.add(filename);
    }

    const cards = document.querySelectorAll('.exam-source-card');
    cards.forEach(c => {
        const fn = c.getAttribute('data-filename');
        if (fn === filename) {
            const chk = c.querySelector('input[type="checkbox"]');
            const isSel = selectedExamSourceFiles.has(filename);
            if (chk) chk.checked = isSel;
            if (isSel) c.classList.add('selected');
            else c.classList.remove('selected');
        }
    });

    updateSelectedSourcesBadge();
}

function selectAllExamSources(select) {
    allExamSourcesList.forEach(s => {
        if (select) {
            selectedExamSourceFiles.add(s.filename);
        } else {
            selectedExamSourceFiles.delete(s.filename);
        }
    });
    renderExamSourcesGrid();
}

function updateSelectedSourcesBadge() {
    const badge = document.getElementById('selectedSourcesBadge');
    if (badge) {
        badge.innerText = `${selectedExamSourceFiles.size} ملفات محددة`;
        badge.style.background = selectedExamSourceFiles.size > 0 ? '#2563eb' : '#64748b';
    }
}

async function handleCustomExamUpload(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
    }

    showLoading(`جاري رفع وفهرسة (${files.length}) ملف امتحان...`, "يتم الآن استخراج نصوص صفحات الامتحان بالذكاء الاصطناعي وحفظها بالكاش للمقارنة السريعة");
    try {
        const res = await fetch('/api/exam_sources/upload', {
            method: 'POST',
            body: formData
        });
        const data = await res.json();
        hideLoading();

        if (!res.ok || !data.success) {
            alert(data.error || 'فشل رفع الملفات.');
            return;
        }

        (data.uploaded || []).forEach(item => {
            selectedExamSourceFiles.add(item.filename);
        });

        showToast({
            type: 'success',
            title: 'تم رفع وفهرسة الملفات بنجاح 🎉',
            message: `تمت إضافة (${(data.uploaded || []).length}) ملف بنجاح في مصادر الامتحانات.`
        });
        await loadExamSources();
    } catch (e) {
        hideLoading();
        console.error('Upload exam error:', e);
        alert('حدث خطأ أثناء رفع الملفات: ' + e.message);
    } finally {
        event.target.value = '';
    }
}

async function deleteExamSource(filename) {
    if (!confirm(`هل تريد بالتأكيد حذف ملف الامتحان "${filename}" ومسح كاش صفحاته؟`)) {
        return;
    }
    try {
        showLoading(`جاري حذف ${filename}...`, "يرجى الانتظار");
        const res = await fetch('/api/exam_sources/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filename })
        });
        const data = await res.json();
        hideLoading();
        if (res.ok && data.success) {
            selectedExamSourceFiles.delete(filename);
            showToast({
                type: 'info',
                title: 'تم الحذف',
                message: `تم حذف ملف ${filename} بنجاح.`
            });
            await loadExamSources();
        } else {
            alert(data.error || 'فشل حذف الملف');
        }
    } catch (e) {
        hideLoading();
        console.error('Delete exam error:', e);
        alert('حدث خطأ أثناء الحذف: ' + e.message);
    }
}

async function clearAllExamSources() {
    if (allExamSourcesList.length === 0) {
        alert('لا توجد ملفات امتحانات لحذفها.');
        return;
    }
    if (!confirm("هل أنت متأكد من رغبتك في حذف جميع ملفات الامتحانات المرفوعة ومسح الكاش بالكامل؟")) {
        return;
    }
    try {
        showLoading("جاري مسح جميع ملفات الامتحانات...", "يرجى الانتظار");
        const res = await fetch('/api/exam_sources/clear_all', { method: 'POST' });
        const data = await res.json();
        hideLoading();
        if (res.ok && data.success) {
            selectedExamSourceFiles.clear();
            showToast({
                type: 'info',
                title: 'تم مسح جميع الملفات',
                message: 'تم إفراغ مصادر الامتحانات بنجاح.'
            });
            await loadExamSources();
        } else {
            alert(data.error || 'فشل مسح الملفات');
        }
    } catch (e) {
        hideLoading();
        console.error('Clear all error:', e);
        alert('حدث خطأ أثناء مسح الملفات: ' + e.message);
    }
}

// Attach Drag & Drop listeners to examDropZone
function initExamDropZone() {
    const dropZone = document.getElementById('examDropZone');
    if (!dropZone) return;

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.add('dragover');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.remove('dragover');
        }, false);
    });

    dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files && files.length > 0) {
            const input = document.getElementById('customExamFileInput');
            if (input) {
                input.files = files;
                handleCustomExamUpload({ target: { files: files, value: '' } });
            }
        }
    }, false);
}

// Initialize on DOM load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initExamDropZone);
} else {
    initExamDropZone();
}

async function loadFilterLectures() {
    try {
        if (!allLectures || allLectures.length === 0) {
            const res = await fetch('/api/lectures?block_id=1');
            const data = await res.json();
            allFilterLecturesList = data.lectures || [];
        } else {
            allFilterLecturesList = allLectures;
        }
        renderFilterLecturesChecklist();
    } catch (e) {
        console.error('Error loading filter lectures:', e);
    }
}

function renderFilterLecturesChecklist() {
    const container = document.getElementById('filterLecturesChecklist');
    if (!container) return;

    const searchQ = (document.getElementById('filterLectureSearchInput')?.value || '').toLowerCase().trim();
    const subjectFilter = document.getElementById('filterSubjectSelect')?.value || 'Physiology';

    container.innerHTML = '';

    const filtered = allFilterLecturesList.filter(l => {
        const matchesSub = (subjectFilter === 'All') || (l.subject && l.subject.toLowerCase() === subjectFilter.toLowerCase());
        const matchesQ = (!searchQ) || 
                         (l.title && l.title.toLowerCase().includes(searchQ)) || 
                         (l.subject && l.subject.toLowerCase().includes(searchQ)) || 
                         String(l.lecture_number).includes(searchQ);
        return matchesSub && matchesQ;
    });

    if (filtered.length === 0) {
        container.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 30px 10px; font-size: 13px;">لا توجد محاضرات مطابقة للبحث أو للمادة المختارة</div>';
        return;
    }

    // Clean, flat list of lectures just like Physiology was!
    filtered.forEach(lec => {
        const row = document.createElement('label');
        row.className = 'filter-lec-row';
        row.style.cssText = 'display: flex; align-items: center; gap: 10px; padding: 8px 12px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 6px; cursor: pointer; transition: background 0.15s; user-select: none; margin-bottom: 4px;';
        row.onmouseover = () => row.style.background = 'rgba(59, 130, 246, 0.1)';
        row.onmouseout = () => row.style.background = 'rgba(255,255,255,0.02)';

        const subjColor = EXAM_SUBJECT_COLORS[lec.subject] || '#60a5fa';

        row.innerHTML = `
            <input type="checkbox" class="filter-lec-checkbox" data-subject="${(lec.subject || '').replace(/"/g, '&quot;')}" value="${lec.id}" data-title="${encodeURIComponent(lec.title)}" onchange="updateSelectedLecturesBadge()" style="width: 16px; height: 16px; accent-color: #2563eb; cursor: pointer;">
            <div style="flex: 1; min-width: 0;">
                <div style="font-size: 12.5px; font-weight: 600; color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    <span style="color: #60a5fa;">#${lec.lecture_number}</span> ${lec.title}
                </div>
                <div style="font-size: 11px; color: var(--text-muted); display: flex; gap: 8px; margin-top: 3px; align-items: center;">
                    <span style="color: ${subjColor}; font-weight: 600;">${lec.subject}</span>
                    <span>•</span>
                    <span>${lec.page_count || 10} ص</span>
                </div>
            </div>
        `;
        container.appendChild(row);
    });

    updateSelectedLecturesBadge();
}

function onFilterSubjectChange(subj) {
    renderFilterLecturesChecklist();
}

function filterLecturesChecklist() {
    renderFilterLecturesChecklist();
}

function selectAllFilterLectures(select) {
    const checkboxes = document.querySelectorAll('.filter-lec-checkbox');
    checkboxes.forEach(cb => cb.checked = select);
    updateSelectedLecturesBadge();
}

function updateSelectedLecturesBadge() {
    const checked = document.querySelectorAll('.filter-lec-checkbox:checked');
    const badge = document.getElementById('selectedLecturesBadge');
    if (badge) {
        badge.innerText = `${checked.length} محددة`;
        badge.style.background = checked.length > 0 ? '#10b981' : '#64748b';
    }
}

function getSelectedFilterLectureIds() {
    const checked = document.querySelectorAll('.filter-lec-checkbox:checked');
    return Array.from(checked).map(cb => parseInt(cb.value)).filter(id => !isNaN(id));
}

async function runAIExamMatcher(forceReextract = false) {
    const lectureIds = getSelectedFilterLectureIds();
    if (lectureIds.length === 0) {
        alert('⚠️ يرجى تحديد محاضرة واحدة على الأقل من القائمة الجانبية لمطابقة الأسئلة معها.');
        return;
    }

    if (allExamSourcesList.length === 0) {
        alert('⚠️ يرجى رفع ملف امتحان أولاً من صندوق الرفع أعلاه للبدء.');
        return;
    }

    const sourceFiles = Array.from(selectedExamSourceFiles);
    if (sourceFiles.length === 0) {
        alert('⚠️ يرجى اختيار وتحديد ملف امتحان واحد على الأقل من القائمة أعلاه للمقارنة معه.');
        return;
    }

    const btn = document.getElementById('startExamMatchBtn');
    const prevText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${forceReextract ? 'جاري إعادة مسح وتفريغ الملف بالـ AI...' : 'جاري الفحص والمطابقة السريعة...'}`;

    showLoading(
        forceReextract 
            ? `جاري إعادة فحص وتفريغ كل أسئلة الامتحان (${sourceFiles.length}) ملف بالذكاء الاصطناعي من الصفر...`
            : `جاري فحص ومطابقة أسئلة الامتحان (${sourceFiles.length}) ملف مع المحاضرات المحددة...`,
        "يتم البحث في كاش الأسئلة المفرغة والمحفوظة لتوفير التوكينز وإنجاز الفحص فورياً، وتوثيق موضع السؤال وأسباب الرفض"
    );

    try {
        const res = await fetch('/api/exam_questions/match', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                lecture_ids: lectureIds,
                source_files: sourceFiles,
                max_questions: 50,
                force_reextract: forceReextract
            })
        });

        const data = await res.json();
        hideLoading();
        btn.disabled = false;
        btn.innerHTML = prevText;

        if (!res.ok || !data.success) {
            alert(data.error || 'حدث خطأ أثناء مطابقة الأسئلة.');
            return;
        }

        currentMatchedQuestions = data.questions || [];
        currentRejectedQuestions = data.rejected_questions || [];
        currentAllQuestions = data.all_questions || [...currentMatchedQuestions, ...currentRejectedQuestions];
        currentExamStats = data.stats || {};
        activeQuestionsTab = 'all';

        // Refresh source list to update extracted questions badges
        loadExamSources();

        renderMatchedQuestions(currentAllQuestions, currentMatchedQuestions, currentRejectedQuestions, data.lectures || [], currentExamStats, data.from_cache);
    } catch (e) {
        hideLoading();
        btn.disabled = false;
        btn.innerHTML = prevText;
        console.error('Error running AI exam matcher:', e);
        alert('تعذر الاتصال بمحرك الذكاء الاصطناعي: ' + e.message);
    }
}

function switchQuestionsResultsTab(tabName) {
    activeQuestionsTab = tabName;
    const allTabBtn = document.getElementById('tabBtnAllQuestions');
    const acceptedTabBtn = document.getElementById('tabBtnAcceptedQuestions');
    const rejectedTabBtn = document.getElementById('tabBtnRejectedQuestions');
    const allContainer = document.getElementById('allQuestionsFeed');
    const acceptedContainer = document.getElementById('acceptedQuestionsFeed');
    const rejectedContainer = document.getElementById('rejectedQuestionsFeed');

    const inactiveStyle = 'background: rgba(255,255,255,0.05); color: var(--text-muted); border: 1px solid rgba(255,255,255,0.1);';
    if (allTabBtn) allTabBtn.style.cssText = inactiveStyle + ' padding: 8px 16px; border-radius: 6px; font-weight: 700; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all 0.15s;';
    if (acceptedTabBtn) acceptedTabBtn.style.cssText = inactiveStyle + ' padding: 8px 16px; border-radius: 6px; font-weight: 700; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all 0.15s;';
    if (rejectedTabBtn) rejectedTabBtn.style.cssText = inactiveStyle + ' padding: 8px 16px; border-radius: 6px; font-weight: 700; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all 0.15s;';

    if (allContainer) allContainer.style.display = 'none';
    if (acceptedContainer) acceptedContainer.style.display = 'none';
    if (rejectedContainer) rejectedContainer.style.display = 'none';

    if (tabName === 'all') {
        if (allTabBtn) {
            allTabBtn.style.background = '#4f46e5';
            allTabBtn.style.color = '#ffffff';
            allTabBtn.style.border = '1px solid #4f46e5';
        }
        if (allContainer) allContainer.style.display = 'flex';
    } else if (tabName === 'accepted') {
        if (acceptedTabBtn) {
            acceptedTabBtn.style.background = '#10b981';
            acceptedTabBtn.style.color = '#ffffff';
            acceptedTabBtn.style.border = '1px solid #10b981';
        }
        if (acceptedContainer) acceptedContainer.style.display = 'flex';
    } else if (tabName === 'rejected') {
        if (rejectedTabBtn) {
            rejectedTabBtn.style.background = '#ef4444';
            rejectedTabBtn.style.color = '#ffffff';
            rejectedTabBtn.style.border = '1px solid #ef4444';
        }
        if (rejectedContainer) rejectedContainer.style.display = 'flex';
    }
}

function renderMatchedQuestions(allQuestions, acceptedQuestions, rejectedQuestions, targetLectures, stats = {}, fromCache = false) {
    const container = document.getElementById('filteredResultsList');
    const toolbar = document.getElementById('matchedActionsToolbar');
    const subtext = document.getElementById('matchedResultsSubtext');

    const totalScanned = stats.total_scanned !== undefined ? stats.total_scanned : (allQuestions ? allQuestions.length : 0);
    const acceptedCount = stats.accepted !== undefined ? stats.accepted : (acceptedQuestions ? acceptedQuestions.length : 0);
    const rejectedCount = stats.rejected !== undefined ? stats.rejected : (rejectedQuestions ? rejectedQuestions.length : 0);
    const acceptanceRate = stats.acceptance_rate || ((totalScanned > 0 ? Math.round((acceptedCount / totalScanned) * 100) : 100) + '%');

    if (!allQuestions || allQuestions.length === 0) {
        if (toolbar) toolbar.style.display = 'none';
        if (subtext) subtext.innerText = 'لم يتم العثور على أسئلة في صفحات الامتحان المفحوصة.';
        container.innerHTML = `
            <div class="empty-state-card" style="text-align: center; padding: 40px;">
                <i class="fa-solid fa-circle-question fa-3x text-muted mb-2"></i>
                <h4>لم يتم العثور على أسئلة مباشرة</h4>
                <p style="color: var(--text-muted); font-size: 13px;">جرب رفع ملف امتحان يحتوي على أسئلة أو تحديد محاضرات أخرى.</p>
            </div>
        `;
        return;
    }

    if (toolbar) toolbar.style.display = acceptedQuestions.length > 0 ? 'flex' : 'none';
    if (subtext) subtext.innerHTML = `تم استخراج <strong>(${totalScanned}) سؤال</strong> من ملف الامتحان، وتصنيفها مع توثيق أدلة المنهج وأسباب الرفض.`;

    container.innerHTML = '';
    window.currentAcceptedQuestions = acceptedQuestions;
    window.currentExamAllQuestions = allQuestions;

    // Cache Notice Banner
    const cacheBanner = document.createElement('div');
    if (fromCache) {
        cacheBanner.style.cssText = 'display: flex; justify-content: space-between; align-items: center; background: rgba(16, 185, 129, 0.12); border: 1.5px solid #10b981; border-radius: 10px; padding: 10px 16px; margin-bottom: 12px; flex-wrap: wrap; gap: 10px;';
        cacheBanner.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <span class="badge" style="background: #10b981; color: white; font-weight: 700; font-size: 12px; padding: 4px 10px; border-radius: 6px;"><i class="fa-solid fa-bolt"></i> فوري من الكاش</span>
                <span style="font-size: 13px; font-weight: 600; color: #a7f3d0;">تم استرجاع وتصنيف هذه الأسئلة فورياً من الكاش المحفوظ دون استهلاك توكينز الـ AI!</span>
            </div>
            <button class="btn btn-xs btn-outline" style="font-size: 12px; padding: 5px 12px; border-color: rgba(255,255,255,0.25);" onclick="runAIExamMatcher(true)" title="إعادة مسح وتفريغ ملف الامتحان بالكامل بواسطة الذكاء الاصطناعي من البداية">
                <i class="fa-solid fa-arrows-rotate"></i> إعادة تفريغ كامل بالـ AI
            </button>
        `;
    } else {
        cacheBanner.style.cssText = 'display: flex; justify-content: space-between; align-items: center; background: rgba(59, 130, 246, 0.1); border: 1.5px solid rgba(59, 130, 246, 0.35); border-radius: 10px; padding: 10px 16px; margin-bottom: 12px; flex-wrap: wrap; gap: 10px;';
        cacheBanner.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <span class="badge" style="background: #2563eb; color: white; font-weight: 700; font-size: 12px; padding: 4px 10px; border-radius: 6px;"><i class="fa-solid fa-database"></i> تم الحفظ في الكاش</span>
                <span style="font-size: 13px; font-weight: 600; color: #bfdbfe;">تم تفريغ وحفظ جميع الأسئلة (${totalScanned} سؤال) في قاعدة البيانات؛ ولن تحتاج لإعادة تفريغ هذا الملف مجدداً! ⚡</span>
            </div>
            <button class="btn btn-xs btn-outline" style="font-size: 12px; padding: 5px 12px; border-color: rgba(255,255,255,0.25);" onclick="runAIExamMatcher(true)" title="إعادة تفريغ بالكامل">
                <i class="fa-solid fa-arrows-rotate"></i> إعادة تفريغ كامل
            </button>
        `;
    }
    container.appendChild(cacheBanner);

    // 1. STATS OVERVIEW CARDS
    const statsCard = document.createElement('div');
    statsCard.style.cssText = 'background: rgba(15, 23, 42, 0.75); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 14px 18px; margin-bottom: 8px;';
    statsCard.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; align-items: center;">
            <div style="background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.25); border-radius: 8px; padding: 10px 14px; text-align: center; cursor: pointer;" onclick="switchQuestionsResultsTab('all')">
                <div style="font-size: 11.5px; color: #a5b4fc; font-weight: 600;"><i class="fa-solid fa-list-check"></i> كل الأسئلة في الملف</div>
                <div style="font-size: 20px; font-weight: 800; color: #818cf8; margin-top: 4px;">${totalScanned} <span style="font-size: 12px; font-weight: normal;">سؤال</span></div>
            </div>
            <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 8px; padding: 10px 14px; text-align: center; cursor: pointer;" onclick="switchQuestionsResultsTab('accepted')">
                <div style="font-size: 11.5px; color: #6ee7b7; font-weight: 600;"><i class="fa-solid fa-circle-check"></i> الأسئلة المقبولة والمطابقة</div>
                <div style="font-size: 20px; font-weight: 800; color: #10b981; margin-top: 4px;">${acceptedCount} <span style="font-size: 12px; font-weight: normal;">سؤال (${acceptanceRate})</span></div>
            </div>
            <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.25); border-radius: 8px; padding: 10px 14px; text-align: center; cursor: pointer;" onclick="switchQuestionsResultsTab('rejected')">
                <div style="font-size: 11.5px; color: #fca5a5; font-weight: 600;"><i class="fa-solid fa-circle-xmark"></i> الأسئلة المرفوضة وسبب الرفض</div>
                <div style="font-size: 20px; font-weight: 800; color: #ef4444; margin-top: 4px;">${rejectedCount} <span style="font-size: 12px; font-weight: normal;">سؤال</span></div>
            </div>
        </div>
    `;
    container.appendChild(statsCard);

    // 2. TOGGLE TABS BAR (كل الأسئلة vs المقبولة vs المرفوضة)
    const tabsBar = document.createElement('div');
    tabsBar.style.cssText = 'display: flex; gap: 8px; margin-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 10px; flex-wrap: wrap;';
    tabsBar.innerHTML = `
        <button id="tabBtnAllQuestions" onclick="switchQuestionsResultsTab('all')" style="background: #4f46e5; color: white; border: 1px solid #4f46e5; padding: 8px 16px; border-radius: 6px; font-weight: 700; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all 0.15s;">
            <i class="fa-solid fa-list-check"></i>
            <span>كل أسئلة الملف (${totalScanned})</span>
        </button>
        <button id="tabBtnAcceptedQuestions" onclick="switchQuestionsResultsTab('accepted')" style="background: rgba(255,255,255,0.05); color: var(--text-muted); border: 1px solid rgba(255,255,255,0.1); padding: 8px 16px; border-radius: 6px; font-weight: 700; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all 0.15s;">
            <i class="fa-solid fa-circle-check"></i>
            <span>الأسئلة المقبولة وموضعها بالمنهج (${acceptedCount})</span>
        </button>
        <button id="tabBtnRejectedQuestions" onclick="switchQuestionsResultsTab('rejected')" style="background: rgba(255,255,255,0.05); color: var(--text-muted); border: 1px solid rgba(255,255,255,0.1); padding: 8px 16px; border-radius: 6px; font-weight: 700; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all 0.15s;">
            <i class="fa-solid fa-circle-xmark"></i>
            <span>الأسئلة المرفوضة وسبب الرفض (${rejectedCount})</span>
        </button>
    `;
    container.appendChild(tabsBar);

    function buildOptionsHtml(q, idxPrefix) {
        const correctLetter = (q.correct_option || 'A').toUpperCase().trim();
        const optionsList = [
            { key: 'A', text: q.option_a },
            { key: 'B', text: q.option_b },
            { key: 'C', text: q.option_c },
            { key: 'D', text: q.option_d }
        ].filter(o => o.text && o.text.trim());

        let html = '';
        optionsList.forEach(opt => {
            const isCorrect = (opt.key === correctLetter);
            html += `
                <div class="matched-opt-item ${isCorrect ? 'is-correct' : ''}" 
                     style="display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-radius: 8px; background: ${isCorrect ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255,255,255,0.03)'}; border: 1px solid ${isCorrect ? '#10b981' : 'rgba(255,255,255,0.08)'}; cursor: pointer;"
                     onclick="checkMatchedAnswer(this, '${opt.key}', '${correctLetter}', '${idxPrefix}')">
                    <span style="font-weight: 700; width: 24px; height: 24px; display: inline-flex; align-items: center; justify-content: center; border-radius: 50%; background: ${isCorrect ? '#10b981' : 'rgba(255,255,255,0.1)'}; color: white; font-size: 12px;">
                        ${opt.key}
                    </span>
                    <span style="flex: 1; font-size: 13px; color: ${isCorrect ? '#6ee7b7' : 'var(--text-main)'}; font-weight: ${isCorrect ? '600' : 'normal'};">
                        ${opt.text} ${isCorrect ? '<strong>*</strong>' : ''}
                    </span>
                    ${isCorrect ? '<span style="color: #10b981; font-size: 12px; font-weight: 700;"><i class="fa-solid fa-check"></i> الإجابة الصحيحة (*)</span>' : ''}
                </div>
            `;
        });
        return html;
    }

    // FEED 1: ALL QUESTIONS IN FILE
    const allFeed = document.createElement('div');
    allFeed.id = 'allQuestionsFeed';
    allFeed.style.cssText = 'display: flex; flex-direction: column; gap: 14px;';

    allQuestions.forEach((q, idx) => {
        const isAccepted = q.status === 'accepted';
        const card = document.createElement('div');
        card.style.cssText = `background: rgba(15, 23, 42, 0.7); border: 1px solid ${isAccepted ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.2)'}; border-radius: 10px; padding: 18px; display: flex; flex-direction: column; gap: 12px;`;

        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; flex-wrap: wrap;">
                <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                    <span style="background: #4f46e5; color: white; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 6px;">
                        سؤال [${idx + 1}]
                    </span>
                    ${isAccepted ? `
                        <span style="background: rgba(16, 185, 129, 0.2); color: #6ee7b7; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 6px; display: flex; align-items: center; gap: 4px;">
                            <i class="fa-solid fa-circle-check"></i> مقبول ومطابق للمنهج
                        </span>
                        <span style="background: rgba(13, 148, 136, 0.2); color: #2dd4bf; font-size: 11px; padding: 3px 8px; border-radius: 6px; font-weight: 600;">
                            <i class="fa-solid fa-book-medical"></i> ${q.lecture_title || 'محاضرة محددة'}
                        </span>
                    ` : `
                        <span style="background: rgba(239, 68, 68, 0.2); color: #fca5a5; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 6px; display: flex; align-items: center; gap: 4px;">
                            <i class="fa-solid fa-ban"></i> مستبعد / خارج المحاضرة
                        </span>
                    `}
                    <span style="background: rgba(255,255,255,0.06); color: var(--text-muted); font-size: 11px; padding: 3px 8px; border-radius: 6px;">
                        <i class="fa-solid fa-file-pdf"></i> ${q.source_file || 'ملف الامتحان'} (ص ${q.source_page || 1})
                    </span>
                </div>
                ${isAccepted ? `
                    <button class="btn btn-sm btn-outline" onclick="openStudioFromExamQuestion(${idx}, 'all')" style="padding: 4px 10px; font-size: 11.5px; border-color: rgba(56, 189, 248, 0.4); color: #38bdf8;" title="تعديل هذا السؤال واختيار المحاضرة والدفعة يدوياً">
                        <i class="fa-solid fa-pen-to-square"></i> تخصيص وحفظ في دفعة
                    </button>
                ` : ''}
            </div>

            <div style="font-size: 15px; font-weight: 600; color: var(--text-main); line-height: 1.6;">
                ${q.question_text}
            </div>

            <div style="display: flex; flex-direction: column; gap: 8px;">
                ${buildOptionsHtml(q, `all-${idx}`)}
            </div>

            ${isAccepted && (q.lecture_evidence || q.relevance_reason) ? `
                <div style="padding: 10px 14px; background: rgba(16, 185, 129, 0.1); border-right: 4px solid #10b981; border-radius: 0 8px 8px 0; font-size: 12.5px; line-height: 1.5; color: #a7f3d0;">
                    <strong style="color: #6ee7b7;"><i class="fa-solid fa-book-open"></i> موضع المعلومة في المحاضرة:</strong>
                    <div style="margin-top: 3px; color: #e2e8f0;">${q.lecture_evidence || q.relevance_reason}</div>
                </div>
            ` : ''}

            ${!isAccepted && q.rejection_reason ? `
                <div style="padding: 10px 14px; background: rgba(239, 68, 68, 0.1); border-right: 4px solid #ef4444; border-radius: 0 8px 8px 0; font-size: 12.5px; line-height: 1.5; color: #fca5a5;">
                    <strong style="color: #ef4444;"><i class="fa-solid fa-circle-exclamation"></i> سبب الرفض والاستبعاد:</strong>
                    <div style="margin-top: 3px; color: #fee2e2;">${q.rejection_reason}</div>
                </div>
            ` : ''}

            ${q.explanation ? `
                <div style="padding: 10px 14px; background: rgba(30, 41, 59, 0.5); border-right: 4px solid #3b82f6; border-radius: 0 8px 8px 0; font-size: 12px; line-height: 1.6; color: #cbd5e1;">
                    <strong style="color: #93c5fd;"><i class="fa-solid fa-lightbulb"></i> التعليل الطبي:</strong>
                    <div style="margin-top: 3px;">${q.explanation}</div>
                </div>
            ` : ''}
        `;
        allFeed.appendChild(card);
    });
    container.appendChild(allFeed);

    // FEED 2: ACCEPTED QUESTIONS (WITH PROMINENT LECTURE EVIDENCE)
    const acceptedFeed = document.createElement('div');
    acceptedFeed.id = 'acceptedQuestionsFeed';
    acceptedFeed.style.cssText = 'display: none; flex-direction: column; gap: 14px;';

    if (acceptedQuestions.length === 0) {
        acceptedFeed.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 30px;">لم يتم قبول أي أسئلة تطابق المحاضرات المحددة. يمكنك مراجعة الأسئلة في التبويبات الأخرى.</div>';
    } else {
        acceptedQuestions.forEach((q, idx) => {
            const card = document.createElement('div');
            card.style.cssText = 'background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 10px; padding: 18px; display: flex; flex-direction: column; gap: 12px;';

            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; flex-wrap: wrap;">
                    <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                        <span style="background: #10b981; color: white; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 6px;">
                            سؤال مقبول [${idx + 1}]
                        </span>
                        <span style="background: rgba(13, 148, 136, 0.25); color: #2dd4bf; font-size: 11px; padding: 3px 8px; border-radius: 6px; font-weight: 600;">
                            <i class="fa-solid fa-book-medical"></i> ${q.lecture_title || 'محاضرة محددة'}
                        </span>
                        <span style="background: rgba(255,255,255,0.06); color: var(--text-muted); font-size: 11px; padding: 3px 8px; border-radius: 6px;">
                            <i class="fa-solid fa-file-pdf"></i> ${q.source_file || 'ملف الامتحان'} (ص ${q.source_page || 1})
                        </span>
                    </div>
                    <button class="btn btn-sm btn-outline" onclick="openStudioFromExamQuestion(${idx}, 'accepted')" style="padding: 4px 10px; font-size: 11.5px; border-color: rgba(56, 189, 248, 0.4); color: #38bdf8;" title="تعديل هذا السؤال واختيار المحاضرة والدفعة يدوياً">
                        <i class="fa-solid fa-pen-to-square"></i> تخصيص وحفظ في دفعة
                    </button>
                </div>

                <!-- 📌 PROMINENT LECTURE EVIDENCE CARD -->
                <div style="background: rgba(16, 185, 129, 0.12); border-right: 5px solid #10b981; border-radius: 0 8px 8px 0; padding: 12px 16px;">
                    <strong style="color: #6ee7b7; font-size: 13.5px; display: flex; align-items: center; gap: 6px;">
                        <i class="fa-solid fa-file-circle-check"></i> المعلومة في المحاضرة التي بُني عليها التوافق مع منهجنا:
                    </strong>
                    <div style="margin-top: 6px; font-size: 13px; color: #f1f5f9; line-height: 1.6;">
                        ${q.lecture_evidence || q.relevance_reason || 'تم التحقق من تطابق السؤال مع المفاهيم المقررة في المحاضرة.'}
                    </div>
                </div>

                <div style="font-size: 15px; font-weight: 600; color: var(--text-main); line-height: 1.6;">
                    ${q.question_text}
                </div>

                <div style="display: flex; flex-direction: column; gap: 8px;">
                    ${buildOptionsHtml(q, `acc-${idx}`)}
                </div>

                ${q.explanation ? `
                    <div style="margin-top: 4px; padding: 12px 14px; background: rgba(30, 41, 59, 0.6); border-right: 4px solid #3b82f6; border-radius: 0 8px 8px 0; font-size: 12px; line-height: 1.6; color: #cbd5e1;">
                        <strong style="color: #93c5fd;"><i class="fa-solid fa-lightbulb"></i> التعليل الطبي والتحليل السريري:</strong>
                        <div style="margin-top: 4px;">${q.explanation}</div>
                    </div>
                ` : ''}
            `;
            acceptedFeed.appendChild(card);
        });
    }
    container.appendChild(acceptedFeed);

    // FEED 3: REJECTED QUESTIONS (WITH PROMINENT REJECTION REASON)
    const rejectedFeed = document.createElement('div');
    rejectedFeed.id = 'rejectedQuestionsFeed';
    rejectedFeed.style.cssText = 'display: none; flex-direction: column; gap: 12px;';

    if (rejectedQuestions.length === 0) {
        rejectedFeed.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 30px;">لا توجد أسئلة مستبعدة في هذا الفحص. كل الأسئلة المكتشفة طابقت المنهج! 🎉</div>';
    } else {
        rejectedQuestions.forEach((rq, idx) => {
            const card = document.createElement('div');
            card.style.cssText = 'background: rgba(239, 68, 68, 0.04); border: 1px solid rgba(239, 68, 68, 0.25); border-radius: 10px; padding: 16px; display: flex; flex-direction: column; gap: 10px;';

            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="background: rgba(239, 68, 68, 0.2); color: #f87171; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 6px;">
                            سؤال مستبعد [${idx + 1}]
                        </span>
                        <span style="font-size: 11px; color: var(--text-muted);">
                            <i class="fa-solid fa-file-pdf"></i> ${rq.source_file || 'ملف الامتحان'} (ص ${rq.source_page || 1})
                        </span>
                    </div>
                    <span style="font-size: 11.5px; color: #ef4444; font-weight: 700; display: flex; align-items: center; gap: 4px;">
                        <i class="fa-solid fa-ban"></i> خارج منهج المحاضرات المحددة
                    </span>
                </div>

                <!-- ❌ PROMINENT REJECTION REASON CARD -->
                <div style="background: rgba(239, 68, 68, 0.12); border-right: 5px solid #ef4444; padding: 10px 14px; border-radius: 0 6px 6px 0; font-size: 12.5px; color: #fca5a5;">
                    <strong style="color: #ef4444; display: flex; align-items: center; gap: 6px;">
                        <i class="fa-solid fa-circle-exclamation"></i> سبب الرفض والاستبعاد من المنهج:
                    </strong>
                    <div style="margin-top: 4px; color: #fee2e2; line-height: 1.5;">${rq.rejection_reason || 'سؤال يخص جهاز أو موضوع آخر خارج المحاضرات المحددة.'}</div>
                </div>

                <div style="font-size: 14px; color: #e2e8f0; font-weight: 600; line-height: 1.5;">
                    ${rq.question_text}
                </div>

                ${(rq.option_a || rq.option_b) ? `
                    <div style="display: flex; flex-direction: column; gap: 6px; opacity: 0.9;">
                        ${buildOptionsHtml(rq, `rej-${idx}`)}
                    </div>
                ` : ''}
            `;
            rejectedFeed.appendChild(card);
        });
    }
    container.appendChild(rejectedFeed);
}

function checkMatchedAnswer(element, chosenLetter, correctLetter, questionIndex) {
    if (chosenLetter === correctLetter) {
        element.style.background = 'rgba(16, 185, 129, 0.3)';
        element.style.borderColor = '#10b981';
    } else {
        element.style.background = 'rgba(239, 68, 68, 0.2)';
        element.style.borderColor = '#ef4444';
    }
}

function openStudioFromExamQuestion(idx, feedType = 'accepted') {
    let q = null;
    if (feedType === 'all') {
        q = (window.currentExamAllQuestions && window.currentExamAllQuestions[idx]) ? window.currentExamAllQuestions[idx] : null;
    } else {
        q = (window.currentAcceptedQuestions && window.currentAcceptedQuestions[idx]) ? window.currentAcceptedQuestions[idx] : null;
    }
    if (!q) return;

    let optA = q.option_a || '';
    let optB = q.option_b || '';
    let optC = q.option_c || '';
    let optD = q.option_d || '';

    if (Array.isArray(q.options) && q.options.length >= 2) {
        optA = optA || q.options[0] || '';
        optB = optB || q.options[1] || '';
        optC = optC || q.options[2] || '';
        optD = optD || q.options[3] || '';
    }

    const questionObj = {
        question_type: (q.question_type === 'case' || (q.case_scenario && q.case_scenario.length > 5)) ? 'case' : 'mcq',
        case_scenario: q.case_scenario || '',
        question_text: q.question_text || '',
        option_a: optA,
        option_b: optB,
        option_c: optC,
        option_d: optD,
        correct_option: (q.correct_option || 'A').toUpperCase().slice(0, 1),
        explanation: q.explanation || '',
        difficulty: q.difficulty || 'medium',
        lecture_evidence: q.lecture_evidence || ''
    };

    openInteractiveQuestionStudio({
        target_lec_id: q.lecture_id || q.matched_lecture_id,
        initial_question: questionObj,
        default_batch_name: q.source_file ? `فلترة: ${q.source_file}` : 'تصفية امتحانات سابقة'
    });
}

function saveMatchedToQuestionBank() {
    if (!currentMatchedQuestions || currentMatchedQuestions.length === 0) {
        showToast({
            type: 'warning',
            title: 'تنبيه',
            message: 'لا توجد أسئلة مقبولة لحفظها.'
        });
        return;
    }

    // Populate lectures for the examSave modal
    const lecSelect = document.getElementById('examSaveTargetLectureSelect');
    if (lecSelect) {
        lecSelect.innerHTML = '';
        allLectures.forEach(l => {
            const opt = document.createElement('option');
            opt.value = l.id;
            opt.innerText = `${l.lecture_number ? '#' + l.lecture_number + ' ' : ''}${l.title}`;
            lecSelect.appendChild(opt);
        });
        if (allLectures[0]) lecSelect.value = allLectures[0].id;
    }

    const modeSel = document.getElementById('examSaveLectureModeSelect');
    if (modeSel) modeSel.value = 'auto';

    const singleGroup = document.getElementById('examSaveSingleLectureGroup');
    if (singleGroup) singleGroup.style.display = 'none';

    const newBatchInput = document.getElementById('examSaveNewBatchInput');
    if (newBatchInput) {
        const dateStr = new Date().toLocaleDateString('ar-EG');
        newBatchInput.value = `تصفية امتحانات سابقة (${dateStr})`;
    }

    loadExamSaveBatches();
    openModal('saveExamFilterToBankModal');
}

function onExamSaveLectureModeChange() {
    const mode = document.getElementById('examSaveLectureModeSelect')?.value || 'auto';
    const singleGroup = document.getElementById('examSaveSingleLectureGroup');
    if (singleGroup) {
        singleGroup.style.display = (mode === 'single') ? 'block' : 'none';
    }
    loadExamSaveBatches();
}

function onExamSaveLectureSelectChange() {
    loadExamSaveBatches();
}

async function loadExamSaveBatches() {
    const mode = document.getElementById('examSaveLectureModeSelect')?.value || 'auto';
    const batchSel = document.getElementById('examSaveBatchSelect');
    if (!batchSel) return;

    batchSel.innerHTML = '<option value="__new__" selected>➕ إنشاء دفعة / باتش جديد وتسميته...</option>';

    if (mode === 'single') {
        const lecId = parseInt(document.getElementById('examSaveTargetLectureSelect')?.value) || null;
        if (lecId) {
            try {
                const res = await fetch(`/api/lecture/${lecId}/batches`);
                const data = await res.json();
                if (data.batch_details && data.batch_details.length > 0) {
                    data.batch_details.forEach(b => {
                        const opt = document.createElement('option');
                        opt.value = b.batch_name;
                        opt.innerText = `📂 ${b.display_title || b.batch_name} (${b.count} سؤال)`;
                        batchSel.appendChild(opt);
                    });
                }
            } catch (e) {
                console.error("Error loading exam save batches:", e);
            }
        }
    }
    onExamSaveBatchSelectChange();
}

function onExamSaveBatchSelectChange() {
    const batchSel = document.getElementById('examSaveBatchSelect');
    const newGroup = document.getElementById('examSaveNewBatchGroup');
    if (newGroup) {
        newGroup.style.display = (batchSel && batchSel.value === '__new__') ? 'block' : 'none';
    }
}

async function confirmSaveExamQuestionsToBank() {
    if (!currentMatchedQuestions || currentMatchedQuestions.length === 0) {
        alert("لا توجد أسئلة مقبولة لحفظها.");
        return;
    }

    const mode = document.getElementById('examSaveLectureModeSelect')?.value || 'auto';
    let target_lec_id = null;
    if (mode === 'single') {
        target_lec_id = parseInt(document.getElementById('examSaveTargetLectureSelect')?.value) || null;
        if (!target_lec_id) {
            alert("يرجى اختيار المحاضرة المستهدفة.");
            return;
        }
    }

    const batchSel = document.getElementById('examSaveBatchSelect');
    let batch_name = "";
    if (batchSel && batchSel.value === '__new__') {
        batch_name = (document.getElementById('examSaveNewBatchInput')?.value || "").trim() || "تصفية امتحانات سابقة";
    } else if (batchSel && batchSel.value) {
        batch_name = batchSel.value;
    } else {
        batch_name = "تصفية امتحانات سابقة";
    }

    const btn = document.getElementById('btnConfirmExamSaveToBank');
    if (btn) btn.disabled = true;

    closeModal('saveExamFilterToBankModal');
    showLoading("جاري حفظ الأسئلة في بنك الأسئلة ومزامنة ملفات Word...", "يرجى الانتظار");

    try {
        const payload = {
            questions: currentMatchedQuestions,
            block_id: 1,
            batch_name: batch_name
        };
        if (mode === 'single' && target_lec_id) {
            payload.target_lecture_id = target_lec_id;
        }

        const res = await fetch('/api/exam_questions/save_to_bank', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        hideLoading();
        if (btn) btn.disabled = false;

        if (res.ok && data.success) {
            showToast({
                type: 'success',
                title: 'تم حفظ الأسئلة في بنك الأسئلة! 🎉',
                message: `تم بنجاح حفظ ${data.saved_count} سؤال في دفعة (${batch_name}) وتحديث ملف Word للمحاضرة.`,
                actionText: 'عرض بنك الأسئلة',
                onAction: () => switchTab('questions')
            });
            if (typeof loadQuestionsFeed === 'function') {
                loadQuestionsFeed();
            }
        } else {
            showToast({
                type: 'error',
                title: 'خطأ أثناء الحفظ',
                message: data.error || 'حدث خطأ أثناء حفظ الأسئلة.'
            });
        }
    } catch (e) {
        hideLoading();
        if (btn) btn.disabled = false;
        console.error('Error saving to bank:', e);
        showToast({
            type: 'error',
            title: 'تعذر حفظ الأسئلة',
            message: e.message || String(e)
        });
    }
}

async function exportMatchedToWord() {
    if (!currentMatchedQuestions || currentMatchedQuestions.length === 0) {
        showToast({
            type: 'warning',
            title: 'تنبيه',
            message: 'لا توجد أسئلة للتصدير.'
        });
        return;
    }

    try {
        const expSelect = document.getElementById('examExportExplanationSelect');
        const includeExplanation = expSelect ? (expSelect.value === 'yes') : true;

        showLoading("جاري إنشاء وتنسيق ملف Word...", "تنسيق قياسي نظيف للأسئلة");
        const res = await fetch('/api/exam_questions/export_word', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                questions: currentMatchedQuestions,
                title: (currentExamSubjectFilter && currentExamSubjectFilter !== 'All' 
                    ? `أسئلة امتحانات ${currentExamSubjectFilter} المفلترة بالذكاء الاصطناعي` 
                    : "أسئلة امتحانات سابقة مفلترة بالذكاء الاصطناعي"),
                include_explanation: includeExplanation
            })
        });
        const data = await res.json();
        hideLoading();

        if (res.ok && data.success) {
            showToast({
                type: 'success',
                title: 'تم تصدير ملف Word بنجاح! 📄',
                message: `تم إنشاء وتنسيق ملف الـ Word وفتحه تلقائياً: ${data.filename || ''}`
            });
        } else {
            showToast({
                type: 'warning',
                title: 'تعذر تصدير ملف Word',
                message: data.error || 'حدث خطأ أثناء تصدير ملف Word.'
            });
        }
    } catch (e) {
        hideLoading();
        console.error('Error exporting word:', e);
        showToast({
            type: 'error',
            title: 'تعذر تصدير ملف Word',
            message: e.message || String(e)
        });
    }
}

// =========================================================================
// ----------------- REDO & REVIEW HUB (مركز الإعادة وبنك الأخطاء) -----------------
// =========================================================================
let currentRedoSubtab = 'mistakes';
let redoMistakesLectures = [];
let redoFlashcardsList = [];
let currentRedoCardIndex = 0;
let redoCountdownInterval = null;
let lastKnownDueCardsCount = 0;
let redoCheckerInterval = null;

function switchRedoSubtab(subtab) {
    currentRedoSubtab = subtab;
    const btnMistakes = document.getElementById('btnSubtabMistakes');
    const btnFlashcards = document.getElementById('btnSubtabDueFlashcards');
    const paneMistakes = document.getElementById('subpane-redo-mistakes');
    const paneFlashcards = document.getElementById('subpane-redo-flashcards');

    if (subtab === 'mistakes') {
        if (btnMistakes) btnMistakes.classList.add('active');
        if (btnFlashcards) btnFlashcards.classList.remove('active');
        if (paneMistakes) paneMistakes.style.display = 'block';
        if (paneFlashcards) paneFlashcards.style.display = 'none';
        loadRedoMistakes();
    } else {
        if (btnFlashcards) btnFlashcards.classList.add('active');
        if (btnMistakes) btnMistakes.classList.remove('active');
        if (paneMistakes) paneMistakes.style.display = 'none';
        if (paneFlashcards) paneFlashcards.style.display = 'block';
        loadRedoDueFlashcards();
    }
}

async function loadRedoSummaryBadge() {
    try {
        const res = await fetch(`/api/redo/summary?block_id=${currentBlockId}`);
        const data = await res.json();
        const total = data.total_due_count || 0;
        const mistakes = data.mistakes_count || 0;
        const dueCards = data.due_flashcards_count || 0;

        const totalBadge = document.getElementById('redoTotalBadge');
        if (totalBadge) {
            totalBadge.innerText = total;
            totalBadge.style.display = total > 0 ? 'inline-flex' : 'none';
        }

        const mBadge = document.getElementById('redoMistakesBadge');
        if (mBadge) mBadge.innerText = mistakes;

        const fBadge = document.getElementById('redoFlashcardsBadge');
        if (fBadge) fBadge.innerText = dueCards;

        return data;
    } catch (e) {
        console.error("Error loading redo summary badge:", e);
        return null;
    }
}

async function loadRedoHubData() {
    await loadRedoSummaryBadge();
    if (currentRedoSubtab === 'mistakes') {
        await loadRedoMistakes();
    } else {
        await loadRedoDueFlashcards();
    }
}

async function loadRedoMistakes() {
    const container = document.getElementById('redoMistakesContainer');
    if (!container) return;
    container.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 40px;"><i class="fa-solid fa-spinner fa-spin fa-2x mb-3"></i><br>جاري تحميل بنك الأسئلة الخاطئة...</div>';

    try {
        const res = await fetch(`/api/redo/mistakes?block_id=${currentBlockId}`);
        const data = await res.json();
        redoMistakesLectures = data.lectures || [];

        const totalCountEl = document.getElementById('redoTotalMistakesCount');
        if (totalCountEl) totalCountEl.innerText = data.total_mistakes || 0;

        // Populate lecture filter dropdown
        const filterSel = document.getElementById('redoLectureFilter');
        if (filterSel) {
            const curVal = filterSel.value;
            filterSel.innerHTML = '<option value="all">جميع المحاضرات التي بها أخطاء</option>';
            redoMistakesLectures.forEach(l => {
                const opt = document.createElement('option');
                opt.value = l.lecture_id;
                opt.innerText = `[${l.lecture_subject}] #${l.lecture_number} ${l.lecture_title} (${l.mistakes_count} أخطاء)`;
                if (String(l.lecture_id) === curVal) opt.selected = true;
                filterSel.appendChild(opt);
            });
        }

        renderRedoMistakesList();
    } catch (e) {
        console.error("Error loading redo mistakes:", e);
        container.innerHTML = '<div style="text-align: center; color: #ef4444; padding: 30px;">تعذر تحميل الأسئلة الخاطئة.</div>';
    }
}

function filterRedoMistakesByLecture() {
    renderRedoMistakesList();
}

function renderRedoMistakesList() {
    const container = document.getElementById('redoMistakesContainer');
    if (!container) return;

    const filterVal = document.getElementById('redoLectureFilter')?.value || 'all';
    const lecturesToRender = (filterVal === 'all')
        ? redoMistakesLectures
        : redoMistakesLectures.filter(l => String(l.lecture_id) === filterVal);

    if (lecturesToRender.length === 0 || lecturesToRender.every(l => l.questions.length === 0)) {
        container.innerHTML = `
            <div style="text-align: center; padding: 50px 20px; background: rgba(15, 23, 42, 0.4); border-radius: 12px; border: 1px dashed rgba(255,255,255,0.1);">
                <div style="font-size: 48px; margin-bottom: 12px;">🌟</div>
                <h3 style="margin-bottom: 8px;">لا توجد أسئلة خاطئة بحاجة للإعادة!</h3>
                <p style="color: var(--text-muted); font-size: 14px;">أداء استثنائي! أي سؤال تخطئ فيه في بنك الأسئلة أو الكويز السريع سيُحفظ هنا تلقائياً لتتمكن من إعادة حله وتثبيته.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = '';

    lecturesToRender.forEach(lec => {
        if (!lec.questions || lec.questions.length === 0) return;

        const groupEl = document.createElement('div');
        groupEl.className = 'redo-lecture-group';
        groupEl.id = `redo-lec-group-${lec.lecture_id}`;

        let questionsHtml = '';
        lec.questions.forEach((q, idx) => {
            const isCase = q.question_type === 'case' || (q.case_scenario && q.case_scenario.length > 5);
            questionsHtml += `
                <div class="redo-card" id="redo-q-card-${q.id}">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; flex-wrap: wrap; gap: 8px;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="background: rgba(59, 130, 246, 0.2); color: #60a5fa; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 6px;">
                                سؤال [${idx + 1}]
                            </span>
                            <span class="redo-tag-mistake" id="redo-tag-${q.id}">
                                <i class="fa-solid fa-circle-xmark"></i> خطأ سابق (حاول مجدداً)
                            </span>
                        </div>
                        <span style="font-size: 11px; color: var(--text-muted);">
                            المحاولات: ${q.times_attempted || 1} | الصح: ${q.times_correct || 0}
                        </span>
                    </div>

                    ${isCase ? `<div class="case-scenario-box" dir="auto" style="margin-bottom: 10px;"><i class="fa-solid fa-notes-medical text-accent"></i> ${q.case_scenario}</div>` : ''}

                    <div style="font-size: 14px; font-weight: 600; color: var(--text-main); margin-bottom: 12px; line-height: 1.5;" dir="auto">
                        ${q.question_text}
                    </div>

                    <div class="q-options" id="redo-opts-${q.id}" style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                        <button class="q-opt-btn" onclick="submitRedoAnswer(${q.id}, 'A')"><strong>A:</strong> <span dir="auto">${q.option_a}</span></button>
                        <button class="q-opt-btn" onclick="submitRedoAnswer(${q.id}, 'B')"><strong>B:</strong> <span dir="auto">${q.option_b}</span></button>
                        <button class="q-opt-btn" onclick="submitRedoAnswer(${q.id}, 'C')"><strong>C:</strong> <span dir="auto">${q.option_c}</span></button>
                        <button class="q-opt-btn" onclick="submitRedoAnswer(${q.id}, 'D')"><strong>D:</strong> <span dir="auto">${q.option_d}</span></button>
                    </div>

                    <div class="q-explanation-box" id="redo-exp-${q.id}" style="display: none; margin-top: 12px;">
                        <h5><i class="fa-solid fa-lightbulb"></i> التعليل والشرح الطبي:</h5>
                        <p id="redo-exp-text-${q.id}"></p>
                    </div>
                </div>
            `;
        });

        groupEl.innerHTML = `
            <div class="redo-lecture-header" onclick="toggleRedoLectureBody(${lec.lecture_id})">
                <div class="redo-lecture-title">
                    <i class="fa-solid fa-book-medical text-primary"></i>
                    <span>[${lec.lecture_subject}] #${lec.lecture_number} ${lec.lecture_title}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span class="redo-lecture-badge" id="redo-lec-badge-${lec.lecture_id}">
                        <i class="fa-solid fa-triangle-exclamation"></i> ${lec.mistakes_count} أخطاء
                    </span>
                    <i class="fa-solid fa-chevron-down text-muted" id="redo-lec-arrow-${lec.lecture_id}"></i>
                </div>
            </div>
            <div class="redo-questions-body" id="redo-lec-body-${lec.lecture_id}">
                ${questionsHtml}
            </div>
        `;

        container.appendChild(groupEl);
    });
}

function toggleRedoLectureBody(lecId) {
    const body = document.getElementById(`redo-lec-body-${lecId}`);
    const arrow = document.getElementById(`redo-lec-arrow-${lecId}`);
    if (!body) return;
    if (body.style.display === 'none') {
        body.style.display = 'flex';
        if (arrow) arrow.className = 'fa-solid fa-chevron-down text-muted';
    } else {
        body.style.display = 'none';
        if (arrow) arrow.className = 'fa-solid fa-chevron-up text-muted';
    }
}

async function submitRedoAnswer(qId, selectedOption) {
    try {
        const res = await fetch(`/api/question/${qId}/answer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ option: selectedOption })
        });
        const data = await res.json();

        const optGroup = document.getElementById(`redo-opts-${qId}`);
        const buttons = optGroup ? optGroup.querySelectorAll('.q-opt-btn') : [];
        const card = document.getElementById(`redo-q-card-${qId}`);

        buttons.forEach(btn => {
            btn.disabled = true;
            const optLetter = btn.innerText.trim().charAt(0);
            if (optLetter === data.correct_option) {
                btn.classList.add('correct');
            } else if (optLetter === selectedOption && !data.is_correct) {
                btn.classList.add('wrong');
            }
        });

        const expBox = document.getElementById(`redo-exp-${qId}`);
        const expText = document.getElementById(`redo-exp-text-${qId}`);
        if (expBox && expText) {
            expText.innerHTML = `<strong>الإجابة الصحيحة: (${data.correct_option})</strong><br>${data.explanation_arabic || data.explanation || ''}`;
            expBox.style.display = 'block';
        }

        const tag = document.getElementById(`redo-tag-${qId}`);

        if (data.is_correct) {
            playCompletionChime('success');
            if (card) card.classList.add('is-resolved');
            if (tag) {
                tag.className = 'redo-tag-resolved';
                tag.innerHTML = '<i class="fa-solid fa-check"></i> تم التصحيح والاستيعاب بنجاح 🎉';
            }
            showToast({
                type: 'success',
                title: 'أحسنت! تم تصحيح الخطأ 🎉',
                message: 'تم إتقان المعلومة وتحديث نتيجتك بنجاح.',
                duration: 4000
            });
            await loadRedoSummaryBadge();
        } else {
            playCompletionChime('error');
            if (tag) {
                tag.className = 'redo-tag-mistake';
                tag.innerHTML = '<i class="fa-solid fa-xmark"></i> خطأ! راجع التعليل الطبي أدناه';
            }
        }
    } catch (e) {
        console.error("Redo answer submission error:", e);
    }
}

// ----------------- REDO DUE FLASHCARDS -----------------
async function loadRedoDueFlashcards() {
    const arena = document.getElementById('redoFlashcardArena');
    const emptyState = document.getElementById('redoEmptyState');
    const cardDeckStatus = document.getElementById('redoCardDeckStatus');
    const cardWrapper = document.getElementById('redoCardWrapper');
    const cardNavToolbar = document.getElementById('redoCardNavToolbar');
    const actions = document.getElementById('redoSrsActions');

    try {
        const filterSel = document.getElementById('redoFlashcardsLectureFilter');
        const selectedLec = filterSel ? filterSel.value : 'all';
        let url = `/api/redo/flashcards?block_id=${currentBlockId}`;
        if (selectedLec && selectedLec !== 'all') {
            url += `&lecture_id=${selectedLec}`;
        }

        const res = await fetch(url);
        const data = await res.json();
        redoFlashcardsList = data.flashcards || [];
        currentRedoCardIndex = 0;

        const totalCardsEl = document.getElementById('redoTotalCardsInDeck');
        if (totalCardsEl) totalCardsEl.innerText = redoFlashcardsList.length;

        const totalDueCountEl = document.getElementById('redoTotalDueCount');
        if (totalDueCountEl) totalDueCountEl.innerText = redoFlashcardsList.length;

        // Populate / update lecture filter dropdown
        if (filterSel && data.lectures) {
            const curVal = filterSel.value;
            filterSel.innerHTML = '<option value="all">جميع المحاضرات (كل البطاقات المستحقة)</option>';
            data.lectures.forEach(l => {
                const opt = document.createElement('option');
                opt.value = l.lecture_id;
                opt.innerText = `[${l.lecture_subject}] #${l.lecture_number} ${l.lecture_title} (${l.due_count} بطاقات مستحقة)`;
                if (String(l.lecture_id) === curVal) opt.selected = true;
                filterSel.appendChild(opt);
            });
        }

        if (redoFlashcardsList.length === 0) {
            // No due cards right now!
            if (cardDeckStatus) cardDeckStatus.style.display = 'none';
            if (cardWrapper) cardWrapper.style.display = 'none';
            if (cardNavToolbar) cardNavToolbar.style.display = 'none';
            if (actions) actions.style.display = 'none';
            if (emptyState) emptyState.style.display = 'block';

            const emptyTitle = document.getElementById('redoEmptyTitle');
            const emptySubtext = document.getElementById('redoEmptySubtext');
            if (selectedLec && selectedLec !== 'all') {
                if (emptyTitle) emptyTitle.innerText = "لا توجد بطاقات مستحقة لهذه المحاضرة حالياً 🎉";
                if (emptySubtext) emptySubtext.innerText = "أحسنت! يمكنك اختيار محاضرة أخرى أو تحديد (جميع المحاضرات) لمتابعة مراجعة باقي المنهج.";
            } else {
                if (emptyTitle) emptyTitle.innerText = "لا توجد بطاقات مستحقة للمراجعة حالياً 🎉";
                if (emptySubtext) emptySubtext.innerText = "لقد راجعت جميع بطاقات التكرار المتباعد المستحقة. البطاقات المجدولة ستظهر تلقائياً عند حلول موعدها.";
            }

            // Check if there is an upcoming card with countdown
            const countdownBox = document.getElementById('redoCountdownBox');
            if (data.next_due_seconds && data.next_due_seconds > 0) {
                if (countdownBox) countdownBox.style.display = 'inline-flex';
                startRedoLiveCountdown(data.next_due_seconds);
            } else {
                if (countdownBox) countdownBox.style.display = 'none';
                if (redoCountdownInterval) clearInterval(redoCountdownInterval);
            }
        } else {
            // Cards available!
            if (cardDeckStatus) cardDeckStatus.style.display = 'flex';
            if (cardWrapper) cardWrapper.style.display = 'block';
            if (cardNavToolbar) cardNavToolbar.style.display = 'flex';
            if (emptyState) emptyState.style.display = 'none';
            if (redoCountdownInterval) clearInterval(redoCountdownInterval);
            renderActiveRedoCard();
        }
    } catch (e) {
        console.error("Error loading redo due flashcards:", e);
    }
}

function filterRedoFlashcardsByLecture() {
    loadRedoDueFlashcards();
}

function startRedoLiveCountdown(initialSeconds) {
    if (redoCountdownInterval) clearInterval(redoCountdownInterval);
    let secondsLeft = initialSeconds;

    const updateDisplay = () => {
        const countdownText = document.getElementById('redoCountdownText');
        if (!countdownText) return;

        if (secondsLeft <= 0) {
            clearInterval(redoCountdownInterval);
            countdownText.innerText = "البطاقة أصبحت مستحقة الآن! جاري التحميل...";
            loadRedoDueFlashcards();
            loadRedoSummaryBadge();
            playCompletionChime('info');
            showToast({
                type: 'info',
                title: 'حان وقت المراجعة! ⏰',
                message: 'البطاقة المجدولة أصبحت جاهزة للتكرار الآن.'
            });
            return;
        }

        const mins = Math.floor(secondsLeft / 60);
        const secs = secondsLeft % 60;
        const pad = (n) => String(n).padStart(2, '0');

        if (mins >= 60) {
            const hours = Math.floor(mins / 60);
            const remMins = mins % 60;
            countdownText.innerText = `البطاقة القادمة مستحقة بعد: ${hours} ساعة و ${remMins} دقيقة`;
        } else {
            countdownText.innerText = `البطاقة القادمة مستحقة بعد: ${pad(mins)}:${pad(secs)} دقيقة`;
        }
        secondsLeft--;
    };

    updateDisplay();
    redoCountdownInterval = setInterval(updateDisplay, 1000);
}

function renderActiveRedoCard() {
    const inner = document.getElementById('redoFlashcardInner');
    if (inner) inner.classList.remove('flipped');
    const actions = document.getElementById('redoSrsActions');
    if (actions) actions.style.display = 'none';

    if (redoFlashcardsList.length === 0) {
        loadRedoDueFlashcards();
        return;
    }

    const card = redoFlashcardsList[currentRedoCardIndex];
    const indexEl = document.getElementById('redoCurrentCardIndex');
    if (indexEl) indexEl.innerText = currentRedoCardIndex + 1;

    const subdeckEl = document.getElementById('redoCardSubdeck');
    if (subdeckEl) subdeckEl.innerText = '';

    const lecBadge = document.getElementById('redoActiveLecBadge');
    if (lecBadge) {
        if (card.lecture_title) {
            lecBadge.style.display = 'inline-block';
            lecBadge.innerText = card.lecture_title;
        } else {
            lecBadge.style.display = 'none';
        }
    }

    const frontEl = document.getElementById('redoCardFrontText');
    if (frontEl) applyCardTextWithDirection(frontEl, card.front);

    const backEl = document.getElementById('redoCardBackText');
    if (backEl) applyCardTextWithDirection(backEl, card.back);
}

function flipRedoCard() {
    const inner = document.getElementById('redoFlashcardInner');
    if (!inner) return;
    inner.classList.toggle('flipped');
    const actions = document.getElementById('redoSrsActions');
    if (actions) {
        actions.style.display = (inner.classList.contains('flipped') && redoFlashcardsList.length > 0) ? 'grid' : 'none';
    }
}

function prevRedoCard() {
    if (redoFlashcardsList.length === 0) return;
    if (currentRedoCardIndex > 0) {
        currentRedoCardIndex--;
    } else {
        currentRedoCardIndex = redoFlashcardsList.length - 1;
    }
    renderActiveRedoCard();
}

function nextRedoCard() {
    if (redoFlashcardsList.length === 0) return;
    if (currentRedoCardIndex < redoFlashcardsList.length - 1) {
        currentRedoCardIndex++;
    } else {
        currentRedoCardIndex = 0;
    }
    renderActiveRedoCard();
}

async function rateRedoCard(preset) {
    if (redoFlashcardsList.length === 0) return;
    const card = redoFlashcardsList[currentRedoCardIndex];

    const presetLabels = {
        '10m': 'بعد 10 دقائق ⚡',
        '1d': 'بعد يوم واحد 📅',
        '3d': 'بعد 3 أيام 📅',
        '7d': 'بعد 7 أيام 📅'
    };

    try {
        const res = await fetch(`/api/flashcard/${card.id}/review_srs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ preset: preset })
        });
        const data = await res.json();

        showToast({
            type: 'success',
            title: 'تمت جدولة موعد المراجعة! 🗂️',
            message: `ستظهر البطاقة مجدداً للتكرار: ${presetLabels[preset] || preset}`,
            duration: 3500
        });

        // Remove card from active due deck
        redoFlashcardsList.splice(currentRedoCardIndex, 1);
        if (currentRedoCardIndex >= redoFlashcardsList.length) {
            currentRedoCardIndex = 0;
        }

        const totalCardsEl = document.getElementById('redoTotalCardsInDeck');
        if (totalCardsEl) totalCardsEl.innerText = redoFlashcardsList.length;

        if (redoFlashcardsList.length === 0) {
            await loadRedoDueFlashcards();
        } else {
            renderActiveRedoCard();
        }

        await loadRedoSummaryBadge();
    } catch (e) {
        console.error("Error rating redo card:", e);
    }
}

// ----------------- BACKGROUND DUE NOTIFIER -----------------
function startRedoDueChecker() {
    if (redoCheckerInterval) clearInterval(redoCheckerInterval);

    // Initial check
    checkDueFlashcardsStatus(true);

    // Run every 25 seconds
    redoCheckerInterval = setInterval(() => {
        checkDueFlashcardsStatus(false);
    }, 25000);
}

async function checkDueFlashcardsStatus(isInitial = false) {
    try {
        const data = await loadRedoSummaryBadge();
        if (!data) return;

        const currentDue = data.due_flashcards_count || 0;

        // If not initial, and due cards count increased
        if (!isInitial && currentDue > lastKnownDueCardsCount && currentDue > 0) {
            playCompletionChime('info');
            showToast({
                type: 'info',
                title: 'حان وقت مراجعة البطاقات المستحقة! ⏰',
                message: `لديك ${currentDue} بطاقة جاهزة للتكرار المتباعد الآن.`,
                actionText: 'مراجعة الآن',
                onAction: () => {
                    switchTab('redo');
                    switchRedoSubtab('flashcards');
                },
                duration: 9000
            });

            // If current tab is redo and flashcards is active, reload
            if (currentTab === 'redo' && currentRedoSubtab === 'flashcards') {
                loadRedoDueFlashcards();
            }
        }

        lastKnownDueCardsCount = currentDue;
    } catch (e) {
        // silent check
    }
}

// Global Keyboard Shortcuts (Redo & Audio Controls)
window.addEventListener('keydown', (e) => {
    // Redo Flashcard Keyboard Shortcuts
    if (currentTab === 'redo' && currentRedoSubtab === 'flashcards' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
        if (e.code === 'Space') {
            e.preventDefault();
            flipRedoCard();
            return;
        } else if (e.code === 'ArrowLeft') {
            e.preventDefault();
            if (currentAppLanguage === 'ar') prevRedoCard(); else nextRedoCard();
            return;
        } else if (e.code === 'ArrowRight') {
            e.preventDefault();
            if (currentAppLanguage === 'ar') nextRedoCard(); else prevRedoCard();
            return;
        } else if (e.code === 'Digit1') {
            rateRedoCard('10m');
            return;
        } else if (e.code === 'Digit2') {
            rateRedoCard('1d');
            return;
        } else if (e.code === 'Digit3') {
            rateRedoCard('3d');
            return;
        } else if (e.code === 'Digit4') {
            rateRedoCard('7d');
            return;
        }
    }

    // Voice & Audio Global Shortcuts (Alt+S = Stop, Alt+P = Pause/Play)
    if (e.altKey && (e.code === 'KeyS' || e.code === 'KeyP')) {
        e.preventDefault();
        if (e.code === 'KeyS') {
            stopAudioPlayback();
        } else if (e.code === 'KeyP') {
            toggleAudioPlayPause();
        }
    }
});

// ==========================================================================
// SMART LECTURE REVIEW & TARGETED WEAKNESS HUB (نظام المراجعة الذكية المركزة)
// ==========================================================================

let currentSmartReviewLectureId = null;
let smartReviewDiagnostics = null;
let smartReviewDrillQuestions = [];
let smartReviewCards = [];
let currentSmartCardIdx = 0;
let smartCardIsFlipped = false;
let currentMockExamData = null;
let mockMcqAnswers = {};
let mockEssayGrades = {};

function safeEscape(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function getQuestionChoicesList(q) {
    if (q.choices && Array.isArray(q.choices)) return q.choices;
    if (typeof q.choices === 'string') {
        try {
            const parsed = JSON.parse(q.choices);
            if (Array.isArray(parsed)) return parsed;
        } catch (e) {}
    }
    const list = [];
    if (q.option_a) list.push(`A) ${q.option_a}`);
    if (q.option_b) list.push(`B) ${q.option_b}`);
    if (q.option_c) list.push(`C) ${q.option_c}`);
    if (q.option_d) list.push(`D) ${q.option_d}`);
    return list;
}

function getQuestionCorrectAnswer(q) {
    if (q.correct_answer) return q.correct_answer.trim();
    if (q.correct_option) {
        const opt = q.correct_option.trim().toUpperCase();
        if (opt === 'A' && q.option_a) return `A) ${q.option_a}`;
        if (opt === 'B' && q.option_b) return `B) ${q.option_b}`;
        if (opt === 'C' && q.option_c) return `C) ${q.option_c}`;
        if (opt === 'D' && q.option_d) return `D) ${q.option_d}`;
        return opt;
    }
    return '';
}

function isOptionMatch(selectedText, correctTarget) {
    if (!selectedText || !correctTarget) return false;
    const s = selectedText.trim().toLowerCase();
    const c = correctTarget.trim().toLowerCase();
    if (s === c) return true;
    if (c.length === 1 && s.startsWith(c)) return true;
    if (s.length >= 2 && c.length >= 2 && s.slice(0, 2) === c.slice(0, 2)) return true;
    const sClean = s.replace(/^[a-d]\s*[\)\.\:\-]\s*/i, '').trim();
    const cClean = c.replace(/^[a-d]\s*[\)\.\:\-]\s*/i, '').trim();
    return sClean === cClean;
}

async function openSmartLectureReviewHub(lecId) {
    currentSmartReviewLectureId = lecId;
    const lec = allLectures.find(l => l.id === lecId);
    const title = lec ? lec.title : `المحاضرة #${lecId}`;
    const subject = lec ? lec.subject : '';
    const num = lec && lec.lecture_number ? `#${lec.lecture_number}` : '';

    const badgeEl = document.getElementById('smartReviewLecBadge');
    if (badgeEl) badgeEl.innerText = `${num} ${subject}`.trim() || 'محاضرة';
    
    const titleEl = document.getElementById('smartReviewLecTitle');
    if (titleEl) titleEl.innerText = `مراجعة ذكية مركزة: ${title}`;

    openModal('smartLectureReviewModal');
    switchSmartReviewStage(1);

    // Reset internal state
    smartReviewDiagnostics = null;
    smartReviewDrillQuestions = [];
    smartReviewCards = [];
    currentSmartCardIdx = 0;
    smartCardIsFlipped = false;
    currentMockExamData = null;
    mockMcqAnswers = {};
    mockEssayGrades = {};

    const banner = document.getElementById('smartDiagnosticsBanner');
    if (banner) {
        banner.innerHTML = `
            <div style="width: 100%; text-align: center; padding: 25px; color: var(--text-muted);">
                <i class="fa-solid fa-circle-notch fa-spin fa-2x mb-2 text-primary"></i>
                <div>جاري فحص سجل الأخطاء والبطاقات المتعثرة في هذه المحاضرة...</div>
            </div>
        `;
    }

    const contentBox = document.getElementById('smartAnalysisContentBox');
    if (contentBox) {
        contentBox.innerHTML = `
            <div style="text-align: center; color: var(--text-muted); padding: 40px 20px;">
                <i class="fa-solid fa-spinner fa-spin fa-2x mb-2" style="color: #60a5fa;"></i>
                <h4>جاري قراءة البيانات التشخيصية وتحديد مواضع اللبس...</h4>
            </div>
        `;
    }

    try {
        const res = await fetch(`/api/lecture/${lecId}/smart_review/diagnostics`);
        const data = await res.json();
        if (data.status === 'success' || data.success) {
            smartReviewDiagnostics = data;
            renderSmartReviewDiagnostics();
        } else {
            showToast({ type: 'danger', message: data.message || data.error || 'تعذر تحميل تشخيص المحاضرة' });
        }
    } catch (e) {
        console.error("Error loading smart review diagnostics:", e);
        showToast({ type: 'danger', message: 'حدث خطأ أثناء تحميل بيانات التشخيص' });
    }
}

function renderSmartReviewDiagnostics() {
    if (!smartReviewDiagnostics) return;

    const banner = document.getElementById('smartDiagnosticsBanner');
    if (!banner) return;

    const mistakesCount = smartReviewDiagnostics.mistakes_count || (smartReviewDiagnostics.mistakes ? smartReviewDiagnostics.mistakes.length : 0);
    const struggleCardsCount = smartReviewDiagnostics.struggling_flashcards_count || smartReviewDiagnostics.struggle_cards_count || 0;
    const cachedReview = smartReviewDiagnostics.cached_review || smartReviewDiagnostics.cached_analysis;
    const weakPoints = (cachedReview && cachedReview.weak_points) ? cachedReview.weak_points : (smartReviewDiagnostics.weak_points || []);

    const stage1Badge = document.getElementById('smartStage1Badge');
    if (stage1Badge) {
        if (mistakesCount > 0) {
            stage1Badge.style.display = 'inline-block';
            stage1Badge.innerText = `${mistakesCount} أخطاء سابقة`;
        } else {
            stage1Badge.style.display = 'none';
        }
    }

    banner.innerHTML = `
        <div class="smart-diag-card">
            <div class="smart-diag-icon" style="background: rgba(239, 68, 68, 0.15); color: #ef4444;">
                <i class="fa-solid fa-circle-xmark"></i>
            </div>
            <div>
                <span style="font-size: 11px; color: var(--text-muted); display: block;">أخطاء الأسئلة السابقة</span>
                <strong style="font-size: 17px; color: ${mistakesCount > 0 ? '#ef4444' : '#10b981'};">
                    ${mistakesCount > 0 ? mistakesCount + ' سؤال' : 'سجل نظيف (0)'}
                </strong>
            </div>
        </div>

        <div class="smart-diag-card">
            <div class="smart-diag-icon" style="background: rgba(245, 158, 11, 0.15); color: #f59e0b;">
                <i class="fa-solid fa-brain"></i>
            </div>
            <div>
                <span style="font-size: 11px; color: var(--text-muted); display: block;">بطاقات استذكار متعثرة</span>
                <strong style="font-size: 17px; color: ${struggleCardsCount > 0 ? '#f59e0b' : '#10b981'};">
                    ${struggleCardsCount > 0 ? struggleCardsCount + ' بطاقة' : 'مثبتة بالكامل'}
                </strong>
            </div>
        </div>

        <div class="smart-diag-card">
            <div class="smart-diag-icon" style="background: rgba(59, 130, 246, 0.15); color: #60a5fa;">
                <i class="fa-solid fa-bullseye"></i>
            </div>
            <div>
                <span style="font-size: 11px; color: var(--text-muted); display: block;">مواضع التركيز المشخصة</span>
                <strong style="font-size: 17px; color: #60a5fa;">
                    ${weakPoints.length > 0 ? weakPoints.length + ' محاور رئيسية' : 'تشخيص تلقائي جاهز'}
                </strong>
            </div>
        </div>
    `;

    const weakPointsContainer = document.getElementById('smartWeakPointsContainer');
    const weakPointsChips = document.getElementById('smartWeakPointsChips');
    if (weakPointsContainer && weakPointsChips) {
        if (weakPoints && weakPoints.length > 0) {
            weakPointsContainer.style.display = 'block';
            weakPointsChips.innerHTML = weakPoints.map(wp => `
                <span class="weak-point-chip">
                    <i class="fa-solid fa-triangle-exclamation"></i> ${safeEscape(wp)}
                </span>
            `).join('');
        } else {
            weakPointsContainer.style.display = 'none';
        }
    }

    const contentBox = document.getElementById('smartAnalysisContentBox');
    if (contentBox) {
        if (cachedReview && cachedReview.analysis_ar) {
            contentBox.innerHTML = marked.parse(cachedReview.analysis_ar);
        } else {
            contentBox.innerHTML = `
                <div style="text-align: center; color: var(--text-muted); padding: 50px 20px;">
                    <i class="fa-solid fa-wand-sparkles fa-2x mb-2" style="color: #60a5fa;"></i>
                    <h4>جاهز لبدء المراجعة الذكية المركزة</h4>
                    <p style="font-size: 13px; max-width: 500px; margin: 6px auto;">
                        تم رصد ${mistakesCount} سؤال خاطئ و ${struggleCardsCount} بطاقة متعثرة. انقر على زر "توليد الشرح المركز" ليقوم الذكاء الاصطناعي بفحص كل خطأ وتقديم شرح طبي جذري للمفاهيم الصعبة.
                    </p>
                </div>
            `;
        }
    }
}

function switchSmartReviewStage(stage) {
    for (let s = 1; s <= 4; s++) {
        const btn = document.getElementById(`btnSmartStage${s}`);
        const pane = document.getElementById(`smartStagePane${s}`);
        if (btn) btn.classList.toggle('active', s === stage);
        if (pane) pane.style.display = (s === stage ? 'block' : 'none');
    }

    if (stage === 2) {
        const container = document.getElementById('smartDrillQuestionsContainer');
        if (container && (!container.children || container.children.length === 0)) {
            loadPreviousMistakesIntoDrill();
        }
    } else if (stage === 3) {
        if (smartReviewCards.length === 0) {
            loadSmartReviewDefaultCards();
        }
    }
}

async function generateSmartLectureAnalysis() {
    if (!currentSmartReviewLectureId) return;

    const btn = document.getElementById('btnRegenSmartAnalysis');
    const contentBox = document.getElementById('smartAnalysisContentBox');

    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>جاري التحليل والشرح...</span>';
    }

    if (contentBox) {
        contentBox.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; color: var(--text-muted);">
                <i class="fa-solid fa-circle-notch fa-spin fa-2x mb-3 text-primary"></i>
                <h4 style="color: var(--text-main); margin-bottom: 6px;">الذكاء الاصطناعي يقوم بتشخيص الأخطاء الآن...</h4>
                <p style="font-size: 13px; max-width: 480px; margin: 0 auto;">
                    يقوم Gemini بفحص الأسئلة التي تعثرت فيها في هذه المحاضرة وربطها بنصوص الشرح لتحديد اللبس وشرح المفاهيم الطبية الصعبة بشكل متعمق.
                </p>
            </div>
        `;
    }

    try {
        const res = await fetch(`/api/lecture/${currentSmartReviewLectureId}/smart_review/generate_analysis`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await res.json();

        if (data.status === 'success') {
            showToast({ type: 'success', title: 'تم التحليل بنجاح 🎯', message: 'تم تجهيز الشرح المركز لمواضع التعثر والأخطاء!' });

            const weakPoints = data.weak_points || [];
            const weakPointsContainer = document.getElementById('smartWeakPointsContainer');
            const weakPointsChips = document.getElementById('smartWeakPointsChips');
            if (weakPointsContainer && weakPointsChips) {
                if (weakPoints.length > 0) {
                    weakPointsContainer.style.display = 'block';
                    weakPointsChips.innerHTML = weakPoints.map(wp => `
                        <span class="weak-point-chip">
                            <i class="fa-solid fa-triangle-exclamation"></i> ${safeEscape(wp)}
                        </span>
                    `).join('');
                }
            }

            if (contentBox) {
                contentBox.innerHTML = marked.parse(data.analysis_ar || '');
            }

            if (smartReviewDiagnostics) {
                smartReviewDiagnostics.cached_review = data;
                renderSmartReviewDiagnostics();
            }
        } else {
            showToast({ type: 'danger', message: data.message || 'تعذر توليد التحليل' });
            if (contentBox) {
                contentBox.innerHTML = `<div class="alert alert-danger">${safeEscape(data.message || 'حدث خطأ')}</div>`;
            }
        }
    } catch (e) {
        console.error("Error generating smart review analysis:", e);
        showToast({ type: 'danger', message: 'حدث خطأ في الاتصال بالخادم أثناء توليد الشرح' });
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> <span>توليد / تحديث الشرح المركز بالذكاء الاصطناعي</span>';
        }
    }
}

// ----------------- STAGE 2: TARGETED DRILL QUESTIONS -----------------
function loadPreviousMistakesIntoDrill() {
    const container = document.getElementById('smartDrillQuestionsContainer');
    if (!container) return;

    const mistakes = (smartReviewDiagnostics && (smartReviewDiagnostics.mistake_questions || smartReviewDiagnostics.mistakes)) 
        ? (smartReviewDiagnostics.mistake_questions || smartReviewDiagnostics.mistakes)
        : [];

    if (mistakes.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 45px 20px; background: rgba(255,255,255,0.02); border-radius: 12px; border: 1px dashed var(--border-color);">
                <i class="fa-solid fa-circle-check fa-2x mb-2 text-success"></i>
                <h4 style="color: var(--text-main);">لا توجد أخطاء سابقة مسجلة في هذه المحاضرة!</h4>
                <p style="font-size: 13px; color: var(--text-muted); max-width: 480px; margin: 6px auto 16px auto;">
                    رائع! سجل إجاباتك السابقة نظيف. اضغط على الزر أدناه لتوليد 20 سؤالاً تثبيتياً جديداً يركز على أهم محاور المحاضرة.
                </p>
                <button class="btn btn-primary" onclick="generateTargetedDrillQuestions()">
                    <i class="fa-solid fa-wand-sparkles"></i> توليد 20 سؤال تثبيتي جديد
                </button>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div style="margin-bottom: 14px; padding: 10px 14px; background: rgba(239, 68, 68, 0.1); border-left: 4px solid #ef4444; border-radius: 6px; font-size: 13px;">
            <strong><i class="fa-solid fa-rotate-left text-danger"></i> أسئلة أخطائك السابقة (${mistakes.length} سؤال):</strong>
            أعد حلها الآن وتأكد من استيعابك للمفهوم الصحيح قبل الانتقال للأسئلة الجديدة.
        </div>
    `;

    mistakes.forEach((q, idx) => {
        renderDrillQuestionCard(container, q, `prev_${idx}`, true);
    });
}

async function generateTargetedDrillQuestions() {
    if (!currentSmartReviewLectureId) return;

    const btn = document.getElementById('btnGenTargetedDrillQs');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>جاري التوليد...</span>';
    }

    const taskId = 'drill_qs_' + Date.now();
    startBackgroundTask(taskId, 'توليد 20 سؤال تثبيتي مركز', 'يقوم Gemini بصياغة أسئلة تدريبية مكثفة لنقاط التعثر...');

    try {
        const res = await fetch(`/api/lecture/${currentSmartReviewLectureId}/smart_review/generate_drill_questions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ count: 20 })
        });
        const data = await res.json();

        if (data.status === 'success') {
            finishBackgroundTask(taskId);
            playCompletionChime('success');
            showToast({ type: 'success', title: 'تم التوليد بنجاح! 🎯', message: `تم تجهيز ${data.questions.length} سؤال تثبيتي جديد!` });

            const container = document.getElementById('smartDrillQuestionsContainer');
            if (container) {
                if (container.querySelector('.fa-circle-check')) {
                    container.innerHTML = '';
                }

                const divider = document.createElement('div');
                divider.style.margin = '20px 0 14px 0';
                divider.style.padding = '10px 14px';
                divider.style.background = 'rgba(59, 130, 246, 0.1)';
                divider.style.borderLeft = '4px solid #3b82f6';
                divider.style.borderRadius = '6px';
                divider.style.fontSize = '13px';
                divider.innerHTML = `<strong><i class="fa-solid fa-wand-sparkles text-primary"></i> أسئلة تثبيتية جديدة ومكثفة (${data.questions.length} سؤال):</strong> صممت خصيصاً لاختبار أدق النقاط والمفاهيم.`;
                container.appendChild(divider);

                data.questions.forEach((q, idx) => {
                    renderDrillQuestionCard(container, q, `gen_${idx}`, false);
                });
            }
        } else {
            finishBackgroundTask(taskId);
            showToast({ type: 'danger', message: data.message || 'تعذر توليد الأسئلة' });
        }
    } catch (e) {
        finishBackgroundTask(taskId);
        console.error("Error generating drill questions:", e);
        showToast({ type: 'danger', message: 'حدث خطأ أثناء توليد الأسئلة التثبيتية' });
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-wand-sparkles"></i> توليد 20 سؤال تثبيتي جديد';
        }
    }
}

function renderDrillQuestionCard(container, q, uid, isMistake = false) {
    const card = document.createElement('div');
    card.className = 'mock-q-card';
    card.id = `drill-card-${uid}`;

    const choices = getQuestionChoicesList(q);
    const correct = getQuestionCorrectAnswer(q);

    card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; margin-bottom: 10px;">
            <div style="font-size: 14px; font-weight: 700; line-height: 1.5; color: var(--text-main);">
                ${isMistake ? '<span class="badge-tag" style="background: rgba(239, 68, 68, 0.2); color: #ef4444; font-size: 10px; margin-left: 6px;">سؤال سابق</span>' : '<span class="badge-tag" style="background: rgba(59, 130, 246, 0.2); color: #60a5fa; font-size: 10px; margin-left: 6px;">سؤال تثبيتي</span>'}
                ${safeEscape(q.question_text || '')}
            </div>
            ${q.difficulty ? `<span class="badge-tag" style="font-size: 10px;">${safeEscape(q.difficulty)}</span>` : ''}
        </div>
        <div class="drill-choices-wrap" id="drill-choices-${uid}" style="margin-top: 12px;">
            ${choices.map((c, cIdx) => `
                <button class="mock-choice-btn" onclick="checkDrillChoice('${uid}', '${safeEscape(c)}', '${safeEscape(correct)}')">
                    <span>${safeEscape(c)}</span>
                    <i class="fa-regular fa-circle" id="drill-icon-${uid}-${cIdx}"></i>
                </button>
            `).join('')}
        </div>
        <div class="drill-exp-box" id="drill-exp-${uid}" style="display: none; margin-top: 12px; padding: 12px 14px; background: rgba(59, 130, 246, 0.08); border-radius: 8px; border: 1px solid rgba(59, 130, 246, 0.2); font-size: 12.5px; line-height: 1.6;">
            <div style="color: #60a5fa; font-weight: 700; margin-bottom: 4px;">
                <i class="fa-solid fa-circle-info"></i> الشرح والتوضيح الطبي:
            </div>
            <div>${safeEscape(q.explanation || 'لا يوجد شرح إضافي.')}</div>
        </div>
    `;

    container.appendChild(card);
}

function checkDrillChoice(uid, selected, correct) {
    const wrap = document.getElementById(`drill-choices-${uid}`);
    if (!wrap) return;

    const btns = wrap.querySelectorAll('.mock-choice-btn');
    btns.forEach(b => {
        b.disabled = true;
        const text = b.querySelector('span').innerText.trim();
        if (isOptionMatch(text, correct)) {
            b.classList.add('selected-correct');
            const icon = b.querySelector('i');
            if (icon) icon.className = 'fa-solid fa-circle-check text-success';
        } else if (isOptionMatch(text, selected) && !isOptionMatch(text, correct)) {
            b.classList.add('selected-wrong');
            const icon = b.querySelector('i');
            if (icon) icon.className = 'fa-solid fa-circle-xmark text-danger';
        }
    });

    const expBox = document.getElementById(`drill-exp-${uid}`);
    if (expBox) expBox.style.display = 'block';
}

// ----------------- STAGE 3: WEAKNESS FLASHCARDS -----------------
function loadSmartReviewDefaultCards() {
    const cards = (smartReviewDiagnostics && smartReviewDiagnostics.struggling_cards)
        ? smartReviewDiagnostics.struggling_cards
        : [];

    if (cards.length > 0) {
        smartReviewCards = cards;
        currentSmartCardIdx = 0;
        renderActiveSmartCard();
    } else {
        const lecCards = (typeof allFlashcards !== 'undefined')
            ? allFlashcards.filter(fc => fc.lecture_id === currentSmartReviewLectureId)
            : [];
        if (lecCards.length > 0) {
            smartReviewCards = lecCards;
            currentSmartCardIdx = 0;
            renderActiveSmartCard();
        } else {
            const arena = document.getElementById('smartCardsArena');
            if (arena) {
                document.getElementById('smartCardIndex').innerText = '0';
                document.getElementById('smartCardsTotal').innerText = '0';
                document.getElementById('smartCardFront').innerText = 'لا توجد بطاقات حالياً، اضغط على زر التوليد أعلاه!';
                document.getElementById('smartCardBack').innerText = '...';
            }
        }
    }
}

async function generateWeaknessCardsAction() {
    if (!currentSmartReviewLectureId) return;

    const btn = document.getElementById('btnGenWeaknessCards');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>جاري توليد البطاقات...</span>';
    }

    const taskId = 'smart_cards_' + Date.now();
    startBackgroundTask(taskId, 'توليد بطاقات استذكار لنقاط الضعف', 'يقوم Gemini بصياغة 15 بطاقة ذكية مركزة...');

    try {
        const res = await fetch(`/api/lecture/${currentSmartReviewLectureId}/smart_review/generate_weakness_cards`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ count: 15 })
        });
        const data = await res.json();

        if (data.status === 'success') {
            finishBackgroundTask(taskId);
            playCompletionChime('success');
            showToast({ type: 'success', title: 'تم التوليد بنجاح! 🗂️', message: `تمت إضافة ${data.flashcards.length} بطاقة ذكية جديدة!` });

            smartReviewCards = data.flashcards;
            currentSmartCardIdx = 0;
            renderActiveSmartCard();

            if (typeof loadFlashcards === 'function') loadFlashcards();
        } else {
            finishBackgroundTask(taskId);
            showToast({ type: 'danger', message: data.message || 'تعذر توليد البطاقات' });
        }
    } catch (e) {
        finishBackgroundTask(taskId);
        console.error("Error generating smart cards:", e);
        showToast({ type: 'danger', message: 'حدث خطأ أثناء توليد البطاقات الذكية' });
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-wand-sparkles"></i> توليد 15 بطاقة ذكية جديدة للمفاهيم الصعبة';
        }
    }
}

function renderActiveSmartCard() {
    const total = smartReviewCards.length;
    document.getElementById('smartCardsTotal').innerText = total;

    if (total === 0) {
        document.getElementById('smartCardIndex').innerText = '0';
        applyCardTextWithDirection(document.getElementById('smartCardFront'), 'لا توجد بطاقات حالية، اضغط على زر التوليد بالأعلى!');
        applyCardTextWithDirection(document.getElementById('smartCardBack'), '...');
        return;
    }

    if (currentSmartCardIdx >= total) currentSmartCardIdx = total - 1;
    if (currentSmartCardIdx < 0) currentSmartCardIdx = 0;

    const card = smartReviewCards[currentSmartCardIdx];
    document.getElementById('smartCardIndex').innerText = currentSmartCardIdx + 1;

    smartCardIsFlipped = false;
    const inner = document.getElementById('smartCardInner');
    if (inner) inner.classList.remove('flipped');

    applyCardTextWithDirection(document.getElementById('smartCardFront'), card.front_text || card.front || '');
    applyCardTextWithDirection(document.getElementById('smartCardBack'), card.back_text || card.back || '');

    const subdeck = document.getElementById('smartCardSubdeck');
    if (subdeck) {
        subdeck.innerText = card.deck || 'Smart Retention Deck';
    }

    const srsActions = document.getElementById('smartSrsActions');
    if (srsActions) srsActions.style.display = 'none';
}

function flipSmartCard() {
    if (smartReviewCards.length === 0) return;
    const inner = document.getElementById('smartCardInner');
    if (!inner) return;

    smartCardIsFlipped = !smartCardIsFlipped;
    inner.classList.toggle('flipped', smartCardIsFlipped);

    const srsActions = document.getElementById('smartSrsActions');
    if (srsActions) {
        srsActions.style.display = smartCardIsFlipped ? 'flex' : 'none';
    }
}

function nextSmartCard() {
    if (smartReviewCards.length === 0) return;
    if (currentSmartCardIdx < smartReviewCards.length - 1) {
        currentSmartCardIdx++;
        renderActiveSmartCard();
    } else {
        showToast({ type: 'info', message: 'وصلت لآخر بطاقة في المجموعة!' });
    }
}

function prevSmartCard() {
    if (smartReviewCards.length === 0) return;
    if (currentSmartCardIdx > 0) {
        currentSmartCardIdx--;
        renderActiveSmartCard();
    }
}

async function rateSmartCard(interval) {
    if (smartReviewCards.length === 0) return;
    const card = smartReviewCards[currentSmartCardIdx];

    if (card && card.id) {
        try {
            await fetch(`/api/flashcards/${card.id}/review`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rating: interval })
            });
        } catch (e) {
            console.error("Error rating card:", e);
        }
    }

    showToast({ type: 'success', message: `تمت الجدولة بعد ${interval === '10m' ? '10 دقائق' : interval === '1d' ? 'يوم' : interval === '3d' ? '3 أيام' : '7 أيام'}` });

    if (currentSmartCardIdx < smartReviewCards.length - 1) {
        nextSmartCard();
    } else {
        showToast({ type: 'success', title: 'أحسنت! 👏', message: 'أكملت مراجعة جميع بطاقات نقاط الضعف!' });
    }
}

// ----------------- STAGE 4: COMPREHENSIVE MOCK EXAM -----------------
async function launchComprehensiveMockExam() {
    if (!currentSmartReviewLectureId) return;

    const btn = document.getElementById('btnLaunchMockExam');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>جاري توليد الامتحان الشامل...</span>';
    }

    const taskId = 'mock_exam_' + Date.now();
    startBackgroundTask(taskId, 'توليد الامتحان الشامل (100 MCQ + 10 مقالي)', 'يقوم الذكاء الاصطناعي بتجميع وصياغة أسئلة المحاضرة الشاملة والحالات السريرية والأسئلة المقالية...');

    try {
        const res = await fetch(`/api/lecture/${currentSmartReviewLectureId}/smart_review/generate_mock_exam`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mcq_count: 100, essay_count: 10 })
        });
        const data = await res.json();

        if (data.status === 'success') {
            finishBackgroundTask(taskId);
            playCompletionChime('success');
            showToast({ type: 'success', title: 'الامتحان الشامل جاهز! 🏆', message: `يتضمن ${data.mcq_questions.length} MCQ و ${data.essay_questions.length} سؤال مقالي.` });

            currentMockExamData = data;
            mockMcqAnswers = {};
            mockEssayGrades = {};

            document.getElementById('mockScoreBanner').style.display = 'flex';
            document.getElementById('btnExportMockWord').style.display = 'inline-flex';
            document.getElementById('mockMcqSection').style.display = 'block';
            document.getElementById('mockEssaySection').style.display = 'block';

            renderMockMcqSection(data.mcq_questions);
            renderMockEssaySection(data.essay_questions);
            updateMockExamScores();
        } else {
            finishBackgroundTask(taskId);
            showToast({ type: 'danger', message: data.message || 'تعذر توليد الامتحان' });
        }
    } catch (e) {
        finishBackgroundTask(taskId);
        console.error("Error generating mock exam:", e);
        showToast({ type: 'danger', message: 'حدث خطأ أثناء توليد الامتحان الشامل' });
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-bolt"></i> <span>توليد وبدء الامتحان الشامل</span>';
        }
    }
}

function renderMockMcqSection(questions) {
    const list = document.getElementById('mockMcqQuestionsList');
    const countTag = document.getElementById('mockMcqCountTag');
    if (countTag) countTag.innerText = `${questions.length} سؤال`;
    if (!list) return;

    list.innerHTML = '';
    questions.forEach((q, idx) => {
        const card = document.createElement('div');
        card.className = 'mock-q-card';
        card.id = `mock-mcq-card-${idx}`;

        const choices = getQuestionChoicesList(q);
        const correct = getQuestionCorrectAnswer(q);

        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; margin-bottom: 10px;">
                <div style="font-size: 14px; font-weight: 700; line-height: 1.5; color: var(--text-main);">
                    <span style="display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 6px; background: rgba(59, 130, 246, 0.2); color: #60a5fa; font-size: 12px; margin-left: 8px;">${idx + 1}</span>
                    ${q.question_type === 'clinical_case' ? '<span class="badge-tag" style="background: rgba(168, 85, 247, 0.2); color: #c084fc; font-size: 10px; margin-left: 6px;">حالة سريرية</span>' : ''}
                    ${safeEscape(q.question_text || '')}
                </div>
                ${q.difficulty ? `<span class="badge-tag" style="font-size: 10px;">${safeEscape(q.difficulty)}</span>` : ''}
            </div>
            <div class="mock-choices-wrap" id="mock-choices-${idx}" style="margin-top: 12px;">
                ${choices.map((c, cIdx) => `
                    <button class="mock-choice-btn" onclick="handleMockExamMcqAnswer(${idx}, '${safeEscape(c)}', '${safeEscape(correct)}')">
                        <span>${safeEscape(c)}</span>
                        <i class="fa-regular fa-circle" id="mock-icon-${idx}-${cIdx}"></i>
                    </button>
                `).join('')}
            </div>
            <div class="drill-exp-box" id="mock-exp-${idx}" style="display: none; margin-top: 12px; padding: 12px 14px; background: rgba(59, 130, 246, 0.08); border-radius: 8px; border: 1px solid rgba(59, 130, 246, 0.2); font-size: 12.5px; line-height: 1.6;">
                <div style="color: #60a5fa; font-weight: 700; margin-bottom: 4px;">
                    <i class="fa-solid fa-circle-info"></i> التوضيح الطبي:
                </div>
                <div>${safeEscape(q.explanation || 'لا يوجد شرح إضافي.')}</div>
            </div>
        `;

        list.appendChild(card);
    });
}

function handleMockExamMcqAnswer(qIdx, selected, correct) {
    if (mockMcqAnswers[qIdx] !== undefined) return;

    const isCorrect = isOptionMatch(selected, correct);
    mockMcqAnswers[qIdx] = isCorrect;

    const wrap = document.getElementById(`mock-choices-${qIdx}`);
    if (wrap) {
        const btns = wrap.querySelectorAll('.mock-choice-btn');
        btns.forEach(b => {
            b.disabled = true;
            const text = b.querySelector('span').innerText.trim();
            if (isOptionMatch(text, correct)) {
                b.classList.add('selected-correct');
                const icon = b.querySelector('i');
                if (icon) icon.className = 'fa-solid fa-circle-check text-success';
            } else if (isOptionMatch(text, selected) && !isCorrect) {
                b.classList.add('selected-wrong');
                const icon = b.querySelector('i');
                if (icon) icon.className = 'fa-solid fa-circle-xmark text-danger';
            }
        });
    }

    const expBox = document.getElementById(`mock-exp-${qIdx}`);
    if (expBox) expBox.style.display = 'block';

    updateMockExamScores();
}

function renderMockEssaySection(questions) {
    const list = document.getElementById('mockEssayQuestionsList');
    if (!list) return;

    list.innerHTML = '';
    questions.forEach((q, idx) => {
        const card = document.createElement('div');
        card.className = 'essay-card';
        card.id = `essay-card-${idx}`;

        card.innerHTML = `
            <div class="essay-card-header">
                <div style="display: flex; gap: 12px; align-items: flex-start; flex: 1;">
                    <span class="essay-q-number">${idx + 1}</span>
                    <div class="essay-prompt">${safeEscape(q.prompt || '')}</div>
                </div>
                <span class="badge-tag" id="essay-score-tag-${idx}" style="background: rgba(168, 85, 247, 0.15); color: #c084fc; font-weight: 700; font-size: 11px;">
                    لم يقيم بعد
                </span>
            </div>

            <textarea class="essay-input-area" id="essay-student-ans-${idx}" placeholder="اكتب إجابتك وتحليلك السريري هنا بالتفصيل..."></textarea>

            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                <button class="btn btn-sm btn-outline" style="border-color: rgba(168, 85, 247, 0.4); color: #c084fc;" onclick="toggleEssayModelAnswer(${idx})">
                    <i class="fa-solid fa-key"></i> <span>إظهار الإجابة النموذجية ومعايير التصحيح</span>
                </button>
                <div class="essay-grade-actions" style="margin-top: 0; padding-top: 0; border-top: none;">
                    <span style="font-size: 11.5px; color: var(--text-muted); margin-left: 6px;">التقييم الذاتي:</span>
                    <button class="self-grade-btn grade-full" id="grade-full-${idx}" onclick="gradeEssayAnswer(${idx}, 1.0)">
                        <i class="fa-solid fa-circle-check text-success"></i> صح (+1)
                    </button>
                    <button class="self-grade-btn grade-half" id="grade-half-${idx}" onclick="gradeEssayAnswer(${idx}, 0.5)">
                        <i class="fa-solid fa-circle-half-stroke text-warning"></i> جزئي (+0.5)
                    </button>
                    <button class="self-grade-btn grade-zero" id="grade-zero-${idx}" onclick="gradeEssayAnswer(${idx}, 0.0)">
                        <i class="fa-solid fa-circle-xmark text-danger"></i> خطأ (+0)
                    </button>
                </div>
            </div>

            <div class="essay-model-answer-box" id="essay-model-box-${idx}" style="display: none;">
                <div style="color: #34d399; font-weight: 700; margin-bottom: 6px;">
                    <i class="fa-solid fa-award"></i> النموذج المثالي للإجابة (Ideal Model Answer):
                </div>
                <div style="color: var(--text-main); margin-bottom: 10px; line-height: 1.6;">
                    ${safeEscape(q.ideal_model_answer || '')}
                </div>

                ${q.key_points_to_mention && q.key_points_to_mention.length > 0 ? `
                    <div style="color: #fbbf24; font-weight: 700; margin-bottom: 4px; font-size: 12px;">
                        <i class="fa-solid fa-list-check"></i> النقاط الجوهرية الواجب ذكرها (Key Points):
                    </div>
                    <ul style="margin: 0 16px 10px 0; padding: 0; color: var(--text-muted); font-size: 12px;">
                        ${q.key_points_to_mention.map(kp => `<li>${safeEscape(kp)}</li>`).join('')}
                    </ul>
                ` : ''}

                ${q.guidance_for_grading ? `
                    <div style="font-size: 11.5px; color: #93c5fd; background: rgba(59, 130, 246, 0.1); padding: 8px 12px; border-radius: 6px;">
                        <strong>معايير التصحيح:</strong> ${safeEscape(q.guidance_for_grading)}
                    </div>
                ` : ''}
            </div>
        `;

        list.appendChild(card);
    });
}

function toggleEssayModelAnswer(idx) {
    const box = document.getElementById(`essay-model-box-${idx}`);
    if (!box) return;
    box.style.display = (box.style.display === 'none' || box.style.display === '') ? 'block' : 'none';
}

function gradeEssayAnswer(idx, score) {
    mockEssayGrades[idx] = score;

    const fullBtn = document.getElementById(`grade-full-${idx}`);
    const halfBtn = document.getElementById(`grade-half-${idx}`);
    const zeroBtn = document.getElementById(`grade-zero-${idx}`);

    if (fullBtn) fullBtn.classList.toggle('active', score === 1.0);
    if (halfBtn) halfBtn.classList.toggle('active', score === 0.5);
    if (zeroBtn) zeroBtn.classList.toggle('active', score === 0.0);

    const tag = document.getElementById(`essay-score-tag-${idx}`);
    if (tag) {
        if (score === 1.0) {
            tag.style.background = 'rgba(16, 185, 129, 0.2)';
            tag.style.color = '#34d399';
            tag.innerText = '✅ كامل (1/1)';
        } else if (score === 0.5) {
            tag.style.background = 'rgba(245, 158, 11, 0.2)';
            tag.style.color = '#fbbf24';
            tag.innerText = '⚠️ جزئي (0.5/1)';
        } else {
            tag.style.background = 'rgba(239, 68, 68, 0.2)';
            tag.style.color = '#f87171';
            tag.innerText = '❌ خطأ (0/1)';
        }
    }

    updateMockExamScores();
}

function updateMockExamScores() {
    if (!currentMockExamData) return;

    const totalMcqs = (currentMockExamData.mcq_questions || []).length;
    let correctMcqs = 0;
    Object.values(mockMcqAnswers).forEach(val => {
        if (val === true) correctMcqs++;
    });

    const totalEssays = (currentMockExamData.essay_questions || []).length;
    let essayScoreSum = 0;
    Object.values(mockEssayGrades).forEach(val => {
        essayScoreSum += (val || 0);
    });

    const mcqScoreEl = document.getElementById('mockMcqScore');
    if (mcqScoreEl) mcqScoreEl.innerText = `${correctMcqs} / ${totalMcqs}`;

    const essayScoreEl = document.getElementById('mockEssayScore');
    if (essayScoreEl) essayScoreEl.innerText = `${essayScoreSum} / ${totalEssays}`;

    const totalPossible = totalMcqs + totalEssays;
    const totalAchieved = correctMcqs + essayScoreSum;
    const percentage = totalPossible > 0 ? Math.round((totalAchieved / totalPossible) * 100) : 0;

    const totalPercEl = document.getElementById('mockTotalPercentage');
    if (totalPercEl) totalPercEl.innerText = `${percentage}%`;

    const gradeBadge = document.getElementById('mockMasteryGradeBadge');
    if (gradeBadge) {
        if (percentage >= 90) {
            gradeBadge.style.background = 'rgba(16, 185, 129, 0.25)';
            gradeBadge.style.color = '#34d399';
            gradeBadge.innerText = 'امتياز خارق 🏆 (Mastery)';
        } else if (percentage >= 80) {
            gradeBadge.style.background = 'rgba(59, 130, 246, 0.25)';
            gradeBadge.style.color = '#60a5fa';
            gradeBadge.innerText = 'جيد جداً مرتفع 🌟';
        } else if (percentage >= 65) {
            gradeBadge.style.background = 'rgba(245, 158, 11, 0.25)';
            gradeBadge.style.color = '#fbbf24';
            gradeBadge.innerText = 'جيد (بحاجة لتثبيت) 💡';
        } else {
            gradeBadge.style.background = 'rgba(239, 68, 68, 0.25)';
            gradeBadge.style.color = '#f87171';
            gradeBadge.innerText = 'يحتاج لمراجعة الشرح ⚠️';
        }
    }
}

async function exportCurrentMockExamWord() {
    if (!currentMockExamData || !currentSmartReviewLectureId) {
        showToast({ type: 'warning', message: 'يرجى توليد الامتحان أولاً قبل التصدير' });
        return;
    }

    const btn = document.getElementById('btnExportMockWord');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>جاري إنشاء ملف Word...</span>';
    }

    const lec = allLectures.find(l => l.id === currentSmartReviewLectureId);
    const lecTitle = lec ? lec.title : `Lecture_${currentSmartReviewLectureId}`;

    try {
        const res = await fetch(`/api/lecture/${currentSmartReviewLectureId}/smart_review/export_mock_word`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                mcq_questions: currentMockExamData.mcq_questions || [],
                essay_questions: currentMockExamData.essay_questions || [],
                lecture_title: lecTitle
            })
        });

        const data = await res.json();
        if (data.status === 'success' && data.file_url) {
            playCompletionChime('success');
            showToast({ type: 'success', title: 'تم تصدير ملف Word بنجاح! 📄', message: 'يبدأ التحميل الآن...' });

            const link = document.createElement('a');
            link.href = data.file_url;
            link.download = data.filename || `Mock_Exam_${lecTitle}.docx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            showToast({ type: 'danger', message: data.message || 'تعذر تصدير الملف' });
        }
    } catch (e) {
        console.error("Error exporting mock word:", e);
        showToast({ type: 'danger', message: 'حدث خطأ أثناء تصدير ملف Word' });
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-file-word"></i> <span>تصدير الامتحان لملف Word</span>';
        }
    }
}

// =========================================================================
// QUESTION EDIT & LIVE WORD SYNC HANDLERS
// =========================================================================
function openEditQuestionModal(qId) {
    const q = (window.allRenderedQuestions && window.allRenderedQuestions[qId]) || null;
    if (!q) {
        alert("تعذر العثور على بيانات السؤال");
        return;
    }

    document.getElementById('editQuestionId').value = q.id;
    document.getElementById('editQuestionLectureId').value = q.lecture_id || '';
    
    const isCase = q.question_type === 'case' || (q.case_scenario && q.case_scenario.length > 5);
    document.getElementById('editQuestionType').value = isCase ? 'case' : 'mcq';
    toggleEditQuestionTypeUI();

    document.getElementById('editQuestionScenario').value = q.case_scenario || '';
    document.getElementById('editQuestionText').value = q.question_text || '';
    document.getElementById('editQuestionOptA').value = q.option_a || '';
    document.getElementById('editQuestionOptB').value = q.option_b || '';
    document.getElementById('editQuestionOptC').value = q.option_c || '';
    document.getElementById('editQuestionOptD').value = q.option_d || '';
    document.getElementById('editQuestionCorrect').value = (q.correct_option || 'A').toUpperCase().charAt(0);
    document.getElementById('editQuestionDifficulty').value = q.difficulty || 'medium';
    document.getElementById('editQuestionExplanation').value = q.explanation_arabic || q.explanation || '';

    openModal('editQuestionModal');
}

function toggleEditQuestionTypeUI() {
    const type = document.getElementById('editQuestionType').value;
    const grp = document.getElementById('editQuestionScenarioGroup');
    if (grp) grp.style.display = (type === 'case') ? 'block' : 'none';
}

async function saveCurrentEditingQuestion() {
    const qId = parseInt(document.getElementById('editQuestionId').value);
    const lecture_id = parseInt(document.getElementById('editQuestionLectureId').value);
    const question_type = document.getElementById('editQuestionType').value;
    const case_scenario = document.getElementById('editQuestionScenario').value.trim();
    const question_text = document.getElementById('editQuestionText').value.trim();
    const option_a = document.getElementById('editQuestionOptA').value.trim();
    const option_b = document.getElementById('editQuestionOptB').value.trim();
    const option_c = document.getElementById('editQuestionOptC').value.trim();
    const option_d = document.getElementById('editQuestionOptD').value.trim();
    const correct_option = document.getElementById('editQuestionCorrect').value;
    const difficulty = document.getElementById('editQuestionDifficulty').value;
    const explanation = document.getElementById('editQuestionExplanation').value.trim();

    if (!question_text || !option_a || !option_b) {
        alert("يرجى ملء نص السؤال والخيارات الأساسية (A و B على الأقل).");
        return;
    }

    showLoading("جاري حفظ التعديل ومزامنة ملف Word للمحاضرة...");
    try {
        const res = await fetch(`/api/questions/${qId}/edit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                question_type, case_scenario, question_text,
                option_a, option_b, option_c, option_d,
                correct_option, difficulty, explanation, explanation_arabic: explanation
            })
        });
        const data = await res.json();
        hideLoading();

        if (data.success) {
            closeModal('editQuestionModal');
            showToast({
                type: 'success',
                title: 'تم تعديل السؤال بنجاح! ✏️',
                message: 'تم تحديث السؤال في بنك الأسئلة ومزامنة ملف Word التابع للمحاضرة فوراً.'
            });

            // Update in-memory cache
            if (window.allRenderedQuestions && window.allRenderedQuestions[qId]) {
                const old = window.allRenderedQuestions[qId];
                old.question_type = question_type;
                old.case_scenario = case_scenario;
                old.question_text = question_text;
                old.option_a = option_a;
                old.option_b = option_b;
                old.option_c = option_c;
                old.option_d = option_d;
                old.correct_option = correct_option;
                old.difficulty = difficulty;
                old.explanation = explanation;
                old.explanation_arabic = explanation;
            }

            // Reload UI if in study center or questions tab
            if (typeof currentStudyLectureId !== 'undefined' && currentStudyLectureId === lecture_id) {
                if (typeof loadModalQuestions === 'function') loadModalQuestions(lecture_id);
            }
            const qTab = document.getElementById('tab-questions');
            if (qTab && qTab.classList.contains('active')) {
                if (typeof loadQuestions === 'function') loadQuestions();
            }
        } else {
            alert(data.error || "فشل حفظ التعديل");
        }
    } catch (e) {
        hideLoading();
        alert("خطأ: " + e);
    }
}

async function deleteCurrentEditingQuestion() {
    const qId = parseInt(document.getElementById('editQuestionId').value);
    const lecture_id = parseInt(document.getElementById('editQuestionLectureId').value);
    if (!confirm("هل أنت متأكد من حذف هذا السؤال نهائياً؟ سيتم حذفه من بنك الأسئلة وتحديث ملف Word فوراً.")) {
        return;
    }

    showLoading("جاري حذف السؤال وتحديث ملف Word...");
    try {
        const res = await fetch(`/api/questions/${qId}`, { method: 'DELETE' });
        const data = await res.json();
        hideLoading();

        if (data.success) {
            closeModal('editQuestionModal');
            showToast({
                type: 'success',
                title: 'تم حذف السؤال 🗑️',
                message: 'تم حذف السؤال وتحديث ملف Word للمحاضرة بنجاح.'
            });

            const card = document.getElementById(`q-card-${qId}`);
            if (card) card.remove();

            if (typeof currentStudyLectureId !== 'undefined' && currentStudyLectureId === lecture_id) {
                if (typeof loadModalQuestions === 'function') loadModalQuestions(lecture_id);
            }
        } else {
            alert(data.error || "فشل حذف السؤال");
        }
    } catch (e) {
        hideLoading();
        alert("خطأ: " + e);
    }
}

// =========================================================================
// SELECTIVE WORD BATCH EXPORT HANDLERS
// =========================================================================
async function openWordBatchExportModal(lecId) {
    const lec = allLectures.find(l => l.id === lecId);
    const title = lec ? `${lec.lecture_number ? '#' + lec.lecture_number + ' ' : ''}${lec.title}` : `المحاضرة #${lecId}`;

    document.getElementById('exportWordLectureId').value = lecId;
    document.getElementById('exportWordLectureTitle').innerText = title;

    const listEl = document.getElementById('wordBatchesCheckboxList');
    listEl.innerHTML = '<div style="text-align:center; padding:15px; color:var(--text-muted);"><i class="fa-solid fa-spinner fa-spin"></i> جاري تحميل دفعات الأسئلة...</div>';
    openModal('exportWordBatchModal');

    try {
        const res = await fetch(`/api/lecture/${lecId}/batches`);
        const data = await res.json();
        listEl.innerHTML = '';

        const details = data.batch_details || [];
        if (details.length === 0) {
            listEl.innerHTML = '<div style="text-align:center; padding:15px; color:var(--text-muted);">لا توجد أسئلة أو دفعات مضافة لهذه المحاضرة بعد.</div>';
            return;
        }

        details.forEach(b => {
            const row = document.createElement('label');
            row.className = 'word-batch-item';
            row.innerHTML = `
                <input type="checkbox" class="word-batch-chk" value="${b.batch_number}" checked>
                <div style="flex:1;">
                    <div style="font-weight:600; font-size:13.5px; color:#f1f5f9;">
                        ⚡ باتش ${b.batch_number}: ${b.batch_name}
                    </div>
                    <div style="font-size:11.5px; color:var(--text-muted); margin-top:2px;">
                        عدد الأسئلة: <span style="color:#60a5fa; font-weight:700;">${b.count}</span> سؤال | المصدر: ${b.source || 'ai_generated'}
                    </div>
                </div>
            `;
            listEl.appendChild(row);
        });
    } catch (e) {
        listEl.innerHTML = `<div style="color:var(--danger); padding:10px;">تعذر تحميل الدفعات: ${e}</div>`;
    }
}

function toggleAllWordBatches(check) {
    document.querySelectorAll('.word-batch-chk').forEach(c => c.checked = check);
}

async function executeWordBatchAction(action) {
    const lecId = parseInt(document.getElementById('exportWordLectureId').value);
    const checked = Array.from(document.querySelectorAll('.word-batch-chk:checked')).map(c => parseInt(c.value));

    if (checked.length === 0) {
        alert("يرجى تحديد دفعة (Batch) واحدة على الأقل لتضمينها في ملف Word.");
        return;
    }

    const expRadio = document.querySelector('input[name="wordExportExplanationOption"]:checked');
    const includeExplanation = expRadio ? (expRadio.value === 'yes') : true;

    if (action === 'download') {
        showLoading("جاري بناء وتحميل ملف Word للدفعات المحددة...");
        try {
            const res = await fetch(`/api/lecture/${lecId}/export_word`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    selected_batches: checked,
                    action: 'download',
                    include_explanation: includeExplanation
                })
            });
            hideLoading();
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                const disposition = res.headers.get('Content-Disposition');
                let filename = `Lecture_${lecId}_Questions.docx`;
                if (disposition && disposition.indexOf('filename=') !== -1) {
                    filename = decodeURIComponent(disposition.split('filename=')[1].replace(/["']/g, ''));
                }
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                closeModal('exportWordBatchModal');
                showToast({
                    type: 'success',
                    title: 'تم تحميل ملف Word بنجاح ⬇️',
                    message: 'تم تجهيز وتنزيل ملف الأسئلة للدفعات المختارة.'
                });
            } else {
                const err = await res.json();
                alert(err.error || "تعذر تحميل الملف");
            }
        } catch (e) {
            hideLoading();
            alert("خطأ أثناء التحميل: " + e);
        }
    } else {
        // action === 'open'
        showLoading("جاري تجهيز وفتح ملف Word للدفعات المحددة...");
        try {
            const res = await fetch(`/api/lecture/${lecId}/export_word`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    selected_batches: checked,
                    action: 'open',
                    include_explanation: includeExplanation
                })
            });
            const data = await res.json();
            hideLoading();
            if (data.success) {
                closeModal('exportWordBatchModal');
                showToast({
                    type: 'success',
                    title: 'تم فتح ملف Word 📄',
                    message: 'تم فتح ملف الدفعات المختارة في برنامج Microsoft Word على جهازك بنجاح.'
                });
            } else {
                alert(data.error || "تعذر فتح الملف");
            }
        } catch (e) {
            hideLoading();
            alert("خطأ أثناء فتح الملف: " + e);
        }
    }
}

// =========================================================================
// TRANSCRIPT SELECTION CONTEXT MENU & QUESTION GENERATION
// =========================================================================
let currentTranscriptSelectedText = "";
let currentTranscriptGeneratedQuestions = [];

function setupTranscriptContextMenu() {
    const menu = document.getElementById('transcriptContextMenu');
    const transcriptEl = document.getElementById('transcriptOutput');

    if (!menu || !transcriptEl) return;

    // Handle right-click on transcript
    document.addEventListener('contextmenu', function(e) {
        if (!transcriptEl.contains(e.target)) {
            menu.style.display = 'none';
            return;
        }

        const sel = window.getSelection().toString().trim();
        if (sel.length >= 5) {
            e.preventDefault();
            currentTranscriptSelectedText = sel;
            menu.style.display = 'flex';
            menu.style.left = `${Math.min(e.pageX, window.innerWidth - 250)}px`;
            menu.style.top = `${e.pageY + 5}px`;
        } else {
            menu.style.display = 'none';
        }
    });

    // Close menu on click elsewhere
    document.addEventListener('click', function(e) {
        if (!menu.contains(e.target)) {
            menu.style.display = 'none';
        }
    });
}

function onTriggerTranscriptExcerptQuestions() {
    const menu = document.getElementById('transcriptContextMenu');
    if (menu) menu.style.display = 'none';

    if (!currentTranscriptSelectedText) {
        const sel = window.getSelection().toString().trim();
        if (sel) currentTranscriptSelectedText = sel;
    }

    if (!currentTranscriptSelectedText || currentTranscriptSelectedText.length < 5) {
        alert("يرجى تظليل نص أو فقرة من التفريغ الصوتي أولاً.");
        return;
    }

    const audioFilename = (window.currentActiveAudioNote && window.currentActiveAudioNote.audio_filename) || "تسجيل صوتي";
    const lecId = (window.currentActiveAudioNote && window.currentActiveAudioNote.lecture_id)
        || (typeof currentStudyLectureId !== 'undefined' && currentStudyLectureId)
        || (document.getElementById('questionsLectureFilter')?.value ? parseInt(document.getElementById('questionsLectureFilter').value) : null)
        || (allLectures[0] ? allLectures[0].id : 1);

    const defaultBatch = audioFilename && audioFilename !== 'تسجيل صوتي' ? `فويس: ${audioFilename}` : 'أسئلة تفريغ التسجيل';
    openInteractiveQuestionStudio({
        excerpt_text: currentTranscriptSelectedText,
        audio_filename: audioFilename,
        target_lec_id: lecId,
        default_batch_name: defaultBatch
    });
}

function openStudioFromTranscript() {
    const audioFilename = (window.currentActiveAudioNote && window.currentActiveAudioNote.audio_filename) || "تسجيل صوتي";
    const lecId = (window.currentActiveAudioNote && window.currentActiveAudioNote.lecture_id)
        || (typeof currentStudyLectureId !== 'undefined' && currentStudyLectureId)
        || (document.getElementById('questionsLectureFilter')?.value ? parseInt(document.getElementById('questionsLectureFilter').value) : null)
        || (allLectures[0] ? allLectures[0].id : 1);
    
    let selectedText = window.getSelection().toString().trim();
    if (!selectedText && window.currentTranscriptSelectedText) {
        selectedText = window.currentTranscriptSelectedText;
    }
    if (!selectedText) {
        const text = document.getElementById('transcriptOutput')?.innerText?.trim() || "";
        if (text && !text.includes("ارفع ريكورد أو اضغط على ريكورد أنس")) {
            selectedText = text.slice(0, 1500);
        }
    }

    const defaultBatch = audioFilename && audioFilename !== 'تسجيل صوتي' ? `فويس: ${audioFilename}` : 'أسئلة تفريغ التسجيل';
    openInteractiveQuestionStudio({
        excerpt_text: selectedText,
        audio_filename: audioFilename,
        target_lec_id: lecId,
        default_batch_name: defaultBatch
    });
}

function onCopyTranscriptSelection() {
    const menu = document.getElementById('transcriptContextMenu');
    if (menu) menu.style.display = 'none';
    if (currentTranscriptSelectedText) {
        navigator.clipboard.writeText(currentTranscriptSelectedText);
        showToast({ type: 'success', title: 'تم النسخ 📋', message: 'تم نسخ النص المحدد إلى الحافظة.' });
    }
}

// =========================================================================
// INTERACTIVE AI QUESTION STUDIO (توليد، تحسين بالـ AI، تحديد المحاضرة، حفظ)
// =========================================================================
window.currentStudioQuestion = null;
window.currentStudioExcerpt = "";
window.currentStudioAudioFilename = "";

async function loadStudioBatches(lecId, defaultBatchName = null) {
    const batchSel = document.getElementById('studioTargetBatchSelect');
    const newBatchInput = document.getElementById('studioNewBatchInput');
    if (!batchSel) return;

    batchSel.innerHTML = '<option value="__new__">➕ إنشاء دفعة / باتش جديد وتسميته...</option>';
    if (newBatchInput && defaultBatchName) {
        newBatchInput.value = defaultBatchName;
    }

    if (lecId) {
        try {
            const res = await fetch(`/api/lecture/${lecId}/batches`);
            const data = await res.json();
            if (data.batch_details && data.batch_details.length > 0) {
                data.batch_details.forEach(b => {
                    const opt = document.createElement('option');
                    opt.value = b.batch_name;
                    opt.innerText = `📂 ${b.display_title || b.batch_name} (${b.count} سؤال)`;
                    batchSel.appendChild(opt);
                });
            }
        } catch (e) {
            console.error("Error loading studio batches:", e);
        }
    }

    if (defaultBatchName) {
        let found = false;
        for (let i = 0; i < batchSel.options.length; i++) {
            if (batchSel.options[i].value === defaultBatchName) {
                batchSel.selectedIndex = i;
                found = true;
                break;
            }
        }
        if (!found) {
            batchSel.value = '__new__';
            if (newBatchInput) newBatchInput.value = defaultBatchName;
        }
    } else {
        batchSel.value = '__new__';
    }

    onStudioBatchSelectChange();
}

function onStudioLectureChange() {
    const lecId = parseInt(document.getElementById('studioTargetLectureSelect')?.value) || null;
    loadStudioBatches(lecId);
}

function onStudioBatchSelectChange() {
    const batchSel = document.getElementById('studioTargetBatchSelect');
    const newGroup = document.getElementById('studioNewBatchGroup');
    if (newGroup) {
        newGroup.style.display = (batchSel && batchSel.value === '__new__') ? 'block' : 'none';
    }
}

function openInteractiveQuestionStudio(options = {}) {
    window.currentStudioExcerpt = options.excerpt_text || "";
    window.currentStudioAudioFilename = options.audio_filename || "";

    const excerptBox = document.getElementById('studioExcerptContainer');
    const topicBox = document.getElementById('studioTopicContainer');
    const excerptPreview = document.getElementById('studioExcerptPreview');
    const topicInput = document.getElementById('studioTopicInput');

    if (window.currentStudioExcerpt) {
        if (excerptBox) excerptBox.style.display = 'block';
        if (excerptPreview) excerptPreview.innerText = window.currentStudioExcerpt;
        if (topicBox) topicBox.style.display = 'none';
    } else {
        if (excerptBox) excerptBox.style.display = 'none';
        if (topicBox) topicBox.style.display = 'block';
        if (topicInput) topicInput.value = options.topic || '';
    }

    // Populate Target Lectures Dropdown ("اقرر يروح لانهي محاضرة")
    const lecSelect = document.getElementById('studioTargetLectureSelect');
    let targetId = 1;
    if (lecSelect) {
        lecSelect.innerHTML = '';
        allLectures.forEach(l => {
            const opt = document.createElement('option');
            opt.value = l.id;
            opt.innerText = `${l.lecture_number ? '#' + l.lecture_number + ' ' : ''}${l.title}`;
            lecSelect.appendChild(opt);
        });

        targetId = options.target_lec_id 
            || options.lectureId
            || (window.currentActiveAudioNote && window.currentActiveAudioNote.lecture_id)
            || (typeof currentStudyLectureId !== 'undefined' && currentStudyLectureId)
            || (document.getElementById('questionsLectureFilter')?.value ? parseInt(document.getElementById('questionsLectureFilter').value) : null)
            || (allLectures[0] ? allLectures[0].id : 1);
        lecSelect.value = targetId;
    }

    const defaultBatchName = options.default_batch_name || (options.excerpt_text ? 'أسئلة تفريغ التسجيل' : 'سؤال ذكي مخصص');
    loadStudioBatches(targetId, defaultBatchName);

    // Reset fields
    document.getElementById('studioQuestionCard').style.display = 'none';
    document.getElementById('btnSaveInteractiveQuestion').disabled = true;
    document.getElementById('studioAiRefineInput').value = '';

    openModal('interactiveQuestionStudioModal');

    if (options.initial_question) {
        window.currentStudioQuestion = options.initial_question;
        populateStudioQuestion(options.initial_question);
        if (options.initial_question.question_type) {
            const tSel = document.getElementById('studioTypeSelect');
            if (tSel) {
                tSel.value = options.initial_question.question_type;
                onStudioTypeChange();
            }
        }
        if (options.initial_question.difficulty) {
            const dSel = document.getElementById('studioDifficultySelect');
            if (dSel) dSel.value = options.initial_question.difficulty;
        }
        const saveBtn = document.getElementById('btnSaveInteractiveQuestion');
        if (saveBtn) saveBtn.disabled = false;
    } else {
        // Automatically trigger generation immediately so the user doesn't wait!
        executeInteractiveSingleGen();
    }
}

function onStudioTypeChange() {
    const qType = document.getElementById('studioTypeSelect').value;
    const scSec = document.getElementById('studioScenarioSection');
    const badge = document.getElementById('studioBadge');
    if (scSec) scSec.style.display = (qType === 'case') ? 'block' : 'none';
    if (badge) {
        badge.className = (qType === 'case') ? 'q-badge q-badge-case' : 'q-badge q-badge-mcq';
        badge.innerHTML = (qType === 'case') ? '<i class="fa-solid fa-stethoscope"></i> حالة سريرية (Case)' : '<i class="fa-solid fa-file-lines"></i> سؤال MCQ';
    }
}

async function executeInteractiveSingleGen() {
    const btn = document.getElementById('btnRunInteractiveGen');
    const lecId = parseInt(document.getElementById('studioTargetLectureSelect')?.value) || 1;
    const qType = document.getElementById('studioTypeSelect')?.value || 'mcq';
    const difficulty = document.getElementById('studioDifficultySelect')?.value || 'medium';
    const topic = document.getElementById('studioTopicInput')?.value?.trim() || '';

    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري التوليد بالـ AI...';
    }

    try {
        const res = await fetch('/api/questions/generate_single', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                lecture_id: lecId,
                excerpt_text: window.currentStudioExcerpt || '',
                topic: topic,
                question_type: qType,
                difficulty: difficulty
            })
        });

        const data = await res.json();
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> توليد سؤال بالـ AI';
        }

        if (data.success && data.question) {
            populateStudioQuestion(data.question);
            showToast({
                type: 'success',
                title: 'تم توليد السؤال بنجاح! 🎯',
                message: 'يمكنك الآن مراجعة السؤال، توجيه الـ AI لتحسينه، أو تحديد المحاضرة وحفظه.'
            });
        } else {
            alert(data.error || "تعذر توليد السؤال");
        }
    } catch (e) {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> توليد سؤال بالـ AI';
        }
        alert("خطأ أثناء التوليد: " + e);
    }
}

function selectStudioCorrectOption(letter) {
    letter = (letter || 'A').toUpperCase().charAt(0);
    const hiddenSelect = document.getElementById('studioCorrectSelect');
    if (hiddenSelect) hiddenSelect.value = letter;

    ['A', 'B', 'C', 'D'].forEach(opt => {
        const card = document.getElementById(`studioOptCard${opt}`);
        if (card) {
            if (opt === letter) {
                card.classList.add('is-correct');
            } else {
                card.classList.remove('is-correct');
            }
        }
    });
}

function applyQuickAiPrompt(promptText) {
    const inp = document.getElementById('studioAiRefineInput');
    if (inp) {
        inp.value = promptText;
        executeInteractiveRefine();
    }
}

function populateStudioQuestion(q) {
    window.currentStudioQuestion = q;
    const isCase = q.question_type === 'case' || (q.case_scenario && q.case_scenario.trim().length > 5);

    document.getElementById('studioTypeSelect').value = isCase ? 'case' : 'mcq';
    onStudioTypeChange();

    document.getElementById('studioScenarioInput').value = q.case_scenario || '';
    document.getElementById('studioPromptInput').value = q.question_text || '';
    document.getElementById('studioOptA').value = q.option_a || '';
    document.getElementById('studioOptB').value = q.option_b || '';
    document.getElementById('studioOptC').value = q.option_c || '';
    document.getElementById('studioOptD').value = q.option_d || '';
    
    const correctLetter = (q.correct_option || 'A').toUpperCase().charAt(0);
    selectStudioCorrectOption(correctLetter);
    
    document.getElementById('studioExplanationInput').value = q.explanation || q.explanation_arabic || '';

    document.getElementById('studioQuestionCard').style.display = 'flex';
    document.getElementById('btnSaveInteractiveQuestion').disabled = false;
}

// "اقول لل AI يحسنه ازاي" (Tell AI how to improve/refine the question)
async function executeInteractiveRefine() {
    const instruction = document.getElementById('studioAiRefineInput')?.value?.trim();
    if (!instruction) {
        alert("يرجى كتابة توجيهك للذكاء الاصطناعي (مثال: اجعل السؤال أصعب، ركز على التشخيص التفريقي، غير خيار D...)");
        return;
    }

    const currentQ = {
        question_type: document.getElementById('studioTypeSelect').value,
        case_scenario: document.getElementById('studioScenarioInput').value.trim(),
        question_text: document.getElementById('studioPromptInput').value.trim(),
        option_a: document.getElementById('studioOptA').value.trim(),
        option_b: document.getElementById('studioOptB').value.trim(),
        option_c: document.getElementById('studioOptC').value.trim(),
        option_d: document.getElementById('studioOptD').value.trim(),
        correct_option: document.getElementById('studioCorrectSelect').value,
        explanation: document.getElementById('studioExplanationInput').value.trim(),
        difficulty: document.getElementById('studioDifficultySelect').value
    };

    const btn = document.getElementById('btnRunStudioRefine');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري التحسين...';
    }

    try {
        const res = await fetch('/api/questions/refine_with_ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                question: currentQ,
                instruction: instruction,
                context: window.currentStudioExcerpt || ''
            })
        });
        const data = await res.json();
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-rotate"></i> تحسين بالـ AI';
        }

        if (data.success && data.question) {
            populateStudioQuestion(data.question);
            document.getElementById('studioAiRefineInput').value = '';
            showToast({
                type: 'success',
                title: 'تم تحسين وتعديل السؤال بالـ AI! ✨',
                message: 'تم تطبيق توجيهاتك وتحديث السؤال فوراً.'
            });
        } else {
            alert(data.error || "تعذر تحسين السؤال");
        }
    } catch (e) {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-rotate"></i> تحسين بالـ AI';
        }
        alert("خطأ أثناء تحسين السؤال: " + e);
    }
}

// "ولا الغيه" (Discard question)
function discardInteractiveQuestion() {
    if (confirm("هل تريد إلغاء وتجاهل هذا السؤال دون حفظه؟")) {
        window.currentStudioQuestion = null;
        closeModal('interactiveQuestionStudioModal');
        showToast({
            type: 'info',
            title: 'تم إلغاء السؤال 🗑️',
            message: 'تم تجاهل السؤال ولم يتم حفظ أي بيانات.'
        });
    }
}

// "اعتماد وحفظ السؤال في بنك المحاضرة ومزامنة Word"
async function saveInteractiveQuestion() {
    const lecId = parseInt(document.getElementById('studioTargetLectureSelect').value);
    if (!lecId) {
        alert("يرجى اختيار المحاضرة المستهدفة لحفظ السؤال بها.");
        return;
    }

    const question_type = document.getElementById('studioTypeSelect').value;
    const case_scenario = document.getElementById('studioScenarioInput').value.trim();
    const question_text = document.getElementById('studioPromptInput').value.trim();
    const option_a = document.getElementById('studioOptA').value.trim();
    const option_b = document.getElementById('studioOptB').value.trim();
    const option_c = document.getElementById('studioOptC').value.trim();
    const option_d = document.getElementById('studioOptD').value.trim();
    const correct_option = document.getElementById('studioCorrectSelect').value;
    const explanation = document.getElementById('studioExplanationInput').value.trim();
    const difficulty = document.getElementById('studioDifficultySelect').value;

    if (!question_text || !option_a || !option_b) {
        alert("يرجى ملء نص السؤال والخيارات الأساسية (A و B على الأقل).");
        return;
    }

    const batchSel = document.getElementById('studioTargetBatchSelect');
    let batch_name = "";
    if (batchSel && batchSel.value === '__new__') {
        batch_name = (document.getElementById('studioNewBatchInput')?.value || "").trim() || (window.currentStudioExcerpt ? "أسئلة تفريغ التسجيل" : "توليد ذكي تفاعلي");
    } else if (batchSel && batchSel.value) {
        batch_name = batchSel.value;
    } else {
        batch_name = (window.currentStudioExcerpt ? "أسئلة تفريغ التسجيل" : "توليد ذكي تفاعلي");
    }

    const questionData = {
        question_type: question_type,
        case_scenario: case_scenario,
        question_text: question_text,
        option_a: option_a,
        option_b: option_b,
        option_c: option_c,
        option_d: option_d,
        correct_option: correct_option,
        explanation: explanation,
        explanation_arabic: explanation,
        difficulty: difficulty,
        lecture_evidence: window.currentStudioExcerpt ? "مقتبس من الشرح الصوتي" : ""
    };

    const audioFilename = window.currentStudioAudioFilename || "تسجيل صوتي";
    const btn = document.getElementById('btnSaveInteractiveQuestion');
    if (btn) btn.disabled = true;

    showLoading("جاري حفظ السؤال في بنك المحاضرة وتحديث ملف Word (.docx)...");

    try {
        const res = await fetch('/api/audio/save_transcript_questions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                lecture_id: lecId,
                batch_name: batch_name,
                audio_filename: window.currentStudioExcerpt ? audioFilename : "توليد ذكي تفاعلي",
                questions: [questionData]
            })
        });
        const data = await res.json();
        hideLoading();

        if (data.success) {
            closeModal('interactiveQuestionStudioModal');
            showToast({
                type: 'success',
                title: 'تم اعتماد وحفظ السؤال بنجاح! 🎉',
                message: `تمت إضافة السؤال لدفعة (${data.batch_name}) في المحاضرة ومزامنة ملف Word فوراً.`
            });

            // Reload questions view if active
            if (typeof currentStudyLectureId !== 'undefined' && currentStudyLectureId === lecId) {
                if (typeof loadModalQuestions === 'function') loadModalQuestions(lecId);
            }
            const qTab = document.getElementById('tab-questions');
            if (qTab && qTab.classList.contains('active')) {
                if (typeof loadQuestions === 'function') loadQuestions();
            }
        } else {
            alert(data.error || "تعذر حفظ السؤال");
            if (btn) btn.disabled = false;
        }
    } catch (e) {
        hideLoading();
        alert("خطأ أثناء الحفظ: " + e);
        if (btn) btn.disabled = false;
    }
}

// Initialize Context Menu
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupTranscriptContextMenu);
} else {
    setupTranscriptContextMenu();
}

// ==========================================
// API TOKENS & QUOTA MONITOR SYSTEM ⚡
// ==========================================
let tokenResetTimer = null;
let tokenRemainingSeconds = 0;

async function loadTokenStats() {
    try {
        const res = await fetch('/api/tokens/summary');
        const data = await res.json();
        if (!data.success) return;

        // 1. Quota Reset Countdown
        const rInfo = data.reset_info || {};
        tokenRemainingSeconds = rInfo.seconds_until_reset || 0;
        updateTokenCountdownDisplay();

        if (tokenResetTimer) clearInterval(tokenResetTimer);
        tokenResetTimer = setInterval(() => {
            if (tokenRemainingSeconds > 0) {
                tokenRemainingSeconds--;
                updateTokenCountdownDisplay();
            } else {
                loadTokenStats();
            }
        }, 1000);

        const localTimeEl = document.getElementById('tokenResetLocalTime');
        if (localTimeEl && rInfo.reset_time_local) {
            localTimeEl.textContent = `تتجدد الساعة ${rInfo.reset_time_local} (00:00 UTC)`;
        }

        // 2. Today's Requests & Limit Bar
        const today = data.today || {};
        const reqsUsed = today.requests_count || 0;
        const rpdLimit = rInfo.rpd_limit || 1500;
        const rpdPct = rInfo.rpd_percent || 0;
        const rpdRem = rInfo.rpd_remaining || 0;

        const reqsEl = document.getElementById('tokenTodayRequests');
        if (reqsEl) reqsEl.textContent = reqsUsed.toLocaleString();

        const rpdBar = document.getElementById('tokenRpdBar');
        if (rpdBar) {
            rpdBar.style.width = `${Math.min(100, rpdPct)}%`;
            if (rpdPct > 85) {
                rpdBar.style.background = 'linear-gradient(90deg, #f59e0b, #ef4444)';
            } else {
                rpdBar.style.background = 'linear-gradient(90deg, #10b981, #3b82f6)';
            }
        }

        const pctEl = document.getElementById('tokenRpdPercent');
        if (pctEl) pctEl.textContent = `${rpdPct}%`;

        const remEl = document.getElementById('tokenRpdRemaining');
        if (remEl) remEl.textContent = rpdRem.toLocaleString();

        // 3. Today's Tokens
        const todayTotalEl = document.getElementById('tokenTodayTotal');
        if (todayTotalEl) todayTotalEl.textContent = (today.total_tokens || 0).toLocaleString();

        const todayPromptEl = document.getElementById('tokenTodayPrompt');
        if (todayPromptEl) todayPromptEl.textContent = (today.prompt_tokens || 0).toLocaleString();

        const todayCandEl = document.getElementById('tokenTodayCand');
        if (todayCandEl) todayCandEl.textContent = (today.candidates_tokens || 0).toLocaleString();

        // 4. All-Time Tokens
        const allTime = data.all_time || {};
        const allTimeTotalEl = document.getElementById('tokenAllTimeTotal');
        if (allTimeTotalEl) allTimeTotalEl.textContent = (allTime.total_tokens || 0).toLocaleString();

        const allTimeReqsEl = document.getElementById('tokenAllTimeReqs');
        if (allTimeReqsEl) allTimeReqsEl.textContent = (allTime.requests_count || 0).toLocaleString();

        // 5. Model Breakdown
        const modelListEl = document.getElementById('tokenModelBreakdownList');
        if (modelListEl) {
            const byModel = data.by_model || [];
            if (byModel.length === 0) {
                modelListEl.innerHTML = '<div style="color: var(--text-muted); font-size: 13px; text-align: center; padding: 16px;">لا يوجد استهلاك مسجل بعد</div>';
            } else {
                modelListEl.innerHTML = byModel.map(m => `
                    <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.03); padding: 10px 14px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span class="badge" style="background: rgba(59, 130, 246, 0.15); color: #60a5fa; font-weight: 700; font-size: 12px; padding: 2px 8px; border-radius: 4px;">${escapeHtml(m.model)}</span>
                            <span style="font-size: 12px; color: var(--text-muted);">${m.requests} طلب</span>
                        </div>
                        <div style="font-size: 13px; font-weight: 700; color: #34d399;">
                            ${(m.total_tokens || 0).toLocaleString()} <span style="font-size: 11px; color: var(--text-muted); font-weight: 400;">توكين</span>
                        </div>
                    </div>
                `).join('');
            }
        }

        // 6. Operation Breakdown
        const opListEl = document.getElementById('tokenOperationBreakdownList');
        if (opListEl) {
            const byOp = data.by_operation || [];
            const opNames = {
                'general': 'عام واستفسارات',
                'audio_transcription': 'تفريغ ريكوردات (أنس)',
                'exam_filtering': 'فلترة امتحانات سابقة',
                'question_generation': 'توليد أسئلة وتدريبات',
                'smart_review': 'مراجعة ذكية وتشخيص',
                'lecture_explanation': 'شرح وتلخيص المحاضرة'
            };
            if (byOp.length === 0) {
                opListEl.innerHTML = '<div style="color: var(--text-muted); font-size: 13px; text-align: center; padding: 16px;">لا يوجد استهلاك مسجل بعد</div>';
            } else {
                opListEl.innerHTML = byOp.map(o => `
                    <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.03); padding: 10px 14px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="font-size: 13px; font-weight: 600; color: var(--text-main);">${opNames[o.operation] || escapeHtml(o.operation)}</span>
                            <span style="font-size: 11px; color: var(--text-muted);">(${o.requests} طلب)</span>
                        </div>
                        <div style="font-size: 13px; font-weight: 700; color: #fbbf24;">
                            ${(o.total_tokens || 0).toLocaleString()} <span style="font-size: 11px; color: var(--text-muted); font-weight: 400;">توكين</span>
                        </div>
                    </div>
                `).join('');
            }
        }

        // 7. Recent Logs Table
        const logsBody = document.getElementById('tokenRecentLogsBody');
        if (logsBody) {
            const logs = data.recent_logs || [];
            const opNames = {
                'general': 'استدعاء عام',
                'audio_transcription': 'تفريغ صوتي 🎙️',
                'exam_filtering': 'فلترة امتحانات 📄',
                'question_generation': 'توليد أسئلة ✍️',
                'smart_review': 'مراجعة ذكية 🧠',
                'lecture_explanation': 'شرح محاضرة 📖'
            };
            if (logs.length === 0) {
                logsBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 25px; color: var(--text-muted);">لم يتم تسجيل أي استدعاءات بعد. ابدأ باستخدام الفلترة أو التفريغ لتظهر العمليات هنا فوراً.</td></tr>';
            } else {
                logsBody.innerHTML = logs.map(l => `
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);">
                        <td style="padding: 10px; font-family: monospace; font-size: 12px; color: var(--text-muted);">${escapeHtml(l.timestamp || '')}</td>
                        <td style="padding: 10px;"><span class="badge" style="background: rgba(59, 130, 246, 0.12); color: #60a5fa; font-size: 11px; padding: 2px 8px; border-radius: 4px;">${opNames[l.operation] || escapeHtml(l.operation)}</span></td>
                        <td style="padding: 10px; font-size: 12px; color: #94a3b8;">${escapeHtml(l.model || '')}</td>
                        <td style="padding: 10px; font-family: monospace; color: #cbd5e1;">${(l.prompt_tokens || 0).toLocaleString()}</td>
                        <td style="padding: 10px; font-family: monospace; color: #cbd5e1;">${(l.candidates_tokens || 0).toLocaleString()}</td>
                        <td style="padding: 10px; font-family: monospace; font-weight: 700; color: #34d399;">${(l.total_tokens || 0).toLocaleString()}</td>
                    </tr>
                `).join('');
            }
        }
    } catch (e) {
        console.error("Failed to load token stats:", e);
    }
}

function updateTokenCountdownDisplay() {
    const el = document.getElementById('tokenResetCountdown');
    if (!el) return;
    const h = Math.floor(tokenRemainingSeconds / 3600);
    const m = Math.floor((tokenRemainingSeconds % 3600) / 60);
    const s = tokenRemainingSeconds % 60;
    el.textContent = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ==========================================
// FILE CACHED QUESTIONS MODAL & PREVIEW 📁
// ==========================================
let currentCachedModalQuestions = [];

async function openFileCachedQuestionsModal(filename) {
    const modal = document.getElementById('fileCachedQuestionsModal');
    if (!modal) return;
    
    const subtitle = document.getElementById('fileCachedModalSubtitle');
    if (subtitle) subtitle.textContent = `الملف: ${filename} (جاري جلب الأسئلة من الكاش المحفوظ...)`;

    const listContainer = document.getElementById('fileCachedQuestionsList');
    if (listContainer) {
        listContainer.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--text-muted);"><i class="fa-solid fa-spinner fa-spin fa-2x mb-2"></i><div>جاري تحميل الأسئلة المحفوظة...</div></div>';
    }

    modal.style.display = 'flex';

    try {
        const res = await fetch(`/api/exam_sources/${encodeURIComponent(filename)}/cached_questions`);
        const data = await res.json();
        if (data.success) {
            currentCachedModalQuestions = data.questions || [];
            if (subtitle) subtitle.textContent = `الملف: ${filename} • إجمالي الأسئلة المستخرجة والمحفوظة: (${currentCachedModalQuestions.length}) سؤال`;
            const badge = document.getElementById('cachedQuestionsCountBadge');
            if (badge) badge.textContent = `${currentCachedModalQuestions.length} سؤال`;
            renderCachedModalQuestions(currentCachedModalQuestions);
        } else {
            if (listContainer) listContainer.innerHTML = `<div style="color: #ef4444; text-align: center; padding: 20px;">تعذر تحميل الأسئلة: ${data.error || 'خطأ غير معروف'}</div>`;
        }
    } catch (e) {
        console.error('Error fetching cached questions:', e);
        if (listContainer) listContainer.innerHTML = `<div style="color: #ef4444; text-align: center; padding: 20px;">خطأ في الاتصال: ${e.message}</div>`;
    }
}

function renderCachedModalQuestions(questions) {
    const listContainer = document.getElementById('fileCachedQuestionsList');
    if (!listContainer) return;

    if (!questions || questions.length === 0) {
        listContainer.innerHTML = '<div style="text-align: center; padding: 30px; color: var(--text-muted);">لا توجد أسئلة مفرغة بعد لهذا الملف. اضغط على "فلترة الأسئلة ومراجعة المنهج" لتفريغها فوراً.</div>';
        return;
    }

    listContainer.innerHTML = questions.map((q, idx) => {
        const co = String(q.correct_option || 'A').toUpperCase().trim();
        return `
            <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 14px 16px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <span style="font-weight: 700; font-size: 13.5px; color: #60a5fa;">سؤال #${idx + 1}</span>
                    <div style="display: flex; gap: 6px;">
                        <span class="badge" style="background: rgba(59, 130, 246, 0.15); color: #93c5fd; font-size: 11px;">صفحة ${q.source_page || 1}</span>
                        ${q.status === 'accepted' ? '<span class="badge" style="background: rgba(16, 185, 129, 0.2); color: #34d399; font-size: 11px;">مطابق للمنهج ✔</span>' : ''}
                    </div>
                </div>
                <div style="font-size: 14px; font-weight: 600; color: var(--text-main); margin-bottom: 10px; line-height: 1.5;" dir="auto">
                    ${escapeHtml(q.question_text || '')}
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 13px; margin-bottom: 8px;">
                    <div style="padding: 6px 10px; border-radius: 6px; ${co === 'A' ? 'background: rgba(16, 185, 129, 0.15); border: 1px solid #10b981; color: #34d399; font-weight: 700;' : 'background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05);'}" dir="auto">
                        <strong>A)</strong> ${escapeHtml(q.option_a || '')}
                    </div>
                    <div style="padding: 6px 10px; border-radius: 6px; ${co === 'B' ? 'background: rgba(16, 185, 129, 0.15); border: 1px solid #10b981; color: #34d399; font-weight: 700;' : 'background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05);'}" dir="auto">
                        <strong>B)</strong> ${escapeHtml(q.option_b || '')}
                    </div>
                    <div style="padding: 6px 10px; border-radius: 6px; ${co === 'C' ? 'background: rgba(16, 185, 129, 0.15); border: 1px solid #10b981; color: #34d399; font-weight: 700;' : 'background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05);'}" dir="auto">
                        <strong>C)</strong> ${escapeHtml(q.option_c || '')}
                    </div>
                    <div style="padding: 6px 10px; border-radius: 6px; ${co === 'D' ? 'background: rgba(16, 185, 129, 0.15); border: 1px solid #10b981; color: #34d399; font-weight: 700;' : 'background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05);'}" dir="auto">
                        <strong>D)</strong> ${escapeHtml(q.option_d || '')}
                    </div>
                </div>
                ${q.explanation ? `
                    <div style="font-size: 12px; color: #94a3b8; background: rgba(0,0,0,0.2); padding: 6px 10px; border-radius: 6px; border-right: 3px solid #60a5fa;" dir="auto">
                        <i class="fa-solid fa-lightbulb" style="color: #fbbf24;"></i> ${escapeHtml(q.explanation)}
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

function filterCachedQuestionsModalList() {
    const input = document.getElementById('cachedQuestionsFilterInput');
    const term = (input ? input.value : '').trim().toLowerCase();
    if (!term) {
        renderCachedModalQuestions(currentCachedModalQuestions);
        return;
    }
    const filtered = currentCachedModalQuestions.filter(q => {
        return (q.question_text || '').toLowerCase().includes(term) ||
               (q.option_a || '').toLowerCase().includes(term) ||
               (q.option_b || '').toLowerCase().includes(term) ||
               (q.option_c || '').toLowerCase().includes(term) ||
               (q.option_d || '').toLowerCase().includes(term) ||
               (q.explanation || '').toLowerCase().includes(term);
    });
    renderCachedModalQuestions(filtered);
}

// ==========================================
// FORMATIVES CROSS-MATCHER & MULTI-SOURCE TRACKER
// ==========================================
let formativeState = {
    masterFile: null,
    masterFileId: null,
    referenceFiles: [],
    referenceSources: [],
    lectures: [],
    currentLecture: null,
    matchedQuestions: []
};

function handleMasterFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    formativeState.masterFile = file;

    const label = document.getElementById('labelFormativeMasterFile');
    if (label) label.innerHTML = `📄 <strong style="color: var(--primary-light);">${escapeHtml(file.name)}</strong> (${(file.size / 1024).toFixed(1)} KB)`;
    const badge = document.getElementById('formativeMasterFileBadge');
    if (badge) {
        badge.style.background = 'rgba(13, 148, 136, 0.2)';
        badge.style.color = 'var(--primary-light)';
        badge.innerText = 'جاهز للفحص';
    }
}

async function uploadMasterLectureFile() {
    if (!formativeState.masterFile && !formativeState.masterFileId) {
        showToast('يرجى اختيار ملف المحاضرات الأساسي أولاً (مثل CNS Mid MCQs)', 'warning');
        return;
    }

    const btn = document.getElementById('btnUploadMasterFile');
    const originalText = btn ? btn.innerHTML : '';
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري فحص واستخراج أقسام Formatives & Previous Exams...';
    }

    showToast('جاري فحص الملف الأساسي واستخراج المحاضرات والأسئلة المظللة بالأصفر...', 'info');

    try {
        const formData = new FormData();
        formData.append('file', formativeState.masterFile);

        const res = await fetch('/api/formatives/upload-master', {
            method: 'POST',
            body: formData
        });
        const data = await res.json();
        if (!data.success) {
            throw new Error(data.error || 'فشل فحص الملف الأساسي');
        }

        formativeState.masterFileId = data.file_id;
        formativeState.lectures = data.lectures || [];

        // Update UI status
        const badge = document.getElementById('formativeMasterFileBadge');
        if (badge) {
            badge.style.background = 'rgba(16, 185, 129, 0.2)';
            badge.style.color = '#34d399';
            badge.innerText = data.status === 'cached' ? 'تم الاسترجاع من القاعدة ✓' : 'تم الحفظ في القاعدة ✓';
        }

        const statusCard = document.getElementById('masterFileStatusCard');
        if (statusCard) {
            statusCard.style.display = 'block';
            const nameEl = document.getElementById('masterFileNameText');
            if (nameEl) nameEl.innerText = data.filename;
            const qEl = document.getElementById('masterFileTotalQuestionsText');
            if (qEl) qEl.innerText = `${data.total_questions} أسئلة فورماتيف مستخرجة`;
            const lecEl = document.getElementById('masterFileLecturesCountText');
            if (lecEl) lecEl.innerText = `تم التعرف على ${data.total_lectures} محاضرة بنجاح`;
        }

        populateFormativeLecturesDropdown(data.lectures || []);

        const panel = document.getElementById('formativeMatchingControlPanel');
        if (panel) panel.style.display = 'block';

        showToast(`تم استخراج ${data.total_lectures} محاضرة بإجمالي ${data.total_questions} سؤال فورماتيف وحفظها دائماً!`, 'success');
        playCompletionChime('success');
    } catch (err) {
        console.error('Upload master error:', err);
        showToast('خطأ أثناء معالجة الملف الأساسي: ' + err.message, 'error');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    }
}

function handleReferenceFilesSelect(event) {
    const files = Array.from(event.target.files || []);
    if (!files || files.length === 0) return;
    formativeState.referenceFiles = files;

    const label = document.getElementById('labelFormativeReferenceFiles');
    if (label) {
        if (files.length === 1) {
            label.innerHTML = `📄 <strong style="color: #818cf8;">${escapeHtml(files[0].name)}</strong> (${(files[0].size / 1024).toFixed(1)} KB)`;
        } else {
            label.innerHTML = `📚 <strong style="color: #818cf8;">تم اختيار ${files.length} ملفات مرجعية</strong>`;
        }
    }
    const badge = document.getElementById('referenceFilesCountBadge');
    if (badge) {
        badge.innerText = `${files.length} ملفات محددة`;
        badge.style.background = 'rgba(99, 102, 241, 0.3)';
    }
}

async function uploadReferenceSourceFiles() {
    if (!formativeState.referenceFiles || formativeState.referenceFiles.length === 0) {
        showToast('يرجى اختيار ملف مرجعي واحد على الأقل للرفع والفهرسة', 'warning');
        return;
    }

    const btn = document.getElementById('btnUploadReferenceFiles');
    const originalText = btn ? btn.innerHTML : '';
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري قراءة الملفات وفهرستها مع الـ OCR وحفظها بالقاعدة...';
    }

    showToast('جاري تفريغ وفهرسة الملفات المرجعية وحفظها دائماً بقاعدة البيانات...', 'info');

    try {
        const formData = new FormData();
        for (const f of formativeState.referenceFiles) {
            formData.append('files', f);
        }

        const res = await fetch('/api/formatives/upload-references', {
            method: 'POST',
            body: formData
        });
        const data = await res.json();
        if (!data.success) {
            throw new Error(data.error || 'فشلت معالجة الملفات المرجعية');
        }

        showToast(`تمت معالجة وفهرسة ${data.uploaded_count} ملف مرجعي بنجاح وحفظها بالقاعدة!`, 'success');
        playCompletionChime('success');

        // Reset file input
        const fileInput = document.getElementById('inputFormativeReferenceFiles');
        if (fileInput) fileInput.value = '';
        formativeState.referenceFiles = [];

        await loadFormativeSourcesHistory();
    } catch (err) {
        console.error('Upload reference files error:', err);
        showToast('خطأ أثناء معالجة الملفات المرجعية: ' + err.message, 'error');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    }
}

async function loadFormativeSourcesHistory() {
    try {
        const res = await fetch('/api/formatives/sources');
        const data = await res.json();
        if (!data.success) return;

        // If master file exists in DB and not loaded yet in state, load it
        if (data.master_file) {
            const mf = data.master_file;
            formativeState.masterFileId = mf.id;
            const badge = document.getElementById('formativeMasterFileBadge');
            if (badge) {
                badge.style.background = 'rgba(16, 185, 129, 0.2)';
                badge.style.color = '#34d399';
                badge.innerText = 'محفوظ بالقاعدة ✓';
            }

            const statusCard = document.getElementById('masterFileStatusCard');
            if (statusCard) {
                statusCard.style.display = 'block';
                const nameEl = document.getElementById('masterFileNameText');
                if (nameEl) nameEl.innerText = mf.filename;
                const qEl = document.getElementById('masterFileTotalQuestionsText');
                if (qEl) qEl.innerText = `${mf.total_questions} أسئلة فورماتيف مستخرجة`;
                const lecEl = document.getElementById('masterFileLecturesCountText');
                if (lecEl) lecEl.innerText = `تم التعرف على ${mf.total_lectures} محاضرة بنجاح`;
            }

            if (mf.lectures && mf.lectures.length > 0) {
                formativeState.lectures = mf.lectures;
                populateFormativeLecturesDropdown(mf.lectures);
                const panel = document.getElementById('formativeMatchingControlPanel');
                if (panel) panel.style.display = 'block';
            }
        }

        // Render reference sources table
        const sources = data.reference_sources || [];
        formativeState.referenceSources = sources;

        const countBadge = document.getElementById('referenceFilesCountBadge');
        if (countBadge) {
            countBadge.innerText = `${sources.length} مصادر مسجلة`;
        }

        const sec = document.getElementById('referenceSourcesSection');
        const tbody = document.getElementById('referenceSourcesTableBody');
        if (!sec || !tbody) return;

        if (sources.length === 0) {
            sec.style.display = 'none';
            tbody.innerHTML = '';
            return;
        }

        sec.style.display = 'block';
        tbody.innerHTML = sources.map(src => {
            const methodBadge = src.extraction_method === 'pdf_ocr' 
                ? '<span class="badge" style="background: rgba(245, 158, 11, 0.2); color: #fbbf24;"><i class="fa-solid fa-eye"></i> OCR مسح ضوئي</span>'
                : (src.extraction_method === 'pdf' 
                    ? '<span class="badge" style="background: rgba(239, 68, 68, 0.15); color: #f87171;"><i class="fa-solid fa-file-pdf"></i> PDF نصي</span>'
                    : '<span class="badge" style="background: rgba(59, 130, 246, 0.15); color: #93c5fd;"><i class="fa-solid fa-file-word"></i> Word DOCX</span>');

            return `
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <td style="padding: 10px 12px; color: var(--text-main); font-weight: 600;">
                        <i class="fa-solid fa-file me-2 text-muted"></i> ${escapeHtml(src.filename)}
                    </td>
                    <td style="padding: 10px 12px;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <input type="text" id="sourceLabelInput_${src.id}" value="${escapeHtml(src.source_label || '')}" 
                                   class="form-control form-control-sm" style="max-width: 260px; font-weight: 700; color: #818cf8; background: rgba(0,0,0,0.25);"
                                   onchange="saveSourceLabelChange(${src.id}, this.value)">
                            <button class="btn btn-xs btn-outline" onclick="saveSourceLabelChange(${src.id}, document.getElementById('sourceLabelInput_${src.id}').value)" title="حفظ الاسم">
                                <i class="fa-solid fa-floppy-disk"></i>
                            </button>
                        </div>
                    </td>
                    <td style="padding: 10px 12px;">${methodBadge}</td>
                    <td style="padding: 10px 12px;">
                        <span class="badge" style="background: rgba(13, 148, 136, 0.2); color: var(--primary-light); font-weight: 700;">
                            ${src.total_questions} سؤال
                        </span>
                    </td>
                    <td style="padding: 10px 12px; text-align: center;">
                        <button class="btn btn-xs btn-outline-danger" onclick="deleteSourceReferenceFile(${src.id})" title="حذف هذا المصدر من المطابقة">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

    } catch (err) {
        console.error('Error loading formative sources history:', err);
    }
}

async function saveSourceLabelChange(fileId, newLabel) {
    if (!newLabel || !newLabel.trim()) {
        showToast('يرجى إدخال مسمى صحيح للمصدر', 'warning');
        return;
    }

    try {
        const res = await fetch(`/api/formatives/sources/${fileId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ source_label: newLabel.trim() })
        });
        const data = await res.json();
        if (!data.success) {
            throw new Error(data.error || 'فشل تحديث اسم المصدر');
        }
        showToast('تم تحديث مسمى المصدر المعتمد بنجاح!', 'success');
    } catch (err) {
        console.error('Save source label error:', err);
        showToast('خطأ أثناء حفظ التسمية: ' + err.message, 'error');
    }
}

async function deleteSourceReferenceFile(fileId) {
    if (!confirm('هل أنت متأكد من رغبتك في حذف هذا المصدر المرجعي؟')) return;

    try {
        const res = await fetch(`/api/formatives/sources/${fileId}`, {
            method: 'DELETE'
        });
        const data = await res.json();
        if (!data.success) {
            throw new Error(data.error || 'فشل حذف المصدر');
        }
        showToast('تم حذف المصدر بنجاح', 'info');
        await loadFormativeSourcesHistory();
    } catch (err) {
        console.error('Delete source file error:', err);
        showToast('خطأ أثناء حذف المصدر: ' + err.message, 'error');
    }
}

function populateFormativeLecturesDropdown(lectures) {
    const sel = document.getElementById('selectFormativeLecture');
    if (!sel) return;

    if (!lectures || lectures.length === 0) {
        sel.innerHTML = '<option value="">لا توجد محاضرات مستخرجة</option>';
        return;
    }

    sel.innerHTML = '<option value="">-- اختر محاضرة لعرض فورماتيفاتها ومطابقتها --</option>' +
        lectures.map(l => {
            const formCount = l.formative_questions_count || 0;
            const totalCount = l.total_questions || 0;
            return `<option value="${escapeHtml(l.lecture_name)}">${escapeHtml(l.lecture_name)} (${formCount} فورماتيف / ${totalCount} إجمالي)</option>`;
        }).join('');

    // Auto-select first lecture if available
    if (lectures.length > 0) {
        sel.selectedIndex = 1;
        onFormativeLectureChange();
    }
}

function onFormativeLectureChange() {
    const sel = document.getElementById('selectFormativeLecture');
    const lecName = sel ? sel.value : '';
    formativeState.currentLecture = lecName;

    const statsPill = document.getElementById('formativeLectureStatsPill');
    const statsText = document.getElementById('formativeLectureStatsText');

    if (!lecName) {
        if (statsPill) statsPill.style.display = 'none';
        return;
    }

    const lecObj = formativeState.lectures.find(l => l.lecture_name === lecName);
    if (lecObj && statsPill && statsText) {
        statsPill.style.display = 'block';
        statsText.innerHTML = `📚 المحاضرة: <strong>${escapeHtml(lecName)}</strong> — ${lecObj.formative_questions_count || 0} سؤال فورماتيف (${lecObj.total_questions || 0} إجمالي)`;
    }

    // Hide export button until matched
    const exportBtn = document.getElementById('btnExportFormativesWord');
    if (exportBtn) exportBtn.style.display = 'none';
}

async function executeLectureMatching() {
    const lecName = formativeState.currentLecture;
    if (!lecName) {
        showToast('يرجى اختيار محاضرة أولاً من القائمة', 'warning');
        return;
    }
    if (!formativeState.masterFileId) {
        showToast('يرجى التأكد من رفع أو اختيار الملف الأساسي أولاً', 'warning');
        return;
    }

    const btn = document.getElementById('btnMatchLectureQuestions');
    const originalText = btn ? btn.innerHTML : '';
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري مطابقة وتوثيق الأسئلة عبر كافة المصادر المعتمدة...';
    }

    const container = document.getElementById('formativeQuestionsContainer');
    if (container) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--text-muted);">
                <i class="fa-solid fa-spinner fa-spin fa-2x mb-3 text-primary"></i>
                <div>جاري فحص وتوثيق أسئلة المحاضرة في جميع ملفات المصادر (DR SLEEM، Quize 1-8، الأسبوعيات، الفورماتيفز)...</div>
            </div>
        `;
    }

    try {
        const res = await fetch('/api/formatives/match', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                master_file_id: formativeState.masterFileId,
                lecture_name: lecName
            })
        });
        const data = await res.json();
        if (!data.success) {
            throw new Error(data.error || 'فشلت عملية المطابقة');
        }

        formativeState.matchedQuestions = data.questions || [];
        renderMatchedQuestionsFeed(data.questions || [], lecName, data.matched_count, data.total_questions);

        const exportBtn = document.getElementById('btnExportFormativesWord');
        if (exportBtn) exportBtn.style.display = 'inline-flex';

        showToast(`تمت المطابقة والتوثيق بنجاح! تم العثور على توثيق لـ ${data.matched_count} من أصل ${data.total_questions} سؤال.`, 'success');
        playCompletionChime('success');
    } catch (err) {
        console.error('Matching error:', err);
        showToast('خطأ في المطابقة: ' + err.message, 'error');
        if (container) {
            container.innerHTML = `
                <div class="empty-state-card" style="text-align: center; padding: 40px; color: #ef4444;">
                    <i class="fa-solid fa-triangle-exclamation fa-2x mb-2"></i>
                    <div>${escapeHtml(err.message)}</div>
                </div>
            `;
        }
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    }
}

function renderMatchedQuestionsFeed(questions, lectureName, matchedCount, totalCount) {
    const container = document.getElementById('formativeQuestionsContainer');
    if (!container) return;

    if (!questions || questions.length === 0) {
        container.innerHTML = `
            <div class="empty-state-card" style="text-align: center; padding: 50px 20px;">
                <i class="fa-solid fa-circle-question fa-3x text-muted mb-3"></i>
                <h4>لا توجد أسئلة فورماتيف مسجلة لهذه المحاضرة</h4>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 10px;">
            <div style="font-size: 15px; font-weight: 700; color: var(--text-main);">
                نتائج مطابقة وتوثيق مصادر أسئلة المحاضرة (${questions.length} سؤال):
            </div>
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                <span class="badge" style="background: rgba(16, 185, 129, 0.15); color: #34d399; padding: 4px 10px; border-radius: 8px; font-size: 11.5px;">
                    <i class="fa-solid fa-check-double"></i> تم توثيق مصادر ${matchedCount || 0} من ${totalCount || questions.length} سؤال
                </span>
                <span class="badge" style="background: rgba(245, 158, 11, 0.15); color: #fbbf24; padding: 4px 10px; border-radius: 8px; font-size: 11.5px;">
                    <i class="fa-solid fa-highlighter"></i> الإجابات المظللة بالأصفر محددة تلقائياً
                </span>
            </div>
        </div>
        <div style="display: flex; flex-direction: column; gap: 16px;">
            ${questions.map((q, idx) => {
                const correctOpt = (q.correct_option || '').toUpperCase().trim();
                const sourcesStr = q.all_matched_sources || '';
                const sourcesList = sourcesStr ? sourcesStr.split(' | ').filter(s => s.trim()) : [];

                return `
                    <div class="formative-question-card">
                        <!-- Top Header Row: Q Number + Badges -->
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 10px;">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <span style="background: rgba(13, 148, 136, 0.2); color: var(--primary-light); font-weight: 800; font-size: 13px; width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                                    ${idx + 1}
                                </span>
                                <span style="font-size: 12px; color: var(--text-muted); font-weight: 600;">
                                    ${q.question_type === 'formative' ? 'سؤال فورماتيف (Formative MCQ)' : 'سؤال محاضرة'}
                                </span>
                            </div>
                            
                            <!-- Badges: Multi-Source Attribution Badges -->
                            <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
                                ${sourcesList.length > 0 ? sourcesList.map(srcTag => `
                                    <span class="formative-badge-tag badge-formative-num" title="مصدر السؤال المعتمد">
                                        <i class="fa-solid fa-bookmark me-1"></i> <strong>${escapeHtml(srcTag)}</strong>
                                    </span>
                                `).join('') : `
                                    <span class="badge" style="background: rgba(100, 116, 139, 0.15); color: #94a3b8; font-size: 11px; padding: 4px 8px; border-radius: 6px;">
                                        غير مسجل في المصادر المرفوعة
                                    </span>
                                `}
                                ${q.match_status === 'matched' ? `
                                    <span class="badge" style="background: rgba(16, 185, 129, 0.15); color: #34d399; font-size: 11px; padding: 4px 8px; border-radius: 6px;">
                                        موثق ✓
                                    </span>
                                ` : ''}
                            </div>
                        </div>

                        <!-- Question Stem -->
                        <div style="font-size: 15px; font-weight: 700; color: var(--text-main); line-height: 1.6;" dir="auto">
                            ${escapeHtml(q.question_text || '')}
                        </div>

                        <!-- Options Grid -->
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 10px;">
                            ${renderFormativeOptionRow('A', q.option_a, correctOpt, q.is_yellow_highlighted)}
                            ${renderFormativeOptionRow('B', q.option_b, correctOpt, q.is_yellow_highlighted)}
                            ${renderFormativeOptionRow('C', q.option_c, correctOpt, q.is_yellow_highlighted)}
                            ${renderFormativeOptionRow('D', q.option_d, correctOpt, q.is_yellow_highlighted)}
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

function renderFormativeOptionRow(letter, text, correctOpt, isYellow) {
    if (!text) return '';
    const isCorrect = (letter === correctOpt);
    const highlightClass = isCorrect ? 'highlighted-yellow' : '';

    return `
        <div class="formative-option-row ${highlightClass}" dir="auto">
            <strong style="width: 22px; height: 22px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.08); font-size: 12px;">
                ${letter}
            </strong>
            <span style="flex: 1;">${escapeHtml(text)}</span>
            ${isCorrect ? `
                <span style="display: inline-flex; align-items: center; gap: 4px; font-size: 11px; background: rgba(0,0,0,0.3); padding: 2px 8px; border-radius: 4px; color: #fef08a;">
                    <i class="fa-solid fa-check"></i> متجاوب بتظليل أصفر
                </span>
            ` : ''}
        </div>
    `;
}

function exportMatchedFormativesDocx() {
    if (!formativeState.masterFileId || !formativeState.currentLecture) {
        showToast('يرجى اختيار المحاضرة ومطابقتها أولاً قبل التصدير', 'warning');
        return;
    }
    const url = `/api/formatives/export-docx?master_file_id=${formativeState.masterFileId}&lecture_name=${encodeURIComponent(formativeState.currentLecture)}`;
    showToast('جاري تحضير وتحميل ملف Word المنسق بالتظليل الأصفر والمصادر...', 'info');
    window.location.href = url;
}

// ==========================================================================
// SMART BOOK & REFERENCE AUDITOR (مدقق المراجع والكتب الذكي)
// ==========================================================================

let allReferenceBooks = [];
let activeReferenceBookId = null;
let currentAuditorSubtab = 'instant';
let currentInstantAuditResult = null;
let currentBatchAuditSession = null;
let currentBatchAuditPausedQuestionId = null;
let batchAuditPollingActive = false;
let batchWordFileToUpload = null;

async function loadBookAuditorTab() {
    await loadReferenceBooksList();
}

async function loadReferenceBooksList() {
    try {
        const res = await fetch('/api/book_auditor/books');
        const data = await res.json();
        if (data.status === 'success') {
            allReferenceBooks = data.books || [];
            renderReferenceBooksDropdown();
            updateAuditorStats();
        } else {
            showToast(data.message || 'تعذر تحميل قائمة المراجع', 'danger');
        }
    } catch (e) {
        console.error("Error loading reference books:", e);
    }
}

function renderReferenceBooksDropdown() {
    const sel = document.getElementById('activeAuditorBookSelect');
    if (sel) {
        sel.innerHTML = '';
        if (allReferenceBooks.length === 0) {
            sel.innerHTML = '<option value="">-- لا يوجد أي كتاب مرفوع، اضغط على زر رفع كتاب جديد --</option>';
            activeReferenceBookId = null;
        } else {
            allReferenceBooks.forEach(b => {
                const opt = document.createElement('option');
                opt.value = b.id;
                opt.textContent = `📚 ${b.title} (${b.total_pages} صفحة)`;
                sel.appendChild(opt);
            });

            if (!activeReferenceBookId || !allReferenceBooks.some(b => b.id === activeReferenceBookId)) {
                activeReferenceBookId = allReferenceBooks[0].id;
            }
            sel.value = activeReferenceBookId;
        }
    }
    updateActiveBookDisplay();
    renderReferenceBooksList();
}

function renderReferenceBooksList() {
    const container = document.getElementById('auditorBooksContainer');
    const countBadge = document.getElementById('auditorBooksCountBadge');
    if (countBadge) countBadge.innerText = allReferenceBooks.length;
    if (!container) return;

    if (allReferenceBooks.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 22px 14px; background: rgba(0,0,0,0.2); border-radius: 10px; border: 1px dashed rgba(255,255,255,0.1);">
                <i class="fa-solid fa-book-open text-muted fa-2x mb-2" style="opacity: 0.6;"></i>
                <div style="font-weight: 700; color: var(--text-main); font-size: 13.5px;">لا يوجد أي كتاب مرجعي مسجل حتى الآن</div>
                <p style="font-size: 12px; color: var(--text-muted); margin: 4px 0 12px 0;">ارفع كتاب المرجع الطبي (PDF) لتوثيق وتدقيق الأسئلة واستخراج الصفحات بدقة</p>
                <button class="btn btn-sm btn-primary" onclick="openUploadReferenceBookModal()">
                    <i class="fa-solid fa-cloud-arrow-up"></i> رفع كتاب / مرجع جديد (PDF)
                </button>
            </div>
        `;
        return;
    }

    container.innerHTML = allReferenceBooks.map(b => {
        const isActive = (b.id === activeReferenceBookId);
        const sizeMB = (b.file_size ? (b.file_size / (1024 * 1024)).toFixed(1) : '0') + ' MB';
        return `
            <div class="auditor-book-item-card" style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: ${isActive ? 'rgba(13, 148, 136, 0.12)' : 'rgba(30, 41, 59, 0.5)'}; border: 1px solid ${isActive ? 'var(--primary)' : 'rgba(255,255,255,0.08)'}; border-radius: 10px; gap: 12px; flex-wrap: wrap; margin-bottom: 8px;">
                <div style="display: flex; align-items: center; gap: 12px; flex: 1; min-width: 240px;">
                    <div style="width: 38px; height: 38px; border-radius: 8px; background: ${isActive ? 'var(--primary)' : 'rgba(255,255,255,0.08)'}; color: ${isActive ? '#fff' : 'var(--primary-light)'}; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0;">
                        <i class="fa-solid fa-book"></i>
                    </div>
                    <div>
                        <div style="font-weight: 800; font-size: 14px; color: var(--text-main);">${escapeHtml(b.title)}</div>
                        <div style="display: flex; gap: 12px; font-size: 12px; color: var(--text-muted); margin-top: 3px;">
                            <span><i class="fa-solid fa-file-lines text-primary"></i> ${b.total_pages} صفحة مفهرسة</span>
                            <span><i class="fa-solid fa-hard-drive"></i> ${sizeMB}</span>
                            ${b.created_at ? `<span><i class="fa-solid fa-clock"></i> ${b.created_at.split(' ')[0]}</span>` : ''}
                        </div>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    ${isActive ? `
                        <span class="badge" style="background: rgba(16, 185, 129, 0.2); color: #34d399; font-weight: 700; padding: 6px 12px; border-radius: 6px;">
                            <i class="fa-solid fa-circle-check"></i> المرجع المعتمد حالياً
                        </span>
                    ` : `
                        <button class="btn btn-sm btn-outline-primary" onclick="setActiveReferenceBook(${b.id})">
                            <i class="fa-solid fa-check"></i> تعيين كمرجع معتمد
                        </button>
                    `}
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteReferenceBookById(${b.id})" title="حذف الكتاب وفهرسه">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function setActiveReferenceBook(bookId) {
    activeReferenceBookId = bookId;
    const sel = document.getElementById('activeAuditorBookSelect');
    if (sel) sel.value = bookId;
    updateActiveBookDisplay();
    renderReferenceBooksList();
    showToast('تم تعيين الكتاب كمرجع نشط للتدقيق والمراجعة', 'success');
}

async function deleteReferenceBookById(bookId) {
    const book = allReferenceBooks.find(b => b.id === bookId);
    const title = book ? book.title : 'هذا الكتاب';
    if (!confirm(`هل أنت متأكد من رغبتك في حذف "${title}" مع كامل فهرس صفحاته؟`)) {
        return;
    }
    try {
        const res = await fetch(`/api/book_auditor/book/${bookId}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.status === 'success') {
            showToast('تم حذف الكتاب وفهرسه بنجاح', 'success');
            if (activeReferenceBookId === bookId) activeReferenceBookId = null;
            await loadReferenceBooksList();
        } else {
            showToast(data.message || 'تعذر حذف الكتاب', 'danger');
        }
    } catch (e) {
        console.error("Error deleting book:", e);
    }
}

function onActiveAuditorBookChanged() {
    const sel = document.getElementById('activeAuditorBookSelect');
    if (!sel) return;
    activeReferenceBookId = parseInt(sel.value) || null;
    updateActiveBookDisplay();
    renderReferenceBooksList();
}

function updateActiveBookDisplay() {
    const badge = document.getElementById('activeBookInfoBadge');
    const deleteBtn = document.getElementById('btnDeleteActiveBook');
    const pagesStat = document.getElementById('auditorSelectedBookPages');

    const book = allReferenceBooks.find(b => b.id === activeReferenceBookId);
    if (book) {
        if (badge) {
            badge.style.background = 'rgba(16, 185, 129, 0.15)';
            badge.style.color = '#34d399';
            badge.innerHTML = `<i class="fa-solid fa-circle-check"></i> ${escapeHtml(book.title)} (${book.total_pages} صفحة)`;
        }
        if (deleteBtn) deleteBtn.style.display = 'inline-flex';
        if (pagesStat) pagesStat.textContent = book.total_pages;
    } else {
        if (badge) {
            badge.style.background = 'rgba(239, 68, 68, 0.15)';
            badge.style.color = '#f87171';
            badge.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> لم يتم اختيار مرجع';
        }
        if (deleteBtn) deleteBtn.style.display = 'none';
        if (pagesStat) pagesStat.textContent = '0';
    }
}

function updateAuditorStats() {
    const countEl = document.getElementById('auditorTotalBooksCount');
    if (countEl) countEl.textContent = allReferenceBooks.length;
}

function handleAuditorBookFileSelected(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf')) {
        showToast('يرجى اختيار ملف كتاب بصيغة PDF (.pdf)', 'warning');
        return;
    }
    const defState = document.getElementById('bookDropzoneDefault');
    const selState = document.getElementById('bookDropzoneSelected');
    const nameEl = document.getElementById('selectedBookFileName');
    const sizeEl = document.getElementById('selectedBookFileSize');
    const titleInput = document.getElementById('uploadBookTitleInput');

    if (defState) defState.style.display = 'none';
    if (selState) selState.style.display = 'block';
    if (nameEl) nameEl.innerText = file.name;
    if (sizeEl) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
        sizeEl.innerText = `${sizeMB} MB`;
    }
    if (titleInput && !titleInput.value.trim()) {
        titleInput.value = file.name.replace(/\.pdf$/i, '').trim();
    }
}

function clearSelectedAuditorBook(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    const fin = document.getElementById('uploadBookFileInput');
    if (fin) fin.value = '';
    const defState = document.getElementById('bookDropzoneDefault');
    const selState = document.getElementById('bookDropzoneSelected');
    if (defState) defState.style.display = 'block';
    if (selState) selState.style.display = 'none';
}

function openUploadReferenceBookModal() {
    document.getElementById('uploadBookTitleInput').value = '';
    clearSelectedAuditorBook();
    document.getElementById('uploadBookProgressBox').style.display = 'none';
    document.getElementById('btnConfirmUploadBook').disabled = false;
    openModal('uploadReferenceBookModal');
}

async function confirmUploadReferenceBook() {
    const fileInput = document.getElementById('uploadBookFileInput');
    const titleInput = document.getElementById('uploadBookTitleInput');
    const progressBox = document.getElementById('uploadBookProgressBox');
    const progressMsg = document.getElementById('uploadBookProgressMsg');
    const confirmBtn = document.getElementById('btnConfirmUploadBook');

    if (!fileInput.files || fileInput.files.length === 0) {
        showToast('يرجى اختيار ملف كتاب بصيغة PDF', 'warning');
        return;
    }

    const file = fileInput.files[0];
    if (!file.name.toLowerCase().endsWith('.pdf')) {
        showToast('الملف المختار يجب أن يكون PDF', 'warning');
        return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', titleInput.value.trim());

    progressBox.style.display = 'block';
    progressMsg.textContent = 'جاري رفع الملف وفهرسة صفحات الكتاب بالكامل بالـ PyMuPDF...';
    confirmBtn.disabled = true;

    try {
        const res = await fetch('/api/book_auditor/upload_book', {
            method: 'POST',
            body: formData
        });
        const data = await res.json();
        if (data.status === 'success') {
            closeModal('uploadReferenceBookModal');
            playCompletionChime('success');
            showToast(data.message, 'success');
            await loadReferenceBooksList();
            if (data.book && data.book.id) {
                activeReferenceBookId = data.book.id;
                document.getElementById('activeAuditorBookSelect').value = activeReferenceBookId;
                updateActiveBookDisplay();
            }
        } else {
            showToast(data.message || 'حدث خطأ أثناء رفع الكتاب', 'danger');
        }
    } catch (e) {
        console.error("Error uploading reference book:", e);
        showToast('حدث خطأ في الاتصال أثناء رفع الكتاب', 'danger');
    } finally {
        progressBox.style.display = 'none';
        confirmBtn.disabled = false;
    }
}

async function deleteActiveReferenceBook() {
    if (!activeReferenceBookId) return;
    const book = allReferenceBooks.find(b => b.id === activeReferenceBookId);
    const title = book ? book.title : 'هذا الكتاب';

    if (!confirm(`هل أنت متأكد من رغبتك في حذف ${title} مع كامل الفهرس والأسئلة الموثقة الخاصة به؟`)) {
        return;
    }

    try {
        const res = await fetch(`/api/book_auditor/book/${activeReferenceBookId}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.status === 'success') {
            showToast('تم حذف الكتاب بنجاح', 'success');
            activeReferenceBookId = null;
            await loadReferenceBooksList();
        } else {
            showToast(data.message || 'تعذر حذف الكتاب', 'danger');
        }
    } catch (e) {
        console.error("Error deleting book:", e);
    }
}

function switchAuditorSubtab(subtab) {
    currentAuditorSubtab = subtab;
    const btnInstant = document.getElementById('btnAuditorSubtabInstant');
    const btnBatch = document.getElementById('btnAuditorSubtabBatch');
    const paneInstant = document.getElementById('auditorPaneInstant');
    const paneBatch = document.getElementById('auditorPaneBatch');

    if (btnInstant) btnInstant.classList.toggle('active', subtab === 'instant');
    if (btnBatch) btnBatch.classList.toggle('active', subtab === 'batch');
    if (paneInstant) paneInstant.style.display = (subtab === 'instant' ? 'block' : 'none');
    if (paneBatch) paneBatch.style.display = (subtab === 'batch' ? 'block' : 'none');
}

// ----------------- SUBTAB 1: INSTANT REVIEW FUNCTIONS -----------------

function clearInstantAuditForm() {
    document.getElementById('instantAuditQuestionText').value = '';
    document.getElementById('instantAuditProposedAnswer').value = '';
    document.getElementById('instantAuditResultCard').style.display = 'none';
    document.getElementById('instantAuditLoadingBox').style.display = 'none';
    document.getElementById('instantAuditEmptyPlaceholder').style.display = 'block';
    currentInstantAuditResult = null;
}

async function runInstantBookAudit(forceWebSearch = false) {
    if (!activeReferenceBookId) {
        showToast('يرجى اختيار أو رفع كتاب مرجعي أولاً', 'warning');
        return;
    }

    const qText = document.getElementById('instantAuditQuestionText').value.trim();
    const proposedAns = document.getElementById('instantAuditProposedAnswer').value.trim();

    if (!qText) {
        showToast('يرجى إدخال نص السؤال أولاً', 'warning');
        return;
    }

    const placeholder = document.getElementById('instantAuditEmptyPlaceholder');
    const loadingBox = document.getElementById('instantAuditLoadingBox');
    const resultCard = document.getElementById('instantAuditResultCard');
    const btnRun = document.getElementById('btnRunInstantAudit');

    placeholder.style.display = 'none';
    resultCard.style.display = 'none';
    loadingBox.style.display = 'block';
    btnRun.disabled = true;

    try {
        const res = await fetch('/api/book_auditor/verify_instant', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                book_id: activeReferenceBookId,
                question_text: qText,
                proposed_answer: proposedAns,
                force_web_search: forceWebSearch
            })
        });

        const data = await res.json();
        loadingBox.style.display = 'none';

        if (data.status === 'error') {
            showToast(data.message || 'حدث خطأ أثناء التدقيق', 'danger');
            placeholder.style.display = 'block';
            return;
        }

        currentInstantAuditResult = {
            book_id: activeReferenceBookId,
            question_text: qText,
            proposed_answer: proposedAns,
            ...data
        };

        renderInstantAuditResult(data);
    } catch (e) {
        console.error("Error in instant audit:", e);
        loadingBox.style.display = 'none';
        placeholder.style.display = 'block';
        showToast('حدث خطأ في الاتصال أثناء تدقيق السؤال', 'danger');
    } finally {
        btnRun.disabled = false;
    }
}

function renderInstantAuditResult(data) {
    const resultCard = document.getElementById('instantAuditResultCard');
    const statusBadge = document.getElementById('instantAuditStatusBadge');
    const pageBadge = document.getElementById('instantAuditPageBadge');
    const verifiedAnsText = document.getElementById('instantAuditVerifiedAnswerText');
    const expBox = document.getElementById('instantAuditExplanationBox');
    const screenshotContainer = document.getElementById('instantAuditScreenshotContainer');
    const snippetImg = document.getElementById('instantAuditSnippetImg');
    const fallbackBox = document.getElementById('instantAuditNotFoundFallback');
    const convincedActions = document.getElementById('instantAuditConvincedActions');

    resultCard.style.display = 'block';

    // Status Badge
    if (data.status === 'correct' || data.is_proposed_correct === true) {
        statusBadge.style.background = 'rgba(16, 185, 129, 0.2)';
        statusBadge.style.color = '#34d399';
        statusBadge.innerHTML = '<i class="fa-solid fa-circle-check"></i> ✅ مؤكد من الكتاب (Verified from Book)';
    } else if (data.status === 'incorrect' || data.is_proposed_correct === false) {
        statusBadge.style.background = 'rgba(245, 158, 11, 0.2)';
        statusBadge.style.color = '#fbbf24';
        statusBadge.innerHTML = `⚠️ الإجابة في الكتاب هي (${escapeHtml(data.verified_answer)}) خلافاً للمقترح`;
    } else if (data.status === 'web_verified') {
        statusBadge.style.background = 'rgba(59, 130, 246, 0.2)';
        statusBadge.style.color = '#93c5fd';
        statusBadge.innerHTML = '<i class="fa-solid fa-globe"></i> 🌐 موثق عبر المصادر الطبية بالإنترنت';
    } else {
        statusBadge.style.background = 'rgba(239, 68, 68, 0.2)';
        statusBadge.style.color = '#f87171';
        statusBadge.innerHTML = '<i class="fa-solid fa-circle-xmark"></i> ❌ لم أجد المعلومة في الكتاب المرفوع';
    }

    // Page Badge
    if (data.page_number && data.page_number > 0) {
        pageBadge.style.display = 'inline-block';
        pageBadge.innerHTML = `📄 المرجع: صفحة ${data.page_number}`;
    } else {
        pageBadge.style.display = 'none';
    }

    // Verified Answer
    verifiedAnsText.textContent = data.verified_answer || 'موضحة في الشرح أدناه';

    // Explanation
    if (typeof marked !== 'undefined' && data.explanation) {
        expBox.innerHTML = marked.parse(data.explanation);
    } else {
        expBox.textContent = data.explanation || '';
    }

    // Screenshot Snippet
    if (data.snippet_image_url) {
        screenshotContainer.style.display = 'block';
        snippetImg.src = data.snippet_image_url;
    } else {
        screenshotContainer.style.display = 'none';
    }

    // Fallback if not found
    if (data.status === 'not_found') {
        fallbackBox.style.display = 'block';
        convincedActions.style.display = 'none';
    } else {
        fallbackBox.style.display = 'none';
        convincedActions.style.display = 'flex';
    }

    // Reset debate chat
    document.getElementById('instantAuditConsultationBox').style.display = 'none';
    document.getElementById('instantAuditChatThread').innerHTML = '';
}

async function copyInstantAnswerWithImage() {
    if (!currentInstantAuditResult) return;

    const r = currentInstantAuditResult;
    const q = r.question_text || '';
    const ans = r.verified_answer || '';
    const exp = r.explanation || '';
    const page = r.page_number ? `صفحة ${r.page_number}` : '';
    const imgUrl = r.snippet_image_url ? window.location.origin + r.snippet_image_url : '';

    const textToCopy = `📌 السؤال:\n${q}\n\n✅ الإجابة المعتمدة: ${ans}\n${page ? '📖 المرجع: ' + page + '\n' : ''}💡 التفسير الطبي:\n${exp}\n${imgUrl ? '\n🔍 سكرين شوت الدليل المظلل: ' + imgUrl : ''}`;

    try {
        // Try rich HTML copy with embedded image
        if (imgUrl && navigator.clipboard && window.ClipboardItem) {
            const htmlContent = `
                <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right;">
                    <p><strong>📌 السؤال:</strong><br>${escapeHtml(q).replace(/\n/g, '<br>')}</p>
                    <p><strong style="color: #0d9488;">✅ الإجابة المعتمدة:</strong> ${escapeHtml(ans)}</p>
                    ${page ? `<p><strong>📖 موضع المعلومة:</strong> ${escapeHtml(page)}</p>` : ''}
                    <p><strong>💡 التفسير الطبي المعتمد:</strong><br>${escapeHtml(exp).replace(/\n/g, '<br>')}</p>
                    <p><strong>🔍 لقطة الشاشة المظللة من الكتاب:</strong><br><img src="${imgUrl}" style="max-width: 600px;"></p>
                </div>
            `;
            const blobHtml = new Blob([htmlContent], { type: 'text/html' });
            const blobText = new Blob([textToCopy], { type: 'text/plain' });
            await navigator.clipboard.write([
                new ClipboardItem({
                    'text/html': blobHtml,
                    'text/plain': blobText
                })
            ]);
            showToast('تم نسخ الإجابة المنسقة مع الصورة المرفقة بنجاح! 📋', 'success');
            return;
        }
    } catch (err) {
        console.warn("Rich copy failed, falling back to text copy:", err);
    }

    // Fallback plain text
    try {
        await navigator.clipboard.writeText(textToCopy);
        showToast('تم نسخ نص الإجابة ورابط الصورة بنجاح! 📋', 'success');
    } catch (e) {
        showToast('تعذر النسخ التلقائي للحافظة', 'danger');
    }
}

async function rateInstantAnswerConvinced(isConvinced) {
    if (!currentInstantAuditResult || !isConvinced) return;

    const r = currentInstantAuditResult;
    try {
        const res = await fetch('/api/book_auditor/save_convinced', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                book_id: r.book_id,
                question_text: r.question_text,
                answer_text: r.verified_answer,
                explanation: r.explanation,
                page_number: r.page_number || 0,
                snippet_image_path: r.snippet_image_url || ''
            })
        });
        const data = await res.json();
        if (data.status === 'success') {
            showToast('تم تسجيل الإجابة الموثقة بنجاح في الكاش! ستظهر فوراً عند السؤال عنها مجدداً. ✅', 'success');
            const actions = document.getElementById('instantAuditConvincedActions');
            if (actions) {
                actions.innerHTML = '<span class="badge-tag" style="background: rgba(16, 185, 129, 0.2); color: #34d399;"><i class="fa-solid fa-check-double"></i> تم الاعتماد والحفظ في الكاش</span>';
            }
        }
    } catch (e) {
        console.error("Error saving convinced QA:", e);
    }
}

function toggleInstantConsultationChat() {
    const box = document.getElementById('instantAuditConsultationBox');
    const thread = document.getElementById('instantAuditChatThread');
    if (!box) return;

    box.style.display = (box.style.display === 'none' || box.style.display === '') ? 'block' : 'none';
    if (box.style.display === 'block' && thread.children.length === 0) {
        thread.innerHTML = `
            <div style="background: rgba(59, 130, 246, 0.1); border-radius: 6px; padding: 8px 10px; margin-bottom: 6px; color: #93c5fd;">
                <strong>الـ AI:</strong> مرحباً، يسعدني مناقشة الإجابة معك بالتفصيل. ما هي النقطة التي تراها غير مقنعة أو تتعارض مع فهمك؟
            </div>
        `;
    }
}

function sendInstantAuditChatMessage() {
    const input = document.getElementById('instantAuditChatInput');
    const thread = document.getElementById('instantAuditChatThread');
    if (!input || !thread) return;

    const text = input.value.trim();
    if (!text) return;

    // User message
    const uMsg = document.createElement('div');
    uMsg.style.cssText = 'background: rgba(255,255,255,0.06); border-radius: 6px; padding: 8px 10px; margin-bottom: 6px; text-align: right; color: var(--text-main);';
    uMsg.innerHTML = `<strong>أنت:</strong> ${escapeHtml(text)}`;
    thread.appendChild(uMsg);
    input.value = '';

    // Quick AI reflection
    setTimeout(() => {
        const aiMsg = document.createElement('div');
        aiMsg.style.cssText = 'background: rgba(59, 130, 246, 0.1); border-radius: 6px; padding: 8px 10px; margin-bottom: 6px; color: #93c5fd;';
        aiMsg.innerHTML = `<strong>الـ AI:</strong> ملاحظتك في محلها! بناءً على نص المرجع في الصفحة المرفقة، المفهوم ينص حصراً على ذلك لتجنب الفخ الامتحاني الشائع. يمكنك أيضاً الضغط على زر "البحث في الإنترنت" لمقارنة ذلك بأحدث الإرشادات السريرية العالمية.`;
        thread.appendChild(aiMsg);
        thread.scrollTop = thread.scrollHeight;
    }, 600);
}

function openExpandedSnippetModal(src) {
    const modal = document.getElementById('expandedSnippetModal');
    const img = document.getElementById('expandedSnippetModalImg');
    if (!modal || !img) return;
    img.src = src;
    openModal('expandedSnippetModal');
}

// ----------------- SUBTAB 2: BATCH WORD FILE AUDIT FUNCTIONS -----------------

function handleBatchWordFileSelected(input) {
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    if (!file.name.toLowerCase().endsWith('.docx')) {
        showToast('يرجى اختيار ملف Word بصيغة .docx فقط', 'warning');
        return;
    }

    batchWordFileToUpload = file;
    document.getElementById('batchWordSelectedFileName').textContent = file.name;
    document.getElementById('batchWordSelectedFileSize').textContent = `${(file.size / 1024).toFixed(1)} KB`;
    document.getElementById('batchWordSelectedFileBar').style.display = 'flex';
}

async function startBatchWordAuditProcess() {
    if (!activeReferenceBookId) {
        showToast('يرجى اختيار أو رفع كتاب مرجعي أولاً', 'warning');
        return;
    }
    if (!batchWordFileToUpload) {
        showToast('يرجى اختيار ملف Word أولاً', 'warning');
        return;
    }

    const btnStart = document.getElementById('btnStartBatchWordAudit');
    btnStart.disabled = true;
    btnStart.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>جاري قراءة واستخراج الأسئلة...</span>';

    const formData = new FormData();
    formData.append('file', batchWordFileToUpload);
    formData.append('book_id', activeReferenceBookId);

    try {
        const res = await fetch('/api/book_auditor/batch_upload', {
            method: 'POST',
            body: formData
        });
        const data = await res.json();
        if (data.status === 'success') {
            currentBatchAuditSession = data.session_id;
            showToast(`تم استخراج ${data.total_questions} سؤال بنجاح! يبدأ التدقيق الآن... 🚀`, 'success');

            document.getElementById('batchAuditUploadSection').style.display = 'none';
            document.getElementById('batchAuditProgressSection').style.display = 'block';
            document.getElementById('batchAuditCompletedSection').style.display = 'none';

            runBatchAuditLoop();
        } else {
            showToast(data.message || 'تعذر قراءة ملف الأسئلة', 'danger');
            btnStart.disabled = false;
            btnStart.innerHTML = '<i class="fa-solid fa-bolt"></i> <span>بدء تدقيق الملف الآن 🚀</span>';
        }
    } catch (e) {
        console.error("Error starting batch audit:", e);
        showToast('حدث خطأ في الاتصال أثناء رفع الملف', 'danger');
        btnStart.disabled = false;
        btnStart.innerHTML = '<i class="fa-solid fa-bolt"></i> <span>بدء تدقيق الملف الآن 🚀</span>';
    }
}

async function runBatchAuditLoop() {
    if (!currentBatchAuditSession) return;

    try {
        const res = await fetch(`/api/book_auditor/batch_step/${currentBatchAuditSession}`, {
            method: 'POST'
        });
        const data = await res.json();

        if (data.status === 'question_verified_correct') {
            // Update progress
            const qNum = data.question_number;
            const total = data.total_questions;
            const percent = Math.round((qNum / total) * 100);

            document.getElementById('batchAuditProgressTitle').textContent = `جاري التدقيق في الكتاب: السؤال ${qNum} من ${total}`;
            document.getElementById('batchAuditProgressSub').textContent = `تم تأكيد إجابة السؤال ${qNum} مطابقة للمرجع بنجاح ✅`;
            document.getElementById('batchAuditPercentBadge').textContent = `${percent}%`;
            document.getElementById('batchAuditProgressBar').style.width = `${percent}%`;

            // Continue next step immediately
            setTimeout(runBatchAuditLoop, 350);
        } else if (data.status === 'paused_disagreement') {
            // PAUSE for disagreement
            handleBatchAuditPauseDisagreement(data);
        } else if (data.status === 'paused_not_found') {
            // PAUSE for not found
            handleBatchAuditPauseNotFound(data);
        } else if (data.status === 'completed') {
            // COMPLETED!
            handleBatchAuditCompleted(data);
        } else {
            showToast(data.message || 'توقف التدقيق بسبب خطأ', 'danger');
        }
    } catch (e) {
        console.error("Error during batch audit step:", e);
    }
}

function handleBatchAuditPauseDisagreement(data) {
    currentBatchAuditPausedQuestionId = data.question_id;

    const card = document.getElementById('batchAuditPausedConsultCard');
    document.getElementById('pausedQuestionNum').textContent = data.question_number;
    document.getElementById('pausedQuestionReason').textContent = 'تم رصد اختلاف بين الإجابة المحددة في ملفك وإجابة الكتاب المعتمدة!';
    document.getElementById('pausedQuestionText').textContent = data.question_text;

    // Options
    const optList = document.getElementById('pausedQuestionOptionsList');
    optList.innerHTML = (data.options || []).map(o => `<div><strong>${o.letter})</strong> ${escapeHtml(o.text)}</div>`).join('');

    // Answers
    document.getElementById('pausedOriginalAnswer').textContent = data.original_answer || 'غير محدد';
    document.getElementById('pausedBookAnswer').textContent = data.proposed_answer || '--';
    document.getElementById('pausedBookPageTag').textContent = data.page_number ? `موضع المعلومة: صفحة ${data.page_number}` : '';

    // Explanation
    document.getElementById('pausedExplanationText').innerHTML = `<strong>💡 تعليل الكتاب الطبي:</strong><br>${escapeHtml(data.explanation || '')}`;

    // Snippet Img
    const snippetWrap = document.getElementById('pausedSnippetImgWrapper');
    const snippetImg = document.getElementById('pausedSnippetImg');
    if (data.snippet_image_url) {
        snippetWrap.style.display = 'block';
        snippetImg.src = data.snippet_image_url;
    } else {
        snippetWrap.style.display = 'none';
    }

    document.getElementById('btnPausedWebSearch').style.display = 'inline-flex';
    card.style.display = 'block';
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function handleBatchAuditPauseNotFound(data) {
    currentBatchAuditPausedQuestionId = data.question_id;

    const card = document.getElementById('batchAuditPausedConsultCard');
    document.getElementById('pausedQuestionNum').textContent = data.question_number;
    document.getElementById('pausedQuestionReason').textContent = 'لم يتم العثور على تأكيد لهذه المعلومة داخل صفحات الكتاب المرفوع!';
    document.getElementById('pausedQuestionText').textContent = data.question_text;

    const optList = document.getElementById('pausedQuestionOptionsList');
    optList.innerHTML = (data.options || []).map(o => `<div><strong>${o.letter})</strong> ${escapeHtml(o.text)}</div>`).join('');

    document.getElementById('pausedOriginalAnswer').textContent = data.original_answer || 'غير محدد';
    document.getElementById('pausedBookAnswer').textContent = 'غير موجود في الكتاب';
    document.getElementById('pausedBookPageTag').textContent = '';

    document.getElementById('pausedExplanationText').innerHTML = `<strong>⚠️ ملاحظة:</strong> لم يتم العثور على السؤال في الكتاب. يمكنك طلب البحث عبر الإنترنت والاعتماد، أو الإبقاء على إجابتك الحالية والاستمرار.`;
    document.getElementById('pausedSnippetImgWrapper').style.display = 'none';

    card.style.display = 'block';
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

async function resolveConsultationAction(action) {
    if (!currentBatchAuditSession || !currentBatchAuditPausedQuestionId) return;

    const card = document.getElementById('batchAuditPausedConsultCard');
    card.style.opacity = '0.5';

    try {
        const res = await fetch(`/api/book_auditor/batch_consult/${currentBatchAuditSession}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                question_id: currentBatchAuditPausedQuestionId,
                user_action: action
            })
        });

        const data = await res.json();
        card.style.opacity = '1';

        if (data.status === 'web_search_complete') {
            // Web search answered! Show the web result to user and let them decide modify/keep
            document.getElementById('pausedBookAnswer').textContent = `${data.proposed_answer} (موثق ويب)`;
            document.getElementById('pausedExplanationText').innerHTML = `<strong>🌐 نتيجة البحث بالإنترنت (${escapeHtml(data.source || '')}):</strong><br>${escapeHtml(data.explanation || '')}`;
            showToast('تم إتمام البحث عبر الإنترنت بنجاح! اختر الآن تعديل أو إبقاء الإجابة.', 'info');
            return;
        }

        // Action resolved (modify or keep) -> hide card and resume loop
        card.style.display = 'none';
        currentBatchAuditPausedQuestionId = null;
        showToast(action === 'modify' ? 'تم اعتماد تعديل الإجابة بنجاح! متابعة التدقيق...' : 'تم الإبقاء على إجابتك الأصلية! متابعة التدقيق...', 'info');

        runBatchAuditLoop();
    } catch (e) {
        card.style.opacity = '1';
        console.error("Error resolving consultation action:", e);
        showToast('حدث خطأ أثناء إرسال القرار', 'danger');
    }
}

function handleBatchAuditCompleted(data) {
    document.getElementById('batchAuditProgressSection').style.display = 'none';
    document.getElementById('batchAuditPausedConsultCard').style.display = 'none';

    const compSection = document.getElementById('batchAuditCompletedSection');
    compSection.style.display = 'block';

    const cleanBtn = document.getElementById('btnDownloadCleanDocx');
    const reportBtn = document.getElementById('btnDownloadReportDocx');

    if (cleanBtn) cleanBtn.href = data.clean_word_url;
    if (reportBtn) reportBtn.href = data.report_word_url;

    playCompletionChime('success');
    showToast('اكتمل تدقيق الملف بنجاح! الملفات جاهزة للتحميل 🏆', 'success', 9000);
}



