"use strict";

const { io } = require("socket.io-client");

const EventEmitter = require("events");

class PrintServerSocketClient extends EventEmitter {

    constructor(options = {}) {

        super();

        this.options = {

            url:
                options.url ||
                "http://localhost:3000",

            path:
                options.path ||
                "/socket.io",

            transports:
                options.transports ||
                ["websocket", "polling"],

            autoConnect:
                options.autoConnect !== false,

            reconnection:
                options.reconnection !== false,

            reconnectionAttempts:
                options.reconnectionAttempts ||
                Infinity,

            reconnectionDelay:
                options.reconnectionDelay ||
                1000,

            reconnectionDelayMax:
                options.reconnectionDelayMax ||
                5000,

            timeout:
                options.timeout ||
                10000,

            apiKey:
                options.apiKey || null,

            ...options

        };

        this.socket = null;

        this.connected = false;

        this.started = false;

        this.bindEvents();

    }

    //----------------------------------------------------------
    // Socket erstellen
    //----------------------------------------------------------

    createSocket() {

        const options = {

            path:
                this.options.path,

            transports:
                this.options.transports,

            autoConnect:
                this.options.autoConnect,

            reconnection:
                this.options.reconnection,

            reconnectionAttempts:
                this.options.reconnectionAttempts,

            reconnectionDelay:
                this.options.reconnectionDelay,

            reconnectionDelayMax:
                this.options.reconnectionDelayMax,

            timeout:
                this.options.timeout

        };

        //------------------------------------------------------
        // API-Key
        //------------------------------------------------------

        if (this.options.apiKey) {

            options.auth = {

                apiKey:
                    this.options.apiKey

            };

        }

        this.socket =
            io(

                this.options.url,

                options

            );

        return this.socket;

    }

    //----------------------------------------------------------
    // Events registrieren
    //----------------------------------------------------------

    bindEvents() {

        //------------------------------------------------------
        // Connection
        //------------------------------------------------------

        this.on(

            "connect",

            () => {

                this.connected = true;

                this.emit(
                    "connected"
                );

            }

        );

        //------------------------------------------------------
        // Disconnect
        //------------------------------------------------------

        this.on(

            "disconnect",

            reason => {

                this.connected = false;

                this.emit(
                    "disconnected",
                    reason
                );

            }

        );

        //------------------------------------------------------
        // Connect error
        //------------------------------------------------------

        this.on(

            "connect_error",

            error => {

                this.emit(
                    "error",
                    error
                );

            }

        );

    }

    //----------------------------------------------------------
    // Start
    //----------------------------------------------------------

    connect() {

        if (!this.socket)
            this.createSocket();

        if (this.socket.connected)
            return;

        this.started = true;

        this.socket.connect();

    }

    //----------------------------------------------------------
    // Stop
    //----------------------------------------------------------

    disconnect() {

        if (!this.socket)
            return;

        this.started = false;

        this.socket.disconnect();

        this.connected = false;

    }

    //----------------------------------------------------------
    // Status
    //----------------------------------------------------------

    isConnected() {

        return (

            this.socket !== null &&

            this.socket.connected

        );

    }

    //----------------------------------------------------------
    // Event registrieren
    //----------------------------------------------------------

    onServerEvent(
        event,
        listener
    ) {

        if (!this.socket)
            this.createSocket();

        this.socket.on(

            event,

            listener

        );

        return this;

    }

    //----------------------------------------------------------
    // Event entfernen
    //----------------------------------------------------------

    offServerEvent(
        event,
        listener
    ) {

        if (!this.socket)
            return this;

        this.socket.off(

            event,

            listener

        );

        return this;

    }

    //----------------------------------------------------------
    // Event senden
    //----------------------------------------------------------

    emitServerEvent(
        event,
        data
    ) {

        if (!this.socket)
            throw new Error(
                "Socket is not initialized."
            );

        this.socket.emit(

            event,

            data

        );

    }

    //----------------------------------------------------------
    // Event mit ACK
    //----------------------------------------------------------

    emitWithAck(
        event,
        data,
        timeout = 10000
    ) {

        if (!this.socket)
            throw new Error(
                "Socket is not initialized."
            );

        return new Promise(

            (resolve, reject) => {

                this.socket
                    .timeout(timeout)
                    .emit(

                        event,

                        data,

                        (err, response) => {

                            if (err)
                                return reject(err);

                            resolve(
                                response
                            );

                        }

                    );

            }

        );

    }

    //----------------------------------------------------------
    // Alle Queues beobachten
    //----------------------------------------------------------

    subscribeQueues() {

        this.emitServerEvent(

            "queue.subscribe"

        );

    }

    //----------------------------------------------------------
    // Queue beobachten
    //----------------------------------------------------------

    subscribeQueue(queueId) {

        this.emitServerEvent(

            "queue.subscribe",

            {

                queueId

            }

        );

    }

    //----------------------------------------------------------

    unsubscribeQueue(queueId) {

        this.emitServerEvent(

            "queue.unsubscribe",

            {

                queueId

            }

        );

    }

    //----------------------------------------------------------
    // Job beobachten
    //----------------------------------------------------------

    subscribeJob(jobId) {

        this.emitServerEvent(

            "job.subscribe",

            {

                jobId

            }

        );

    }

    //----------------------------------------------------------

    unsubscribeJob(jobId) {

        this.emitServerEvent(

            "job.unsubscribe",

            {

                jobId

            }

        );

    }

    //----------------------------------------------------------
    // Drucker beobachten
    //----------------------------------------------------------

    subscribePrinter(printerId) {

        this.emitServerEvent(

            "printer.subscribe",

            {

                printerId

            }

        );

    }

    //----------------------------------------------------------

    unsubscribePrinter(printerId) {

        this.emitServerEvent(

            "printer.unsubscribe",

            {

                printerId

            }

        );

    }

    //----------------------------------------------------------
    // Discovery beobachten
    //----------------------------------------------------------

    subscribeDiscovery() {

        this.emitServerEvent(

            "discovery.subscribe"

        );

    }

    //----------------------------------------------------------
    // Convenience: Queue Events
    //----------------------------------------------------------

    onQueueUpdated(listener) {

        return this.onServerEvent(

            "queue.updated",

            listener

        );

    }

    //----------------------------------------------------------

    onQueueCreated(listener) {

        return this.onServerEvent(

            "queue.created",

            listener

        );

    }

    //----------------------------------------------------------

    onQueueDeleted(listener) {

        return this.onServerEvent(

            "queue.deleted",

            listener

        );

    }

    //----------------------------------------------------------
    // Convenience: Job Events
    //----------------------------------------------------------

    onJobCreated(listener) {

        return this.onServerEvent(

            "job.created",

            listener

        );

    }

    //----------------------------------------------------------

    onJobUpdated(listener) {

        return this.onServerEvent(

            "job.updated",

            listener

        );

    }

    //----------------------------------------------------------

    onJobCompleted(listener) {

        return this.onServerEvent(

            "job.completed",

            listener

        );

    }

    //----------------------------------------------------------

    onJobFailed(listener) {

        return this.onServerEvent(

            "job.failed",

            listener

        );

    }

    //----------------------------------------------------------

    onJobCancelled(listener) {

        return this.onServerEvent(

            "job.cancelled",

            listener

        );

    }

    //----------------------------------------------------------
    // Convenience: Printer Events
    //----------------------------------------------------------

    onPrinterDiscovered(listener) {

        return this.onServerEvent(

            "printer.discovered",

            listener

        );

    }

    //----------------------------------------------------------

    onPrinterUpdated(listener) {

        return this.onServerEvent(

            "printer.updated",

            listener

        );

    }

    //----------------------------------------------------------

    onPrinterLost(listener) {

        return this.onServerEvent(

            "printer.lost",

            listener

        );

    }

    //----------------------------------------------------------
    // Discovery
    //----------------------------------------------------------

    onDiscoveryStarted(listener) {

        return this.onServerEvent(

            "discovery.started",

            listener

        );

    }

    //----------------------------------------------------------

    onDiscoveryFinished(listener) {

        return this.onServerEvent(

            "discovery.scan.finished",

            listener

        );

    }

    //----------------------------------------------------------

    onDiscoveryError(listener) {

        return this.onServerEvent(

            "discovery.error",

            listener

        );

    }

    //----------------------------------------------------------
    // Server Events
    //----------------------------------------------------------

    onServerStarted(listener) {

        return this.onServerEvent(

            "application.started",

            listener

        );

    }

    //----------------------------------------------------------

    onServerStopping(listener) {

        return this.onServerEvent(

            "application.stopping",

            listener

        );

    }

    //----------------------------------------------------------
    // Status
    //----------------------------------------------------------

    status() {

        return {

            connected:
                this.isConnected(),

            started:
                this.started,

            id:
                this.socket?.id ||
                null

        };

    }

}

module.exports =
    PrintServerSocketClient;