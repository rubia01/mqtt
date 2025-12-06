const mqtt = require('mqtt')

// MQTT broker配置
// const topicHead = '934/192.168.1.100/192.168.1.17/'
const topicHead = ""
const subConfigType = 'dataInterface'
const PUB = 'CMD/ARGS/PUB/'
const UPDATE = 'CMD/ARGS/UPDATE/'
const GET = 'CMD/ARGS/GET/'
const SET = 'CMD/ARGS/SET'

// 创建MQTT客户端
const client = mqtt.connect(`ws://192.168.1.159:8083/mqtt`, { username: 'root', password: '111111' })

// 连接成功事件
client.on('connect', () => {
    console.log('订阅时间', new Date().toLocaleString());
    client.subscribe(topicHead + PUB + subConfigType)
    client.subscribe(topicHead + UPDATE + subConfigType)
    setTimeout(() => {
        client.publish(topicHead + SET + subConfigType)
        client.publish(topicHead + GET + subConfigType)
    }, 2000)
})
// 接收消息事件
client.on('message', (topic, message) => {
    console.log("接收时间", topic, new Date().toLocaleString());
    console.log(`接收到消息：${message.toString()}`)

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