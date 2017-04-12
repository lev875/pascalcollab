/*global $, document, firebase, ace, Firepad, console, alert, XMLHttpRequest, setTimeout*/
var editor = ace.edit("editor"),
    session = editor.getSession(),
    firepad,
    currentFile = null,
    config = {
        apiKey: "AIzaSyDZp3pyrbZm34cnXJcVB5PzUeUOAkeaGHA",
        authDomain: "pascalcollab.firebaseapp.com",
        databaseURL: "https://pascalcollab.firebaseio.com"
    },
    email = null,
    userRef = null,
    shareRef = null,
    codeRef = null,
    userFiles = {},
    sharedFiles = {},
    collaborators = {};

function cloneObj(obj) {
    var newObj = {};
    for(var key in obj) {
        if(key !== "interface"){
            if(obj.type === "folder" && key === "files") {
                newObj.files = [];
                for(var i = 0; i < obj.files.length; i++) {
                    newObj.files[i] = cloneObj(obj.files[i]);
                }
            } else {
                newObj[key] = obj[key];
            }
        }
    }
    return newObj;
}

function updateDB() {
    var newObj = cloneObj(userFiles);
    userRef.set(newObj);
}

class file {
    constructor(name) {
        if(name !== "") {
            this.name = name.toString();
            this.type = "file";
            this.hash = codeRef.push({
                code: "",
                creator: email
            }).key;
            this.collaborators = {};
        }
    }
    
    remove() {
        if (currentFile === this) {
            $("#collaborators").children().remove();
            currentFile = null;
            collaborators = null;
        }
        for(var key in this.collaborators) {
            firebase.database().ref("shared/" + key + "/" + this.name).set(null);
        }
        codeRef.child(this.hash).remove();
        this.removeInterface();
        for(var key in this) {
            delete this[key];
        }
        updateDB();
    }
    
    addInterface(parent) {
        var id = $(parent).attr('id') + '/' + this.name,
            li = $("<li></li>"),
            span = $("<span></span>"),
            div = $('<div display="inline-block"></div>'),
            btn = $("<button>-</button>").attr({
               class: "btn removeBtn"
            }).click(() => {
                this.remove();
            });
        span.text(this.name);
        $(parent).append(div);
        div.append(li);
        li.append(span);
        li.append(btn);
        li.attr('id', id);
        span.click(() => {
            currentFile = this;
            editorInit(this.hash);
            $(".selected").removeClass("selected");
            this.interface.children("li").addClass("selected");
            collaborators = new collabs();
        });
        this.interface = div;
    }
    
    removeInterface() {
        this.interface.remove();
        delete this.interface;
    }
}

class folder {
    constructor(name) {
        this.name = name.toString();
        this.type = "folder";
        this.files = [];
    }
    
    addFile(name) {
        if (this.find(name) > 0 && checkName(name)) {
            currentFile = new file(name);
            this.files.push(currentFile);
            this.files.sort(this.sortFileFolders);
            currentFile.addInterface(this.interface.children("ul"));
            updateDB();
            editorInit(currentFile.hash);
            $(".selected").removeClass("selected");
            currentFile.interface.children("li").addClass("selected");
            collaborators = new collabs();
        } else alert("Invalid name!");
    }
    
    addFolder(name) {
        if (this.find(name) > 0 && checkName(name)) {
            var newFolder = new folder(name);
            this.files.push(newFolder);
            this.files.sort(this.sortFileFolders);
            newFolder.addInterface(this.interface.children("ul"));
            updateDB();
        } else alert("Invalid name!");
    }
    
    remove() {
        for(var i = 0;i < this.files.length;i++){
            this.files[i].remove();
        }      
        this.removeInterface();
        for(var key in this) {
            delete this[key];
        }
        updateDB();
    }
    
    addInterface(parent) { //Говно блядь, переделать
        var id = $(parent).attr('id') + '/' + this.name;
        var ul = $('<ul display="inline-block"></ul>'),
            span = $('<span></span>'),
            div = $('<div display="inline-block"></div>'),
            btn = $('<button>-</button>').attr({
                class: "btn removeBtn"
            }).click(() => {
                this.remove();
            });
        $(parent).append(div);
        div.append(span);
        div.append(ul);
        span.text(this.name);
        span.after(btn);
        ul.attr('id', id);
        this.addButton(ul);  
        this.addButtonF(ul);
        span.click(function () {
            ul.children().fadeToggle('fast');
        });
        this.interface = div;
        for(var i = 0; i < this.files.length; i++){
            this.files[i].addInterface(this.interface.children("ul")); 
        }
    }
    
    removeInterface() {
        this.interface.remove();
    }
    
    addButton(parent) {
        var btn = $('<button></button>').text('Add File').attr({
            class: "btn"
        });
        btn.click(() => {
            getName(btn, this.addFile.bind(this));
        });
        $(parent).prepend(btn);
    }
    
    addButtonF(parent) {
        var btn = $('<button></button>').text('Add Folder').attr({
            class: "btn"
        });
        btn.click(() => {
            getName(btn, this.addFolder.bind(this));
        });
        $(parent).prepend(btn);
    }
    
    clone(obj) {
        for (var key in obj) {
            if(obj.hasOwnProperty(key)){
                this[key] = obj[key];
            }
        }
        this.restoreMethods();
    }
    
    find(name) {
        if (this.files.length === 0) return 1;
        var i;
        for(i = 0; i < this.files.length && this.files[i].name != name; i++);
        if (i === this.files.length) {
            return 1;
        } else {
            return -1;
        }
    }
    
    sortFileFolders(a, b) {
        if(!a.name) return 1;
        if(!b.name) return -1;
        if (a.type === b.type) {
            return a.name.localeCompare(b.name);
        } else if (a.type === "folder") {
            return 1;
        } else return -1;
    }
    
    restoreMethods() {
        for (var i = 0; i < this.files.length; i++){
            if (this.files[i].type === "file") {
                this.files[i].__proto__ = new file(""); // Говно!
            } else {
                this.files[i].__proto__ = new folder("");
                this.files[i].restoreMethods();
            }
        }
    }
}

class collabs {
    constructor(){
        var btn = $("<button>Add Collaborator</button>").attr({
            class: "btn"
        }).click(() => {
           getName($("#collaborators"), this.addCollaborator.bind(this)) 
        });
        codeRef.child(currentFile.hash + "/collaborators").once("value", (snapshot) => {
            if (snapshot.val()) {
                this.collabs = snapshot.val();
                for(var key in this.collabs){
                    this.addInterface(key);
                }
            } else {
                this.collabs = {};
            }
        });
        $("#collaborators").children().remove();
        $("#collaborators").append(btn);
        this.interfaces = {};
    }
    
    addCollaborator(email) {
        firebase.database().ref("users/" + email).once("value").then((snapshot) => {
           if(snapshot.val()) {
               firebase.database().ref("shared").child(email.toString().replace(/\./g, ",")).update({
                    [currentFile.name]: currentFile.hash
                });
                this.collabs[email.toString().replace(/\./g, ",")] = true;
                codeRef.child(currentFile.hash + "/collaborators").update(this.collabs);
                currentFile.collaborators = this.collabs;
                this.addInterface(email);
                updateDB();
           } else {
               alert("No such user!");
           }
        });
    }
    
    remove(email) {
        delete this.collabs[email];
        this.interfaces[email].remove();
        delete this.interfaces[email];
        firebase.database().ref("shared" + "/" + email + "/" + currentFile.name).set(null);
        codeRef.child(currentFile.hash + "/collaborators/" + email).set(null);
        currentFile.collaborators[email] = null;
        updateDB();
    }
    
    addInterface(email){
        var li = $("<li>"),
            btn = $('<button>-</button>').attr({
                class: "btn removeBtn"
            }).click(() => {
                this.remove(email);
            }),
            span = $('<span></span>');
        $("#collaborators").append(li);
        span.text(email);
        li.append(span);
        li.append(btn);
        this.interfaces[email] = li;
    }
    
    writeToDB() {
        codeRef.child(currentFile.hash + "/collaborators").set(this.collabs);
    }
}

class share {
    constructor(obj){
        for(var key in obj) {
            this[key] = obj[key];
        }
        this.addInterface();
    }
    
    addInterface() {
        for(var key in this) {
            var li = $("<li></li>"),
                span = $("<span>" + key + "</span>").click(() => {
                    li.addClass("selected");
                    editorInit(this[key]);
                });
            $("#shared").append(li);
            li.append(span);
        }
    }
}

function editorInit(hash) {
    var div = $("<div>");
    $("#editor").before(div);
    $("#editor").remove();
    div.attr("id", "editor");
    editor = ace.edit("editor");
    session = editor.getSession();
    session.setUseWrapMode(true);
    session.setUseWorker(false);
    editor.setTheme("ace/theme/solarized_light");
    editor.getSession().setMode("ace/mode/pascal");
    editor.setValue("begin\r\n\ \t writeln(\'hello world\');\r\nend.");
    firepad = Firepad.fromACE(codeRef.child(hash), editor);
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
            callback(txt);
        }
    });
    $("html").keyup(function (e) {
        if (e.keyCode === 27) {
            $('.btn').show();
            tarea.remove();
        }
    });
}

function checkName(name) {
    if(name !== "") {
        var arr = name; 
        arr = arr.split(/[\\\/\.\#\$\[\]]/);
        if (arr.length === 1) {
            return true;
        }
        return false;
    } else {
        return false;
    }
}

function signIn(email, password) {
    firebase.auth().signInWithEmailAndPassword(email, password).catch(function (error) {
        alert(error.code + ": " + error.message);
    });
    userFiles = new folder("My Files");
}

function signOut() {
    firebase.auth().signOut();
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
            input: $("#stdin").val()
        });
    var button = $("#button");
    $("#output").val("");
    $("#stdin").val("");
    $("errors").val("");
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
        $("#output").val(res.output);
        $("#errors").val(res.err);
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

firebase.initializeApp(config);
firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
        $("#signUp").hide();
        $("#signIn").hide();
        $("#signOut").show();
        $(".logIn").hide();
        $(".col").children().show();
        $(".leftcol > span").remove();
        email = user.email.replace(/\./g, ',');
        userRef = firebase.database().ref("users/" + email);
        shareRef = firebase.database().ref("shared/" + email);
        codeRef = firebase.database().ref("usercode/");
        $(".container").addClass("disabled");
        userRef.once("value").then(function (snapshot) {
            userFiles.clone(snapshot.val());
            $("#users").children().remove();
            userFiles.addInterface($("#users"));
            updateDB();
            $(".container").removeClass("disabled");
        });
        $(".container").addClass("disabled");
        shareRef.on("value", function (snapshot) {
            sharedFiles = new share(snapshot.val());
            $(".container").removeClass("disabled");
        });
    } else {
        $("#signUp").show();
        $("#signIn").show();
        $("#signOut").hide();
        $(".logIn").show();
        $(".col").children().hide();
        $(".leftcol").prepend("<span id='logOutMessage'>Log in to gain acces to collaborative functions</span>");
        email = null;
        currentFile = null;
        userFiles = null;
        sharedFiles = null;
        userRef = null;
        codeRef = null;
        shareRef = null;
        console.log("Not logged in!");
        editorInit();
    }
});

session.setUseWrapMode(true);
session.setUseWorker(false);
editor.setTheme("ace/theme/solarized_light");
editor.getSession().setMode("ace/mode/pascal");
editor.setValue("begin\r\n\ \t writeln(\'hello world\');\r\nend.");


userFiles = new folder("My files");

$("#output").val("");
$("#stdin").val("");
$("errors").val("");

$("#fileBtn").click(function () {
    $("#leftcontainer").fadeToggle();
});