"use strict";

const EventEmitter = require("events");

class QueueManager extends EventEmitter {

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

        this.queues =
            new Map();

        this.loaded = false;

        this.bindEvents();

    }

    //----------------------------------------------------------
    // Socket Events
    //----------------------------------------------------------

    bindEvents() {

        this.socket.onQueueCreated(

            queue => {

                if (!queue)
                    return;

                const id =
                    queue.id;

                if (id === undefined ||
                    id === null)
                    return;

                this.queues.set(
                    String(id),
                    queue
                );

                this.emit(
                    "created",
                    queue
                );

                this.emit(
                    "updated",
                    queue
                );

            }

        );

        this.socket.onQueueUpdated(

            queue => {

                if (!queue)
                    return;

                const id =
                    queue.id;

                if (id === undefined ||
                    id === null)
                    return;

                this.queues.set(
                    String(id),
                    queue
                );

                this.emit(
                    "updated",
                    queue
                );

            }

        );

        this.socket.onQueueDeleted(

            queue => {

                if (!queue)
                    return;

                const id =
                    typeof queue === "object"
                        ? queue.id
                        : queue;

                if (id === undefined ||
                    id === null)
                    return;

                const key =
                    String(id);

                const existing =
                    this.queues.get(key);

                this.queues.delete(key);

                this.emit(
                    "deleted",
                    existing || queue
                );

            }

        );

    }

    //----------------------------------------------------------
    // Alle Queues laden
    //----------------------------------------------------------

    async load() {

        const result =
            await this.printServer.getQueues();

        const queues =
            this.extractCollection(
                result
            );

        this.queues.clear();

        for (const queue of queues) {

            if (
                queue &&
                queue.id !== undefined &&
                queue.id !== null
            ) {

                this.queues.set(
                    String(queue.id),
                    queue
                );

            }

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
            Array.isArray(result.queues)
        )
            return result.queues;

        return [];

    }

    //----------------------------------------------------------
    // Alle Queues
    //----------------------------------------------------------

    getAll() {

        return [
            ...this.queues.values()
        ];

    }

    //----------------------------------------------------------
    // Queue nach ID
    //----------------------------------------------------------

    get(id) {

        if (
            id === undefined ||
            id === null
        )
            return null;

        return this.queues.get(
            String(id)
        ) || null;

    }

    //----------------------------------------------------------
    // Queue vom Server aktualisieren
    //----------------------------------------------------------

    async refresh(id) {

        const queue =
            await this.printServer.getQueue(
                id
            );

        const entity =
            queue?.data ||
            queue;

        if (
            entity &&
            entity.id !== undefined
        ) {

            this.queues.set(
                String(entity.id),
                entity
            );

            this.emit(
                "updated",
                entity
            );

        }

        return entity;

    }

    //----------------------------------------------------------
    // Queue Status
    //----------------------------------------------------------

    async getStatus(id) {

        return this.printServer.getQueueStatus(
            id
        );

    }

    //----------------------------------------------------------
    // Queue Jobs
    //----------------------------------------------------------

    async getJobs(id) {

        return this.printServer.getQueueJobs(
            id
        );

    }

    //----------------------------------------------------------
    // Pause
    //----------------------------------------------------------

    async pause(id) {

        const result =
            await this.printServer.pauseQueue(
                id
            );

        await this.refresh(id);

        this.emit(
            "paused",
            this.get(id)
        );

        return result;

    }

    //----------------------------------------------------------
    // Resume
    //----------------------------------------------------------

    async resume(id) {

        const result =
            await this.printServer.resumeQueue(
                id
            );

        await this.refresh(id);

        this.emit(
            "resumed",
            this.get(id)
        );

        return result;

    }

    //----------------------------------------------------------
    // Enable
    //----------------------------------------------------------

    async enable(id) {

        const result =
            await this.printServer.enableQueue(
                id
            );

        await this.refresh(id);

        this.emit(
            "enabled",
            this.get(id)
        );

        return result;

    }

    //----------------------------------------------------------
    // Disable
    //----------------------------------------------------------

    async disable(id) {

        const result =
            await this.printServer.disableQueue(
                id
            );

        await this.refresh(id);

        this.emit(
            "disabled",
            this.get(id)
        );

        return result;

    }

    //----------------------------------------------------------
    // Queue auswählen
    //----------------------------------------------------------

    select(id) {

        const queue =
            this.get(id);

        if (!queue)
            return null;

        this.selected =
            queue;

        this.emit(
            "selected",
            queue
        );

        return queue;

    }

    //----------------------------------------------------------
    // Ausgewählte Queue
    //----------------------------------------------------------

    getSelected() {

        return this.selected || null;

    }

    //----------------------------------------------------------
    // Status
    //----------------------------------------------------------

    status() {

        return {

            loaded:
                this.loaded,

            count:
                this.queues.size,

            selected:
                this.selected?.id ||
                null

        };

    }

}

module.exports = QueueManager;