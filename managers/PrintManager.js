"use strict";

const EventEmitter = require("events");

class PrintManager extends EventEmitter {

    constructor(
        printServer,
        socketClient,
        jobManager
    ) {

        super();

        this.printServer =
            printServer;

        this.socket =
            socketClient;

        this.jobManager = jobManager;

        this.bindSocket();

    }

    //----------------------------------------------------------
    // Socket
    //----------------------------------------------------------

    bindSocket() {

        this.jobManager.on("created", job => {

                /*this.jobs.set(
                    job.id,
                    job
                );*/

                this.emit("job.created", job);

        });

        this.jobManager.on("updated", job => {

                /*this.jobs.set(
                    job.id,
                    job
                );*/

                this.emit("job.updated", job);

        });

        this.jobManager.on("completed",  job => {

                /*this.jobs.set(
                    job.id,
                    job
                );*/

                this.emit("job.completed", job);

        });

        this.jobManager.on("failed", job => {

                /*this.jobs.set(
                    job.id,
                    job
                );*/

                this.emit("job.failed", job);

        });

        this.jobManager.on("cancelled", job => {

            this.emit("job.cancelled", job);

        });

    }

    //----------------------------------------------------------
    // Drucken
    //----------------------------------------------------------

    async print(
        queueId,
        file,
        options = {}
    ) {

        if (queueId === undefined || queueId === null) {
                throw new Error("queueId is required.");
        }

        if (!file) {
            throw new Error("Print file is required.");
        }

        const result = await this.printServer.uplloadJob(queueId, file, options);

        const job =
            result?.data ||
            result?.job ||
            result;

        if (job.id && job.id !== undefined && job.id !== null) {

            this.jobManager.updateLocalJob(job);

        }

        this.emit("job.submitted", job);

        return job;

    }
    //----------------------------------------------------------
    //PrintBuffer
    //----------------------------------------------------------

    async printBuffer(queueId, data, options = {}) {
        if (!data) {
            throw new Error("Print data is required.");
        }

        return this.print(queueId, data, options);
    }

    //----------------------------------------------------------
    //PrintFile
    //----------------------------------------------------------

    async printFile(queueId, file, options = {}) {
        if (!file) {
            throw new Error("Print file is required.");
        }

        return this.print(queueId, file, options);
    }

    //----------------------------------------------------------
    // Job abbrechen
    //----------------------------------------------------------

    async cancelJob(id) {

        return this.jobManager.cancel(id);

    }

    //----------------------------------------------------------
    // Job neu starten
    //----------------------------------------------------------

    async restartJob(id) {

        return this.jobManager.restart(id);

    }

    //----------------------------------------------------------
    // Job
    //----------------------------------------------------------

    async getJob(id) {

        return this.jobManager.get(id);

    }

    //----------------------------------------------------------
    //Queue
    //----------------------------------------------------------

    async getQueue(queueid) {
        return this.printServer.getQueue(queueid);
    }
    //----------------------------------------------------------
    //Status
    //----------------------------------------------------------
    status() {
        return {
            jobs: this.jobManager ? this.jobManager.status() : null
        };
    }

}

module.exports = PrintManager;