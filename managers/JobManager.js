"use strict";

const EventEmitter = require("events");

class JobManager extends EventEmitter {

    constructor(
        printServer,
        socket
    ) {

        super();

        if (!printServer)
            throw new Error(
                "PrintServerClient is required."
            );

        if (!socket)
            throw new Error(
                "PrintServerSocketClient is required."
            );

        this.printServer =
            printServer;

        this.socket =
            socket;

        this.jobs =
            new Map();

        this.loaded = false;

        this.bindEvents();

    }

    //----------------------------------------------------------
    // Socket Events
    //----------------------------------------------------------

    bindEvents() {

        //------------------------------------------------------
        // Job erstellt
        //------------------------------------------------------

        this.socket.onJobCreated(

            job => {

                this.updateLocalJob(
                    job
                );

                this.emit(
                    "created",
                    job
                );

            }

        );

        //------------------------------------------------------
        // Job aktualisiert
        //------------------------------------------------------

        this.socket.onJobUpdated(

            job => {

                this.updateLocalJob(
                    job
                );

                this.emit(
                    "updated",
                    job
                );

            }

        );

        //------------------------------------------------------
        // Job abgeschlossen
        //------------------------------------------------------

        this.socket.onJobCompleted(

            job => {

                this.updateLocalJob(
                    job
                );

                this.emit(
                    "completed",
                    job
                );

            }

        );

        //------------------------------------------------------
        // Job fehlgeschlagen
        //------------------------------------------------------

        this.socket.onJobFailed(

            job => {

                this.updateLocalJob(
                    job
                );

                this.emit(
                    "failed",
                    job
                );

            }

        );

        //------------------------------------------------------
        // Job abgebrochen
        //------------------------------------------------------

        this.socket.onJobCancelled(

            job => {

                this.updateLocalJob(
                    job
                );

                this.emit(
                    "cancelled",
                    job
                );

            }

        );

    }

    //----------------------------------------------------------
    // Lokalen Job aktualisieren
    //----------------------------------------------------------

    updateLocalJob(job) {

        if (!job)
            return null;

        const id =
            job.id;

        if (
            id === undefined ||
            id === null
        )
            return null;

        const key =
            String(id);

        const previous =
            this.jobs.get(key);

        const current = {

            ...(previous || {}),

            ...job

        };

        this.jobs.set(
            key,
            current
        );

        return current;

    }

    //----------------------------------------------------------
    // Jobs laden
    //----------------------------------------------------------

    async load() {

        const result =
            await this.printServer.getJobs();

        const jobs =
            this.extractCollection(
                result
            );

        this.jobs.clear();

        for (const job of jobs) {

            this.updateLocalJob(
                job
            );

        }

        this.loaded = true;

        this.emit(
            "loaded",
            this.getAll()
        );

        return this.getAll();

    }

    //----------------------------------------------------------
    // API-Antwort normalisieren
    //----------------------------------------------------------

    extractCollection(result) {

        if (Array.isArray(result))
            return result;

        if (
            result &&
            Array.isArray(result.data)
        )
            return result.data;

        if (
            result &&
            Array.isArray(result.jobs)
        )
            return result.jobs;

        return [];

    }

    //----------------------------------------------------------
    // Alle Jobs
    //----------------------------------------------------------

    getAll() {

        return [
            ...this.jobs.values()
        ];

    }

    //----------------------------------------------------------
    // Job holen
    //----------------------------------------------------------

    get(id) {

        if (
            id === undefined ||
            id === null
        )
            return null;

        return this.jobs.get(
            String(id)
        ) || null;

    }

    //----------------------------------------------------------
    // Job vom Server laden
    //----------------------------------------------------------

    async refresh(id) {

        const result =
            await this.printServer.getJob(
                id
            );

        const job =
            result?.data ||
            result;

        if (job) {

            this.updateLocalJob(
                job
            );

            this.emit(
                "updated",
                job
            );

        }

        return job;

    }

    //----------------------------------------------------------
    // Job abbrechen
    //----------------------------------------------------------

    async cancel(id) {

        const result =
            await this.printServer.cancelJob(
                id
            );

        await this.refresh(id);

        return result;

    }

    //----------------------------------------------------------
    // Job neu starten
    //----------------------------------------------------------

    async restart(id) {

        const result =
            await this.printServer.restartJob(
                id
            );

        await this.refresh(id);

        return result;

    }

    //----------------------------------------------------------
    // Jobs einer Queue
    //----------------------------------------------------------

    getByQueue(queueId) {

        return this.getAll().filter(

            job => {

                return (

                    String(
                        job.queueId
                    ) === String(
                        queueId
                    )

                );

            }

        );

    }

    //----------------------------------------------------------
    // Jobs nach Status
    //----------------------------------------------------------

    getByStatus(status) {

        return this.getAll().filter(

            job => {

                return (

                    job.status === status

                );

            }

        );

    }

    //----------------------------------------------------------
    // Aktive Jobs
    //----------------------------------------------------------

    getActive() {

        const activeStates = [

            "QUEUED",
            "PENDING",
            "PROCESSING",
            "PRINTING",
            "HELD"

        ];

        return this.getAll().filter(

            job =>

                activeStates.includes(
                    String(
                        job.status
                    ).toUpperCase()
                )

        );

    }

    //----------------------------------------------------------
    // Job entfernen
    //----------------------------------------------------------

    remove(id) {

        const key =
            String(id);

        const job =
            this.jobs.get(key);

        if (!job)
            return false;

        this.jobs.delete(key);

        this.emit(
            "removed",
            job
        );

        return true;

    }

    //----------------------------------------------------------
    // Status
    //----------------------------------------------------------

    status() {

        return {

            loaded:
                this.loaded,

            count:
                this.jobs.size,

            active:
                this.getActive().length

        };

    }

}

module.exports = JobManager;