// نظام الإشعارات المبسط
class NotificationSystem {
    constructor() {
        this.notifications = new Map();
    }

    // إظهار إشعار بسيط
    show(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // إضافة الأنماط
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 10000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            max-width: 300px;
            word-wrap: break-word;
        `;

        // تحديد اللون حسب النوع
        const colors = {
            success: '#28a745',
            error: '#dc3545',
            warning: '#ffc107',
            info: '#17a2b8'
        };
        notification.style.backgroundColor = colors[type] || colors.info;

        document.body.appendChild(notification);

        // إظهار الإشعار
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 10);

        // إخفاء الإشعار
            setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
    }

    success(message) {
        this.show(message, 'success');
    }

    error(message) {
        this.show(message, 'error');
    }

    warning(message) {
        this.show(message, 'warning');
    }

    info(message) {
        this.show(message, 'info');
    }
}

// إنشاء مثيل عام لنظام الإشعارات
const notification = new NotificationSystem();

// دوال اختبار النظام الجديد
function testNotificationSystem() {
    console.log('اختبار نظام الإشعارات...');
    
    notification.info('هذا إشعار معلوماتي للاختبار');
    
        setTimeout(() => {
        notification.success('هذا إشعار نجاح للاختبار');
    }, 1000);
    
    setTimeout(() => {
        notification.warning('هذا إشعار تحذيري للاختبار');
    }, 2000);
    
    setTimeout(() => {
        notification.error('هذا إشعار خطأ للاختبار');
    }, 3000);
}

function testTimeUpModal() {
    console.log('اختبار نافذة انتهاء الوقت...');
    
    if (window.gamingCenter) {
        gamingCenter.showTimeUpModal('PlayStation Test', 9999);
    }
}

function testExtendTime() {
    console.log('اختبار تمديد الوقت...');
    
    if (window.gamingCenter) {
        // محاكاة جلسة مع وقت محدود
        const testSession = {
            id: 9999,
            device_id: 1,
            player_name: 'Test Player',
            session_type: 'limited',
            time_limit: 5, // 5 دقائق
            game_mode: 'duo',
            start_time: new Date(Date.now() - 6 * 60 * 1000).toISOString(), // بدأت قبل 6 دقائق
            is_active: true
        };
        
        gamingCenter.sessions.push(testSession);
        gamingCenter.showExtendTimeModal(9999);
    }
}

// إدارة صالة الألعاب - PlayStation 4 (محسن مع SQL)
class GamingCenterManager {
    constructor() {
        this.devices = [];
        this.sessions = [];
        this.currentUser = null;
        this.hourlyRates = {
            duo: 6000,  // 6000 ليرة سورية للساعة للزوجي
            quad: 8000  // 8000 ليرة سورية للساعة للرباعي
        };
        this.apiUrl = 'api.php';
        this.isOnline = true;
        this.currentReportData = null;
        this.currentTheme = 'light'; // إضافة متغير الثيم الحالي
        this.lastUpdateTime = 0; // متغير لتتبع آخر وقت تحديث
        this.isUpdating = false; // متغير لمنع التحديثات المتداخلة
        this.adminPassword = '12'; // كلمة مرور الإدارة
        this.isAdminAuthenticated = false; // حالة المصادقة
        
        this.initializeApp();
    }

    initializeApp() {
        this.loadTheme(); // تحميل الثيم المحفوظ
        this.setupEventListeners();
        this.checkConnection();
        this.loadData();
    }

    async checkConnection() {
        try {
            const response = await fetch(`${this.apiUrl}?action=get_stats`);
            this.isOnline = response.ok;
        } catch (error) {
            this.isOnline = false;
            console.log('العمل في وضع عدم الاتصال');
        }
    }

    setupEventListeners() {
        // تسجيل الدخول
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // الأزرار الرئيسية
        document.getElementById('manageDevicesBtn').addEventListener('click', () => {
            this.showDevicesModal();
        });

        document.getElementById('addSessionBtn').addEventListener('click', () => {
            this.showSessionModal();
        });

        document.getElementById('viewReportsBtn').addEventListener('click', () => {
            this.showReportsModal();
        });

        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.handleLogout();
        });

        // نافذة الجلسة
        document.getElementById('closeSessionModal').addEventListener('click', () => {
            this.hideSessionModal();
        });

        document.getElementById('cancelSession').addEventListener('click', () => {
            this.hideSessionModal();
        });

        document.getElementById('sessionForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.startSession();
        });

        document.getElementById('sessionType').addEventListener('change', (e) => {
            this.toggleTimeLimitInput(e.target.value);
        });

        // تم إزالة معالجات نافذة انتهاء الوقت - تم استبدالها بـ Toast

        // نافذة تسجيل دخول الإدارة
        document.getElementById('closeAdminLoginModal').addEventListener('click', () => {
            this.hideAdminLoginModal();
        });

        document.getElementById('cancelAdminLogin').addEventListener('click', () => {
            this.hideAdminLoginModal();
        });

        document.getElementById('adminLoginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const password = document.getElementById('adminPasswordInput').value;
            this.handleAdminLogin(password);
        });

        // دعم Enter key في حقل كلمة المرور
        document.getElementById('adminPasswordInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const password = e.target.value;
                this.handleAdminLogin(password);
            }
        });

        // نافذة إدارة الأجهزة
        document.getElementById('closeDevicesModal').addEventListener('click', () => {
            this.hideDevicesModal();
        });

        document.getElementById('addDeviceBtn').addEventListener('click', () => {
            this.addDevice();
        });

        // مستمعي أحداث إدارة الأسعار
        document.getElementById('updateDuoPrice').addEventListener('click', () => {
            this.updatePricing('duo');
        });

        document.getElementById('updateQuadPrice').addEventListener('click', () => {
            this.updatePricing('quad');
        });

        // مستمعي أحداث مسح التقارير
        document.getElementById('clearAllReportsBtn').addEventListener('click', () => {
            this.showClearReportsModal();
        });

        document.getElementById('cancelClearReports').addEventListener('click', () => {
            this.hideClearReportsModal();
        });

        document.getElementById('confirmClearReports').addEventListener('click', () => {
            this.confirmClearReports();
        });

        // نافذة التقارير
        document.getElementById('closeReportsModal').addEventListener('click', () => {
            this.hideReportsModal();
        });

        document.getElementById('generateReport').addEventListener('click', () => {
            this.generateReport();
        });

        document.getElementById('exportPDF').addEventListener('click', () => {
            this.exportToPDF();
        });

        // زر تبديل الثيم
        document.getElementById('themeToggleBtn').addEventListener('click', () => {
            this.toggleTheme();
        });

        // إضافة زر تصدير HTML كبديل
        this.addHTMLExportButton();

        // إغلاق النوافذ عند النقر خارجها
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                if (e.target.id === 'adminLoginModal') {
                    this.hideAdminLoginModal();
                } else if (e.target.id === 'clearReportsModal') {
                    this.hideClearReportsModal();
                } else {
                    this.hideAllModals();
                }
            }
        });

        // تحديث البيانات كل 30 ثانية
        this.dataUpdateInterval = setInterval(() => {
            if (this.currentUser && !this.isUpdating) {
                this.loadData();
            }
        }, 30000);

        // تحديث العدادات كل ثانية للجلسات النشطة
        this.timerUpdateInterval = setInterval(() => {
            if (this.currentUser && !this.isUpdating) {
                this.updateActiveSessionTimers();
            }
        }, 1000);
    }

    async loadData() {
        // منع التحديثات المتداخلة
        if (this.isUpdating) {
            return;
        }
        
        this.isUpdating = true;
        
        try {
            if (this.isOnline) {
                await this.loadDevices();
                
                // تحقق من وجود تعديلات محلية للجلسات
                const hasLocalSessionChanges = this.hasLocalSessionChanges();
                if (!hasLocalSessionChanges) {
                    await this.loadActiveSessions();
                } else {
                    // إذا كانت هناك تعديلات محلية، لا نعيد تحميل الجلسات
                    console.log('تجاهل إعادة تحميل الجلسات بسبب وجود تعديلات محلية');
                }
                
                await this.loadStats();
            } else {
                this.loadLocalData();
            }
            this.updateUI();
        } finally {
            this.isUpdating = false;
        }
    }

    // فحص وجود تعديلات محلية للجلسات
    hasLocalSessionChanges() {
        return this.sessions.some(session => 
            session.is_active && 
            (session.time_limit !== session.original_time_limit || 
             session.session_type !== session.original_session_type)
        );
    }

    // مسح التعديلات المحلية للجلسة المنتهية
    clearLocalSessionChanges(sessionId) {
        const session = this.sessions.find(s => s.id === sessionId);
        if (session) {
            delete session.original_time_limit;
            delete session.original_session_type;
        }
    }

    async loadDevices() {
        try {
            const response = await fetch(`${this.apiUrl}?action=get_devices`);
            if (response.ok) {
                this.devices = await response.json();
            }
        } catch (error) {
            console.error('خطأ في تحميل الأجهزة:', error);
            this.isOnline = false;
        }
    }

    async loadActiveSessions() {
        try {
            const response = await fetch(`${this.apiUrl}?action=get_active_sessions`);
            if (response.ok) {
                const serverSessions = await response.json();
                
                // دمج الجلسات من الخادم مع التعديلات المحلية
                this.mergeSessionsWithLocalChanges(serverSessions);
            }
        } catch (error) {
            console.error('خطأ في تحميل الجلسات النشطة:', error);
            this.isOnline = false;
        }
    }

    // دمج الجلسات من الخادم مع التعديلات المحلية
    mergeSessionsWithLocalChanges(serverSessions) {
        // إنشاء خريطة للجلسات المحلية المعدلة
        const localChanges = new Map();
        
        // حفظ التعديلات المحلية للجلسات النشطة
        this.sessions.forEach(session => {
            if (session.is_active) {
                localChanges.set(session.id, {
                    time_limit: session.time_limit,
                    session_type: session.session_type,
                    original_time_limit: session.original_time_limit,
                    original_session_type: session.original_session_type,
                    modified: true
                });
            }
        });
        
        // تحديث الجلسات من الخادم مع الحفاظ على التعديلات المحلية
        this.sessions = serverSessions.map(serverSession => {
            const localChange = localChanges.get(serverSession.id);
            if (localChange && localChange.modified) {
                // تطبيق التعديلات المحلية مع الحفاظ على القيم الأصلية
                return {
                    ...serverSession,
                    time_limit: localChange.time_limit,
                    session_type: localChange.session_type,
                    original_time_limit: localChange.original_time_limit || serverSession.time_limit,
                    original_session_type: localChange.original_session_type || serverSession.session_type
                };
            }
            return serverSession;
        });
    }

    async loadStats() {
        try {
            const response = await fetch(`${this.apiUrl}?action=get_stats`);
            if (response.ok) {
                const stats = await response.json();
                this.updateStatsDisplay(stats);
            }
        } catch (error) {
            console.error('خطأ في تحميل الإحصائيات:', error);
        }
    }

    loadLocalData() {
        const savedData = localStorage.getItem('gamingCenterData');
        if (savedData) {
            const data = JSON.parse(savedData);
            this.devices = data.devices || this.initializeDefaultDevices();
            this.sessions = data.sessions || [];
            this.currentUser = data.currentUser;
        } else {
            this.devices = this.initializeDefaultDevices();
        }
        
        // تحميل الأسعار المحفوظة
        this.loadSavedPricing();
    }

    loadSavedPricing() {
        const savedPricing = localStorage.getItem('gamingCenterPricing');
        if (savedPricing) {
            const pricing = JSON.parse(savedPricing);
            this.hourlyRates.duo = pricing.duo || 6000;
            this.hourlyRates.quad = pricing.quad || 8000;
        }
    }

    initializeDefaultDevices() {
        const devices = [];
        for (let i = 1; i <= 6; i++) {
            devices.push({
                id: i,
                name: `PS4 #${i}`,
                status: 'available',
                total_play_time: 0,
                total_revenue: 0
            });
        }
        return devices;
    }

    async handleLogin() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        if (this.isOnline) {
            try {
                const response = await fetch(`${this.apiUrl}?action=login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username, password })
                });

                const result = await response.json();
                
                if (result.success) {
                    this.currentUser = result.user;
                    this.showMainScreen();
                    await this.loadData();
                } else {
                    notification.error(result.message || 'اسم المستخدم أو كلمة المرور غير صحيحة');
                }
            } catch (error) {
                console.error('خطأ في تسجيل الدخول:', error);
                this.isOnline = false;
                this.handleLocalLogin(username, password);
            }
        } else {
            this.handleLocalLogin(username, password);
        }
    }

    handleLocalLogin(username, password) {
        if (username === 'admin' && password === 'admin123') {
            this.currentUser = { username, password };
            this.showMainScreen();
            this.loadLocalData();
            this.updateUI();
        } else {
            notification.error('اسم المستخدم أو كلمة المرور غير صحيحة');
        }
    }

    handleLogout() {
        this.currentUser = null;
        this.showLoginScreen();
        
        // إيقاف جميع العدادات باستخدام مدير التوقيت
        timerManager.cleanup();
        
        // إيقاف عدادات التحديث
        if (this.dataUpdateInterval) {
            clearInterval(this.dataUpdateInterval);
        }
        if (this.timerUpdateInterval) {
            clearInterval(this.timerUpdateInterval);
        }
        
        // إعادة تعيين المتغيرات
        this.isUpdating = false;
        this.isAdminAuthenticated = false;
    }

    showLoginScreen() {
        document.getElementById('loginScreen').classList.remove('hidden');
        document.getElementById('mainScreen').classList.add('hidden');
    }

    showMainScreen() {
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('mainScreen').classList.remove('hidden');
        this.updateUI();
    }

    showSessionModal() {
        this.populateDeviceSelect();
        document.getElementById('sessionModal').classList.add('show');
    }

    hideSessionModal() {
        document.getElementById('sessionModal').classList.remove('show');
        this.resetSessionForm();
    }

    showReportsModal() {
        document.getElementById('reportsModal').classList.add('show');
        this.setDefaultReportDate();
    }

    hideReportsModal() {
        document.getElementById('reportsModal').classList.remove('show');
    }

    showDevicesModal() {
        // طلب كلمة المرور للإدارة
        if (!this.isAdminAuthenticated) {
            this.showAdminLoginModal();
            return;
        }
        
        this.openDevicesModal();
    }

    showAdminLoginModal() {
        // إخفاء أي نوافذ أخرى مفتوحة
        this.hideAllModals();
        
        // إظهار نافذة تسجيل دخول الإدارة
        document.getElementById('adminLoginModal').classList.add('show');
        
        // التركيز على حقل كلمة المرور
        setTimeout(() => {
            document.getElementById('adminPasswordInput').focus();
        }, 100);
    }

    hideAdminLoginModal() {
        document.getElementById('adminLoginModal').classList.remove('show');
        // مسح حقل كلمة المرور
        document.getElementById('adminPasswordInput').value = '';
    }

    handleAdminLogin(password) {
        if (password === this.adminPassword) {
            this.isAdminAuthenticated = true;
            this.hideAdminLoginModal();
            this.openDevicesModal();
            notification.success('تم تسجيل الدخول بنجاح');
        } else {
            notification.error('كلمة المرور غير صحيحة');
            // إضافة تأثير اهتزاز للحقل
            const passwordInput = document.getElementById('adminPasswordInput');
            passwordInput.classList.add('error');
            passwordInput.style.animation = 'shake 0.5s ease-in-out';
            
            setTimeout(() => {
                passwordInput.classList.remove('error');
                passwordInput.style.animation = '';
                passwordInput.focus();
                passwordInput.select();
            }, 500);
        }
    }

    openDevicesModal() {
        document.getElementById('devicesModal').classList.add('show');
        this.loadDevicesList();
        this.loadPricingSettings();
    }

    hideDevicesModal() {
        document.getElementById('devicesModal').classList.remove('show');
    }

    hideAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('show');
        });
    }

    // إظهار نافذة انتهاء الوقت
    showTimeUpModal(deviceName, sessionId) {
        timerManager.showTimeUpModal(
            deviceName, 
            sessionId,
            (sessionId) => this.stopSession(sessionId),
            (sessionId) => this.showExtendTimeModal(sessionId),
            (sessionId) => this.switchToUnlimited(sessionId)
        );
        
        // إضافة تأثير صوتي (اختياري)
        this.playTimeUpSound();
    }

    // دالة لإيقاف الجلسة
    stopSession(sessionId) {
        const session = this.sessions.find(s => s.id === sessionId);
        if (session) {
            this.endSession(sessionId);
            timerManager.removeTimeUpSession(sessionId);
            notification.success('تم إيقاف الجلسة بنجاح');
        }
    }

    // دالة لإظهار نافذة تمديد الوقت
    showExtendTimeModal(sessionId) {
        timerManager.showExtendTimeModal(
            sessionId,
            (sessionId, minutes) => this.extendSessionTime(sessionId, minutes),
            () => {
                // إعادة إظهار نافذة انتهاء الوقت إذا تم الإلغاء
                const session = this.sessions.find(s => s.id === sessionId);
                if (session) {
                    const device = this.devices.find(d => d.id === session.device_id);
                    if (device) {
                        this.showTimeUpModal(device.name, sessionId);
                    }
                }
            }
        );
    }

    // دالة للتحويل إلى وقت مفتوح
    async switchToUnlimited(sessionId) {
        const session = this.sessions.find(s => s.id === sessionId);
        if (session) {
            // حفظ القيم الأصلية إذا لم تكن محفوظة من قبل
            if (!session.original_time_limit) {
                session.original_time_limit = session.time_limit;
            }
            if (!session.original_session_type) {
                session.original_session_type = session.session_type;
            }
            
            // حفظ البيانات الحالية للتراجع
            const currentType = session.session_type;
            const currentTimeLimit = session.time_limit;
            
            try {
                // تحديث البيانات محلياً
                session.session_type = 'unlimited';
                session.time_limit = null;
                
                // محاولة تحديث قاعدة البيانات
                if (this.isOnline) {
                    await this.updateSessionInDatabase(session);
                }
                
                // إزالة الجلسة من قائمة الجلسات المنتهية الوقت
                timerManager.removeTimeUpSession(sessionId);
                notification.success('تم التحويل إلى وقت مفتوح بنجاح');
                this.updateDevicesGrid();
                
            } catch (error) {
                // في حالة فشل التحديث، إعادة البيانات الحالية
                session.session_type = currentType;
                session.time_limit = currentTimeLimit;
                console.error('فشل في تحديث الجلسة:', error);
                notification.error('فشل في تحديث الجلسة');
            }
        }
    }

    // دالة لتمديد وقت الجلسة
    async extendSessionTime(sessionId, additionalMinutes) {
        const session = this.sessions.find(s => s.id === sessionId);
        if (session) {
            // حفظ الوقت الأصلي إذا لم يكن محفوظاً من قبل
            if (!session.original_time_limit) {
                session.original_time_limit = session.time_limit;
            }
            if (!session.original_session_type) {
                session.original_session_type = session.session_type;
            }
            
            // حفظ الوقت الحالي للتراجع
            const currentTimeLimit = session.time_limit;
            
            try {
                // تحديث الوقت محلياً
                session.time_limit += additionalMinutes;
                
                // محاولة تحديث قاعدة البيانات
                if (this.isOnline) {
                    await this.updateSessionInDatabase(session);
                }
                
                // إعادة تعيين حالة الجلسة بعد التمديد
                timerManager.resetSessionState(sessionId);
                
                notification.success(`تم تمديد الوقت بـ ${additionalMinutes} دقيقة`);
                this.updateDevicesGrid();
                
                // تحديث واجهة المستخدم فوراً لإظهار الوقت الجديد
                this.updateSessionUI();
                
            } catch (error) {
                // في حالة فشل التحديث، إعادة الوقت الحالي
                session.time_limit = currentTimeLimit;
                console.error('فشل في تحديث الجلسة:', error);
                notification.error('فشل في تحديث الجلسة');
            }
        }
    }

    // دالة لتحديث الجلسة في قاعدة البيانات
    async updateSessionInDatabase(session) {
        try {
            const response = await fetch('api.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'update_session',
                    session_id: session.id,
                    session_type: session.session_type,
                    time_limit: session.time_limit
                })
            });

            if (!response.ok) {
                throw new Error('فشل في تحديث الجلسة');
            }

            const result = await response.json();
            if (!result.success) {
                throw new Error(result.message || 'فشل في تحديث الجلسة');
            }
        } catch (error) {
            console.error('خطأ في تحديث الجلسة:', error);
            notification.error('فشل في تحديث الجلسة');
            throw error; // إعادة رمي الخطأ للتعامل معه في الدالة المستدعية
        }
    }

    playTimeUpSound() {
        // إنشاء صوت تنبيه بسيط
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (error) {
            console.log('لا يمكن تشغيل الصوت');
        }
    }

    populateDeviceSelect() {
        const select = document.getElementById('deviceSelect');
        select.innerHTML = '<option value="">-- اختر الجهاز --</option>';
        
        this.devices.forEach(device => {
            if (device.status === 'available') {
                const option = document.createElement('option');
                option.value = device.id;
                option.textContent = device.name;
                select.appendChild(option);
            }
        });
        
        // تحديث خيارات نمط اللعب
        this.updateGameModeOptions();
    }

    toggleTimeLimitInput(sessionType) {
        const timeLimitGroup = document.getElementById('timeLimitGroup');
        if (sessionType === 'limited') {
            timeLimitGroup.style.display = 'block';
        } else {
            timeLimitGroup.style.display = 'none';
        }
    }

    async startSession() {
        const deviceId = parseInt(document.getElementById('deviceSelect').value);
        const playerName = document.getElementById('playerName').value;
        const gameMode = document.getElementById('gameMode').value;
        const sessionType = document.getElementById('sessionType').value;
        const timeLimit = parseInt(document.getElementById('timeLimit').value) || null;

        if (!deviceId || !playerName || !gameMode || !sessionType) {
            notification.warning('يرجى ملء جميع الحقول المطلوبة');
            return;
        }

        if (sessionType === 'limited' && (!timeLimit || timeLimit <= 0)) {
            notification.warning('يرجى إدخال مدة صحيحة للوقت المحدد');
            return;
        }

        if (this.isOnline) {
            try {
                const response = await fetch(`${this.apiUrl}?action=start_session`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        device_id: deviceId,
                        player_name: playerName,
                        session_type: sessionType,
                        time_limit: timeLimit,
                        game_mode: gameMode
                    })
                });

                const result = await response.json();
                
                if (result.success) {
                    this.hideSessionModal();
                    await this.loadData();
                    notification.success(`تم بدء الجلسة بنجاح للاعب ${playerName}`);
                } else {
                    notification.error(result.message || 'فشل في بدء الجلسة');
                }
            } catch (error) {
                console.error('خطأ في بدء الجلسة:', error);
                this.isOnline = false;
                this.startLocalSession(deviceId, playerName, sessionType, timeLimit, gameMode);
            }
        } else {
            this.startLocalSession(deviceId, playerName, sessionType, timeLimit, gameMode);
        }
    }

    startLocalSession(deviceId, playerName, sessionType, timeLimit, gameMode) {
        const device = this.devices.find(d => d.id === deviceId);
        if (device.status !== 'available') {
            notification.warning('هذا الجهاز غير متاح حالياً');
            return;
        }

        const session = {
            id: Date.now(),
            device_id: deviceId,
            player_name: playerName,
            session_type: sessionType,
            time_limit: timeLimit,
            game_mode: gameMode,
            start_time: new Date().toISOString(),
            end_time: null,
            is_active: true,
            total_cost: 0
        };

        this.sessions.push(session);
        device.status = 'occupied';

        this.hideSessionModal();
        
        // تحديث البطاقة المحددة فقط بدلاً من إعادة رسم الصفحة
        this.updateSpecificDeviceCard(device);
        this.updateStats();
        this.saveLocalData();
        
        // إزالة أي جلسات منتهية الوقت سابقة للجهاز
        timerManager.removeTimeUpSession(deviceId);
        
        notification.success(`تم بدء الجلسة بنجاح للاعب ${playerName}`);
    }

    async endSession(sessionId) {
        if (this.isOnline) {
            try {
                const response = await fetch(`${this.apiUrl}?action=end_session`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ session_id: sessionId })
                });

                const result = await response.json();
                
                if (result.success) {
                    await this.loadData();
                    notification.success(`انتهت الجلسة. التكلفة: ${result.total_cost} ليرة سورية`);
                } else {
                    notification.error(result.message || 'فشل في إنهاء الجلسة');
                }
            } catch (error) {
                console.error('خطأ في إنهاء الجلسة:', error);
                this.isOnline = false;
                this.endLocalSession(sessionId);
            }
        } else {
            this.endLocalSession(sessionId);
        }
    }

    endLocalSession(sessionId) {
        const session = this.sessions.find(s => s.id === sessionId);
        if (!session) return;

        const device = this.devices.find(d => d.id === session.device_id);
        const endTime = new Date();
        const startTime = new Date(session.start_time);
        const elapsedMinutes = Math.floor((endTime - startTime) / (1000 * 60));
        
        session.end_time = endTime.toISOString();
        session.is_active = false;
        // حساب التكلفة النهائية وحفظها
        const finalCost = this.calculateCost(elapsedMinutes, session.game_mode);
        session.total_cost = finalCost;
        session.final_cost = finalCost; // حفظ التكلفة النهائية
        session.final_cost_rate = this.hourlyRates[session.game_mode]; // حفظ السعر المستخدم

        device.status = 'available';
        device.total_play_time += elapsedMinutes;
        device.total_revenue += session.total_cost;

        // تحديث البطاقة المحددة فقط بدلاً من إعادة رسم الصفحة
        this.updateSpecificDeviceCard(device);
        this.updateStats();
        this.saveLocalData();
        
        // إزالة الجلسة من قائمة الجلسات المنتهية الوقت
        timerManager.removeTimeUpSession(sessionId);
        
        // مسح التعديلات المحلية للجلسة المنتهية
        this.clearLocalSessionChanges(sessionId);
        
        notification.success(`انتهت الجلسة. التكلفة: ${session.total_cost} ليرة سورية`);
    }

    calculateCost(minutes, gameMode = 'duo') {
        const hours = minutes / 60;
        const hourlyRate = this.hourlyRates[gameMode] || this.hourlyRates.duo;
        return Math.ceil(hours * hourlyRate);
    }

    updateUI() {
        // منع التحديثات المتداخلة
        if (this.isUpdating) {
            return;
        }
        
        this.isUpdating = true;
        
        try {
            this.updateDevicesGrid();
            if (!this.isOnline) {
                this.updateStats();
            }
        } finally {
            this.isUpdating = false;
        }
    }

    updateActiveSessionTimers() {
        // استخدام مدير التوقيت لتحديث العدادات
        timerManager.updateActiveSessionTimers(this.sessions, this.devices, (deviceName, sessionId) => {
            this.showTimeUpModal(deviceName, sessionId);
        });
        
        // تحديث واجهة المستخدم للجلسات النشطة
        this.updateSessionUI();
    }

    updateSessionUI() {
        // منع التحديثات المتداخلة
        if (this.isUpdating) {
            return;
        }
        
        this.isUpdating = true;
        
        try {
            const currentTime = Date.now();
            
            // تحديث العدادات للجلسات النشطة
            this.sessions.forEach(session => {
                if (session.is_active) {
                    const startTime = new Date(session.start_time);
                    const elapsedSeconds = Math.floor((currentTime - startTime.getTime()) / 1000);
                    const elapsedMinutes = Math.floor(elapsedSeconds / 60);
                    const remainingSeconds = elapsedSeconds % 60;
                    
                // تحديث الوقت المنقضي
                const elapsedTimeElement = document.querySelector(`.elapsed-time[data-session-id="${session.id}"]`);
                if (elapsedTimeElement) {
                    const newTimeText = this.formatTimeWithSeconds(elapsedMinutes, remainingSeconds);
                    if (elapsedTimeElement.textContent !== newTimeText) {
                        elapsedTimeElement.textContent = newTimeText;
                    }
                }
                
                // تحديث التكلفة الحالية
                const costElement = document.querySelector(`.device-card[data-device-id="${session.device_id}"] .device-info p:last-child`);
                if (costElement) {
                    const currentCost = this.calculateCost(elapsedMinutes, session.game_mode);
                    const newCostText = `التكلفة الحالية: ${currentCost} ل.س`;
                    if (costElement.textContent !== newCostText) {
                        costElement.textContent = newCostText;
                    }
                }
                    
                    // تحديث الوقت المتبقي للجلسات المحددة
                    if (session.session_type === 'limited') {
                        // حساب الوقت المتبقي بناءً على الوقت المحدد الحالي
                        const timeRemainingSeconds = Math.max(0, (session.time_limit * 60) - elapsedSeconds);
                        const timeRemainingElement = document.querySelector(`.time-remaining[data-session-id="${session.id}"]`);
                        if (timeRemainingElement) {
                            const newRemainingText = this.formatTimeWithSeconds(
                                Math.floor(timeRemainingSeconds / 60), 
                                timeRemainingSeconds % 60
                            );
                            
                            if (timeRemainingElement.textContent !== newRemainingText) {
                                timeRemainingElement.textContent = newRemainingText;
                            }
                            
                            // تغيير لون النص عند اقتراب انتهاء الوقت
                            timeRemainingElement.classList.remove('warning', 'danger');
                            if (timeRemainingSeconds <= 300) { // 5 دقائق
                                timeRemainingElement.classList.add('warning');
                            }
                            if (timeRemainingSeconds <= 60) { // دقيقة واحدة
                                timeRemainingElement.classList.add('danger');
                            }
                            
                            // إزالة كلاس time-up إذا كان الوقت لم ينته بعد
                            if (timeRemainingSeconds > 0) {
                                const deviceCard = document.querySelector(`.device-card[data-device-id="${session.device_id}"]`);
                                if (deviceCard) {
                                    deviceCard.classList.remove('time-up');
                                }
                            }
                        }
                    }
                }
            });
            
            this.lastUpdateTime = currentTime;
        } finally {
            this.isUpdating = false;
        }
    }

    updateDevicesGrid() {
        const grid = document.getElementById('devicesGrid');
        
        // التحقق من وجود تغييرات قبل إعادة إنشاء العناصر
        const currentDeviceIds = Array.from(grid.children).map(card => 
            card.getAttribute('data-device-id')
        ).sort();
        
        const newDeviceIds = this.devices.map(device => device.id.toString()).sort();
        
        // إعادة إنشاء العناصر فقط إذا كان هناك تغييرات
        if (JSON.stringify(currentDeviceIds) !== JSON.stringify(newDeviceIds)) {
            grid.innerHTML = '';

            this.devices.forEach(device => {
                const card = this.createDeviceCard(device);
                grid.appendChild(card);
            });
        } else {
            // تحديث العناصر الموجودة فقط
            this.devices.forEach(device => {
                const existingCard = grid.querySelector(`[data-device-id="${device.id}"]`);
                if (existingCard) {
                    const newCard = this.createDeviceCard(device);
                    existingCard.replaceWith(newCard);
                }
            });
        }
    }

    updateSpecificDeviceCard(device) {
        const grid = document.getElementById('devicesGrid');
        const existingCard = grid.querySelector(`[data-device-id="${device.id}"]`);
        
        if (existingCard) {
            const newCard = this.createDeviceCard(device);
            existingCard.replaceWith(newCard);
        }
    }

    createDeviceCard(device) {
        const card = document.createElement('div');
        card.className = `device-card ${device.status}`;
        card.setAttribute('data-device-id', device.id);

        const session = this.sessions.find(s => s.device_id === device.id && s.is_active);
        const isOccupied = device.status === 'occupied' && session;
        
        let sessionInfo = '';
        if (isOccupied) {
            const startTime = new Date(session.start_time);
            const elapsedSeconds = Math.floor((new Date() - startTime) / 1000);
            const elapsedMinutes = Math.floor(elapsedSeconds / 60);
            const remainingSeconds = elapsedSeconds % 60;
            const elapsedTime = this.formatTimeWithSeconds(elapsedMinutes, remainingSeconds);
            const cost = session.current_cost || this.calculateCost(elapsedMinutes, session.game_mode);
            const gameModeText = session.game_mode === 'quad' ? `رباعي (${this.hourlyRates.quad} ل.س/ساعة)` : `زوجي (${this.hourlyRates.duo} ل.س/ساعة)`;
            
            // فحص انتهاء الوقت للجلسات المحددة
            let timeRemainingText = '';
            let timeUpClass = '';
            if (session.session_type === 'limited') {
                const timeRemaining = Math.max(0, session.time_limit - elapsedMinutes);
                const timeRemainingSeconds = Math.max(0, (session.time_limit * 60) - elapsedSeconds);
                timeRemainingText = `<p><strong>الوقت المتبقي:</strong> <span class="time-remaining" data-session-id="${session.id}">${this.formatTimeWithSeconds(Math.floor(timeRemainingSeconds / 60), timeRemainingSeconds % 60)}</span></p>`;
                
                // إضافة كلاس للتنبيه عند انتهاء الوقت
                if (timeRemaining <= 0) {
                    timeUpClass = 'time-up';
                }
            }
            
            sessionInfo = `
                <div class="device-info">
                    <p><strong>اللاعب:</strong> ${session.player_name}</p>
                    <p><strong>نمط اللعب:</strong> ${gameModeText}</p>
                    <p><strong>الوقت المنقضي:</strong> <span class="elapsed-time" data-session-id="${session.id}">${elapsedTime}</span></p>
                    <p><strong>نوع الجلسة:</strong> ${session.session_type === 'unlimited' ? 'وقت مفتوح' : 'وقت محدد'}</p>
                    ${timeRemainingText}
                    <p><strong>التكلفة الحالية:</strong> ${cost} ل.س</p>
                </div>
                <div class="device-actions">
                    <button class="btn btn-danger" onclick="gamingCenter.endSession(${session.id})">
                        <i class="fas fa-stop"></i>
                        إنهاء الجلسة
                    </button>
                </div>
            `;
        } else {
            sessionInfo = `
                <div class="device-info">
                    <p><strong>متاح للاستخدام</strong></p>
                    <p><strong>إجمالي وقت اللعب:</strong> ${this.formatTime(device.total_play_time || 0)}</p>
                    <p><strong>إجمالي الإيرادات:</strong> ${(device.total_revenue || 0).toLocaleString()} ل.س</p>
                </div>
                <div class="device-actions">
                    <button class="btn btn-primary" onclick="gamingCenter.showSessionModal()">
                        <i class="fas fa-play"></i>
                        بدء جلسة
                    </button>
                </div>
            `;
        }

        card.innerHTML = `
            <div class="device-header">
                <div class="device-name">${device.name}</div>
                <div class="device-status status-${device.status}">
                    ${isOccupied ? 'مشغول' : 'متاح'}
                </div>
            </div>
            ${sessionInfo}
        `;

        // إضافة كلاس التنبيه إذا انتهى الوقت
        if (isOccupied && session.session_type === 'limited') {
            const startTime = new Date(session.start_time);
            const elapsedSeconds = Math.floor((new Date() - startTime) / 1000);
            const elapsedMinutes = Math.floor(elapsedSeconds / 60);
            if (elapsedMinutes >= session.time_limit) {
                card.classList.add('time-up');
            }
        }

        return card;
    }

    updateStats() {
        const activeSessions = this.sessions.filter(s => s.is_active).length;
        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
        
        // حساب الوقت الإجمالي للجلسات النشطة اليوم
        const totalTime = this.sessions.reduce((total, session) => {
            const sessionDate = new Date(session.start_time);
            if (sessionDate >= todayStart && sessionDate < todayEnd) {
                if (session.is_active) {
                    const startTime = new Date(session.start_time);
                    const elapsedMinutes = Math.floor((new Date() - startTime) / (1000 * 60));
                    return total + elapsedMinutes;
                } else {
                    // حساب الوقت للجلسات المنتهية اليوم
                    const startTime = new Date(session.start_time);
                    const endTime = new Date(session.end_time);
                    const elapsedMinutes = Math.floor((endTime - startTime) / (1000 * 60));
                    return total + elapsedMinutes;
                }
            }
            return total;
        }, 0);
        
        // حساب الإيرادات التراكمية لليوم (الجلسات النشطة + المنتهية)
        const totalRevenue = this.sessions.reduce((total, session) => {
            const sessionDate = new Date(session.start_time);
            if (sessionDate >= todayStart && sessionDate < todayEnd) {
                if (session.is_active) {
                    const startTime = new Date(session.start_time);
                    const elapsedMinutes = Math.floor((new Date() - startTime) / (1000 * 60));
                    return total + this.calculateCost(elapsedMinutes, session.game_mode);
                } else {
                    // للجلسات المنتهية، استخدام التكلفة النهائية المحفوظة
                    return total + (session.final_cost || session.total_cost || 0);
                }
            }
            return total;
        }, 0);

        // تحديث النصوص فقط عند تغييرها
        const activeSessionsElement = document.getElementById('activeSessions');
        const totalTimeElement = document.getElementById('totalTime');
        const totalRevenueElement = document.getElementById('totalRevenue');
        
        if (activeSessionsElement.textContent !== activeSessions.toString()) {
            activeSessionsElement.textContent = activeSessions;
        }
        
        const formattedTime = this.formatTime(totalTime);
        if (totalTimeElement.textContent !== formattedTime) {
            totalTimeElement.textContent = formattedTime;
        }
        
        const formattedRevenue = totalRevenue.toLocaleString();
        if (totalRevenueElement.textContent !== formattedRevenue) {
            totalRevenueElement.textContent = formattedRevenue;
        }
    }

    updateStatsDisplay(stats) {
        document.getElementById('activeSessions').textContent = stats.active_sessions || 0;
        document.getElementById('totalTime').textContent = this.formatTime(stats.total_time_today || 0);
        document.getElementById('totalRevenue').textContent = (stats.total_revenue_today || 0).toLocaleString();
    }

    formatTime(minutes) {
        if (isNaN(minutes) || minutes < 0) return '0:00';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}:${mins.toString().padStart(2, '0')}`;
    }

    formatTimeWithSeconds(minutes, seconds) {
        if (isNaN(minutes) || minutes < 0) return '0:00:00';
        if (isNaN(seconds) || seconds < 0) seconds = 0;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}:${mins.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    resetSessionForm() {
        document.getElementById('sessionForm').reset();
        document.getElementById('timeLimitGroup').style.display = 'none';
    }

    setDefaultReportDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('reportDate').value = today;
    }

    async generateReport() {
        const selectedDate = document.getElementById('reportDate').value;
        if (!selectedDate) {
            notification.warning('يرجى اختيار تاريخ');
            return;
        }

        if (this.isOnline) {
            try {
                const response = await fetch(`${this.apiUrl}?action=get_daily_report&date=${selectedDate}`);
                const data = await response.json();
                this.displayReport(data);
            } catch (error) {
                console.error('خطأ في توليد التقرير:', error);
                this.generateLocalReport(selectedDate);
            }
        } else {
            this.generateLocalReport(selectedDate);
        }
    }

    generateLocalReport(selectedDate) {
        const reportDate = new Date(selectedDate);
        const dayStart = new Date(reportDate.getFullYear(), reportDate.getMonth(), reportDate.getDate());
        const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

        const daySessions = this.sessions.filter(session => {
            const sessionDate = new Date(session.start_time);
            return sessionDate >= dayStart && sessionDate < dayEnd;
        });

        this.displayReport({
            date: selectedDate,
            sessions: daySessions,
            stats: {
                total_sessions: daySessions.length,
                total_time: daySessions.reduce((total, session) => {
                    const startTime = new Date(session.start_time);
                    const endTime = session.is_active ? new Date() : new Date(session.end_time);
                    return total + Math.floor((endTime - startTime) / (1000 * 60));
                }, 0),
                total_revenue: daySessions.reduce((total, session) => {
                    if (session.is_active) {
                        const startTime = new Date(session.start_time);
                        const endTime = new Date();
                        const elapsedMinutes = Math.floor((endTime - startTime) / (1000 * 60));
                        return total + this.calculateCost(elapsedMinutes, session.game_mode);
                    } else {
                        // للجلسات المنتهية، استخدام التكلفة النهائية المحفوظة
                        return total + (session.final_cost || session.total_cost || 0);
                    }
                }, 0)
            }
        });
    }

    displayReport(data) {
        const resultsDiv = document.getElementById('reportResults');
        const exportBtn = document.getElementById('exportPDF');
        
        // حفظ بيانات التقرير الحالي
        this.currentReportData = data;
        
        if (data.sessions.length === 0) {
            resultsDiv.innerHTML = '<p>لا توجد جلسات في هذا التاريخ</p>';
            exportBtn.style.display = 'none';
            return;
        }

        let html = `
            <div class="report-summary">
                <h4>تقرير ${data.date}</h4>
                <p><strong>إجمالي الجلسات:</strong> ${data.stats.total_sessions}</p>
                <p><strong>إجمالي الوقت:</strong> ${this.formatTime(data.stats.total_time)}</p>
                <p><strong>إجمالي الإيرادات:</strong> ${data.stats.total_revenue.toLocaleString()} ل.س</p>
            </div>
        `;

        data.sessions.forEach(session => {
            const device = this.devices.find(d => d.id === session.device_id);
            const startTime = new Date(session.start_time);
            const endTime = session.is_active ? new Date() : new Date(session.end_time);
            const elapsedMinutes = Math.floor((endTime - startTime) / (1000 * 60));
            // استخدام التكلفة النهائية المحفوظة للجلسات المنتهية
            const cost = session.final_cost || this.calculateCost(elapsedMinutes, session.game_mode);
            const status = session.is_active ? 'نشطة' : 'منتهية';
            const gameModeText = session.game_mode === 'quad' ? `رباعي (${session.final_cost_rate || this.hourlyRates.quad} ل.س/ساعة)` : `زوجي (${session.final_cost_rate || this.hourlyRates.duo} ل.س/ساعة)`;

            // تنسيق التواريخ (ميلادي بالأرقام العادية)
            const startDate = new Date(session.start_time).toLocaleString('en-US', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
            
            const endDate = session.end_time ? 
                new Date(session.end_time).toLocaleString('en-US', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                }) : 'لم تنته بعد';

            html += `
                <div class="report-item">
                    <h4>${device ? device.name : 'جهاز غير معروف'} - ${session.player_name}</h4>
                    <p><strong>نمط اللعب:</strong> ${gameModeText}</p>
                    <p><strong>نوع الجلسة:</strong> ${session.session_type === 'unlimited' ? 'وقت مفتوح' : 'وقت محدد'}</p>
                    <p><strong>تاريخ البداية:</strong> ${startDate}</p>
                    <p><strong>تاريخ النهاية:</strong> ${endDate}</p>
                    <p><strong>الوقت:</strong> ${this.formatTime(elapsedMinutes)}</p>
                    <p><strong>التكلفة:</strong> ${cost} ل.س</p>
                    <p><strong>الحالة:</strong> ${status}</p>
                </div>
            `;
        });

        resultsDiv.innerHTML = html;
        exportBtn.style.display = 'inline-block';
        
        // إظهار زر تصدير HTML
        const htmlBtn = document.getElementById('exportHTML');
        if (htmlBtn) {
            htmlBtn.style.display = 'inline-block';
        }
    }

    saveLocalData() {
        const data = {
            devices: this.devices,
            sessions: this.sessions,
            currentUser: this.currentUser
        };
        localStorage.setItem('gamingCenterData', JSON.stringify(data));
    }

    // تم إزالة الدوال المكررة القديمة - تم استبدالها بدوال Toast الجديدة




    // دالة مساعدة لتحويل النصوص العربية إلى UTF-8
    convertToUTF8(text) {
        if (typeof text !== 'string') return text;
        
        try {
            // التحقق من وجود أحرف عربية
            if (/[\u0600-\u06FF]/.test(text)) {
                // تحويل إلى UTF-8
                return unescape(encodeURIComponent(text));
            }
            return text;
        } catch (e) {
            console.warn('خطأ في تحويل النص:', e);
            return text;
        }
    }

    // دالة مساعدة لتحويل مصفوفة من النصوص
    convertArrayToUTF8(array) {
        return array.map(item => {
            if (Array.isArray(item)) {
                return this.convertArrayToUTF8(item);
            }
            return this.convertToUTF8(item);
        });
    }

    // إضافة زر تصدير HTML كبديل
    addHTMLExportButton() {
        const reportFilters = document.querySelector('.report-filters');
        if (reportFilters && !document.getElementById('exportHTML')) {
            const htmlButton = document.createElement('button');
            htmlButton.id = 'exportHTML';
            htmlButton.className = 'btn btn-info';
            htmlButton.innerHTML = '<i class="fas fa-file-code"></i> تصدير HTML';
            htmlButton.style.display = 'none';
            htmlButton.addEventListener('click', () => this.exportToHTML());
            reportFilters.appendChild(htmlButton);
        }
    }

    // تصدير التقرير إلى HTML مع دعم كامل للعربية
    exportToHTML() {
        if (!this.currentReportData) {
            notification.warning('لا توجد بيانات تقرير للتصدير');
            return;
        }

        const { date, sessions, stats } = this.currentReportData;
        
        let html = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>تقرير صالة الألعاب - ${date}</title>
    <style>
        body {
            font-family: 'Cairo', Arial, sans-serif;
            direction: rtl;
            margin: 20px;
            background: #f5f5f5;
        }
        .report-container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            max-width: 1000px;
            margin: 0 auto;
        }
        .report-header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 3px solid #667eea;
            padding-bottom: 20px;
        }
        .report-title {
            font-size: 2em;
            color: #333;
            margin-bottom: 10px;
        }
        .report-date {
            font-size: 1.2em;
            color: #666;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .stat-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
        }
        .stat-value {
            font-size: 2em;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .stat-label {
            font-size: 1em;
            opacity: 0.9;
        }
        .sessions-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        .sessions-table th,
        .sessions-table td {
            padding: 12px;
            text-align: center;
            border: 1px solid #ddd;
        }
        .sessions-table th {
            background: #667eea;
            color: white;
            font-weight: bold;
        }
        .sessions-table tr:nth-child(even) {
            background: #f9f9f9;
        }
        .sessions-table tr:hover {
            background: #f0f0f0;
        }
        .status-active {
            color: #28a745;
            font-weight: bold;
        }
        .status-ended {
            color: #dc3545;
            font-weight: bold;
        }
        .report-footer {
            margin-top: 30px;
            text-align: center;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 20px;
        }
        @media print {
            body { background: white; }
            .report-container { box-shadow: none; }
        }
    </style>
</head>
<body>
    <div class="report-container">
        <div class="report-header">
            <h1 class="report-title">تقرير صالة الألعاب - PlayStation 4</h1>
            <p class="report-date">التاريخ: ${date}</p>
        </div>
        
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value">${stats.total_sessions}</div>
                <div class="stat-label">إجمالي الجلسات</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${this.formatTime(stats.total_time)}</div>
                <div class="stat-label">إجمالي الوقت</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.total_revenue.toLocaleString()} ل.س</div>
                <div class="stat-label">إجمالي الإيرادات</div>
            </div>
        </div>
        
        <h2>تفاصيل الجلسات</h2>
        <table class="sessions-table">
            <thead>
                <tr>
                    <th>الجهاز</th>
                    <th>اللاعب</th>
                    <th>نمط اللعب</th>
                    <th>نوع الجلسة</th>
                    <th>تاريخ البداية</th>
                    <th>تاريخ النهاية</th>
                    <th>الوقت</th>
                    <th>التكلفة</th>
                    <th>الحالة</th>
                </tr>
            </thead>
            <tbody>
        `;

        sessions.forEach(session => {
            const device = this.devices.find(d => d.id === session.device_id);
            const startTime = new Date(session.start_time);
            const endTime = session.is_active ? new Date() : new Date(session.end_time);
            const elapsedMinutes = Math.floor((endTime - startTime) / (1000 * 60));
            // استخدام التكلفة النهائية المحفوظة للجلسات المنتهية
            const cost = session.final_cost || this.calculateCost(elapsedMinutes, session.game_mode);
            const status = session.is_active ? 'نشطة' : 'منتهية';
            const statusClass = session.is_active ? 'status-active' : 'status-ended';
            const gameModeText = session.game_mode === 'quad' ? `رباعي (${session.final_cost_rate || this.hourlyRates.quad} ل.س/ساعة)` : `زوجي (${session.final_cost_rate || this.hourlyRates.duo} ل.س/ساعة)`;
            
            // تنسيق التواريخ (ميلادي بالأرقام العادية)
            const startDate = new Date(session.start_time).toLocaleString('en-US', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
            
            const endDate = session.end_time ? 
                new Date(session.end_time).toLocaleString('en-US', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                }) : 'لم تنته بعد';
            
            html += `
                <tr>
                    <td>${device ? device.name : 'غير معروف'}</td>
                    <td>${session.player_name}</td>
                    <td>${gameModeText}</td>
                    <td>${session.session_type === 'unlimited' ? 'وقت مفتوح' : 'وقت محدد'}</td>
                    <td>${startDate}</td>
                    <td>${endDate}</td>
                    <td>${this.formatTime(elapsedMinutes)}</td>
                    <td>${cost} ل.س</td>
                    <td class="${statusClass}">${status}</td>
                </tr>
            `;
        });

        html += `
            </tbody>
        </table>
        
        <div class="report-footer">
            <p>تم إنشاء التقرير بواسطة نظام إدارة صالة الألعاب</p>
            <p>تاريخ الإنشاء: ${new Date().toLocaleString('en-US', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            })}</p>
        </div>
    </div>
    
    <script>
        // إضافة إمكانية الطباعة
        window.addEventListener('load', function() {
            // طباعة تلقائية عند فتح الملف
            // window.print();
        });
    </script>
</body>
</html>`;

        // إنشاء ملف HTML وتحميله
        const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `تقرير_صالة_الألعاب_${date}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    exportToPDF() {
        if (!this.currentReportData) {
            notification.warning('لا توجد بيانات تقرير للتصدير');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');

        // إعداد الخط
        doc.setFont('helvetica', 'normal');

        // دالة لإضافة النص مع معالجة خاصة للعربية
        const addText = (text, x, y, options = {}) => {
            try {
                // تحويل النص إلى Base64 للعرض الصحيح
                const base64Text = btoa(unescape(encodeURIComponent(text)));
                doc.text(atob(base64Text), x, y, options);
            } catch (e) {
                // في حالة فشل التحويل، استخدم النص كما هو
                doc.text(text, x, y, options);
            }
        };

        // دالة لإضافة النص الإنجليزي فقط
        const addEnglishText = (text, x, y, options = {}) => {
            doc.text(text, x, y, options);
        };

        // العنوان الرئيسي (بالإنجليزية لتجنب مشاكل العرض)
        doc.setFontSize(20);
        addEnglishText('Gaming Center Report - PlayStation 4', 105, 20, { align: 'center' });
        
        // تاريخ التقرير
        doc.setFontSize(14);
        addEnglishText(`Date: ${this.currentReportData.date}`, 105, 35, { align: 'center' });
        
        // الإحصائيات
        doc.setFontSize(12);
        addEnglishText(`Total Sessions: ${this.currentReportData.stats.total_sessions}`, 20, 55);
        addEnglishText(`Total Time: ${this.formatTime(this.currentReportData.stats.total_time)}`, 20, 65);
        addEnglishText(`Total Revenue: ${this.currentReportData.stats.total_revenue.toLocaleString()} SYP`, 20, 75);

        // جدول الجلسات
        if (this.currentReportData.sessions.length > 0) {
            const tableData = this.currentReportData.sessions.map(session => {
                const device = this.devices.find(d => d.id === session.device_id);
                const startTime = new Date(session.start_time);
                const endTime = session.is_active ? new Date() : new Date(session.end_time);
                const elapsedMinutes = Math.floor((endTime - startTime) / (1000 * 60));
                // استخدام التكلفة النهائية المحفوظة للجلسات المنتهية
                const cost = session.final_cost || this.calculateCost(elapsedMinutes, session.game_mode);
                const status = session.is_active ? 'Active' : 'Ended';
                const gameModeText = session.game_mode === 'quad' ? `Quad (${session.final_cost_rate || this.hourlyRates.quad} SYP/hour)` : `Duo (${session.final_cost_rate || this.hourlyRates.duo} SYP/hour)`;
                
                // تنسيق التواريخ (ميلادي بالأرقام العادية)
                const startDate = new Date(session.start_time).toLocaleString('en-US', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                });
                
                const endDate = session.end_time ? 
                    new Date(session.end_time).toLocaleString('en-US', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                    }) : 'Not ended yet';
                
                return [
                    device ? device.name : 'Unknown',
                    session.player_name,
                    gameModeText,
                    session.session_type === 'unlimited' ? 'Unlimited' : 'Limited',
                    startDate,
                    endDate,
                    this.formatTime(elapsedMinutes),
                    `${cost} SYP`,
                    status
                ];
            });

            // رؤوس الجدول بالإنجليزية
            const headers = ['Device', 'Player', 'Game Mode', 'Session Type', 'Start Date', 'End Date', 'Time', 'Cost', 'Status'];

            doc.autoTable({
                head: [headers],
                body: tableData,
                startY: 90,
                styles: {
                    fontSize: 10,
                    cellPadding: 3,
                    halign: 'center',
                    font: 'helvetica'
                },
                headStyles: {
                    fillColor: [102, 126, 234],
                    textColor: 255,
                    fontStyle: 'bold'
                },
                alternateRowStyles: {
                    fillColor: [245, 245, 245]
                },
                didDrawPage: function (data) {
                    // إضافة ترقيم الصفحات
                    const pageNumber = doc.internal.getNumberOfPages();
                    const pageSize = doc.internal.pageSize;
                    const pageHeight = pageSize.height || pageSize.getHeight();
                    doc.setFontSize(8);
                    addEnglishText(`Page ${data.pageNumber} of ${pageNumber}`, pageSize.width - 20, pageHeight - 10, { align: 'right' });
                }
            });
        }

        // تذييل التقرير
        const pageHeight = doc.internal.pageSize.height;
        doc.setFontSize(10);
        addEnglishText('Generated by Gaming Center Management System', 105, pageHeight - 20, { align: 'center' });
        addEnglishText(`Generated on: ${new Date().toLocaleString('en-US')}`, 105, pageHeight - 10, { align: 'center' });

        // حفظ الملف
        const fileName = `Gaming_Center_Report_${this.currentReportData.date}.pdf`;
        
        // إضافة معلومات PDF
        doc.setProperties({
            title: 'Gaming Center Report',
            subject: 'Daily Gaming Center Report',
            author: 'Gaming Center Management System',
            creator: 'Gaming Center Management System',
            producer: 'jsPDF',
            creationDate: new Date()
        });
        
        doc.save(fileName);
    }

    // دوال إدارة الثيم
    loadTheme() {
        const savedTheme = localStorage.getItem('gamingCenterTheme');
        if (savedTheme) {
            this.currentTheme = savedTheme;
            this.applyTheme();
        }
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme();
        this.saveTheme();
    }

    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        this.updateThemeIcon();
    }

    updateThemeIcon() {
        const themeIcon = document.querySelector('#themeToggleBtn i');
        if (themeIcon) {
            if (this.currentTheme === 'dark') {
                themeIcon.className = 'fas fa-sun';
                themeIcon.parentElement.title = 'التبديل للثيم الفاتح';
            } else {
                themeIcon.className = 'fas fa-moon';
                themeIcon.parentElement.title = 'التبديل للثيم الليلي';
            }
        }
    }

    saveTheme() {
        localStorage.setItem('gamingCenterTheme', this.currentTheme);
    }

    // دوال إدارة الأجهزة
    async addDevice() {
        const deviceName = document.getElementById('newDeviceName').value.trim();
        
        if (!deviceName) {
            notification.warning('يرجى إدخال اسم الجهاز');
            return;
        }

        if (this.isOnline) {
            try {
                const response = await fetch(`${this.apiUrl}?action=add_device`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ device_name: deviceName })
                });

                const result = await response.json();
                
                if (result.success) {
                    document.getElementById('newDeviceName').value = '';
                    await this.loadData();
                    this.loadDevicesList();
                    notification.success('تم إضافة الجهاز بنجاح');
                } else {
                    notification.error(result.message || 'فشل في إضافة الجهاز');
                }
            } catch (error) {
                console.error('خطأ في إضافة الجهاز:', error);
                notification.error('خطأ في الاتصال بالخادم');
            }
        } else {
            // إضافة محلية
            const newDevice = {
                id: Date.now(),
                name: deviceName,
                status: 'available',
                total_play_time: 0,
                total_revenue: 0
            };
            
            this.devices.push(newDevice);
            document.getElementById('newDeviceName').value = '';
            
            // إضافة البطاقة الجديدة فقط بدلاً من إعادة رسم الصفحة
            const grid = document.getElementById('devicesGrid');
            const newCard = this.createDeviceCard(newDevice);
            grid.appendChild(newCard);
            
            this.loadDevicesList();
            this.saveLocalData();
            notification.success('تم إضافة الجهاز بنجاح');
        }
    }

    async deleteDevice(deviceId) {
        if (confirm('هل أنت متأكد من حذف هذا الجهاز؟')) {
            this.performDeleteDevice(deviceId);
        }
    }

    async performDeleteDevice(deviceId) {

        if (this.isOnline) {
            try {
                const response = await fetch(`${this.apiUrl}?action=delete_device`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ device_id: deviceId })
                });

                const result = await response.json();
                
                if (result.success) {
                    await this.loadData();
                    this.loadDevicesList();
                    notification.success('تم حذف الجهاز بنجاح');
                } else {
                    notification.error(result.message || 'فشل في حذف الجهاز');
                }
            } catch (error) {
                console.error('خطأ في حذف الجهاز:', error);
                notification.error('خطأ في الاتصال بالخادم');
            }
        } else {
            // حذف محلي
            const device = this.devices.find(d => d.id === deviceId);
            if (device && device.status === 'available') {
                this.devices = this.devices.filter(d => d.id !== deviceId);
                
                // حذف البطاقة المحددة فقط بدلاً من إعادة رسم الصفحة
                const grid = document.getElementById('devicesGrid');
                const cardToRemove = grid.querySelector(`[data-device-id="${deviceId}"]`);
                if (cardToRemove) {
                    cardToRemove.remove();
                }
                
                this.loadDevicesList();
                this.saveLocalData();
                notification.success('تم حذف الجهاز بنجاح');
            } else {
                notification.warning('لا يمكن حذف الجهاز لوجود جلسات نشطة');
            }
        }
    }

    loadDevicesList() {
        const devicesList = document.getElementById('devicesList');
        devicesList.innerHTML = '';

        this.devices.forEach(device => {
            const deviceItem = document.createElement('div');
            deviceItem.className = 'device-item';
            deviceItem.innerHTML = `
                <div class="device-item-info">
                    <h4>${device.name}</h4>
                    <p>الحالة: <span class="status-${device.status}">${device.status === 'available' ? 'متاح' : 'مشغول'}</span></p>
                    <p>إجمالي وقت اللعب: ${this.formatTime(device.total_play_time || 0)}</p>
                    <p>إجمالي الإيرادات: ${(device.total_revenue || 0).toLocaleString()} ل.س</p>
                </div>
                <div class="device-item-actions">
                    ${device.status === 'available' ? 
                        `<button class="btn btn-danger btn-sm" onclick="gamingCenter.deleteDevice(${device.id})">
                            <i class="fas fa-trash"></i>
                            حذف
                        </button>` : 
                        '<span class="text-muted">لا يمكن حذف جهاز مشغول</span>'
                    }
                </div>
            `;
            devicesList.appendChild(deviceItem);
        });
    }

    loadPricingSettings() {
        // تحميل الأسعار الحالية
        document.getElementById('duoPrice').value = this.hourlyRates.duo;
        document.getElementById('quadPrice').value = this.hourlyRates.quad;
        
        // تحديث خيارات نمط اللعب
        this.updateGameModeOptions();
    }

    updatePricing(gameMode) {
        const priceInput = document.getElementById(`${gameMode}Price`);
        const newPrice = parseInt(priceInput.value);
        
        if (!newPrice || newPrice < 1000 || newPrice > 50000) {
            notification.warning('يرجى إدخال سعر صحيح بين 1000 و 50000 ليرة سورية');
            return;
        }

        // تحديث السعر
        this.hourlyRates[gameMode] = newPrice;
        
        // حفظ الأسعار في التخزين المحلي
        localStorage.setItem('gamingCenterPricing', JSON.stringify(this.hourlyRates));
        
        // تحديث الجلسات النشطة فقط (بدون تغيير الإيرادات السابقة)
        this.sessions.forEach(session => {
            if (session.is_active) {
                // إعادة حساب التكلفة للجلسات النشطة فقط
                const startTime = new Date(session.start_time);
                const elapsedMinutes = Math.floor((new Date() - startTime) / (1000 * 60));
                // تحديث التكلفة الحالية للجلسات النشطة فقط
                session.current_cost = this.calculateCost(elapsedMinutes, session.game_mode);
            } else if (session.final_cost) {
                // للجلسات المنتهية، نستخدم التكلفة النهائية المحفوظة
                session.total_cost = session.final_cost;
            }
        });
        
        // تحديث واجهة المستخدم
        this.updateUI();
        
        // تحديث نصوص الأسعار في قائمة اختيار نمط اللعب
        this.updateGameModeOptions();
        
        notification.success(`تم تحديث سعر النمط ${gameMode === 'duo' ? 'الزوجي' : 'الرباعي'} إلى ${newPrice} ليرة سورية`);
    }

    updateGameModeOptions() {
        // تحديث خيارات نمط اللعب في قائمة الاختيار
        const gameModeSelect = document.getElementById('gameMode');
        if (gameModeSelect) {
            const duoOption = gameModeSelect.querySelector('option[value="duo"]');
            const quadOption = gameModeSelect.querySelector('option[value="quad"]');
            
            if (duoOption) {
                duoOption.textContent = `زوجي (${this.hourlyRates.duo} ل.س/ساعة)`;
            }
            if (quadOption) {
                quadOption.textContent = `رباعي (${this.hourlyRates.quad} ل.س/ساعة)`;
            }
        }
    }

    showClearReportsModal() {
        // إخفاء نافذة الإدارة
        this.hideDevicesModal();
        
        // إظهار نافذة تأكيد مسح التقارير
        document.getElementById('clearReportsModal').classList.add('show');
        
        // مسح حقل كلمة المرور
        document.getElementById('clearReportsPassword').value = '';
    }

    hideClearReportsModal() {
        document.getElementById('clearReportsModal').classList.remove('show');
    }

    confirmClearReports() {
        const password = document.getElementById('clearReportsPassword').value;
        
        if (password !== this.adminPassword) {
            notification.error('كلمة المرور غير صحيحة');
            return;
        }

        // تنفيذ عملية المسح مباشرة بعد التحقق من كلمة المرور
        this.performClearReports();
    }

    performClearReports() {
        // مسح جميع البيانات
        this.clearAllReports();
        
        // إخفاء النافذة
        this.hideClearReportsModal();
        
        // إعادة تحميل البيانات وتحديث الواجهة
        this.loadData();
        this.updateDevicesGrid();
        this.updateStats();
        
        notification.success('تم مسح جميع التقارير المالية والجلسات السابقة بنجاح');
    }

    clearAllReports() {
        // مسح جميع الجلسات
        this.sessions = [];
        
        // إعادة تعيين إحصائيات الأجهزة
        this.devices.forEach(device => {
            device.total_play_time = 0;
            device.total_revenue = 0;
        });
        
        // إيقاف جميع الجلسات النشطة
        this.sessions.forEach(session => {
            if (session.is_active) {
                const device = this.devices.find(d => d.id === session.device_id);
                if (device) {
                    device.status = 'available';
                }
            }
        });
        
        // مسح البيانات المحفوظة
        localStorage.removeItem('gamingCenterData');
        
        // حفظ البيانات الجديدة
        this.saveLocalData();
        
        // تحديث واجهة المستخدم
        this.updateUI();
        
        // إعادة تعيين حالة المصادقة
        this.isAdminAuthenticated = false;
    }
}

// تهيئة التطبيق
const gamingCenter = new GamingCenterManager();
