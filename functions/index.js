const functions = require('firebase-functions');
const admin = require('firebase-admin');
const fetch = require("node-fetch");

var serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "your firebase database url"
});

const db = admin.database();
const auth = admin.auth();
const CANTIDAD_INTENTOS = 20;
const cookies = {
    mid: '',
    csrftoken: '',
    db_user_id: '',
    sessionid: ''
}

exports.follow_instagram = functions.https.onRequest((req, res) => {
    if(req.method != 'POST'){
        res.status(500).send('Error');
        return;
    }

    const instagramId = req.body.instagramId;
    const token = req.body.idToken;

    const myInit = {
        method: 'POST',
        headers: {
            "referer": "https://www.instagram.com/",
            "accept": "*/*",
            "Accept-Language": "en-GB,en;q=0.8",
            "cache-control": "no-cache",
            "content-length": "0",
            "Content-Type": "application/x-www-form-urlencoded",
            "cookie": 'mid=' + cookies.mid + '; csrftoken=' + cookies.csrftoken + '; ds_user_id=' + cookies.db_user_id + '; sessionid=' + cookies.sessionid + ';',
            "origin": "https://www.instagram.com",
            "pragma": "no-cache",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.87 Safari/537.36",
            'x-requested-with': 'XMLHttpRequest',
            'x-instagram-ajax': '1',
            'x-csrftoken': cookies.csrftoken
        },
        mode: 'cors',
        cache: 'default'
	};

    auth.verifyIdToken(token).then(decodedToken => {
        db.ref('users/' + decodedToken.uid).once('value').then(snapshot => {
            var cantUsos = snapshot.val();

            if(!cantUsos || cantUsos < CANTIDAD_INTENTOS){
                db.ref('users/' + decodedToken.uid).set(cantUsos+1);

                fetch('https://www.instagram.com/web/friendships/' + instagramId + '/follow/', myInit).then(okRes => {
                    res.status(200).send('ok');
                }).catch(err => {
                    console.log('err: ', err);
                    res.status(500).send('Whoops! Something went wrong :( Try again');
                });
            } else {
                res.status(500).send('Whoops! You have exceeded the limit of daily uses :( Try again later')
            }
        });

    }).catch(err => {
        res.status(500).send('Whoops! Something went wrong :( Try again');        
    })

});

//remove database every day
exports.removeDatabase = functions.pubsub.schedule('5 11 * * *')
  .timeZone('America/New_York')
  .onRun((context) => {
    db.ref().remove();
    return null;
});