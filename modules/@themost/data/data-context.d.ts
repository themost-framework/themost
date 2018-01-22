import {DataAdapter, DataContext} from "./types";

export declare class DefaultDataContext extends DataContext {
    new();
    getDb():DataAdapter;
    setDb(db:DataAdapter);
}

export declare class NamedDataContext extends DataContext {
    new(name:string);
    getDb():DataAdapter;
    setDb(db:DataAdapter);
}