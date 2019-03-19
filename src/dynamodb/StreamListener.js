'use strict';

const _ = require('lodash');
const async = require('async');
const AWS = require('aws-sdk');
const ddbConverter = AWS.DynamoDB.Converter;
const DefaultEventHandler = (params) => Promise.resolve(params);
const EventHandlers = Symbol();

class StreamListener {
  constructor() {
    this[EventHandlers] = {};
  }

  get eventHandlers() {
    return this[EventHandlers];
  }

  registerEventHandler(eventHandler) {
    if (!_.isFunction(eventHandler)) throw new Error('eventHandler must be a function');
    const self = this;
    return {
      on: function (eventName) {
        if (!eventName || eventName == '') throw new Error('eventName must be provided');
        self.eventHandlers[eventName] = eventHandler;
        return self;
      }
    }
  }

  onEvent(event, context) {
    return new Promise((resolve, reject) => {
      async.each(event.Records, (record, done) => {
        if (record.eventName !== 'INSERT') return done();
        const newItem = ddbConverter.unmarshall(record.dynamodb.NewImage, { convertEmptyValues: true });
        const oldItem = ddbConverter.unmarshall(record.dynamodb.OldImage || {}, { convertEmptyValues: true });
        const params = { newItem, oldItem, context };
        const handler = this.eventHandlers[newItem.eventType] || DefaultEventHandler;
        handler(params).then(() => done()).catch(done);
      }, (error) => {
        if (error) return reject(error);
        return resolve(null, event);
      });
    });
  }
}

module.exports = StreamListener;
