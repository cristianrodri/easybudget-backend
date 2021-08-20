'use strict'

const _ = require('lodash')
const {
  contentTypes: contentTypesUtils,
  sanitizeEntity,
  webhook: webhookUtils
} = require('strapi-utils')

const { MEDIA_UPDATE, MEDIA_CREATE } = webhookUtils.webhookEvents

const { UPDATED_BY_ATTRIBUTE, CREATED_BY_ATTRIBUTE } =
  contentTypesUtils.constants

const sendMediaMetrics = (data) => {
  if (_.has(data, 'caption') && !_.isEmpty(data.caption)) {
    strapi.telemetry.send('didSaveMediaWithCaption')
  }

  if (_.has(data, 'alternativeText') && !_.isEmpty(data.alternativeText)) {
    strapi.telemetry.send('didSaveMediaWithAlternativeText')
  }
}

module.exports = {
  async update(params, values, { user } = {}) {
    const fileValues = { ...values }
    if (user) {
      fileValues[UPDATED_BY_ATTRIBUTE] = user.id
    }
    sendMediaMetrics(fileValues)

    const res = await strapi.query('file', 'upload').update(params, fileValues)
    const modelDef = strapi.getModel('file', 'upload')
    strapi.eventHub.emit(MEDIA_UPDATE, {
      media: sanitizeEntity(res, { model: modelDef })
    })
    delete res.related
    return res
  },

  async add(values, { user } = {}) {
    const fileValues = { ...values }
    if (user) {
      fileValues[UPDATED_BY_ATTRIBUTE] = user.id
      fileValues[CREATED_BY_ATTRIBUTE] = user.id
    }
    sendMediaMetrics(fileValues)

    const res = await strapi.query('file', 'upload').create(fileValues)
    const modelDef = strapi.getModel('file', 'upload')
    strapi.eventHub.emit(MEDIA_CREATE, {
      media: sanitizeEntity(res, { model: modelDef })
    })

    delete res.related
    return res
  }
}
