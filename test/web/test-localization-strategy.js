const path = require('path');
const assert = require('chai').assert;
const HttpApplication = require('../../modules/@themost/web').HttpApplication;
const LocalizationStrategy = require('../../modules/@themost/web').LocalizationStrategy;
const DefaultLocalizationStrategy = require('../../modules/@themost/web').DefaultLocalizationStrategy;
const I18nLocalizationStrategy = require('../../modules/@themost/web').I18nLocalizationStrategy;

describe('Localization Strategy Test', () => {

    /**
     * @type {HttpContext}
     */
    let context;
    const app = new HttpApplication(path.resolve(process.cwd(),'test/app/server'));

    before((done)=> {
        app.execute( ctx => {
            context = ctx;
            return done();
        });
    });

    after((done) => {
        if (context == null) {
            return done();
        }
        context.finalize(()=> {
            return done();
        });
    });

    it('should use DefaultLocalizationStrategy class', (done) => {
       assert.isOk(app.getLocalizationStrategy() instanceof DefaultLocalizationStrategy);
       return done();
    });

    it('should validate cultures collection', (done) => {
        const cultures = app.getLocalizationStrategy().getCultures();
        assert.isArray(cultures);
        assert.equal(cultures[1], 'el');
        return done();
    });

    it('should validate default culture', (done) => {
        const defaultCulture = app.getLocalizationStrategy().getDefaultCulture();
        assert.isString(defaultCulture);
        assert.equal(defaultCulture, 'en');
        return done();
    });

    it('should translate string', (done) => {
        assert.equal(app.getLocalizationStrategy().getLocaleString('en', 'HelloWorld'), 'Hello World!');
        return done();
    });

    it('should use default culture for translation', (done) => {
        assert.equal(app.getLocalizationStrategy().getLocaleString('nl', 'HelloWorld'), 'HelloWorld');
        return done();
    });

    it('should fail to translate string', (done) => {
        assert.equal(app.getLocalizationStrategy().getLocaleString('en', 'MissingKey'), 'MissingKey');
        return done();
    });

    it('should translate formatted string', (done) => {
        assert.equal(app.getLocalizationStrategy().getLocaleString('en', 'HelloString', 'Peter'), 'Hello Peter!');
        return done();
    });

    it('should translate formatted string in french', (done) => {
        assert.equal(app.getLocalizationStrategy().getLocaleString('fr', 'HelloString', 'Chloé'), 'Bonjour Chloé!');
        return done();
    });

    it('should translate formatted string with params in english', (done) => {
        assert.equal(app.getLocalizationStrategy().getLocaleString('en', 'OutOfRangerMessage', 10, 50),
            'Out of range. Value should be between 10 to 50.');
        return done();
    });

    it('should set locale string', (done) => {
        assert.equal(app.getLocalizationStrategy().getLocaleString('en', 'NewMessage'),
            'NewMessage');
        app.getLocalizationStrategy().setLocaleString('en', {
            "NewMessage": "You have new messages."
        });
        assert.equal(app.getLocalizationStrategy().getLocaleString('en', 'NewMessage'),
            'You have new messages.');
        return done();
    });

    it('should translate string with context.translate()', (done) => {
        assert.equal(context.translate('HelloWorld'), 'Hello World!');
        return done();
    });

    it('should translate formatted string with context.translate()', (done) => {
        assert.equal(context.translate('OutOfRangerMessage', 10, 50), 'Out of range. Value should be between 10 to 50.');
        return done();
    });

    it('should set context language', (done) => {
        context.culture('el');
        assert.equal(context.translate('HelloWorld'), 'Γειά σου κόσμε!');
        return done();
    });

    it('should set I18nLocalizationStrategy', (done) => {
        context.culture('el');
        app.useStrategy(LocalizationStrategy, I18nLocalizationStrategy);
        assert.isOk(app.getLocalizationStrategy() instanceof I18nLocalizationStrategy);
        assert.equal(context.translate('HelloWorld'), 'Γειά σου κόσμε!');
        return done();
    });

    it('should set i18n locale string', (done) => {
        assert.equal(app.getLocalizationStrategy().getLocaleString('en', 'NewMessage'),
            'NewMessage');
        app.getLocalizationStrategy().setLocaleString('en', {
            "NewMessage": "You have new messages."
        });
        assert.equal(app.getLocalizationStrategy().getLocaleString('en', 'NewMessage'),
            'You have new messages.');
        return done();
    });

});


