<?php
// ملف إعداد قاعدة البيانات
$host = 'localhost';
$username = 'root';
$password = '';

try {
    // الاتصال بـ MySQL بدون تحديد قاعدة البيانات
    $pdo = new PDO("mysql:host=$host;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // قراءة ملف SQL
    $sql = file_get_contents('database.sql');
    
    // تقسيم الاستعلامات
    $statements = explode(';', $sql);
    
    foreach ($statements as $statement) {
        $statement = trim($statement);
        if (!empty($statement)) {
            try {
                $pdo->exec($statement);
                echo "تم تنفيذ الاستعلام بنجاح<br>";
            } catch (PDOException $e) {
                echo "خطأ في تنفيذ الاستعلام: " . $e->getMessage() . "<br>";
            }
        }
    }
    
    echo "<h2>تم إعداد قاعدة البيانات بنجاح!</h2>";
    echo "<p>يمكنك الآن استخدام النظام.</p>";
    echo "<a href='index.html'>العودة للصفحة الرئيسية</a>";
    
} catch (PDOException $e) {
    echo "خطأ في الاتصال بقاعدة البيانات: " . $e->getMessage();
}
?>
