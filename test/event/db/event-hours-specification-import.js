/* eslint-disable no-console */
import {HttpApplication} from '@themost/web/app';
import {TextUtils} from "@themost/common";
import path from 'path';
let app = new HttpApplication(path.resolve(__dirname, "../server"));
import data from './EventHoursSpecification';

app.execute((context)=> {
    //

    data.forEach((x)=> {
        x.validFrom = new Date(x.validFrom);
        x.validThrough = new Date(x.validThrough);
    });

    context.model('EventHoursSpecification').silent().save(data).then(()=> {
        context.finalize(()=> {
            return process.exit(0);
        });
    }).catch((err)=> {
        context.finalize(()=> {
            console.log('ERROR', err);
            return process.exit(1);
        });
    });
});