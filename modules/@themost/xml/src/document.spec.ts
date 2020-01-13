import {XDocument, XNode} from "./index";

const BREAKFAST_MENU_XML = `
<?xml version="1.0" encoding="UTF-8"?>
<breakfast_menu>
    <food>
        <name>Belgian Waffles</name>
        <price>$5.95</price>
        <description>
       Two of our famous Belgian Waffles with plenty of real maple syrup
       </description>
        <calories>650</calories>
    </food>
    <food>
        <name>Strawberry Belgian Waffles</name>
        <price>$7.95</price>
        <description>
        Light Belgian waffles covered with strawberries and whipped cream
        </description>
        <calories>900</calories>
    </food>
    <food>
        <name>Berry-Berry Belgian Waffles</name>
        <price>$8.95</price>
        <description>
        Belgian waffles covered with assorted fresh berries and whipped cream
        </description>
        <calories>900</calories>
    </food>
    <food>
        <name>French Toast</name>
        <price>$4.50</price>
        <description>
        Thick slices made from our homemade sourdough bread
        </description>
        <calories>600</calories>
    </food>
    <food>
        <name>Homestyle Breakfast</name>
        <price>$6.95</price>
        <description>
        Two eggs, bacon or sausage, toast, and our ever-popular hash browns
        </description>
        <calories>950</calories>
    </food>
</breakfast_menu>`;

describe('XDocument', () => {
    it('should create instance', () => {
        const doc = new XDocument();
        expect(doc).toBeTruthy();
    });
    it('should use XDocument.loadXML()', () => {
        const doc = XDocument.loadXML(`
<?xml version="1.0" encoding="UTF-8"?>
<note>
  <to>Tove</to>
  <from>Jani</from>
  <heading>Reminder</heading>
  <body>Don't forget me this weekend!</body>
</note>
        `);
        expect(doc).toBeTruthy();
        expect(doc.documentElement).toBeTruthy();
        expect(doc.documentElement.nodeName).toBe('note');
    });

    it('should use XDocument.loadSync() and throw error', () => {
        expect(() => {
            const doc = XDocument.loadSync('./bookstore.xml');
        }).toThrowError();
    });

    it('should use XDocument.selectSingleNode()', () => {
        const doc = XDocument.loadXML(BREAKFAST_MENU_XML);
        const singleNode = doc.documentElement.selectSingleNode(`food/name[.='French Toast']`);
        expect(singleNode).toBeTruthy();
    });

    it('should use XDocument.selectNodes()', () => {
        const doc = XDocument.loadXML(BREAKFAST_MENU_XML);
        const nodes = doc.documentElement.selectNodes(`food/name`);
        expect(nodes).toBeInstanceOf(Array);
        expect(nodes.length).toBeTruthy();
        nodes.forEach( node => {
           expect(node.nodeName).toBe('name');
        });
    });

    it('should use XDocument.createElement()', () => {
        const doc = XDocument.loadXML(BREAKFAST_MENU_XML);
        const newNode = doc.createElement('food');
        expect(newNode).toBeInstanceOf(XNode);
        expect(newNode.nodeName).toBe('food');
    });

    it('should use XDocument.importNode()', () => {
        const doc = XDocument.loadXML(BREAKFAST_MENU_XML);
        const otherDoc = XDocument.loadXML(`
<breakfast_menu>
    <food>
        <name>Italian Pizza</name>
        <price>$7.95</price>
        <description>
       Italian Pizza with chicken
       </description>
        <calories>800</calories>
    </food>
</breakfast_menu>      
        `);
        const importedNode = doc.importNode(otherDoc.documentElement.selectSingleNode(`food`));
        expect(importedNode).toBeInstanceOf(XNode);
        expect(importedNode.nodeName).toBe('food');
        doc.documentElement.appendChild(importedNode);
        const newNode = doc.documentElement.selectSingleNode(`food/name[.='Italian Pizza']`);
        expect(newNode).toBeInstanceOf(XNode);
        expect(newNode.nodeName).toBe('name');
    });

});

describe('XNode', () => {
    it('should use XNode.setAttribute', () => {
        const doc = XDocument.loadXML(BREAKFAST_MENU_XML);
        doc.documentElement.setAttribute('status', 'final');
        const attribute = doc.documentElement.getAttribute('status');
        expect(attribute).toBeTruthy();
        expect(attribute).toBe('final');
    });
    it('should use XNode.removeAttribute', () => {
        const doc = XDocument.loadXML(BREAKFAST_MENU_XML);
        doc.documentElement.setAttribute('status', 'final');
        doc.documentElement.removeAttribute('status');
        const attribute = doc.documentElement.getAttribute('status');
        expect(attribute).toBeFalsy();
    });
});
