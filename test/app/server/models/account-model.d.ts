import Thing from './thing-model';

/**
 * @class
 */
declare class Account extends Thing {

     
     /**
      * @description The identifier of the item.
      */
     id: number; 
     
     /**
      * @description Contains a set of flags that define the type and scope of an account object.
      */
     accountType?: number; 

}

export default Account;