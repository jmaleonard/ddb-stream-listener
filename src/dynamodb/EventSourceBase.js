'use strict';
const moment = require('moment');
const uuid = require('uuid');
const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient({
  convertEmptyValues: true
});

const ENTITY_ID = Symbol();
const TIMESTAMP = Symbol();
const EVENT_TYPE = Symbol();
const PAYLOAD = Symbol();
const TABLE_NAME = Symbol();
const PARAMS = Symbol();

class EventSourceBase {
  constructor(tableName, entityId, eventType, payload, params) {
    this[TABLE_NAME] = tableName;
    this[ENTITY_ID] = entityId;
    this[EVENT_TYPE] = eventType;
    this[PAYLOAD] = payload;
    this[TIMESTAMP] = moment.utc().toISOString();
    this[PARAMS] = params;
  }

  get entityId() {
    return this[ENTITY_ID];
  }

  get timestamp() {
    return this[TIMESTAMP];
  }

  get eventType() {
    return this[EVENT_TYPE];
  }

  get payload() {
    return this[PAYLOAD];
  }

  get tableName() {
    return this[TABLE_NAME];
  }

  get params() {
    return this[PARAMS];
  }

  toItem() {
    const params = this.params || {};
    const item = Object.assign(params, {
      id: uuid.v1(),
      entityId: this.entityId,
      timestamp: this.timestamp,
      payload: this.payload,
      eventType: this.eventType,

    });
    return item;
  }

  save() {
    const item = this.toItem();
    const params = {
      TableName: this.tableName,
      Item: item
    };
    dynamoDb.put(params).promise().then(() => { return item }).catch(error => { throw error });
  }
}

module.exports = EventSourceBase;
