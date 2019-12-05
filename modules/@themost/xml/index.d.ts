/**
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */

export declare class XNamespace {
    constructor(prefix: string, uri: string);
    prefix: string;
    uri: string;
}

export declare class XNodeType {
    static DOM_ELEMENT_NODE: number;
    static DOM_ATTRIBUTE_NODE: number;
    static DOM_TEXT_NODE: number;
    static DOM_CDATA_SECTION_NODE: number;
    static DOM_ENTITY_REFERENCE_NODE: number;
    static DOM_ENTITY_NODE: number;
    static DOM_PROCESSING_INSTRUCTION_NODE: number;
    static DOM_COMMENT_NODE: number;
    static DOM_DOCUMENT_NODE: number;
    static DOM_DOCUMENT_TYPE_NODE: number;
    static DOM_DOCUMENT_FRAGMENT_NODE: number;
    static DOM_NOTATION_NODE: number;
}

export declare interface XSerializerOptions {
    root: string;
}

export declare class XSerializer {
    static serialize(obj: any, options?: XSerializerOptions): XNode;
    static deserialize(obj: XNode, ctor?: Function): any;
}

export declare class XNode {
    constructor(type: string, name: string, opt_value?: any, opt_owner?: any);
    appendChild(node: XNode);
    replaceChild(newNode: XNode, oldNode: XNode);
    insertBefore(newNode: XNode, oldNode: XNode);
    prependChild(newNode: XNode);
    removeChild(node: XNode);
    hasAttributes(): boolean;
    hasAttribute(name: string): boolean;
    setAttribute(name: string, value: any);
    getAttribute(name: string): string;
    removeAttribute(name: string);
    getElementsByTagName(name: string):Array<XNode>;
    getElementById(id: string): XNode;
    value(): any;
    hasChildNodes(): boolean;
    innerText(s: string);
    innerXML(xml: string);
    outerXML(): string;
    selectNodes(expr: string, ns?:Array<XNamespace>):Array<XNode>;
    selectSingleNode(expr: string, ns?:Array<XNamespace>):XNode;
    removeAll();
    name(): string;
    lookupPrefix(namespaceURI: string): string;

}

export declare class XDocument {
    constructor();
    static loadXML(xml: string): XDocument;
    static loadSync(file: string): XDocument;
    static load(file: string, callback: (err?: Error, res?: XDocument) => void): void;
    documentElement: XNode;
    clear(): void;
    appendChild(node: any): void;
    createElement(name: string): XNode;
    createDocumentFragment(): XNode;
    createTextNode(value: any): XNode;
    createAttribute(name: string): XNode;
    createComment(data: string): XNode;
    createCDATASection(data: string): XNode;
    importNode(node: XNode): XNode;

}
