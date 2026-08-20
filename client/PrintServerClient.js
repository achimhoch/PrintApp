"use strict";

const fs = require("fs");
const path = require("path");

class PrintServerClient {

    constructor(options = {}) {

        this.options = {

            baseUrl:
                options.baseUrl ||
                "http://localhost:3000/api",

            apiKey:
                options.apiKey || null,

            timeout:
                options.timeout ||
                30000,

            ...options

        };

        this.baseUrl =
            this.options.baseUrl.replace(
                /\/$/,
                ""
            );

    }

    //----------------------------------------------------------
    // URL
    //----------------------------------------------------------

    url(endpoint) {

        return (

            this.baseUrl +

            "/" +

            String(endpoint)
                .replace(/^\/+/, "")

        );

    }

    //----------------------------------------------------------
    // Header
    //----------------------------------------------------------

    headers(headers = {}) {

        const result = {

            Accept:
                "application/json",

            ...headers

        };

        if (this.options.apiKey) {

            result[
                "X-API-Key"
            ] = this.options.apiKey;

        }

        return result;

    }

    //----------------------------------------------------------
    // HTTP Request
    //----------------------------------------------------------

    async request(
        method,
        endpoint,
        options = {}
    ) {

        const controller =
            new AbortController();

        const timeout =
            setTimeout(

                () =>
                    controller.abort(),

                options.timeout ||
                this.options.timeout

            );

        try {

            const response =
                await fetch(

                    this.url(endpoint),

                    {

                        method,

                        headers:
                            this.headers(
                                options.headers
                            ),

                        body:
                            options.body,

                        signal:
                            controller.signal

                    }

                );

            const contentType =
                response.headers.get(
                    "content-type"
                ) || "";

            let data;

            if (
                contentType.includes(
                    "application/json"
                )
            ) {

                data =
                    await response.json();

            }
            else {

                data =
                    await response.text();

            }

            if (!response.ok) {

                const error =
                    new Error(

                        data?.error?.message ||

                        data?.message ||

                        `HTTP ${response.status}`

                    );

                error.status =
                    response.status;

                error.response =
                    data;

                throw error;

            }

            return data;

        }
        finally {

            clearTimeout(timeout);

        }

    }

    //----------------------------------------------------------
    // GET
    //----------------------------------------------------------

    async get(endpoint) {

        return this.request(

            "GET",

            endpoint

        );

    }

    //----------------------------------------------------------
    // POST JSON
    //----------------------------------------------------------

    async post(
        endpoint,
        data = {}
    ) {

        return this.request(

            "POST",

            endpoint,

            {

                headers: {

                    "Content-Type":
                        "application/json"

                },

                body:
                    JSON.stringify(data)

            }

        );

    }

    //----------------------------------------------------------
    // PUT JSON
    //----------------------------------------------------------

    async put(
        endpoint,
        data = {}
    ) {

        return this.request(

            "PUT",

            endpoint,

            {

                headers: {

                    "Content-Type":
                        "application/json"

                },

                body:
                    JSON.stringify(data)

            }

        );

    }

    //----------------------------------------------------------
    // DELETE
    //----------------------------------------------------------

    async delete(endpoint) {

        return this.request(

            "DELETE",

            endpoint

        );

    }

    //----------------------------------------------------------
    // Queues
    //----------------------------------------------------------

    async getQueues() {

        return this.get(
            "/queues"
        );

    }

    //----------------------------------------------------------

    async getQueue(id) {

        return this.get(

            `/queues/${encodeURIComponent(id)}`

        );

    }

    //----------------------------------------------------------

    async getQueueStatus(id) {

        return this.get(

            `/queues/${encodeURIComponent(id)}/status`

        );

    }

    //----------------------------------------------------------

    async getQueueJobs(id) {

        return this.get(

            `/queues/${encodeURIComponent(id)}/jobs`

        );

    }

    //----------------------------------------------------------
    // Queue pausieren
    //----------------------------------------------------------

    async pauseQueue(id) {

        return this.post(

            `/queues/${encodeURIComponent(id)}/pause`

        );

    }

    //----------------------------------------------------------
    // Queue fortsetzen
    //----------------------------------------------------------

    async resumeQueue(id) {

        return this.post(

            `/queues/${encodeURIComponent(id)}/resume`

        );

    }

    //----------------------------------------------------------
    // Queue aktivieren
    //----------------------------------------------------------

    async enableQueue(id) {

        return this.post(

            `/queues/${encodeURIComponent(id)}/enable`

        );

    }

    //----------------------------------------------------------
    // Queue deaktivieren
    //----------------------------------------------------------

    async disableQueue(id) {

        return this.post(

            `/queues/${encodeURIComponent(id)}/disable`

        );

    }

    //----------------------------------------------------------
    // Job Upload
    //----------------------------------------------------------

    async uploadJob(
        queueId,
        file,
        options = {}
    ) {

        if (!queueId)
            throw new Error(
                "queueId is required."
            );

        if (!file)
            throw new Error(
                "file is required."
            );

        const form =
            new FormData();

        //------------------------------------------------------
        // Datei
        //------------------------------------------------------

        let stream;

        if (typeof file === "string") {

            const filename =
                path.basename(file);

            stream =
                fs.createReadStream(file);

            form.append(

                "document",

                stream,

                filename

            );

        }
        else {

            if (file.buffer) {

                const blob =
                    new Blob([
                        file.buffer
                    ], {

                        type:
                            file.mimeType ||
                            "application/octet-stream"

                    });

                form.append(

                    "document",

                    blob,

                    file.filename ||
                    "document"

                );

            }
            else {

                throw new Error(
                    "Unsupported file."
                );

            }

        }

        //------------------------------------------------------
        // Metadaten
        //------------------------------------------------------

        if (options.name !== undefined) {

            form.append(
                "name",
                String(options.name)
            );

        }

        if (options.owner !== undefined) {

            form.append(
                "owner",
                String(options.owner)
            );

        }

        if (options.copies !== undefined) {

            form.append(
                "copies",
                String(options.copies)
            );

        }

        if (options.color !== undefined) {

            form.append(
                "color",
                String(options.color)
            );

        }

        if (options.duplex !== undefined) {

            form.append(
                "duplex",
                String(options.duplex)
            );

        }

        if (options.priority !== undefined) {

            form.append(
                "priority",
                String(options.priority)
            );

        }

        //------------------------------------------------------
        // Request
        //------------------------------------------------------

        return this.request(

            "POST",

            `/queues/${encodeURIComponent(queueId)}/jobs`,

            {

                body: form,

                timeout:
                    options.timeout ||
                    this.options.timeout

            }

        );

    }

    //----------------------------------------------------------
    // Job Upload aus Datei
    //----------------------------------------------------------

    async printFile(
        queueId,
        filename,
        options = {}
    ) {

        return this.uploadJob(

            queueId,

            filename,

            {

                ...options,

                name:
                    options.name ||
                    path.basename(filename)

            }

        );

    }

    //----------------------------------------------------------
    // Jobs
    //----------------------------------------------------------

    async getJobs() {

        return this.get(
            "/jobs"
        );

    }

    //----------------------------------------------------------

    async getJob(id) {

        return this.get(

            `/jobs/${encodeURIComponent(id)}`

        );

    }

    //----------------------------------------------------------

    async cancelJob(id) {

        return this.post(

            `/jobs/${encodeURIComponent(id)}/cancel`

        );

    }

    //----------------------------------------------------------

    async restartJob(id) {

        return this.post(

            `/jobs/${encodeURIComponent(id)}/restart`

        );

    }

    //----------------------------------------------------------
    // Drucker
    //----------------------------------------------------------

    async getPrinters() {

        return this.get(
            "/printers"
        );

    }

    //----------------------------------------------------------

    async getPrinter(id) {

        return this.get(

            `/printers/${encodeURIComponent(id)}`

        );

    }

    //----------------------------------------------------------
    // Discovery
    //----------------------------------------------------------

    async discoveryStatus() {

        return this.get(
            "/discovery/status"
        );

    }

    //----------------------------------------------------------

    async discoveryScan() {

        return this.post(
            "/discovery/scan"
        );

    }

}

module.exports = PrintServerClient;