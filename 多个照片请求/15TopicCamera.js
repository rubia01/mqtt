const mqtt = require('mqtt');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const servers = require('../servers'); // 假设 servers 文件结构不变

const subConfigType = 'cmd/data/img/2/response';
const pubConfigType = 'cmd/data/img/2/request';

// --- 🎯 定义多个 topicHead ---
// 示例：可以包含不同的设备或 IP 地址组合
const topicHeads = [
    '1132/192.168.1.3/192.168.1.4/',
    '1132/192.168.1.3/192.168.1.3/',
    '1132/192.168.1.5/192.168.1.5/',
    '1132/192.168.1.5/192.168.1.6/',

];
// -----------------------------

const IMAGE_SAVE_DIR = path.join(__dirname, 'images');
const SAVE_INTERVAL_FRAMES = 10;
let frameCount = 0;

// --- 确保图片存储目录存在 (保持原逻辑) ---
if (!fs.existsSync(IMAGE_SAVE_DIR)) {
    fs.mkdirSync(IMAGE_SAVE_DIR);
    console.log(`Created image storage directory: ${IMAGE_SAVE_DIR}`);
}
// -----------------------------

const wss = new WebSocket.Server({ port: 8081 });
console.log('WebSocket server running on ws://localhost:8081');

// --- 辅助函数：从 topic 中提取 IP 地址 (如 192.168.1.3/192.168.1.4) ---
function extractIPFromTopic(topic) {
    // 假设 topic 格式为: <ID>/<IP1>/<IP2>/<type>
    const parts = topic.split('/');
    if (parts.length >= 4) {
        return `${parts[1]}/${parts[2]}`; // 返回 IP1/IP2
    }
    return 'Unknown IP';
}
// ----------------------------------------------------------------------


servers.forEach((server, idx) => {
    const client = mqtt.connect(server.url, server.options);

    // --- 🎯 订阅所有 topicHead 对应的响应主题 ---
    topicHeads.forEach(head => {
        const fullTopic = head + subConfigType;
        client.subscribe(fullTopic, (err) => {
            if (err) {
                console.error(`Subscription failed for ${fullTopic}:`, err);
            } else {
                console.log(`Subscribed to: ${fullTopic}`);
            }
        });
    });
    // ---------------------------------------------

    // --- 🎯 轮询请求所有 topicHead 的图像 ---
    // 为每个 topicHead 设置一个定时器发送请求
    topicHeads.forEach(head => {
        const fullPubTopic = head + pubConfigType;
        setInterval(() => {
            client.publish(fullPubTopic);
        }, 100);
    });
    // ------------------------------------

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


        // --- 2. 🎯 封装数据并推送 JSON 字符串到网页 ---
        const ipDisplay = extractIPFromTopic(topic);

        // 将 Buffer 转换为 Base64 字符串，以便可以嵌入 JSON 字符串中
        const base64Image = jpegBuffer.toString('base64');

        // 构造包含图片数据和来源 IP 的 JSON 对象
        const payload = {
            ip: ipDisplay,
            image: base64Image
        };

        const payloadString = JSON.stringify(payload);

        wss.clients.forEach(ws => {
            console.log(`${new Date().toLocaleString()}：发送图片到客户端，来源 IP: ${ipDisplay}`);

            if (ws.readyState === WebSocket.OPEN) {
                // 发送 JSON 字符串
                ws.send(payloadString);
            }
        });
        // ------------------------------------------
    });

    client.on('error', (err) => {
        console.log(`[${idx}] ${server.url} 连接错误:`, err);
    });
});