const mqtt = require('mqtt')

const topicHead = ""
const subConfigType1 = 'd/35b'
const subConfigType2 = 'cmd/usbVideo/response'

// 创建MQTT客户端
const client = mqtt.connect(`ws://192.168.1.203:8083/mqtt`, { username: 'admin', password: 'Mwck68584959' })

// 连接成功事件
client.on('connect', () => {
    console.log('已连接到MQTT broker');
    client.subscribe(topicHead + subConfigType1); // 订阅状态统计请求主题
    client.subscribe(topicHead + subConfigType2); // 订阅状态统计请求主题
    setTimeout(() => {
        console.log("发送状态统计请求");
        client.publish(topicHead + `cmd/usbVideo/request`)
    }, 2000)
})
// 接收消息事件
client.on('message', (topic, message) => {
    if (topic.includes(subConfigType1)) {
        console.log("温湿度");
        console.log(`${new Date()}收到来自主题 ${topic}`, parseBuffer(Buffer.from(message)));
    } else if (topic.includes(subConfigType2)) {
        console.log("照片查询");
        console.log(`${new Date()}收到来自主题 ${topic}`);
    }
})
// 错误处理
client.on('error', (err) => {
    console.error('MQTT错误:', err)
})
// 断开连接事件
client.on('close', () => {
    console.log('已断开与MQTT broker的连接')
})
// 优雅退出
process.on('SIGINT', () => {
    client.end(() => {
        console.log('程序已退出')
        process.exit(0)
    })
})
function parseBuffer(buffer) {
    let offset = 0
    const sec = buffer.readUInt32LE(offset)
    offset += 4
    const msec = buffer.readUInt16LE(offset)
    offset += 2
    const len = buffer.readUInt16LE(offset)
    offset += 2
    const offsetValue = buffer.readUInt16LE(offset)
    offset += 2
    const railTempCh = buffer.readUInt8(offset)
    offset += 1
    const railTemp = buffer.readFloatLE(offset)
    offset += 4
    const ambientTempCh = buffer.readUInt8(offset)
    offset += 1
    const ambientTemp = buffer.readFloatLE(offset)
    offset += 4
    const ambientHumiCh = buffer.readUInt8(offset)
    offset += 1
    const ambientHumi = buffer.readFloatLE(offset)
    offset += 4
    return {
        sec,
        msec,
        len,
        offset: offsetValue,
        railTempCh,
        railTemp,
        ambientTempCh,
        ambientTemp,
        ambientHumiCh,
        ambientHumi
    }
}