import {getApplication} from '@themost/test';
import {AttachmentFileSystemStorage} from '@themost/web';
import url from 'url';
import path from 'path';
import util from 'util';
import {executeInTransactionAsync} from '../utils';

export class PrivateContentService extends AttachmentFileSystemStorage {
    /**
     * @param {IApplication} app
     */
    constructor(app) {
        // get physical path from application configuration or use content/private as default path
        super(path.resolve(process.cwd(), 'spec/content/private'));
        // set virtual path
        this.virtualPath = '/api/content/private/';
    }
}

describe('AttachmentFileSystemStorage', ()=> {
    let app;
    let container;
    beforeAll(() => {
        container = getApplication();
        app = container.get('ExpressDataApplication');
        app.useService(PrivateContentService);
    });
    it('should validate item.url', async ()=> {
        let virtualPath = '/api/content/private';
        virtualPath += /\/$/.test(virtualPath) ? '' : '/';
        const itemURL = url.resolve(virtualPath, './WqLwnnFEwt');
        expect(itemURL).toBe('/api/content/private/WqLwnnFEwt');
    });

    it('should use AttachmentFileSystemStorage.resolveUrl()', async ()=> {
        const context = app.createContext();
        await executeInTransactionAsync(context, async() => {
            /**
             * @type {*|PrivateContentService}
             */
            const contentService = app.getService(PrivateContentService);
            const resolveUrlAsync = util.promisify(contentService.resolveUrl).bind(contentService);
            let itemURL = await resolveUrlAsync(context, {
                alternateName: 'WqLwnnFEwt'
            });
            expect(itemURL).toBe('/api/content/private/WqLwnnFEwt');
            contentService.virtualPath = '/api/content/private';
            itemURL = await resolveUrlAsync(context, {
                alternateName: 'WqLwnnFEwt'
            });
            expect(itemURL).toBe('/api/content/private/WqLwnnFEwt');

            spyOn(contentService, 'findOne').and.callFake(function() {
                const callback = arguments[2];
                return callback(null, {
                    'id': 3,
                    'additionalType': null,
                    'filename': 'LoremIpsum.pdf',
                    'contentType': 'application/pdf',
                    'description': null,
                    'alternateName': 'UcXJewUXYrL4',
                    'url': '/api/content/public/UcXJewUXYrL4',
                    'dateCreated': '2020-03-02 15:00:36+03:00',
                    'dateModified': '2020-03-02 15:00:36+03:00',
                    'createdBy': 28,
                    'modifiedBy': 28,
                    'datePublished': null,
                    'published': 0,
                    'keywords': null,
                    'thumbnailUrl': null,
                    'parentUrl': null,
                    'version': '1'
                });
            });
            itemURL = await resolveUrlAsync(context, {
                id: 3
            });
            expect(itemURL).toBe('/api/content/private/UcXJewUXYrL4');
            contentService.virtualPath = '/api/content/private/';
        });
    });

    it('should use AttachmentFileSystemStorage.save()', async ()=> {
        const context = app.createContext();
        await executeInTransactionAsync(context, async() => {
            /**
             * @type {*|PrivateContentService}
             */
            const contentService = app.getService(PrivateContentService);
            spyOn(context, 'model').and.returnValue({
                name: 'Attachments',
                inherits: 'Thing',
                version: '1.0',
                save: function(item, callback) {
                    item.id = 3;
                    return callback();
                }
            });
            const saveAsync = util.promisify(contentService.save).bind(contentService);
            const item = {
                'additionalType': null,
                'filename': 'LoremIpsum.pdf',
                'contentType': 'application/pdf',
                'description': null,
                'datePublished': null,
                'published': false,
                'keywords': null,
                'thumbnailUrl': null,
                'parentUrl': null
            };
            await saveAsync(context, item);
            expect(item.url).toBe(url.resolve(contentService.virtualPath, item.alternateName));
        });
    });

});