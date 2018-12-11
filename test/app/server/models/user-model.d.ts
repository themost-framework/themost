import Account from './account-model';
import Group from './group-model';

/**
 * @class
 */
declare class User extends Account {

     
     /**
      * @description The identifier of the item.
      */
     id: number; 
     
     /**
      * @description The date and time that this account was locked out.
      */
     lockoutTime?: Date; 
     
     /**
      * @description The number of times the account has successfully logged on.
      */
     logonCount?: number; 
     
     /**
      * @description Indicates whether a user is enabled or not.
      */
     enabled: boolean; 
     
     /**
      * @description The last time and date the user logged on.
      */
     lastLogon?: Date; 
     
     /**
      * @description A collection of groups where user belongs.
      */
     groups?: Array<Group|any>; 

}

export default User;