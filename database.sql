-- قاعدة بيانات صالة الألعاب
CREATE DATABASE IF NOT EXISTS gaming_center;
USE gaming_center;

-- جدول الأجهزة
CREATE TABLE IF NOT EXISTS devices (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    status ENUM('available', 'occupied') DEFAULT 'available',
    total_play_time INT DEFAULT 0,
    total_revenue DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- جدول الجلسات
CREATE TABLE IF NOT EXISTS sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    device_id INT NOT NULL,
    player_name VARCHAR(100) NOT NULL,
    session_type ENUM('unlimited', 'limited') NOT NULL,
    time_limit INT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    total_cost DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
);

-- جدول المستخدمين
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'user') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- جدول الإعدادات
CREATE TABLE IF NOT EXISTS settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(50) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- جدول الإحصائيات اليومية
CREATE TABLE IF NOT EXISTS daily_stats (
    id INT PRIMARY KEY AUTO_INCREMENT,
    date DATE UNIQUE NOT NULL,
    total_sessions INT DEFAULT 0,
    total_time INT DEFAULT 0,
    total_revenue DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- إدراج البيانات الأولية
INSERT INTO devices (id, name) VALUES 
(1, 'PS4 #1'),
(2, 'PS4 #2'),
(3, 'PS4 #3'),
(4, 'PS4 #4'),
(5, 'PS4 #5'),
(6, 'PS4 #6');

INSERT INTO users (username, password, role) VALUES 
('admin', 'admin123', 'admin');

INSERT INTO settings (setting_key, setting_value) VALUES 
('hourly_rate', '6000'),
('currency', 'ل.س');

-- إجراءات مخزنة مفيدة
DELIMITER //

-- إجراء لبدء جلسة جديدة
CREATE PROCEDURE StartSession(
    IN p_device_id INT,
    IN p_player_name VARCHAR(100),
    IN p_session_type ENUM('unlimited', 'limited'),
    IN p_time_limit INT
)
BEGIN
    DECLARE device_status VARCHAR(20);
    
    -- التحقق من حالة الجهاز
    SELECT status INTO device_status FROM devices WHERE id = p_device_id;
    
    IF device_status = 'available' THEN
        -- بدء الجلسة
        INSERT INTO sessions (device_id, player_name, session_type, time_limit, start_time, is_active)
        VALUES (p_device_id, p_player_name, p_session_type, p_time_limit, NOW(), TRUE);
        
        -- تحديث حالة الجهاز
        UPDATE devices SET status = 'occupied' WHERE id = p_device_id;
        
        SELECT LAST_INSERT_ID() as session_id;
    ELSE
        SELECT -1 as session_id, 'الجهاز غير متاح' as message;
    END IF;
END //

-- إجراء لإنهاء الجلسة
CREATE PROCEDURE EndSession(IN p_session_id INT)
BEGIN
    DECLARE v_device_id INT;
    DECLARE v_start_time TIMESTAMP;
    DECLARE v_elapsed_minutes INT;
    DECLARE v_hourly_rate DECIMAL(10,2);
    DECLARE v_total_cost DECIMAL(10,2);
    
    -- الحصول على بيانات الجلسة
    SELECT device_id, start_time INTO v_device_id, v_start_time 
    FROM sessions WHERE id = p_session_id AND is_active = TRUE;
    
    IF v_device_id IS NOT NULL THEN
        -- حساب الوقت المنقضي
        SET v_elapsed_minutes = TIMESTAMPDIFF(MINUTE, v_start_time, NOW());
        
        -- الحصول على سعر الساعة
        SELECT CAST(setting_value AS DECIMAL(10,2)) INTO v_hourly_rate 
        FROM settings WHERE setting_key = 'hourly_rate';
        
        -- حساب التكلفة
        SET v_total_cost = CEIL((v_elapsed_minutes / 60.0) * v_hourly_rate);
        
        -- إنهاء الجلسة
        UPDATE sessions 
        SET end_time = NOW(), is_active = FALSE, total_cost = v_total_cost
        WHERE id = p_session_id;
        
        -- تحديث إحصائيات الجهاز
        UPDATE devices 
        SET status = 'available',
            total_play_time = total_play_time + v_elapsed_minutes,
            total_revenue = total_revenue + v_total_cost
        WHERE id = v_device_id;
        
        SELECT v_total_cost as total_cost, v_elapsed_minutes as elapsed_minutes;
    ELSE
        SELECT -1 as total_cost, 'الجلسة غير موجودة أو غير نشطة' as message;
    END IF;
END //

-- إجراء للحصول على الجلسات النشطة
CREATE PROCEDURE GetActiveSessions()
BEGIN
    SELECT 
        s.id,
        s.device_id,
        d.name as device_name,
        s.player_name,
        s.session_type,
        s.time_limit,
        s.start_time,
        TIMESTAMPDIFF(MINUTE, s.start_time, NOW()) as elapsed_minutes,
        CASE 
            WHEN s.session_type = 'limited' THEN GREATEST(0, s.time_limit - TIMESTAMPDIFF(MINUTE, s.start_time, NOW()))
            ELSE NULL
        END as remaining_minutes,
        CEIL((TIMESTAMPDIFF(MINUTE, s.start_time, NOW()) / 60.0) * 
             (SELECT CAST(setting_value AS DECIMAL(10,2)) FROM settings WHERE setting_key = 'hourly_rate')) as current_cost
    FROM sessions s
    JOIN devices d ON s.device_id = d.id
    WHERE s.is_active = TRUE;
END //

-- إجراء للحصول على تقرير يومي
CREATE PROCEDURE GetDailyReport(IN p_date DATE)
BEGIN
    SELECT 
        s.id,
        d.name as device_name,
        s.player_name,
        s.session_type,
        s.start_time,
        s.end_time,
        CASE 
            WHEN s.is_active = TRUE THEN TIMESTAMPDIFF(MINUTE, s.start_time, NOW())
            ELSE TIMESTAMPDIFF(MINUTE, s.start_time, s.end_time)
        END as duration_minutes,
        s.total_cost,
        s.is_active
    FROM sessions s
    JOIN devices d ON s.device_id = d.id
    WHERE DATE(s.start_time) = p_date
    ORDER BY s.start_time;
END //

-- إجراء للحصول على الإحصائيات العامة
CREATE PROCEDURE GetGeneralStats()
BEGIN
    SELECT 
        (SELECT COUNT(*) FROM sessions WHERE is_active = TRUE) as active_sessions,
        (SELECT COALESCE(SUM(CASE 
            WHEN is_active = TRUE THEN TIMESTAMPDIFF(MINUTE, start_time, NOW())
            ELSE TIMESTAMPDIFF(MINUTE, start_time, end_time)
        END), 0) FROM sessions WHERE DATE(start_time) = CURDATE()) as total_time_today,
        (SELECT COALESCE(SUM(CASE 
            WHEN is_active = TRUE THEN CEIL((TIMESTAMPDIFF(MINUTE, start_time, NOW()) / 60.0) * 
                (SELECT CAST(setting_value AS DECIMAL(10,2)) FROM settings WHERE setting_key = 'hourly_rate'))
            ELSE total_cost
        END), 0) FROM sessions WHERE DATE(start_time) = CURDATE()) as total_revenue_today;
END //

-- إجراء لتحديث الإحصائيات اليومية
CREATE PROCEDURE UpdateDailyStats()
BEGIN
    DECLARE v_date DATE DEFAULT CURDATE();
    DECLARE v_total_sessions INT DEFAULT 0;
    DECLARE v_total_time INT DEFAULT 0;
    DECLARE v_total_revenue DECIMAL(10,2) DEFAULT 0;
    
    -- حساب الإحصائيات اليومية
    SELECT 
        COUNT(*),
        COALESCE(SUM(CASE 
            WHEN is_active = TRUE THEN TIMESTAMPDIFF(MINUTE, start_time, NOW())
            ELSE TIMESTAMPDIFF(MINUTE, start_time, end_time)
        END), 0),
        COALESCE(SUM(CASE 
            WHEN is_active = TRUE THEN CEIL((TIMESTAMPDIFF(MINUTE, start_time, NOW()) / 60.0) * 
                (SELECT CAST(setting_value AS DECIMAL(10,2)) FROM settings WHERE setting_key = 'hourly_rate'))
            ELSE total_cost
        END), 0)
    INTO v_total_sessions, v_total_time, v_total_revenue
    FROM sessions 
    WHERE DATE(start_time) = v_date;
    
    -- إدراج أو تحديث الإحصائيات اليومية
    INSERT INTO daily_stats (date, total_sessions, total_time, total_revenue)
    VALUES (v_date, v_total_sessions, v_total_time, v_total_revenue)
    ON DUPLICATE KEY UPDATE
        total_sessions = v_total_sessions,
        total_time = v_total_time,
        total_revenue = v_total_revenue,
        updated_at = NOW();
END //

DELIMITER ;
