"use strict";

const EventEmitter = require("events");

class WindowsPrintAdapter extends EventEmitter {

    constructor(
        systemPrintInterface,
        options = {}
    ) {

        super();

        if (!systemPrintInterface)
            throw new Error(
                "SystemPrintInterface is required."
            );

        this.printInterface =
            systemPrintInterface;

        this.options = {

            printerName:
                options.printerName ||
                "Druckserver",

            enabled:
                options.enabled !== false

        };

        this.running = false;

    }

    //==========================================================
    // INITIALIZE
    //==========================================================

    async initialize() {

        if (!this.options.enabled)
            return;

        this.emit(
            "initialized"
        );

    }

    //==========================================================
    // START
    //==========================================================

    async start() {

        if (this.running)
            return;

        this.running = true;

        /*
         * Hier wird später die native Windows-Komponente
         * gestartet.
         *
         * Diese Komponente stellt die Windows-Druckerqueue
         * bereit.
         */

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

        this.running = false;

        this.emit(
            "stopped"
        );

    }

    //==========================================================
    // JOB EMPFANGEN
    //==========================================================

    async receive(job) {

        if (!this.running)
            throw new Error(
                "Windows print adapter is not running."
            );

        return this.printInterface.submit(
            job
        );

    }

    //==========================================================
    // STATUS
    //==========================================================

    status() {

        return {

            running:
                this.running,

            printerName:
                this.options.printerName

        };

    }

}

module.exports = WindowsPrintAdapter;