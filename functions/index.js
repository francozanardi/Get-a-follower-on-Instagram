const functions = require('firebase-functions');
const admin = require('firebase-admin');
const fetch = require("node-fetch");

var serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://getonefollower-d5a4f.firebaseio.com"
});

const db = admin.database();
const auth = admin.auth();
const CANTIDAD_INTENTOS = 20;

const cookies = {
    sessionid: 'you need it',
    csrftoken: 'dontCareValue'
}

const instagramDomain = "https://www.instagram.com/";

const headers = {
    "host": "www.instagram.com",
    "referer": instagramDomain,
    "accept": "*/*",
    "content-length": "0",
    "Content-Type": "application/x-www-form-urlencoded",
    "cookie": 'sessionid=' + cookies.sessionid + '; csrftoken=' + cookies.csrftoken,
    "origin": instagramDomain,
    "X-Csrftoken": cookies.csrftoken,
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.87 Safari/537.36",
};

exports.follow_instagram = functions.https.onRequest((req, res) => {
    if(req.method != 'POST'){
        res.status(500).send('Error');
        return;
    }

    const usernameToFollow = req.body.username;
    const token = req.body.idToken;
    const unexceptedError = "Whoops! Something went wrong :( Try again";

    auth.verifyIdToken(token).then(decodedToken => {
        db.ref('users/' + decodedToken.uid).once('value').then(snapshot => {
            var cantUsos = snapshot.val();

            if(cantUsos != undefined || cantUsos < CANTIDAD_INTENTOS){
                db.ref('users/' + decodedToken.uid).set(cantUsos+1);
                tryToFollow(usernameToFollow)
                    .then(followStatus => followStatus < 399 ?
                                                res.status(200).send('ok') :
                                                res.status(500).send(unexceptedError)
                    ).catch(err => res.status(500).send(unexceptedError));
            } else {
                res.status(500).send('Whoops! You have exceeded the limit of daily uses :( Try again later')
            }
        });

    }).catch(err => {
        res.status(500).send(unexceptedError);        
    })

});

function tryToFollow(username){
    return fetch(instagramDomain + username + '/?__a=1', {method: 'GET', headers: headers}).then(respId => {
        return respId.json();
    }).then(dataId => {
        let idToFollow = dataId.graphql.user.id;
        return fetch(instagramDomain + 'web/friendships/' + idToFollow + '/follow/', {method: 'POST', headers: headers}).then(respFollow => {
            console.log(respFollow.status);
            return respFollow.status;
        });
    });
}

//remove database every day
exports.removeDatabase = functions.pubsub.schedule('5 11 * * *')
  .timeZone('America/New_York')
  .onRun((context) => {
    db.ref().remove();
    return null;
});