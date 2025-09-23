// إدارة صالة الألعاب - PlayStation 4 (محسن مع SQL)
class GamingCenterManager {
    constructor() {
        this.devices = [];
        this.sessions = [];
        this.currentUser = null;
        this.hourlyRate = 6000; // 6000 ليرة سورية للساعة
        this.timers = new Map();
        this.apiUrl = 'api.php';
        this.isOnline = true;
        this.currentReportData = null;
        this.currentTheme = 'light'; // إضافة متغير الثيم الحالي
        
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

        // نافذة انتهاء الوقت
        document.getElementById('stopSession').addEventListener('click', () => {
            this.stopSession();
        });

        document.getElementById('extendTime').addEventListener('click', () => {
            this.extendSession();
        });

        document.getElementById('switchToUnlimited').addEventListener('click', () => {
            this.switchToUnlimited();
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
                this.hideAllModals();
            }
        });

        // تحديث البيانات كل 30 ثانية
        setInterval(() => {
            if (this.currentUser) {
                this.loadData();
            }
        }, 30000);
    }

    async loadData() {
        if (this.isOnline) {
            await this.loadDevices();
            await this.loadActiveSessions();
            await this.loadStats();
        } else {
            this.loadLocalData();
        }
        this.updateUI();
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
                this.sessions = await response.json();
            }
        } catch (error) {
            console.error('خطأ في تحميل الجلسات النشطة:', error);
            this.isOnline = false;
        }
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
                    alert(result.message || 'اسم المستخدم أو كلمة المرور غير صحيحة');
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
            alert('اسم المستخدم أو كلمة المرور غير صحيحة');
        }
    }

    handleLogout() {
        this.currentUser = null;
        this.showLoginScreen();
        this.timers.forEach(timer => clearInterval(timer));
        this.timers.clear();
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

    hideAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('show');
        });
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
        const sessionType = document.getElementById('sessionType').value;
        const timeLimit = parseInt(document.getElementById('timeLimit').value) || null;

        if (!deviceId || !playerName || !sessionType) {
            alert('يرجى ملء جميع الحقول المطلوبة');
            return;
        }

        if (sessionType === 'limited' && (!timeLimit || timeLimit <= 0)) {
            alert('يرجى إدخال مدة صحيحة للوقت المحدد');
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
                        time_limit: timeLimit
                    })
                });

                const result = await response.json();
                
                if (result.success) {
                    this.hideSessionModal();
                    await this.loadData();
                    alert(`تم بدء الجلسة بنجاح للاعب ${playerName}`);
                } else {
                    alert(result.message || 'فشل في بدء الجلسة');
                }
            } catch (error) {
                console.error('خطأ في بدء الجلسة:', error);
                this.isOnline = false;
                this.startLocalSession(deviceId, playerName, sessionType, timeLimit);
            }
        } else {
            this.startLocalSession(deviceId, playerName, sessionType, timeLimit);
        }
    }

    startLocalSession(deviceId, playerName, sessionType, timeLimit) {
        const device = this.devices.find(d => d.id === deviceId);
        if (device.status !== 'available') {
            alert('هذا الجهاز غير متاح حالياً');
            return;
        }

        const session = {
            id: Date.now(),
            device_id: deviceId,
            player_name: playerName,
            session_type: sessionType,
            time_limit: timeLimit,
            start_time: new Date().toISOString(),
            end_time: null,
            is_active: true,
            total_cost: 0
        };

        this.sessions.push(session);
        device.status = 'occupied';

        this.hideSessionModal();
        this.updateUI();
        this.saveLocalData();
        alert(`تم بدء الجلسة بنجاح للاعب ${playerName}`);
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
                    alert(`انتهت الجلسة. التكلفة: ${result.total_cost} ليرة سورية`);
                } else {
                    alert(result.message || 'فشل في إنهاء الجلسة');
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
        session.total_cost = this.calculateCost(elapsedMinutes);

        device.status = 'available';
        device.total_play_time += elapsedMinutes;
        device.total_revenue += session.total_cost;

        this.updateUI();
        this.saveLocalData();
        alert(`انتهت الجلسة. التكلفة: ${session.total_cost} ليرة سورية`);
    }

    calculateCost(minutes) {
        const hours = minutes / 60;
        return Math.ceil(hours * this.hourlyRate);
    }

    updateUI() {
        this.updateDevicesGrid();
        if (!this.isOnline) {
            this.updateStats();
        }
    }

    updateDevicesGrid() {
        const grid = document.getElementById('devicesGrid');
        grid.innerHTML = '';

        this.devices.forEach(device => {
            const card = this.createDeviceCard(device);
            grid.appendChild(card);
        });
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
            const elapsedMinutes = Math.floor((new Date() - startTime) / (1000 * 60));
            const elapsedTime = this.formatTime(elapsedMinutes);
            const cost = this.calculateCost(elapsedMinutes);
            
            sessionInfo = `
                <div class="device-info">
                    <p><strong>اللاعب:</strong> ${session.player_name}</p>
                    <p><strong>الوقت المنقضي:</strong> ${elapsedTime}</p>
                    <p><strong>نوع الجلسة:</strong> ${session.session_type === 'unlimited' ? 'وقت مفتوح' : 'وقت محدد'}</p>
                    ${session.session_type === 'limited' ? `<p><strong>الوقت المتبقي:</strong> ${Math.max(0, session.time_limit - elapsedMinutes)} دقيقة</p>` : ''}
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
                    return total + this.calculateCost(elapsedMinutes);
                } else {
                    // استخدام التكلفة المحسوبة مسبقاً للجلسات المنتهية
                    return total + (session.total_cost || 0);
                }
            }
            return total;
        }, 0);

        document.getElementById('activeSessions').textContent = activeSessions;
        document.getElementById('totalTime').textContent = this.formatTime(totalTime);
        document.getElementById('totalRevenue').textContent = totalRevenue.toLocaleString();
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
            alert('يرجى اختيار تاريخ');
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
                    const startTime = new Date(session.start_time);
                    const endTime = session.is_active ? new Date() : new Date(session.end_time);
                    const elapsedMinutes = Math.floor((endTime - startTime) / (1000 * 60));
                    return total + this.calculateCost(elapsedMinutes);
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
            const cost = this.calculateCost(elapsedMinutes);
            const status = session.is_active ? 'نشطة' : 'منتهية';

            html += `
                <div class="report-item">
                    <h4>${device ? device.name : 'جهاز غير معروف'} - ${session.player_name}</h4>
                    <p><strong>نوع الجلسة:</strong> ${session.session_type === 'unlimited' ? 'وقت مفتوح' : 'وقت محدد'}</p>
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

    // دوال إضافية للتعامل مع انتهاء الوقت
    stopSession() {
        const activeSession = this.getActiveSessionFromTimeUp();
        if (activeSession) {
            this.endSession(activeSession.id);
            this.hideAllModals();
        }
    }

    async extendSession() {
        const activeSession = this.getActiveSessionFromTimeUp();
        if (activeSession) {
            const extension = prompt('كم دقيقة إضافية تريد إضافة؟', '30');
            if (extension && !isNaN(extension) && extension > 0) {
                if (this.isOnline) {
                    try {
                        const response = await fetch(`${this.apiUrl}?action=extend_session`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                session_id: activeSession.id,
                                additional_minutes: parseInt(extension)
                            })
                        });

                        const result = await response.json();
                        if (result.success) {
                            this.hideAllModals();
                            alert(`تم تمديد الوقت بمقدار ${extension} دقيقة`);
                        } else {
                            alert(result.message || 'فشل في تمديد الوقت');
                        }
                    } catch (error) {
                        console.error('خطأ في تمديد الوقت:', error);
                        alert('خطأ في الاتصال بالخادم');
                    }
                } else {
                    activeSession.time_limit += parseInt(extension);
                    this.hideAllModals();
                    alert(`تم تمديد الوقت بمقدار ${extension} دقيقة`);
                }
            }
        }
    }

    async switchToUnlimited() {
        const activeSession = this.getActiveSessionFromTimeUp();
        if (activeSession) {
            if (this.isOnline) {
                try {
                    const response = await fetch(`${this.apiUrl}?action=switch_to_unlimited`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            session_id: activeSession.id
                        })
                    });

                    const result = await response.json();
                    if (result.success) {
                        this.hideAllModals();
                        alert('تم التحويل إلى وقت مفتوح');
                    } else {
                        alert(result.message || 'فشل في التحويل');
                    }
                } catch (error) {
                    console.error('خطأ في التحويل:', error);
                    alert('خطأ في الاتصال بالخادم');
                }
            } else {
                activeSession.session_type = 'unlimited';
                activeSession.time_limit = null;
                this.hideAllModals();
                alert('تم التحويل إلى وقت مفتوح');
            }
        }
    }

    getActiveSessionFromTimeUp() {
        const timeUpDevice = document.getElementById('timeUpDevice').textContent;
        const device = this.devices.find(d => d.name === timeUpDevice);
        return device ? this.sessions.find(s => s.device_id === device.id && s.is_active) : null;
    }

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
            alert('لا توجد بيانات تقرير للتصدير');
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
                    <th>نوع الجلسة</th>
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
            const cost = this.calculateCost(elapsedMinutes);
            const status = session.is_active ? 'نشطة' : 'منتهية';
            const statusClass = session.is_active ? 'status-active' : 'status-ended';
            
            html += `
                <tr>
                    <td>${device ? device.name : 'غير معروف'}</td>
                    <td>${session.player_name}</td>
                    <td>${session.session_type === 'unlimited' ? 'وقت مفتوح' : 'وقت محدد'}</td>
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
            <p>تاريخ الإنشاء: ${new Date().toLocaleString('ar-SA')}</p>
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
            alert('لا توجد بيانات تقرير للتصدير');
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
                const cost = this.calculateCost(elapsedMinutes);
                const status = session.is_active ? 'Active' : 'Ended';
                
                return [
                    device ? device.name : 'Unknown',
                    session.player_name,
                    session.session_type === 'unlimited' ? 'Unlimited' : 'Limited',
                    this.formatTime(elapsedMinutes),
                    `${cost} SYP`,
                    status
                ];
            });

            // رؤوس الجدول بالإنجليزية
            const headers = ['Device', 'Player', 'Session Type', 'Time', 'Cost', 'Status'];

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
}

// تهيئة التطبيق
const gamingCenter = new GamingCenterManager();
