var output = document.getElementById("output")
var stdin = document.getElementById("stdin")
var errors = document.getElementById("errors")
var firepad;
var firepadRef = getExampleRef();
var editor = ace.edit("editor")
var session = editor.getSession();
session.setUseWrapMode(true);
session.setUseWorker(false);
editor.setTheme("ace/theme/monokai")
editor.getSession().setMode("ace/mode/c_cpp")

output.value = ''
stdin.value = ''
errors.value = ''

var firepad
function init() {
    var config = {
        apiKey: "AIzaSyDZp3pyrbZm34cnXJcVB5PzUeUOAkeaGHA",
        authDomain: "pascalcollab.firebaseapp.com",
        databaseURL: "https://pascalcollab.firebaseio.com"
    };

    firebase.initializeApp(config);

    firepad = Firepad.fromACE(firepadRef, editor, {
        defaultText: '#include <iostream>;\r\n\r\nusing namespace std;\r\n\r\nint main(){\r\n\r\n    cout << \"Hello World!\" << endl;\r\n\r\n    return 0;\r\n}\r\n'
    });
}

function getExampleRef() {
    var ref = firebase.database().ref();
    var hash = window.location.hash.replace(/#/g, '');
    if (hash) {
        ref = ref.child(hash);
    } else {
        ref = ref.push(); // generate unique location.
        window.location = window.location + '#' + ref.key; // add it as a hash to the URL.
    }
    console.log('Firebase data: ', ref.toString());
    return ref;
}

function Ex1(){
    var hash = window.location.hash.replace(/#/g, '');
    if(hash != '-KbecJaQd_evyTFkLuHV'){
        window.location = '#' + '-KbecJaQd_evyTFkLuHV';
        firepadRef = getExampleRef();
        firepad.dispose()
        editor.setValue('')
        firepad = Firepad.fromACE(firepadRef, editor)
    }
}

function Ex2(){
    var hash = window.location.hash.replace(/#/g, '');
    if(hash != '-KbeeU8CZgax96b9uk-9'){
        window.location = '#' + '-KbeeU8CZgax96b9uk-9';
        firepadRef = getExampleRef();
        firepad.dispose()
        editor.setValue('')
        firepad = Firepad.fromACE(firepadRef, editor)
    }
}

function SendCode(){
    var xhr = new XMLHttpRequest()
    var body = JSON.stringify({
        code: String(editor.getSession().getValue()),
        input: String(stdin.value)
    });

    output.value = ''
    stdin.value = ''
    errors.value = ''
    xhr.open('POST', '/compile', true)
    xhr.setRequestHeader('Content-type', 'application/json; charset=utf-8')
    xhr.send(body)
    xhr.onreadystatechange = function() {
        if (xhr.readyState != 4) return;

        button.innerHTML = "Send"
        button.disabled = false
        var res = JSON.parse(xhr.responseText)
        output.value = res.output
        errors.value = res.err
    }

    button.innerHTML = 'Loading...'
    button.disabled = true
    setTimeout(() => {button.innerHTML = "Send"; button.disabled = false}, 6500)
}