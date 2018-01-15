/**
 *
 * @param {DataEventArgs} event
 * @param {Function} callback
 */
export function beforeSave(event, callback) {
    if (event.state === 1) {
        //get person email
        if (event.target.email) {
            //create user
            const newUser = {
                "name":event.target.email,
                "description":event.target.description,
                "groups":[
                    {
                        "name":"Users"
                    }
                ]
            };
            return event.model.context.model('User').silent().save(newUser).then(()=> {
                //get user id
                event.target.user = newUser;
                return callback();
            }).catch((err)=> {
                return callback(err);
            });
        }
    }
    return callback();
}

export function beforeRemove(event, callback) {
    return event.model.context.model('Person')
        .where('id').equal(event.target.id)
        .select('user')
        .silent()
        .value().then((user)=> {
            event.previous.user = user;
            return callback();
        }).catch((err)=> {
            return callback(err);
        });
}

export function afterRemove(event, callback) {
    return event.model.context.model('User').silent().remove({
        "id":event.previous.user
    }).then(()=> {
        return callback();
    }).catch((err)=> {
        return callback(err);
    });
}