"use strict";

class Job {

    constructor(data = {}) {

        this.id =
            data.id ?? null;

        this.name =
            data.name ?? "";

        this.queueId =
            data.queueId ?? null;

        this.printerId =
            data.printerId ?? null;

        this.user =
            data.user ?? "";

        this.status =
            data.status ?? "QUEUED";

        this.mime =
            data.mime ??
            data.documentFormat ??
            "application/pdf";

        this.filename =
            data.filename ??
            data.fileName ??
            "";

        this.size =
            data.size ?? 0;

        this.pages =
            data.pages ?? 0;

        this.copies =
            data.copies ?? 1;

        this.color =
            Boolean(data.color);

        this.duplex =
            Boolean(data.duplex);

        this.priority =
            data.priority ?? 0;

        this.progress =
            data.progress ?? 0;

        this.error =
            data.error ?? null;

        this.message =
            data.message ?? null;

        this.printedPages =
            data.printedPages ?? 0;

        this.createdAt =
            data.createdAt ?? null;

        this.startedAt =
            data.startedAt ?? null;

        this.completedAt =
            data.completedAt ?? null;

        this.updatedAt =
            data.updatedAt ?? null;

    }

    //----------------------------------------------------------
    // Status
    //----------------------------------------------------------

    isQueued() {

        return this.status === "QUEUED";

    }

    isPending() {

        return this.status === "PENDING";

    }

    isPrinting() {

        return (

            this.status === "PRINTING" ||
            this.status === "PROCESSING"

        );

    }

    isCompleted() {

        return this.status === "COMPLETED";

    }

    isFailed() {

        return this.status === "FAILED";

    }

    isCancelled() {

        return this.status === "CANCELLED";

    }

    isFinished() {

        return (

            this.isCompleted() ||
            this.isFailed() ||
            this.isCancelled()

        );

    }

    //----------------------------------------------------------
    // Fortschritt
    //----------------------------------------------------------

    getProgress() {

        return Math.max(

            0,

            Math.min(

                100,

                Number(this.progress) || 0

            )

        );

    }

    //----------------------------------------------------------
    // Update
    //----------------------------------------------------------

    update(data = {}) {

        Object.assign(
            this,
            new Job(data)
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
            queueId: this.queueId,
            printerId: this.printerId,
            user: this.user,
            status: this.status,
            mime: this.mime,
            filename: this.filename,
            size: this.size,
            pages: this.pages,
            copies: this.copies,
            color: this.color,
            duplex: this.duplex,
            priority: this.priority,
            progress: this.progress,
            error: this.error,
            message: this.message,
            printedPages: this.printedPages,
            createdAt: this.createdAt,
            startedAt: this.startedAt,
            completedAt: this.completedAt,
            updatedAt: this.updatedAt

        };

    }

}

module.exports = Job;