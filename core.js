const webpush = window.WebPushLib;

let vapidKeys = {
    publicKey: "BN6aUQkxLqOgFmN0kfyE7nE6PGQmeMeQLr_B2dTwTQzqKMZcVEkyjWgCOFb9SWNhvgRaJgVBvRqpTtHdYYm5tH0",
    privateKey: "_l-mtD8DMOOh1NO2D7ukYyBBwVO5BlKD0ekVsjLJMgE"
};

let subs;
let name;
let ses_state = "init";
let role;
let details_a;
let details_b;
let rtc_conf = {
    iceServers: [{
        urls: [
            'stun:stun.l.google.com:19302',
            'stun:stun1.l.google.com:19302',
            'stun:stun2.l.google.com:19302',
            'stun:stun01.sipphone.com',
            'stun:stun.xten.com',
        ]
    }]
};
let rtc_peer_con = new RTCPeerConnection(rtc_conf);
let chat_channel;
let local_offer;
let remote_offer;
let sessionsRefs;


let tempkeys = undefined;

// stable handlers
function sendMsg() {
    if (document.getElementById('chat').children.length !== 0 && document.getElementById('chat').children[document.getElementById('chat').children.length - 1].classList.contains('lt')) {
        document.getElementById('chat').children[document.getElementById('chat').children.length - 1].outerHTML = "";
    }
    let m = document.getElementById('msg').value;
    document.getElementById('msg').value = "";
    document.getElementById('chat').innerHTML += `<div class="r">${m}</div>`;
    // document.getElementById('display').scrollIntoView({ behavior: 'smooth', block: 'start' });
    chat_channel.send(m);
    // return false;
    if (scrolled) {
        // scrollToBottom();
    }
    scrolled = false;
}

function streamMsg() {
    let m = '#$!i5Ty*' + document.getElementById('msg').value;
    chat_channel.send(m);

}

function errHandler(err) {
    console.log(err);
}

function writeMsg(e) {
    let m = (e.data === undefined) ? e : e.data;
    if (m.includes('#$!i5Ty*')) {
        m = m.replace('#$!i5Ty*', '');
        if (m === '') {
            if (document.getElementById('chat').children.length !== 0 && document.getElementById('chat').children[document.getElementById('chat').children.length - 1].classList.contains('lt')) {
                document.getElementById('chat').children[document.getElementById('chat').children.length - 1].outerHTML = "";
            }
            return;
        }
        if (document.getElementById('chat').children.length !== 0 && document.getElementById('chat').children[document.getElementById('chat').children.length - 1].classList.contains('lt')) {
            document.getElementById('chat').children[document.getElementById('chat').children.length - 1].innerText = m;
        } else if (document.getElementById('chat').children.length !== 0) {
            document.getElementById('chat').innerHTML += `<div class="lt">${m}</div>`;
        }
    } else {
        try {
            if (document.getElementById('chat').children[document.getElementById('chat').children.length - 1].classList.contains('lt')) {
                document.getElementById('chat').children[document.getElementById('chat').children.length - 1].outerHTML = "";
            }
        } catch (e) { };
        document.getElementById('chat').innerHTML += `<div class="l">${m}</div>`;
    }
    if (scrolled && !bottom) {
        bottomShowHide(1);
        document.getElementById('bottom-button').style.background = "#8a7fdb";
    } else if (bottom) {
        scrollToBottom();
        console.log('scrolling to bottom on new message');

    } else {
        document.getElementById('bottom-button').style.background = "#8a7fdb";

    }

}

function chatHandler(e) {
    chat_channel.onopen = (e) => {
    }
    chat_channel.onmessage = (e) => {
        console.log('incoming: ' + e.data);
        writeMsg(e);
    }
    chat_channel.onclose = () => {
        console.log('chat channel closed');
        console.log('connection closed');
    }
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
            console.log('calling connect A');
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
        setTimeout(() => {
            ses_state = "talking";
            nav('talking');
            // console.log('from x101');
            if (role === "A") {
                document.getElementById('talkingto').innerHTML = `<p>${details_b.who}</p>`;
                saveSessionRef(details_b_raw);
            } else {
                document.getElementById('talkingto').innerHTML = `<p>${details_a.who}</p>`;
                saveSessionRef(details_a);
            }

        }, 700);
    } else if (rtc_peer_con.iceConnectionState === "disconnected") {
        console.log('disconnected');
    }
}

rtc_peer_con.onconnection = function (e) {
    console.log('onconnection ', e);
}


// dynamic functions

function saveSessionRef(data) {
    if (localStorage.sessions) {
        let p = JSON.parse(localStorage.sessions);
        let r = localStorage.sessions.filter((e) => e.who === data.who);
        if (r.length === 0) {
            p.push(data);
            localStorage.sessions = JSON.stringify(p);
        }
    } else {
        let p = [];
        p.push(data);
        localStorage.sessions = JSON.stringify(p);
    }
}

function reconnect(e) {
    console.log(sessionsRefs[e]);
    // new_flow();
    role = 'A';
    createOffer();


    setTimeout(async () => {
        console.log('reconnecting');
        let obj = {};
        await subscribe();
        obj['reg_offer'] = local_offer.replace(/"/g, '~');
        obj['who'] = localStorage.name;
        obj['recon'] = true;
        obj['vapid'] = subs;
        let objs = JSON.stringify(obj);
        sendNotificationToPeer(sessionsRefs[e].vapid, objs);
    }, 5000)
    // let obj = {};
    // // obj['vapid'] = subs;
    // obj['rem_offer'] = { "hello": "hello" }
    // obj['who'] = "hello";
    // let objs = JSON.stringify(obj);
    // sendNotificationToPeer(sessionsRefs[e].vapid, objs);
}

function buildSessionTiles() {
    let t;
    if (sessionsRefs.length === 0) {
        t = `<p>No previous records</p>`;
        document.getElementById('reading-body').innerHTML = `<center>${t}</center>`
    } else {
        t = "";
        let i = 0;
        sessionsRefs.map((e) => {
            // let z = JSON.stringify(e);
            t += `<div class="reading-tile" onclick="reconnect(${i})">${e.who}</div>`
        });
        document.getElementById('reading-body').innerHTML = t;
        i++;
    }

}

function readSessionRef() {
    if (localStorage.sessions) {
        sessionsRefs = JSON.parse(localStorage.sessions);
    } else {
        sessionsRefs = [];
    }

    buildSessionTiles();
}

const remoteOffer = (d, rc) => {
    var _remoteOffer = new RTCSessionDescription((d));
    rtc_peer_con.setRemoteDescription(_remoteOffer).then(function () {
        if (_remoteOffer.type == "offer") {
            rtc_peer_con.createAnswer().then(function (description) {
                rtc_peer_con.setLocalDescription(description).then(function () {
                    ses_state = 'talking';
                    if (rc !== undefined) {
                        setTimeout(() => {
                            let obj = {};
                            obj['rem_offer'] = local_offer.replace(/"/g, '~');
                            obj['who'] = localStorage.name;
                            obj['recon'] = true;
                            let objs = JSON.stringify(obj);
                            sendNotificationToPeer(details_a.vapid, objs);
                        }, 5000)
                    }
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
                        // nav('waiting');
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
    obj['who'] = (name === undefined) ? localStorage.name : name;
    let objs = JSON.stringify(obj);
    console.log('Connecting A, calling by B');
    console.log(objs);

    sendNotificationToPeer(details_a.vapid, objs);

}

const init_remote = (p) => {
    document.getElementById('inviting').innerHTML = `Connecting to ${details_a.who}`;
}

const init_wait = () => {
    console.log('waiting');
    let obj = {};
    obj['vapid'] = subs;
    obj['reg_offer'] = local_offer.replace(/"/g, '~');
    obj['who'] = name;
    let objs = JSON.stringify(obj);
    console.log(objs);

    var uurl = window.location.href.replace('waiting', '');
    // var uurl = 'http://192.168.29.229:8887/'
    uurl = uurl + '?session=' + encodeURIComponent(objs);
    document.getElementById('ses-url').value = uurl;
    document.getElementById('copy').innerHTML = "COPY 📋";
    document.getElementById('copy').disabled = false;

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

const subscribe = async (t) => {
    const applicationServerKey = urlB64ToUint8Array(vapidKeys.publicKey);
    let r = await SW.active.pushManager.getSubscription({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey
    }).catch((e) => {
        console.log('Failed to subscribe the user: ', e);
        return;
    });
    // console.log(r);

    if (r === null) {
        console.log('No sub');
        let rr = await SW.active.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: applicationServerKey
        }).catch((e) => {
            console.log('Failed to subscribe the user: ', e);
            return;
        })
        if (rr !== undefined) {
            console.log('User is subscribed.');
            subs = rr;
            if (t === undefined) {
                create_session();

            }
            // document.getElementById('not-grant').outerHTML = "";
            // document.getElementById('not-stat').innerText += " ✅";

        } else {
            console.log('User denied permission');
            // document.getElementById('not-grant').outerHTML = "";
            // document.getElementById('not-stat').innerText += " ❌"
        }


    } else {
        subs = r;
        if (t === undefined) {
            create_session();
        }

    }
}

let details_b_raw;

const connect_B = (d) => {
    console.log('connect b called by sw');
    let x1 = JSON.parse(d);
    let x2 = JSON.parse(x1.body)
    details_b_raw = x2;
    let x3 = JSON.parse(x2.rem_offer.replace(/~/g, '"'));
    details_b = x2;
    remoteOffer(x3);
}


const new_flow = () => {
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
