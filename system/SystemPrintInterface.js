"use strict";

const EventEmitter = require("events");

class SystemPrintInterface extends EventEmitter {

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

            name:
                options.name ||
                "Druckserver",

            spoolDirectory:
                options.spoolDirectory ||
                null,

            enabled:
                options.enabled !== false

        };

        this.running = false;

        this.jobs = new Map();

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
    // PRINT JOB
    //==========================================================

    /**
     * Wird von der Windows-Druckschnittstelle aufgerufen.
     *
     * data:
     *
     * {
     *     id,
     *     filename,
     *     data,
     *     mime,
     *     user,
     *     copies,
     *     color,
     *     duplex
     * }
     */
    async submit(data = {}) {

        if (!this.running)
            throw new Error(
                "System print interface is not running."
            );

        if (!data.data)
            throw new Error(
                "Print data is required."
            );

        const id =
            data.id ||
            this.createJobId();

        const job = {

            id,

            filename:
                data.filename ||
                "print-job",

            mime:
                data.mime ||
                "application/pdf",

            user:
                data.user ||
                null,

            copies:
                data.copies ||
                1,

            color:
                Boolean(data.color),

            duplex:
                Boolean(data.duplex),

            data:
                data.data,

            createdAt:
                new Date()

        };

        this.jobs.set(
            id,
            job
        );

        this.emit(
            "job.received",
            job
        );

        try {

            const result =
                await this.routeJob(
                    job
                );

            this.emit(
                "job.submitted",
                {
                    job,
                    result
                }
            );

            return result;

        }
        catch (error) {

            this.emit(
                "job.error",
                {
                    job,
                    error
                }
            );

            throw error;

        }
        finally {

            this.jobs.delete(
                id
            );

        }

    }

    //==========================================================
    // ROUTING
    //==========================================================

    async routeJob(job) {

        //------------------------------------------------------
        // Druckdialog
        //------------------------------------------------------

        const dialog =
            this.application.office
                ? await this.application.office
                    .showPrintDialog({

                        document: {

                            name:
                                job.filename,

                            filename:
                                job.filename,

                            mime:
                                job.mime,

                            data:
                                job.data

                        }

                    })
                : null;

        //------------------------------------------------------
        // Falls kein Dialog benötigt wird
        //------------------------------------------------------

        if (!dialog) {

            return this.application.print(

                await this.getDefaultQueue(),

                job.data,

                {

                    name:
                        job.filename,

                    filename:
                        job.filename,

                    mime:
                        job.mime,

                    copies:
                        job.copies,

                    color:
                        job.color,

                    duplex:
                        job.duplex,

                    user:
                        job.user

                }

            );

        }

        //------------------------------------------------------
        // Dialog verwenden
        //------------------------------------------------------

        dialog.setCopies(
            job.copies
        );

        dialog.setColor(
            job.color
        );

        dialog.setDuplex(
            job.duplex
        );

        dialog.setUser(
            job.user
        );

        return dialog.print();

    }

    //==========================================================
    // DEFAULT QUEUE
    //==========================================================

    async getDefaultQueue() {

        const queues =
            await this.application.getQueues();

        const queue =
            queues.find(

                item =>
                    item.enabled !== false &&
                    item.paused !== true

            );

        if (!queue)
            throw new Error(
                "No active print queue available."
            );

        return queue.id;

    }

    //==========================================================
    // JOB ID
    //==========================================================

    createJobId() {

        return (

            Date.now().toString(36) +
            "-" +
            Math.random()
                .toString(36)
                .substring(2, 10)

        );

    }

    //==========================================================
    // STATUS
    //==========================================================

    status() {

        return {

            running:
                this.running,

            enabled:
                this.options.enabled,

            jobs:
                this.jobs.size,

            name:
                this.options.name

        };

    }

}

module.exports = SystemPrintInterface;