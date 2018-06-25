/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
import {HttpApplicationService} from "./types";

export declare abstract class LocalizationStrategy extends HttpApplicationService {
    abstract getCultures(): Array<string>;
    abstract getDefaultCulture(): string;
    hasCulture(culture: string): boolean;
    abstract getLocaleString(locale: string, str: string);
    abstract setLocaleString(locale: string, data: any, shouldMerge?: boolean);

}

export declare class DefaultLocalizationStrategy extends LocalizationStrategy {
    getCultures(): Array<string>;

    getDefaultCulture(): string;

    getLocaleString(locale: string, str: string);

    setLocaleString(locale: string, data: any, shouldMerge?: boolean);

}

export declare class I18nLocalizationStrategy extends DefaultLocalizationStrategy {
    resolveLocalePath(locale: string): string;
}