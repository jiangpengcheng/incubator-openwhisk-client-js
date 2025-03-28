// Licensed to the Apache Software Foundation (ASF) under one or more contributor
// license agreements; and to You under the Apache License, Version 2.0.

'use strict'

const messages = require('./messages')
const Resources = require('./resources')

class Actions extends Resources {
  constructor (client) {
    super(client)
    this.resource = 'actions'
    this.identifiers.push('actionName')
    this.qs_options.invoke = ['blocking']
  }

  list (options) {
    options = options || {}
    options.qs = this.qs(options, ['skip', 'limit', 'count'])

    return super.list(options)
  }

  get (options) {
    options = this.parseOptions(options)
    options.qs = this.qs(options, ['code'])

    return this.operationWithId('GET', options)
  }

  invoke (options) {
    options = options || {}
    if (options.blocking && options.result) {
      return super.invoke(options).then(result => result.response.result)
    }

    return super.invoke(options)
  }

  create (options) {
    options.qs = this.qs(options, ['overwrite'])
    options.body = this.actionBody(options)

    return super.create(options)
  }

  actionBodyWithCode (options) {
    const body = {exec: {kind: options.kind || 'nodejs:default', code: options.action}}

    // allow options to override the derived exec object
    if (options.exec) {
      body.exec = Object.assign(body.exec, options.exec)
    }

    if (options.action instanceof Buffer) {
      body.exec.code = options.action.toString('base64')
    }

    return body
  }

  actionBodyWithSequence (options) {
    if (!(options.sequence instanceof Array)) {
      throw new Error(messages.INVALID_SEQ_PARAMETER)
    }

    if (options.sequence.length === 0) {
      throw new Error(messages.INVALID_SEQ_PARAMETER_LENGTH)
    }

    const body = {exec: {kind: 'sequence', components: options.sequence}}
    return body
  }

  actionBody (options) {
    const isCodeAction = options.hasOwnProperty('action')
    const isSequenceAction = options.hasOwnProperty('sequence')

    if (!isCodeAction && !isSequenceAction) {
      throw new Error(messages.MISSING_ACTION_OR_SEQ_BODY_ERROR)
    }

    if (isCodeAction && isSequenceAction) {
      throw new Error(messages.INVALID_ACTION_AND_SEQ_PARAMETERS)
    }

    // user can manually define & control exact action definition by passing in an object
    if (isCodeAction && typeof options.action === 'object' &&
      (!(options.action instanceof Buffer))) {
      return options.action
    }

    const body = isCodeAction
      ? this.actionBodyWithCode(options) : this.actionBodyWithSequence(options)

    if (typeof options.params === 'object') {
      body.parameters = Object.keys(options.params).map(key => ({key, value: options.params[key]}))
    }

    if (options.version) {
      body.version = options.version
    }

    if (options.limits) {
      body.limits = options.limits
    }

    if (typeof options.annotations === 'object') {
      body.annotations = Object.keys(options.annotations).map(key => ({ key, value: options.annotations[key] }))
    }

    return body
  }
}

module.exports = Actions
