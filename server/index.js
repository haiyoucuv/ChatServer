// const process = require('process');
// const child_process = require('child_process');
// const net = require('net');
// let socket = new net.Socket();


const ws = require('ws');
let uuid = require('uuid');

const DATA_TYPE = {
    NICKNAME: 'nickName',
    MESSAGE: 'message',
    NOTICE: 'notice',
    FIRST: 'first',
};

let clients = {};

let count = 0;

let wss = new ws.Server({
    host: '10.10.93.181',   // your ip
    port: 8888
});

wss.on('connection', function connection(ws, inMsg) {

    count++;

    let queryParams = getQuery(inMsg.url);

    const id = uuid.v1();
    let nickName = decodeURIComponent(queryParams.nickName || '匿名用户');

    clients[id] = {
        ws: ws,
        id: id
    };

    ws.on('message', function incoming(res) {
        let data = JSON.parse(res);

        let message = data.message;

        if (data.type === DATA_TYPE.NICKNAME) {
            message = `${nickName}将昵称改为:${data.message}`;
            nickName = data.message;
        }

        let sendData = getSendData(data.type, message, id, nickName);
        for (let k in clients) {
            clients[k].ws.send(sendData);
        }
    });

    /**
     * 断开，通知其他人离开了聊天
     */
    ws.on('close', function close(e) {
        count--;

        let sendData = getSendData(DATA_TYPE.NOTICE, `${nickName}离开了聊天。`, id);
        for (let k in clients) {
            clients[k].ws.send(sendData);
        }
    });

    // 发送自己的id过去
    // 'Hey, What\'s Up Brother? Long Time No See!'
    ws.send(getSendData(DATA_TYPE.FIRST, '', id));

    let sendData = getSendData(DATA_TYPE.NOTICE, `${nickName}进入聊天室`, id);
    for (let k in clients) {
        clients[k].ws.send(sendData);
    }
});

function getSendData(type, message, id, nickName) {
    return JSON.stringify({
        type: type,
        message: message,
        id: id,
        num: count,
        nickName: nickName,
    });
}

function getQuery(url) {
    let queryParams = {};
    for (let item of url.replace('/?', '').split('&')) {
        let arr = item.split('=');
        queryParams[arr[0]] = arr.length === 1 ? true : arr[1];
    }
    return queryParams;
}


