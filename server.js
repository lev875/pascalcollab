var express = require("express"); //фреймворк для работы веб-сервера
var app = express(); 
var path = require("path"); //модуль для работы с файловой системой и директориями
var bodyParser = require("body-parser") //модуль для парсинга тела запроса и JSON объектов
var spawn = require("child_process").spawn; //модуль для создания дочерних процессов
var fs = require("fs"); //модуль для работы с файлами
var shortid = require("shortid"); //модуль для генерации уникальных id файлов

app.set("port", (process.env.PORT || 8080)); //установка порта

app.use(express.static(__dirname)); //установка рабочей директории

app.use(bodyParser.urlencoded({ 
    extended: true
})); 

app.use(bodyParser.json()); //настройка body-parser

console.log("Server started at port " + app.get("port")); //вывод лога о запуске сервера

function OnRequest(request, response) {
    response.sendFile(path.join(__dirname + "/index.html"));
} //callback, обрабатывающий запрос к index.html

function OnCompile(request, response) { //основная функция, обрабатывающая запрос на компилицию
    var name = shortid.generate(); //генерация id файла

    fs.writeFile(name + ".pas", request.body.code, "utf8", err => { //создание временного файла
        if (err) return console.error(err); //обработка ошибок при создании файла
        else {
            try {
                var compile = spawn("fpc", [name + ".pas"]); //вызов fpc
            } catch (err) {
                console.error(err) //обработка ошибок запуска компилятора
            }
            var res = { //создание объекта для хранения результата и ошибок
                output: "",
                err: "",
                ErrorsParse: function(name) { //метод обработки компилятора в случае ошибки
                    var x = this.err.split("\n") 
                    var i

                    for (i = 0; i < x.length; i++) {
                        if (x[i].search(name + ".pas\\(") === -1) {
                            x.splice(i, 1)
                            i--;
                        }
                    }
                    for (i = 0; i < x.length; i++) {
                        x[i] = x[i].slice(name.length + 4)
                    }
                    this.err = x.join("\n")
                }
            };

            compile.stdout.on("data", data => { //обработчик события для стандартного потокового вывода
                console.log("stdout: " + data);
                res.err += data;
            });
            compile.stderr.on("data", data => { //обработчик события для потока ошибок
                res.err += data;
            });
            compile.on("close", data => { //обработчик события завешения компиляции
                fs.unlink(name + ".pas", err => { //удаление временного файла
                    if (err) return console.error(err);
                    console.log(name + ".pas deleted");
                });
                fs.unlink(name + ".o", err => { //удаление временного объектного файла
                    if (err) return console.error(err);
                    console.log(name + ".o deleted");
                });
                if (data === 0) { //проверка на наличие ошибок компиляции
                    var run = spawn("./" + name, []); //запуск скомпилированной программы

                    setTimeout(() => { //установка лимита времени работы программы 5 секунд
                        console.log(name + " killed");
                        run.kill()
                    }, 5000);

                    if (request.body.input != "") { //обработка входных данных программы
                        run.stdin.write(request.body.input);
                        run.stdin.end();
                    }
                    run.stdout.on("data", output => { //запись результата работы программы
                        res.output += output;
                    });
                    run.stderr.on("data", output => { //запись ошибок
                        res.err += output;
                    });
                    run.on("close", output => { //обработчик события завершения работы программы
                        res.ErrorsParse(name) //парсинг ошибок
                        response.json(res) //отсылка JSON обекта пользователю
                        fs.unlink(name, err => { //удаление файла программы
                            if (err) return console.error(err); //обработчик ошибок
                            console.log(name + " deleted");
                        });
                    })
                } else { //обработка ошибок компиляции
                    res.ErrorsParse(name) //парсинг ошибок
                    response.json(res) //отсылка JSON объекта пользователю
                }
            })
        }
    });
}

app.get("/", OnRequest).listen(app.get("port")) //обработчик запросов index.html

app.post("/compile", OnCompile) //обработка запроса на компиляцию