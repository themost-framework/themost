import {ConfigurationBase} from "./config";

export declare interface IApplication {
    /**
     * Registers an application strategy e.g. an singleton service which to be used in application contextr
     * @param {Function} serviceCtor
     * @param {Function} strategyCtor
     * @returns IApplication
     */
    useStrategy(serviceCtor: void, strategyCtor: void): IApplication;
    /**
     * @param {Function} serviceCtor
     * @returns {boolean}
     */
    hasStrategy(serviceCtor: void): boolean;
    /**
     * Gets an application strategy based on the given base service type
     * @param {Function} serviceCtor
     * @return {*}
     */
    getStrategy(serviceCtor: void): IApplicationService;

    /**
     * Gets the configuration of this application
     * @returns {ConfigurationBase}
     */
    getConfiguration():ConfigurationBase;
}

export declare interface IApplicationService {
    /**
     * Gets the application of this service
     * @returns {IApplication}
     */
    getApplication():IApplication;
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
    getApplication():IApplication;
    /**
     * Registers an application strategy e.g. an singleton service which to be used in application contextr
     * @param {Function} serviceCtor
     * @param {Function} strategyCtor
     * @returns IApplication
     */
    useStrategy(serviceCtor: void, strategyCtor: void): IApplication;
    /**
     * @param {Function} serviceCtor
     * @returns {boolean}
     */
    hasStrategy(serviceCtor: void): boolean;
    /**
     * Gets an application strategy based on the given base service type
     * @param {Function} serviceCtor
     * @return {*}
     */
    getStrategy(serviceCtor: void): IApplicationService;

    /**
     * Gets the configuration of this application
     * @returns {ConfigurationBase}
     */
    getConfiguration():ConfigurationBase;
}