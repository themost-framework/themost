import {ConfigurationBase} from "./config";

export declare abstract class IApplication {
    /**
     * Registers an application strategy e.g. an singleton service which to be used in application context
     * @param {Function} serviceCtor
     * @param {Function} strategyCtor
     * @returns IApplication
     */
    abstract useStrategy(serviceCtor: void, strategyCtor: void): this;
    /**
     * @param {Function} serviceCtor
     * @returns {boolean}
     */
    abstract hasStrategy(serviceCtor: void): boolean;

    /**
     * @param serviceCtor
     */
    abstract getStrategy<T>(serviceCtor: new() => T): T;

    /**
     * Gets the configuration of this application
     * @returns {ConfigurationBase}
     */
    abstract getConfiguration(): ConfigurationBase;
}

export declare abstract class IApplicationService {
    /**
     * Gets the application of this service
     * @returns {IApplication}
     */
    abstract getApplication(): IApplication;
}

export declare class ApplicationService implements IApplicationService {
    /**
     * @constructor
     * @param {IApplication=} app
     */
    constructor(app: IApplication);
    /**
     * Gets the application of this service
     * @returns {IApplication}
     */
    getApplication(): IApplication;
}
