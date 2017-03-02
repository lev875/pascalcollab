var output = document.getElementById("output");
var stdin = document.getElementById("stdin");
var errors = document.getElementById("errors");
var editor = ace.edit("editor");
var session = editor.getSession();
session.setUseWrapMode(true);
session.setUseWorker(false);
editor.setTheme("ace/theme/monokai");
editor.getSession().setMode("ace/mode/pascal");

output.value = ''
stdin.value = ''
errors.value = ''

var firepad;
var firepadRef;

function init() {
    var config = {
        apiKey: "AIzaSyDZp3pyrbZm34cnXJcVB5PzUeUOAkeaGHA",
        authDomain: "pascalcollab.firebaseapp.com",
        databaseURL: "https://pascalcollab.firebaseio.com"
    };
    firebase.initializeApp(config);
    firepadRef = getExampleRef();
    firepad = Firepad.fromACE(firepadRef, editor, {
        defaultText: 'begin\r\n\ \t writeln(\'hello world\');\r\nend.'
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
            function addFile(parent, name) {
              var id = $(parent).attr('id') + '/' + name
              if (!document.getElementById(id)) {
                var li = $('<li></li>')
                $(parent).prepend(li)
                li.append(name + '<button class="btn" onClick = "$(this).parent().remove()">-</button>')
                li.attr('id', id)
            } else alert('invalid name')
        }

        function addFolder(parent, name) {
          var id = $(parent).attr('id') + '/' + name
          if (!document.getElementById(id)) {
            var ul = $('<ul></ul>')
            var span = $('<span></span>')
            $(parent).append(span)
            span.text(name)
            $(parent).append(ul)
            span.append('<button class="btn" onClick = "$(this).parent().next().remove(); $(this).parent().remove()">-</button>')
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

  function getName(parent) {
      $('.btn').css('visibility', 'hidden')
      var tarea = $('<textarea></textarea>')
      $(parent).before(tarea)
      tarea.keyup(function(e) {
        if (e.keyCode == 13) {
          var txt = tarea.val()
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