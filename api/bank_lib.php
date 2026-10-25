<?php
// 题库存取的公共库：数据库连接、自动备份、过期清理
define('BANK_KEY', '#default#');
define('BACKUP_RETAIN_DAYS', 90);   // 备份保留 3 个月
define('BACKUP_KEEP_MIN', 10);      // 最近 10 份保底永不清理

function bank_db() {
    static $pdo = null;
    if ($pdo === null) {
        $pdo = new PDO('mysql:host=' . DB_HOST . ';port=' . DB_PORT . ';dbname=' . DB_NAME . ';charset=utf8mb4', DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_TIMEOUT => 5,
        ]);
    }
    return $pdo;
}

function bank_dir() { return __DIR__ . '/backups'; }

// 读取当前题库（无则 null）
function bank_read($pdo) {
    $st = $pdo->prepare('SELECT data FROM os_experiments WHERE user = ?');
    $st->execute([BANK_KEY]);
    $row = $st->fetch(PDO::FETCH_ASSOC);
    return $row ? $row['data'] : null;
}

// 把当前题库备份为 JSON 文件（内容有变化才备份）
function backup_current_bank($pdo) {
    $current = bank_read($pdo);
    if ($current === null) return;
    $dir = bank_dir();
    if (!is_dir($dir)) @mkdir($dir, 0755, true);
    if (!file_exists($dir . '/index.html')) @file_put_contents($dir . '/index.html', ''); // 防目录列览
    // 初始版本永久留档：origin.json 只创建一次，永不覆盖、永不过期、清理逻辑不涉及
    $origin = $dir . '/origin.json';
    if (!file_exists($origin)) {
        @file_put_contents($origin, $current);
        @chmod($origin, 0444); // 只读，防手滑覆盖
    }
    $name = 'bank_' . date('Ymd_His') . '_' . bin2hex(random_bytes(2)) . '.json';
    @file_put_contents($dir . '/' . $name, $current);
    cleanup_backups($dir);
}

// 清理超过保留期的备份（最近 BACKUP_KEEP_MIN 份保底保留；origin.json 不在此列，永不清理）
function cleanup_backups($dir) {
    $files = glob($dir . '/bank_*.json');
    if (!$files) return;
    usort($files, function ($a, $b) { return filemtime($b) <=> filemtime($a); }); // 新→旧
    $expire = time() - BACKUP_RETAIN_DAYS * 86400;
    foreach ($files as $i => $f) {
        if ($i < BACKUP_KEEP_MIN) continue;
        if (filemtime($f) < $expire) @unlink($f);
    }
}

// 保存题库：先自动备份当前版本，再写入新版本
function save_bank($pdo, $json) {
    $current = bank_read($pdo);
    if ($current !== $json) backup_current_bank($pdo);
    $st = $pdo->prepare('INSERT INTO os_experiments (user, data) VALUES (?, ?) ON DUPLICATE KEY UPDATE data = VALUES(data)');
    $st->execute([BANK_KEY, $json]);
}
