/*global $, document, firebase, ace, Firepad, console, alert, XMLHttpRequest, setTimeout*/
var output = document.getElementById("output");
var stdin = document.getElementById("stdin");
var errors = document.getElementById("errors");
var editor = ace.edit("editor");
var session = editor.getSession();
var firepad;
var currentFile = null;
var email;
var config = {
    apiKey: "AIzaSyDZp3pyrbZm34cnXJcVB5PzUeUOAkeaGHA",
    authDomain: "pascalcollab.firebaseapp.com",
    databaseURL: "https://pascalcollab.firebaseio.com"
};

function editorInit() { //Переписать с учетом ref
    var div = $("<div>");
    $("#editor").before(div);
    $("#editor").remove();
    div.attr("id", "editor");
    editor = ace.edit("editor");
    session = editor.getSession();
    session.setUseWrapMode(true);
    session.setUseWorker(false);
    editor.setTheme("ace/theme/monokai");
    editor.getSession().setMode("ace/mode/pascal");
}

function addBtn(parent) {
    var btn = $('<button></button>').text('Add File').attr({
        "onClick": "getName(this, addFile)",
        "class": "btn"
    });
    $(parent).prepend(btn);
}

function addBtnF(parent) {
    var btn = $('<button></button>').text('Add Folder').attr({
        "onClick": "getName(this, addFolder)",
        "class": "btn"
    });
    $(parent).prepend(btn);
}

function addBtnC(parent) {
    parent.append("<button onclick=\"getName(this, addCollaborator)\" class=\"btn\">Add collaborator</button>");
}

function getName(parent, callback) {
    $('.btn').hide();
    var tarea = $('<textarea></textarea>');
    $(parent).before(tarea);
    tarea.focus();
    tarea.keyup(function (e) {
        if (e.keyCode === 13) {
            var txt = tarea.val();
            txt = txt.slice(0, -1);
            tarea.remove();
            $('.btn').show();
            callback($(parent).parent(), txt, false);
        }
    });
    $("html").keyup(function (e) {
        if (e.keyCode === 27) {
            $('.btn').show();
            tarea.remove();
        }
    });
}

function CreateCode(filename, id) {
    var ref = firebase.database().ref("usercode/").push(),
        path = id.slice(0, id.search("/")) + "/" + email + "/" + id.slice(id.search("/") + 1).replace(/\//g, "/files/"),
        obj = '{ "hash": "' + ref.key + '", "type": "file"}';
    ref.set({
        creator: email
    });
    obj = JSON.parse(obj);
    firebase.database().ref(path).update(obj);
    currentFile = {
        ref: ref,
        id: id,
        name: filename
    };
    ref = ref.child("code/");
    editorInit();
    firepad = Firepad.fromACE(ref, editor, {
        defaultText: "begin\r\n \twriteln(\'hello world\');\r\nend."
    });
}

function GetCode(id) { //Перепилить для работы с шарой, root заменить на users/
    $(".container").addClass("disabled");
    var ref = firebase.database().ref("usercode/"),
        path = id.slice(0, id.search("/")) + "/" + email + "/" + id.slice(id.lastIndexOf("/") + 1).replace(/\//g, "/files/");
    firebase.database().ref(path + "/hash").once("value").then(function (snapshot) {
        if (snapshot) {
            var fileHash = snapshot.val();
            ref = ref.child(fileHash);
            currentFile = {
                ref: ref,
                id: id,
                name: id.slice(id.lastIndexOf("/") + 1)
            };
            ref = ref.child("code/");
            editorInit();
            firepad = Firepad.fromACE(ref, editor);
            $(".container").removeClass("disabled");
        }
    });
}

function checkName(name) {
    var arr = name;
    arr = arr.split(/[\\\/\.\#\$\[\]]/);
    if (arr.length === 1) {
        return true;
    }
    return false;
}

function signIn(email, password) {
    $("#signUp").hide();
    $("#signIn").hide();
    $("#signOut").show();
    $(".logIn").hide();
    firebase.auth().signInWithEmailAndPassword(email, password).catch(function (error) {
        var errorCode = error.code,
            errorMessage = error.message;
        console.log(errorCode + ": " + errorMessage);
    });
}

function signOut() {
    firebase.auth().signOut();
    $("#signUp").show();
    $("#signIn").show();
    $("#signOut").hide();
    $(".logIn").show();
    email = null;
    currentFile = null;
    $(".col ul").children().remove();
}

function signUp(email, password) {
    firebase.auth().createUserWithEmailAndPassword(email, password).catch(function (error) {
        $("#signUp").show();
        $("#signIn").show();
        $("#signOut").hide();
        $(".logIn").show();
        var errorCode = error.code,
            errorMessage = error.message;
        console.log(errorCode + ": " + errorMessage);
    });
}

function update(snapshot, parent) {
    //Добавить проверку на то, что файл удален из шары!
    var obj;
    if (snapshot.val) {
        obj = snapshot.val();
    } else {
        obj = snapshot;
    }
    for (var key in obj) {
        if (obj[key].type === "file") {
            addFile(parent, key, true);
        } else if (obj[key].type === "folder") {
            update(obj[key].files, addFolder(parent, key, true));
        }
    }
    $(".container").removeClass("disabled");
}

function changeTab(tabName) {
    var i,
        x = document.getElementsByClassName("tab");

    for (i = 0; i < x.length; i++) {
        x[i].style.display = 'none';
    }

    document.getElementById(tabName).style.display = "block";
    document.getElementById('selected').id = '';
    document.getElementsByClassName(tabName + 'L')[0].id = 'selected';
}


function sendCode() {
    var xhr = new XMLHttpRequest(),
        body = JSON.stringify({
            code: editor.getSession().getValue(),
            input: stdin.value
        });
    var button = $("#button");
    output.value = '';
    stdin.value = '';
    errors.value = '';
    xhr.open('POST', '/compile', true);
    xhr.setRequestHeader('Content-type', 'application/json; charset=utf-8');
    xhr.send(body);
    xhr.onreadystatechange = function () {
        if (xhr.readyState !== 4) {
            return;
        }
        button.innerHTML = "Send";
        button.disabled = false;
        var res = JSON.parse(xhr.responseText);
        output.value = res.output;
        errors.value = res.err;
        if (res.output !== '') {
            changeTab('output');
        }
        if (res.output === '' && res.errors !== '') {
            changeTab('errors');
        }
    };
    button.innerHTML = 'Loading...';
    button.disabled = true;
    setTimeout(function () {
        button.innerHTML = "Send";
        button.disabled = false;
    }, 7500);
}

function addFile(parent, name, f) {
    var id = $(parent).attr('id') + '/' + name;
    if (name && !document.getElementById(id) && checkName(name)) {
        if (!f) {
            CreateCode(name, id);  //Вынести отсюда в отдельную функцию, вызывающую createCode и addFile по отдельности
        }
        var li = $('<li></li>'),
            span = $("<span>" + name + "</span>");
        $(parent).prepend(li);
        li.append(span);
        li.append('<button class="btn" onClick = "removeFile(this, \'' + id + '\')">-</button>');
        li.attr('id', id);
        span.click(function () {
            GetCode(id);
        });
    } else {
        alert('invalid name');
    }
}

function removeFile(parent, id) { //Добавить удаление для шары
    $(parent).parent().remove();
    var path = id.slice(0, id.search("/")) + "/" + email + "/" + id.slice(id.lastIndexOf("/") + 1).replace(/\//g, "/files/"),
        ref = firebase.database().ref(path),
        userCodeRef = ref.child("hash"),
        fileHash;
    userCodeRef.once("value").then(function (snapshot) {
        fileHash = snapshot.val();
        var codeRef = firebase.database().ref("usercode/" + fileHash);
        if (currentFile && currentFile.id === id) {
            currentFile = null;
        }
        codeRef.remove();
        ref.remove();
    });
}

function removeShared() {
    //TODO
}

function addFolder(parent, name, f) {
    //Починить
    var id = $(parent).attr('id') + '/' + name;
    if (name && !document.getElementById(id) && checkName(name)) {
        if (!f) {
            var obj = {type: "folder"};
            firebase.database().ref("users/" + email + "/" + name).update(obj);
        }
        var ul = $('<ul></ul>'),
            span = $('<span></span>'),
            btn = $('<button class="btn" onClick = "removeFolder(this, \'' + id + '\')">-</button>'),
            div = $('<div display="inline-block">');
        div.append(span);
        span.text(name);
        div.append(ul);
        span.after(btn);
        $(parent).append(div);
        ul.attr('id', id);
        addBtn(ul);
        span.click(function () {
            ul.children().fadeToggle('fast');
        });
        btn.off("click");
        return ul;
    } else {
        alert('invalid name');
    }
}

function removeFolder(parent, id) {
    $(parent).parent().remove();
    var path = id.slice(0, id.search("/")) + "/" + email + "/" + id.slice(id.lastIndexOf("/") + 1).replace(/\//g, "/files/"),
        ref = firebase.database().ref(path);
    ref.once("value").then(function (snapshot) {
        var obj = snapshot.val().files,
            codeRef = firebase.database().ref("usercode/");
        for (var key in obj){
            codeRef.child(obj[key].hash).remove();
        }
        ref.remove();
    });
    if (currentFile.id.search(id) != -1) currentFile = null;
}

function addCollaborator(parent, name){ //Добавить в usercode!!!
    if (currentFile){ //Поменять!!!
        var li = $("<li>");
        var btn = $('<button class="btn" onClick = "removeCollaborator(this, \'' + name + '\')">-</button>');
        var span = $('<span></span>');
        $("#collaborators").append(li);
        li.append(span);
        li.append(btn);
        span.text(name);
        $(".btn").show();
        name = name.replace(/\./g, ",");
        var obj = '{ "' + name + '": true}';
        obj = JSON.parse(obj);
        var fileRef = currentFile.ref;
        fileRef.child("collaborators").update(obj);
        var path = currentFile.id.slice(currentFile.id.lastIndexOf("/") + 1);
        path = path.replace(/\//g, "/files/");
        var ref = firebase.database().ref("users/" + email + "/" + path);
        var colRef = firebase.database().ref("shared/" + name + "/" + currentFile.name);
        ref.once("value").then(function (snapshot){
            colRef.update(snapshot.val());
        });
    }
}

function removeCollaborator(parent, name){
    $(parent).parent().remove();
    var ref = firebase.database().ref("shared/" + name + "/" + currentFile.name);
    ref.remove();
    //Удаление колаба из файла. 
}

firebase.initializeApp(config);
firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
        $("#signUp").hide();
        $("#signIn").hide();
        $("#signOut").show();
        $(".logIn").hide();
        $(".container").addClass("disabled");
        email = user.email.replace(/\./g, ',');
        firebase.database().ref("users/" + email).once("value").then(function (snapshot) {
            update(snapshot, $("#users"));
        });
        firebase.database().ref("shared/" + email).once("value").then(function (snapshot) {
            update(snapshot, $("#shared"));
        });
        console.log("logged in " + email);
        addBtnF($("#users"));
        addBtn($("#users"));
        addBtnC($(".rightcol ul"));
    } else {
        $("#signUp").show();
        $("#signIn").show();
        $("#signOut").hide();
        $(".logIn").show();
        console.log("Not logged in!");
        editorInit();
    }
});

session.setUseWrapMode(true);
session.setUseWorker(false);
editor.setTheme("ace/theme/monokai");
editor.getSession().setMode("ace/mode/pascal");
editor.setValue("begin\r\n\ \t writeln(\'hello world\');\r\nend.");

output.value = '';
stdin.value = '';
errors.value = '';