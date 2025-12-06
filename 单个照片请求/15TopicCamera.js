const mqtt = require('mqtt');
const WebSocket = require('ws');
const fs = require('fs'); // 引入文件系统模块
const path = require('path'); // 引入路径模块
const servers = require('../servers');

const subConfigType = 'cmd/data/img/1/response';
const pubConfigType = 'cmd/data/img/1/request';

const topicHead = '1132/192.168.1.3/192.168.1.3/';
// const topicHead = '938/192.168.1.101/192.168.1.65/'

const IMAGE_SAVE_DIR = path.join(__dirname, 'images'); // 定义图片存储目录
const SAVE_INTERVAL_FRAMES = 2; // 设定每接收到 10 帧图片保存一次
let frameCount = 0; // 帧计数器

// --- 确保图片存储目录存在 ---
if (!fs.existsSync(IMAGE_SAVE_DIR)) {
    fs.mkdirSync(IMAGE_SAVE_DIR);
    console.log(`Created image storage directory: ${IMAGE_SAVE_DIR}`);
}
// -----------------------------

const wss = new WebSocket.Server({ port: 8081 });
console.log('WebSocket server running on ws://localhost:8081');

servers.forEach((server, idx) => {
    const client = mqtt.connect(server.url, server.options);

    client.subscribe(topicHead + subConfigType);

    // 每 100 毫秒请求一次图像（保持原逻辑）
    setInterval(() => {
        client.publish(topicHead + pubConfigType);
    }, 100);

    client.on('message', (topic, message) => {

        let jpegBuffer;

        try {
            // 解析 JSON 格式
            const imgObj = JSON.parse(message.toString());
            const arr = Uint8Array.from(imgObj.data);
            jpegBuffer = Buffer.from(arr);
        } catch (e) {
            // 旧格式，去掉 8 字节头
            jpegBuffer = message.subarray(8);
        }
        
        // --- 1. 将图片以jpg的形式存储在文件夹中 ---
        // frameCount++;
        // if (frameCount >= SAVE_INTERVAL_FRAMES) {
        //     // 获取当前时间并格式化
        //     const now = new Date();
        //     const year = now.getFullYear();
        //     const month = String(now.getMonth() + 1).padStart(2, '0');
        //     const day = String(now.getDate()).padStart(2, '0');
        //     const hour = String(now.getHours()).padStart(2, '0');
        //     const minute = String(now.getMinutes()).padStart(2, '0');
        //     const second = String(now.getSeconds()).padStart(2, '0');

        //     // 构造文件名：年-月-日_时分秒.jpg
        //     const filename = `${year}-${month}-${day}_${hour}${minute}${second}.jpg`;
        //     const filePath = path.join(IMAGE_SAVE_DIR, filename);

        //     fs.writeFile(filePath, jpegBuffer, (err) => {
        //         if (err) {
        //             console.error('Failed to save image:', err);
        //         } else {
        //             console.log(`Image saved: ${filename}`);
        //         }
        //     });

        //     // 重置计数器
        //     frameCount = 0;
        // }
        // ---------------------------------------------


        // --- 2. 推送二进制到网页 (保持原逻辑) ---
        wss.clients.forEach(ws => {
            console.log(new Date().toLocaleString() + '：' + '发送图片到客户端');
            
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(jpegBuffer);     // 不做任何编码处理！
            }
        });
    });

    client.on('error', (err) => {
        console.log(`[${idx}] ${server.url} 连接错误:`, err);
    });
});