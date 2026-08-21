"use strict";

class Printer {

    constructor(data = {}) {

        this.id =
            data.id ?? null;

        this.uuid =
            data.uuid ?? null;

        this.name =
            data.name ?? "";

        this.protocol =
            data.protocol ?? "ipp";

        this.ip =
            data.ip ?? null;

        this.host =
            data.host ?? null;

        this.port =
            data.port ?? 631;

        this.uri =
            data.uri ?? null;

        this.manufacturer =
            data.manufacturer ?? "";

        this.model =
            data.model ?? "";

        this.serial =
            data.serial ?? null;

        this.location =
            data.location ?? "";

        this.status =
            data.status ?? "UNKNOWN";

        this.online =
            Boolean(data.online);

        this.busy =
            Boolean(data.busy);

        this.color =
            Boolean(data.color);

        this.duplex =
            Boolean(data.duplex);

        this.resolutions =
            data.resolutions ?? [];

        this.media =
            data.media ?? [];

        this.languages =
            data.languages ?? [];

        this.toner =
            data.toner ?? null;

        this.paper =
            data.paper ?? null;

        this.discovery =
            data.discovery ?? null;

        this.jobsPrinted =
            data.jobsPrinted ?? 0;

        this.pagesPrinted =
            data.pagesPrinted ?? 0;

        this.errors =
            data.errors ?? 0;

        this.lastSeen =
            data.lastSeen ?? null;

        this.lastUpdate =
            data.lastUpdate ?? null;

        this.discovered =
            Boolean(data.discovered);

        this.createdAt =
            data.createdAt ?? null;

        this.updatedAt =
            data.updatedAt ?? null;

    }

    //----------------------------------------------------------
    // Status
    //----------------------------------------------------------

    isOnline() {

        return this.online === true;

    }

    isBusy() {

        return this.busy === true;

    }

    //----------------------------------------------------------
    // Fähigkeiten
    //----------------------------------------------------------

    supportsColor() {

        return this.color === true;

    }

    supportsDuplex() {

        return this.duplex === true;

    }

    //----------------------------------------------------------
    // Update
    //----------------------------------------------------------

    update(data = {}) {

        Object.assign(
            this,
            new Printer(data)
        );

        return this;

    }

    //----------------------------------------------------------
    // JSON
    //----------------------------------------------------------

    toJSON() {

        return {

            id: this.id,
            uuid: this.uuid,
            name: this.name,
            protocol: this.protocol,
            ip: this.ip,
            host: this.host,
            port: this.port,
            uri: this.uri,
            manufacturer: this.manufacturer,
            model: this.model,
            serial: this.serial,
            location: this.location,
            status: this.status,
            online: this.online,
            busy: this.busy,
            color: this.color,
            duplex: this.duplex,
            resolutions: this.resolutions,
            media: this.media,
            languages: this.languages,
            toner: this.toner,
            paper: this.paper,
            discovery: this.discovery,
            jobsPrinted: this.jobsPrinted,
            pagesPrinted: this.pagesPrinted,
            errors: this.errors,
            lastSeen: this.lastSeen,
            lastUpdate: this.lastUpdate,
            discovered: this.discovered,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt

        };

    }

}

module.exports = Printer;