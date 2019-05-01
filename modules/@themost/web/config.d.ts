import {ConfigurationBase} from "@themost/common/config";

export declare class MimeTypeConfiguration {
    extension: string;
    type: string;
}

export declare class HttpViewEngineConfiguration {
    name: string;
    type: string;
    extension: string;
}

export declare class HttpRouteConfiguration {
    url: string;
    action?: string;
    controller?: string;
    format?: string;
    mime?: string;
    params?: any;
    path?: string;
    name?: string;
}

export declare class HttpHandlerConfiguration {
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
