import {DataAdapter, DataContext} from "./types";

export declare class DefaultDataContext extends DataContext {
    constructor();
    readonly name: string;
    getDb(): DataAdapter;
    setDb(db: DataAdapter);
}

export declare class NamedDataContext extends DataContext {
    constructor(name: string);
    readonly name: string;
    getName(): string
    getDb(): DataAdapter;
    setDb(db: DataAdapter);
}
