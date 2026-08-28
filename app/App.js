"use strict";

//const config = require('config');

const EventEmitter = require("events");

const PrintServerClient =
    require("../client/PrintServerClient");

const PrintServerSocketClient =
    require("../client/PrintServerSocketClient");

const PrintManager =
    require("../managers/PrintManager");

const QueueManager =
    require("../managers/QueueManager");

const JobManager =
    require("../managers/JobManager");

const OfficeIntegration = require("../office/OfficeIntegration");

const SystemPrintInterface = require("../system/SystemPrintInterface");

const WindowsPrintAdapter = require("../system/windows/WindowsPrintAdapter");

const PrintExchangeWatcher = require("../system/PrintExchangewatcher");



class Application extends EventEmitter {

    constructor(options = {}) {

        super();

        this.options = {

            printServer: {

                baseUrl:
                    "http://192.168.0.178:3000/api",

                timeout:
                    30000,

                ...(options.printServer || {})

            },

            socket: {

                url:
                    "http://192.168.0.178:3000",

                autoConnect:
                    false,

                ...(options.socket || {})

            },

            autoStart:
                options.autoStart !== false

        };

        //------------------------------------------------------
        // Status
        //------------------------------------------------------

        this.running = false;

        this.initialized = false;

        //------------------------------------------------------
        // Clients
        //------------------------------------------------------

        this.printServer = null;

        this.socket = null;

        //------------------------------------------------------
        // Manager
        //------------------------------------------------------

        this.printManager = null;

        this.queueManager = null;

        this.jobManager = null;

        //------------------------------------------------------
        //Office
        //------------------------------------------------------

        this.office = null;

        //------------------------------------------------------
        //Print Interface und Adapter
        //------------------------------------------------------

        this.systemPrint = null;
        this.windowsPrint = null;

        //------------------------------------------------------
        //PrintExchangeWatcher
        //------------------------------------------------------

        this.printExchangewatcher = null;

    }

    //==========================================================
    // INITIALIZE
    //==========================================================

    async initialize() {

        if (this.initialized)
            return;

        //------------------------------------------------------
        // REST Client
        //------------------------------------------------------

        this.printServer =
            new PrintServerClient(

                this.options.printServer

            );

        //------------------------------------------------------
        // Socket.IO Client
        //------------------------------------------------------

        this.socket =
            new PrintServerSocketClient(

                this.options.socket

            );

        //------------------------------------------------------
        // Manager
        //------------------------------------------------------

        this.queueManager =
            new QueueManager(

                this.printServer,

                this.socket

            );

        this.jobManager =
            new JobManager(

                this.printServer,

                this.socket

            );

        this.printManager =
            new PrintManager(

                this.printServer,

                this.socket,

                this.jobManager


            );
        //------------------------------------------------------
        //Office
        //------------------------------------------------------

        this.office = new OfficeIntegration(this);

        await this.office.initialize();

        //------------------------------------------------------
        //Print Adapter und Interface
        //------------------------------------------------------

        this.systemPrint = new SystemPrintInterface(this, {name: "DruckServer"});
        await this.systemPrint.initialize();

        this.windowsPrint = new WindowsPrintAdapter(this, {printerName: "DruckServer"});
        await this.windowsPrint.initialize();

        //------------------------------------------------------
        //PrintWatcher
        //------------------------------------------------------

        this.printExchangewatcher = new PrintExchangeWatcher(this);

        //------------------------------------------------------
        // Events
        //------------------------------------------------------

        this.bindEvents();

        this.initialized = true;

        this.emit(
            "initialized"
        );

    }

    //==========================================================
    // EVENTS
    //==========================================================

    bindEvents() {

        //------------------------------------------------------
        // Socket connected
        //------------------------------------------------------

        this.socket.on(

            "connected",

            () => {

                this.emit(
                    "server.connected"
                );

            }

        );

        //------------------------------------------------------
        // Socket disconnected
        //------------------------------------------------------

        this.socket.on(

            "disconnected",

            reason => {

                this.emit(

                    "server.disconnected",

                    reason

                );

            }

        );

        //------------------------------------------------------
        // Socket error
        //------------------------------------------------------

        this.socket.on(

            "error",

            error => {

                this.emit(

                    "server.error",

                    error

                );

            }

        );

        //------------------------------------------------------
        // Job submitted
        //------------------------------------------------------

        this.printManager.on(

            "job.submitted",

            job => {

                this.emit(

                    "job.submitted",

                    job

                );

            }

        );

        //------------------------------------------------------
        // Job created
        //------------------------------------------------------

        this.printManager.on(

            "job.created",

            job => {

                this.emit(

                    "job.created",

                    job

                );

            }

        );

        //------------------------------------------------------
        // Job updated
        //------------------------------------------------------

        this.printManager.on(

            "job.updated",

            job => {

                this.emit(

                    "job.updated",

                    job

                );

            }

        );

        //------------------------------------------------------
        // Job completed
        //------------------------------------------------------

        this.printManager.on(

            "job.completed",

            job => {

                this.emit(

                    "job.completed",

                    job

                );

            }

        );

        //------------------------------------------------------
        // Job failed
        //------------------------------------------------------

        this.printManager.on(

            "job.failed",

            job => {

                this.emit(

                    "job.failed",

                    job

                );

            }

        );

    }

    //==========================================================
    // START
    //==========================================================

    async start() {

        if (this.running)
            return;

        if (!this.initialized) {

            await this.initialize();

        }

        //------------------------------------------------------
        // Socket verbinden
        //------------------------------------------------------

        this.socket.connect();

        //------------------------------------------------------
        // Queues laden
        //------------------------------------------------------

        await this.queueManager.load();

        //------------------------------------------------------
        // Jobs laden
        //------------------------------------------------------

        await this.jobManager.load();

        //------------------------------------------------------
        // Socket subscriptions
        //------------------------------------------------------

        this.socket.subscribeQueues();

        //------------------------------------------------------
        // Print Adapter und Interface
        //------------------------------------------------------

        await this.systemPrint.start();

        await this.windowsPrint.start();

        //------------------------------------------------------
        //PrintWatcher
        //------------------------------------------------------

        await this.printExchangewatcher.start();

        //------------------------------------------------------
        // Status
        //------------------------------------------------------

        this.running = true;

        this.emit(
            "started"
        );

    }

    //==========================================================
    // STOP
    //==========================================================

    async stop() {

        if (!this.running)
            return;

        //------------------------------------------------------
        // Socket
        //------------------------------------------------------

        this.socket.disconnect();

        //------------------------------------------------------
        //Print Adapter und Interface
        //------------------------------------------------------

        await this.systemPrint.stop();

        await this.windowsPrint.stop();

        //------------------------------------------------------
        //Printwatcher
        //------------------------------------------------------

        await this.printExchangewatcher.stop();
        
        //------------------------------------------------------
        // Status
        //------------------------------------------------------

        this.running = false;

        this.emit(
            "stopped"
        );

    }

    //==========================================================
    // PRINT
    //==========================================================

    async print(
        queueId,
        file,
        options = {}
    ) {

        if (!this.running) {

            throw new Error(
                "Application is not running."
            );

        }

        return this.printManager.print(

            queueId,

            file,

            options

        );

    }

    //==========================================================
    // QUEUES
    //==========================================================

    async getQueues() {

        return this.queueManager.getAll();

    }

    //----------------------------------------------------------

    async getQueue(id) {

        return this.queueManager.get(
            id
        );

    }

    //==========================================================
    // JOBS
    //==========================================================

    async getJobs() {

        return this.jobManager.getAll();

    }

    //----------------------------------------------------------

    async getJob(id) {

        return this.jobManager.get(
            id
        );

    }

    //----------------------------------------------------------

    async cancelJob(id) {

        return this.jobManager.cancel(
            id
        );

    }

    //----------------------------------------------------------

    async restartJob(id) {

        return this.jobManager.restart(
            id
        );

    }

    //==========================================================
    // STATUS
    //==========================================================

    status() {

        return {

            initialized:
                this.initialized,

            running:
                this.running,

            server:
                this.socket
                    ? this.socket.status()
                    : {

                        connected: false

                    }

        };

    }

}


module.exports = Application;