<?php
// 共享题库 API：GET 拉取、POST 保存（所有人共用一份，改完全员可见；保存前自动备份）
require __DIR__ . '/db.php';
require __DIR__ . '/bank_lib.php';
header('Content-Type: application/json; charset=utf-8');

function resp($arr) { echo json_encode($arr, JSON_UNESCAPED_UNICODE); exit; }

try {
    $pdo = bank_db();
} catch (Exception $e) {
    resp(['ok' => false, 'error' => 'db connect failed']);
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    $raw = bank_read($pdo);
    $parsed = $raw !== null ? json_decode($raw, true) : null;
    resp(['ok' => true, 'data' => (is_array($parsed) ? $parsed : null)]);
}

// POST：保存共享题库（忽略 user/admin_key 字段以兼容旧页面；上限 256KB）
$body = json_decode(file_get_contents('php://input'), true);
if (!is_array($body) || !array_key_exists('data', $body)) resp(['ok' => false, 'error' => 'invalid body']);
$data = $body['data'];

$json = is_string($data) ? $data : json_encode($data, JSON_UNESCAPED_UNICODE);
if ($json === null || strlen($json) > 256 * 1024) resp(['ok' => false, 'error' => 'too large']);
if (!is_array(json_decode($json, true))) resp(['ok' => false, 'error' => 'invalid json']);

// 内容有变化时先自动备份当前版本（90 天保留），再写入
save_bank($pdo, $json);
resp(['ok' => true]);
