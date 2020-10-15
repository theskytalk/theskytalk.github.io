/* 
 
A : Create own vapid, Create RTC Registration
A : Embed above with name into URL and copy to clipboard

B : Show invited to chat by name
B : Create own vapid, Create RTC Remote
B : Send above with B's name to A's VAPID

A : Save B's vapid
A : Create RTC Remote
A : On-Connect move to chat
 
*/


let rtc_conf = {
    iceServers: [{
        urls: [

            'stun:stun.l.google.com:19302',
            'stun:stun1.l.google.com:19302',
            'stun:stun2.l.google.com:19302',
            'stun:stun3.l.google.com:19302',
            'stun:stun4.l.google.com:19302',
            'stun:stun01.sipphone.com',
            'stun:stun.xten.com',

        ]
    }]
};
let rtc_peer_con = new RTCPeerConnection(rtc_conf);

let chat_channel;

let local_offer;
let remote_offer;

let mutex = false;

function errHandler(err) {
    console.log(err);
}

const chatHandler = (e) => {
    chat_channel.onopen = (e) => {
    }
    chat_channel.onmessage = (e) => {
        console.log('incoming: ' + e.data);
        document.getElementById('display').innerHTML += `<div class="l">${e.data}</div>`;
        document.getElementById('display').scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
    chat_channel.onclose = () => {
        console.log('chat channel closed');
        console.log('connection closed');
    }
}

function sendMsg() {
    // if (t === "1") {
    // 	m = '!#$AP' + m;
    // }
    let m = document.getElementById('msg').value;
    document.getElementById('msg').value = "";
    document.getElementById('display').innerHTML += `<div class="r">${m}</div>`;
    document.getElementById('display').scrollIntoView({ behavior: 'smooth', block: 'start' });
    chat_channel.send(m);
    // return false;
}

// ON SUCCESSFUL RTC CHAT CON
rtc_peer_con.ondatachannel = (e) => {
    nav('talking');

    if (e.channel.label === 'chatChannel') {
        chat_channel = e.channel;
        chatHandler(e.channel);
    }
}

// RTC CONNECTION STATE

rtc_peer_con.onicecandidate = (e) => {
    var cand = e.candidate;
    if (!cand) {
        // console.log('iceGatheringState complete', rtc_peer_con.localDescription.sdp);
        local_offer = JSON.stringify(rtc_peer_con.localDescription);
        console.log(local_offer);
        if (role === 'B') {
            console.log('now');
            connect_A();
        }
        // document.getElementById('local').value = local_offer;
    } else {
        // console.log(cand.candidate);
    }
}

rtc_peer_con.oniceconnectionstatechange = () => {
    console.log('iceconnectionstatechange: ', rtc_peer_con.iceConnectionState);
    if (rtc_peer_con.iceConnectionState === "connected") {

        ses_state = "talking";
        mutex = true;
        setTimeout(() => {
            ses_state = "talking";
            nav('talking');
        }, 700);
    } else if (rtc_peer_con.iceConnectionState === "disconnected") {
        // document.getElementById('ping').disabled = true;
        console.log('disconnected');
    }
}

rtc_peer_con.onconnection = function (e) {
    console.log('onconnection ', e);
}

const remoteOffer = (d) => {
    // d = JSON.parse(d);
    var _remoteOffer = new RTCSessionDescription((d));
    rtc_peer_con.setRemoteDescription(_remoteOffer).then(function () {
        if (_remoteOffer.type == "offer") {
            rtc_peer_con.createAnswer().then(function (description) {
                rtc_peer_con.setLocalDescription(description).then(function () {
                    console.log('hmmm');
                    ses_state = 'talking';
                }).catch(errHandler);
            }).catch(errHandler);
        }
    }).catch(errHandler);
}

const createOffer = () => {
    chat_channel = rtc_peer_con.createDataChannel('chatChannel');
    chatHandler(chat_channel);
    rtc_peer_con.createOffer().then(des => {
        rtc_peer_con.setLocalDescription(des).then(() => {

            setTimeout(function () {
                if (rtc_peer_con.iceGatheringState == "complete") {
                    if (role === 'A') {
                        nav('waiting');
                    }
                    init_wait();
                    return;
                } else {
                    local_offer = JSON.stringify(rtc_peer_con.localDescription);
                }
                // nav('waiting');
                init_wait();
            }, 2000);
            // console.log('setLocalDescription ok');
        }).catch(errHandler);
    }).catch(errHandler);
}


// -------------------------------------------------------


const webpush = window.WebPushLib;
let vapidKeys;
let subs;
let name;
let ses_state;
let role;
let details_a;
let details_b;

let tempkeys = {
    "publicKey": "BG2Te_NBSFBA2Qm8TpeLz0TsPxR77Z1sS_7s_Rr0Fisyk-JC4DeztUeyDwD9gN4dZiTFRoAo8OTihORaRWV51aU",
    "privateKey": "PDKcyLgwVJQ_aM9qJh5PLyjn4PWw3mRVebIYvBtFze8"
}

const readParams = () => {
    let params = new URLSearchParams(new URL(window.location.href).search);
    return params;
}

const init_checks = () => {
    if ('serviceWorker' in navigator === false) {
        document.getElementById('sw-stat').innerText += ' ❌';
    } else {
        document.getElementById('sw-stat').innerText += ' ✅';
    }
}


function sendNotificationToPeer(subscription, data) {
    if (subscription) {
        // set VAPID details
        webpush.setVapidDetails(
            'mailto:newacetone@example.com',
            vapidKeys.publicKey,
            vapidKeys.privateKey
        );
        // get substantial info from subscription data - {Object}
        const rawSubscription = JSON.parse(JSON.stringify(subscription))

        let payload = JSON.stringify({
            title: 'Ping',
            body: data
        })
        // define options [in seconds]
        let options = {
            TTL: 60 // 1 minute
        }
        // send notification
        webpush.sendNotification(rawSubscription, payload, options).then(response => {
            console.log("Web Push Notification is sended 🚀 !")
        }).catch(e => {
            console.error(e)
        })
    }
}

function jsonEscape(str) {
    return str.replace(/\n/g, "\\\\n").replace(/\r/g, "\\\\r").replace(/\t/g, "\\\\t");
}

const connect_A = () => {
    let obj = {};
    obj['vapid'] = subs;
    obj['rem_offer'] = local_offer.replace(/"/g, '~');
    obj['who'] = name;
    let objs = JSON.stringify(obj);
    console.log(objs);

    sendNotificationToPeer(details_a.vapid, objs);

}


const init_remote = (p) => {
    let d = p.get('session');
    let dd = JSON.parse(d);
    details_a = dd;
    document.getElementById('invite').innerHTML = `${dd.who} is inviting you to a session`;
}


const init_wait = () => {
    console.log(' ~~~~~~~~~~~~~~~~~~~~~ called ~~~~~~~~~~~~~~~~~~~~~');
    let obj = {};
    obj['vapid'] = subs;
    obj['reg_offer'] = local_offer.replace(/"/g, '~');
    obj['who'] = name;
    let objs = JSON.stringify(obj);
    console.log(objs);

    // var uurl = window.location.href.replace('waiting', '');
    var uurl = 'http://192.168.1.104:8887/';
    uurl = uurl + '?session=' + encodeURIComponent(objs);
    document.getElementById('ses-url').value = uurl;

}

const copy_session = () => {
    document.getElementById("ses-url").select();
    document.execCommand("copy");
    document.getElementById("copy").innerText = "Copied!";
}

const create_session = () => {
    console.log(name);
    console.log(subs);
    if (role === 'A') {
        ses_state = 'waiting';
        createOffer();
    } else if (role === 'B') {
        let d = details_a.reg_offer;
        d = JSON.parse(d.replace(/~/g, '"'));
        remoteOffer(d);
    }

    // sendNotificationToPeer(subs, name);
}

const subscribe = async () => {
    const applicationServerKey = urlB64ToUint8Array(vapidKeys.publicKey);
    let r = await SW.active.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey
    }).catch((e) => {
        console.log('Failed to subscribe the user: ', e);
        return;
    })
    if (r !== undefined) {
        console.log('User is subscribed.');
        subs = r;
        document.getElementById('not-grant').outerHTML = "";
        document.getElementById('not-stat').innerText += " ✅";

    } else {
        console.log('User denied permission');
        document.getElementById('not-grant').outerHTML = "";
        document.getElementById('not-stat').innerText += " ❌"
    }

}

// setTimeout(() => {
//     console.log('yo');
//     let n = document.getElementById('name');
//     n.oninput = (e) => {
//         e = document.getElementById('name').value;
//         if (e.length > 4 && subs) {
//             name = e;
//             document.getElementById('start').disabled = false;
//         }
//     }

// }, 3000)


const connect_B = (d) => {
    x1 = JSON.parse(d);
    x2 = JSON.parse(x1.body)
    x3 = JSON.parse(x2.rem_offer.replace(/~/g, '"'));
    remoteOffer(x3);
}


const new_flow = () => {
    if (tempkeys) {
        vapidKeys = tempkeys;
    } else {
        vapidKeys = webpush.generateVAPIDKeys();
    }
    console.log(JSON.stringify(vapidKeys, null, 4));
    subscribe();
}




function urlB64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}


document.onkeypress = function (e) {
    if (e.keyCode === 13 && ses_state === 'talking') {
        sendMsg();

    }
};

const pathEvents = (e) => {
    console.log('event for ' + e);
    let params = readParams();

    if (e === 'talking' && mutex===false) {
        nav('');
        console.log('reroute for: ' + 'route is ' + e + ' ses state is ' + ses_state)
        console.log('mutex is ' + mutex);
        return;
    }

    if (e === 'home' && params.has('session')) {
        console.log('run in link opened mode');
        role = "B";

        init_checks();
        init_remote(params);

    }

    if (e === 'home' && !params.has('session')) {
        role = "A";
        init_checks();
    }



    if (e === 'waiting' && ses_state !== 'waiting') {
       if(ses_state!=='talking') {
        nav('');
       }
        console.log('reroute for: ' + ses_state)
    }

}