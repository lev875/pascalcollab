    var editor = ace.edit("editor")
    var output = document.getElementById("output")
    var stdin = document.getElementById("stdin")
    var errors = document.getElementById("errors")

    output.value = ''
    stdin.value = ''
    editor.setTheme("ace/theme/monokai")
    editor.getSession().setMode("ace/mode/c_cpp")

    function SendCode(){
        var xhr = new XMLHttpRequest()
        var body = JSON.stringify({
            code: String(editor.getSession().getValue()),
            input: String(stdin.value)
        });

        xhr.open('POST', '/compile', true)
        xhr.setRequestHeader('Content-type', 'application/json; charset=utf-8')
        xhr.send(body)
        xhr.onreadystatechange = function() {
            if (xhr.readyState != 4) return;

            button.innerHTML = "Send"
            button.disabled = false
			var res = JSON.parse(xhr.responseText)
            output.value = String(res.output)
            if (res.err != '') errors.value += res.err
			
        }

        button.innerHTML = 'Loading...'
        button.disabled = true
        setTimeout(() => {button.innerHTML = "Send"; button.disabled = false}, 6500)
    }