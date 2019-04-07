#### Usage

Use @themost/cli and generate a new controller

    themost generate controller Message
    
This command will generate a MessageController:

    + server
        + controllers
            + message-controller.js
            
MessageController is a class that extends HttpBaseController:

    import HttpBaseController from '@themost/web/controllers/base';
    import {httpController,httpGet, httpAction} from '@themost/web/decorators';
    
    @httpController()
    class MessageController extends HttpBaseController {
        
        constructor(context) {
            super(context);
        }
        
        @httpGet()
        @httpAction('index')
        getIndex() {
            return this.view({ message: 'Hello World!' });
        }
        
    }
    
    module.exports = MessageController;
    
It has a default index action.

Go to views directory and create a new view:

    + server
        + views
            + message
                + index.html.ejs


server/views/message/index.html.ejs

    <div>
        <h2><%= model.message %></h2>
    </div>
    
Navigate to http://localhost:3000/messages/index.html
