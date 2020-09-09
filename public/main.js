const getOneFollower = document.getElementById('getOneFollower');
const username = document.getElementById('username');
const buttonGetFollower = document.getElementById('buttonGetFollower');
const textDone = document.getElementById('textDone');
const textFail = document.getElementById('textFail');
const container = document.getElementById('container');
const auth = firebase.auth();
firebase.analytics();

function getInstagramId(username){
    $.get('https://www.instagram.com/' + username + '/?__a=1').done(function(res){
        console.log('res: ', res);
        console.log('id: ', res.graphql.user.id);

        var id = res.graphql.user.id;

        auth.currentUser.getIdToken().then(function(idToken){
            $.post('follow_instagram', {instagramId: id, idToken: idToken}).done(function(){
                container.classList.add('hide');
                textDone.classList.remove('hide');
    
            }).fail(function(err) {
                showInstagramError(err.responseText);
            });
        }).catch(function(err){
            showInstagramError();
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