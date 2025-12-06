const mqtt = require('mqtt');
const servers = require('./servers');
var moment = require("moment");

const subConfigType = 'cameraConfig'
const topicHead = '1217/192.168.1.2/'
const PUB = 'CMD/ARGS/PUB/'
const UPDATE = 'CMD/ARGS/UPDATE/'
const GET = 'CMD/ARGS/GET/'




servers.forEach((server, idx) => {
    const client = mqtt.connect(server.url, server.options);
    client.subscribe(topicHead + PUB + subConfigType); // 订阅状态统计请求主题
    client.subscribe(topicHead + UPDATE + subConfigType); // 订阅状态统计请求主题
    client.on('connect', () => {
        // client.publish(topicHead + 'cmd/vibrational/request');
        // client.subscribe(topicHead + UPDATE + `/zzwyConfig`); // 订阅状态统计请求主题
    });
    client.on('message', (topic, message) => {
        console.log(topic, new Date().toLocaleString(), message.toString());
    });

    client.on('error', (err) => {
        console.log(`[${idx}] ${server.url} 连接错误:`, err);
    });
});