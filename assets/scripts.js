var output = document.getElementById("output");
var stdin = document.getElementById("stdin");
var errors = document.getElementById("errors");
var editor = ace.edit("editor");
var session = editor.getSession();
var firepad;
var uid;

session.setUseWrapMode(true);
session.setUseWorker(false);
editor.setTheme("ace/theme/monokai");
editor.getSession().setMode("ace/mode/pascal");

output.value = ''
stdin.value = ''
errors.value = ''

function init() {
    var config = {
        apiKey: "AIzaSyDZp3pyrbZm34cnXJcVB5PzUeUOAkeaGHA",
        authDomain: "pascalcollab.firebaseapp.com",
        databaseURL: "https://pascalcollab.firebaseio.com"
    };
    firebase.initializeApp(config);
    firebase.auth().signInAnonymously().catch(function(error) {
        var errorCode = error.code;
        var errorMessage = error.message;
        alert(errorCode + ":\n" + errorMessage);
    });
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            uid = user.uid;
        } else {}
    });
}

function changeTab(tabName) {
    var i
    var x = document.getElementsByClassName("tab")

    for (i = 0; i < x.length; i++) {
        x[i].style.display = 'none'
    }

    document.getElementById(tabName).style.display = "block"
    document.getElementById('selected').id = ''
    document.getElementsByClassName(tabName + 'L')[0].id = 'selected'
}


function sendCode() {
    var xhr = new XMLHttpRequest()
    var body = JSON.stringify({
        code: editor.getSession().getValue(),
        input: stdin.value
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
        if (res.output != '') {
            changeTab('output')
        }
        if (res.output === '' && res.errors != '') {
            changeTab('errors')
        }
    }

    button.innerHTML = 'Loading...'
    button.disabled = true
    setTimeout(() => {
        button.innerHTML = "Send";
        button.disabled = false
    }, 7500)
}

function addFile(parent, name) {
    var id = $(parent).attr('id') + '/' + name
    if (!document.getElementById(id) && name.search("/") === -1) {
        CreateCode(name);
        var li = $('<li></li>');
        var span = $("<span>" + name + "</span>");
        span.css("display", "inline-block");
        $(parent).prepend(li);
        li.append(span);
        li.append('<button class="btn" onClick = "removeFile(this, \'' + id +'\')">-</button>');
        li.attr('id', id);
        span.click(function(){
            var txt = li.text().slice(0,-1);
            GetCode(txt); 
        })
    } else alert('invalid name')
}

function removeFile(parent, id){
    id = id.slice(id.search("/") + 1);
    $(parent).parent().remove();
    var userRef = firebase.database().ref("users/" + uid +  "/" + id);
    var fileHash;
    userRef.once("value").then(function (snapshot){
        fileHash = snapshot.val();
        var codeRef = firebase.database().ref("usercode/" + fileHash);
        codeRef.remove();
        userRef.remove();
    });
}

function addFolder(parent, name) {
    var id = $(parent).attr('id') + '/' + name
    if (!document.getElementById(id)) {
        var ul = $('<ul></ul>')
        var span = $('<span></span>')
        $(parent).append(span)
        span.text(name)
        $(parent).append(ul)
        span.append('<button class="btn" onClick = "$(this).parent().next().remove(); $(this).parent().remove()">-</button>') //Запилить нормальное удаление
        ul.attr('id', id)
        addBtn(ul, '')
        span.click(function() {
            $(this).next().children().fadeToggle('fast')
        })
    } else alert('invalid name')
}

function addBtn(parent, name) {
    $(parent).prepend($('<button></button>').text('+' + name).attr({
        "onClick": "getName" + name + "(this)",
        "class": "btn"
    }))
}

addBtn($('#root'), 'F')
addBtn($('#root'), '')

//Escape sequences и проверка имен на совпадение!!!

function getName(parent) {
    $('.btn').css('visibility', 'hidden')
    var tarea = $('<textarea></textarea>')
    $(parent).before(tarea)
    tarea.keyup(function(e) {
        if (e.keyCode == 13) {
            var txt = tarea.val()
            txt = txt.slice(0,-1);
            tarea.remove()
            addFile($(parent).parent(), txt)
            $('.btn').css('visibility', 'visible')
        }
        if (e.keyCode == 27) {
            $('.btn').css('visibility', 'visible')
            tarea.remove()
        }
    });
}

function getNameF(parent) {
    $('.btn').css('visibility', 'hidden')
    var tarea = $('<textarea></textarea>')
    $(parent).before(tarea)
    tarea.keyup(function(e) {
        if (e.keyCode == 13) {
            var txt = tarea.val()
            $('.btn').css('visibility', 'visible')
            addFolder($(parent).parent(), txt)
            tarea.remove()
        }
        if (e.keyCode == 27) {
            $('.btn').css('visibility', 'visible')
            tarea.remove()
        }
    });
}

function CreateCode(filename){
    var ref = firebase.database().ref('usercode/').push();
    ref.set({
        creator: uid,
        collaborators: {
            user2: true
        },
        readers: {
            user3: true
        }
    });
    var code = "{ \"" + filename + "\" : \"" + ref.key + "\" }";
    code = JSON.parse(code)
    var usrRef = firebase.database().ref("users/" + uid).update(code); 
    ref = ref.child("code/");
    if (firepad) firepad.dispose()
    editor.setValue("")
    firepad = Firepad.fromACE(ref, editor, {
        defaultText: "begin\r\n\ \t writeln(\'hello world\');\r\nend."
    });
}

function GetCode(filename){
    $(".leftcol").addClass("disabled");
    var ref = firebase.database().ref("usercode/");
    var FileHash;
    firebase.database().ref("users/" + uid + "/" + filename).once("value").then(function(snapshot) {
        if (snapshot) {
            fileHash = snapshot.val();
            ref = ref.child(fileHash);
            ref = ref.child("code/")
            if (firepad) firepad.dispose()
            editor.setValue("")
            firepad = Firepad.fromACE(ref, editor, {
                defaultText: "begin\r\n\ \t writeln(\'hello world\');\r\nend."     
            });
            var f = function(){
                $(".leftcol").removeClass("disabled");
            }
            setTimeout(f, 500);
        }
    });
}