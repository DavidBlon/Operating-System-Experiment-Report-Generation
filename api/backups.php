<?php
// 题库备份：GET 列出备份，POST {name} 恢复指定备份
require __DIR__ . '/db.php';
require __DIR__ . '/bank_lib.php';
header('Content-Type: application/json; charset=utf-8');

function resp($arr) { echo json_encode($arr, JSON_UNESCAPED_UNICODE); exit; }

$dir = bank_dir();
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    if (!is_dir($dir)) resp(['ok' => true, 'backups' => []]);
    $files = glob($dir . '/bank_*.json');
    if ($files) usort($files, function ($a, $b) { return filemtime($b) <=> filemtime($a); });
    $out = [];
    foreach (array_slice($files ?: [], 0, 100) as $f) {
        $out[] = [
            'name' => basename($f),
            'time' => date('Y-m-d H:i:s', filemtime($f)),
            'size' => number_format(filesize($f) / 1024, 1) . ' KB',
        ];
    }
    resp(['ok' => true, 'backups' => $out]);
}

// POST：恢复指定备份（文件名白名单校验，防路径穿越）
$body = json_decode(file_get_contents('php://input'), true);
if (!is_array($body)) resp(['ok' => false, 'error' => 'invalid body']);
$name = (string)($body['name'] ?? '');
if (!preg_match('/^bank_\d{8}_\d{6}_[0-9a-f]{4}\.json$/', $name)) resp(['ok' => false, 'error' => 'invalid name']);
$path = $dir . '/' . $name;
if (!is_file($path)) resp(['ok' => false, 'error' => 'not found']);
$json = file_get_contents($path);
if ($json === false || !is_array(json_decode($json, true))) resp(['ok' => false, 'error' => 'invalid backup']);

try {
    $pdo = bank_db();
} catch (Exception $e) {
    resp(['ok' => false, 'error' => 'db connect failed']);
}
// 恢复 = 一次正常保存（当前版本会先自动备份，可再撤销）
save_bank($pdo, $json);
resp(['ok' => true]);
