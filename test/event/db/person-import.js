/* eslint-disable no-console */
import {HttpApplication} from '@themost/web/app';
import {TextUtils} from "@themost/common";
import path from 'path';
let app = new HttpApplication(path.resolve(__dirname, "../server"));
import people from './Person';
app.execute((context)=> {
    //
    people.forEach((x)=> {
       x.birthDate = new Date(x.birthDate) ;
    });
    context.model('Person').on('before.save', (event, callback)=> {
        //add user
        let newUser = {
            name: event.target.email,
            description:event.target.description,
            groups: [
                {
                    name:'Users'
                }
            ]
        };
        context.model('User').on('after.save', (event,callback)=> {
            if (event.state === 1) {
                context.model('UserCredential').silent().save({
                    $state: 1,
                    id: event.target.id,
                    userPassword: `{md5}${TextUtils.toMD5('user')}`
                }).then(()=> {
                    return callback();
                }).catch((err)=> {
                    return callback(err);
                });
            }
            return callback();
        }).silent().save(newUser).then(()=> {
            return callback();
        }).catch((err)=> {
            return callback(err);
        });
    }).silent().save(people).then(()=> {
        context.finalize(()=> {
           process.exit(0);
        });
    }).catch((err)=> {
        context.finalize(()=> {
            console.log('ERROR', err);
            process.exit(1);
        });
    });
});

