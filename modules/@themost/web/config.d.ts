import {ConfigurationBase} from "@themost/common/config";

export declare interface MimeTypeConfiguration {
    extension: string;
    type: string;
}

export declare interface HttpViewEngineConfiguration {
    name: string;
    type: string;
    extension: string;
}

export declare interface HttpRouteConfiguration {
    url: string;
    action?: string;
    controller?: string;
    format?: string;
    mime?: string;
    params?: any;
}

export declare interface HttpHandlerConfiguration {
    name: string;
    type: string;
}

export declare class HttpConfiguration extends ConfigurationBase {
    constructor(configPath: string);

    readonly engines:Array<HttpViewEngineConfiguration>;
    readonly routes:Array<HttpRouteConfiguration>;
    readonly mimes:Array<MimeTypeConfiguration>;
    readonly handlers:Array<HttpHandlerConfiguration>;
    readonly controllers:Array<any>;

    getMimeType(extension: string):MimeTypeConfiguration;


}