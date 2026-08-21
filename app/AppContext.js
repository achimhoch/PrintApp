"use strict";

class AppContext {

    constructor(application) {

        this.application =
            application;

        this.printServer =
            application.printServer;

        this.socket =
            application.socket;

        this.printManager =
            application.printManager;

        this.queueManager =
            application.queueManager;

        this.jobManager =
            application.jobManager;

    }

}

module.exports = AppContext;