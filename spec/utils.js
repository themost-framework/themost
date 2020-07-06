export class CancelTransactionError extends Error {
    constructor() {
        super();
    }
}
export function executeInTransactionAsync(context, func) {
    return new Promise((resolve, reject) => {
        // clear cache
        const configuration = context.getConfiguration();
        Object.defineProperty(configuration, 'cache', {
            configurable: true,
            enumerable: true,
            writable: true,
            value: { }
        });
        // start transaction
        context.db.executeInTransaction((cb) => {
            try {
                func().then(() => {
                    return cb(new CancelTransactionError());
                }).catch( err => {
                    return cb(err);
                });
            }
            catch (err) {
                return cb(err);
            }

        }, err => {
            // if error is an instance of CancelTransactionError
            if (err && err instanceof CancelTransactionError) {
                return resolve();
            }
            if (err) {
                return reject(err);
            }
            // exit
            return resolve();
        });
    });
}