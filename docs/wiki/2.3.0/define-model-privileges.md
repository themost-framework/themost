#### Data model privileges

Each data model may have a collection of privileges for defining access rights to users or groups.


    {
        "name": "User",
        ...
        "privileges": [
            {
                "mask": 1,
                "type": "self",
                "filter": "id eq me()"
            }
            ...
        ]
    }

A data model privilege has a mask which defines the access level given by this privelege. 
The available masks are:

| Mask | Name | Description |
|------|------|-------------|
|1 |Read   |Read Access    |
|2 |Create |Create Access  |
|4 |Update |Update Access  |
|8 |Delete |Delete Access  |
|16|Execute|Execute Access |


e.g. mask=7 gives read, create and update access, mask=15 gives full access etc

###### Global privileges

A global privilege is given in an account (user or commonly a group) e.g.

    {
        "mask": 15,
        "type": "global",
        "account": "Administrators"
    }

which gives full access to all items to Administrators.

A global privilege may have also a wildcard (*) account for allowing access to all users and groups e.g.

    {
        "mask": 1,
        "type": "global",
        "account": "*"
    }

###### Self privileges

A self privilege sets user rights according to a filter expression. 
This filter expression normally uses user data, in any form, to validate user access e.g.

    {
        "mask": 1,
        "type": "self",
        "filter": "createdBy eq me()"
    }

which gives read access to items that have been created by the interactive user.

or

    {
        "mask": 1,
        "type": "self",
        "filter": "customer/user eq me()"
    }

which gives read access to items where associated customer is the interactive user.

###### Item privileges

An item privilege definition activates row-level access rights for items that belong to a data model.
Mask attribute sets the level of access rights that may be given by an item privilege.

     {
         "mask": 1,
         "type": "item"
     }
     
MOST Web Framework uses data storage to read and save item permissions. 

e.g.

     {
         "privilege": "Offer",
         "account": {
             "name": "Guests"
         },
         "target": 1250,
         "mask": 1,
         "workspace": 1
     }

which gives read access for an offer (with id equal to 1250) to guests.

###### Parent privileges

A parent item privilege definition activates row-level access rights for items 
based on an association between an object and its children.

Mask attribute sets the level of access rights that may be given by a parent item privilege.

     {
         "mask": 1,
         "type": "parent",
         "property": "itemOffered"
     }
     
e.g.

    {
         "privilege": "Offer",
         "parentPrivilege": "Product",
         "account": {
             "name": "Guests"
         },
         "target": 34,
         "mask": 1,
         "workspace": 1
     }
     
which gives read access for offers of a specific product (with id equal to 34) to guests.
