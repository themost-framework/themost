import {DataQueryable} from "./data-queryable";
import {DataContext} from "./types";
import {DataModel} from "./data-model";

export declare class DataObject {
    context:DataContext;
    silent(value?:boolean):DataObject;
    selector(name:string, selector:Function):DataObject;
    is(selector:string):Promise<any>
    getType():string
    getId():any
    query(attr:string):DataQueryable;
    save(context?: DataContext, callback?:(err:Error) => void):Promise<any>|void;
    remove(context?: DataContext, callback?:(err:Error) => void):Promise<any>|void;
    getModel(): DataModel;
    getAdditionalModel():Promise<DataModel>;
    getAdditionalObject():Promise<DataObject|any>;
    attr(name: string, callback?:(err?: Error,res?: any) => void);
    property(name: string);
}