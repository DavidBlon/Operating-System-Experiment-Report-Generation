<?php
// 自定义实验题目的存取 API：GET ?user=xxx 拉取，POST {user, data} 保存（按用户名隔离）
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

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$user = '';
$data = null;

if ($method === 'GET') {
    $user = (string)($_GET['user'] ?? '');
} else {
    $body = json_decode(file_get_contents('php://input'), true);
    if (!is_array($body)) resp(['ok' => false, 'error' => 'invalid body']);
    $user = (string)($body['user'] ?? '');
    $data = isset($body['data']) ? $body['data'] : null;
    $adminKey = (string)($body['admin_key'] ?? '');
}

// 用户名白名单校验（与前端 sanitizeName 一致：字母数字下划线连字符中文）
// '#default#' 是保留键：全局默认题库（GET 公开，POST 需要管理密码）
if ($user !== '#default#' && !preg_match('/^[\w\x{4e00}-\x{9fa5}-]{1,32}$/u', $user)) {
    resp(['ok' => false, 'error' => 'invalid user']);
}

// 写入默认题库需要管理密码（hash_equals 防时序比较）
if ($method !== 'GET' && $user === '#default#') {
    if (!defined('ADMIN_KEY') || ADMIN_KEY === '' || !hash_equals(ADMIN_KEY, $adminKey)) {
        resp(['ok' => false, 'error' => 'admin key required']);
    }
}

if ($method === 'GET') {
    $st = $pdo->prepare('SELECT data FROM os_experiments WHERE user = ?');
    $st->execute([$user]);
    $row = $st->fetch(PDO::FETCH_ASSOC);
    $parsed = $row ? json_decode($row['data'], true) : null;
    resp(['ok' => true, 'data' => (is_array($parsed) ? $parsed : null)]);
}

// POST：保存（上限 256KB，必须是合法 JSON）
$json = is_string($data) ? $data : json_encode($data, JSON_UNESCAPED_UNICODE);
if ($json === null || strlen($json) > 256 * 1024) resp(['ok' => false, 'error' => 'too large']);
if (!is_array(json_decode($json, true))) resp(['ok' => false, 'error' => 'invalid json']);

$st = $pdo->prepare('INSERT INTO os_experiments (user, data) VALUES (?, ?) ON DUPLICATE KEY UPDATE data = VALUES(data)');
$st->execute([$user, $json]);
resp(['ok' => true]);
