import {HttpApplication} from '@themost/web/app';
import path from 'path';
import {parseExpression} from 'cron-parser';
import cronstrue from 'cronstrue';
import moment from 'moment';

describe('Test Event Data', ()=> {
    /**
     * @type HttpContext
     */
    let context;
    before((done)=> {
        //initialize app
        let app = new HttpApplication(path.resolve(__dirname, "../server"));
        app.execute((newContext)=> {
            context = newContext;
            return done();
        })
    });

    after((done)=> {
        context.finalize(()=> {
            return done();
        });
    });

    it('should get event hours specification and create appointment slots', (done) => {
        context.model('Person').where('email').equal('cassandra.stevenson@example.com').silent().getItem().then((teacher)=> {
            return context.model('PersonAvailability').where('person')
                .equal(teacher.id).and('conditional').equal(false)
                .expand('eventHoursSpecification')
                .silent().getItems().then((res)=> {
                let appointments = res.map((x)=> {
                    return {
                        performer: teacher.id,
                        eventHoursSpecification: x.eventHoursSpecification,
                        maximumAttendeeCapacity:1,
                        eventStatus: {
                            "alternateName": "EventOpened"
                        }
                    };
                });
                context.model('Appointment').silent().save(appointments).then(()=> {
                    return done();
                });
            });
        }).catch((err)=> {
            return done(err);
        });
    });
});