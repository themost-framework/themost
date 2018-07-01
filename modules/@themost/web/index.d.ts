/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
import * as HttpBaseController from "./controllers/base";

export * from './mvc';
export * from './app';
export * from './types';
export * from './config';
export * from './context';
export {default as HttpBaseController} from './controllers/base';
export {default as HttpDataController} from './controllers/data';
export {default as HttpDataModelController} from './controllers/model';
export {default as HttpLookupController} from './controllers/lookup';
export {default as HttpHiddenController} from './controllers/hidden';
export {default as HttpServiceController} from './controllers/service';

export {AuthHandler, AuthStrategy, DefaultAuthStrategy,
    EncryptionStrategy, DefaultEncryptionStrategy} from './handlers/auth';
export {BasicAuthHandler} from './handlers/basic-auth';
export {CorsHandler} from './handlers/cors';
export {DirectiveEngine} from './handlers/directive';
export {JsonHandler} from './handlers/json';
export {MultipartHandler} from './handlers/multipart';
export {NodeModulesHandler} from './handlers/node-modules';
export {NoopHandler} from './handlers/noop';
export {PostHandler} from './handlers/post';
export {QuerystringHandler} from './handlers/querystring';
export {RestrictAccess} from './handlers/restrict-access';
export {RouteParams} from './handlers/route-params';
export {StaticHandler} from './handlers/static';
export {ViewHandler} from './handlers/view';
export {XmlHandler} from './handlers/xml';
export {HttpConsumer} from './consumers';
export {LocalizationStrategy, DefaultLocalizationStrategy, I18nLocalizationStrategy} from './localization'
export {HttpRoute} from './http-route';
export {HtmlViewHelper}  from './helpers';
export {FileStorage, AttachmentFileSystemStorage} from './files';
export {CacheStrategy, DefaultCacheStrategy} from './cache';

export {EjsEngine} from './engines/ejs';
export {NgEngine} from './engines/ng';
export {MarkdownEngine} from './engines/md';
export {VashEngine} from './engines/vash';
export {JadeEngine} from './engines/jade';

export {AngularServerModule} from './angular/module';

export {ODataModelBuilderConfiguration, ODataJsonResult} from './odata';

export {ServicesConfiguration, ServiceConfigurationElement} from './services-configuration';

export function runtime(): void;

