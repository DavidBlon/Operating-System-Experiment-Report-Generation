// 单元测试：路径解析 / 权限字符串 / 转义 / 名字过滤 / 管道与重定向解析 / grep / sort / VFS
(function () {
    // 测试会触发 executePipeline → saveVmSnapshot，先备份用户的真实快照，结束后还原
    const __origSnap = (typeof VM_SNAPSHOT_KEY !== 'undefined')
        ? localStorage.getItem(VM_SNAPSHOT_KEY) : null;
    window.addEventListener('beforeunload', () => restoreOrigSnap());
    function restoreOrigSnap() {
        try {
            if (__origSnap === null) localStorage.removeItem(VM_SNAPSHOT_KEY);
            else localStorage.setItem(VM_SNAPSHOT_KEY, __origSnap);
        } catch (e) { /* ignore */ }
    }
    const results = [];
    let passed = 0, failed = 0;

    function assert(name, cond, detail) {
        if (cond) { passed++; results.push('<div class="row pass">✓ ' + name + '</div>'); }
        else { failed++; results.push('<div class="row fail">✗ ' + name + (detail ? ' → ' + detail : '') + '</div>'); }
    }
    function eq(name, actual, expected) {
        assert(name, actual === expected, '实际: ' + JSON.stringify(actual) + '，期望: ' + JSON.stringify(expected));
    }

    // ─── 路径解析 ───
    eq('resolvePath 绝对路径原样解析', resolvePath('/etc/nginx'), '/etc/nginx');
    eq('resolvePath 相对路径基于 cwd', resolvePath('Documents') === '/home/username/Documents' || resolvePath('Documents'), true);
    eq('resolvePath .. 回到上级', resolvePath('/home/username/..'), '/home');
    eq('resolvePath .. 不越界', resolvePath('/..'), '/');
    eq('resolvePath . 保持不变', resolvePath('/etc/.'), '/etc');

    // ─── 权限字符串 ───
    eq('permStr 755', permStr('755'), 'rwxr-xr-x');
    eq('permStr 644', permStr('644'), 'rw-r--r--');
    eq('permStr 777', permStr('777'), 'rwxrwxrwx');
    eq('permStr 600', permStr('600'), 'rw-------');

    // ─── 大小格式化 ───
    eq('formatSize 字节', formatSize(512), '512');
    eq('formatSize KB', formatSize(2048), '2.0K');
    eq('formatSize MB', formatSize(1572864), '1.5M');

    // ─── HTML 转义 ───
    const xss = '<img src=x onerror=alert(1)>"\'&';
    const esc = escapeHtml(xss);
    assert('escapeHtml 移除尖括号与引号', !/[<>"']/.test(esc), esc);
    eq('sanitizeName 剥离危险字符', sanitizeName("<script>a'll</script>ert(1)"), 'scriptallscriptert1');

    // ─── 重定向 / 管道解析 ───
    const r1 = parseRedirect('echo hi > f.txt');
    eq('parseRedirect > 模式', r1 && r1.mode, '>');
    eq('parseRedirect > 目标', r1 && r1.target, 'f.txt');
    eq('parseRedirect > 剩余命令', r1 && r1.rest, 'echo hi');
    const r2 = parseRedirect('cat a.log >> b.txt');
    eq('parseRedirect >> 追加模式', r2 && r2.mode, '>>');
    eq('parseRedirect 普通命令返回 null', parseRedirect('echo a - b'), null);
    eq('splitPipe 三段管道', splitPipe('ls -l | grep src | wc -l').length, 3);
    eq('splitPipe 无管道单段', splitPipe('ls -l').length, 1);

    // ─── grep 核心 ───
    const sample = ['root:x:0:0:root:/root:/bin/bash', 'daemon:x:1:1:daemon', 'rooter:x:2:2'];
    eq('grepLines 子串匹配', grepLines(sample, 'root').length, 2);
    eq('grepLines -v 反转', grepLines(sample, 'root', { v: true }).length, 1);
    eq('grepLines -i 忽略大小写', grepLines(['ABCdef'], 'abcd', { i: true }).length, 1);
    eq('grepLines 无效正则按字面量', grepLines(['a[b c'], 'a[b').length, 1);
    eq('grepLines 行号正确', grepLines(sample, 'daemon')[0].no, 2);

    // ─── sort 核心 ───
    eq('sortLines -n 数值排序', sortLines(['10', '2', '1'], { n: true }).join(','), '1,2,10');
    eq('sortLines 字典排序', sortLines(['b', 'a', 'c']).join(','), 'a,b,c');

    // ─── VFS ───
    assert('getNode 读取 /etc/hostname', getNode('/etc/hostname') && getNode('/etc/hostname').type === 'file');
    eq('getNode 不存在路径返回 null', getNode('/no/such/path'), null);
    assert('getNode 根目录是 dir', getNode('/') && getNode('/').type === 'dir');

    // ─── 集成：重定向写文件 + 管道读取 ───
    runSimpleCommand('echo integration-test > /tmp/__t.txt');
    const node = getNode('/tmp/__t.txt');
    assert('重定向创建文件并写入内容', !!node && node.content.indexOf('integration-test') >= 0, node && node.content);
    runSimpleCommand('echo integration-test >> /tmp/__t.txt');
    eq('>> 追加不覆盖', getNode('/tmp/__t.txt').content.match(/integration-test/g).length, 2);
    const captured = runCaptured('cat /tmp/__t.txt');
    assert('runCaptured 捕获命令输出', captured.indexOf('integration-test') >= 0, captured);
    runSimpleCommand('rm -f /tmp/__t.txt');
    eq('清理测试文件', getNode('/tmp/__t.txt'), null);

    // ─── 通配符 ───
    eq('globMatch 前缀匹配', globMatch('Doc*').join(','), 'Documents');
    eq('globMatch 子目录匹配', globMatch('Documents/*.md').join(','), 'Documents/notes.md');
    eq('globMatch 无匹配返回空', globMatch('*.xyz123').length, 0);
    assert('globMatch 不匹配隐藏文件', !globMatch('*').some(n => n.startsWith('.')), globMatch('*').join(','));
    eq('globMatch ? 单字符', globMatch('Documents/notes.m?').join(','), 'Documents/notes.md');

    // ─── 环境变量 ───
    eq('expandEnv $USER/$HOME', expandEnv('$USER home is $HOME'), 'username home is /home/username');

    // ─── 权限判断 ───
    assert('canRead /etc/passwd（其他用户可读）', canRead(getNode('/etc/passwd')) === true);
    assert('canRead /etc/shadow 被拒绝（640 root:shadow）', canRead(getNode('/etc/shadow')) === false);
    assert('canWrite /etc/passwd 被拒绝（root 所有）', canWrite(getNode('/etc/passwd')) === false);

    // ─── 退出码与 && / || 语义（executePipeline 层做拆分）───
    document.getElementById('history').innerHTML = '';
    executePipeline('ls /__nope__ && echo SHOULD_NOT_APPEAR', false);
    assert('&& 失败后跳过', !document.getElementById('history').innerText.includes('SHOULD_NOT_APPEAR'));
    document.getElementById('history').innerHTML = '';
    executePipeline('ls /__nope__ || echo FALLBACK_OK', false);
    assert('|| 失败后执行', document.getElementById('history').innerText.includes('FALLBACK_OK'));
    document.getElementById('history').innerHTML = '';
    executePipeline('ls /etc && echo AND_OK', false);
    assert('&& 成功后执行', document.getElementById('history').innerText.includes('AND_OK'));

    // ─── 通配符集成：touch + ls glob ───
    document.getElementById('history').innerHTML = '';
    runSimpleCommand('touch globA.txt globB.txt');
    const globOut = runCaptured('ls glob*.txt');
    assert('ls glob*.txt 展开两个文件', globOut.includes('globA.txt') && globOut.includes('globB.txt'), globOut);
    runSimpleCommand('rm -f globA.txt globB.txt');

    document.getElementById('results').innerHTML = results.join('');
    // 取消挂起的防抖快照保存，立即还原用户原始快照（避免测试污染主页虚拟机）
    try { clearTimeout(vmSaveTimer); } catch (e) { /* ignore */ }
    restoreOrigSnap();
    const s = document.getElementById('summary');
    s.innerHTML = failed === 0
        ? '<span style="color:#4ae234">全部通过：' + passed + ' 项 ✓</span>'
        : '<span style="color:#ef2929">通过 ' + passed + ' 项，失败 ' + failed + ' 项 ✗</span>';
})();
