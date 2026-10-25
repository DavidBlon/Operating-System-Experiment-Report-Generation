// ─── 设备命名逻辑 ───
let deviceName = 'username-VirtualBox';
const deviceOverlay = document.getElementById('deviceNameOverlay');
const deviceInput = document.getElementById('deviceNameInput');
const deviceConfirm = document.getElementById('deviceNameConfirm');
const cmdInputRef = document.getElementById('cmd');
cmdInputRef.disabled = true;
function applyDeviceName(name, suffix) {
    name = sanitizeName(name);
    if (!name) return;
    // 同名快照存在时直接恢复上次的虚拟机状态（文件、用户、组）
    if (tryRestoreVm(name)) {
        state.currentUser = name;
        updatePrompt();
        deviceOverlay.style.display = 'none';
        cmdInputRef.disabled = false;
        cmdInputRef.focus();
        return;
    }
    deviceName = name + suffix;
    state.currentUser = name;
    if (!state.users[name]) {
        const nextUid = Math.max(1000, ...Object.values(state.users).map(u => u.uid)) + 1;
        state.users[name] = {
            uid: nextUid, real: name, type: '自定义', pwdState: '登录时询问'
        };
        state.passwords[name] = name;
        state.groups[name] = {
            gid: nextUid, members: [name]
        };
    }
    cwd = '/home/' + name;
    let homeDir = getNode('/home/' + name);
    if (!homeDir) {
        let homeNode = getNode('/home');
        if (homeNode) {
            homeNode.children.push(dir(name, '755', name, name, [ file('.bashrc', '644', name, name, 3771, '# ~/.bashrc: executed by bash(1) for non-login shells.\n'), file('.profile', '644', name, name, 807, '# ~/.profile: executed by the command interpreter for login shells.\n') ]));
        }
    }
    updatePrompt();
    deviceOverlay.style.display = 'none';
    cmdInputRef.disabled = false;
    cmdInputRef.focus();
    saveVmSnapshot();
}
deviceInput.focus();
const state = {
    currentUser: 'username', isRoot: false, sudoAuthenticated: false, users: {
        'username': {
            uid: 1000, real: 'username', type: '自定义', pwdState: '登录时询问'
        },
        'user1': {
            uid: 1001, real: 'user1', type: '标准', pwdState: '登录时询问'
        },
        'user2': {
            uid: 1002, real: 'user2', type: '标准', pwdState: '登录时询问'
        }
    },
    passwords: {
        'username': 'username', 'user1': 'user1', 'user2': 'user2'
    },
    groups: {
        'adm': {
            gid: 4, members: ['username']
        },
        'audio': {
            gid: 1075, members: []
        },
        'avahi': {
            gid: 1061, members: []
        },
        'avahi-autoipd': {
            gid: 1034, members: []
        },
        'backup': {
            gid: 1074, members: []
        },
        'bin': {
            gid: 1085, members: []
        },
        'bluetooth': {
            gid: 1096, members: []
        },
        'cdrom': {
            gid: 1058, members: []
        },
        'colord': {
            gid: 1099, members: []
        },
        'crontab': {
            gid: 1000, members: []
        },
        'username': {
            gid: 1000, members: ['username']
        },
        'sudo': {
            gid: 27, members: ['username']
        },
        'dev': {
            gid: 1086, members: []
        },
        'testgroup': {
            gid: 1059, members: []
        }
    },
    selectedGroup: 'bluetooth', gnomeInstalled: false
};
// ═══════════════════════════════════════════════════ // 虚拟文件系统 (Virtual File System) // ═══════════════════════════════════════════════════
let cwd = '/home/username';
function makeNode(name, type, perm, owner, group, size, content, children) {
    const now = new Date();
    const mtime = `${ ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'][now.getMonth()] } ${ String(now.getDate()).padStart(2,' ') } ${ String(now.getHours()).padStart(2,'0') } :${ String(now.getMinutes()).padStart(2,'0') } `;
    return {
        name, type, permissions: perm, owner, group, size: size || 0, mtime, content: content || '', children: children || [], linkTarget: null
    };
}
function dir(n, p, o, g, ch) {
    return makeNode(n, 'dir', p||'755', o||'root', g||'root', 4096, '', ch||[]);
}
function file(n, p, o, g, s, c) {
    return makeNode(n, 'file', p||'644', o||'root', g||'root', s||0, c||'');
}
function link(n, t) {
    let nd = makeNode(n, 'link', '777', 'root', 'root', 0);
    nd.linkTarget = t;
    return nd;
}
let fsTree = dir('/', '755', 'root', 'root', [ dir('bin', '755', 'root', 'root', [ file('bash', '755', 'root', 'root', 1113792, ''), file('cat', '755', 'root', 'root', 35808, ''), file('chmod', '755', 'root', 'root', 56432, ''), file('cp', '755', 'root', 'root', 137680, ''), file('find', '755', 'root', 'root', 224960, ''), file('ls', '755', 'root', 'root', 137680, ''), file('mkdir', '755', 'root', 'root', 83472, ''), file('mount', '755', 'root', 'root', 44464, ''), file('rm', '755', 'root', 'root', 65536, ''), file('rmdir', '755', 'root', 'root', 31744, ''), file('tar', '755', 'root', 'root', 450560, ''), file('touch', '755', 'root', 'root', 35808, '') ]), dir('boot', '755', 'root', 'root', [ file('vmlinuz-6.8.0-generic', '644', 'root', 'root', 11690016, ''), file('initrd.img-6.8.0-generic', '644', 'root', 'root', 65431552, ''), file('config-6.8.0-generic', '644', 'root', 'root', 259476, ''), file('System.map-6.8.0-generic', '644', 'root', 'root', 5672841, '') ]), dir('dev', '755', 'root', 'root', [ file('sda', '660', 'root', 'disk', 0, ''), file('sda1', '660', 'root', 'disk', 0, ''), file('sda2', '660', 'root', 'disk', 0, ''), file('sda3', '660', 'root', 'disk', 0, ''), file('sdb', '660', 'root', 'disk', 0, ''), file('null', '666', 'root', 'root', 0, ''), file('zero', '666', 'root', 'root', 0, ''), file('random', '666', 'root', 'root', 0, ''), file('urandom', '666', 'root', 'root', 0, '') ]), dir('etc', '755', 'root', 'root', [ file('hostname', '644', 'root', 'root', 26, 'username-VirtualBox\n'), file('hosts', '644', 'root', 'root', 268, '127.0.0.1\tlocalhost\n127.0.1.1\tusername-VirtualBox\n\n::1\tlocalhost ip6-localhost ip6-loopback\nff02::1\tip6-allnodes\nff02::2\tip6-allrouters\n'), file('passwd', '644', 'root', 'root', 1847, ''), file('shadow', '640', 'root', 'shadow', 1234, ''), file('fstab', '644', 'root', 'root', 589, '# /etc/fstab: static file system information.\n# <file system> <mount point> <type> <options> <dump> <pass>\n/dev/sda1 / ext4 errors=remount-ro 0 1\n/dev/sda2 /home ext4 defaults 0 2\n/dev/sda3 none swap sw 0 0\n'), file('group', '644', 'root', 'root', 687, ''), file('gshadow', '640', 'root', 'shadow', 543, ''), file('resolv.conf', '644', 'root', 'root', 128, 'nameserver 8.8.8.8\nnameserver 8.8.4.4\n'), dir('apt', '755', 'root', 'root', [ dir('sources.list.d', '755', 'root', 'root', []), file('sources.list', '644', 'root', 'root', 2871, 'deb http://archive.ubuntu.com/ubuntu/ noble main restricted\ndeb http://archive.ubuntu.com/ubuntu/ noble-updates main restricted\n') ]), dir('default', '755', 'root', 'root', [ file('grub', '644', 'root', 'root', 1267, 'GRUB_DEFAULT=0\nGRUB_TIMEOUT=5\nGRUB_DISTRIBUTOR="Ubuntu"\n') ]), dir('nginx', '755', 'root', 'root', [ file('nginx.conf', '644', 'root', 'root', 2465, 'user www-data;\nworker_processes auto;\npid /run/nginx.pid;\ninclude /etc/nginx/modules-enabled/*.conf;\n\nevents { \n worker_connections 768;\n } \n\nhttp { \n sendfile on;\n include /etc/nginx/mime.types;\n default_type application/octet-stream;\n access_log /var/log/nginx/access.log;\n error_log /var/log/nginx/error.log;\n include /etc/nginx/sites-enabled/*;\n } \n'), dir('sites-available', '755', 'root', 'root', [ file('default', '644', 'root', 'root', 2413, 'server { \n listen 80 default_server;\n root /var/www/html;\n index index.html;\n server_name _;\n } \n') ]), dir('sites-enabled', '755', 'root', 'root', []) ]), dir('ssh', '755', 'root', 'root', [ file('sshd_config', '644', 'root', 'root', 3256, 'Port 22\nPermitRootLogin prohibit-password\nPubkeyAuthentication yes\n') ]), dir('systemd', '755', 'root', 'root', [ dir('system', '755', 'root', 'root', []) ]) ]), dir('home', '755', 'root', 'root', [ dir('username', '755', 'username', 'username', [ file('.bashrc', '644', 'username', 'username', 3771, '# ~/.bashrc: executed by bash(1) for non-login shells.\nexport PS1=\'\\u@\\h:\\w\\$ \'\n'), file('.profile', '644', 'username', 'username', 807, '# ~/.profile: executed by the command interpreter for login shells.\nif [ -n "$BASH_VERSION" ]; then\n if [ -f "$HOME/.bashrc" ]; then\n . "$HOME/.bashrc"\n fi\nfi\n'), file('.bash_history', '600', 'username', 'username', 4812, ''), file('.bash_logout', '644', 'username', 'username', 220, ''), dir('Desktop', '755', 'username', 'username', []), dir('Documents', '755', 'username', 'username', [ file('readme.txt', '644', 'username', 'username', 256, 'Hello World!\nThis is a sample document.\n'), file('notes.md', '644', 'username', 'username', 1024, '# Notes\n\n## Todo\n- Install packages\n- Configure nginx\n- Deploy app\n') ]), dir('Downloads', '755', 'username', 'username', [ file('archive.tar.gz', '644', 'username', 'username', 52428, ''), file('setup.sh', '755', 'username', 'username', 1847, '#!/bin/bash\necho "Setting up environment..."\napt update && apt upgrade -y\n') ]), dir('Music', '755', 'username', 'username', []), dir('Pictures', '755', 'username', 'username', [ file('screenshot.png', '644', 'username', 'username', 245760, '') ]), dir('Videos', '755', 'username', 'username', []), dir('projects', '755', 'username', 'username', [ file('app.py', '644', 'username', 'username', 1536, '#!/usr/bin/env python3\n\nimport os\nimport sys\n\ndef main():\n print("Hello from app.py")\n\nif __name__ == "__main__":\n main()\n'), file('config.json', '644', 'username', 'username', 512, '{ \n "name": "my-project",\n "version": "1.0.0",\n "debug": false\n } \n'), file('Makefile', '644', 'username', 'username', 384, 'CC=gcc\nCFLAGS=-Wall -g\n\nall: main\n\nmain: main.c\n\t$(CC) $(CFLAGS) -o main main.c\n\nclean:\n\trm -f main\n'), dir('src', '755', 'username', 'username', [ file('main.c', '644', 'username', 'username', 512, '#include <stdio.h>\n\nint main() { \n printf("Hello World!\\n");\n return 0;\n } \n'), file('utils.c', '644', 'username', 'username', 1024, '#include "utils.h"\n\nint add(int a, int b) { \n return a + b;\n } \n'), file('utils.h', '644', 'username', 'username', 128, '#ifndef UTILS_H\n#define UTILS_H\nint add(int a, int b);\n#endif\n') ]), dir('docs', '755', 'username', 'username', [ file('api.md', '644', 'username', 'username', 2048, '# API Documentation\n\n## GET /api/v1/status\nReturns server status.\n'), file('changelog.md', '644', 'username', 'username', 768, '# Changelog\n\n## v1.0.0\n- Initial release\n') ]) ]) ]), dir('user1', '755', 'user1', 'user1', [ file('.bashrc', '644', 'user1', 'user1', 3771, ''), file('.profile', '644', 'user1', 'user1', 807, '') ]), dir('user2', '755', 'user2', 'user2', [ file('.bashrc', '644', 'user2', 'user2', 3771, ''), file('.profile', '644', 'user2', 'user2', 807, '') ]) ]), dir('lib', '755', 'root', 'root', [ dir('x86_64-linux-gnu', '755', 'root', 'root', [ file('libc.so.6', '755', 'root', 'root', 2216304, ''), file('libpthread.so.0', '755', 'root', 'root', 146768, ''), file('libm.so.6', '755', 'root', 'root', 1339568, '') ]) ]), dir('mnt', '755', 'root', 'root', []), dir('media', '755', 'root', 'root', [ dir('username', '750', 'username', 'username', []) ]), dir('opt', '755', 'root', 'root', []), dir('proc', '555', 'root', 'root', []), dir('root', '700', 'root', 'root', []), dir('run', '755', 'root', 'root', []), dir('sbin', '755', 'root', 'root', [ file('fdisk', '755', 'root', 'root', 188416, ''), file('mkfs', '755', 'root', 'root', 31744, ''), file('mkfs.ext4', '755', 'root', 'root', 31744, ''), file('mkfs.xfs', '755', 'root', 'root', 31744, ''), file('mkfs.vfat', '755', 'root', 'root', 31744, '') ]), dir('srv', '755', 'root', 'root', []), dir('sys', '555', 'root', 'root', []), dir('tmp', '1777', 'root', 'root', []), dir('usr', '755', 'root', 'root', [ dir('bin', '755', 'root', 'root', [ file('vim', '755', 'root', 'root', 3112320, ''), file('nano', '755', 'root', 'root', 268432, ''), file('grep', '755', 'root', 'root', 314832, ''), file('awk', '755', 'root', 'root', 445328, ''), file('sed', '755', 'root', 'root', 123456, ''), file('python3', '755', 'root', 'root', 5432100, ''), file('git', '755', 'root', 'root', 3248576, '') ]), dir('lib', '755', 'root', 'root', []), dir('local', '755', 'root', 'root', [ dir('bin', '755', 'root', 'root', []), dir('lib', '755', 'root', 'root', []), dir('share', '755', 'root', 'root', []) ]), dir('share', '755', 'root', 'root', []), dir('sbin', '755', 'root', 'root', []) ]), dir('var', '755', 'root', 'root', [ dir('log', '755', 'root', 'root', [ file('syslog', '640', 'root', 'adm', 524288, 'Jun 2 08:15:01 username CRON[1234]: (root) CMD (test -x /usr/sbin/anacron)'), file('auth.log', '640', 'root', 'adm', 131072, 'Jun 2 08:00:01 username sshd[1234]: Accepted publickey for username'), file('kern.log', '640', 'root', 'adm', 262144, 'Jun 2 08:00:00 username kernel: [ 0.000000] Linux version 6.8.0-generic'), dir('nginx', '755', 'root', 'root', [ file('access.log', '640', 'www-data', 'adm', 1048576, ''), file('error.log', '640', 'www-data', 'adm', 65536, '') ]) ]), dir('www', '755', 'root', 'root', [ dir('html', '755', 'root', 'root', [ file('index.html', '644', 'root', 'root', 612, '<!DOCTYPE html>\n<html>\n<head><title>Welcome</title></head>\n<body>\n<h1>Welcome to nginx!</h1>\n</body>\n</html>\n'), file('50x.html', '644', 'root', 'root', 387, '<!DOCTYPE html>\n<html>\n<head><title>Error</title></head>\n<body>\n<h1>Error</h1>\n</body>\n</html>\n') ]) ]), dir('cache', '755', 'root', 'root', []), dir('tmp', '1777', 'root', 'root', []) ]) ]);
// 磁盘分区表
// ─── 日志时间戳动态化：跟随真实系统时间，避免硬编码日期一成不变 ───
(function refreshLogTimestamps() {
    const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const now = new Date();
    const p2 = v => String(v).padStart(2, '0');
    const ts = (h, m, s) => MON[now.getMonth()] + ' ' + String(now.getDate()).padStart(2, ' ') + ' ' + p2(h) + ':' + p2(m) + ':' + p2(s);
    const patch = (path, gen) => { const n = getNode(path); if (n) { n.content = gen(); n.size = n.content.length; } };
    patch('/var/log/syslog', () => ts(8, 15, 1) + ' username CRON[1234]: (root) CMD (test -x /usr/sbin/anacron)\n' + ts(8, 16, 1) + ' username systemd[1]: Started Daily apt download activities.');
    patch('/var/log/auth.log', () => ts(8, 0, 1) + ' username sshd[1234]: Accepted publickey for username');
    patch('/var/log/kern.log', () => ts(8, 0, 0) + ' username kernel: [    0.000000] Linux version 6.8.0-generic (buildd@ubuntu) (gcc 13.2.0) #1 SMP PREEMPT_DYNAMIC');
})();
let diskPartitions = {
    '/dev/sda': {
        model: 'Samsung SSD 870 EVO 500GB', size: 500107862016, sectors: 976773168, sectorSize: 512, partitions: [ {
            num: 1, start: 2048, end: 209735679, sectors: 209733632, size: '100G', type: 'Linux', fs: 'ext4', mount: '/'
        },
        {
            num: 2, start: 209735680, end: 838862847, sectors: 629127168, size: '300G', type: 'Linux', fs: 'ext4', mount: '/home'
        },
        {
            num: 3, start: 838862848, end: 976773119, sectors: 137910272, size: '65.8G', type: 'Linux swap', fs: 'swap', mount: '[SWAP]'
        }
        ]
    },
    '/dev/sdb': {
        model: 'Western Digital WD10EZEX 1TB', size: 1000204886016, sectors: 1953525168, sectorSize: 512, partitions: []
    }
};
// 辅助函数：解析路径
function resolvePath(path) {
    let parts;
    if (path.startsWith('/')) {
        parts = path.split('/').filter(Boolean);
    }
    else {
        parts = cwd.split('/').filter(Boolean).concat(path.split('/').filter(Boolean));
    }
    let resolved = [];
    for (let p of parts) {
        if (p === '.') continue;
        if (p === '..') {
            resolved.pop();
        }
        else resolved.push(p);
    }
    return '/' + resolved.join('/');
}
// 辅助函数：获取节点
function getNode(absPath) {
    if (absPath === '/') return fsTree;
    let parts = absPath.split('/').filter(Boolean);
    let node = fsTree;
    for (let p of parts) {
        if (node.type !== 'dir') return null;
        let child = node.children.find(c => c.name === p);
        if (!child) return null;
        node = child;
    }
    return node;
}
// 辅助函数：获取父节点和名称
function getParentAndName(absPath) {
    let parts = absPath.split('/').filter(Boolean);
    let name = parts.pop();
    let parentPath = '/' + parts.join('/');
    let parent = getNode(parentPath);
    return {
        parent, name
    };
}
// 辅助函数：格式化大小
function formatSize(bytes) {
    if (bytes < 1024) return bytes + '';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + 'K';
    if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + 'M';
    return (bytes / 1073741824).toFixed(1) + 'G';
}
// 辅助函数：权限字符串
function permStr(perm) {
    let p = parseInt(perm, 8);
    let s = '';
    // 位 8-6: owner (rwx), 位 5-3: group (rwx), 位 2-0: others (rwx)
    for (let i = 8; i >= 0; i--) {
        let bit = (p >> i) & 1;
        let pos = 8 - i;
        // 0-8
        let group = Math.floor(pos / 3);
        // 0=owner, 1=group, 2=others
        let type = pos % 3;
        // 0=r, 1=w, 2=x
        if (type === 0) s += bit ? 'r' : '-';
        else if (type === 1) s += bit ? 'w' : '-';
        else s += bit ? 'x' : '-';
    }
    return s;
}
// 辅助函数：ls 条目格式化
function formatLsEntry(node, showAll) {
    let t = node.type === 'dir' ? 'd' : (node.type === 'link' ? 'l' : '-');
    let p = permStr(node.permissions);
    let links = node.type === 'dir' ? (node.children.length + 2) : 1;
    let owner = node.owner.padEnd(10);
    let group = node.group.padEnd(10);
    let size = String(node.size).padStart(8);
    let mtime = node.mtime;
    let name = escapeHtml(node.name);
    if (node.type === 'link') name += ` -> ${escapeHtml(node.linkTarget)} `;
    if (node.type === 'dir') name = `<span style="color:#4ae234;font-weight:bold;">${name} </span>`;
    else if (node.permissions.includes('x') || permStr(node.permissions).endsWith('x')) name = `<span style="color:#4ae234;">${name} </span>`;
    return `${t} ${p} ${links} ${owner} ${group} ${size} ${mtime} ${name} `;
}
let currentMode = 'COMMAND';
let cmdHistory = [];      // 输入历史（history 命令与 ↑/↓ 导航共用）
let histNavIdx = 0;
let sudoFailCount = 0;    // sudo 密码连续输错次数（两次后显示默认密码提示）
let lastExit = 0;         // 上一条命令的退出码（0 成功），供 && / || 判断
let cmdElevated = false;  // 当前命令是否持特权（root 登录，或带 sudo 前缀且已认证）
let cachedSudoCmd = '';
let passwdTarget = '';
let passwdFirstInput = '';
let fdiskDisk = null;
let fdiskDirty = false;
const cmdInput = document.getElementById('cmd');
const historyContainer = document.getElementById('history');
const outputArea = document.getElementById('output-area');
const promptSpan = document.getElementById('current-prompt');
// Make terminal output rows editable on click
const outputObserver = new MutationObserver(() => {
    historyContainer.querySelectorAll('.output-row:not([contenteditable])').forEach(el => el.contentEditable = true);
}
);
outputObserver.observe(historyContainer, {
    childList: true, subtree: true
}
);
//  Init existing output rows
historyContainer.querySelectorAll('.output-row').forEach(el => el.contentEditable = true);
outputArea.addEventListener('click', (e) => {
    if (e.target.closest('[contenteditable]')) return;
    cmdInput.focus();
}
);
cmdInput.addEventListener('keydown', function(e) {
    //  Ctrl+Shift+P: 自动填充 sudo 密码（密码不回显）
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'P' || e.key === 'p')) {
        if (currentMode === 'SUDO_AUTH') {
            e.preventDefault();
            this.value = '';
            // 清空输入框，确保密码不显示
            handleSudoAuth(state.passwords[state.currentUser] || state.currentUser);
        }
        return;
    }
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        if (currentMode === 'COMMAND' && cmdHistory.length > 0) {
            e.preventDefault();
            if (e.key === 'ArrowUp') histNavIdx = Math.max(0, histNavIdx - 1);
            else histNavIdx = Math.min(cmdHistory.length, histNavIdx + 1);
            this.value = histNavIdx < cmdHistory.length ? cmdHistory[histNavIdx] : '';
        }
        return;
    }
    if (e.key === 'Enter') {
        const val = this.value;
        this.value = '';
        if (currentMode === 'COMMAND') {
            if (val.trim()) {
                cmdHistory.push(val.trim());
                histNavIdx = cmdHistory.length;
                preCheckSudo(val.trim());
            }
        }
        else if (currentMode === 'SUDO_AUTH') {
            handleSudoAuth(val);
        }
        else if (currentMode === 'PASSWD_WAIT') {
            handlePasswdFirst(val);
        }
        else if (currentMode === 'PASSWD_CONFIRM') {
            handlePasswdConfirm(val);
        }
        else if (currentMode === 'FDISK') {
            const line = document.createElement('div');
            line.innerHTML = `<span class="prompt">命令(输入 m 获取帮助): </span><span>${escapeHtml(val)} </span>`;
            historyContainer.appendChild(line);
            handleFdiskCommand(val);
        }
        outputArea.scrollTop = outputArea.scrollHeight;
    }
}
);
function updatePrompt() {
    if (currentMode === 'SUDO_AUTH') {
        cmdInput.classList.add('password-blind');
        promptSpan.className = "interactive-prompt";
        promptSpan.innerText = `[sudo] ${state.currentUser} 的密码：`;
    }
    else if (currentMode === 'PASSWD_WAIT' || currentMode === 'PASSWD_CONFIRM') {
        cmdInput.classList.add('password-blind');
        promptSpan.className = "prompt";
        promptSpan.innerText = '';
    }
    else if (currentMode === 'FDISK') {
        cmdInput.classList.remove('password-blind');
        promptSpan.className = "prompt";
        promptSpan.innerText = '命令(输入 m 获取帮助): ';
    }
    else {
        cmdInput.classList.remove('password-blind');
        const sign = state.isRoot ? '#' : '$';
        promptSpan.className = "prompt";
        let displayCwd = cwd;
        let homeDir = '/home/' + state.currentUser;
        if (cwd === homeDir) displayCwd = '~';
        else if (cwd.startsWith(homeDir + '/')) displayCwd = '~' + cwd.slice(homeDir.length);
        else if (cwd === '/') displayCwd = '/';
        promptSpan.innerText = `${state.currentUser}@${deviceName}:${displayCwd}${sign} `;
        document.querySelector('.title').innerText = `${state.currentUser}@${deviceName}: ${displayCwd} `;
        document.title = `${state.currentUser}@${deviceName}: ${displayCwd}`;
    }
}
// ─── 设备命名事件监听器（在所有依赖定义之后注册）───
deviceConfirm.addEventListener('click', function() {
    const val = deviceInput.value.trim();
    if (!val) return;
    const suffix = document.querySelector('input[name="vmSuffix"]:checked').value;
    applyDeviceName(val, suffix);
}
);
deviceInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
        const val = deviceInput.value.trim();
        if (!val) return;
        const suffix = document.querySelector('input[name="vmSuffix"]:checked').value;
        applyDeviceName(val, suffix);
    }
}
);
function handleFdiskCommand(cmd) {
    let disk = diskPartitions[fdiskDisk];
    let out = document.createElement('div');
    out.className = 'output-row';
    function showAndStay() {
        historyContainer.appendChild(out);
        outputArea.scrollTop = outputArea.scrollHeight;
    }
    if (!disk) {
        out.innerText = 'fdisk: 未选择磁盘';
        historyContainer.appendChild(out);
        currentMode = 'COMMAND';
        updatePrompt();
        outputArea.scrollTop = outputArea.scrollHeight;
        return;
    }
    cmd = cmd.trim();
    switch (cmd) {
        case 'm': out.innerText = `帮助：\n\n GPT 保护 MBR\n DOS 分区表\n ...\n d 删除分区\n g 创建新的空 GPT 分区表\n l 列出已知分区类型\n m 打印此菜单\n n 添加新分区\n p 打印分区表\n q 不保存更改退出\n t 更改分区类型\n w 将分区表写入磁盘并退出\n\n命令(输入 m 获取帮助): `;
        showAndStay();
        break;
        case 'p': {
            let lines = [];
            let dk = fdiskDisk;
            lines.push(`Disk ${dk} : ${ formatSize(disk.size) } , ${disk.sectors} 个扇区，${disk.sectorSize} 字节/扇区`);
            lines.push(`型号: ${disk.model} `);
            lines.push(`Units: 扇区 of ${disk.sectorSize} * 512 = ${ disk.sectorSize * 512 } bytes`);
            lines.push('');
            if (disk.partitions.length > 0) {
                lines.push('Device Boot Start End Sectors Size Id Type');
                for (let p of disk.partitions) {
                    let boot = p.num === 1 ? ' *' : ' ';
                    lines.push(`${dk} ${ String(p.num).padEnd(4) } ${boot} ${ String(p.start).padStart(10) } ${ String(p.end).padStart(10) } ${ String(p.sectors).padStart(10) } ${ p.size.padStart(6) } ${ p.type === 'Linux swap' ? '82' : '83' } ${p.type} `);
                }
            }
            lines.push('');
            lines.push('命令(输入 m 获取帮助): ');
            out.innerText = lines.join('\n');
            showAndStay();
            break;
        }
        case 'n': {
            let parts = disk.partitions;
            let lastEnd = parts.length > 0 ? Math.max(...parts.map(p => p.end)) : 2048;
            if (lastEnd >= disk.sectors - 2048) {
                out.innerText = 'fdisk: 磁盘已无可用空间\n\n命令(输入 m 获取帮助): ';
                showAndStay();
                break;
            }
            let newNum = parts.length > 0 ? Math.max(...parts.map(p => p.num)) + 1 : 1;
            let start = lastEnd + 1;
            let end = Math.min(start + 209715200, disk.sectors - 1);
            let sectors = end - start + 1;
            let sizeBytes = sectors * disk.sectorSize;
            let size = formatSize(sizeBytes);
            parts.push({
                num: newNum, start, end, sectors, size, type: 'Linux', fs: 'ext4', mount: ''
            }
            );
            fdiskDirty = true;
            out.innerText = `已创建新分区 ${fdiskDisk} ${newNum} ，类型为 Linux，大小 ${size} \n\n命令(输入 m 获取帮助): `;
            showAndStay();
            break;
        }
        case 'd': {
            let parts = disk.partitions;
            if (parts.length === 0) {
                out.innerText = 'fdisk: 没有可删除的分区\n\n命令(输入 m 获取帮助): ';
                showAndStay();
                break;
            }
            let removed = parts.pop();
            fdiskDirty = true;
            out.innerText = `已删除分区 ${fdiskDisk} ${removed.num} \n\n命令(输入 m 获取帮助): `;
            showAndStay();
            break;
        }
        case 't': {
            let parts = disk.partitions;
            if (parts.length === 0) {
                out.innerText = 'fdisk: 没有可更改类型的分区\n\n命令(输入 m 获取帮助): ';
                showAndStay();
                break;
            }
            let last = parts[parts.length - 1];
            last.type = last.type === 'Linux' ? 'Linux swap' : 'Linux';
            last.fs = last.type === 'Linux swap' ? 'swap' : 'ext4';
            fdiskDirty = true;
            out.innerText = `分区 ${fdiskDisk} ${last.num} 的类型已更改为 ${last.type} \n\n命令(输入 m 获取帮助): `;
            showAndStay();
            break;
        }
        case 'w': if (fdiskDirty) {
            out.innerText = `正在将分区表写入 ${fdiskDisk} ...\n已更改内核中的分区表。\n正在同步磁盘。`;
        }
        else {
            out.innerText = '无更改。';
        }
        historyContainer.appendChild(out);
        currentMode = 'COMMAND';
        updatePrompt();
        outputArea.scrollTop = outputArea.scrollHeight;
        break;
        case 'q': if (fdiskDirty) {
            out.innerText = `fdisk: 有未保存的更改，放弃更改并退出。`;
        }
        else {
            out.innerText = '';
        }
        historyContainer.appendChild(out);
        currentMode = 'COMMAND';
        updatePrompt();
        outputArea.scrollTop = outputArea.scrollHeight;
        break;
        case 'l': out.innerText = `已知分区类型：\n\n 82 Linux swap\n 83 Linux\n\n命令(输入 m 获取帮助): `;
        showAndStay();
        break;
        default: out.innerText = `fdisk: 未知命令 "${cmd} "\n\n命令(输入 m 获取帮助): `;
        showAndStay();
        break;
    }
    saveVmSnapshot();
}
function preCheckSudo(fullRawCmd) {
    // 任一管道/命令链分段以 sudo 开头且未认证时，先走密码认证再执行整行
    const segs = fullRawCmd.split(/[;|&]+/).map(s => s.trim());
    const needsSudo = !state.isRoot && !state.sudoAuthenticated && segs.some(s => s === 'sudo' || s.startsWith('sudo '));
    if (needsSudo) {
        const line = document.createElement('div');
        line.innerHTML = `<span class="prompt">${promptSpan.innerText} </span><span>${escapeHtml(fullRawCmd)} </span>`;
        historyContainer.appendChild(line);
        currentMode = 'SUDO_AUTH';
        cachedSudoCmd = fullRawCmd;
        updatePrompt();
        return;
    }
    executePipeline(fullRawCmd, true);
}
function handleSudoAuth(inputPassword) {
    const line = document.createElement('div');
    line.innerHTML = `<span class="interactive-prompt">[sudo] ${state.currentUser} 的密码：</span>`;
    historyContainer.appendChild(line);
    if (inputPassword === state.passwords[state.currentUser]) {
        state.sudoAuthenticated = true;
        sudoFailCount = 0;
        currentMode = 'COMMAND';
        updatePrompt();
        executePipeline(cachedSudoCmd, false);
    }
    else {
        sudoFailCount++;
        const errLine = document.createElement('div');
        errLine.className = 'output-row error';
        errLine.innerText = "抱歉，请重试。" + (sudoFailCount >= 2 ? "\n（提示：默认密码为当前用户名；也可以按 Ctrl+Shift+P 自动填充）" : "");
        historyContainer.appendChild(errLine);
        currentMode = 'SUDO_AUTH';
        updatePrompt();
    }
}
function handlePasswdFirst(inputPassword) {
    if (!inputPassword || inputPassword.trim().length < 1) {
        const row = document.createElement('div');
        row.className = 'output-row error';
        row.innerText = `密码太短\npasswd: 认证令牌操作错误\npasswd: 密码未更改`;
        historyContainer.appendChild(row);
        currentMode = 'COMMAND';
        cmdInput.classList.remove('password-blind');
        updatePrompt();
        return;
    }
    passwdFirstInput = inputPassword;
    const row = document.createElement('div');
    row.className = 'output-row';
    row.innerText = `重新输入新的 密码：`;
    historyContainer.appendChild(row);
    currentMode = 'PASSWD_CONFIRM';
    promptSpan.innerText = '';
    cmdInput.classList.add('password-blind');
}
function handlePasswdConfirm(inputPassword) {
    const row = document.createElement('div');
    row.className = 'output-row';
    if (passwdFirstInput !== inputPassword) {
        row.innerHTML = `<span class="error">抱歉，密码不匹配。\npasswd: 认证令牌操作错误\npasswd: 密码未更改</span>`;
    }
    else if (passwdFirstInput.length < 1) {
        row.innerHTML = `<span class="error">密码太短\npasswd: 认证令牌操作错误\npasswd: 密码未更改</span>`;
    }
    else {
        state.passwords[passwdTarget] = passwdFirstInput;
        state.users[passwdTarget].pwdState = '登录时询问';
        row.innerText = `passwd: 密码已成功更改`;
    }
    historyContainer.appendChild(row);
    currentMode = 'COMMAND';
    passwdFirstInput = '';
    passwdTarget = '';
    cmdInput.classList.remove('password-blind');
    updatePrompt();
}
function executePipeline(fullRawCmd, needEcho) {
    if (needEcho) {
        if (!(historyContainer.lastChild && historyContainer.lastChild.innerText.includes(fullRawCmd))) {
            const line = document.createElement('div');
            line.innerHTML = `<span class="prompt">${promptSpan.innerText} </span><span>${escapeHtml(fullRawCmd)} </span>`;
            historyContainer.appendChild(line);
        }
    }
    // 按 ";" 分段顺序执行；段内按 "&&"/"||" 依据上一命令退出码决定是否继续；
    // 简单命令内支持 "|" 管道与 ">"/">>" 重定向
    for (let seg of fullRawCmd.split(';')) {
        const parts = seg.split(/\s*(&&|\|\|)\s*/);
        for (let pi = 0; pi < parts.length; pi += 2) {
            let cmd = parts[pi].trim();
            if (!cmd) continue;
            if (pi > 0) {
                const joiner = parts[pi - 1];
                if (joiner === '&&' && lastExit !== 0) continue;
                if (joiner === '||' && lastExit === 0) continue;
            }
            // Strip leading sudo for checking the base command
            let checkCmd = cmd.replace(/^sudo\s+/, '');
            if (checkCmd.startsWith('apt ') || checkCmd.startsWith('apt-get ')) {
                let out = document.createElement('div');
                out.className = 'output-row';
                state.gnomeInstalled = true;
                out.innerHTML = "正在读取软件包列表... 完成\n正在分析软件包的依赖关系树... 完成\n<span class='success'>正在设置 gnome-system-tools (3.6.0-5ubuntu3) ... 完成</span>";
                historyContainer.appendChild(out);
            }
            else {
                runSimpleCommand(cmd);
            }
        }
    }
    saveVmSnapshot();
}
// ─── 管道 / 重定向支持 ───
let pipeStdin = null;   // 管道上游输出的纯文本；非管道场景为 null
// 解析行尾重定向：返回 {mode, target, rest} 或 null
function parseRedirect(cmd) {
    const m = cmd.match(/\s(>>?)\s*([^\s>|;&]+)\s*$/);
    return m ? { mode: m[1], target: m[2], rest: cmd.slice(0, m.index).trim() } : null;
}
function splitPipe(cmd) {
    return cmd.split('|').map(s => s.trim()).filter(Boolean);
}
// 把捕获的 DOM 元素还原为纯文本（<br> 与块级元素转换行，textContent 自动解码实体）
function domToText(el) {
    if (el.nodeType !== 1) return el.nodeValue || '';
    if (el.tagName === 'BR') return '\n';
    let out = '';
    for (const c of el.childNodes) out += domToText(c);
    if (/^(DIV|P|PRE)$/.test(el.tagName) && out && !out.endsWith('\n')) out += '\n';
    return out;
}
// 捕获模式执行：拦截输出到页面的行为，改为收集纯文本（供管道/重定向使用）
function runCaptured(cmd, stdin) {
    const captured = [];
    const origAppend = historyContainer.appendChild;
    historyContainer.appendChild = function (el) { captured.push(el); return el; };
    const prevStdin = pipeStdin;
    pipeStdin = stdin;
    try { executeCommand(cmd); }
    finally {
        historyContainer.appendChild = origAppend;
        pipeStdin = prevStdin;
    }
    return captured.map(el => domToText(el)).join('');
}
// 把文本写入重定向目标文件（支持 >> 追加；/dev/null 直接丢弃）
function writeRedirFile(target, text, append) {
    const abs = resolvePath(target);
    if (abs === '/dev/null') return;
    const { parent, name } = getParentAndName(abs);
    if (!parent || parent.type !== 'dir') {
        const out = document.createElement('div');
        out.className = 'output-row';
        out.innerHTML = `<span class="error">bash: ${escapeHtml(target)}: 没有那个文件或目录</span>`;
        historyContainer.appendChild(out);
        return;
    }
    const idx = parent.children.findIndex(c => c.name === name && c.type === 'file');
    if (append && idx >= 0) {
        const n = parent.children[idx];
        n.content = (n.content || '') + text;
        n.size = n.content.length;
    }
    else {
        if (idx >= 0) parent.children.splice(idx, 1);
        parent.children.push(file(name, '644', state.currentUser, state.currentUser, text.length, text));
    }
}
// 执行一条简单命令（解析管道与重定向；忽略 2>&1 / 2>/dev/null 这类 stderr 重定向）
function runSimpleCommand(cmd) {
    cmd = cmd.replace(/\s2>&1(?=\s|$)/g, '').replace(/\s2>\/dev\/null(?=\s|$)/g, '').trim();
    const red = parseRedirect(cmd);
    const body = red ? red.rest : cmd;
    const stages = splitPipe(body);
    if (stages.length === 0) return;
    if (stages.length === 1 && !red) { executeCommand(cmd); return; }
    let stdin = null;
    for (let i = 0; i < stages.length; i++) {
        const s = stages[i];
        if (/^clear(\s|$)/.test(s)) continue; // clear 不参与管道
        const isLast = i === stages.length - 1;
        if (isLast && !red) {
            // 末段直接执行并显示，同时把上游 stdin 传入
            pipeStdin = stdin;
            try { executeCommand(s); } finally { pipeStdin = null; }
        }
        else {
            stdin = runCaptured(s, stdin);
        }
    }
    if (red) writeRedirFile(red.target, stdin == null ? '' : stdin, red.mode === '>>');
}
// ─── 文本命令的纯函数实现（便于单元测试）───
// 读取文本源：优先管道 stdin，其次拼接文件内容；出错时向 output 写入错误并返回 null
function readInputStream(files, output) {
    if (typeof pipeStdin === 'string') return { text: pipeStdin, name: null };
    if (!files || files.length === 0) return { text: '', name: null };
    const parts = [];
    for (const f of files) {
        const node = getNode(resolvePath(f));
        if (!node) { output.innerHTML = `<span class="error">${escapeHtml(f)}: 没有那个文件或目录</span>`; return null; }
        if (node.type === 'dir') { output.innerHTML = `<span class="error">${escapeHtml(f)}: 是一个目录</span>`; return null; }
        if (!canRead(node)) { output.innerHTML = `<span class="error">${escapeHtml(f)}: 权限不够</span>`; return null; }
        parts.push(node.content || '');
    }
    return { text: parts.join('\n'), name: files.length === 1 ? files[0] : null };
}
// grep 核心：返回 [{no, text}]（no 为 1 起始行号）；无效正则按字面量处理
function grepLines(lines, pattern, opts) {
    opts = opts || {};
    let re;
    try { re = new RegExp(pattern, opts.i ? 'i' : ''); }
    catch (e) { re = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), opts.i ? 'i' : ''); }
    return lines
        .map((text, i) => ({ no: i + 1, text: text }))
        .filter(l => re.test(l.text) !== !!opts.v);
}
// sort 核心：-n 按数值，否则按本地化字典序
function sortLines(lines, opts) {
    const arr = lines.slice();
    arr.sort(opts && opts.n ? (a, b) => (parseFloat(a) || 0) - (parseFloat(b) || 0)
                                   : (a, b) => a.localeCompare(b, 'zh-Hans-CN'));
    return arr;
}
// 判断当前用户对节点是否有执行权限（owner/group/other 分位判断）
function canExecute(node) {
    if (cmdElevated) return true;
    const p = parseInt(node.permissions, 8) || 0;
    if (node.owner === state.currentUser) return !!(p & 0x40);
    if (myGroups().includes(node.group)) return !!(p & 0x8);
    return !!(p & 0x1);
}
// 当前用户所属的组列表
function myGroups() {
    return Object.entries(state.groups).filter(([g, v]) => (v.members || []).includes(state.currentUser)).map(([g]) => g);
}
// 读权限（owner/group/other 三段判断）
function canRead(node) {
    if (cmdElevated) return true;
    const p = parseInt(node.permissions, 8) || 0;
    if (node.owner === state.currentUser) return !!(p & 0x100);
    if (myGroups().includes(node.group)) return !!(p & 0x10);
    return !!(p & 0x4);
}
// 写权限
function canWrite(node) {
    if (cmdElevated) return true;
    const p = parseInt(node.permissions, 8) || 0;
    if (node.owner === state.currentUser) return !!(p & 0x80);
    if (myGroups().includes(node.group)) return !!(p & 0x10);
    return !!(p & 0x2);
}
// 通配符匹配：返回按字典序排列的匹配名（bash 默认 * 不跨目录、不匹配隐藏文件）
function globMatch(pattern) {
    const abs = resolvePath(pattern);
    const dirPart = abs.substring(0, abs.lastIndexOf('/')) || '/';
    const namePat = abs.substring(abs.lastIndexOf('/') + 1);
    const dirNode = getNode(dirPart);
    if (!dirNode || dirNode.type !== 'dir') return [];
    const re = new RegExp('^' + namePat.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.') + '$');
    const prefix = pattern.includes('/') ? pattern.slice(0, pattern.lastIndexOf('/') + 1) : '';
    return dirNode.children
        .filter(c => re.test(c.name) && (c.name.startsWith('.') === namePat.startsWith('.')))
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(c => prefix + c.name);
}
// 对命令参数做通配符展开（保留命令名、sudo、-name/-iname 的参数不展开）
function expandArgs(args) {
    const out = [];
    for (let i = 0; i < args.length; i++) {
        const a = args[i];
        if (i === 0 || a === 'sudo' || (i > 0 && (args[i - 1] === '-name' || args[i - 1] === '-iname'))) { out.push(a); continue; }
        if ((a.includes('*') || a.includes('?')) && !a.startsWith('-')) {
            const m = globMatch(a);
            out.push(...(m.length ? m : [a]));
        }
        else out.push(a);
    }
    return out;
}
// 交互终端的环境变量展开
function expandEnv(s) {
    return String(s).replace(/\$(USER|HOME|PWD|SHELL|HOSTNAME)/g, (m, v) =>
        v === 'USER' ? state.currentUser :
        v === 'HOME' ? '/home/' + state.currentUser :
        v === 'PWD' ? cwd :
        v === 'SHELL' ? '/bin/bash' : deviceName);
}
function executeCommand(rawCmd) {
    const output = document.createElement('div');
    output.className = 'output-row';
    output.contentEditable = true;
    lastExit = 0;
    let args = expandArgs(rawCmd.split(/\s+/));
    // sudo 时间戳只对带 sudo 前缀的命令生效（与真实 Ubuntu 一致）
    cmdElevated = state.isRoot || (args[0] === 'sudo' && state.sudoAuthenticated);
    let baseCmd = args[0] === 'sudo' ? args[1] : args[0];
    // Per-script read pools for simulation
let scriptReadPools = {
        'input_func.sh': ['张三'], 'input.sh': ['张三'],
    };
    switch(baseCmd) {
        //  ─── 🚀 【完美补全】：高仿真 gpasswd 控制内核 ───
        case 'gpasswd': let opt = args.indexOf('-a') !== -1 ? '-a' : (args.indexOf('-d') !== -1 ? '-d' : '');
        let userArg = args[args.indexOf(opt) + 1];
        let groupArg = args[args.indexOf(opt) + 2];
        if (!userArg || !groupArg) {
            output.innerHTML = `<span class="error">用法: gpasswd [选项] 组</span>\n选项:\n -a, --add USER 将用户添加到组\n -d, --delete USER 将用户从组中删除`;
        }
        else if (!state.groups[groupArg]) {
            output.innerHTML = `<span class="error">gpasswd: 组 '${escapeHtml(groupArg)}' 不存在</span>`;
        }
        else if (!state.users[userArg]) {
            output.innerHTML = `<span class="error">gpasswd: 用户 '${escapeHtml(userArg)}' 不存在</span>`;
        }
        else if (opt === '-a') {
            if (!state.groups[groupArg].members) state.groups[groupArg].members = [];
            if (state.groups[groupArg].members.includes(userArg)) {
                output.innerHTML = `<span class="error">gpasswd: 用户 '${escapeHtml(userArg)}' 已经是组 '${escapeHtml(groupArg)}' 的成员</span>`;
            }
            else {
                state.groups[groupArg].members.push(userArg);
                output.innerText = `Adding user ${userArg} to group ${groupArg} `;
            }
        }
        else if (opt === '-d') {
            if (!state.groups[groupArg].members || !state.groups[groupArg].members.includes(userArg)) {
                output.innerHTML = `<span class="error">gpasswd: 用户 '${escapeHtml(userArg)}' 不是组 '${escapeHtml(groupArg)}' 的成员</span>`;
            }
            else {
                state.groups[groupArg].members = state.groups[groupArg].members.filter(m => m !== userArg);
                output.innerText = `Removing user ${userArg} from group ${groupArg} `;
            }
        }
        else {
            output.innerHTML = `<span class="error">gpasswd: 缺少选项 -a 或 -d</span>`;
        }
        break;
        case 'groupmod': {
            let gmArgs = args.filter(a => a !== 'sudo' && a !== 'groupmod');
            let gmNewName = '';
            let gmNewGid = 0;
            for (let i = 0;
            i < gmArgs.length;
            i++) {
                if (gmArgs[i] === '-n' && gmArgs[i+1]) {
                    gmNewName = gmArgs[++i];
                }
                else if (gmArgs[i] === '-g' && gmArgs[i+1]) {
                    gmNewGid = parseInt(gmArgs[++i]);
                }
            }
            let gmPositional = gmArgs.filter(a => !a.startsWith('-') && a !== gmNewName);
            let targetG = gmPositional[gmPositional.length - 1];
            if (targetG && state.groups[targetG]) {
                let backupObj = state.groups[targetG];
                if (gmNewGid) backupObj.gid = gmNewGid;
                if (gmNewName && gmNewName !== targetG) {
                    if (state.groups[gmNewName]) {
                        output.innerHTML = `<span class="error">groupmod: 组 '${escapeHtml(gmNewName)}' 已存在</span>`;
                    }
                    else {
                        state.groups[gmNewName] = backupObj;
                        delete state.groups[targetG];
                        output.innerText = `groupmod: 组 '${targetG}' 已重命名为 '${gmNewName}'`;
                    }
                }
            }
            else if (targetG) {
                output.innerHTML = `<span class="error">groupmod: 组 '${escapeHtml(targetG)}' 不存在</span>`;
            }
            break;
        }
        case 'groupadd': case 'addgroup': let newGName = sanitizeName(args[args.length - 1]);
        let idxGAdd = args.indexOf('--gid');
        let allocatedGID = Math.floor(Math.random()*100)+1100;
        if (idxGAdd !== -1 && args[idxGAdd + 1]) allocatedGID = parseInt(args[idxGAdd + 1]);
        if (newGName && !state.groups[newGName]) {
            state.groups[newGName] = {
                gid: allocatedGID, members: []
            };
            output.innerText = `Adding group \`${newGName}' (${allocatedGID} ) ... 完成`;
        }
        else if (newGName) {
            output.innerHTML = `<span class="error">groupadd: 组 '${escapeHtml(newGName)}' 已存在</span>`;
        }
        break;
        case 'groupdel': case 'delgroup': let targetDelGroup = '';
        let cleanArgs = args.filter(a => a !== 'sudo' && a !== 'groupdel' && a !== 'delgroup' && !a.startsWith('-'));
        if (cleanArgs.length > 0) targetDelGroup = cleanArgs[0];
        if (!targetDelGroup) {
            output.innerHTML = `<span class="error">groupdel: 未指定组名</span>`;
        }
        else if (state.groups[targetDelGroup]) {
            delete state.groups[targetDelGroup];
            output.innerText = `groupdel: 组 '${targetDelGroup}' 已删除`;
        }
        else {
            output.innerHTML = `<span class="error">groupdel: 组 '${escapeHtml(targetDelGroup)}' 不存在</span>`;
        }
        break;
        // ─── 基础文本命令：echo / date / history / man ───
        case 'true': break;
        case 'false': output.innerHTML = ''; break;
        case 'echo': {
            let text = rawCmd.replace(/^\s*(sudo\s+)?echo\s*/, '');
            let noNL = false;
            if (/^-n\s/.test(text)) { noNL = true; text = text.replace(/^-n\s*/, ''); }
            text = text.replace(/^(['"])([\s\S]*)\1$/, '$2');
            text = expandEnv(text);
            output.innerText = text + (noNL ? '' : '\n');
            break;
        }
        case 'date': {
            const WD = ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'];
            const MON2 = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
            const n = new Date();
            const p2 = v => String(v).padStart(2, '0');
            output.innerText = `${n.getFullYear()}年 ${MON2[n.getMonth()]} ${n.getDate()}日 ${WD[n.getDay()]} ${p2(n.getHours())}:${p2(n.getMinutes())}:${p2(n.getSeconds())} CST`;
            break;
        }
        case 'history': {
            output.innerText = cmdHistory.map((h, i) => String(i + 1).padStart(4) + '  ' + h).join('\n');
            break;
        }
        case 'man': {
            const MAN_PAGES = {
                'ls': 'LS(1)\n\n名称\n    ls - 列出目录内容\n\n用法\n    ls [选项]... [文件]...\n\n常用选项\n    -a  显示所有条目（包括以 . 开头的）\n    -l  使用长格式列出\n    -h  与 -l 一起使用，以人类可读的单位显示大小',
                'cat': 'CAT(1)\n\n名称\n    cat - 连接文件并打印到标准输出\n\n用法\n    cat [选项]... [文件]...\n\n说明\n    没有指定文件时读取标准输入（支持管道）',
                'grep': 'GREP(1)\n\n名称\n    grep - 打印匹配模式的行\n\n用法\n    grep [选项]... 模式 [文件]...\n\n常用选项\n    -i  忽略大小写\n    -n  显示行号\n    -v  反转匹配\n    -c  只输出匹配行的数量',
                'head': 'HEAD(1)\n\n名称\n    head - 输出文件的前几行\n\n用法\n    head [选项]... [文件]...\n\n常用选项\n    -n N  输出前 N 行（默认 10）',
                'tail': 'TAIL(1)\n\n名称\n    tail - 输出文件的最后几行\n\n用法\n    tail [选项]... [文件]...\n\n常用选项\n    -n N  输出最后 N 行（默认 10）',
                'wc': 'WC(1)\n\n名称\n    wc - 统计每个文件的行数、单词数和字节数\n\n用法\n    wc [选项]... [文件]...\n\n常用选项\n    -l 行数  -w 单词数  -c 字节数',
                'chmod': 'CHMOD(1)\n\n名称\n    chmod - 更改文件模式（权限）\n\n用法\n    chmod [选项]... 模式[,模式]... 文件...\n\n常用模式\n    u/g/o ± r/w/x，或八进制（如 755）',
                'chown': 'CHOWN(1)\n\n名称\n    chown - 更改文件所有者和组\n\n用法\n    chown [选项]... [所有者][:[组]] 文件...\n\n常用选项\n    -R  递归处理目录及其内容',
                'useradd': 'USERADD(8)\n\n名称\n    useradd - 创建新用户或更新默认新用户信息\n\n用法\n    useradd [选项] 登录名\n\n常用选项\n    -m  创建用户主目录\n    -g  指定主组'
            };
            const manCmd = (args.find(a => !a.startsWith('-') && a !== 'man' && a !== 'sudo') || '').trim();
            if (!manCmd) output.innerHTML = `<span class="error">您要寻找的手册页是什么？</span>`;
            else if (MAN_PAGES[manCmd]) output.innerText = MAN_PAGES[manCmd];
            else output.innerHTML = `<span class="error">没有 ${escapeHtml(manCmd)} 的 manual 条目</span>`;
            break;
        }
        // ─── 文本处理：grep / head / tail / wc / sort（支持管道 stdin）───
        case 'grep': {
            let optI = false, optN = false, optV = false, optC = false;
            const rest = [];
            for (const a of args) {
                if (a === 'sudo' || a === 'grep') continue;
                if (/^-[invci]+$/.test(a)) {
                    if (a.includes('i')) optI = true;
                    if (a.includes('n')) optN = true;
                    if (a.includes('v')) optV = true;
                    if (a.includes('c')) optC = true;
                }
                else rest.push(a);
            }
            if (rest.length === 0) { output.innerHTML = `<span class="error">用法: grep [选项]... 模式 [文件]...</span>`; break; }
            const src = readInputStream(rest.slice(1), output);
            if (src === null) break;
            const picked = grepLines(src.text.split('\n'), rest[0], { i: optI, v: optV });
            lastExit = picked.length ? 0 : 1;   // 真实 grep 无匹配时退出码为 1
            if (optC) output.innerText = String(picked.length);
            else output.innerText = picked.map(l => (optN ? l.no + ':' : '') + escapeHtml(l.text)).join('\n');
            break;
        }
        case 'head':
        case 'tail': {
            const isHead = baseCmd === 'head';
            let n = 10;
            const rest = [];
            const hArgs = args.filter(a => a !== 'sudo' && a !== baseCmd);
            for (let i = 0; i < hArgs.length; i++) {
                if (hArgs[i] === '-n' && hArgs[i + 1]) { n = parseInt(hArgs[i + 1], 10) || 10; i++; }
                else if (/^-\d+$/.test(hArgs[i])) n = parseInt(hArgs[i].slice(1), 10);
                else if (!hArgs[i].startsWith('-')) rest.push(hArgs[i]);
            }
            const src = readInputStream(rest, output);
            if (src === null) break;
            let lines = src.text.split('\n');
            if (lines.length && lines[lines.length - 1] === '') lines.pop();
            const picked = isHead ? lines.slice(0, n) : lines.slice(Math.max(0, lines.length - n));
            output.innerText = picked.map(escapeHtml).join('\n');
            break;
        }
        case 'wc': {
            let onlyL = false, onlyW = false, onlyC = false;
            const rest = [];
            for (const a of args) {
                if (a === 'sudo' || a === 'wc') continue;
                if (a === '-l') { onlyL = true; continue; }
                if (a === '-w') { onlyW = true; continue; }
                if (a === '-c') { onlyC = true; continue; }
                if (!a.startsWith('-')) rest.push(a);
            }
            const src = readInputStream(rest, output);
            if (src === null) break;
            const text = src.text;
            const nl = text === '' ? 0 : text.replace(/\n$/, '').split('\n').length;
            const nw = text.trim() ? text.trim().split(/\s+/).length : 0;
            const fields = onlyL ? [nl] : onlyW ? [nw] : onlyC ? [text.length] : [nl, nw, text.length];
            output.innerText = fields.map(v => String(v).padStart(8)).join('') + (src.name ? ' ' + src.name : '');
            break;
        }
        case 'sort': {
            let rev = false, num = false;
            const rest = [];
            for (const a of args) {
                if (a === 'sudo' || a === 'sort') continue;
                if (a === '-r') { rev = true; continue; }
                if (a === '-n') { num = true; continue; }
                if (!a.startsWith('-')) rest.push(a);
            }
            const src = readInputStream(rest, output);
            if (src === null) break;
            let lines = src.text.split('\n');
            if (lines.length && lines[lines.length - 1] === '') lines.pop();
            lines = sortLines(lines, { n: num });
            if (rev) lines.reverse();
            output.innerText = lines.map(escapeHtml).join('\n');
            break;
        }
        // ─── 链接与属主：ln / chown / chgrp ───
        case 'ln': {
            let sym = false;
            const rest = [];
            for (const a of args) {
                if (a === 'sudo' || a === 'ln') continue;
                if (a === '-s') { sym = true; continue; }
                if (!a.startsWith('-')) rest.push(a);
            }
            if (rest.length === 0) { output.innerHTML = `<span class="error">ln: 缺少文件操作数</span>`; break; }
            if (rest.length < 2) { output.innerHTML = `<span class="error">ln: 缺少目标文件操作数</span>`; break; }
            const tgt = rest[0], linkName = rest[1];
            const abs = resolvePath(linkName);
            if (getNode(abs)) { output.innerHTML = `<span class="error">ln: 创建符号链接 '${escapeHtml(linkName)}' 失败: 文件已存在</span>`; break; }
            const { parent, name } = getParentAndName(abs);
            if (!parent || parent.type !== 'dir') { output.innerHTML = `<span class="error">ln: ${escapeHtml(linkName)}: 没有那个文件或目录</span>`; break; }
            if (sym) {
                parent.children.push(link(name, tgt));
            }
            else {
                const srcNode = getNode(resolvePath(tgt));
                if (!srcNode) { output.innerHTML = `<span class="error">ln: 无法创建硬链接 '${escapeHtml(linkName)}': 没有那个文件或目录</span>`; break; }
                parent.children.push(file(name, srcNode.permissions, state.currentUser, state.currentUser, srcNode.size, srcNode.content));
            }
            break;
        }
        case 'chown':
        case 'chgrp': {
            const isChown = baseCmd === 'chown';
            const cArgs = args.filter(a => a !== 'sudo' && a !== baseCmd && a !== '-R');
            if (cArgs.length < 2) { output.innerHTML = `<span class="error">${isChown ? 'chown' : 'chgrp'}: 缺少操作数</span>`; break; }
            const spec = cArgs[0];
            const files = cArgs.slice(1);
            let owner = null, grp = null;
            if (isChown) {
                const ci = spec.indexOf(':');
                owner = ci >= 0 ? spec.slice(0, ci) : spec;
                grp = ci >= 0 ? spec.slice(ci + 1) : null;
                if (owner && !state.users[owner]) { output.innerHTML = `<span class="error">chown: 无效的用户: '${escapeHtml(owner)}'</span>`; break; }
                if (ci >= 0 && spec.length === 1) { output.innerHTML = `<span class="error">chown: 无效的属主: '${escapeHtml(spec)}'</span>`; break; }
            }
            else grp = spec;
            if (grp && !state.groups[grp]) { output.innerHTML = `<span class="error">${isChown ? 'chown' : 'chgrp'}: 无效的组: '${escapeHtml(grp)}'</span>`; break; }
            for (const f of files) {
                const node = getNode(resolvePath(f));
                if (!node) { output.innerHTML = `<span class="error">${isChown ? 'chown' : 'chgrp'}: 无法访问 '${escapeHtml(f)}': 没有那个文件或目录</span>`; break; }
                if (!cmdElevated && node.owner !== state.currentUser) {
                    output.innerHTML = `<span class="error">${isChown ? 'chown' : 'chgrp'}: 更改 '${escapeHtml(f)}' 的所有者失败: 只允许超级用户修改</span>`;
                    break;
                }
                if (isChown && owner) node.owner = owner;
                if (grp) node.group = grp;
            }
            break;
        }
        case 'id': {
            let idArgs = args.filter(a => a !== 'sudo' && a !== 'id');
            let idName = idArgs[0] || state.currentUser;
            if (idName === 'root') {
                output.innerText = `uid=0(root) gid=0(root) 组=0(root)`;
            }
            else if (state.users[idName]) {
                let u = state.users[idName];
                let primaryGid = state.groups[idName] ? state.groups[idName].gid : u.uid;
                let groupList = `${primaryGid} (${idName} )`;
                for (let g in state.groups) {
                    if (g === idName) continue;
                    if (state.groups[g].members && state.groups[g].members.includes(idName)) {
                        groupList += `,${ state.groups[g].gid } (${g} )`;
                    }
                }
                output.innerText = `uid=${u.uid} (${idName} ) gid=${primaryGid} (${idName} ) 组=${groupList} `;
            }
            else {
                output.innerHTML = `<span class="error">id: '${escapeHtml(idName)}': no such user</span>`;
            }
            break;
        }
        case 'whoami': output.innerText = state.currentUser;
        break;
        case 'hostname': output.innerText = deviceName;
        break;
        case 'uname': {
            let uArgs = args.filter(a => a !== 'sudo' && a !== 'uname');
            if (uArgs.includes('-a')) {
                output.innerText = `Linux ${deviceName} 6.8.0-generic #1 SMP PREEMPT_DYNAMIC x86_64 GNU/Linux`;
            }
            else {
                output.innerText = 'Linux';
            }
            break;
        }
        case 'groups': {
            let grpArgs = args.filter(a => a !== 'sudo' && a !== 'groups');
            let gName = grpArgs[0] || state.currentUser;
            if (gName === 'root') {
                output.innerText = `root : root`;
            }
            else if (!state.users[gName]) {
                output.innerHTML = `<span class="error">groups: '${escapeHtml(gName)}': no such user</span>`;
            }
            else {
                let memberships = [];
                for (let g in state.groups) {
                    if (state.groups[g].members && state.groups[g].members.includes(gName)) memberships.push(g);
                }
                output.innerText = `${gName} : ${ memberships.join(' ') } `;
            }
            break;
        }
        case 'users-admin': if (!state.gnomeInstalled) {
            output.innerHTML = `<span class="error">未找到 'users-admin' 命令，请先安装。</span>`;
        }
        else {
            output.innerHTML = ` <div class="ubuntu-photo-gui" id="userMainGui"> <div class="photo-gui-title">用户设置 <div class="photo-gui-close">✕</div></div> <div class="photo-gui-content"> <div class="photo-left-pane"> <div class="photo-user-container"> ${ Object.keys(state.users).map(u => ` <div class="photo-user-item ${ u===state.currentUser?'active':'' } " onclick="selectPhotoUser('${u}', this)"> <div class="photo-avatar-small">👤</div> <div class="photo-item-text"> <span class="photo-item-uname">${u}
            </span> <span class="photo-item-rname">${
                state.users[u].real
            }
            </span> </div> </div> `).join('') } </div> <div class="photo-twin-btn-group"> <div class="photo-twin-btn" onclick="addUserInGui(this)">添加(A)</div> <div class="photo-twin-btn" onclick="deleteUserInGui(this)">删除(D)</div> </div> <div class="photo-single-btn" onclick="openGroupModal()">管理组(M)</div> </div> <div class="photo-right-pane"> <div class="photo-right-header"> <div class="photo-avatar-large">👤</div> <span class="photo-username-large photo-r-name">${state.currentUser} </span> </div> <div class="photo-detail-row"> <div><span class="photo-label-area">账户类型(T):</span><span class="photo-label-value photo-r-type">自定义</span></div> <button class="photo-gtk-btn">更改(C)...</button> </div> <div class="photo-detail-row"> <div><span class="photo-label-area">密码(P):</span><span class="photo-label-value photo-r-pwd">登录时询问</span></div> <button class="photo-gtk-btn">更改(C)...</button> </div> <button class="photo-gtk-btn" style="align-self: flex-end; margin-top: auto; margin-bottom: 5px;">高级设置(A):</button> </div> </div> <div class="photo-gui-footer"> <button class="photo-gtk-btn">帮助(H)</button> <button class="photo-gtk-btn">关闭(C)</button> </div> </div>`;
        }
        break;
        case 'groups-admin': if (!state.gnomeInstalled) {
            output.innerHTML = `<span class="error">未找到 'groups-admin' 命令，请先安装。</span>`;
        }
        else {
            output.innerHTML = ` <div class="ubuntu-photo-gui" id="groupMainGui"> <div class="photo-gui-title">组设置 <div class="photo-gui-close" onclick="this.closest('.ubuntu-photo-gui').remove()">✕</div></div> <div class="photo-gui-content"> <div class="photo-left-pane"> <div class="photo-user-container" id="groupMainListBox"> ${ Object.keys(state.groups).map(g => ` <div class="photo-user-item" onclick="selectMainGroupItem('${g}', this)"> <div class="photo-avatar-small">👥</div> <div class="photo-item-text"> <span class="photo-item-uname">${g}
            </span> <span class="photo-item-rname">GID: ${
                state.groups[g].gid
            }
            </span> </div> </div> `).join('') } </div> <div class="photo-twin-btn-group"> <div class="photo-twin-btn" onclick="addGroupInMainGui(this)">添加(A)</div> <div class="photo-twin-btn" onclick="deleteGroupInMainGui(this)">删除(D)</div> </div> </div> <div class="photo-right-pane"> <div class="photo-right-header"> <div class="photo-avatar-large">👥</div> <span class="photo-username-large" id="groupMainName">${ Object.keys(state.groups)[0] || '' } </span> </div> <div class="photo-detail-row"> <div><span class="photo-label-area">组ID(G):</span><span class="photo-label-value" id="groupMainGid">${ state.groups[Object.keys(state.groups)[0]]?.gid || '' } </span></div> </div> <div class="photo-detail-row" style="flex-direction:column;"> <span class="photo-label-area">组成员:</span> <div id="groupMainMembers" style="margin-top:5px;font-size:12px;max-height:120px;overflow-y:auto;"> ${ (state.groups[Object.keys(state.groups)[0]]?.members || []).map(m => `<div style="padding:2px 5px;">${m}
            </div>`).join('') || '<div style="color:#888;padding:2px 5px;">无成员</div>' } </div> </div> <div class="photo-twin-btn-group" style="margin-top:auto;"> <div class="photo-twin-btn" onclick="addMemberInMainGui(this)">添加成员(A)</div> <div class="photo-twin-btn" onclick="removeMemberInMainGui(this)">移除成员(R)</div> </div> </div> </div> <div class="photo-gui-footer"> <button class="photo-gtk-btn" onclick="this.closest('.ubuntu-photo-gui').remove()">关闭(C)</button> </div> </div>`;
        }
        break;
        case 'cat': {
            let catFiles = args.filter(a => a !== 'sudo' && a !== 'cat');
            if (catFiles.length === 0) {
                if (typeof pipeStdin === 'string') output.innerText = pipeStdin;
                else output.innerHTML = `<span class="error">cat: 缺少文件操作数</span>`;
                break;
            }
            let catOutput = [];
            for (let catFile of catFiles) {
                if (catFile === '/etc/group') {
                    let txt = '';
                    for (let g in state.groups) {
                        txt += `${escapeHtml(g)} :x:${ state.groups[g].gid } :${ (state.groups[g].members||[]).map(escapeHtml).join(',') } \n`;
                    }
                    catOutput.push(txt.trim());
                }
                else if (catFile === '/etc/passwd') {
                    let txt = '';
                    for (let u in state.users) {
                        txt += `${escapeHtml(u)} :x:${ state.users[u].uid } :1000::/home/${escapeHtml(u)} :/bin/bash\n`;
                    }
                    catOutput.push(txt.trim());
                }
                else if (catFile === '/etc/shadow') {
                    if (!state.isRoot && !state.sudoAuthenticated) {
                        catOutput.push(`<span class="error">cat: /etc/shadow: 权限不够</span>`);
                    }
                    else {
                        let txt = '';
                        for (let u in state.users) {
                            txt += `${escapeHtml(u)} :${ state.passwords[u] ? '!' : '*' } :19876:0:99999:7:::\n`;
                        }
                        catOutput.push(txt.trim());
                    }
                }
                else if (catFile === '/etc/gshadow') {
                    if (!state.isRoot && !state.sudoAuthenticated) {
                        catOutput.push(`<span class="error">cat: /etc/gshadow: 权限不够</span>`);
                    }
                    else {
                        let txt = '';
                        for (let g in state.groups) {
                            txt += `${escapeHtml(g)} :*::${ (state.groups[g].members||[]).map(escapeHtml).join(',') } \n`;
                        }
                        catOutput.push(txt.trim());
                    }
                }
                else {
                    let absPath = resolvePath(catFile);
                    let node = getNode(absPath);
                    if (!node) {
                        catOutput.push(`<span class="error">cat: ${escapeHtml(catFile)} : 没有那个文件或目录</span>`);
                    }
                    else if (node.type === 'dir') {
                        catOutput.push(`<span class="error">cat: ${escapeHtml(catFile)} : 是一个目录</span>`);
                    }
                    else if (node.type === 'link') {
                        catOutput.push(`<span class="error">cat: ${escapeHtml(catFile)} : 是一个符号链接</span>`);
                    }
                    else if (!canRead(node)) {
                        catOutput.push(`<span class="error">cat: ${escapeHtml(catFile)}: 权限不够</span>`);
                    }
                    else {
                        catOutput.push(escapeHtml(node.content || ''));
                    }
                }
            }
            output.innerHTML = catOutput.join('\n');
            break;
        }
        //  ─── useradd 命令 ───
        case 'useradd': {
            let uOpts = {
                home: false, dir: '', shell: '/bin/bash', gid: '', groups: '', uid: 0, createUserGroup: true
            };
            let newUser = '';
            let uaArgs = args.filter(a => a !== 'sudo' && a !== 'useradd');
            for (let i = 0;
            i < uaArgs.length;
            i++) {
                if (uaArgs[i] === '-m') {
                    uOpts.home = true;
                }
                else if (uaArgs[i] === '-M') {
                    uOpts.home = false;
                }
                else if (uaArgs[i] === '-d' && uaArgs[i+1]) {
                    uOpts.dir = uaArgs[++i];
                    uOpts.home = true;
                }
                else if (uaArgs[i] === '-s' && uaArgs[i+1]) {
                    uOpts.shell = uaArgs[++i];
                }
                else if (uaArgs[i] === '-g' && uaArgs[i+1]) {
                    uOpts.gid = uaArgs[++i];
                }
                else if (uaArgs[i] === '-G' && uaArgs[i+1]) {
                    uOpts.groups = uaArgs[++i];
                }
                else if (uaArgs[i] === '-u' && uaArgs[i+1]) {
                    uOpts.uid = parseInt(uaArgs[++i]);
                }
                else if (uaArgs[i] === '-N') {
                    uOpts.createUserGroup = false;
                }
                else if (!uaArgs[i].startsWith('-')) {
                    newUser = uaArgs[i];
                }
            }
            if (!newUser) {
                output.innerHTML = `<span class="error">useradd: 未指定用户名\n用法: useradd [选项] 登录</span>`;
            }
            else if (state.users[newUser]) {
                output.innerHTML = `<span class="error">useradd: 用户 '${escapeHtml(newUser)}' 已存在</span>`;
            }
            else {
                newUser = sanitizeName(newUser);
                if (!newUser) { output.innerHTML = `<span class="error">useradd: 无效的用户名</span>`; break; }
                let newUid = uOpts.uid || (Math.max(1000, ...Object.values(state.users).map(u => u.uid)) + 1);
                state.users[newUser] = {
                    uid: newUid, real: newUser, type: '标准', pwdState: '登录时询问'
                };
                if (uOpts.createUserGroup && !state.groups[newUser]) {
                    state.groups[newUser] = {
                        gid: newUid, members: [newUser]
                    };
                }
                if (uOpts.gid) {
                    for (let g in state.groups) {
                        if (String(state.groups[g].gid) === String(uOpts.gid)) {
                            if (!state.groups[g].members.includes(newUser)) state.groups[g].members.push(newUser);
                            break;
                        }
                    }
                }
                if (uOpts.groups) {
                    uOpts.groups.split(',').forEach(grp => {
                        if (state.groups[grp] && !state.groups[grp].members.includes(newUser)) {
                            state.groups[grp].members.push(newUser);
                        }
                    }
                    );
                }
                let homeDir = uOpts.dir || `/home/${newUser} `;
                if (uOpts.home !== false) {
                    let homeParent = getNode('/home');
                    if (homeParent && homeParent.type === 'dir' && !homeParent.children.find(c => c.name === newUser)) {
                        homeParent.children.push(dir(newUser, '755', newUser, newUser, [
                            file('.bashrc', '644', newUser, newUser, 3771, ''),
                            file('.profile', '644', newUser, newUser, 807, '')
                        ]));
                    }
                }
                output.innerText = `正在创建用户 '${newUser}'...\n正在添加新用户 '${newUser}' 到组 ${ uOpts.createUserGroup ? newUser : 'users' } ...\n创建主目录 '${homeDir}'...\n正在从 '/etc/skel' 复制文件...\nadduser: 新用户已创建`;
            }
            break;
        }
        //  ─── adduser 命令（交互式简化版）───
        case 'adduser': {
            let auUser = args.filter(a => a !== 'sudo' && a !== 'adduser' && !a.startsWith('-'))[0];
            if (!auUser) {
                output.innerHTML = `<span class="error">adduser: 请指定用户名\n用法: adduser [选项] 用户名</span>`;
            }
            else if (state.users[auUser]) {
                output.innerHTML = `<span class="error">adduser: 用户 '${escapeHtml(auUser)}' 已存在</span>`;
            }
            else {
                auUser = sanitizeName(auUser);
                if (!auUser) { output.innerHTML = `<span class="error">adduser: 无效的用户名</span>`; break; }
                let newUid = Math.max(1000, ...Object.values(state.users).map(u => u.uid)) + 1;
                state.users[auUser] = {
                    uid: newUid, real: auUser, type: '标准', pwdState: '登录时询问'
                };
                if (!state.groups[auUser]) {
                    state.groups[auUser] = {
                        gid: newUid, members: [auUser]
                    };
                }
                let homeParent = getNode('/home');
                if (homeParent && homeParent.type === 'dir' && !homeParent.children.find(c => c.name === auUser)) {
                    homeParent.children.push(dir(auUser, '755', auUser, auUser, [
                        file('.bashrc', '644', auUser, auUser, 3771, ''),
                        file('.profile', '644', auUser, auUser, 807, '')
                    ]));
                }
                output.innerText = `正在添加用户 '${auUser}'...\n正在添加新组 '${auUser}' (${newUid} )...\n正在创建新主目录 '/home/${auUser}'...\n正在从 '/etc/skel' 复制文件...\n新的 密码：\n重新输入新的 密码：\npasswd: 密码已成功地更改\n正在改变 '${auUser}' 的用户信息\n请输入新值，或直接敲回车以使用默认值\n\t全名 []: \n\t房间号码 []: \n\t工作电话 []: \n\t家庭电话 []: \n\t其它 []: \n这些信息是否正确？ [Y/n] Y`;
            }
            break;
        }
        //  ─── userdel 命令 ───
        case 'userdel': {
            let udArgs = args.filter(a => a !== 'sudo' && a !== 'userdel');
            let removeHome = udArgs.includes('-r');
            let delUser = udArgs.filter(a => !a.startsWith('-'))[0];
            if (!delUser) {
                output.innerHTML = `<span class="error">userdel: 未指定用户名\n用法: userdel [选项] 登录</span>`;
            }
            else if (!state.users[delUser]) {
                output.innerHTML = `<span class="error">userdel: 用户 '${escapeHtml(delUser)}' 不存在</span>`;
            }
            else if (delUser === state.currentUser) {
                output.innerHTML = `<span class="error">userdel: 不能删除当前登录的用户 '${escapeHtml(delUser)}'</span>`;
            }
            else {
                delete state.users[delUser];
                delete state.passwords[delUser];
                for (let g in state.groups) {
                    if (state.groups[g].members) {
                        state.groups[g].members = state.groups[g].members.filter(m => m !== delUser);
                    }
                }
                if (removeHome) {
                    let homeDir = getNode('/home');
                    if (homeDir && homeDir.type === 'dir') {
                        homeDir.children = homeDir.children.filter(c => c.name !== delUser);
                    }
                }
                let outText = removeHome ? `正在删除用户 '${delUser}'...\n正在删除 '/home/${delUser}' 目录...\nuserdel: 用户 '${delUser}' 已删除` : `正在删除用户 '${delUser}'...\nuserdel: 用户 '${delUser}' 已删除`;
                output.innerText = outText;
            }
            break;
        }
        //  ─── usermod 命令 ───
        case 'usermod': {
            let umArgs = args.filter(a => a !== 'sudo' && a !== 'usermod');
            let umPositional = umArgs.filter(a => !a.startsWith('-'));
            let umUser = umPositional[umPositional.length - 1];
            if (!umUser) {
                output.innerHTML = `<span class="error">usermod: 未指定用户名\n用法: usermod [选项] 登录</span>`;
                break;
            }
            if (!state.users[umUser]) {
                output.innerHTML = `<span class="error">usermod: 用户 '${escapeHtml(umUser)}' 不存在</span>`;
                break;
            }
            let umError = false;
            for (let i = 0;
            i < umArgs.length;
            i++) {
                if (umError) break;
                if (umArgs[i] === '-l' && umArgs[i+1]) {
                    let newName = umArgs[++i];
                    if (state.users[newName]) {
                        output.innerHTML = `<span class="error">usermod: 用户 '${escapeHtml(newName)}' 已存在</span>`;
                        umError = true;
                        break;
                    }
                    state.users[newName] = state.users[umUser];
                    state.users[newName].real = newName;
                    delete state.users[umUser];
                    if (state.passwords[umUser]) {
                        state.passwords[newName] = state.passwords[umUser];
                        delete state.passwords[umUser];
                    }
                    output.innerText = `用户 '${umUser}' 已更名为 '${newName}'`;
                    umUser = newName;
                }
                else if (umArgs[i] === '-d' && umArgs[i+1]) {
                    let newDir = umArgs[++i];
                    output.innerText = (output.innerText || '') + `用户 '${umUser}' 的主目录已更改为 '${newDir}'\n`;
                }
                else if (umArgs[i] === '-s' && umArgs[i+1]) {
                    let newShell = umArgs[++i];
                    output.innerText = (output.innerText || '') + `用户 '${umUser}' 的登录 Shell 已更改为 '${newShell}'\n`;
                }
                else if (umArgs[i] === '-g' && umArgs[i+1]) {
                    let newPrimary = umArgs[++i];
                    if (!state.groups[newPrimary]) {
                        output.innerHTML = `<span class="error">usermod: 组 '${escapeHtml(newPrimary)}' 不存在</span>`;
                        break;
                    }
                    if (!state.groups[newPrimary].members.includes(umUser)) state.groups[newPrimary].members.push(umUser);
                    output.innerText = (output.innerText || '') + `用户 '${umUser}' 的主组已更改为 '${newPrimary}'\n`;
                }
                else if (umArgs[i] === '-G' && umArgs[i+1]) {
                    let newGroups = umArgs[++i].split(',');
                    let primaryGroup = umUser;
                    for (let g in state.groups) {
                        if (g === primaryGroup) continue;
                        if (state.groups[g].members) state.groups[g].members = state.groups[g].members.filter(m => m !== umUser);
                    }
                    newGroups.forEach(grp => {
                        if (state.groups[grp]) {
                            if (!state.groups[grp].members) state.groups[grp].members = [];
                            if (!state.groups[grp].members.includes(umUser)) state.groups[grp].members.push(umUser);
                        }
                    }
                    );
                    output.innerText = (output.innerText || '') + `用户 '${umUser}' 的附加组已更改为 '${ newGroups.join(',') }'\n`;
                }
                else if (umArgs[i] === '-L') {
                    state.users[umUser].pwdState = '已锁定';
                    output.innerText = (output.innerText || '') + `用户 '${umUser}' 的密码已锁定\n`;
                }
                else if (umArgs[i] === '-U') {
                    state.users[umUser].pwdState = '登录时询问';
                    output.innerText = (output.innerText || '') + `用户 '${umUser}' 的密码已解锁\n`;
                }
            }
            if (!output.innerText) output.innerText = ``;
            break;
        }
        //  ─── passwd 命令 ───
        case 'passwd': {
            let pwArgs = args.filter(a => a !== 'sudo' && a !== 'passwd');
            let pwUser = pwArgs.filter(a => !a.startsWith('-'))[0] || state.currentUser;
            let lockMode = pwArgs.includes('-l');
            let unlockMode = pwArgs.includes('-u');
            let deleteMode = pwArgs.includes('-d');
            let statusMode = pwArgs.includes('-S');
            if (!state.users[pwUser]) {
                output.innerHTML = `<span class="error">passwd: 用户 '${escapeHtml(pwUser)}' 不存在</span>`;
            }
            else if (lockMode) {
                state.users[pwUser].pwdState = '已锁定';
                output.innerText = `passwd: 密码已成功更改 (锁定用户 '${pwUser}')`;
            }
            else if (unlockMode) {
                state.users[pwUser].pwdState = '登录时询问';
                output.innerText = `passwd: 密码已成功更改 (解锁用户 '${pwUser}')`;
            }
            else if (deleteMode) {
                state.users[pwUser].pwdState = '无密码';
                delete state.passwords[pwUser];
                output.innerText = `passwd: 密码已成功更改 (删除用户 '${pwUser}' 的密码)`;
            }
            else if (statusMode) {
                let pwdSt = state.users[pwUser].pwdState;
                output.innerText = `${pwUser} ${ pwdSt === '已锁定' ? 'L' : (pwdSt === '无密码' ? 'NP' : 'P') } ${ new Date().toISOString().split('T')[0] } 0 99999 7 -1`;
            }
            else {
                // Setting password interactively passwdTarget = pwUser;
                const row = document.createElement('div');
                row.className = 'output-row';
                row.innerText = `新的 密码：`;
                historyContainer.appendChild(row);
                currentMode = 'PASSWD_WAIT';
                promptSpan.innerText = '';
                updatePrompt();
                return;
            }
            break;
        }
        //  ─── su 命令 ───
        case 'su': {
            let suArgs = args.filter(a => a !== 'su');
            let suUser = suArgs.filter(a => !a.startsWith('-'))[0];
            let suLogin = suArgs.includes('-l') || suArgs.includes('-');
            if (!suUser && suLogin) suUser = 'root';
            if (!suUser) suUser = 'root';
            if (suUser === 'root') {
                if (state.isRoot || state.sudoAuthenticated) {
                    state.currentUser = 'root';
                    state.isRoot = true;
                    updatePrompt();
                }
                else {
                    output.innerHTML = `<span class="error">su: 认证失败</span>`;
                }
            }
            else if (!state.users[suUser]) {
                output.innerHTML = `<span class="error">su: 用户 '${escapeHtml(suUser)}' 不存在</span>`;
            }
            else {
                state.currentUser = suUser;
                state.isRoot = false;
                updatePrompt();
            }
            break;
        }
        //  ─── chage 命令（修改用户密码状态）───
        case 'chage': {
            let chArgs = args.filter(a => a !== 'sudo' && a !== 'chage');
            let chUser = chArgs.filter(a => !a.startsWith('-'))[0];
            let chList = chArgs.includes('-l');
            if (!chUser) {
                output.innerHTML = `<span class="error">chage: 未指定用户名\n用法: chage [选项] 登录</span>`;
            }
            else if (!state.users[chUser]) {
                output.innerHTML = `<span class="error">chage: 用户 '${escapeHtml(chUser)}' 不存在</span>`;
            }
            else if (chList) {
                output.innerText = `最近一次密码修改时间\t\t\t：1月 01, 2026\n密码过期时间\t\t\t\t：从不\n密码失效时间\t\t\t\t：从不\n账户过期时间\t\t\t\t：从不\n两次改变密码之间相距的最小天数\t\t：0\n两次改变密码之间相距的最大天数\t\t：99999\n在密码过期之前警告的天数\t\t\t：7`;
            }
            else {
                output.innerText = `chage: 已更新用户 '${chUser}' 的密码过期信息`;
            }
            break;
        }
        //  ─── w 命令 ───
        case 'w': {
            let now = new Date();
            let timeStr = now.toTimeString().split(' ')[0];
            let dateStr = `${ now.getFullYear() } -${ String(now.getMonth()+1).padStart(2,'0') } -${ String(now.getDate()).padStart(2,'0') } `;
            let uptimeDays = Math.floor(Math.random()*30)+1;
            let uptimeH = Math.floor(Math.random()*24);
            let uptimeM = Math.floor(Math.random()*60);
            let load1 = (Math.random()*2).toFixed(2);
            let load5 = (Math.random()*1.5).toFixed(2);
            let load15 = (Math.random()*1).toFixed(2);
            output.innerText = ` ${timeStr} up ${uptimeDays} days, ${uptimeH} :${ String(uptimeM).padStart(2,'0') } , 1 user, load average: ${load1} , ${load5} , ${load15} \nUSER TTY FROM LOGIN@ IDLE JCPU PCPU WHAT\n${state.currentUser} :0 :0 ${ dateStr.split('-')[1] } 月${ String(now.getDate()).padStart(2,'0') } ?xdm? 32:32 0.27s /usr/lib/upstart/upstart-user-session`;
            break;
        }
        //  ═══════════════════════════════════════════ // 虚拟文件系统命令 // ═══════════════════════════════════════════
        case 'pwd': output.innerText = cwd;
        break;
        case 'cd': {
            let cdTarget = args.filter(a => a !== 'sudo' && a !== 'cd')[0] || '/home/' + state.currentUser;
            if (cdTarget === '~') cdTarget = '/home/' + state.currentUser;
            if (cdTarget.startsWith('~/')) cdTarget = '/home/' + state.currentUser + cdTarget.slice(1);
            let absPath = resolvePath(cdTarget);
            let node = getNode(absPath);
            if (!node) {
                output.innerHTML = `<span class="error">bash: cd: ${escapeHtml(cdTarget)} : 没有那个文件或目录</span>`;
            }
            else if (node.type !== 'dir') {
                output.innerHTML = `<span class="error">bash: cd: ${escapeHtml(cdTarget)} : 不是目录</span>`;
            }
            else {
                cwd = absPath === '/' ? '/' : absPath;
                updatePrompt();
            }
            break;
        }
        case 'ls': {
            let lsArgs = args.filter(a => a !== 'sudo' && a !== 'ls');
            let showAll = lsArgs.includes('-a') || lsArgs.includes('-la') || lsArgs.includes('-al');
            let showLong = lsArgs.includes('-l') || lsArgs.includes('-la') || lsArgs.includes('-al');
            let showHuman = lsArgs.includes('-h');
            let targets = lsArgs.filter(a => !a.startsWith('-'));
            if (targets.length === 0) targets = [cwd];
            let allLines = [];
            for (let t of targets) {
                let absPath = resolvePath(t);
                let node = getNode(absPath);
                if (!node) {
                    allLines.push(`<span class="error">ls: 无法访问 '${escapeHtml(t)}': 没有那个文件或目录</span>`);
                    continue;
                }
                if (node.type === 'file') {
                    if (showLong) {
                        allLines.push(formatLsEntry(node, showAll));
                    }
                    else {
                        allLines.push(escapeHtml(node.name));
                    }
                    continue;
                }
                if (targets.length > 1) allLines.push(`${escapeHtml(absPath)} :`);
                let entries = [...node.children];
                if (showAll) {
                    entries.unshift( {
                        name: '.', type: 'dir', permissions: node.permissions, owner: node.owner, group: node.group, size: 4096, mtime: node.mtime, children: []
                    },
                    {
                        name: '..', type: 'dir', permissions: '755', owner: 'root', group: 'root', size: 4096, mtime: node.mtime, children: []
                    }
                    );
                }
                if (showLong) {
                    let total = entries.reduce((s, e) => s + Math.ceil(e.size / 1024), 0);
                    allLines.push(`total ${total} `);
                    for (let e of entries) {
                        let line = formatLsEntry(e, showAll);
                        if (showHuman) {
                            line = line.replace(/\s+\d+\s+(\d+月)/, (m, p1) => {
                                let sz = parseInt(m.match(/(\d+)\s+\d+月/)[1]);
                                return ' ' + formatSize(sz).padStart(8) + ' ' + p1;
                            }
                            );
                        }
                        allLines.push(line);
                    }
                }
                else {
                    let names = entries.map(e => {
                        if (e.type === 'dir') return `<span style="color:#4ae234;font-weight:bold;">${escapeHtml(e.name)} </span>`;
                        return escapeHtml(e.name);
                    }
                    );
                    allLines.push(names.join(' '));
                }
                if (targets.length > 1) allLines.push('');
            }
            output.innerHTML = allLines.join('<br>');
            break;
        }
        case 'mkdir': {
            let mkArgs = args.filter(a => a !== 'sudo' && a !== 'mkdir');
            let mkParents = mkArgs.includes('-p');
            let mkDirs = mkArgs.filter(a => !a.startsWith('-'));
            if (mkDirs.length === 0) {
                output.innerHTML = `<span class="error">mkdir: 缺少操作数</span>`;
                break;
            }
            for (let d of mkDirs) {
                let absPath = resolvePath(d);
                if (getNode(absPath)) {
                    output.innerHTML = `<span class="error">mkdir: 无法创建目录 '${escapeHtml(d)}': 文件已存在</span>`;
                    break;
                }
                if (mkParents) {
                    let parts = absPath.split('/').filter(Boolean);
                    let current = fsTree;
                    for (let p of parts) {
                        let child = current.children.find(c => c.name === p);
                        if (!child) {
                            let newNode = dir(p, '755', state.currentUser, state.currentUser);
                            current.children.push(newNode);
                            current = newNode;
                        }
                        else if (child.type === 'dir') {
                            current = child;
                        }
                        else {
                            output.innerHTML = `<span class="error">mkdir: 无法创建目录 '${escapeHtml(d)}': 不是目录</span>`;
                            break;
                        }
                    }
                }
                else {
                    let { parent, name } = getParentAndName(absPath);
                    if (!parent || parent.type !== 'dir') {
                        output.innerHTML = `<span class="error">mkdir: 无法创建目录 '${escapeHtml(d)}': 没有那个文件或目录</span>`;
                        break;
                    }
                    parent.children.push(dir(name, '755', state.currentUser, state.currentUser));
                    output.innerText = `mkdir: 已创建目录 '${d}'`;
                }
            }
            break;
        }
        case 'rmdir': {
            let rdArgs = args.filter(a => a !== 'sudo' && a !== 'rmdir');
            let rdDirs = rdArgs.filter(a => !a.startsWith('-'));
            if (rdDirs.length === 0) {
                output.innerHTML = `<span class="error">rmdir: 缺少操作数</span>`;
                break;
            }
            for (let d of rdDirs) {
                let absPath = resolvePath(d);
                let node = getNode(absPath);
                if (!node) {
                    output.innerHTML = `<span class="error">rmdir: 无法删除 '${escapeHtml(d)}': 没有那个文件或目录</span>`;
                    break;
                }
                if (node.type !== 'dir') {
                    output.innerHTML = `<span class="error">rmdir: 无法删除 '${escapeHtml(d)}': 不是目录</span>`;
                    break;
                }
                if (node.children.length > 0) {
                    output.innerHTML = `<span class="error">rmdir: 无法删除 '${escapeHtml(d)}': 目录非空</span>`;
                    break;
                }
                let { parent } = getParentAndName(absPath);
                parent.children = parent.children.filter(c => c.name !== node.name);
                output.innerText = `rmdir: 已删除空目录 '${d}'`;
            }
            break;
        }
        case 'touch': {
            let tcArgs = args.filter(a => a !== 'sudo' && a !== 'touch');
            let tcFiles = tcArgs.filter(a => !a.startsWith('-'));
            if (tcFiles.length === 0) {
                output.innerHTML = `<span class="error">touch: 缺少文件操作数</span>`;
                break;
            }
            for (let f of tcFiles) {
                let absPath = resolvePath(f);
                let node = getNode(absPath);
                if (node) {
                    node.mtime = new Date().toLocaleString('zh-CN');
                }
                else {
                    let { parent, name } = getParentAndName(absPath);
                    if (!parent || parent.type !== 'dir') {
                        output.innerHTML = `<span class="error">touch: 无法创建 '${escapeHtml(f)}': 没有那个文件或目录</span>`;
                        break;
                    }
                    parent.children.push(file(name, '644', state.currentUser, state.currentUser, 0, ''));
                    output.innerText = `touch: 已创建文件 '${f}'`;
                }
            }
            break;
        }
        case 'rm': {
            let rmArgs = args.filter(a => a !== 'sudo' && a !== 'rm');
            let rmRecursive = rmArgs.includes('-r') || rmArgs.includes('-rf') || rmArgs.includes('-R');
            let rmForce = rmArgs.includes('-f') || rmArgs.includes('-rf');
            let rmTargets = rmArgs.filter(a => !a.startsWith('-'));
            if (rmTargets.length === 0) {
                output.innerHTML = `<span class="error">rm: 缺少操作数</span>`;
                break;
            }
            for (let t of rmTargets) {
                let absPath = resolvePath(t);
                let node = getNode(absPath);
                if (!node) {
                    if (!rmForce) output.innerHTML = `<span class="error">rm: 无法删除 '${escapeHtml(t)}': 没有那个文件或目录</span>`;
                    break;
                }
                if (node.type === 'dir' && !rmRecursive) {
                    output.innerHTML = `<span class="error">rm: 无法删除 '${escapeHtml(t)}': 是一个目录</span>`;
                    break;
                }
                if (!canWrite(node)) {
                    output.innerHTML = `<span class="error">rm: 无法删除 '${escapeHtml(t)}': 权限不够</span>`;
                    break;
                }
                let { parent } = getParentAndName(absPath);
                parent.children = parent.children.filter(c => c.name !== node.name);
                output.innerText = `rm: 已删除 '${t}'`;
            }
            break;
        }
        case 'cp': {
            let cpArgs = args.filter(a => a !== 'sudo' && a !== 'cp');
            let cpRecursive = cpArgs.includes('-r') || cpArgs.includes('-R') || cpArgs.includes('-a');
            let cpTargets = cpArgs.filter(a => !a.startsWith('-'));
            if (cpTargets.length < 2) {
                output.innerHTML = `<span class="error">cp: 缺少了文件操作数</span>`;
                break;
            }
            let srcPath = resolvePath(cpTargets[0]);
            let dstPath = resolvePath(cpTargets[1]);
            let srcNode = getNode(srcPath);
            if (!srcNode) {
                output.innerHTML = `<span class="error">cp: 无法获取 '${escapeHtml(cpTargets[0])}' 的文件状态: 没有那个文件或目录</span>`;
                break;
            }
            if (srcNode.type === 'dir' && !cpRecursive) {
                output.innerHTML = `<span class="error">cp: -r 未指定; 略过目录 '${escapeHtml(cpTargets[0])}'</span>`;
                break;
            }
            let dstNode = getNode(dstPath);
            if (dstNode && dstNode.type === 'dir') {
                let newNode = JSON.parse(JSON.stringify(srcNode));
                newNode.name = srcNode.name;
                dstNode.children.push(newNode);
            }
            else {
                let { parent, name } = getParentAndName(dstPath);
                if (!parent || parent.type !== 'dir') {
                    output.innerHTML = `<span class="error">cp: 无法创建普通文件 '${escapeHtml(cpTargets[1])}': 没有那个文件或目录</span>`;
                    break;
                }
                let newNode = JSON.parse(JSON.stringify(srcNode));
                newNode.name = name;
                parent.children.push(newNode);
                output.innerText = `cp: 已复制 '${ cpTargets[0] }' -> '${ cpTargets[1] }'`;
            }
            break;
        }
        case 'chmod': {
            let cmArgs = args.filter(a => a !== 'sudo' && a !== 'chmod');
            if (cmArgs.length < 2) {
                output.innerHTML = `<span class="error">chmod: 缺少操作数</span>\n用法: chmod MODE FILE...`;
                break;
            }
            let mode = cmArgs[0];
            let cmFiles = cmArgs.slice(1);
            if (/^[0-7]{3,4}$/.test(mode)) {
                // numeric mode — ok
            }
            else if (/^[ugoa]*[-+=][rwx]+$/.test(mode)) {
                // symbolic mode like +x, u+x, go-w, a+rx — accept
            }
            else {
                output.innerHTML = `<span class="error">chmod: 无效的模式: '${escapeHtml(mode)}'</span>`;
                break;
            }
            for (let f of cmFiles) {
                let absPath = resolvePath(f);
                let node = getNode(absPath);
                if (!node) {
                    output.innerHTML = `<span class="error">chmod: 无法访问 '${escapeHtml(f)}': 没有那个文件或目录</span>`;
                    break;
                }
                if (!cmdElevated && node.owner !== state.currentUser) {
                    output.innerHTML = `<span class="error">chmod: 更改 '${escapeHtml(f)}' 的权限失败: 操作不允许</span>`;
                    break;
                }
                if (/^[0-7]{3,4}$/.test(mode)) {
                    node.permissions = mode;
                } else {
                    // Parse symbolic mode: [ugoa]*[-+=][rwx]+
                    let symMatch = mode.match(/^([ugoa]*)([-+=])([rwx]+)$/);
                    if (symMatch) {
                        let who = symMatch[1] || 'a';
                        let op = symMatch[2];
                        let perms = symMatch[3];
                        let permVal = (perms.includes('r') ? 4 : 0) + (perms.includes('w') ? 2 : 0) + (perms.includes('x') ? 1 : 0);
                        let cur = node.permissions || '644';
                        let u = parseInt(cur[0]) || 0, g = parseInt(cur[1]) || 0, o = parseInt(cur.length > 2 ? cur[2] : '0') || 0;
                        let targets = [];
                        for (let ch of who) {
                            if (ch === 'u' || ch === 'a') targets.push('u');
                            if (ch === 'g' || ch === 'a') targets.push('g');
                            if (ch === 'o' || ch === 'a') targets.push('o');
                        }
                        targets = [...new Set(targets)];
                        for (let t of targets) {
                            if (op === '+') { if (t === 'u') u |= permVal; else if (t === 'g') g |= permVal; else o |= permVal; }
                            else if (op === '-') { if (t === 'u') u &= ~permVal; else if (t === 'g') g &= ~permVal; else o &= ~permVal; }
                            else if (op === '=') { if (t === 'u') u = permVal; else if (t === 'g') g = permVal; else o = permVal; }
                        }
                        node.permissions = String(u) + String(g) + String(o);
                    }
                }
                output.innerText = `chmod: 已更改权限为 ${node.permissions} `;
            }
            break;
        }
        case 'find': {
            let fdArgs = args.filter(a => a !== 'sudo' && a !== 'find');
            let fdPath = cwd;
            let fdName = '';
            let fdType = '';
            let fdStart = 0;
            for (let i = 0;
            i < fdArgs.length;
            i++) {
                if (fdArgs[i] === '-name' && fdArgs[i+1]) {
                    fdName = fdArgs[++i];
                }
                else if (fdArgs[i] === '-type' && fdArgs[i+1]) {
                    fdType = fdArgs[++i];
                }
                else if (!fdArgs[i].startsWith('-') && i === 0) {
                    fdPath = fdArgs[i];
                }
            }
            let absStart = resolvePath(fdPath);
            let startNode = getNode(absStart);
            if (!startNode) {
                output.innerHTML = `<span class="error">find: '${escapeHtml(fdPath)}': 没有那个文件或目录</span>`;
                break;
            }
            let results = [];
            function searchDir(node, path) {
                let fullPath = path === '/' ? '/' + node.name : path + '/' + node.name;
                if (path === '') fullPath = '/' + node.name;
                if (absStart === '/' && path === '') fullPath = '/' + node.name;
                let matchName = !fdName || new RegExp('^' + fdName.replace(/\*/g, '.*').replace(/\?/g, '.') + '$').test(node.name);
                let matchType = !fdType || (fdType === 'd' && node.type === 'dir') || (fdType === 'f' && node.type === 'file') || (fdType === 'l' && node.type === 'link');
                if (matchName && matchType) results.push(fullPath);
                if (node.type === 'dir') {
                    for (let c of node.children) {
                        searchDir(c, fullPath);
                    }
                }
            }
            if (absStart === '/') {
                for (let c of startNode.children) {
                    searchDir(c, '');
                }
            }
            else {
                searchDir(startNode, absStart.replace(/\/[^/]+$/, ''));
            }
            output.innerText = results.length > 0 ? results.join('\n') : '';
            break;
        }
        case 'file': {
            let fileArgs = args.filter(a => a !== 'sudo' && a !== 'file');
            if (fileArgs.length === 0) {
                output.innerHTML = `<span class="error">file: 缺少操作数</span>`;
                break;
            }
            let lines = [];
            for (let f of fileArgs) {
                if (f.startsWith('/dev/sd')) {
                    let devName = f.replace('/dev/', '');
                    let disk = Object.values(diskPartitions).find(d => d.partitions.some(p => '/dev/sda' + p.num === f || f === '/dev/sda'));
                    if (f === '/dev/sda' || f === '/dev/sdb') {
                        lines.push(`${f} : block special`);
                    }
                    else {
                        let part = null;
                        for (let dk of Object.values(diskPartitions)) {
                            part = dk.partitions.find(p => '/dev/sda' + p.num === f);
                            if (part) break;
                        }
                        if (part) {
                            lines.push(`${f} : ${ part.fs === 'swap' ? 'Linux swap' : part.fs } filesystem (UUID=${ Math.random().toString(36).substr(2,8) } -${ Math.random().toString(36).substr(2,4) } -${ Math.random().toString(36).substr(2,4) } -${ Math.random().toString(36).substr(2,4) } )`);
                        }
                        else {
                            lines.push(`${f} : data`);
                        }
                    }
                }
                else {
                    let absPath = resolvePath(f);
                    let node = getNode(absPath);
                    if (!node) {
                        lines.push(`<span class="error">file: '${escapeHtml(f)}': 没有那个文件或目录</span>`);
                    }
                    else if (node.type === 'dir') {
                        lines.push(`${f} : directory`);
                    }
                    else if (node.type === 'link') {
                        lines.push(`${f} : symbolic link to ${node.linkTarget} `);
                    }
                    else {
                        if (node.name.endsWith('.tar.gz') || node.name.endsWith('.tgz')) lines.push(`${f} : gzip compressed data`);
                        else if (node.name.endsWith('.tar')) lines.push(`${f} : POSIX tar archive`);
                        else if (node.name.endsWith('.zip')) lines.push(`${f} : Zip archive data`);
                        else if (node.name.endsWith('.py')) lines.push(`${f} : Python script, ASCII text executable`);
                        else if (node.name.endsWith('.sh')) lines.push(`${f} : Bourne-Again shell script, ASCII text executable`);
                        else if (node.name.endsWith('.c')) lines.push(`${f} : C source, ASCII text`);
                        else if (node.name.endsWith('.h')) lines.push(`${f} : C source, ASCII text`);
                        else if (node.name.endsWith('.json')) lines.push(`${f} : JSON data`);
                        else if (node.name.endsWith('.md')) lines.push(`${f} : UTF-8 Unicode text`);
                        else if (node.name.endsWith('.html')) lines.push(`${f} : HTML document, ASCII text`);
                        else if (node.name.endsWith('.conf')) lines.push(`${f} : ASCII text`);
                        else if (node.name.endsWith('.log')) lines.push(`${f} : ASCII text`);
                        else if (node.content && node.content.startsWith('#!')) lines.push(`${f} : script, ASCII text executable`);
                        else lines.push(`${f} : ASCII text`);
                    }
                }
            }
            output.innerHTML = lines.join('\n');
            break;
        }
        case 'tar': {
            let tarArgs = rawCmd.replace(/^sudo\s+/, '').replace(/^tar\s+/, '').trim();
            let tarFlags = '';
            let tarFile = '';
            let tarTargets = [];
            let parts = tarArgs.split(/\s+/);
            for (let i = 0;
            i < parts.length;
            i++) {
                let p = parts[i];
                if (p === '-f' && i + 1 < parts.length) {
                    tarFile = parts[++i];
                }
                else if (p.startsWith('--file=')) {
                    tarFile = p.split('=')[1];
                }
                else if (p.startsWith('-')) {
                    //  Combined flags: -czf, -xzf, -tf
                    let fset = p.slice(1);
                    if (fset.includes('f') && !tarFile && i + 1 < parts.length) {
                        tarFile = parts[++i];
                        fset = fset.replace('f', '');
                    }
                    tarFlags += fset;
                }
                else if (i === 0 && /^[cxtzjhvWf]+$/.test(p)) {
                    // Traditional tar: bare flags like "czf", "xzf", "tf" tarFlags += p;
                    if (p.includes('f') && !tarFile && i + 1 < parts.length) {
                        tarFile = parts[++i];
                    }
                }
                else {
                    tarTargets.push(p);
                }
            }
            if (!tarFlags) {
                output.innerHTML = `<span class="error">tar: 缺少操作参数</span>\n请执行 'tar --help' 来获取更多信息。`;
                break;
            }
            if (tarFlags.includes('c') && tarFlags.includes('z')) {
                let absPath = resolvePath(tarFile);
                let { parent, name } = getParentAndName(absPath);
                if (parent && parent.type === 'dir') {
                    parent.children.push(file(name, '644', state.currentUser, state.currentUser, Math.floor(Math.random()*50000)+1000, ''));
                    let created = tarTargets.length > 0 ? tarTargets.join(', ') : '.';
                    output.innerText = `tar: 正在归档 '${created}'\ntar: 归档成功：${tarFile} `;
                }
            }
            else if (tarFlags.includes('x') && tarFlags.includes('z')) {
                let absPath = resolvePath(tarFile);
                let node = getNode(absPath);
                if (!node) {
                    output.innerHTML = `<span class="error">tar: ${escapeHtml(tarFile)} : 无法 open: 没有那个文件或目录</span>`;
                }
                else {
                    let targetDir = tarTargets.length > 0 ? resolvePath(tarTargets[0]) : cwd;
                    let dirNode = getNode(targetDir);
                    if (dirNode && dirNode.type === 'dir') {
                        dirNode.children.push(file('extracted_file.txt', '644', state.currentUser, state.currentUser, 4096, ''));
                        output.innerText = `tar: 正在解压到 '${targetDir}'\ntar: 解压完成`;
                    }
                }
            }
            else if (tarFlags.includes('t')) {
                let absPath = resolvePath(tarFile);
                let node = getNode(absPath);
                if (!node) {
                    output.innerHTML = `<span class="error">tar: ${escapeHtml(tarFile)} : 无法 open: 没有那个文件或目录</span>`;
                }
                else {
                    output.innerText = `file1.txt\nfile2.txt\ndir1/\ndir1/file3.txt`;
                }
            }
            else {
                output.innerHTML = `<span class="error">tar: 不支持的操作组合</span>`;
            }
            break;
        }
        //  ═══════════════════════════════════════════ // 磁盘与分区命令 // ═══════════════════════════════════════════
        case 'fdisk': {
            let fdArgs = args.filter(a => a !== 'sudo' && a !== 'fdisk');
            let needRoot = false;
            if (!state.isRoot && !state.sudoAuthenticated) {
                output.innerHTML = `<span class="error">fdisk: 打开 /dev/sda 权限不够</span>\n你需要使用 sudo 执行此命令。`;
                break;
            }
            let devPath = fdArgs.filter(a => !a.startsWith('-'))[0];
            let fdOpt = fdArgs.includes('-l') ? '-l' : '';
            if (fdOpt === '-l') {
                let lines = [];
                for (let dk in diskPartitions) {
                    let disk = diskPartitions[dk];
                    lines.push(`Disk ${dk} : ${ formatSize(disk.size) } , ${disk.sectors} 个扇区，${disk.sectorSize} 字节/扇区`);
                    lines.push(`型号: ${disk.model} `);
                    lines.push(`Disk model: ${disk.model} `);
                    lines.push(`Units: 扇区 of ${disk.sectorSize} * 512 = ${ disk.sectorSize * 512 } bytes`);
                    lines.push(`Sector size (logical/physical): ${disk.sectorSize} bytes / ${disk.sectorSize} bytes`);
                    lines.push(`I/O size (minimum/optimal): ${disk.sectorSize} bytes / ${disk.sectorSize} bytes`);
                    lines.push('');
                    if (disk.partitions.length > 0) {
                        lines.push(`Device Boot Start End Sectors Size Id Type`);
                        for (let p of disk.partitions) {
                            let boot = p.num === 1 ? ' *' : ' ';
                            lines.push(`${dk} ${ String(p.num).padEnd(4) } ${boot} ${ String(p.start).padStart(10) } ${ String(p.end).padStart(10) } ${ String(p.sectors).padStart(10) } ${ p.size.padStart(6) } ${ p.type === 'Linux swap' ? '82' : '83' } ${p.type} `);
                        }
                    }
                    lines.push('');
                }
                output.innerText = lines.join('\n');
            }
            else if (devPath) {
                let disk = diskPartitions[devPath];
                if (!disk) {
                    output.innerHTML = `<span class="error">fdisk: 无法打开 ${escapeHtml(devPath)} : 没有那个设备</span>`;
                    break;
                }
                fdiskDisk = devPath;
                fdiskDirty = false;
                output.innerText = `欢迎使用 fdisk (util-linux 2.39.1)。\n磁盘标识符: 0x${ Math.random().toString(16).substr(2,8) } \n\n更改将停留在内存中，直到您决定将更改写入磁盘。\n使用 'w' 命令将更改写入磁盘。\n\n命令(输入 m 获取帮助): `;
                currentMode = 'FDISK';
                updatePrompt();
            }
            break;
        }
        case 'mkfs': {
            let mkfsArgs = args.filter(a => a !== 'sudo' && a !== 'mkfs');
            let fsType = 'ext4';
            let target = '';
            for (let i = 0;
            i < mkfsArgs.length;
            i++) {
                if (mkfsArgs[i] === '-t' && mkfsArgs[i+1]) {
                    fsType = mkfsArgs[++i];
                }
                else if (mkfsArgs[i].startsWith('-t')) {
                    fsType = mkfsArgs[i].slice(2);
                }
                else if (!mkfsArgs[i].startsWith('-')) {
                    target = mkfsArgs[i];
                }
                else {
                    fsType = mkfsArgs[i].replace(/^-/, '');
                }
            }
            if (!target) {
                output.innerHTML = `<span class="error">mkfs: 缺少设备名</span>\n用法: mkfs [-t fstype] 设备`;
                break;
            }
            if (!state.isRoot && !state.sudoAuthenticated) {
                output.innerHTML = `<span class="error">mkfs: 权限不够</span>`;
                break;
            }
            let found = false;
            for (let dk in diskPartitions) {
                let part = diskPartitions[dk].partitions.find(p => dk + p.num === target);
                if (part) {
                    part.fs = fsType;
                    output.innerText = `mke2fs 1.47.0 (5-Feb-2023)创建含有 ${part.sectors} 个块的文件系统正在分配组表: 完成正在写入inode表: 完成创建日志 (${ Math.floor(part.sectors/1024) } 个块): 完成写入超级块和文件系统账户统计信息: 完成`;
                    found = true;
                    break;
                }
            }
            if (!found) {
                output.innerHTML = `<span class="error">mkfs: ${escapeHtml(target)} : 没有那个设备或地址</span>`;
            }
            break;
        }
        case 'mount': {
            let mtArgs = args.filter(a => a !== 'sudo' && a !== 'mount');
            if (mtArgs.length === 0) {
                let lines = [];
                for (let dk in diskPartitions) {
                    for (let p of diskPartitions[dk].partitions) {
                        if (p.mount) {
                            lines.push(`${dk} ${p.num} on ${p.mount} type ${p.fs} (rw,relatime,errors=remount-ro)`);
                        }
                    }
                }
                output.innerText = lines.join('\n') || 'mount: 未找到挂载点';
                break;
            }
            if (!state.isRoot && !state.sudoAuthenticated) {
                output.innerHTML = `<span class="error">mount: 权限不够</span>`;
                break;
            }
            let mtDevice = mtArgs[0];
            let mtMount = mtArgs[1];
            let mtType = '';
            let mtIdx = mtArgs.indexOf('-t');
            if (mtIdx !== -1 && mtArgs[mtIdx+1]) mtType = mtArgs[mtIdx+1];
            if (!mtDevice || !mtMount) {
                output.innerHTML = `<span class="error">mount: 缺少参数</span>\n用法: mount [-t 类型] 设备 挂载点`;
                break;
            }
            let found = false;
            for (let dk in diskPartitions) {
                let part = diskPartitions[dk].partitions.find(p => dk + p.num === mtDevice);
                if (part) {
                    part.mount = mtMount;
                    let mountNode = getNode(mtMount);
                    if (!mountNode) {
                        let { parent, name } = getParentAndName(mtMount);
                        if (parent && parent.type === 'dir') {
                            parent.children.push(dir(name, '755', 'root', 'root'));
                        }
                    }
                    output.innerText = 'mount: ' + mtDevice + ' 已挂载到 ' + mtMount;
                    found = true;
                    break;
                }
            }
            if (!found) {
                output.innerHTML = `<span class="error">mount: ${escapeHtml(mtDevice)} : 没有那个设备</span>`;
            }
            break;
        }
        case 'df': {
            let lines = ['文件系统 1K-块 已用 可用 已用% 挂载点'];
            for (let dk in diskPartitions) {
                for (let p of diskPartitions[dk].partitions) {
                    if (p.mount && p.fs !== 'swap') {
                        let totalK = Math.floor(p.sectors / 2);
                        let usedK = Math.floor(totalK * (Math.random() * 0.4 + 0.2));
                        let availK = totalK - usedK;
                        let pct = Math.floor((usedK / totalK) * 100);
                        lines.push(`${dk} ${p.num} ${ String(totalK).padStart(10) } ${ String(usedK).padStart(10) } ${ String(availK).padStart(10) } ${ String(pct + '%').padStart(5) } ${p.mount} `);
                    }
                }
            }
            output.innerText = lines.join('\n');
            break;
        }
        case 'du': {
            let duArgs = args.filter(a => a !== 'sudo' && a !== 'du');
            let duPath = duArgs.filter(a => !a.startsWith('-'))[0] || cwd;
            let absPath = resolvePath(duPath);
            let node = getNode(absPath);
            if (!node) {
                output.innerHTML = `<span class="error">du: '${escapeHtml(duPath)}': 没有那个文件或目录</span>`;
                break;
            }
            function calcSize(n) {
                if (n.type === 'file') return n.size;
                let s = 4096;
                if (n.children) for (let c of n.children) s += calcSize(c);
                return s;
            }
            let total = calcSize(node);
            output.innerText = `${ Math.ceil(total/1024) } \t${duPath} `;
            break;
        }
        case 'bash': {
            let shFile = args.filter(a => a !== 'sudo' && a !== 'bash')[0];
            if (!shFile) {
                output.innerHTML = `<span class="error">bash: 缺少文件名</span>`;
                break;
            }
            let bashAbs = resolvePath(shFile);
            let bashNode = getNode(bashAbs);
            if (!bashNode || bashNode.type !== 'file') {
                output.innerHTML = `<span class="error">bash: ${escapeHtml(shFile)} : 没有那个文件或目录</span>`;
                break;
            }
            let fileName = shFile.split('/').pop();
            let customPool = scriptReadPools[fileName];
            output.innerText = simulateScript(bashNode.content || '', bashAbs, customPool);
            break;
        }
        case 'clear': historyContainer.innerHTML = '';
        return;
        default: if (baseCmd.startsWith('./') || baseCmd.startsWith('/') || baseCmd.startsWith('../')) {
            let scriptAbs = resolvePath(baseCmd);
            let scriptNode = getNode(scriptAbs);
            if (!scriptNode || scriptNode.type !== 'file') {
                output.innerHTML = `<span class="error">bash: ${escapeHtml(baseCmd)}: 没有那个文件或目录</span>`;
            }
            else if (!canExecute(scriptNode)) {
                output.innerHTML = `<span class="error">bash: ${escapeHtml(baseCmd)}: 权限不够</span>`;
            }
            else {
                let fileName2 = baseCmd.split('/').pop();
                let customPool2 = scriptReadPools[fileName2];
                output.innerText = simulateScript(scriptNode.content || '', scriptAbs, customPool2);
            }
        }
        else {
            output.innerHTML = `<span class="error">${escapeHtml(baseCmd)} : command not found</span>`;
        }
        break;
    }
    if (('' + output.innerHTML).includes('class="error"')) lastExit = 1;
    if (output.innerText.trim() || output.innerHTML.trim()) {
        historyContainer.appendChild(output);
    }
}
window.openGroupModal = function() {
    renderGroupList();
    document.getElementById('groupModal').style.display = 'block';
    scrollToBottom();
}
window.closeGroupModal = function() {
    document.getElementById('groupModal').style.display = 'none';
}
function scrollToBottom() {
    outputArea.scrollTop = outputArea.scrollHeight;
}
function renderGroupList() {
    const box = document.getElementById('groupListBox');
    box.innerHTML = Object.keys(state.groups).map(g => `<div class="group-list-item ${ g === state.selectedGroup ? 'selected-item' : '' } " onclick="selectGroupItem('${g}')">${g} </div>`).join('');
}
window.selectGroupItem = function(gName) {
    state.selectedGroup = gName;
    renderGroupList();
}
window.addNewGroupIntoGui = function() {
    let newG = prompt('请输入新组的名称(G):');
    if (newG && newG.trim()) {
        newG = sanitizeName(newG);
        if (!newG) return;
        if (!state.groups[newG]) {
            state.groups[newG] = {
                gid: Math.floor(Math.random()*100)+1100, members: []
            };
            state.selectedGroup = newG;
            renderGroupList();
            scrollToBottom();
        }
    }
}
window.deleteGroupFromGui = function() {
    if(state.groups[state.selectedGroup]) {
        delete state.groups[state.selectedGroup];
        state.selectedGroup = Object.keys(state.groups)[0] || '';
        renderGroupList();
    }
}
//  ─── groups-admin GUI 函数 ───
window.selectMainGroupItem = function(gName, el) {
    if (!el) return;
    const gui = el.closest('.ubuntu-photo-gui');
    gui.querySelectorAll('.photo-user-item').forEach(item => item.classList.remove('active'));
    el.classList.add('active');
    gui.querySelector('#groupMainName').innerText = gName;
    gui.querySelector('#groupMainGid').innerText = state.groups[gName]?.gid || '';
    const membersDiv = gui.querySelector('#groupMainMembers');
    const members = state.groups[gName]?.members || [];
    membersDiv.innerHTML = members.length > 0 ? members.map(m => `<div style="padding:2px 5px;">${m} </div>`).join('') : '<div style="color:#888;padding:2px 5px;">无成员</div>';
}
window.addGroupInMainGui = function(btn) {
    let newG = prompt('请输入新组的名称:');
    if (newG && newG.trim()) {
        newG = sanitizeName(newG);
        if (!newG) return;
        if (!state.groups[newG]) {
            state.groups[newG] = {
                gid: Math.floor(Math.random()*100)+1100, members: []
            };
            const gui = btn.closest('.ubuntu-photo-gui');
            const container = gui.querySelector('#groupMainListBox');
            const item = document.createElement('div');
            item.className = 'photo-user-item active';
            item.innerHTML = `<div class="photo-avatar-small">👥</div><div class="photo-item-text"><span class="photo-item-uname">${newG} </span><span class="photo-item-rname">GID: ${ state.groups[newG].gid } </span></div>`;
            item.onclick = function() {
                selectMainGroupItem(newG, this);
            };
            container.querySelectorAll('.photo-user-item').forEach(i => i.classList.remove('active'));
            container.appendChild(item);
            selectMainGroupItem(newG, item);
        }
        else {
            alert('组已存在');
        }
    }
}
window.deleteGroupInMainGui = function(btn) {
    const gui = btn.closest('.ubuntu-photo-gui');
    const activeItem = gui.querySelector('.photo-user-item.active');
    if (!activeItem) {
        alert('请先选择一个组');
        return;
    }
    const gName = activeItem.querySelector('.photo-item-uname').innerText;
    if (state.groups[gName]) {
        delete state.groups[gName];
        activeItem.remove();
        const firstItem = gui.querySelector('.photo-user-item');
        if (firstItem) {
            selectMainGroupItem(firstItem.querySelector('.photo-item-uname').innerText, firstItem);
        }
        else {
            gui.querySelector('#groupMainName').innerText = '';
            gui.querySelector('#groupMainGid').innerText = '';
            gui.querySelector('#groupMainMembers').innerHTML = '<div style="color:#888;padding:2px 5px;">无成员</div>';
        }
    }
}
window.addMemberInMainGui = function(btn) {
    const gui = btn.closest('.ubuntu-photo-gui');
    const gName = gui.querySelector('#groupMainName').innerText;
    if (!gName || !state.groups[gName]) {
        alert('请先选择一个组');
        return;
    }
    let member = prompt('请输入要添加的用户名:');
    if (member && member.trim()) {
        member = member.trim();
        if (!state.users[member]) {
            alert('用户不存在');
            return;
        }
        if (!state.groups[gName].members) state.groups[gName].members = [];
        if (state.groups[gName].members.includes(member)) {
            alert('用户已在组中');
            return;
        }
        state.groups[gName].members.push(member);
        const membersDiv = gui.querySelector('#groupMainMembers');
        if (membersDiv.querySelector('div[style*="color:#888"]')) membersDiv.innerHTML = '';
        const memberEl = document.createElement('div');
        memberEl.style.cssText = 'padding:2px 5px;';
        memberEl.innerText = member;
        membersDiv.appendChild(memberEl);
    }
}
window.removeMemberInMainGui = function(btn) {
    const gui = btn.closest('.ubuntu-photo-gui');
    const gName = gui.querySelector('#groupMainName').innerText;
    if (!gName || !state.groups[gName]) {
        alert('请先选择一个组');
        return;
    }
    let member = prompt('请输入要移除的用户名:');
    if (member && member.trim()) {
        member = member.trim();
        const idx = state.groups[gName].members?.indexOf(member);
        if (idx === undefined || idx === -1) {
            alert('用户不在该组中');
            return;
        }
        state.groups[gName].members.splice(idx, 1);
        const membersDiv = gui.querySelector('#groupMainMembers');
        const memberEls = membersDiv.querySelectorAll('div');
        memberEls.forEach(el => {
            if (el.innerText === member) el.remove();
        }
        );
        if (membersDiv.children.length === 0) membersDiv.innerHTML = '<div style="color:#888;padding:2px 5px;">无成员</div>';
    }
}
window.selectPhotoUser = function(username, el) {
    if (!el) return;
    const gui = el.closest('.ubuntu-photo-gui');
    gui.querySelectorAll('.photo-user-item').forEach(item => item.classList.remove('active'));
    el.classList.add('active');
    gui.querySelector('.photo-r-name').innerText = username;
    gui.querySelector('.photo-r-type').innerText = state.users[username].type;
    gui.querySelector('.photo-r-pwd').innerText = state.users[username].pwdState;
}
window.addUserInGui = function(btn) {
    const n = prompt('请输入要添加的用户名:');
    if (!n || !n.trim()) return;
    const name = sanitizeName(n);
    if (!name) { alert('无效的用户名'); return; }
    if (state.users[name]) {
        alert('用户已存在');
        return;
    }
    const nextUid = Math.max(1000, ...Object.values(state.users).map(u => u.uid)) + 1;
    state.users[name] = {
        uid: nextUid, real: name, type: '标准', pwdState: '登录时询问'
    };
    const gui = btn.closest('.ubuntu-photo-gui');
    const container = gui.querySelector('.photo-user-container');
    const item = document.createElement('div');
    item.className = 'photo-user-item';
    item.onclick = function() {
        selectPhotoUser(name, this);
    };
    item.innerHTML = ` <div class="photo-avatar-small">👤</div> <div class="photo-item-text"> <span class="photo-item-uname">${name} </span> <span class="photo-item-rname">${name} </span> </div>`;
    container.appendChild(item);
    selectPhotoUser(name, item);
    scrollToBottom();
}
window.deleteUserInGui = function(btn) {
    const gui = btn.closest('.ubuntu-photo-gui');
    const active = gui.querySelector('.photo-user-item.active');
    if (!active) return;
    const username = active.querySelector('.photo-item-uname').innerText;
    if (username === state.currentUser) {
        alert('不能删除当前登录用户');
        return;
    }
    if (!confirm(`确定删除用户 ${username} 吗?`)) return;
    delete state.users[username];
    for (const g in state.groups) {
        if (state.groups[g].members) state.groups[g].members = state.groups[g].members.filter(m => m !== username);
    }
    active.remove();
    const next = gui.querySelector('.photo-user-item');
    if (next) selectPhotoUser(next.querySelector('.photo-item-uname').innerText, next);
    scrollToBottom();
}
// ─── 实验需求快捷操作 ───
let expData = [ {
    label: '查看用户信息文件', cmd: 'cat /etc/passwd'
},
{
    label: '查看用户密码配置文件', cmd: 'sudo cat /etc/shadow'
},
{
    label: '查看组信息文件', cmd: 'cat /etc/group'
},
{
    label: '查看组密码文件', cmd: 'sudo cat /etc/gshadow'
},
{
    label: 'useradd创建普通用户', cmd: 'sudo useradd testuser1'
},
{
    label: 'adduser创建普通用户', cmd: 'sudo adduser testuser2'
},
{
    label: 'useradd不同选项', cmd: 'sudo useradd -m -d /home/testuser3 -s /bin/bash -g users testuser3'
},
{
    label: 'usermod修改用户', cmd: 'sudo usermod -l newname testuser1'
},
{
    label: '删除用户', cmd: 'sudo userdel newname'
},
{
    label: '修改密码(passwd)', cmd: 'sudo passwd testuser2'
},
{
    label: '切换用户(su)', cmd: 'su - testuser3'
},
{
    label: '修改密码状态(passwd -l)', cmd: 'sudo passwd -l testuser3'
},
{
    label: '添加组(groupadd)', cmd: 'sudo groupadd testgroup1'
},
{
    label: '修改组(groupmod)', cmd: 'sudo groupmod -n newgrp testgroup1'
},
{
    label: '删除组(groupdel)', cmd: 'sudo groupdel newgrp'
},
{
    label: '管理组成员(gpasswd)', cmd: 'sudo gpasswd -a username testgroup'
},
{
    label: '安装gnome-system-tools', cmd: 'sudo apt install gnome-system-tools'
},
{
    label: '添加用户(图形化)', cmd: 'users-admin', gui: true
},
{
    label: '添加组(图形化)', cmd: 'groups-admin', gui: true
},
{
    label: 'id 查看用户信息', cmd: 'id'
},
{
    label: 'whoami', cmd: 'whoami'
},
{
    label: 'groups', cmd: 'groups'
},
{
    label: 'w 查看登录用户', cmd: 'w'
},
{
    label: 'ls查看目录', cmd: 'ls -la'
},
{
    label: 'mkdir创建目录', cmd: 'mkdir mydir'
},
{
    label: 'rmdir删除空目录', cmd: 'rmdir mydir'
},
{
    label: 'touch创建文件', cmd: 'touch file2.txt'
},
{
    label: 'cp复制文件', cmd: 'cp file2.txt file3.txt'
},
{
    label: 'find搜索文件', cmd: 'find . -name *.txt'
},
{
    label: 'rm删除文件', cmd: 'rm file3.txt'
},
{
    label: 'chmod设置权限', cmd: 'chmod 755 file2.txt'
},
{
    label: 'tar压缩', cmd: 'tar czf archive.tar.gz .'
},
{
    label: 'fdisk查看分区', cmd: 'sudo fdisk -l /dev/sda'
},
{
    label: 'fdisk创建分区', cmd: 'sudo fdisk /dev/sda'
},
{
    label: 'fdisk修改分区', cmd: 'sudo fdisk /dev/sda'
},
{
    label: 'fdisk删除分区', cmd: 'sudo fdisk /dev/sda'
},
{
    label: 'file查看文件系统', cmd: 'sudo file -sL /dev/sda1'
},
{
    label: 'mkfs创建文件系统', cmd: 'sudo mkfs -t ext4 /dev/sda1'
},
// 实验三 - Shell脚本编程
{
    label: '创建 file2.sh（被包含脚本）', script: '#!/bin/bash\n# file2.sh\necho "正在执行 file2.sh..."\n\nmessage="Hello from file2"\ngreet() {\n echo "Greetings from file2: $1"\n}\n\necho "file2.sh 执行完毕"', filename: 'file2.sh', cmd: 'bash file2.sh'
},
{
    label: '创建 file1.sh（使用 . 包含）', script: '#!/bin/bash\n# file1.sh - 使用 . 包含\necho "=== file1.sh 开始 ==="\n. ./file2.sh\necho "访问 file2 的变量: $message"\necho "=== file1.sh 结束 ==="', filename: 'file1.sh', cmd: 'bash file1.sh'
},
{
    label: '创建 file1.sh（使用 source 包含）', script: '#!/bin/bash\n# file1_v2.sh - 使用 source 包含\necho "=== file1_v2.sh 开始 ==="\nsource ./file2.sh\ngreet "World"\necho "=== file1_v2.sh 结束 ==="', filename: 'file1_v2.sh', cmd: 'bash file1_v2.sh'
},
{
    label: '赋予执行权限', cmd: 'chmod +x file1.sh'
},
{
    label: '相对路径运行', cmd: './file1.sh'
},
{
    label: '绝对路径运行', cmd: '/home/username/file1.sh'
},
{
    label: 'while循环计算1-100和', script: '#!/bin/bash\ni=1\nsum=0\nwhile [ $i -le 100 ]; do\n sum=$((sum + i))\n i=$((i + 1))\ndone\necho "1到100的和为: $sum"', filename: 'sum.sh', cmd: 'bash sum.sh'
},
{
    label: '数组输入求总和最大值', script: '#!/bin/bash\ndeclare -a nums\necho "请输入5个数:"\nfor ((i=0; i<5; i++)); do\n read -p "第$((i+1))个数: " nums[$i]\ndone\nsum=0\nmax=${ nums[0] } \nfor num in "${ nums[@] } "; do\n sum=$((sum + num))\n if [ $num -gt $max ]; then max=$num; fi\ndone\necho "和: $sum, 最大值: $max"', filename: 'array.sh', cmd: 'bash array.sh'
},
{
    label: 'input()函数输入数据', script: '#!/bin/bash\ninput() { \n read -p "$1" val\n echo $val\n } \nname=$(input "请输入姓名: ")\necho "姓名: $name"', filename: 'input_func.sh', cmd: 'bash input_func.sh'
},
{
    label: 'find_max()函数查找最大值', script: '#!/bin/bash\nfind_max() { \n local max=$1\n for n in "$@"; do\n [ $n -gt $max ] && max=$n\n done\n echo $max\n } \nnumbers=(23 45 12 67 34 89 5)\necho "数组: ${ numbers[@] } "\nresult=$(find_max "${ numbers[@] } ")\necho "最大值: $result"', filename: 'find_max.sh', cmd: 'bash find_max.sh'
},
];
const expSections = {
    1: {
        title: '实验一 用户与组管理', startIdx: 0, secs: [ {
            st: '1、查看配置文件', end: 4
        },
        {
            st: '2、命令行用户管理', end: 12
        },
        {
            st: '3、命令行组管理', end: 16
        },
        {
            st: '4、图形化操作', end: 19
        },
        {
            st: '5、其他相关命令', end: 23
        },
        ]
    },
    2: {
        title: '实验二 Linux文件与目录、磁盘管理', startIdx: 23, secs: [ {
            st: '文件与目录操作', end: 39
        },
        ]
    },
    3: {
        title: '实验三 Shell脚本编程', startIdx: 39, secs: [ {
            st: '1、包含外部脚本', end: 45
        },
        {
            st: '2、变量、表达式与流程控制', end: 47
        },
        {
            st: '3、函数脚本', end: 49
        },
        ]
    },
};
// ─── 默认实验结构（首次加载时作为兜底，并写入 localStorage） ───
const DEFAULT_EXPERIMENTS = [ {
    id: 1, title: '实验一 用户与组管理', isScript: false, itemIdxs: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22]
},
{
    id: 2, title: '实验二 Linux文件与目录、磁盘管理', isScript: false, itemIdxs: [23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38]
},
{
    id: 3, title: '实验三 Shell脚本编程', isScript: true, itemIdxs: [39,40,41,42,43,44,45,46,47,48,49]
},
];
// ─── 题目数据模型：内联 items 是规范形式（兼容旧的 itemIdxs 全局下标引用）───
// 读取一个实验的题目列表：优先内联 items，否则按 itemIdxs 解引用全局 expData
function getExpItems(exp) {
    if (Array.isArray(exp.items)) return exp.items;
    return (exp.itemIdxs || []).map(i => expData[i]).filter(Boolean);
}
// 把实验规范化为内联形式（深拷贝，题目内容自包含，可直接序列化入库）
function materializeExp(exp) {
    return {
        id: exp.id, title: exp.title, isScript: !!exp.isScript,
        items: getExpItems(exp).map(it => {
            const o = { label: it.label || '(未命名)' };
            if (it.cmd) o.cmd = it.cmd;
            if (it.script) { o.script = it.script; o.filename = it.filename || 'script.sh'; }
            return o;
        })
    };
}
const DEFAULT_EXPERIMENTS_INLINE = DEFAULT_EXPERIMENTS.map(materializeExp);
const EXP_STORAGE_KEY = 'ubuntu_terminal_experiments_v1';
let experiments = [];
function loadExperiments() {
    try {
        const raw = localStorage.getItem(EXP_STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) {
                experiments = parsed.map(materializeExp);
                return;
            }
        }
    }
    catch (e) {
        console.warn('加载自定义实验数据失败', e);
    }
    // 未写 localStorage：先展示内置默认，服务器默认题库到达后自动替换
    experiments = JSON.parse(JSON.stringify(DEFAULT_EXPERIMENTS_INLINE));
}
function saveExperiments() {
    try {
        localStorage.setItem(EXP_STORAGE_KEY, JSON.stringify(experiments));
    }
    catch (e) {
        console.warn('保存自定义实验数据失败', e);
    }
    pushExperimentsToServer();
}
// ─── 共享题库的服务器同步（数据库只存一份，谁都能改，改完全员可见）───
const EXP_API = 'api/experiments.php';
let expPushTimer = null;
let applyingServerData = false;
let expSessionDirty = false;   // 本次会话是否已编辑（编辑后不被迟到的拉取覆盖）
// 页面加载后拉取共享题库：服务器为准刷新界面与离线缓存
function loadSharedExperimentsFromServer() {
    fetch(EXP_API)
        .then(r => r.json())
        .then(j => {
            if (!j || j.ok !== true || !Array.isArray(j.data) || j.data.length === 0) return;
            if (expSessionDirty) return; // 已开始编辑，忽略迟到的拉取响应
            applyingServerData = true;
            experiments = j.data.map(materializeExp);
            saveExperiments();          // 刷新本地离线缓存（此轮不回传服务器）
            applyingServerData = false;
            renderShortcutPanel();
            renderEditorShortcutPanel();
        })
        .catch(e => console.warn('共享题库加载失败（使用本地缓存/内置版本）', e));
}
// 防抖上传共享题库（失败静默，本地缓存仍在）
function pushExperimentsToServer() {
    if (applyingServerData) return;
    expSessionDirty = true;
    clearTimeout(expPushTimer);
    expPushTimer = setTimeout(function () {
        fetch(EXP_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: experiments })
        }).catch(e => console.warn('题库上传服务器失败', e));
    }, 800);
}
// ─── 题库备份与恢复（每次修改自动备份 JSON，保留 3 个月，最近 10 份保底）───
function openBackupPanel() {
    closeManagePanel();
    let overlay = document.getElementById('backupOverlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'backupOverlay';
        overlay.className = 'backup-overlay';
        overlay.innerHTML = '<div class="backup-dialog">'
            + '<div class="backup-title">🕘 题库备份与恢复'
            + '<div class="manage-close" onclick="closeBackupPanel()">✕</div></div>'
            + '<div class="backup-hint">每次题库被修改，修改前的版本都会自动备份到服务器（保留 3 个月，最近 10 份永不清理）。点击"恢复"可回滚到对应版本；恢复前当前版本也会先备份，随时可以再撤销。</div>'
            + '<div class="backup-list" id="backupList"><div class="pane-empty">加载中...</div></div>'
            + '</div>';
        document.body.appendChild(overlay);
    }
    overlay.style.display = 'flex';
    fetch('api/backups.php')
        .then(r => r.json())
        .then(j => {
            const box = document.getElementById('backupList');
            if (!box) return;
            if (!j || j.ok !== true || !Array.isArray(j.backups) || j.backups.length === 0) {
                box.innerHTML = '<div class="pane-empty">暂无备份（第一次修改题库后自动产生）</div>';
                return;
            }
            box.innerHTML = j.backups.map(b =>
                '<div class="backup-item">'
                + '<span class="backup-time">' + escapeHtml(b.time)
                + (b.origin ? ' <span class="backup-badge">初始版本 · 永久保留</span>' : '') + '</span>'
                + '<span class="backup-size">' + escapeHtml(b.size) + '</span>'
                + '<button class="manage-btn" onclick="restoreBackup(\'' + b.name + '\')">恢复</button>'
                + '</div>'
            ).join('');
        })
        .catch(() => {
            const box = document.getElementById('backupList');
            if (box) box.innerHTML = '<div class="pane-empty">加载失败（服务器不可用？）</div>';
        });
}
function closeBackupPanel() {
    const el = document.getElementById('backupOverlay');
    if (el) el.style.display = 'none';
}
function restoreBackup(name) {
    if (!confirm('确定要把题库恢复到这份备份吗？\n当前版本会先自动备份，不会丢失。')) return;
    fetch('api/backups.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name })
    })
        .then(r => r.json())
        .then(j => {
            if (j && j.ok === true) {
                alert('恢复成功！');
                closeBackupPanel();
                expSessionDirty = false;   // 允许拉取恢复后的题库并刷新界面
                loadSharedExperimentsFromServer();
            }
            else {
                alert('恢复失败：' + ((j && j.error) || '未知错误'));
            }
        })
        .catch(() => alert('恢复失败：网络错误'));
}
window.openBackupPanel = openBackupPanel;
window.closeBackupPanel = closeBackupPanel;
window.restoreBackup = restoreBackup;
function getExpById(eid) {
    return experiments.find(e => e.id === eid);
}
function runReq(eid, pos) {
    const exp = getExpById(eid);
    const item = exp ? getExpItems(exp)[pos] : null;
    if (!item) return;
    const input = document.getElementById('cmd');
    if (!input) return;
    if (item.cmd) {
        input.value = item.cmd.replace('/home/username/', '/home/' + state.currentUser + '/');
        input.focus();
    }
    if (item.script) {
        openScriptEditor();
        const textarea = document.getElementById('editorTextarea');
        const filename = document.getElementById('editorFilename');
        if (textarea) textarea.value = item.script;
        if (filename) filename.value = item.filename || 'script.sh';
    }
}
function toggleExp(n) {
    const exp = getExpById(n);
    if (!exp) return;
    const content = document.getElementById('expContent_' + n);
    const btn = document.getElementById('expBtn_' + n);
    if (!content || !btn) return;
    if (content.classList.contains('open')) {
        content.classList.remove('open');
        content.innerHTML = '';
        btn.classList.remove('open');
        return;
    }
    btn.classList.add('open');
    let html = '';
    getExpItems(exp).forEach(function (d, pos) {
        html += '<div class="req-item" onclick="runReq(' + exp.id + ',' + pos + ')">' + escapeHtml(d.label || '(未命名)') + '</div>';
    });
    content.innerHTML = html;
    content.classList.add('open');
}
function toggleHelp() {
    const panel = document.getElementById('helpPanel');
    panel.classList.toggle('open');
}
//  ─── 实验三 脚本编辑器函数 ───
function openScriptEditor() {
    document.getElementById('scriptEditorOverlay').classList.add('open');
    //  自动展开第一个脚本实验
    const scriptExp = experiments.find(e => e.isScript);
    if (scriptExp) {
        const content = document.getElementById('expContentEditor_' + scriptExp.id);
        if (content && !content.classList.contains('open')) {
            toggleExpInEditor(scriptExp.id);
        }
    }
}
function closeScriptEditor() {
    document.getElementById('scriptEditorOverlay').classList.remove('open');
    document.getElementById('cmd').focus();
}
function toggleExpInEditor(n) {
    const exp = getExpById(n);
    if (!exp) return;
    const content = document.getElementById('expContentEditor_' + n);
    const btn = document.getElementById('expBtnEditor_' + n);
    if (!content || !btn) return;
    if (content.classList.contains('open')) {
        content.classList.remove('open');
        content.innerHTML = '';
        btn.classList.remove('open');
        return;
    }
    btn.classList.add('open');
    let html = '';
    getExpItems(exp).forEach(function (d, pos) {
        html += '<div class="req-item" onclick="handleEditorReqClick(' + exp.id + ',' + pos + ')">' + escapeHtml(d.label || '(未命名)') + '</div>';
    });
    content.innerHTML = html;
    content.classList.add('open');
}
function handleMainClick(eid) {
    const exp = getExpById(eid);
    if (!exp) return;
    if (exp.isScript) {
        openScriptEditor();
    }
    else {
        toggleExp(eid);
    }
}
function handleMainClickEditor(eid) {
    const exp = getExpById(eid);
    if (!exp) return;
    if (exp.isScript) {
        // 在编辑器内只切换展开 toggleExpInEditor(eid);
    }
    else {
        toggleExpInEditor(eid);
    }
}
// ─── 渲染快捷面板（终端左侧）───
function renderShortcutPanel() {
    const container = document.getElementById('expListContainer');
    if (!container) return;
    let html = '';
    for (const exp of experiments) {
        if (exp.isScript) {
            html += '<div class="exp-btn-row">';
            html += '<button class="exp-btn exp-btn-main" id="expBtn_' + exp.id + '" onclick="handleMainClick(' + exp.id + ')">' + escapeHtml(exp.title) + '</button>';
            html += '<button class="exp-toggle-btn" onclick="toggleExp(' + exp.id + ')" title="展开/收起">▶</button>';
            html += '</div>';
        }
        else {
            html += '<button class="exp-btn" id="expBtn_' + exp.id + '" onclick="handleMainClick(' + exp.id + ')">' + escapeHtml(exp.title) + '</button>';
        }
        html += '<div class="exp-content" id="expContent_' + exp.id + '"></div>';
    }
    container.innerHTML = html;
}
// ─── 渲染脚本编辑器左侧面板 ───
function renderEditorShortcutPanel() {
    const container = document.getElementById('expListContainerEditor');
    if (!container) return;
    let html = '';
    for (const exp of experiments) {
        html += '<button class="exp-btn" id="expBtnEditor_' + exp.id + '" onclick="handleMainClickEditor(' + exp.id + ')">' + escapeHtml(exp.title) + '</button>';
        html += '<div class="exp-content" id="expContentEditor_' + exp.id + '"></div>';
    }
    container.innerHTML = html;
    //  默认展开第一个脚本实验
    const scriptExp = experiments.find(e => e.isScript);
    if (scriptExp) toggleExpInEditor(scriptExp.id);
}
// ─── HTML 转义 ───
// 名字统一过滤：禁止用户名/组名中出现 HTML、引号等危险字符（与真实系统的命名限制方向一致）
function sanitizeName(n) {
    return String(n == null ? '' : n).replace(/[^\w\u4e00-\u9fa5-]/g, '').slice(0, 32);
}
function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}
function handleEditorReqClick(eid, pos) {
    const exp = getExpById(eid);
    const item = exp ? getExpItems(exp)[pos] : null;
    if (!item) return;
    if (item.script) {
        document.getElementById('editorTextarea').value = item.script;
        document.getElementById('editorFilename').value = item.filename || 'script.sh';
    }
    if (item.cmd) {
        const input = document.getElementById('cmd');
        if (input) input.value = item.cmd.replace('/home/username/', '/home/' + state.currentUser + '/');
    }
}
function saveEditorScript() {
    const content = document.getElementById('editorTextarea').value;
    const filename = document.getElementById('editorFilename').value.trim();
    if (!filename) { alert('请输入文件名'); return; }
    const homeDir = '/home/' + state.currentUser;
    const filePath = homeDir + '/' + filename;
    const { parent, name } = getParentAndName(filePath);
    if (!parent) { alert('保存失败: 无法确定路径'); return; }
    const existing = parent.children.findIndex(c => c.name === name && c.type === 'file');
    if (existing >= 0) parent.children.splice(existing, 1);
    parent.children.push(file(name, '644', state.currentUser, state.currentUser, content.length, content));
    closeScriptEditor();
    const line = document.createElement('div');
    line.innerHTML = `<span class="prompt">${promptSpan.innerText}</span><span>保存脚本: ${escapeHtml(filename)}</span>`;
    historyContainer.appendChild(line);
    const out = document.createElement('div');
    out.className = 'output-row';
    out.innerHTML = `<span class="success">脚本已保存到 ${escapeHtml(filePath)}</span>`;
    historyContainer.appendChild(out);
    outputArea.scrollTop = outputArea.scrollHeight;
    saveVmSnapshot();
}
function toggleEditorHelp() { document.getElementById('editorHelpPanel').classList.toggle('open'); }
// ─── Shell 脚本模拟执行器 ───
function simulateScript(content, scriptPath, customReadPool) {
    let scriptDir = scriptPath ? scriptPath.substring(0, scriptPath.lastIndexOf('/')) : '/home/' + state.currentUser;
    let lines = content.split('\n');
    let vars = {};
    let funcs = {};
    let output = '';
    let readPool = customReadPool || ['1', '2', '3', '4', '5', '张三', 'libai', 'password'];
    let readIdx = 0;
    function expand(str) {
        if (typeof str !== 'string') return '';
        // $((expr))
        str = str.replace(/\$\(\(([^)]+)\)\)/g, function(m, e) { return String(evalArith(e)); });
        // ${var:-default}, ${var:=default}
        str = str.replace(/\$\{([^:}]+):[-=]([^}]+)\}/g, function(m, v, d) {
            let val = getVar(v.trim());
            return val !== undefined && val !== '' ? val : d;
        });
        // ${var/sub/replace}, ${var//sub/replace}
        str = str.replace(/\$\{([^}/]+)\/([^}/]+)\/([^}]*)\}/g, function(m, v, s, r) {
            let val = String(getVar(v) || '');
            return val.split(s).join(r);
        });
        // ${var:start:len}
        str = str.replace(/\$\{([^}:]+):([^}:]+):([^}]+)\}/g, function(m, v, s, l) {
            let val = String(getVar(v) || '');
            return val.substr(parseInt(s), parseInt(l));
        });
        // ${var[idx]}
        str = str.replace(/\$\{([^\[]+)\[([^\]]+)\]\}/g, function(m, v, idx) {
            let arr = getVar(v.trim());
            if (!Array.isArray(arr)) return '';
            let n = idx.trim();
            if (n === '@' || n === '*') return arr.join(' ');
            return arr[parseInt(n)] || '';
        });
        // ${#var}
        str = str.replace(/\$\{#([^}]+)\}/g, function(m, v) {
            let val = getVar(v);
            return String(val !== undefined && val !== null ? String(val).length : 0);
        });
        // ${var}
        str = str.replace(/\$\{([^}]+)\}/g, function(m, v) {
            let val = getVar(v.trim());
            return val !== undefined && val !== null ? String(val) : '';
        });
        // $var (but not $(( or ${)
        str = str.replace(/\$([a-zA-Z_]\w*)/g, function(m, v) {
            if (m.startsWith('$(')) return m;
            let val = getVar(v);
            return val !== undefined && val !== null ? String(val) : '';
        });
        // $1-$9, $@, $*, $# (positional params and special vars)
        str = str.replace(/\$([1-9#@*])/g, function(m, v) {
            let val = getVar(v);
            if (Array.isArray(val)) return val.join(' ');
            return val !== undefined && val !== null ? String(val) : '';
        });
        return str;
    }
    function getVar(name) {
        if (state._getVarCtx) { let v = state._getVarCtx[name]; if (v !== undefined) return v; }
        if (name === '@') return vars['@'] || [];
        if (name === '*') return vars['*'] || [];
        if (name === '#') return vars['#'] || 0;
        if (name === '?') return vars['?'] || 0;
        if (name.match(/^[1-9]$/)) return vars[name] || '';
        return vars[name];
    }
    function setVar(name, val) { if (name.match(/^[a-zA-Z_]\w*$/)) vars[name] = val; }
    function evalArith(expr) {
        let e = expand(String(expr));
        e = e.replace(/\b([a-zA-Z_]\w*)\b/g, function(m) {
            let v = getVar(m);
            if (v !== undefined && v !== null && v !== '') return String(v);
            return m;
        });
        try { return Function('"use strict"; return (' + e + ')')(); } catch(e2) { return 0; }
    }
    function parseTest(condText) {
        let c = condText.replace(/^\[/, '').replace(/\]$/, '').trim();
        if (!c) return true;
        let m = c.match(/^-z\s+(.+)/);
        if (m) { let v = expand(m[1]); return v === '' || v === undefined; }
        m = c.match(/^-n\s+(.+)/);
        if (m) { let v = expand(m[1]); return v !== '' && v !== undefined; }
        m = c.match(/(.+)\s*==\s*(.+)/) || c.match(/(.+)\s*=\s*(.+)/);
        if (m) { return expand(m[1].trim()) === expand(m[2].trim()); }
        m = c.match(/(.+)\s*!=\s*(.+)/);
        if (m) { return expand(m[1].trim()) !== expand(m[2].trim()); }
        let nums = ['-eq','-ne','-gt','-lt','-ge','-le'];
        for (let op of nums) {
            m = c.match(new RegExp('(.+)\\s*' + op.replace(/-/g, '\\-') + '\\s*(.+)'));
            if (m) {
                let a = parseInt(expand(m[1].trim())) || 0;
                let b = parseInt(expand(m[2].trim())) || 0;
                switch(op) {
                    case '-eq': return a === b; case '-ne': return a !== b;
                    case '-gt': return a > b; case '-lt': return a < b;
                    case '-ge': return a >= b; case '-le': return a <= b;
                }
            }
        }
        m = c.match(/^-([fd])\s+(.+)/);
        if (m) {
            let path = expand(m[2].trim());
            let absP = resolvePath(path);
            let node = getNode(absP);
            if (m[1] === 'f') return node && node.type === 'file';
            if (m[1] === 'd') return node && node.type === 'dir';
        }
        let val = expand(c);
        return val !== '' && val !== '0' && val !== undefined;
    }
    function tokenizeLine(line) {
        let tokens = []; let cur = ''; let inSingle = false, inDouble = false;
        for (let i = 0; i < line.length; i++) {
            let ch = line[i];
            if (ch === "'" && !inDouble) { inSingle = !inSingle; continue; }
            if (ch === '"' && !inSingle) { inDouble = !inDouble; continue; }
            if (/\s/.test(ch) && !inSingle && !inDouble) { if (cur) { tokens.push(cur); cur = ''; } }
            else { cur += ch; }
        }
        if (cur) tokens.push(cur);
        return tokens;
    }
    function getBlockBody(startIdx, endWord) {
        let body = []; let i = startIdx; let depth = 0;
        while (i < lines.length) {
            let trimmed = lines[i].trim();
            if (trimmed.startsWith('if ') || trimmed === 'if' || trimmed.startsWith('for ') || trimmed === 'for' || trimmed.startsWith('while ') || trimmed === 'while' || trimmed.startsWith('until ')) depth++;
            if (trimmed === 'then' || trimmed.startsWith('then ')) depth++;
            if (trimmed.startsWith('do') || trimmed.startsWith('do ')) depth++;
            if (trimmed === 'done' || trimmed.startsWith('done ') || trimmed === 'fi' || trimmed.startsWith('fi ') || trimmed === endWord || trimmed.startsWith(endWord + ' ')) {
                if (depth === 0) break;
                depth--;
            }
            if (trimmed === endWord || trimmed.startsWith(endWord + ' ')) break;
            body.push(lines[i]);
            i++;
        }
        return { body, nextIdx: i };
    }
    function execBlock(blockLines, localVars, localFuncs, localDir) {
        let result = '';
        let i = 0;
        let mergedFuncs = {};
        for (let k in funcs) mergedFuncs[k] = funcs[k];
        for (let k in localFuncs) mergedFuncs[k] = localFuncs[k];
        let mergedVars = new Proxy(vars, {
            get: function(t, p) { return typeof p === 'string' && p in localVars ? localVars[p] : t[p]; },
            set: function(t, p, v) { if (typeof p === 'string') { if (p in localVars) localVars[p] = v; else t[p] = v; } return true; }
        });
        let savedCtx = state._getVarCtx;
        state._getVarCtx = mergedVars;
        while (i < blockLines.length) {
            let raw = blockLines[i]; i++;
            let line = raw.trim();
            if (!line || line.startsWith('#')) continue;
            if (line.startsWith('#!')) continue;
            // && chaining
            let chainParts = line.split(/\s*&&\s*/);
            if (chainParts.length > 1) {
                let ok = true;
                for (let cp of chainParts) {
                    if (!ok) break;
                    let cpTrim = cp.trim();
                    let brMatch = cpTrim.match(/^\[(.+)\]$/);
                    if (brMatch) { if (!parseTest(cpTrim)) { ok = false; break; } }
                    else {
                        let chainAssign = cpTrim.match(/^([a-zA-Z_]\w*)=(.*)/);
                        if (chainAssign) {
                            let caName = chainAssign[1], caVal = chainAssign[2].trim();
                            if ((caVal.startsWith('"') && caVal.endsWith('"')) || (caVal.startsWith("'") && caVal.endsWith("'"))) caVal = caVal.slice(1, -1);
                            mergedVars[caName] = expand(caVal);
                        }
                    }
                }
                continue;
            }
            // Function definition
            let funcMatch = line.match(/^([a-zA-Z_]\w*)\s*\(\s*\)\s*\{/);
            if (funcMatch) {
                let fname = funcMatch[1]; let bodyLines = []; let depth = 1;
                while (i < blockLines.length && depth > 0) {
                    let l = blockLines[i]; i++;
                    depth += (l.match(/\{/g) || []).length;
                    depth -= (l.match(/\}/g) || []).length;
                    if (depth > 0 || (depth === 0 && l.trim() !== '}')) {
                        if (depth === 0 && l.trim() === '}') break;
                        bodyLines.push(l);
                    }
                }
                funcs[fname] = { body: bodyLines.join('\n'), params: [] };
                continue;
            }
            if (line === '}') continue;
            // local var[=value]
            let localMatch = line.match(/^local\s+(.+)/);
            if (localMatch) {
                let decl = localMatch[1].trim(); let eqIdx = decl.indexOf('=');
                if (eqIdx > 0) {
                    let lname = decl.substring(0, eqIdx).trim();
                    let lval = expand(decl.substring(eqIdx + 1).trim());
                    if ((lval.startsWith('"') && lval.endsWith('"')) || (lval.startsWith("'") && lval.endsWith("'"))) lval = lval.slice(1, -1);
                    localVars[lname] = lval;
                } else { localVars[decl] = ''; }
                continue;
            }
            // export var[=value]
            let exportMatch = line.match(/^export\s+(.+)/);
            if (exportMatch) {
                let decl = exportMatch[1].trim(); let eqIdx = decl.indexOf('=');
                if (eqIdx > 0) {
                    let ename = decl.substring(0, eqIdx).trim();
                    let evalue = expand(decl.substring(eqIdx + 1).trim());
                    mergedVars[ename] = evalue;
                }
                continue;
            }
            // declare -a array=(...)
            let declareMatch = line.match(/^declare\s+(-[aA])\s+([a-zA-Z_]\w*)=(.*)/);
            if (declareMatch) {
                let arrName = declareMatch[2]; let arrVal = declareMatch[3].trim();
                if (arrVal.startsWith('(') && arrVal.endsWith(')')) {
                    let inner = arrVal.slice(1, -1).trim(); let items = []; let cur = '', inQ = false, inDQ = false;
                    for (let ci = 0; ci < inner.length; ci++) {
                        let c = inner[ci];
                        if (c === "'" && !inDQ) { inQ = !inQ; continue; }
                        if (c === '"' && !inQ) { inDQ = !inDQ; continue; }
                        if (/\s/.test(c) && !inQ && !inDQ) { if (cur) { items.push(expand(cur)); cur = ''; } }
                        else cur += c;
                    }
                    if (cur) items.push(expand(cur));
                    mergedVars[arrName] = items;
                }
                continue;
            }
            // array=(...)
            let arrMatch = line.match(/^([a-zA-Z_]\w*)\s*=\s*\((.+)\)\s*$/);
            if (arrMatch) {
                let arrName = arrMatch[1]; let inner = arrMatch[2].trim(); let items = []; let cur = '', inQ = false, inDQ = false;
                for (let ci = 0; ci < inner.length; ci++) {
                    let c = inner[ci];
                    if (c === "'" && !inDQ) { inQ = !inQ; continue; }
                    if (c === '"' && !inQ) { inDQ = !inDQ; continue; }
                    if (/\s/.test(c) && !inQ && !inDQ) { if (cur) { items.push(expand(cur)); cur = ''; } }
                    else cur += c;
                }
                if (cur) items.push(expand(cur));
                mergedVars[arrName] = items;
                continue;
            }
            // for var in list; do ... done
            let forInMatch = line.match(/^for\s+([a-zA-Z_]\w*)\s+in\s+(.+?)\s*;\s*do\s*$/);
            if (!forInMatch) forInMatch = line.match(/^for\s+([a-zA-Z_]\w*)\s+in\s+(.+?)\s*$/);
            if (forInMatch) {
                let loopVar = forInMatch[1]; let list = expand(forInMatch[2].trim());
                if ((list.startsWith('"') && list.endsWith('"')) || (list.startsWith("'") && list.endsWith("'"))) list = list.slice(1, -1);
                let listItems = list.split(/\s+/).filter(Boolean);
                if (!line.includes('; do') && !line.endsWith('do')) { while (i < blockLines.length && blockLines[i].trim() !== 'do') i++; i++; }
                let bodyStart = i; let depth = 0;
                while (i < blockLines.length) {
                    let trimmed = blockLines[i].trim();
                    if (trimmed.startsWith('for ') || trimmed.startsWith('while ') || trimmed.startsWith('until ')) depth++;
                    if (trimmed === 'done' || trimmed.startsWith('done ')) { if (depth === 0) break; depth--; }
                    i++;
                }
                let bodyLines = blockLines.slice(bodyStart, i); i++;
                for (let item of listItems) {
                    let loopVars = {}; loopVars[loopVar] = item;
                    result += execBlock(bodyLines, loopVars, {}, localDir);
                }
                continue;
            }
            // for ((init; cond; inc)); do ... done
            let forCStyleMatch = line.match(/^for\s*\(\s*\(\s*(.*?)\s*;\s*(.*?)\s*;\s*(.*?)\s*\)\s*\)\s*;?\s*do\s*$/);
            if (!forCStyleMatch) forCStyleMatch = line.match(/^for\s*\(\s*\(\s*(.*?)\s*;\s*(.*?)\s*;\s*(.*?)\s*\)\s*\)\s*$/);
            if (forCStyleMatch) {
                let init = forCStyleMatch[1].trim(); let cond = forCStyleMatch[2].trim(); let inc = forCStyleMatch[3].trim();
                if (!line.includes('do')) { while (i < blockLines.length && blockLines[i].trim() !== 'do') i++; i++; }
                let bodyStart = i; let depth = 0;
                while (i < blockLines.length) {
                    let trimmed = blockLines[i].trim();
                    if (trimmed.startsWith('for ') || trimmed.startsWith('while ') || trimmed.startsWith('until ')) depth++;
                    if (trimmed === 'done' || trimmed.startsWith('done ')) { if (depth === 0) break; depth--; }
                    i++;
                }
                let bodyLines = blockLines.slice(bodyStart, i); i++;
                if (init) {
                    let initParts = init.split(/,(?![^()]*\))/);
                    for (let p of initParts) { let eqIdx2 = p.indexOf('='); if (eqIdx2 > 0) mergedVars[p.substring(0, eqIdx2).trim()] = parseInt(expand(p.substring(eqIdx2 + 1).trim())) || 0; }
                }
                let maxIter = 10000;
                while (maxIter-- > 0) {
                    if (cond) { let condVal = evalArith(cond); if (!condVal) break; }
                    result += execBlock(bodyLines, {}, {}, localDir);
                    if (inc) {
                        let incParts = inc.split(/,(?![^()]*\))/);
                        for (let p of incParts) {
                            let incMatch2 = p.match(/^\+\+([a-zA-Z_]\w*)/);
                            if (incMatch2) { mergedVars[incMatch2[1]] = (parseInt(mergedVars[incMatch2[1]]) || 0) + 1; continue; }
                            incMatch2 = p.match(/^--([a-zA-Z_]\w*)/);
                            if (incMatch2) { mergedVars[incMatch2[1]] = (parseInt(mergedVars[incMatch2[1]]) || 0) - 1; continue; }
                            incMatch2 = p.match(/([a-zA-Z_]\w*)\+\+/);
                            if (incMatch2) { mergedVars[incMatch2[1]] = (parseInt(mergedVars[incMatch2[1]]) || 0) + 1; continue; }
                            incMatch2 = p.match(/([a-zA-Z_]\w*)--/);
                            if (incMatch2) { mergedVars[incMatch2[1]] = (parseInt(mergedVars[incMatch2[1]]) || 0) - 1; continue; }
                            incMatch2 = p.match(/([a-zA-Z_]\w*)\s*([-+*/%]?)=\s*(.+)/);
                            if (incMatch2) {
                                let iv = mergedVars[incMatch2[1]] || 0; let iop = incMatch2[2]; let iopVal = evalArith(incMatch2[3]);
                                switch(iop) {
                                    case '+': mergedVars[incMatch2[1]] = parseInt(iv) + iopVal; break;
                                    case '-': mergedVars[incMatch2[1]] = parseInt(iv) - iopVal; break;
                                    case '*': mergedVars[incMatch2[1]] = parseInt(iv) * iopVal; break;
                                    case '/': mergedVars[incMatch2[1]] = Math.floor(parseInt(iv) / iopVal); break;
                                    case '%': mergedVars[incMatch2[1]] = parseInt(iv) % iopVal; break;
                                    default: mergedVars[incMatch2[1]] = iopVal; break;
                                }
                            }
                        }
                    }
                }
                continue;
            }
            // while condition; do ... done
            let whileMatch = line.match(/^while\s+(.+?)\s*;?\s*do\s*$/);
            if (whileMatch) {
                let condText2 = whileMatch[1].trim();
                if (!line.includes('do')) { while (i < blockLines.length && blockLines[i].trim() !== 'do') i++; i++; }
                let bodyStart = i; let depth = 0;
                while (i < blockLines.length) {
                    let trimmed = blockLines[i].trim();
                    if (trimmed.startsWith('while ') || trimmed.startsWith('for ') || trimmed.startsWith('if ')) depth++;
                    if (trimmed === 'done' || trimmed.startsWith('done ')) { if (depth === 0) break; depth--; }
                    i++;
                }
                let bodyLines = blockLines.slice(bodyStart, i); i++;
                let maxIter = 5000;
                while (maxIter-- > 0) {
                    let condResult = parseTest(condText2);
                    if (!condResult) break;
                    result += execBlock(bodyLines, {}, {}, localDir);
                }
                continue;
            }
            // Single-line if
            let slIfMatch = line.match(/^if\s+(.+?)\s*;\s*then\s+(.+)\s*;\s*fi\s*$/);
            if (slIfMatch) {
                if (parseTest(slIfMatch[1].trim())) {
                    let body = slIfMatch[2].trim(); let stmts = body.split(/\s*;\s*/);
                    for (let stmt of stmts) {
                        let s = stmt.trim(); if (!s) continue;
                        let aM = s.match(/^([a-zA-Z_]\w*)=(.*)/);
                        if (aM) {
                            let aV = aM[2].trim();
                            if ((aV.startsWith('"') && aV.endsWith('"')) || (aV.startsWith("'") && aV.endsWith("'"))) aV = aV.slice(1, -1);
                            mergedVars[aM[1]] = expand(aV);
                        } else { result += execBlock([s], {}, {}, localDir); }
                    }
                }
                continue;
            }
            // if ...; then ... elif ...; then ... else ... fi
            let ifMatch = line.match(/^if\s+(.+?)\s*;?\s*then\s*$/);
            if (ifMatch) {
                let ifCond = ifMatch[1].trim();
                if (!line.includes('then')) { while (i < blockLines.length && blockLines[i].trim() !== 'then') i++; i++; }
                let thenLines = []; let elifBlocks = []; let elseLines = null; let depth = 0;
                while (i < blockLines.length) {
                    let trimmed = blockLines[i].trim();
                    if (trimmed.startsWith('if ') || trimmed.startsWith('for ') || trimmed.startsWith('while ')) depth++;
                    if (trimmed === 'fi' || trimmed.startsWith('fi ')) { if (depth === 0) break; depth--; }
                    if (depth === 0 && (trimmed.startsWith('elif ') || trimmed.startsWith('else'))) {
                        depth--;
                        let kw = trimmed.startsWith('elif') ? 'elif' : 'else';
                        if (kw === 'elif') {
                            let elifCond = trimmed.replace(/^elif\s+/, '').replace(/;?\s*then\s*$/, '').trim(); let elifBody = [];
                            i++;
                            while (i < blockLines.length) {
                                let t = blockLines[i].trim();
                                if (t.startsWith('if ') || t.startsWith('for ') || t.startsWith('while ')) depth++;
                                if (t === 'fi' || t.startsWith('fi ')) { if (depth <= 0) break; depth--; }
                                if (depth <= 0 && (t.startsWith('elif ') || t.startsWith('else'))) break;
                                elifBody.push(blockLines[i]); i++;
                            }
                            elifBlocks.push({ cond: elifCond, body: elifBody });
                            continue;
                        } else {
                            elseLines = []; i++;
                            while (i < blockLines.length) {
                                let t = blockLines[i].trim();
                                if (t.startsWith('if ') || t.startsWith('for ') || t.startsWith('while ')) depth++;
                                if (t === 'fi' || t.startsWith('fi ')) { if (depth <= 0) break; depth--; }
                                elseLines.push(blockLines[i]); i++;
                            }
                            break;
                        }
                        depth++;
                    }
                    if (depth > 0 || !trimmed.startsWith('elif') && !trimmed.startsWith('else')) { thenLines.push(blockLines[i]); }
                    i++;
                }
                i++; // skip fi
                if (parseTest(ifCond)) { result += execBlock(thenLines, {}, {}, localDir); }
                else {
                    let elifHit = false;
                    for (let eb of elifBlocks) { if (parseTest(eb.cond)) { result += execBlock(eb.body, {}, {}, localDir); elifHit = true; break; } }
                    if (!elifHit && elseLines) { result += execBlock(elseLines, {}, {}, localDir); }
                }
                continue;
            }
            // . file or source file (include)
            let includeMatch = line.match(/^(\.|source)\s+(.+)/);
            if (includeMatch) {
                let includePath = expand(includeMatch[2].trim());
                let incAbs = includePath.startsWith('/') ? includePath : (includePath.startsWith('./') ? localDir + '/' + includePath.slice(2) : localDir + '/' + includePath);
                let incNode = getNode(incAbs);
                if (incNode && incNode.type === 'file') {
                    let incLines = (incNode.content || '').split('\n');
                    result += execBlock(incLines, {}, {}, incAbs.substring(0, incAbs.lastIndexOf('/')));
                }
                continue;
            }
            // read [-p prompt] var [var2 ...]
            let readMatch = line.match(/^read\s+(.*)/);
            if (readMatch) {
                let readArgs = readMatch[1].trim(); let prompt = '';
                let pMatch = readArgs.match(/-p\s+"([^"]*)"\s*(.*)/) || readArgs.match(/-p\s+'([^']*)'\s*(.*)/);
                if (pMatch) { prompt = pMatch[1]; readArgs = pMatch[2].trim(); }
                let expandedPrompt = prompt ? expand(prompt) : '';
                let readVars = readArgs.split(/\s+/).filter(Boolean);
                if (expandedPrompt) {
                    if (!state._cmdSubCapture) result += expandedPrompt;
                    else state._readOutputBuf = (state._readOutputBuf||'') + expandedPrompt;
                }
                if (readVars.length > 0) {
                    let inputVal;
                    // 交互运行：弹窗请求真实输入，预置答案仅作默认值
                    const def = readIdx < readPool.length ? readPool[readIdx++] : '';
                    inputVal = window.prompt(expandedPrompt || ('请输入 ' + (readVars[0] || '变量') + ' 的值：'), def);
                    if (inputVal === null) inputVal = def;
                    if (!state._cmdSubCapture) result += inputVal + '\n';
                    else state._readOutputBuf = (state._readOutputBuf||'') + inputVal + '\n';
                    let firstVar = readVars[0];
                    let arrElemMatch = firstVar.match(/^([a-zA-Z_]\w*)\[(\d+)\]$/);
                    let arrDynMatch = !arrElemMatch ? firstVar.match(/^([a-zA-Z_]\w*)\[\$([a-zA-Z_]\w*)\]$/) : null;
                    if (arrElemMatch) {
                        let arrName = arrElemMatch[1], arrIdx = parseInt(arrElemMatch[2]);
                        if (!Array.isArray(mergedVars[arrName])) mergedVars[arrName] = [];
                        mergedVars[arrName][arrIdx] = inputVal;
                    } else if (arrDynMatch) {
                        let arrName = arrDynMatch[1], idxVar = arrDynMatch[2];
                        let arrIdx = parseInt(mergedVars[idxVar] || 0);
                        if (!Array.isArray(mergedVars[arrName])) mergedVars[arrName] = [];
                        mergedVars[arrName][arrIdx] = inputVal;
                    } else { mergedVars[firstVar] = inputVal; }
                    for (let ri = 1; ri < readVars.length; ri++) { mergedVars[readVars[ri]] = ''; }
                }
                continue;
            }
            // exit [n]
            if (line.startsWith('exit')) { let codeMatch = line.match(/^exit\s+(\d+)/); mergedVars['?'] = codeMatch ? parseInt(codeMatch[1]) : 0; break; }
            // return [n]
            if (line.startsWith('return')) { let codeMatch = line.match(/^return\s+(\d+)/); mergedVars['?'] = codeMatch ? parseInt(codeMatch[1]) : 0; break; }
            // shift [n]
            if (line.startsWith('shift')) { continue; }
            // unset var
            let unsetMatch = line.match(/^unset\s+(.+)/);
            if (unsetMatch) { delete mergedVars[unsetMatch[1].trim()]; continue; }
            // Variable assignment: var=value
            let assignMatch = line.match(/^([a-zA-Z_]\w*)=(.*)/);
            if (assignMatch && !line.match(/^(echo|if|for|while|until|case|select|cd|rm|ls|mkdir|touch|cat|chmod|exit|return|export|local|declare|unset|read|shift|test|let|exec|eval|trap|kill|source|\.|type|command|builtin|set|printf)\s*[= ]/) && !(assignMatch[2].trim().startsWith('$(') && !assignMatch[2].trim().startsWith('$(('))) {
                let aName = assignMatch[1]; let aVal = assignMatch[2].trim();
                if (!aVal.startsWith('(')) {
                    if ((aVal.startsWith('"') && aVal.endsWith('"')) || (aVal.startsWith("'") && aVal.endsWith("'"))) {
                        aVal = aVal.slice(1, -1); aVal = expand(aVal);
                    } else { aVal = expand(aVal); }
                    mergedVars[aName] = aVal; continue;
                }
            }
            // let expr
            if (line.startsWith('let ')) {
                let letBody = line.substring(4).trim();
                // let var++ / let var--
                let incMatch = letBody.match(/^([a-zA-Z_]\w*)(\+\+|--)$/);
                if (incMatch) {
                    let v = Number(getVar(incMatch[1]) || 0);
                    setVar(incMatch[1], incMatch[2] === '++' ? v + 1 : v - 1);
                }
                // let var=expr
                else {
                    let assignMatch = letBody.match(/^([a-zA-Z_]\w*)=(.*)/);
                    if (assignMatch) {
                        let vName = assignMatch[1];
                        let vVal = evalArith(assignMatch[2].trim());
                        if (vVal === undefined || vVal === null) vVal = 0;
                        setVar(vName, Number(vVal) || 0);
                    } else {
                        // bare expression: let "expr" — evaluate for truthiness
                        evalArith(letBody);
                    }
                }
                continue;
            }
            // echo [-n] [args...]
            if (line.startsWith('echo')) {
                let echoArgs = line.substring(4).trim(); let noNewline = false;
                if (echoArgs.startsWith('-n')) { noNewline = true; echoArgs = echoArgs.substring(2).trim(); }
                let expanded = expand(echoArgs);
                if ((expanded.startsWith('"') && expanded.endsWith('"')) || (expanded.startsWith("'") && expanded.endsWith("'"))) { expanded = expanded.slice(1, -1); }
                result += expanded;
                if (!noNewline) result += '\n';
                continue;
            }
            // Command substitution: var=$(command)
            let cmdSubMatch = line.match(/^\s*(\w+)=\s*\$\(([^(].*)\)\s*$/);
            if (cmdSubMatch && cmdSubMatch[1]) {
                let innerCmd = cmdSubMatch[2].trim(); let innerTokens = tokenizeLine(innerCmd); let subCmd = innerTokens[0];
                if (funcs[subCmd]) {
                    let subArgs = innerTokens.slice(1);
                    let oldP = {};
                    for (let pi = 1; pi <= 9; pi++) oldP[pi] = mergedVars[String(pi)];
                    let oldAt = mergedVars['@'], oldStar = mergedVars['*'], oldHash = mergedVars['#'];
                    let expandedArgs = [];
                    for (let ai = 0; ai < subArgs.length; ai++) {
                        let expanded = expand(subArgs[ai]);
                        if (subArgs[ai].match(/\[\@\]|\[\*\]/)) { for (let s of expanded.split(/\s+/).filter(Boolean)) expandedArgs.push(s); }
                        else { expandedArgs.push(expanded); }
                    }
                    for (let pi = 1; pi <= expandedArgs.length; pi++) { mergedVars[String(pi)] = expandedArgs[pi-1]; }
                    mergedVars['@'] = expandedArgs; mergedVars['*'] = expandedArgs; mergedVars['#'] = expandedArgs.length;
                    let fLines = funcs[subCmd].body.split('\n');
                    let savedFlag = state._cmdSubCapture;
                    state._cmdSubCapture = true;
                    let savedReadBuf = state._readOutputBuf || '';
                    state._readOutputBuf = '';
                    let fOut = execBlock(fLines, {}, {}, localDir);
                    if (state._readOutputBuf) result += state._readOutputBuf;
                    state._readOutputBuf = savedReadBuf;
                    state._cmdSubCapture = savedFlag || false;
                    let fLines2 = fOut.split('\n').filter(Boolean);
                    let captured = fLines2.length > 0 ? fLines2[fLines2.length-1] : '0';
                    mergedVars[cmdSubMatch[1]] = captured;
                    for (let pi = 1; pi <= 9; pi++) mergedVars[String(pi)] = oldP[pi] !== undefined ? oldP[pi] : '';
                    mergedVars['@'] = oldAt; mergedVars['*'] = oldStar; mergedVars['#'] = oldHash;
                } else { mergedVars[cmdSubMatch[1]] = '0'; }
                continue;
            }
            // Function call
            let tokens = tokenizeLine(line);
            if (tokens.length > 0) {
                let cmd = tokens[0];
                if (funcs[cmd]) {
                    let oldParams = {};
                    for (let pi = 1; pi <= 9; pi++) oldParams[String(pi)] = mergedVars[String(pi)];
                    let oldAt = mergedVars['@']; let oldStar = mergedVars['*']; let oldHash = mergedVars['#'];
                    let params = tokens.slice(1);
                    let expandedParams = [];
                    for (let ai = 0; ai < params.length; ai++) {
                        let expanded = expand(params[ai]);
                        if (params[ai].match(/\[\@\]|\[\*\]/)) { for (let s of expanded.split(/\s+/).filter(Boolean)) expandedParams.push(s); }
                        else { expandedParams.push(expanded); }
                    }
                    for (let pi = 1; pi <= expandedParams.length; pi++) { mergedVars[String(pi)] = expandedParams[pi-1]; }
                    mergedVars['@'] = expandedParams; mergedVars['*'] = expandedParams; mergedVars['#'] = expandedParams.length;
                    let funcResult = simulateScript(funcs[cmd].body, localDir + '/func.sh');
                    result += funcResult;
                    for (let pi = 1; pi <= 9; pi++) {
                        if (oldParams[String(pi)] !== undefined) mergedVars[String(pi)] = oldParams[String(pi)];
                        else delete mergedVars[String(pi)];
                    }
                    mergedVars['@'] = oldAt; mergedVars['*'] = oldStar; mergedVars['#'] = oldHash;
                    continue;
                }
            }
        }
        state._getVarCtx = savedCtx;
        return result;
    }
    // Execute the main body
    let mainResult = execBlock(lines, {}, {}, scriptDir);
    return mainResult;
}
// ═══════════════════════════════════════════════════════════
// ─── 自定义题目管理面板 ───
// ═══════════════════════════════════════════════════════════
const manage = {
    selectedExpId: null, selectedItemIdx: null, editingMode: null, // 'exp' | 'item'
    draft: null,
};
function openManagePanel() {
    document.getElementById('manageOverlay').classList.add('open');
    if (manage.selectedExpId === null && experiments.length > 0) {
        selectExp(experiments[0].id);
    }
    else {
        renderManageExpList();
        renderManageItemsList();
        renderManageForm();
    }
    updateManageStats();
}
function closeManagePanel() {
    document.getElementById('manageOverlay').classList.remove('open');
}
function renderManageExpList() {
    const list = document.getElementById('manageExpList');
    if (!list) return;
    if (experiments.length === 0) {
        list.innerHTML = '<div class="pane-empty">还没有实验<br>点击右上角"＋ 新建"</div>';
        return;
    }
    let html = '';
    for (const exp of experiments) {
        const active = (exp.id === manage.selectedExpId) ? ' active' : '';
        const count = (exp.itemIdxs || []).length;
        const sub = count + ' 道题' + (exp.isScript ? ' · 脚本实验' : '');
        html += '<div class="list-item' + active + '" onclick="selectExp(' + exp.id + ')">';
        html += escapeHtml(exp.title);
        html += '<div class="item-sub">' + sub + '</div>';
        html += '</div>';
    }
    list.innerHTML = html;
}
function selectExp(eid) {
    const exp = getExpById(eid);
    if (!exp) return;
    manage.selectedExpId = eid;
    manage.selectedItemIdx = null;
    manage.editingMode = 'exp';
    manage.draft = JSON.parse(JSON.stringify(exp));
    renderManageExpList();
    renderManageItemsList();
    renderManageForm();
}
function renderManageItemsList() {
    const list = document.getElementById('manageItemsList');
    const title = document.getElementById('manageItemsTitle');
    if (!list) return;
    const exp = getExpById(manage.selectedExpId);
    if (!exp) {
        if (title) title.textContent = '题目列表';
        list.innerHTML = '<div class="pane-empty">请先在左侧选择实验</div>';
        return;
    }
    if (title) title.textContent = '题目 · ' + exp.title;
    const items = getExpItems(exp);
    if (items.length === 0) {
        list.innerHTML = '<div class="pane-empty">还没有题目<br>点击"＋ 新建"</div>';
        return;
    }
    let html = '';
    items.forEach(function (item, pos) {
        const active = (pos === manage.selectedItemIdx) ? ' active' : '';
        let sub = '';
        if (item.cmd) sub = '$ ' + item.cmd;
        else if (item.script) sub = '脚本: ' + (item.filename || 'script.sh');
        else sub = '(无命令/脚本)';
        html += '<div class="list-item' + active + '" onclick="selectItem(' + pos + ')">';
        html += (pos + 1) + '. ' + escapeHtml(item.label || '(未命名)');
        html += '<div class="item-sub">' + escapeHtml(sub) + '</div>';
        html += '</div>';
    }
    );
    list.innerHTML = html;
}
function selectItem(pos) {
    const exp = getExpById(manage.selectedExpId);
    const item = exp ? getExpItems(exp)[pos] : null;
    if (!item) return;
    manage.selectedItemIdx = pos;
    manage.editingMode = 'item';
    manage.draft = JSON.parse(JSON.stringify(item));
    renderManageItemsList();
    renderManageForm();
}
function renderManageForm() {
    const formTitle = document.getElementById('manageFormTitle');
    const formMode = document.getElementById('manageFormMode');
    const formBody = document.getElementById('manageFormBody');
    const formDelete = document.getElementById('manageFormDelete');
    if (!formBody) return;
    if (!manage.editingMode || !manage.draft) {
        if (formTitle) formTitle.textContent = '编辑表单';
        if (formMode) formMode.textContent = '';
        formBody.innerHTML = '<div class="pane-empty">请在左侧选择实验，再选择具体题目进行编辑</div>';
        formDelete.style.display = 'none';
        return;
    }
    if (manage.editingMode === 'exp') {
        if (formTitle) formTitle.textContent = '编辑实验';
        if (formMode) formMode.textContent = '· 实验设置';
        formBody.innerHTML = '<div class="form-group">' + '<label class="form-label">实验标题</label>' + '<input class="form-input" id="f_exp_title" value="' + escapeHtml(manage.draft.title) + '">' + '</div>' + '<div class="form-group">' + '<label class="form-check">' + '<input type="checkbox" id="f_exp_isScript"' + (manage.draft.isScript ? ' checked' : '') + '>' + '是脚本实验（点击主按钮会打开脚本编辑器）' + '</label>' + '</div>' + '<div class="form-hint">提示：修改标题会立即更新终端左侧和脚本编辑器的导航。</div>';
        formDelete.style.display = 'inline-block';
    }
    else if (manage.editingMode === 'item') {
        if (formTitle) formTitle.textContent = '编辑题目';
        if (formMode) formMode.textContent = '· 题目设置';
        formBody.innerHTML = '<div class="form-group">' + '<label class="form-label">显示名称（必填）</label>' + '<input class="form-input" id="f_item_label" value="' + escapeHtml(manage.draft.label || '') + '">' + '</div>' + '<div class="form-group">' + '<label class="form-label">命令（点击时填入终端输入框）</label>' + '<input class="form-input" id="f_item_cmd" value="' + escapeHtml(manage.draft.cmd || '') + '" placeholder="例如：ls -la">' + '</div>' + '<div class="form-group">' + '<label class="form-label">脚本内容（点击时打开脚本编辑器）</label>' + '<textarea class="form-textarea tall" id="f_item_script" placeholder="#!/bin/bash&#10;echo Hello"></textarea>' + '</div>' + '<div class="form-group">' + '<label class="form-label">脚本文件名（仅脚本题使用）</label>' + '<input class="form-input" id="f_item_filename" value="' + escapeHtml(manage.draft.filename || '') + '" placeholder="例如：test.sh">' + '</div>' + '<div class="form-hint">提示：命令和脚本可同时设置（有脚本时优先打开脚本编辑器）。</div>';
        document.getElementById('f_item_script').value = manage.draft.script || '';
        formDelete.style.display = 'inline-block';
    }
}
function saveCurrentForm() {
    if (manage.editingMode === 'exp') {
        const exp = getExpById(manage.selectedExpId);
        if (!exp) return;
        const titleEl = document.getElementById('f_exp_title');
        const scriptEl = document.getElementById('f_exp_isScript');
        if (titleEl && titleEl.value.trim()) exp.title = titleEl.value.trim();
        if (scriptEl) exp.isScript = scriptEl.checked;
        saveExperiments();
        renderShortcutPanel();
        renderEditorShortcutPanel();
        renderManageExpList();
        renderManageItemsList();
        updateManageStats();
    }
    else if (manage.editingMode === 'item') {
        const exp = getExpById(manage.selectedExpId);
        if (!exp) return;
        const item = getExpItems(exp)[manage.selectedItemIdx];
        if (!item) return;
        const labelEl = document.getElementById('f_item_label');
        const cmdEl = document.getElementById('f_item_cmd');
        const scriptEl = document.getElementById('f_item_script');
        const filenameEl = document.getElementById('f_item_filename');
        item.label = (labelEl ? labelEl.value.trim() : '') || '(未命名)';
        item.cmd = cmdEl ? cmdEl.value : '';
        item.script = scriptEl ? scriptEl.value : '';
        const fn = filenameEl ? filenameEl.value.trim() : '';
        if (fn) item.filename = fn;
        else delete item.filename;
        if (!item.cmd) delete item.cmd;
        if (!item.script) {
            delete item.script;
            delete item.filename;
        }
        saveExperiments();
        renderManageItemsList();
    }
}
function deleteCurrentForm() {
    if (manage.editingMode === 'exp') {
        if (!confirm('确定要删除该实验？\n其中的题目会一并删除。')) return;
        experiments = experiments.filter(e => e.id !== manage.selectedExpId);
        manage.selectedExpId = experiments.length > 0 ? experiments[0].id : null;
        manage.editingMode = manage.selectedExpId !== null ? 'exp' : null;
        manage.draft = manage.selectedExpId !== null ? JSON.parse(JSON.stringify(getExpById(manage.selectedExpId))) : null;
        saveExperiments();
        renderShortcutPanel();
        renderEditorShortcutPanel();
        renderManageExpList();
        renderManageItemsList();
        renderManageForm();
        updateManageStats();
    }
    else if (manage.editingMode === 'item') {
        const exp = getExpById(manage.selectedExpId);
        if (!exp) return;
        if (!confirm('确定要删除这道题？')) return;
        if (!Array.isArray(exp.items)) exp.items = getExpItems(exp).slice();
        exp.items.splice(manage.selectedItemIdx, 1);
        manage.selectedItemIdx = exp.items.length > 0 ? 0 : null;
        manage.editingMode = exp.items.length > 0 ? 'item' : null;
        manage.draft = manage.selectedItemIdx !== null ? JSON.parse(JSON.stringify(exp.items[0])) : null;
        saveExperiments();
        renderManageItemsList();
        renderManageForm();
        renderShortcutPanel();
        renderEditorShortcutPanel();
        updateManageStats();
    }
}
function addExperiment() {
    const newId = experiments.length > 0 ? Math.max(...experiments.map(e => e.id)) + 1 : 1;
    const newExp = {
        id: newId, title: '实验 ' + (experiments.length + 1), isScript: false, itemIdxs: []
    };
    experiments.push(newExp);
    saveExperiments();
    renderShortcutPanel();
    renderEditorShortcutPanel();
    selectExp(newId);
    updateManageStats();
}
function addItem() {
    const exp = getExpById(manage.selectedExpId);
    if (!exp) {
        alert('请先在左侧选择一个实验');
        return;
    }
    if (!Array.isArray(exp.items)) exp.items = getExpItems(exp).slice();
    exp.items.push({ label: '新题目 ' + (exp.items.length + 1), cmd: '', script: '' });
    saveExperiments();
    manage.selectedItemIdx = exp.items.length - 1;
    manage.editingMode = 'item';
    manage.draft = JSON.parse(JSON.stringify(exp.items[exp.items.length - 1]));
    renderManageItemsList();
    renderManageForm();
    renderShortcutPanel();
    renderEditorShortcutPanel();
    updateManageStats();
}
function moveItem(dir) {
    const exp = getExpById(manage.selectedExpId);
    if (!exp || manage.selectedItemIdx === null) return;
    if (!Array.isArray(exp.items)) exp.items = getExpItems(exp).slice();
    const i = manage.selectedItemIdx;
    const j = i + dir;
    if (i < 0 || j < 0 || j >= exp.items.length) return;
    const tmp = exp.items[i];
    exp.items[i] = exp.items[j];
    exp.items[j] = tmp;
    manage.selectedItemIdx = j;
    saveExperiments();
    renderManageItemsList();
    renderShortcutPanel();
    renderEditorShortcutPanel();
}
function updateManageStats() {
    const el = document.getElementById('manageStats');
    if (!el) return;
    const usedSet = new Set();
    experiments.forEach(e => (e.itemIdxs || []).forEach(i => usedSet.add(i)));
    el.textContent = '共 ' + experiments.length + ' 个实验 · ' + usedSet.size + ' 道题（池中 ' + expData.length + '）';
}
function exportExpData() {
    const data = {
        expData, experiments, _exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json'
    }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '实验题目_' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
function importExpData(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
        try {
            const data = JSON.parse(e.target.result);
            if (!data || !Array.isArray(data.experiments) || !Array.isArray(data.expData)) {
                throw new Error('文件格式不正确（需要包含 experiments 和 expData 数组）');
            }
            if (!confirm('导入将覆盖当前所有实验和题目，是否继续？\n（建议先导出当前数据备份）')) return;
            expData = data.expData;
            experiments = data.experiments;
            saveExperiments();
            manage.selectedExpId = experiments.length > 0 ? experiments[0].id : null;
            manage.selectedItemIdx = null;
            manage.editingMode = manage.selectedExpId !== null ? 'exp' : null;
            manage.draft = manage.selectedExpId !== null ? JSON.parse(JSON.stringify(getExpById(manage.selectedExpId))) : null;
            renderShortcutPanel();
            renderEditorShortcutPanel();
            renderManageExpList();
            renderManageItemsList();
            renderManageForm();
            updateManageStats();
            alert('导入成功！共 ' + experiments.length + ' 个实验，' + expData.length + ' 道题。');
        }
        catch (err) {
            alert('导入失败：' + err.message);
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}
function resetExpData() {
    if (!confirm('确定要恢复默认实验与题目？\n所有自定义改动将丢失（建议先导出备份）')) return;
    experiments = JSON.parse(JSON.stringify(DEFAULT_EXPERIMENTS));
    // expData 保留原硬编码默认值（用户可能也想重置 expData？此处不重置，因为 expData 改动是局部的） saveExperiments();
    manage.selectedExpId = experiments.length > 0 ? experiments[0].id : null;
    manage.selectedItemIdx = null;
    manage.editingMode = manage.selectedExpId !== null ? 'exp' : null;
    manage.draft = manage.selectedExpId !== null ? JSON.parse(JSON.stringify(getExpById(manage.selectedExpId))) : null;
    renderShortcutPanel();
    renderEditorShortcutPanel();
    renderManageExpList();
    renderManageItemsList();
    renderManageForm();
    updateManageStats();
    alert('已恢复默认实验结构！');
}
// ─── 虚拟机快照：文件系统与用户/组状态持久化 ───
const VM_SNAPSHOT_KEY = 'ubuntu_terminal_vm_v2';
let vmSaveTimer = null;
function saveVmSnapshot() {
    if (!state.currentUser) return;
    clearTimeout(vmSaveTimer);
    vmSaveTimer = setTimeout(function () {
        try {
            localStorage.setItem(VM_SNAPSHOT_KEY, JSON.stringify({
                v: 2, name: state.currentUser, device: deviceName,
                fsTree: fsTree, users: state.users, passwords: state.passwords, groups: state.groups,
                cwd: cwd, isRoot: state.isRoot, sudoAuthenticated: state.sudoAuthenticated,
                disk: diskPartitions, hist: cmdHistory
            }));
        } catch (e) { /* 存储配额不足时静默放弃快照 */ }
    }, 250);
}
function tryRestoreVm(name) {
    try {
        const raw = localStorage.getItem(VM_SNAPSHOT_KEY);
        if (!raw) return false;
        const snap = JSON.parse(raw);
        if (!snap || snap.v !== 2 || snap.name !== name || !snap.fsTree) return false;
        fsTree = snap.fsTree;
        state.users = snap.users || state.users;
        state.passwords = snap.passwords || state.passwords;
        state.groups = snap.groups || state.groups;
        state.isRoot = !!snap.isRoot;
        state.sudoAuthenticated = !!snap.sudoAuthenticated;
        cwd = snap.cwd || ('/home/' + name);
        if (snap.device) deviceName = snap.device;
        if (snap.disk) diskPartitions = snap.disk;
        if (Array.isArray(snap.hist)) { cmdHistory = snap.hist; histNavIdx = cmdHistory.length; }
        return true;
    } catch (e) { return false; }
}
window.resetVm = function () {
    if (!confirm('确定要重置虚拟机吗？\n所有文件、用户与组的改动都会丢失。')) return;
    localStorage.removeItem(VM_SNAPSHOT_KEY);
    location.reload();
};
// ─── 初始化：加载持久化数据 + 渲染两个面板 ───
loadExperiments();
renderShortcutPanel();
loadSharedExperimentsFromServer();
renderEditorShortcutPanel();