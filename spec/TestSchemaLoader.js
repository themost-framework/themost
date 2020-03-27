import {FileSchemaLoaderStrategy} from '@themost/data';
import path from 'path';
class TestSchemaLoader extends FileSchemaLoaderStrategy {
    constructor(configuration) {
        super(configuration);
        // set explicitly model directory
        this.setModelPath(path.resolve(__dirname, 'models'));
    }
}

export {TestSchemaLoader};
