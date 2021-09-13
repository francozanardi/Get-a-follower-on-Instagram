const getOneFollower = document.getElementById('getOneFollower');
const username = document.getElementById('username');
const buttonGetFollower = document.getElementById('buttonGetFollower');
const textDone = document.getElementById('textDone');
const textFail = document.getElementById('textFail');
const container = document.getElementById('container');
const auth = firebase.auth();
firebase.analytics();

function getInstagramId(username){
    auth.currentUser.getIdToken().then(function(idToken){
        $.post('follow_instagram', {username: username, idToken: idToken}).done(function(){
            container.classList.add('hide');
            textDone.classList.remove('hide');

        }).fail(function(err) {
            showInstagramError(err.responseText);
        });

    }).fail(function(err){
        showInstagramError();
    });
}

function showUserError(){
    buttonGetFollower.disabled = true;
    textFail.classList.remove('hide');
    textFail.innerText = 'Whoops! Something went wrong :( Try again later. If the error persists, try it in other browser';
}

function showInstagramError(err){
    if(err){
        textFail.innerText = err;
    } else {
        textFail.innerText = 'Whoops! Something went wrong :( Try again';
    }

    textFail.classList.remove('hide');
    buttonGetFollower.innerHTML = 'Get one follower';
    buttonGetFollower.disabled = false;
}

firebase.auth().signInAnonymously().catch(function(error) {
    showUserError();
});

getOneFollower.addEventListener('submit', function(e){
    e.preventDefault();

    if(auth.currentUser){
        buttonGetFollower.disabled = true;
        buttonGetFollower.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
        Loading...`;
        getInstagramId(username.value);
    } else {
        showUserError();
    }

});