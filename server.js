const http = require('http');
const fs = require('fs');

const server = http.createServer((req, res) => {
    // 允许本地跨域访问
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.end();

    const dbFile = './local_kv.json'; // 你的“假 KV”数据库文件

    // 【保存数据】模拟 KV.put
    if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            fs.writeFileSync(dbFile, body); // 把数据存进文件
            console.log('✅ 数据已保存到本地文件');
            res.end('OK');
        });
    } 
    // 【读取数据】模拟 KV.get
    else {
        const data = fs.existsSync(dbFile) ? fs.readFileSync(dbFile) : '{"children":[]}';
        res.setHeader('Content-Type', 'application/json');
        res.end(data);
    }
});

server.listen(8787, () => {
    console.log('🚀 模拟 KV 已启动：http://localhost:8787');
    console.log('现在你可以去修改 app.tsx 里的 WORKER_URL 了');
});