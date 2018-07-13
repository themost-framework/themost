/* eslint-disable no-console */
import {HttpApplication} from '@themost/web/app';
import {TextUtils} from "@themost/common";
import path from 'path';
let app = new HttpApplication(path.resolve(__dirname, "../server"));
import countries from './Country';

let data = countries.map(function(x) {
    return {
        name: x.name.common,
        official: x.name.official,
        cca2: x.cca2,
        cioc: x.cioc,
        cca3: x.cca3,
        currency: x.currency[0]
    }
});

app.execute((context)=> {
    //
    context.model('Country').silent().save(data).then(()=> {
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