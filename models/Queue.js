"use strict";

class Queue {

    constructor(data = {}) {

        this.id =
            data.id ?? null;

        this.name =
            data.name ?? "";

        this.description =
            data.description ?? "";

        this.printerId =
            data.printerId ?? null;

        this.printer =
            data.printer ?? null;

        this.status =
            data.status ?? "UNKNOWN";

        this.enabled =
            data.enabled !== false;

        this.paused =
            Boolean(data.paused);

        this.processing =
            Boolean(data.processing);

        this.priority =
            data.priority ?? 0;

        this.jobs =
            data.jobs ?? 0;

        this.pendingJobs =
            data.pendingJobs ?? 0;

        this.printingJobs =
            data.printingJobs ?? 0;

        this.completedJobs =
            data.completedJobs ?? 0;

        this.failedJobs =
            data.failedJobs ?? 0;

        this.createdAt =
            data.createdAt ?? null;

        this.updatedAt =
            data.updatedAt ?? null;

    }

    //----------------------------------------------------------
    // Status
    //----------------------------------------------------------

    isEnabled() {

        return this.enabled === true;

    }

    isPaused() {

        return this.paused === true;

    }

    isProcessing() {

        return this.processing === true;

    }

    //----------------------------------------------------------
    // Drucker
    //----------------------------------------------------------

    hasPrinter() {

        return (

            this.printerId !== null &&
            this.printerId !== undefined

        );

    }

    //----------------------------------------------------------
    // Jobs
    //----------------------------------------------------------

    hasJobs() {

        return this.jobs > 0;

    }

    //----------------------------------------------------------
    // Update
    //----------------------------------------------------------

    update(data = {}) {

        Object.assign(
            this,
            new Queue(data)
        );

        return this;

    }

    //----------------------------------------------------------
    // JSON
    //----------------------------------------------------------

    toJSON() {

        return {

            id: this.id,
            name: this.name,
            description: this.description,
            printerId: this.printerId,
            printer: this.printer,
            status: this.status,
            enabled: this.enabled,
            paused: this.paused,
            processing: this.processing,
            priority: this.priority,
            jobs: this.jobs,
            pendingJobs: this.pendingJobs,
            printingJobs: this.printingJobs,
            completedJobs: this.completedJobs,
            failedJobs: this.failedJobs,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt

        };

    }

}

module.exports = Queue;