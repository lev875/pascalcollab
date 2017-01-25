var editor = ace.edit("editor")
var output = document.getElementById("output")
var stdin  = document.getElementById("stdin")
var errors = document.getElementById("errors")

editor.setTheme("ace/theme/monokai")
editor.getSession().setMode("ace/mode/pascal")
output.value = ''
stdin.value  = ''
errors.value = ''
            
function changeTab(tabName){
    var i
    var x = document.getElementsByClassName("tab")

    for (i = 0; i < x.length; i++) {
        x[i].style.display = 'none'
    }

    document.getElementById(tabName).style.display = "block"
    document.getElementById('selected').id = ''
    document.getElementsByClassName(tabName + 'L')[0].id = 'selected'
}

function sendCode(){
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
        if(res.output != ''){
            changeTab('output')
        }
        if(res.output === '' && res.errors != ''){
            changeTab('errors')
        }
    }

    button.innerHTML = 'Loading...'
    button.disabled = true
    setTimeout(() => {button.innerHTML = "Send"; button.disabled = false}, 6500)
}