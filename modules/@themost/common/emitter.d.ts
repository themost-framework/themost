/// <reference types="node" />
import { EventEmitter } from "events";
/**
 * @class
 * @extends EventEmitter
 */
export declare class SequentialEventEmitter extends EventEmitter {
    /**
     * @constructor
     */
    constructor();
    /**
     * Emits an event by specifying additional arguments where the last argument is a callback function
     * @param {string | symbol} event
     * @param args
     * @returns {any}
     */
    emit(event: string | symbol, ...args: any[]): any;
    addListener(event: string | symbol, listener: (...args: any[]) => void): this;
    on(event: string | symbol, listener: (...args: any[]) => void): this;
    prependListener(event: string | symbol, listener: (...args: any[]) => void): this;
    prependOnceListener(event: string | symbol, listener: (...args: any[]) => void): this;
    removeListener(event: string | symbol, listener: (...args: any[]) => void): this;
    removeAllListeners(event?: string | symbol): this;
    setMaxListeners(n: number): this;
    getMaxListeners(): number;
    listenerCount(type: string | symbol): number;
    once(event: string | symbol, listener: (...args: any[]) => void): this;
}
