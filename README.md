# ddb-stream-listener
This library is used to attach lambda functions to your dynamoDB streams.

It is used to create event types and attach custom handlers to them.

To use this library create a class such as:

## How to use

```javascript
const EventSourceBase = require('ddb-stream-listener').EventSourceBase;

const TABLE_NAME = 'Events';

class Event extends EventSourceBase {
  constructor(entityId, eventType, payload, params) {
    super(TABLE_NAME, entityId, eventType, payload, params);
  }
  static create(entityId, eventType, payload, params){
    return new Event(entityId, eventType, payload, params);
  }
}

module.exports = Event;

```

This assumes that you have created a table named `Events` with with streams enabled.

To create an event you declare an eventType eg:

```javascript
const EVENT_TYPES = {
  EXAMPLE_EVENT: 'example-event',
};
```

Import your new event type to where it will be used:

```javascript
const Event = require('../events/eventModel/Event');
const { EXAMPLE_EVENT } = require('../lib/constants').EVENT_TYPES;
```

The event object has a `save` method that takes in the following parameters:

```javascript
await Event.create(uuid.v1(), EXAMPLE_EVENT, {
      exampleKey: 'value'
    }).save();
```

To pick up events written to our `Events` table we need to create a `lambda function (AWS)` and attach it to the event stream of the `Events Table`
The following syntax is used with the [Serverless Framework](https://serverless.com/framework/docs/providers/aws/events/streams/)

```yml
  onEvent:
    handler: src/events/stream.onEvent
    events:
      - stream:
          type: dynamodb
          arn:
            Fn::GetAtt:
              - EventsDynamoDbTable
              - StreamArn
```

The `onEvent` function can be declared as:

```javascript
const StreamListener = require('ddb-stream-listener').StreamListener;
const { EXAMPLE_EVENT } = require('../lib/constants').EVENT_TYPES;
const listener = new StreamListener();

exports.onEvent = async (event, context) => {
  try {
    return await listener.onEvent(event, context);
  }
  catch (error) {
    log.error({ event, error }, error.message);
    throw error;
  }
};

listener.registerEventHandler(exampleHandler).on(EXAMPLE_EVENT);
async function exampleHandler(event) {
  try {
    await asyncFunction(params);
    await anotherAsyncFunction(params);
    return event;

  } catch (error) {
    throw error;
  }
}
```

And thats it! You know have a lambda that subscribes to events written to an dynamoDb table.
