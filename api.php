<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

// إعدادات قاعدة البيانات
$host = 'localhost';
$dbname = 'gaming_center';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    die(json_encode(['error' => 'فشل الاتصال بقاعدة البيانات: ' . $e->getMessage()]));
}

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

switch($action) {
    case 'login':
        handleLogin($pdo);
        break;
    case 'get_devices':
        getDevices($pdo);
        break;
    case 'get_active_sessions':
        getActiveSessions($pdo);
        break;
    case 'start_session':
        startSession($pdo);
        break;
    case 'end_session':
        endSession($pdo);
        break;
    case 'get_daily_report':
        getDailyReport($pdo);
        break;
    case 'get_stats':
        getStats($pdo);
        break;
    case 'extend_session':
        extendSession($pdo);
        break;
    case 'switch_to_unlimited':
        switchToUnlimited($pdo);
        break;
    case 'update_session':
        updateSession($pdo);
        break;
    case 'add_device':
        addDevice($pdo);
        break;
    case 'delete_device':
        deleteDevice($pdo);
        break;
    default:
        echo json_encode(['error' => 'عملية غير صحيحة']);
}

function handleLogin($pdo) {
    $input = json_decode(file_get_contents('php://input'), true);
    $username = $input['username'] ?? '';
    $password = $input['password'] ?? '';
    
    $stmt = $pdo->prepare("SELECT id, username, role FROM users WHERE username = ? AND password = ?");
    $stmt->execute([$username, $password]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($user) {
        echo json_encode(['success' => true, 'user' => $user]);
    } else {
        echo json_encode(['success' => false, 'message' => 'بيانات الدخول غير صحيحة']);
    }
}

function getDevices($pdo) {
    $stmt = $pdo->query("SELECT * FROM devices ORDER BY id");
    $devices = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($devices);
}

function getActiveSessions($pdo) {
    $stmt = $pdo->query("CALL GetActiveSessions()");
    $sessions = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($sessions);
}

function startSession($pdo) {
    $input = json_decode(file_get_contents('php://input'), true);
    $device_id = $input['device_id'] ?? 0;
    $player_name = $input['player_name'] ?? '';
    $session_type = $input['session_type'] ?? '';
    $time_limit = $input['time_limit'] ?? null;
    $game_mode = $input['game_mode'] ?? 'duo';
    
    try {
        $stmt = $pdo->prepare("CALL StartSession(?, ?, ?, ?, ?)");
        $stmt->execute([$device_id, $player_name, $session_type, $time_limit, $game_mode]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($result['session_id'] > 0) {
            // تحديث الإحصائيات اليومية بعد بدء الجلسة
            $stmt = $pdo->query("CALL UpdateDailyStats()");
            
            echo json_encode(['success' => true, 'session_id' => $result['session_id']]);
        } else {
            echo json_encode(['success' => false, 'message' => $result['message'] ?? 'فشل في بدء الجلسة']);
        }
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'خطأ: ' . $e->getMessage()]);
    }
}

function endSession($pdo) {
    $input = json_decode(file_get_contents('php://input'), true);
    $session_id = $input['session_id'] ?? 0;
    
    try {
        $stmt = $pdo->prepare("CALL EndSession(?)");
        $stmt->execute([$session_id]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($result['total_cost'] >= 0) {
            // تحديث الإحصائيات اليومية بعد إنهاء الجلسة
            $stmt = $pdo->query("CALL UpdateDailyStats()");
            
            echo json_encode([
                'success' => true, 
                'total_cost' => $result['total_cost'],
                'elapsed_minutes' => $result['elapsed_minutes']
            ]);
        } else {
            echo json_encode(['success' => false, 'message' => $result['message'] ?? 'فشل في إنهاء الجلسة']);
        }
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'خطأ: ' . $e->getMessage()]);
    }
}

function getDailyReport($pdo) {
    $date = $_GET['date'] ?? date('Y-m-d');
    
    try {
        $stmt = $pdo->prepare("CALL GetDailyReport(?)");
        $stmt->execute([$date]);
        $sessions = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // حساب الإحصائيات
        $total_sessions = count($sessions);
        $total_time = array_sum(array_column($sessions, 'duration_minutes'));
        $total_revenue = array_sum(array_column($sessions, 'total_cost'));
        
        echo json_encode([
            'date' => $date,
            'sessions' => $sessions,
            'stats' => [
                'total_sessions' => $total_sessions,
                'total_time' => $total_time,
                'total_revenue' => $total_revenue
            ]
        ]);
    } catch (Exception $e) {
        echo json_encode(['error' => 'خطأ: ' . $e->getMessage()]);
    }
}

function getStats($pdo) {
    try {
        // تحديث الإحصائيات اليومية أولاً
        $stmt = $pdo->query("CALL UpdateDailyStats()");
        
        // الحصول على الإحصائيات المحدثة
        $stmt = $pdo->query("CALL GetGeneralStats()");
        $stats = $stmt->fetch(PDO::FETCH_ASSOC);
        echo json_encode($stats);
    } catch (Exception $e) {
        echo json_encode(['error' => 'خطأ: ' . $e->getMessage()]);
    }
}

function extendSession($pdo) {
    $input = json_decode(file_get_contents('php://input'), true);
    $session_id = $input['session_id'] ?? 0;
    $additional_minutes = $input['additional_minutes'] ?? 0;
    
    try {
        $stmt = $pdo->prepare("UPDATE sessions SET time_limit = time_limit + ? WHERE id = ? AND is_active = TRUE");
        $stmt->execute([$additional_minutes, $session_id]);
        
        if ($stmt->rowCount() > 0) {
            echo json_encode(['success' => true, 'message' => 'تم تمديد الوقت بنجاح']);
        } else {
            echo json_encode(['success' => false, 'message' => 'فشل في تمديد الوقت']);
        }
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'خطأ: ' . $e->getMessage()]);
    }
}

function switchToUnlimited($pdo) {
    $input = json_decode(file_get_contents('php://input'), true);
    $session_id = $input['session_id'] ?? 0;
    
    try {
        $stmt = $pdo->prepare("UPDATE sessions SET session_type = 'unlimited', time_limit = NULL WHERE id = ? AND is_active = TRUE");
        $stmt->execute([$session_id]);
        
        if ($stmt->rowCount() > 0) {
            echo json_encode(['success' => true, 'message' => 'تم التحويل إلى وقت مفتوح']);
        } else {
            echo json_encode(['success' => false, 'message' => 'فشل في التحويل']);
        }
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'خطأ: ' . $e->getMessage()]);
    }
}

function updateSession($pdo) {
    $input = json_decode(file_get_contents('php://input'), true);
    $session_id = $input['session_id'] ?? 0;
    $session_type = $input['session_type'] ?? 'limited';
    $time_limit = $input['time_limit'] ?? null;
    
    try {
        if ($session_type === 'unlimited') {
            $stmt = $pdo->prepare("UPDATE sessions SET session_type = 'unlimited', time_limit = NULL WHERE id = ? AND is_active = TRUE");
            $stmt->execute([$session_id]);
        } else {
            $stmt = $pdo->prepare("UPDATE sessions SET session_type = 'limited', time_limit = ? WHERE id = ? AND is_active = TRUE");
            $stmt->execute([$time_limit, $session_id]);
        }
        
        if ($stmt->rowCount() > 0) {
            echo json_encode(['success' => true, 'message' => 'تم تحديث الجلسة بنجاح']);
        } else {
            echo json_encode(['success' => false, 'message' => 'فشل في تحديث الجلسة']);
        }
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'خطأ: ' . $e->getMessage()]);
    }
}

function addDevice($pdo) {
    $input = json_decode(file_get_contents('php://input'), true);
    $device_name = $input['device_name'] ?? '';
    
    if (empty($device_name)) {
        echo json_encode(['success' => false, 'message' => 'اسم الجهاز مطلوب']);
        return;
    }
    
    try {
        $stmt = $pdo->prepare("CALL AddDevice(?)");
        $stmt->execute([$device_name]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($result['device_id'] > 0) {
            echo json_encode(['success' => true, 'device_id' => $result['device_id'], 'message' => 'تم إضافة الجهاز بنجاح']);
        } else {
            echo json_encode(['success' => false, 'message' => 'فشل في إضافة الجهاز']);
        }
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'خطأ: ' . $e->getMessage()]);
    }
}

function deleteDevice($pdo) {
    $input = json_decode(file_get_contents('php://input'), true);
    $device_id = $input['device_id'] ?? 0;
    
    if ($device_id <= 0) {
        echo json_encode(['success' => false, 'message' => 'معرف الجهاز غير صحيح']);
        return;
    }
    
    try {
        $stmt = $pdo->prepare("CALL DeleteDevice(?)");
        $stmt->execute([$device_id]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => $result['success'] == 1,
            'message' => $result['message']
        ]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'خطأ: ' . $e->getMessage()]);
    }
}
?>
