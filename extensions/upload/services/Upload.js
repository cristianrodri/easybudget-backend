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
  },
  async replace(id, { data, file }, { user } = {}) {
    const config = strapi.plugins.upload.config

    console.log('update')

    const { getDimensions, generateThumbnail, generateResponsiveFormats } =
      strapi.plugins.upload.services['image-manipulation']

    const dbFile = await this.fetch({ id })

    if (!dbFile) {
      throw strapi.errors.notFound('file not found')
    }

    const { fileInfo } = data
    const fileData = await this.enhanceFile(file, fileInfo)

    // keep a constant hash
    _.assign(fileData, {
      hash: dbFile.hash,
      ext: dbFile.ext
    })

    // execute delete function of the provider
    if (dbFile.provider === config.provider) {
      await strapi.plugins.upload.provider.delete(dbFile)

      if (dbFile.formats) {
        await Promise.all(
          Object.keys(dbFile.formats).map((key) => {
            return strapi.plugins.upload.provider.delete(dbFile.formats[key])
          })
        )
      }
    }

    await strapi.plugins.upload.provider.upload(fileData)

    // clear old formats
    _.set(fileData, 'formats', {})

    const thumbnailFile = await generateThumbnail(fileData)
    if (thumbnailFile) {
      await strapi.plugins.upload.provider.upload(thumbnailFile)
      delete thumbnailFile.buffer
      _.set(fileData, 'formats.thumbnail', thumbnailFile)
    }

    const formats = await generateResponsiveFormats(fileData)
    if (Array.isArray(formats) && formats.length > 0) {
      for (const format of formats) {
        if (!format) continue

        const { key, file } = format

        await strapi.plugins.upload.provider.upload(file)
        delete file.buffer

        _.set(fileData, ['formats', key], file)
      }
    }

    const { width, height } = await getDimensions(fileData.buffer)
    delete fileData.buffer

    _.assign(fileData, {
      provider: config.provider,
      width,
      height
    })

    return this.update({ id }, fileData, { user })
  }
}
