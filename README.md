# Ubuntu Terminal - 操作系统实验报告生成器

一个基于 Web 的 Ubuntu 终端模拟器，用于快速生成操作系统实验报告。

## 功能特性

### 终端模拟
- 完整的 Linux 命令行交互体验
- 支持常用命令：`ls`、`cd`、`cat`、`mkdir`、`rm`、`cp`、`mv`、`chmod`、`chown`、`grep`、`find`、`echo`、`touch` 等
- 用户/组管理：`useradd`、`userdel`、`usermod`、`groupadd`、`groupdel`、`passwd`、`su`、`sudo`
- 磁盘管理：`fdisk`、`mkfs`、`mount`、`umount`
- `&&` 命令链、`|` 管道、`>`/`>>` 重定向

### 虚拟文件系统
- 完整的目录树结构（`/home`、`/etc`、`/var`、`/usr` 等）
- 文件权限系统（`rwx` / 八进制）
- 符号链接支持
- 磁盘分区与挂载模拟

### Shell 脚本模拟
- 支持 `if/elif/else`、`while`、`for` 循环
- 变量赋值、`let` 算术运算、`$((...))` 表达式
- 函数定义与调用
- `echo`、`read`、`exit` 等内置命令
- `test` / `[ ]` 条件测试

### 实验报告生成
- 预置多个操作系统实验题目
- 一键填入命令或脚本
- 支持自定义实验和题目管理
- 数据导出/导入（JSON 格式）

## 使用方法

1. 直接在浏览器中打开 `操作系统实验.html`
2. 输入用户名开始使用
3. 点击左侧实验面板选择题目
4. 命令自动填入终端，按 Enter 执行

## 文件说明

| 文件 | 说明 |
|------|------|
| `操作系统实验.html` | 主页面 |
| `app.js` | 核心逻辑（终端模拟、文件系统、命令处理） |
| `styles.css` | 样式文件 |

## 技术栈

- 纯前端实现，无需后端服务
- 原生 JavaScript，无框架依赖
- 数据持久化使用 localStorage

## License

MIT
