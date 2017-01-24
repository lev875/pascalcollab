    var editor = ace.edit("editor");
    var stdin = document.getElementById("stdin");
    var textarea = document.getElementById("output");

    textarea.value = '';
    stdin.value = '';
    editor.setTheme("ace/theme/monokai");
    editor.getSession().setMode("ace/mode/c_cpp");

    function SendCode(){
        var xhr = new XMLHttpRequest();

        xhr.open('POST', '/compile', true);
	xhr.setRequestHeader('Content-type', 'application/json; charset=utf-8');
        var body = JSON.stringify({
		code: String(editor.getSession().getValue()),
		input: String(stdin.value)
	});
        xhr.send(body);

        xhr.onreadystatechange = function() {
            if (xhr.readyState != 4) return;

            button.innerHTML = "Send";
            button.disabled = false;
			var res = JSON.parse(xhr.responseText);
            textarea.value = 'O: ' + res.output + '\n';
            if (res.err != '') textarea.value += 'E: ' + res.err;
			
        }

        button.innerHTML = 'Loading...';
        button.disabled = true;
        setTimeout(() => {button.innerHTML = "Send"; button.disabled = false;}, 6500);
    }