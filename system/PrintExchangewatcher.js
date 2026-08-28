"use strict";

const EventEmitter = require("events");
const fs = require("fs");
const fsp = fs.promises;
const path = require("path");
const crypto = require("crypto");

class PrintExchangeWatcher extends EventEmitter {

    constructor(application, options = {}) {
        super();

        if (!application)
            throw new Error("Application is required.");

        this.application = application;

        this.options = {
            enabled: options.enabled !== false,
            directory: options.directory ||
                path.join(
                    process.env.LOCALAPPDATA || process.cwd(),
                    "Druckserver",
                    "PrintExchange"
                ),
            scanInterval: Number(options.scanInterval ?? 1000),
            stableTime: Number(options.stableTime ?? 750),
            processingDirectory: options.processingDirectory || "processing",
            completedDirectory: options.completedDirectory || "completed",
            failedDirectory: options.failedDirectory || "failed",
            deleteAfterSubmit: options.deleteAfterSubmit === true,
            maxFileSize: Number(options.maxFileSize ?? 100 * 1024 * 1024),
            acceptedMimeTypes: options.acceptedMimeTypes || [
                "application/pdf",
                "application/oxps",
                "application/vnd.ms-xpsdocument"
            ]
        };

        this.running = false;
        this.watcher = null;
        this.timer = null;
        this.processing = new Set();
        this.jobs = new Map();
    }

    async initialize() {
        if (!this.options.enabled) return;
        await this.ensureDirectories();
        this.emit("initialized", { directory: this.options.directory });
    }

    async start() {
        if (this.running || !this.options.enabled) return;

        await this.ensureDirectories();
        this.running = true;

        this.watcher = fs.watch(
            this.options.directory,
            { persistent: false },
            () => this.scan().catch(error => this.emit("error", error))
        );

        this.timer = setInterval(
            () => this.scan().catch(error => this.emit("error", error)),
            this.options.scanInterval
        );

        await this.scan();
        this.emit("started");
    }

    async stop() {
        if (!this.running) return;

        this.running = false;

        if (this.watcher) {
            this.watcher.close();
            this.watcher = null;
        }

        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }

        this.emit("stopped");
    }

    async ensureDirectories() {
        for (const name of [
            "",
            this.options.processingDirectory,
            this.options.completedDirectory,
            this.options.failedDirectory
        ]) {
            await fsp.mkdir(
                path.join(this.options.directory, name),
                { recursive: true }
            );
        }
    }

    async scan() {
        if (!this.running) return;

        const entries = await fsp.readdir(
            this.options.directory,
            { withFileTypes: true }
        );

        for (const entry of entries) {
            if (!entry.isFile()) continue;
            if (!entry.name.toLowerCase().endsWith(".json")) continue;

            await this.processMetadata(
                path.join(this.options.directory, entry.name)
            );
        }
    }

    async processMetadata(metadataPath) {
        if (this.processing.has(metadataPath)) return;
        this.processing.add(metadataPath);

        try {
            const metadata = await this.readMetadata(metadataPath);
            if (!metadata) return;

            const filePath = await this.resolvePrintFile(
                metadata,
                metadataPath
            );

            if (!filePath)
                throw new Error("PrintExchange: print file not found.");

            await this.waitUntilStable(filePath);

            const job = await this.createJob(metadata, filePath);
            this.jobs.set(job.id, job);

            this.emit("job.received", job);

            const result = await this.submitJob(job);

            this.emit("job.submitted", { job, result });

            await this.finish(metadataPath, filePath);
            this.jobs.delete(job.id);
        }
        catch (error) {
            this.emit("job.error", { metadataPath, error });
            await this.fail(metadataPath, error);
        }
        finally {
            this.processing.delete(metadataPath);
        }
    }

    async readMetadata(metadataPath) {
        let raw;

        try {
            raw = await fsp.readFile(metadataPath, "utf8");
        }
        catch (error) {
            if (["ENOENT", "EBUSY", "EPERM"].includes(error.code))
                return null;
            throw error;
        }

        try {
            return JSON.parse(raw);
        }
        catch {
            // Datei wird eventuell noch geschrieben.
            return null;
        }
    }

    async resolvePrintFile(metadata, metadataPath) {
        const fileName =
            metadata.file ||
            metadata.filename ||
            metadata.path;

        if (!fileName) return null;

        const base = path.resolve(this.options.directory);
        const filePath = path.resolve(
            path.dirname(metadataPath),
            fileName
        );

        if (
            filePath !== base &&
            !filePath.startsWith(base + path.sep)
        ) {
            throw new Error(
                "PrintExchange: file is outside exchange directory."
            );
        }

        const stat = await fsp.stat(filePath).catch(() => null);

        if (!stat || !stat.isFile()) return null;

        if (
            this.options.maxFileSize > 0 &&
            stat.size > this.options.maxFileSize
        ) {
            throw new Error(
                `PrintExchange: file exceeds maximum size of ${this.options.maxFileSize} bytes.`
            );
        }

        return filePath;
    }

    async waitUntilStable(filePath) {
        let previousSize = -1;
        let stableSince = Date.now();

        while (this.running) {
            const stat = await fsp.stat(filePath);

            if (stat.size !== previousSize) {
                previousSize = stat.size;
                stableSince = Date.now();
            }

            if (Date.now() - stableSince >= this.options.stableTime)
                return;

            await new Promise(resolve => setTimeout(resolve, 100));
        }

        throw new Error(
            "PrintExchangeWatcher stopped while waiting for file."
        );
    }

    async createJob(metadata, filePath) {
        const stat = await fsp.stat(filePath);

        const id = metadata.id || crypto.randomUUID();
        const mime = metadata.mime || this.detectMime(filePath);

        if (
            this.options.acceptedMimeTypes.length &&
            !this.options.acceptedMimeTypes.includes(mime)
        ) {
            throw new Error(
                `PrintExchange: unsupported MIME type '${mime}'.`
            );
        }

        return {
            id,
            filename: metadata.filename || path.basename(filePath),
            mime,
            file: filePath,
            data: filePath,
            size: stat.size,
            queueId: metadata.queueId ?? null,
            user: metadata.user ?? null,
            copies: Number(metadata.copies ?? 1),
            color: Boolean(metadata.color),
            duplex: Boolean(metadata.duplex),
            priority: Number(metadata.priority ?? 0),
            source: metadata.source || "windows-print-support",
            createdAt: metadata.createdAt || new Date().toISOString(),
            metadata
        };
    }

    async submitJob(job) {
        if (
            this.application.systemPrint &&
            typeof this.application.systemPrint.submit === "function"
        ) {
            return this.application.systemPrint.submit(job);
        }

        if (
            this.application.printManager &&
            typeof this.application.printManager.printFile === "function"
        ) {
            const queueId =
                job.queueId || await this.getDefaultQueue();

            return this.application.printManager.printFile(
                queueId,
                job.file,
                {
                    name: job.filename,
                    filename: job.filename,
                    mime: job.mime,
                    copies: job.copies,
                    color: job.color,
                    duplex: job.duplex,
                    priority: job.priority,
                    user: job.user
                }
            );
        }

        throw new Error(
            "PrintExchangeWatcher: no print submission service available."
        );
    }

    async getDefaultQueue() {
        const manager = this.application.queueManager;

        if (!manager || typeof manager.getAll !== "function")
            throw new Error("QueueManager is not available.");

        const queues = await manager.getAll();

        const queue = queues.find(
            item =>
                item.enabled !== false &&
                item.paused !== true
        );

        if (!queue)
            throw new Error("No active print queue available.");

        return queue.id;
    }

    async finish(metadataPath, filePath) {
        if (this.options.deleteAfterSubmit) {
            await this.removeIfExists(metadataPath);
            await this.removeIfExists(filePath);
            return;
        }

        const directory = path.join(
            this.options.directory,
            this.options.completedDirectory
        );

        await fsp.mkdir(directory, { recursive: true });

        await this.move(
            metadataPath,
            path.join(
                directory,
                `${Date.now()}_${path.basename(metadataPath)}`
            )
        );

        if (await this.exists(filePath)) {
            await this.move(
                filePath,
                path.join(directory, path.basename(filePath))
            );
        }
    }

    async fail(metadataPath, error) {
        if (!await this.exists(metadataPath)) return;

        const directory = path.join(
            this.options.directory,
            this.options.failedDirectory
        );

        await fsp.mkdir(directory, { recursive: true });

        const target = path.join(
            directory,
            `${Date.now()}_${path.basename(metadataPath)}`
        );

        try {
            await this.move(metadataPath, target);

            await fsp.writeFile(
                `${target}.error.txt`,
                String(error?.stack || error?.message || error),
                "utf8"
            );
        }
        catch (moveError) {
            this.emit("error", moveError);
        }
    }

    detectMime(filePath) {
        switch (path.extname(filePath).toLowerCase()) {
            case ".pdf":
                return "application/pdf";
            case ".oxps":
                return "application/oxps";
            case ".xps":
                return "application/vnd.ms-xpsdocument";
            default:
                return "application/octet-stream";
        }
    }

    async move(source, target) {
        try {
            await fsp.rename(source, target);
        }
        catch (error) {
            if (error.code !== "EXDEV") throw error;

            await fsp.copyFile(source, target);
            await fsp.unlink(source);
        }
    }

    async removeIfExists(filePath) {
        await fsp.unlink(filePath).catch(error => {
            if (error.code !== "ENOENT") throw error;
        });
    }

    async exists(filePath) {
        return fsp.access(filePath)
            .then(() => true)
            .catch(() => false);
    }

    status() {
        return {
            enabled: this.options.enabled,
            running: this.running,
            directory: this.options.directory,
            processing: this.processing.size,
            jobs: this.jobs.size
        };
    }
}

module.exports = PrintExchangeWatcher;
