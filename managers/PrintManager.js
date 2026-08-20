"use strict";

const EventEmitter = require("events");

class PrintManager extends EventEmitter {

    constructor(
        printServer,
        socketClient
    ) {

        super();

        this.printServer =
            printServer;

        this.socket =
            socketClient;

        this.jobs =
            new Map();

        this.bindSocket();

    }

    //----------------------------------------------------------
    // Socket
    //----------------------------------------------------------

    bindSocket() {

        this.socket.onJobCreated(
            job => {

                this.jobs.set(
                    job.id,
                    job
                );

                this.emit(
                    "job.created",
                    job
                );

            }
        );

        this.socket.onJobUpdated(
            job => {

                this.jobs.set(
                    job.id,
                    job
                );

                this.emit(
                    "job.updated",
                    job
                );

            }
        );

        this.socket.onJobCompleted(
            job => {

                this.jobs.set(
                    job.id,
                    job
                );

                this.emit(
                    "job.completed",
                    job
                );

            }
        );

        this.socket.onJobFailed(
            job => {

                this.jobs.set(
                    job.id,
                    job
                );

                this.emit(
                    "job.failed",
                    job
                );

            }
        );

    }

    //----------------------------------------------------------
    // Drucken
    //----------------------------------------------------------

    async print(
        queueId,
        file,
        options = {}
    ) {

        const response =
            await this.printServer.uploadJob(

                queueId,

                file,

                options

            );

        const job =
            response.data ||
            response;

        if (job.id) {

            this.jobs.set(
                job.id,
                job
            );

        }

        this.emit(
            "job.submitted",
            job
        );

        return job;

    }

    //----------------------------------------------------------
    // Job abbrechen
    //----------------------------------------------------------

    async cancel(jobId) {

        return this.printServer.cancelJob(
            jobId
        );

    }

    //----------------------------------------------------------
    // Job neu starten
    //----------------------------------------------------------

    async restart(jobId) {

        return this.printServer.restartJob(
            jobId
        );

    }

    //----------------------------------------------------------
    // Job
    //----------------------------------------------------------

    getJob(jobId) {

        return this.jobs.get(
            jobId
        );

    }

}

module.exports = PrintManager;