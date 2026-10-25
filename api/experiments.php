<?php
// 共享题库 API：GET 拉取、POST 保存（所有人共用一份，改完全员可见）
require __DIR__ . '/db.php';
header('Content-Type: application/json; charset=utf-8');

function resp($arr) { echo json_encode($arr, JSON_UNESCAPED_UNICODE); exit; }

try {
    $pdo = new PDO('mysql:host=' . DB_HOST . ';port=' . DB_PORT . ';dbname=' . DB_NAME . ';charset=utf8mb4', DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_TIMEOUT => 5,
    ]);
} catch (Exception $e) {
    resp(['ok' => false, 'error' => 'db connect failed']);
}

// 题库统一存在保留键 '#default#'（兼容旧版按用户名读写的调用：user 参数被忽略）
define('BANK_KEY', '#default#');
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$data = null;

if ($method === 'GET') {
    $st = $pdo->prepare('SELECT data FROM os_experiments WHERE user = ?');
    $st->execute([BANK_KEY]);
    $row = $st->fetch(PDO::FETCH_ASSOC);
    $parsed = $row ? json_decode($row['data'], true) : null;
    resp(['ok' => true, 'data' => (is_array($parsed) ? $parsed : null)]);
}

// POST：保存共享题库（忽略 user/admin_key 字段以兼容旧页面）
$body = json_decode(file_get_contents('php://input'), true);
if (!is_array($body) || !array_key_exists('data', $body)) resp(['ok' => false, 'error' => 'invalid body']);
$data = $body['data'];

$json = is_string($data) ? $data : json_encode($data, JSON_UNESCAPED_UNICODE);
if ($json === null || strlen($json) > 256 * 1024) resp(['ok' => false, 'error' => 'too large']);
if (!is_array(json_decode($json, true))) resp(['ok' => false, 'error' => 'invalid json']);

$st = $pdo->prepare('INSERT INTO os_experiments (user, data) VALUES (?, ?) ON DUPLICATE KEY UPDATE data = VALUES(data)');
$st->execute([BANK_KEY, $json]);
resp(['ok' => true]);
