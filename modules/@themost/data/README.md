[![npm](https://img.shields.io/npm/v/@themost%2Fdata.svg)](https://www.npmjs.com/package/@themost%2Fdata)
![](https://img.shields.io/david/themost-framework/themost?path=modules%2F%40themost%2Fdata) ![](https://img.shields.io/david/peer/themost-framework/themost?path=modules%2F%40themost%2Fdata)
![](https://img.shields.io/david/dev/themost-framework/themost?path=modules%2F%40themost%2Fdata)
![GitHub top language](https://img.shields.io/github/languages/top/themost-framework/themost)
[![License](https://img.shields.io/npm/l/@themost/query)](https://github.com/themost-framework/themost/blob/master/LICENSE)
![GitHub last commit](https://img.shields.io/github/last-commit/themost-framework/themost)
![GitHub Release Date](https://img.shields.io/github/release-date/themost-framework/themost)
[![npm](https://img.shields.io/npm/dw/@themost/data)](https://www.npmjs.com/package/@themost%2Fdata)

# @themost/data
MOST Web Framework 2.0 Codename Blueshift Data Module

License: [BSD-3-Clause](https://github.com/themost-framework/themost/blob/master/LICENSE)

## Install 

    npm i @themost/data

## Features
### JSON schemas
Each data model is represented by a JSON schema which contains the complete model definition including fields, constraints,
triggers, associations, privileges, data views etc:

    {
    	"name": "User", "id": 90, "title": "Users", "inherits": "Account", "hidden": false, "sealed": false, "abstract": false, "version": "1.4",
    	"fields": [
    		{
    			"name": "id", "title": "Id", "description": "The identifier of the item.",
    			"type": "Integer",
    			"nullable": false,
    			"primary": true
    		},
            {
                "name": "accountType",  "title": "Account Type", "description": "Contains a set of flags that define the type and scope of an account object.",
                "type": "Integer",
                "readonly":true,
                "value":"javascript:return 0;"
            },
    		{
    			"name": "lockoutTime", "title": "Lockout Time", "description": "The date and time that this account was locked out.",
    			"type": "DateTime",
    			"readonly": true
    		},
    		{
    			"name": "logonCount", "title": "Logon Count", "description": "The number of times the account has successfully logged on.",
    			"type": "Integer",
    			"value": "javascript:return 0;",
    			"readonly": true
    		},
    		{
    			"name": "enabled", "title": "Enabled", "description": "Indicates whether a user is enabled or not.",
    			"type": "Boolean",
    			"nullable": false,
    			"value": "javascript:return true;"
    		},
    		{
    			"name": "lastLogon", "title": "Last Logon", "description": "The last time and date the user logged on.",
    			"type": "DateTime",
    			"readonly": true
    		},
    		{
    			"name": "groups", "title": "User Groups", "description": "A collection of groups where user belongs.",
    			"type": "Group",
    			"expandable": true,
    			"mapping": {
    				"associationAdapter": "GroupMembers", 
            "parentModel": "Group",
    				"parentField": "id", 
            "childModel": "User", 
            "childField": "id",
    				"associationType": "junction", 
            "cascade": "delete"
    			}
    		},
    		{
    			"name": "additionalType",
                "value":"javascript:return this.model.name;",
                "readonly":true
    		},
    		{
    			"name": "accountType",
    			"value": "javascript:return 0;"
    		}
    	], 
      "privileges":
      [
            { "mask":1, 
              "type":"self", 
              "filter":"id eq me()" 
            },
            { "mask":15, 
              "type":"global", 
            }
        ],
        "constraints":[
            {
                "type":"unique",
                "fields": [ "name" ]
            }
        ],
    	  "eventListeners": [
    		{ "name":"New User Credentials Provider", "type":"/app/controllers/user-credentials-listener" }
        ],
        "seed":[
            {
                "name":"anonymous",
                "description":"Anonymous User",
                "groups":[
                    { "name":"Guests" }
                ]
            },
    		{
    			"name":"admin@example.com",
    			"description":"Site Administrator",
    			"groups":[
    				{ "name":"Administrators" }
    			]
    		}
        ]
    }
## Automatic migration
Each data model will be automatically migrated after its first use.
DataModel.version property enables data model versioning:

    {
        "name": "User", "id": 90, "title": "Users", "inherits": "Account", "hidden": false,
        "sealed": false, "abstract": false, "version": "1.4",
        "fields": [ .. ]
        ...
    }

## Data model inheritance
MOST data models support model inheritance. DataModel.inherits property defines the inherited model of data model.

    //User model inherits Account model
    {
        "name": "User", "id": 90, "title": "Users", "inherits": "Account", "hidden": false,
        "sealed": false, "abstract": false, "version": "1.4",
        "fields": [ .. ]
        ...
    }

## Constraint validations
Each data model may have one or more constraints for validating data object state:

    //User model has a unique constraint based on user name.
    ...
    "constraints":[
        {
            "description": "User name must be unique across different records.",
            "type":"unique",
            "fields": [ "name" ]
        }
    ]
    ...

## Validation
Data field definition allows developers to specify validation rules (nullable, readonly etc):

    ...
    {
        "name": "enabled", "title": "Enabled", "description": "Indicates whether a user is enabled or not.",
        "type": "Boolean",
        "nullable": false,
        "value": "javascript:return true;"
    },
    {
        "name": "dateCreated",
        "title": "Date Created",
        "description": "The date on which this item was created.",
        "type": "Date",
        "value":"javascript:return (new Date());",
        "readonly":true
    }
    ...

## Calculated values
Data field definition allows developers to specify default and calculated values:

    ...
    {
        "name": "dateModified",
        "title": "Date Modified",
        "description": "The date on which this item was most recently modified.",
        "type": "Date",
        "readonly":true,
        "value":"javascript:return (new Date());",
        "calculation":"javascript:return (new Date());"
    }
    ...

## One-to-many associations
Each data model may have one-to-many associations with other models.

    {
        "name": "Order", "id": 449, "title": "Order", "hidden": false, ...
        "fields": [
            ...
            {
                "name": "customer",
                "title": "Customer",
                "description": "Party placing the order.",
                "type": "Party",
                "expandable":true
            }
            ...
        ]
    }

## Many-to-many associations
A data model may have many-to-many assocations with other models.

    ...
    {
        "name": "groups", "title": "User Groups", "description": "A collection of groups where user belongs.",
        "type": "Group",
        "expandable": true,
        "mapping": {
            "associationAdapter": "GroupMembers", "parentModel": "Group",
            "parentField": "id", "childModel": "User", "childField": "id",
            "associationType": "junction", "cascade": "delete"
        }
    }
    ...

## Filtering
Use advanced data object filtering:

        //get customers orders with status delivered
        context.model('Order').where('orderStatus/alternateName').equal('OrderedDelivered')
        .and("customer").equal(257)
         .list().then(function(result) {
                done(null, result);
            }).catch(function(err) {
                done(err);
            });

DataQueryable class offers a wide set of methods for filtering, paging, ordering and grouping data objects.

## Ordering
Use data object ordering:

    //get orders order by order date
    context.model('Order').where('orderStatus/alternateName').equal('OrderProcessing')
    .orderBy('orderDate').thenBy('paymentMethod/name')
     .list().then(function(result) {
            done(null, result);
        }).catch(function(err) {
            done(err);
        });

## Paging
Use paging parameters for retrieved a paged resultset.

    //skip 15 orders and take next 15
    context.model('Order').where('orderStatus/alternateName').equal('OrderProcessing')
    .take(15).skip(15)
     .list().then(function(result) {
            done(null, result);
        }).catch(function(err) {
            done(err);
        });

The result of a paged query is an instance of [DataResultSet](https://docs.themost.io/most-data/DataResultSet.html) class.

## Data query field selection
[DataQueryable](https://docs.themost.io/most-data/DataQueryable.html) class allows developers to define
a collection of selected fields which are going to be included in the result. This collection may contain
fields which belong to the current model and others which belong to models associated with the current.

    context.model('Order').where('orderStatus/alternateName').equal('OrderProcessing')
    .select('id','orderDate','orderedItem/name as productName', 'customer/description as customerName')
    .take(15)
     .list().then(function(result) {
            done(null, result);
        }).catch(function(err) {
            done(err);
        });

## Grouping
Use data object grouping and produce on-the-fly statistical results based on the given parameters:

    //count orders by order status
    context.model('Order')
    .select('count(id) as orderCount','orderStatus/name as orderStatusName')
    .groupBy('orderStatus/name')
    .where('orderDate').getMonth().equal(10).and('orderDate').getFullYear().equal(2015)
     .all().then(function(result) {
            done(null, result);
        }).catch(function(err) {
            done(err);
        });

## Event listeners
Data model definition may contain a collection of event listeners which represents a set of procedures that
are going to be executed before and after inserting, updating or deleting a data object.

    //Order.json schema
    ...
    "eventListeners": [
        { "name":"New Order Notification", "type":"/app/controllers/new-order-listener" }
    ]
    ...

    //new-order-listener.js listener
    ...
    exports.afterSave = function(event, callback) {
        if (event.state!=1) { return callback(); }
        //use most web mailer module
        var mm = require("most-web-mailer");
         mm.mailer(context).subject("New Order Notification")
         .subject("New Order")
         .template("new-order-notification")
         .to("employee1@example.com")
         .test()
         .send(event.target, function(err, res) {
            if (err) { return done(err); }
            return done();
        });
    }

## Privileges
Data model definition may contain a collection of privileges which should be given in users or groups.
User access rights will be validated during read, insert, update or delete data operations.

    ...
    "privileges":[
        { "mask":1, "type":"self", "filter":"id eq me()" },
        { "mask":15, "type":"global", "account":"*" }
    ]
    ...

## Caching
The @themost/data module allows developers to use data caching mechanisms while getting data.
DataModel.caching property indicates whether data will be cached or not.

    {
        "name": "OrderStatus", "id": 9507079, "title": "Order Status", "hidden": false, "sealed": false,
        "abstract": false, "version": "1.1", "caching":"always"
    }


## Seeding
Data model definition may contain a seed property which is a collection of data items to be inserted
 when model will be migrated for the first time.

    {
        "name": "OrderStatus", "id": 9507079, "title": "Order Status", "hidden": false,
        "sealed": false, "abstract": false, "version": "1.1",
        ...
        "fields": [
        ...
        ],
        ..
        "seed": [
            {  "id":1, "name":"Delivered", "alternateName":"OrderDelivered", "description":"Representing the successful delivery of an order."
            }, {
                "id":2, "name":"Cancelled", "alternateName":"OrderCancelled", "description":"Representing the cancellation of an order."
            }, {
                "id":3, "name":"In Transit", "alternateName":"OrderInTransit", "description":"Representing that an order is in transit."
            }, {
                "id":4, "name":"Payment Due", "alternateName":"OrderPaymentDue", "description":"Representing that payment is due on an order."
            }, {
                "id":5, "name":"Pickup", "alternateName":"OrderPickup", "description":"Representing availability of an order for pickup."
            }, {
                "id":6, "name":"Processing", "alternateName":"OrderProcessing", "description":"Representing that an order is being processed."
            }, {
                "id":7, "name":"Problem", "alternateName":"OrderProblem", "description":"Representing that there is a problem with the order."
            }, {
                "id":8, "name":"Returned", "alternateName":"OrderReturned", "description":"Representing that an order has been returned."
            }
        ]
    }


## Data Adapters

There are different data connectors for the most popular database engines. 

* SQLite
* MySQL
* MSSQL
* Oracle
* PostgreSQL
* H2

See further instructions [here](https://github.com/themost-framework/themost-adapters/) for using one of the available data adapters according to your development or production environment.
