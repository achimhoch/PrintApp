"use strict";

const Application = require("./app/App");

//----------------------------------------------------------
// Konfiguration
//----------------------------------------------------------

const config = {

    printServer: {

        baseUrl:
            process.env.PRINTSERVER_API_URL ||
            "http://localhost:3000/api",

        timeout:
            Number(
                process.env.PRINTSERVER_TIMEOUT
            ) || 30000,

        apiKey:
            process.env.PRINTSERVER_API_KEY ||
            null

    },

    socket: {

        url:
            process.env.PRINTSERVER_SOCKET_URL ||
            "http://localhost:3000",

        path:
            process.env.PRINTSERVER_SOCKET_PATH ||
            "/socket.io",

        autoConnect:
            false,

        reconnection:
            true,

        reconnectionAttempts:
            Infinity,

        reconnectionDelay:
            1000,

        reconnectionDelayMax:
            5000

    }

};

//----------------------------------------------------------
// Application
//----------------------------------------------------------

const application =
    new Application(config);

//----------------------------------------------------------
// Application Events
//----------------------------------------------------------

application.on(

    "initialized",

    () => {

        console.log(
            "DruckApp initialisiert."
        );

    }

);

application.on(

    "started",

    () => {

        console.log(
            "DruckApp gestartet."
        );

    }

);

application.on(

    "stopped",

    () => {

        console.log(
            "DruckApp beendet."
        );

    }

);

//----------------------------------------------------------
// PrintServer
//----------------------------------------------------------

application.on(

    "server.connected",

    () => {

        console.log(
            "PrintServer verbunden."
        );

    }

);

application.on(

    "server.disconnected",

    reason => {

        console.log(
            "PrintServer Verbindung getrennt:",
            reason
        );

    }

);

application.on(

    "server.error",

    error => {

        console.error(
            "PrintServer Fehler:",
            error
        );

    }

);

//----------------------------------------------------------
// Jobs
//----------------------------------------------------------

application.on(

    "job.submitted",

    job => {

        console.log(
            "Druckauftrag übermittelt:",
            job?.id
        );

    }

);

application.on(

    "job.created",

    job => {

        console.log(
            "Druckauftrag erstellt:",
            job?.id
        );

    }

);

application.on(

    "job.updated",

    job => {

        console.log(
            "Druckauftrag aktualisiert:",
            job?.id
        );

    }

);

application.on(

    "job.completed",

    job => {

        console.log(
            "Druckauftrag abgeschlossen:",
            job?.id
        );

    }

);

application.on(

    "job.failed",

    job => {

        console.error(
            "Druckauftrag fehlgeschlagen:",
            job?.id
        );

    }

);

//----------------------------------------------------------
// Graceful Shutdown
//----------------------------------------------------------

let shuttingDown = false;

async function shutdown(signal) {

    if (shuttingDown)
        return;

    shuttingDown = true;

    console.log(
        `${signal} empfangen. DruckApp wird beendet...`
    );

    try {

        await application.stop();

        process.exit(0);

    }
    catch (err) {

        console.error(
            "Fehler beim Beenden der DruckApp:",
            err
        );

        process.exit(1);

    }

}

process.on(
    "SIGINT",
    () => shutdown("SIGINT")
);

process.on(
    "SIGTERM",
    () => shutdown("SIGTERM")
);

//----------------------------------------------------------
// Unbehandelte Fehler
//----------------------------------------------------------

process.on(

    "uncaughtException",

    err => {

        console.error(
            "Unbehandelte Exception:",
            err
        );

    }

);

process.on(

    "unhandledRejection",

    err => {

        console.error(
            "Unbehandelter Promise-Fehler:",
            err
        );

    }

);

//----------------------------------------------------------
// Start
//----------------------------------------------------------

async function main() {

    try {

        await application.initialize();

        await application.start();

    }
    catch (err) {

        console.error(
            "DruckApp konnte nicht gestartet werden:",
            err
        );

        process.exit(1);

    }

}

main();