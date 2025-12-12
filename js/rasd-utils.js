/**
 * RASD Dashboard - Shared Utilities
 * ملف الأدوات المشتركة للوحة التحكم
 * يتضمن وظائف Toast، Modals، والتفاعل مع جميع الأيقونات
 */

// =============================================
// Toast Notification System
// =============================================
function showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `rasd-toast rasd-toast-${type}`;

    const icons = {
        'success': 'fa-check-circle',
        'error': 'fa-exclamation-circle',
        'warning': 'fa-exclamation-triangle',
        'info': 'fa-info-circle'
    };

    toast.innerHTML = `
        <i class="fas ${icons[type]}"></i>
        <span>${message}</span>
        <button class="rasd-toast-close"><i class="fas fa-times"></i></button>
    `;

    // Add styles if not exist
    if (!document.getElementById('rasdToastStyles')) {
        const style = document.createElement('style');
        style.id = 'rasdToastStyles';
        style.textContent = `
            .rasd-toast { 
                position: fixed; 
                bottom: 30px; 
                left: 30px; 
                padding: 15px 20px 15px 25px; 
                border-radius: 12px; 
                display: flex; 
                align-items: center; 
                gap: 12px; 
                z-index: 99999; 
                animation: rasdSlideIn 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55); 
                box-shadow: 0 10px 40px rgba(0,0,0,0.3); 
                font-family: 'Tajawal', sans-serif;
                max-width: 400px;
                backdrop-filter: blur(10px);
            }
            .rasd-toast-success { background: linear-gradient(135deg, rgba(16, 185, 129, 0.95) 0%, rgba(5, 150, 105, 0.95) 100%); color: white; }
            .rasd-toast-error { background: linear-gradient(135deg, rgba(239, 68, 68, 0.95) 0%, rgba(220, 38, 38, 0.95) 100%); color: white; }
            .rasd-toast-warning { background: linear-gradient(135deg, rgba(245, 158, 11, 0.95) 0%, rgba(217, 119, 6, 0.95) 100%); color: white; }
            .rasd-toast-info { background: linear-gradient(135deg, rgba(59, 130, 246, 0.95) 0%, rgba(37, 99, 235, 0.95) 100%); color: white; }
            .rasd-toast i:first-child { font-size: 20px; }
            .rasd-toast span { flex: 1; font-size: 14px; }
            .rasd-toast-close { background: none; border: none; color: rgba(255,255,255,0.7); cursor: pointer; padding: 5px; margin-right: -10px; transition: all 0.2s ease; }
            .rasd-toast-close:hover { color: white; transform: scale(1.1); }
            .rasd-toast.hiding { animation: rasdSlideOut 0.3s ease forwards; }
            @keyframes rasdSlideIn { from { transform: translateX(-120%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
            @keyframes rasdSlideOut { to { transform: translateX(-120%); opacity: 0; } }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(toast);

    // Close button
    toast.querySelector('.rasd-toast-close').addEventListener('click', () => {
        toast.classList.add('hiding');
        setTimeout(() => toast.remove(), 300);
    });

    // Auto remove
    setTimeout(() => {
        if (document.body.contains(toast)) {
            toast.classList.add('hiding');
            setTimeout(() => toast.remove(), 300);
        }
    }, duration);
}

// =============================================
// Modal System
// =============================================
function showModal(options = {}) {
    const { title = '', content = '', buttons = [], icon = 'fa-info-circle', iconColor = 'var(--accent)' } = options;

    const modal = document.createElement('div');
    modal.className = 'rasd-modal-overlay';

    let buttonsHTML = buttons.map(btn =>
        `<button class="rasd-modal-btn ${btn.class || ''}" data-action="${btn.action || ''}">${btn.text}</button>`
    ).join('');

    if (!buttons.length) {
        buttonsHTML = '<button class="rasd-modal-btn rasd-btn-primary" data-action="close">حسناً</button>';
    }

    modal.innerHTML = `
        <div class="rasd-modal">
            <div class="rasd-modal-header">
                <h3><i class="fas ${icon}" style="color: ${iconColor};"></i> ${title}</h3>
                <button class="rasd-modal-close"><i class="fas fa-times"></i></button>
            </div>
            <div class="rasd-modal-body">${content}</div>
            <div class="rasd-modal-footer">${buttonsHTML}</div>
        </div>
    `;

    // Add styles if not exist
    if (!document.getElementById('rasdModalStyles')) {
        const style = document.createElement('style');
        style.id = 'rasdModalStyles';
        style.textContent = `
            .rasd-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(5px); display: flex; align-items: center; justify-content: center; z-index: 99998; animation: rasdFadeIn 0.2s ease; }
            .rasd-modal { background: var(--secondary, #1e293b); border: 1px solid var(--border, rgba(148, 163, 184, 0.2)); border-radius: 16px; width: 450px; max-width: 95%; max-height: 90vh; overflow: hidden; animation: rasdScaleIn 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55); box-shadow: 0 25px 50px rgba(0,0,0,0.5); }
            .rasd-modal-header { padding: 20px 25px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border, rgba(148, 163, 184, 0.2)); }
            .rasd-modal-header h3 { font-size: 18px; display: flex; align-items: center; gap: 12px; margin: 0; color: var(--light, #f1f5f9); }
            .rasd-modal-close { background: none; border: none; color: var(--light, #f1f5f9); font-size: 18px; cursor: pointer; padding: 8px; border-radius: 8px; transition: all 0.3s ease; }
            .rasd-modal-close:hover { background: rgba(239,68,68,0.2); color: #ef4444; }
            .rasd-modal-body { padding: 25px; color: var(--light, #f1f5f9); max-height: 60vh; overflow-y: auto; }
            .rasd-modal-footer { padding: 20px 25px; border-top: 1px solid var(--border, rgba(148, 163, 184, 0.2)); display: flex; justify-content: flex-end; gap: 10px; }
            .rasd-modal-btn { padding: 10px 24px; border-radius: 8px; font-size: 14px; font-family: 'Tajawal', sans-serif; cursor: pointer; transition: all 0.3s ease; }
            .rasd-btn-cancel { background: none; border: 1px solid var(--border, rgba(148, 163, 184, 0.2)); color: var(--light, #f1f5f9); }
            .rasd-btn-cancel:hover { background: rgba(148, 163, 184, 0.1); }
            .rasd-btn-primary { background: var(--accent, #3b82f6); border: none; color: white; }
            .rasd-btn-primary:hover { background: var(--accent-dark, #2563eb); transform: translateY(-2px); }
            .rasd-btn-danger { background: rgba(239,68,68,0.2); border: 1px solid #ef4444; color: #ef4444; }
            .rasd-btn-danger:hover { background: #ef4444; color: white; }
            .rasd-btn-success { background: var(--success, #10b981); border: none; color: white; }
            .rasd-btn-success:hover { background: #059669; }
            @keyframes rasdFadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes rasdScaleIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(modal);

    // Event listeners
    modal.querySelector('.rasd-modal-close').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

    modal.querySelectorAll('.rasd-modal-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const action = this.dataset.action;
            if (action === 'close') modal.remove();
            if (options.onAction) options.onAction(action, modal);
        });
    });

    return modal;
}

// =============================================
// Confirmation Dialog
// =============================================
function showConfirm(message, onConfirm, onCancel) {
    showModal({
        title: 'تأكيد',
        content: `<p style="font-size: 15px; text-align: center;">${message}</p>`,
        icon: 'fa-question-circle',
        iconColor: 'var(--warning, #f59e0b)',
        buttons: [
            { text: 'إلغاء', class: 'rasd-btn-cancel', action: 'cancel' },
            { text: 'تأكيد', class: 'rasd-btn-primary', action: 'confirm' }
        ],
        onAction: (action, modal) => {
            modal.remove();
            if (action === 'confirm' && onConfirm) onConfirm();
            if (action === 'cancel' && onCancel) onCancel();
        }
    });
}

// =============================================
// Loading Indicator
// =============================================
function showLoading(message = 'جاري التحميل...') {
    const loading = document.createElement('div');
    loading.id = 'rasdLoading';
    loading.innerHTML = `
        <div class="rasd-loading-content">
            <div class="rasd-spinner"></div>
            <span>${message}</span>
        </div>
    `;

    if (!document.getElementById('rasdLoadingStyles')) {
        const style = document.createElement('style');
        style.id = 'rasdLoadingStyles';
        style.textContent = `
            #rasdLoading { position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 99999; }
            .rasd-loading-content { display: flex; flex-direction: column; align-items: center; gap: 20px; color: white; font-family: 'Tajawal', sans-serif; }
            .rasd-spinner { width: 50px; height: 50px; border: 4px solid rgba(255,255,255,0.2); border-top-color: var(--accent, #3b82f6); border-radius: 50%; animation: rasdSpin 1s linear infinite; }
            @keyframes rasdSpin { to { transform: rotate(360deg); } }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(loading);
    return loading;
}

function hideLoading() {
    const loading = document.getElementById('rasdLoading');
    if (loading) loading.remove();
}

// =============================================
// Initialize All Interactive Elements
// =============================================
function initializeInteractions() {
    // Header buttons (refresh, export, etc.)
    initHeaderButtons();

    // Stat cards
    initStatCards();

    // Drone cards and controls
    initDroneControls();

    // Video feeds
    initVideoFeeds();

    // Alert items
    initAlertItems();

    // Add drone / add item cards
    initAddCards();
}

// Header Buttons
function initHeaderButtons() {
    // Refresh buttons
    document.querySelectorAll('[title*="تحديث"], [title*="Refresh"]').forEach(btn => {
        if (btn.dataset.init) return;
        btn.dataset.init = true;
        btn.style.cursor = 'pointer';
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            const icon = this.querySelector('i');
            if (icon) {
                icon.classList.add('fa-spin');
                showToast('جاري تحديث البيانات...', 'info');
                setTimeout(() => {
                    icon.classList.remove('fa-spin');
                    showToast('تم التحديث بنجاح!', 'success');
                }, 1200);
            }
        });
    });

    // Export buttons
    document.querySelectorAll('[title*="تصدير"], [title*="Export"]').forEach(btn => {
        if (btn.dataset.init) return;
        btn.dataset.init = true;
        btn.style.cursor = 'pointer';
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            showToast('جاري تصدير البيانات...', 'info');
            setTimeout(() => showToast('تم تصدير البيانات بنجاح!', 'success'), 1500);
        });
    });

    // Add buttons
    document.querySelectorAll('[title*="إضافة"], [title*="Add"]').forEach(btn => {
        if (btn.dataset.init) return;
        btn.dataset.init = true;
        btn.style.cursor = 'pointer';
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            showAddModal();
        });
    });

    // Filter buttons
    document.querySelectorAll('[title*="تصفية"], [title*="Filter"], [title*="فلترة"]').forEach(btn => {
        if (btn.dataset.init) return;
        btn.dataset.init = true;
        btn.style.cursor = 'pointer';
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            showFilterModal();
        });
    });

    // Screenshot buttons
    document.querySelectorAll('[title*="لقطة"], [title*="Screenshot"]').forEach(btn => {
        if (btn.dataset.init) return;
        btn.dataset.init = true;
        btn.style.cursor = 'pointer';
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            showToast('تم التقاط صورة للشاشة', 'success');
        });
    });

    // Fullscreen buttons
    document.querySelectorAll('[title*="ملء الشاشة"], [title*="Fullscreen"]').forEach(btn => {
        if (btn.dataset.init) return;
        btn.dataset.init = true;
        btn.style.cursor = 'pointer';
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen();
                showToast('تم تفعيل وضع ملء الشاشة', 'info');
            } else {
                document.exitFullscreen();
                showToast('تم إلغاء وضع ملء الشاشة', 'info');
            }
        });
    });
}

// Add Modal
function showAddModal() {
    showModal({
        title: 'إضافة عنصر جديد',
        icon: 'fa-plus-circle',
        iconColor: 'var(--success, #10b981)',
        content: `
            <div style="display: flex; flex-direction: column; gap: 15px;">
                <div>
                    <label style="display: block; margin-bottom: 8px; font-size: 13px; color: rgba(241,245,249,0.7);">الاسم</label>
                    <input type="text" id="addItemName" placeholder="أدخل الاسم" style="width: 100%; padding: 12px 15px; background: rgba(15,23,42,0.5); border: 1px solid var(--border, rgba(148, 163, 184, 0.2)); border-radius: 8px; color: var(--light, #f1f5f9); font-family: 'Tajawal', sans-serif;">
                </div>
                <div>
                    <label style="display: block; margin-bottom: 8px; font-size: 13px; color: rgba(241,245,249,0.7);">الوصف</label>
                    <textarea id="addItemDesc" placeholder="أدخل الوصف" rows="3" style="width: 100%; padding: 12px 15px; background: rgba(15,23,42,0.5); border: 1px solid var(--border, rgba(148, 163, 184, 0.2)); border-radius: 8px; color: var(--light, #f1f5f9); font-family: 'Tajawal', sans-serif; resize: none;"></textarea>
                </div>
            </div>
        `,
        buttons: [
            { text: 'إلغاء', class: 'rasd-btn-cancel', action: 'cancel' },
            { text: 'إضافة', class: 'rasd-btn-success', action: 'add' }
        ],
        onAction: (action, modal) => {
            if (action === 'add') {
                const name = modal.querySelector('#addItemName').value;
                if (!name.trim()) {
                    showToast('الرجاء إدخال الاسم', 'warning');
                    return;
                }
                modal.remove();
                showToast(`تم إضافة "${name}" بنجاح!`, 'success');
            } else {
                modal.remove();
            }
        }
    });
}

// Filter Modal
function showFilterModal() {
    showModal({
        title: 'تصفية البيانات',
        icon: 'fa-filter',
        iconColor: 'var(--accent, #3b82f6)',
        content: `
            <div style="display: flex; flex-direction: column; gap: 20px;">
                <div>
                    <label style="display: block; margin-bottom: 10px; font-weight: 500;">مستوى الخطورة</label>
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                            <input type="checkbox" checked style="width: 18px; height: 18px; accent-color: var(--accent);">
                            <span style="color: #ef4444;">● عالية</span>
                        </label>
                        <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                            <input type="checkbox" checked style="width: 18px; height: 18px; accent-color: var(--accent);">
                            <span style="color: #f59e0b;">● متوسطة</span>
                        </label>
                        <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                            <input type="checkbox" checked style="width: 18px; height: 18px; accent-color: var(--accent);">
                            <span style="color: #10b981;">● منخفضة</span>
                        </label>
                    </div>
                </div>
                <div>
                    <label style="display: block; margin-bottom: 10px; font-weight: 500;">الفترة الزمنية</label>
                    <select style="width: 100%; padding: 12px; background: rgba(15,23,42,0.5); border: 1px solid var(--border, rgba(148, 163, 184, 0.2)); border-radius: 8px; color: var(--light, #f1f5f9); font-family: 'Tajawal', sans-serif;">
                        <option>آخر ساعة</option>
                        <option selected>آخر 24 ساعة</option>
                        <option>آخر 7 أيام</option>
                        <option>آخر 30 يوم</option>
                        <option>الكل</option>
                    </select>
                </div>
            </div>
        `,
        buttons: [
            { text: 'إعادة ضبط', class: 'rasd-btn-cancel', action: 'reset' },
            { text: 'تطبيق', class: 'rasd-btn-primary', action: 'apply' }
        ],
        onAction: (action, modal) => {
            modal.remove();
            if (action === 'apply') showToast('تم تطبيق الفلتر', 'success');
            if (action === 'reset') showToast('تم إعادة ضبط الفلتر', 'info');
        }
    });
}

// Stat Cards
function initStatCards() {
    document.querySelectorAll('.stat-card, .stat-item, .stat-mini').forEach(card => {
        if (card.dataset.init) return;
        card.dataset.init = true;
        card.style.cursor = 'pointer';
        card.style.transition = 'all 0.3s ease';

        card.addEventListener('mouseenter', function () {
            this.style.transform = 'translateY(-5px)';
            this.style.boxShadow = '0 10px 30px rgba(59, 130, 246, 0.2)';
        });

        card.addEventListener('mouseleave', function () {
            this.style.transform = '';
            this.style.boxShadow = '';
        });

        card.addEventListener('click', function () {
            const text = this.textContent || '';
            if (text.includes('طائر') || text.includes('drone')) {
                window.location.href = 'drone-management.html';
            } else if (text.includes('تنبيه') || text.includes('alert')) {
                window.location.href = 'alerts-log.html';
            } else {
                window.location.href = 'analytics.html';
            }
        });
    });
}

// Drone Controls
function initDroneControls() {
    document.querySelectorAll('.control-btn:not([disabled])').forEach(btn => {
        if (btn.dataset.init) return;
        btn.dataset.init = true;

        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            const text = this.textContent.trim();
            const card = this.closest('.drone-card');
            const droneName = card?.querySelector('.drone-name h3, h3')?.textContent || 'الطائرة';

            if (text.includes('البث') || text.includes('video')) {
                showToast(`جاري فتح البث المباشر لـ ${droneName}`, 'info');
                setTimeout(() => window.location.href = 'live-broadcast.html', 500);
            } else if (text.includes('المسار') || text.includes('route')) {
                showToast(`جاري عرض مسار ${droneName}`, 'info');
                setTimeout(() => window.location.href = 'interactive-map.html', 500);
            } else if (text.includes('عودة') || text.includes('home')) {
                showConfirm(`هل تريد إرجاع ${droneName} إلى المنصة؟`, () => {
                    showToast(`تم إرسال أمر العودة لـ ${droneName}`, 'success');
                });
            } else if (text.includes('إقلاع') || text.includes('takeoff')) {
                showConfirm(`هل تريد تشغيل ${droneName}؟`, () => {
                    showToast(`تم إرسال أمر الإقلاع لـ ${droneName}`, 'success');
                });
            } else if (text.includes('تقرير') || text.includes('report')) {
                showToast(`جاري فتح تقرير ${droneName}`, 'info');
                setTimeout(() => window.location.href = 'reports.html', 500);
            }
        });
    });
}

// Video Feeds
function initVideoFeeds() {
    document.querySelectorAll('.video-feed').forEach(feed => {
        if (feed.dataset.init) return;
        feed.dataset.init = true;
        feed.style.cursor = 'pointer';

        feed.addEventListener('click', function (e) {
            if (e.target.closest('button')) return;
            window.location.href = 'live-broadcast.html';
        });
    });
}

// Alert Items
function initAlertItems() {
    document.querySelectorAll('.alert-item, .notif-item').forEach(item => {
        if (item.dataset.init) return;
        item.dataset.init = true;
        item.style.cursor = 'pointer';

        item.addEventListener('click', function () {
            window.location.href = 'alerts-log.html';
        });
    });
}

// Add Cards
function initAddCards() {
    document.querySelectorAll('.add-drone-card, [class*="add-card"]').forEach(card => {
        if (card.dataset.init) return;
        card.dataset.init = true;
        card.style.cursor = 'pointer';

        card.addEventListener('click', function () {
            showAddModal();
        });
    });
}

// =============================================
// Initialize on DOM Ready
// =============================================
document.addEventListener('DOMContentLoaded', initializeInteractions);

// Re-initialize for dynamically added content
const observer = new MutationObserver(() => {
    initializeInteractions();
});

observer.observe(document.body, { childList: true, subtree: true });
