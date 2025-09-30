// مدير التوقيت - ملف منفصل لإدارة التوقيت والاشعارات
class TimerManager {
    constructor() {
        this.timers = new Map();
        this.timeUpSessions = new Set();
        this.currentTimeUpSessionId = null;
        this.isUpdating = false;
    }

    // بدء عداد للجلسة
    startTimer(sessionId, timeLimit, callback) {
        if (this.timers.has(sessionId)) {
            this.stopTimer(sessionId);
        }

        const timer = setInterval(() => {
            callback(sessionId);
        }, 1000);

        this.timers.set(sessionId, {
            timer: timer,
            timeLimit: timeLimit,
            startTime: Date.now()
        });
    }

    // إيقاف عداد للجلسة
    stopTimer(sessionId) {
        const timerData = this.timers.get(sessionId);
        if (timerData) {
            clearInterval(timerData.timer);
            this.timers.delete(sessionId);
        }
        this.timeUpSessions.delete(sessionId);
    }

    // إيقاف جميع العدادات
    stopAllTimers() {
        this.timers.forEach((timerData, sessionId) => {
            clearInterval(timerData.timer);
        });
        this.timers.clear();
        this.timeUpSessions.clear();
    }

    // فحص انتهاء الوقت
    checkTimeUp(sessionId, elapsedMinutes, timeLimit) {
        // إذا انتهى الوقت ولم تكن الجلسة في قائمة الجلسات المنتهية
        if (elapsedMinutes >= timeLimit && !this.timeUpSessions.has(sessionId)) {
            this.timeUpSessions.add(sessionId);
            return true;
        }
        
        // إذا لم ينته الوقت وكانت الجلسة في قائمة الجلسات المنتهية (تم تمديدها)
        if (elapsedMinutes < timeLimit && this.timeUpSessions.has(sessionId)) {
            this.timeUpSessions.delete(sessionId);
        }
        
        return false;
    }

    // إزالة جلسة من قائمة الجلسات المنتهية
    removeTimeUpSession(sessionId) {
        this.timeUpSessions.delete(sessionId);
    }

    // إعادة تعيين حالة الجلسة بعد التمديد
    resetSessionState(sessionId) {
        this.timeUpSessions.delete(sessionId);
        this.hideTimeUpModal();
    }

    // التحقق من وجود جلسة منتهية الوقت
    hasTimeUpSession(sessionId) {
        return this.timeUpSessions.has(sessionId);
    }

    // إظهار نافذة انتهاء الوقت
    showTimeUpModal(deviceName, sessionId, onStop, onExtend, onSwitchToUnlimited) {
        // إخفاء أي نافذة سابقة
        this.hideTimeUpModal();

        // إنشاء النافذة
        const modal = document.createElement('div');
        modal.id = 'timeUpModal';
        modal.className = 'modal time-up-modal show';
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-exclamation-triangle"></i> انتهاء الوقت</h3>
                    <button class="close-btn" id="closeTimeUpModal">&times;</button>
                </div>
                <div class="time-up-content">
                    <p>انتهى وقت اللعب على الجهاز <strong>${deviceName}</strong></p>
                </div>
                <div class="time-up-actions">
                    <button class="btn btn-danger" id="stopSessionBtn">
                        <i class="fas fa-stop"></i>
                        إيقاف الجلسة
                    </button>
                    <button class="btn btn-warning" id="extendTimeBtn">
                        <i class="fas fa-clock"></i>
                        تمديد الوقت
                    </button>
                    <button class="btn btn-success" id="switchToUnlimitedBtn">
                        <i class="fas fa-infinity"></i>
                        وقت مفتوح
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // إضافة مستمعي الأحداث
        document.getElementById('closeTimeUpModal').addEventListener('click', () => {
            this.hideTimeUpModal();
        });

        document.getElementById('stopSessionBtn').addEventListener('click', () => {
            this.hideTimeUpModal();
            onStop(sessionId);
        });

        document.getElementById('extendTimeBtn').addEventListener('click', () => {
            this.hideTimeUpModal();
            onExtend(sessionId);
        });

        document.getElementById('switchToUnlimitedBtn').addEventListener('click', () => {
            this.hideTimeUpModal();
            onSwitchToUnlimited(sessionId);
        });

        // إغلاق النافذة عند النقر خارجها
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.hideTimeUpModal();
            }
        });

        // حفظ معرف الجلسة الحالية
        this.currentTimeUpSessionId = sessionId;
    }

    // إخفاء نافذة انتهاء الوقت
    hideTimeUpModal() {
        const modal = document.getElementById('timeUpModal');
        if (modal) {
            modal.remove();
        }
        this.currentTimeUpSessionId = null;
    }

    // إظهار نافذة تمديد الوقت
    showExtendTimeModal(sessionId, onExtend, onCancel) {
        const modal = document.createElement('div');
        modal.id = 'extendTimeModal';
        modal.className = 'modal show';
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-clock"></i> تمديد الوقت</h3>
                    <button class="close-btn" id="closeExtendTimeModal">&times;</button>
                </div>
                <div class="form-group">
                    <label for="extendMinutes">كم دقيقة تريد إضافة؟</label>
                    <input type="number" id="extendMinutes" min="1" max="480" value="30" required>
                </div>
                <div class="form-actions">
                    <button class="btn btn-secondary" id="cancelExtendBtn">إلغاء</button>
                    <button class="btn btn-primary" id="confirmExtendBtn">تأكيد</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // إضافة مستمعي الأحداث
        document.getElementById('closeExtendTimeModal').addEventListener('click', () => {
            this.hideExtendTimeModal();
            if (onCancel) onCancel();
        });

        document.getElementById('cancelExtendBtn').addEventListener('click', () => {
            this.hideExtendTimeModal();
            if (onCancel) onCancel();
        });

        document.getElementById('confirmExtendBtn').addEventListener('click', () => {
            const minutes = parseInt(document.getElementById('extendMinutes').value);
            if (minutes > 0) {
                this.hideExtendTimeModal();
                onExtend(sessionId, minutes);
            }
        });

        // التركيز على حقل الإدخال
        setTimeout(() => {
            document.getElementById('extendMinutes').focus();
        }, 100);
    }

    // إخفاء نافذة تمديد الوقت
    hideExtendTimeModal() {
        const modal = document.getElementById('extendTimeModal');
        if (modal) {
            modal.remove();
        }
    }

    // تحديث العدادات للجلسات النشطة
    updateActiveSessionTimers(sessions, devices, onTimeUp) {
        if (this.isUpdating) return;
        
        this.isUpdating = true;
        
        try {
            const currentTime = Date.now();
            
            sessions.forEach(session => {
                if (session.is_active && session.session_type === 'limited') {
                    const startTime = new Date(session.start_time);
                    const elapsedSeconds = Math.floor((currentTime - startTime.getTime()) / 1000);
                    const elapsedMinutes = Math.floor(elapsedSeconds / 60);
                    
                    // فحص انتهاء الوقت
                    if (this.checkTimeUp(session.id, elapsedMinutes, session.time_limit)) {
                        const device = devices.find(d => d.id === session.device_id);
                        if (device && onTimeUp) {
                            onTimeUp(device.name, session.id);
                        }
                    }
                }
            });
        } finally {
            this.isUpdating = false;
        }
    }

    // تنظيف الموارد
    cleanup() {
        this.stopAllTimers();
        this.hideTimeUpModal();
        this.hideExtendTimeModal();
    }
}

// إنشاء مثيل عام لمدير التوقيت
const timerManager = new TimerManager();
