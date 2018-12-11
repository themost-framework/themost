
import {DataObject} from '@themost/data/data-object';
/**
 * @class
 */
declare class Thing extends DataObject {

     
     /**
      * @description URL of a reference Web page that unambiguously indicates the item's identity. E.g. the URL of the item's Wikipedia page, Wikidata entry, or official website.
      */
     sameAs?: string; 
     
     /**
      * @description URL of the item.
      */
     url?: string; 
     
     /**
      * @description An image of the item. This can be a <a class="localLink" href="http://schema.org/URL">URL</a> or a fully described <a class="localLink" href="http://schema.org/ImageObject">ImageObject</a>.
      */
     image?: string; 
     
     /**
      * @description An additional type for the item, typically used for adding more specific types from external vocabularies in microdata syntax. This is a relationship between something and a class that the thing is in. In RDFa syntax, it is better to use the native RDFa syntax - the 'typeof' attribute - for multiple types. Schema.org tools may have only weaker understanding of extra types, in particular those defined externally.
      */
     additionalType?: string; 
     
     /**
      * @description The name of the item.
      */
     name?: string; 
     
     /**
      * @description The identifier property represents any kind of identifier for any kind of <a class="localLink" href="http://schema.org/Thing">Thing</a>, such as ISBNs, GTIN codes, UUIDs etc. Schema.org provides dedicated properties for representing many of these, either as textual strings or as URL (URI) links. See <a href="/docs/datamodel.html#identifierBg">background notes</a> for more details.
      */
     identifier?: string; 
     
     /**
      * @description A description of the item.
      */
     description?: string; 
     
     /**
      * @description An alias for the item.
      */
     alternateName?: string; 
     
     /**
      * @description The identifier of the item.
      */
     id?: number; 
     
     /**
      * @description The date on which this item was created.
      */
     dateCreated?: Date; 
     
     /**
      * @description The date on which this item was most recently modified.
      */
     dateModified?: Date; 
     
     /**
      * @description Created by user.
      */
     createdBy?: number; 
     
     /**
      * @description Last modified by user.
      */
     modifiedBy?: number; 
     
     /**
      * @description A workspace associated with this item.
      */
     workspace?: number; 

}

export default Thing;