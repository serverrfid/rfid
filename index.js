require('dotenv').config();

// REQUERIR MODULOS
const express = require('express'); // Requerir biblioteca EXPRESS
const socketIo = require('socket.io'); // Requerir biblioteca SOCKET
const http = require('http'); // Requerir biblioteca HTTP para el servidor
const path = require('path');
var bodyParser = require('body-parser'); // Requerir para analizar el cuerpo (body) de peticiones http
var compression = require('compression');
const passport = require('passport');
const cookieParser = require('cookie-parser')
const session = require('express-session')
const PassportLocal = require('passport-local').Strategy;
const fs = require('fs');
const mqtt = require('mqtt')

// CREAR SERVIDOR
const app = express();
app.set('port', process.env.PORT || 3000); // Que tome el puerto del sistema operativo, sino que tome el 3000
const server = http.createServer(app); // Servidor funcionando
server.listen(app.get('port')); // Inicia el servidor htpp en el puerto
const io = socketIo(server, {
    // Tiempo en el que detecte la desconexion de usuarios sockets
    pingInterval: 20000,
    pingTimeout: 20000
});

// MOTOR DE PLANTILLA
app.set('views', path.join(__dirname, 'view'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'ejs');

app.use(bodyParser.json()); // Body en formato json
app.use(bodyParser.urlencoded({ extended: false })); // Body formulario

// CARPETAS PUBLICAS
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'node_modules')));

app.use(compression()); // Añadir compresion

app.use(cookieParser('mi secreto'));
app.use(session({
    secret: 'mi secreto',
    resave: true,
    saveUninitialized: true
}));

app.use((passport.initialize()));
app.use(passport.session());

passport.use(new PassportLocal(function (username, password, done) {
    if ((username == "1234") && (password == "1234"))
        return done(null, { id: "1234" })
    done(null, false);
}));

passport.serializeUser(function (user, done) {
    done(null, user.id);
});
passport.deserializeUser(function (id, done) {
    done(null, { id: id });
});

// Definicion de variables
var formato_fecha = { year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric" };

// SOCKET
io.on('connection', function (socket) {
    // Conexion de las webApp
    socket.on('WebApp', function (data) {
        socket.join(socket.id);
        console.log(data)

        var Fecha_Inicio = data.Fecha_Inicio
        var Fecha_Final = data.Fecha_Final
        Consultar_Tabla(Fecha_Inicio, Fecha_Final, socket.id)
    });
    socket.on('Consultar-Tabla', function (data) {
        socket.join(socket.id);
        console.log(data)

        var Fecha_Inicio = data.Fecha_Inicio
        var Fecha_Final = data.Fecha_Final
        Consultar_Tabla(Fecha_Inicio, Fecha_Final, socket.id)
    });
});

// MQTT
//const client = mqtt.connect('mqtt://broker.hivemq.com', {});
const client = mqtt.connect('mqtt://test.mosquitto.org', { maximum_packet_size: 268435450 })
// MQTT- Conexion 
var suscripcion_topic_escribir = "rfid/server_iot/escribir";
var suscripcion_topic_leer = "rfid/server_iot/leer";
client.on('connect', () => {
    console.log("Conectado a MQTT");
    client.subscribe(suscripcion_topic_escribir, function (err) {
        if (err) {
            console.log("Error al suscribir a topic MQTT", err);
            return false;
        }
        console.log("Suscrito a: ", suscripcion_topic_escribir);
    })
    client.subscribe(suscripcion_topic_leer, function (err) {
        if (err) {
            console.log("Error al suscribir a topic MQTT", err);
            return false;
        }
        console.log("Suscrito a: ", suscripcion_topic_leer);
    })
});
// MQTT- Mensajes de entrada 
client.on('message', (topic, message) => {
    var aux_dato = message.toString();
    try {
        var json_dato = JSON.parse(aux_dato);
        if (json_dato) {
            // Escribir
            if (topic == suscripcion_topic_escribir) {
                console.log(message)
                var id_dispositivo = json_dato.id_dispositivo;
                var etiqueta = json_dato.etiqueta;
                var historial = new Historial({
                    fecha: new Date(),
                    id_dispositivo,
                    etiqueta
                }).save(function (err, result) {
                    if (err) {
                        return false;
                    }
                    var id_registro = result._id;
                    io.sockets.emit('Agregar_Historial', {
                        id: id_registro,
                        fecha: new Date(),
                        id_dispositivo,
                        etiqueta
                    });
                });
            }
        }
    } catch {
        console.log("Error al leer json_mensaje");
        return false;
    }
});

// RUTAS HTTP
app.get('/', (req, res, next) => {
    if (req.isAuthenticated())
        return next();
    res.render('index.html'); // Si no ha iniciado sesion
}, (req, res) => {
    res.redirect("/panel"); // Si ya ha iniciado sesion
});

app.get('/panel', (req, res, next) => {
    if (req.isAuthenticated()) {
        var id = req.session.passport.user;
        console.log("id:", id)
        return next();
    }
    res.redirect("/") // Si no ha iniciado sesion
}, (req, res) => {
    var id = req.session.passport.user;
    res.render('panel.html', { id });
});

app.get('/sistema-usuario', (req, res) => {
    if (req.isAuthenticated())
        res.send("cierto")
    else
        res.send("fallo")
});

app.post('/login-usuario', passport.authenticate('local', {
    successRedirect: "/sistema-usuario",
    failureRedirect: "/sistema-usuario"
}));

// Eliminar registros
app.post('/eliminar-registro', (req, res) => {
    var id = req.body.id;
    if (req.isAuthenticated()) {
        console.log("Eliminar>>:", id);
        Historial.deleteOne({ '_id': id }, function (err, result) {
            if (err) {
                res.send("Error");
                return false;
            }
            console.log("Eliminado")
            res.send("Eliminado");
        });
    }
});

app.post('/cerrar-sesion', (req, res) => {
    req.logout();
    res.send("ok")
});

// MONGODB
var mongoose = require("mongoose");
const uri = "mongodb+srv://cliente:soluxpro@cluster0.1ea5qau.mongodb.net/?retryWrites=true&w=majority";
// Conexion con la base de datos en la nube
mongoose.connect(uri, { useUnifiedTopology: true, useNewUrlParser: true, useCreateIndex: true }, function (err, db) {
    if (db) {
        console.log("Conexion con la base de datos de forma exitosa")
    }
});

// Variables de la base de datos
var user_schema1 = new mongoose.Schema({
    fecha: Date,
    id_dispositivo: String,
    etiqueta: String
}, { versionKey: false });
// Crear un modelo en la base de datos en el que estaran los registros
var Historial = mongoose.model("historial", user_schema1);

function Consultar_Tabla(Inicio, Final, IdSocket) {
    // io.sockets.in(IdSocket).emit('Limpiar-Grafica', { numero_grafica });

    // Consultar la base de datos
    Historial.find({ "fecha": { "$gte": Inicio, "$lte": Final } }, function (err, doc) {
        if (err) return false;
        if (doc) {
            var cant = parseInt(doc.length);

            var id = [], fecha = [], id_dispositivo = [], etiqueta = [];

            for (var i = 0; i < cant; i++) {
                id[i] = doc[i]._id;
                fecha[i] = new Date(doc[i].fecha).toLocaleString("en-GB", formato_fecha);
                id_dispositivo[i] = doc[i].id_dispositivo;
                etiqueta[i] = doc[i].etiqueta;
            }

            io.sockets.in(IdSocket).emit("Historial", {
                id,
                fecha,
                id_dispositivo,
                etiqueta
            });
        }
    });
}