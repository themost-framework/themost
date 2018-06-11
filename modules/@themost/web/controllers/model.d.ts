
export = HttpDataModelController;

declare class HttpDataModelController {
    /**
     *
     * @returns {Promise<any>}
     */
    public getItems():Promise<any>;

    /**
     *
     * @returns {Promise<any>}
     */
    public postItems():Promise<any>;

    /**
     *
     * @returns {Promise<any>}
     */
    public putItems():Promise<any>;

    /**
     *
     * @returns {Promise<any>}
     */
    public deleteItems():Promise<any>;
}