"use strict";

const EventEmitter = require("events");

class OfficeIntegration extends EventEmitter {

    constructor(
        application,
        options = {}
    ) {

        super();

        if (!application)
            throw new Error(
                "Application is required."
            );

        this.application =
            application;

        this.options = {

            enabled:
                options.enabled !== false,

            autoPrint:
                options.autoPrint === true

        };

        this.connected = false;

        this.document = null;

    }

    //==========================================================
    // INITIALIZE
    //==========================================================

    async initialize() {

        if (!this.options.enabled)
            return;

        this.connected = true;

        this.emit(
            "initialized"
        );

    }

    //==========================================================
    // DOCUMENT
    //==========================================================

    /**
     * Dokument von Office übernehmen.
     *
     * document:
     *
     * {
     *     path,
     *     name,
     *     mime,
     *     data,
     *     size
     * }
     */
    setDocument(document) {

        if (!document)
            throw new Error(
                "Document is required."
            );

        this.document = {

            path:
                document.path ?? null,

            name:
                document.name ??
                document.filename ??
                "Document",

            filename:
                document.filename ??
                document.name ??
                "document.pdf",

            mime:
                document.mime ??
                "application/pdf",

            data:
                document.data ??
                null,

            size:
                document.size ??
                0

        };

        this.emit(
            "document.loaded",
            this.document
        );

        return this.document;

    }

    //==========================================================
    // DOCUMENT AUS OFFICE
    //==========================================================

    async openDocument(document) {

        this.setDocument(
            document
        );

        return this.showPrintDialog();

    }

    //==========================================================
    // PRINT DIALOG
    //==========================================================

    async showPrintDialog(options = {}) {

        if (!this.document)
            throw new Error(
                "No document loaded."
            );

        const PrintDialog =
            require("./PrintDialog");

        const dialog =
            new PrintDialog(

                this.application,

                {

                    document:
                        this.document,

                    ...options

                }

            );

        this.emit(
            "dialog.opened",
            dialog
        );

        const result =
            await dialog.open();

        this.emit(
            "dialog.closed",
            result
        );

        return result;

    }

    //==========================================================
    // DIRECT PRINT
    //==========================================================

    async print(options = {}) {

        if (!this.document)
            throw new Error(
                "No document loaded."
            );

        if (
            options.queueId === undefined ||
            options.queueId === null
        ) {

            throw new Error(
                "queueId is required."
            );

        }

        const printOptions = {

            name:
                this.document.name,

            filename:
                this.document.filename,

            mime:
                this.document.mime,

            copies:
                options.copies ?? 1,

            color:
                options.color ?? false,

            duplex:
                options.duplex ?? false,

            priority:
                options.priority ?? 0,

            user:
                options.user ?? null

        };

        //------------------------------------------------------
        // Datei
        //------------------------------------------------------

        const file =
            this.document.data ||
            this.document.path;

        if (!file)
            throw new Error(
                "Document contains neither data nor path."
            );

        //------------------------------------------------------
        // PrintManager
        //------------------------------------------------------

        const job =
            await this.application.print(

                options.queueId,

                file,

                printOptions

            );

        this.emit(
            "printed",
            job
        );

        return job;

    }

    //==========================================================
    // STATUS
    //==========================================================

    status() {

        return {

            enabled:
                this.options.enabled,

            connected:
                this.connected,

            document:
                this.document
                    ? {

                        name:
                            this.document.name,

                        filename:
                            this.document.filename,

                        mime:
                            this.document.mime,

                        size:
                            this.document.size

                    }
                    : null

        };

    }

    //==========================================================
    // CLOSE
    //==========================================================

    async close() {

        this.document = null;

        this.connected = false;

        this.emit(
            "closed"
        );

    }

}

module.exports = OfficeIntegration;