/**
 *
 */
export declare class HtmlWriter {
    /**
     * @private
     * @type {Array}
     */
    public bufferedAttributes: any[];

    /**
     * @private
     * @type {Array}
     */
    public bufferedTags: string[];

    /**
     * and clear buffer
     */
    public buffer: string;
    /**
     * Writes an attribute to an array of attributes that is going to be used in writeBeginTag function
     * @param {String} name - The name of the HTML attribute
     * @param {String} value - The value of the HTML attribute
     * @returns {HtmlWriter}
     * @param name
     * @param value
     * @return
     */
    public writeAttribute(name: string, value: string): /* HtmlWriter.prototype.+HtmlWriter */ any;

    /**
     * Writes an array of attributes to the output buffer. This attributes are going to be rendered after writeBeginTag or WriteFullBeginTag function call.
     * @param {Array|Object} obj - An array of attributes or an object that represents an array of attributes
     * @returns {HtmlWriter}
     * @param obj
     * @return
     */
    public writeAttributes(obj: any[] | {}): /* !this */ any;

    /**
     * @param {String} tag
     * @returns {HtmlWriter}
     * @param tag
     * @return
     */
    public writeBeginTag(tag: string): /* !this */ any;

    /**
     * Writes a full begin HTML tag (e.g <div/>).
     * @param {String} tag
     * @returns {HtmlWriter}
     * @param tag
     * @return
     */
    public writeFullBeginTag(tag: string): /* !this */ any;

    /**
     * Writes an end HTML tag (e.g </div>) based on the current buffered tags.
     * @returns {HtmlWriter}
     * @return
     */
    public writeEndTag(): /* !this */ any;

    /**
     * @param {String} s
     * @returns {HtmlWriter}
     * @param s
     * @return
     */
    public writeText(s: string): /* !this */ any;

    /**
     * @param {String} s
     * @returns {HtmlWriter}
     * @param s
     * @return
     */
    public write(s: string): /* !this */ any;

    /**
     * @param {function} fn
     * @param fn
     */
    public writeTo(fn: any): void;

}
