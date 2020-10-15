let lastScroll = 0;
let scrolled = false;
let bottom = true;


const copy_session = async () => {
    let tocp = document.getElementById("ses-url").value;
    navigator.clipboard.writeText(tocp).then(function () {
        console.log('Async: Copying to clipboard was successful!');
        document.getElementById("copy").innerText = "COPIED!";
    }, function (err) {
        console.error('Async: Could not copy text: ', err);
    });
}

const readParams = () => {
    let params = new URLSearchParams(new URL(window.location.href).search);
    return params;
}

function scrollToBottom() {
    document.getElementById('bottom-button').style.background = "darkgrey";
    let element = document.getElementById('display');
    element.scrollTop = element.scrollHeight - element.clientHeight;
    bottomShowHide();
}

function bottomShowHide(r) {
    (r) ? document.querySelector('#bottom-button').style.display = "block" : document.querySelector('#bottom-button').style.display = "none";
}

function initAppCore() {
    // document.querySelector('#display').classList.add('scroll-on');
    let scrollbody = document.getElementById('display');
    document.getElementById('display').addEventListener('scroll', (e) => {
        // console.log(`${scrollbody.scrollHeight - scrollbody.clientHeight} / ${e.target.scrollTop}`);
        if (e.target.scrollTop < lastScroll) {
            // console.log('Going up')
            // document.querySelector('#display').classList.add('scroll-on');
            // document.querySelector('#display').classList.remove('scroll-off');
            // bottomShowHide();z
            scrolled = false;
            
            if(bottom && e.target.scrollTop+150 <= (scrollbody.scrollHeight - scrollbody.clientHeight)-150) {
                bottom = false;
                console.log('yp');
                bottomShowHide(1);
            }
        } else if (e.target.scrollTop > lastScroll) {
            // document.querySelector('#display').classList.add('scroll-off');
            // document.querySelector('#display').classList.remove('scroll-on');


            // console.log('Going Down');
            scrolled = true;
            // bottomShowHide(1);

        }
        // scrolled = true;
        // document.querySelector('#display').classList.add('scroll-off');
        // document.querySelector('#display').classList.remove('scroll-on');
        lastScroll = e.target.scrollTop;
        // scrolled = true;

        if(!bottom && e.target.scrollTop+30 >= (scrollbody.scrollHeight - scrollbody.clientHeight)-30) {
            console.log('scroll reached bottom');
            scrolled = false;
            bottomShowHide();
            document.getElementById('bottom-button').style.background = "darkgrey";
            bottom = true;
        }









    });
    document.getElementById('msg').addEventListener('focus', () => {
        setTimeout(() => {
            document.getElementById("display").style.height = "72vh";
            scrollToBottom();
            setTimeout(()=>{
                scrollToBottom();
            }, 200);
        }, 200);
        scrollToBottom();
    });

    document.getElementById('msg').addEventListener('blur', () => {
        document.getElementById("display").style.height = "84vh";
        scrolled = false;
        // document.querySelector('#display').classList.add('scroll-on');
        // document.querySelector('#display').classList.remove('scroll-off');
    });

    document.getElementById('msg').addEventListener('keyup', ()=>{streamMsg();});



}

function startApp() {
    let params = readParams();
    role = params.has('session') ? "B" : "A";
    name = document.getElementById('name').value;

    if (name === "" || name === undefined) {
        return
    }
    localStorage.name = name;

    if (role === "A") {
        elState('wait', 0);
        nav('/waiting');
        ses_state = "waiting_b";
    } else if (role === "B") {
        elState('invite', 0);
        ses_state = "waiting_a";
        let d = params.get('session');
        details_a = JSON.parse(d);
        nav('/waiting');
        document.getElementById('inviting').innerHTML = `Connecting to ${details_a.who}...`;
    }
    new_flow();
}


document.onkeypress = function (e) {
    if (e.keyCode === 13 && ses_state === 'talking') {
        sendMsg();
    }
};


const pathEvents = (e) => {
    console.log('event for ' + e);
    if (e === 'waiting' && ses_state === "init") {
        nav('');
    }

    if (e === 'talking' && rtc_peer_con.iceConnectionState !== "connected" && localStorage.name!==undefined) {
        nav('/reading');
    }

    if (e === 'talking' && rtc_peer_con.iceConnectionState !== "connected" && localStorage.name!==undefined ) {
        nav('/reading');
    }

    if (e === 'talking' && rtc_peer_con.iceConnectionState !== "connected" && localStorage.name === undefined) {
        nav('');
    }



    if (e === 'reading') {
        readSessionRef();
    }
}


