import Account from './account-model';
import User from './user-model';

/**
 * @class
 */
declare class Group extends Account {

     
     /**
      * @description The identifier of the item.
      */
     id: number; 
     
     /**
      * @description Contains the collection of group members (users or groups).
      */
     members?: Array<User|any>; 
     
     /**
      * @description Contains a collection of tags for this object.
      */
     tags?: Array<string>; 

}

export default Group;