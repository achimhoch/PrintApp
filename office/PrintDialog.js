"use strict";

const EventEmitter = require("events");

class PrintDialog extends EventEmitter {

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

        this.document =
            options.document || null;

        //------------------------------------------------------
        // Optionen
        //------------------------------------------------------

        this.options = {

            queueId:
                options.queueId ?? null,

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
        // Status
        //------------------------------------------------------

        this.opened = false;

        this.result = null;

        this.queues = [];

    }

    //==========================================================
    // OPEN
    //==========================================================

    async open() {

        if (this.opened)
            return this.result;

        this.opened = true;

        //------------------------------------------------------
        // Queues laden
        //------------------------------------------------------

        this.queues =
            await this.application.getQueues();

        //------------------------------------------------------
        // Standardqueue
        //------------------------------------------------------

        if (
            this.options.queueId === null &&
            this.queues.length > 0
        ) {

            const queue =
                this.findDefaultQueue();

            if (queue)
                this.options.queueId =
                    queue.id;

        }

        this.emit(
            "opened",
            this
        );

        return this;

    }

    //==========================================================
    // DEFAULT QUEUE
    //==========================================================

    findDefaultQueue() {

        //------------------------------------------------------
        // Erste aktive Queue verwenden
        //------------------------------------------------------

        return (

            this.queues.find(

                queue =>
                    queue.enabled !== false &&
                    queue.paused !== true

            )

            ||

            this.queues[0]

            ||

            null

        );

    }

    //==========================================================
    // QUEUES
    //==========================================================

    getQueues() {

        return this.queues;

    }

    //----------------------------------------------------------

    getQueue(id) {

        return this.queues.find(

            queue =>
                String(queue.id) ===
                String(id)

        ) || null;

    }

    //----------------------------------------------------------

    selectQueue(id) {

        const queue =
            this.getQueue(id);

        if (!queue)
            throw new Error(
                `Queue '${id}' not found.`
            );

        if (queue.enabled === false)
            throw new Error(
                "Selected queue is disabled."
            );

        if (queue.paused === true)
            throw new Error(
                "Selected queue is paused."
            );

        this.options.queueId =
            queue.id;

        this.emit(
            "queue.selected",
            queue
        );

        return queue;

    }

    //==========================================================
    // COPIES
    //==========================================================

    setCopies(copies) {

        copies =
            Number(copies);

        if (
            !Number.isInteger(copies) ||
            copies < 1
        ) {

            throw new Error(
                "Copies must be a positive integer."
            );

        }

        this.options.copies =
            copies;

        this.emit(
            "options.changed",
            this.options
        );

    }

    //==========================================================
    // COLOR
    //==========================================================

    setColor(color) {

        this.options.color =
            Boolean(color);

        this.emit(
            "options.changed",
            this.options
        );

    }

    //==========================================================
    // DUPLEX
    //==========================================================

    setDuplex(duplex) {

        this.options.duplex =
            Boolean(duplex);

        this.emit(
            "options.changed",
            this.options
        );

    }

    //==========================================================
    // PRIORITY
    //==========================================================

    setPriority(priority) {

        priority =
            Number(priority);

        if (!Number.isInteger(priority))
            throw new Error(
                "Priority must be an integer."
            );

        this.options.priority =
            priority;

        this.emit(
            "options.changed",
            this.options
        );

    }

    //==========================================================
    // USER
    //==========================================================

    setUser(user) {

        this.options.user =
            user || null;

        this.emit(
            "options.changed",
            this.options
        );

    }

    //==========================================================
    // OPTIONS
    //==========================================================

    getOptions() {

        return {

            ...this.options

        };

    }

    //==========================================================
    // PRINT
    //==========================================================

    async print() {

        if (!this.opened)
            await this.open();

        if (
            this.options.queueId === null ||
            this.options.queueId === undefined
        ) {

            throw new Error(
                "No print queue selected."
            );

        }

        if (!this.document)
            throw new Error(
                "No document selected."
            );

        //------------------------------------------------------
        // PrintManager
        //------------------------------------------------------

        const job =
            await this.application.print(

                this.options.queueId,

                this.document.data ||
                this.document.path,

                {

                    name:
                        this.document.name,

                    filename:
                        this.document.filename,

                    mime:
                        this.document.mime,

                    copies:
                        this.options.copies,

                    color:
                        this.options.color,

                    duplex:
                        this.options.duplex,

                    priority:
                        this.options.priority,

                    user:
                        this.options.user

                }

            );

        this.result = {

            success:
                true,

            job

        };

        this.emit(
            "printed",
            job
        );

        await this.close();

        return this.result;

    }

    //==========================================================
    // CANCEL
    //==========================================================

    async cancel() {

        this.result = {

            success:
                false,

            cancelled:
                true

        };

        this.emit(
            "cancelled",
            this.result
        );

        await this.close();

        return this.result;

    }

    //==========================================================
    // CLOSE
    //==========================================================

    async close() {

        if (!this.opened)
            return;

        this.opened = false;

        this.emit(
            "closed",
            this.result
        );

    }

    //==========================================================
    // STATUS
    //==========================================================

    status() {

        return {

            opened:
                this.opened,

            document:
                this.document,

            queues:
                this.queues.length,

            options:
                this.getOptions(),

            result:
                this.result

        };

    }

}

module.exports = PrintDialog;