'use strict'

/**
 * Upload.js controller
 *
 */

const _ = require('lodash')
const adminUploadController = require('strapi-plugin-upload/controllers/upload/admin')
const apiUploadController = require('strapi-plugin-upload/controllers/upload/api')
const { sanitizeEntity } = require('strapi-utils/lib')

const resolveController = (ctx) => {
  const {
    state: { isAuthenticatedAdmin }
  } = ctx

  return isAuthenticatedAdmin ? adminUploadController : apiUploadController
}

const sanitize = (data, options = {}) => {
  return sanitizeEntity(data, {
    model: strapi.getModel('file', 'upload'),
    ...options
  })
}

module.exports = {
  async findOne(ctx) {
    const {
      params: { id }
    } = ctx

    const file = await strapi.plugins.upload.services.upload.fetch({
      id
    })

    if (!file) {
      return ctx.notFound('file.notFound')
    }

    delete file.related

    ctx.body = sanitize(file)
  },
  async upload(ctx) {
    const { user, isAuthenticatedAdmin } = ctx.state
    const refId = +ctx.request.body.refId

    // only add or update file on your own account
    if (user.id !== refId && !isAuthenticatedAdmin) {
      return ctx.unauthorized(
        'You are not allowed to add or update file on user with refId ' + refId
      )
    }

    const isUploadDisabled =
      _.get(strapi.plugins, 'upload.config.enabled', true) === false

    if (isUploadDisabled) {
      throw strapi.errors.badRequest(null, {
        errors: [
          { id: 'Upload.status.disabled', message: 'File upload is disabled' }
        ]
      })
    }

    const {
      query: { id },
      request: { files: { files } = {} }
    } = ctx
    const controller = resolveController(ctx)

    if (_.isEmpty(files) || files.size === 0) {
      throw strapi.errors.badRequest(null, {
        errors: [{ id: 'Upload.status.empty', message: 'Files are empty' }]
      })
    }

    if (files.size > 1_000_000) {
      throw strapi.errors.badRequest(null, {
        errors: [
          { id: 'Upload.status.exceeded', message: 'Files cannot exceed 1MB' }
        ]
      })
    }

    const userData = await strapi.plugins[
      'users-permissions'
    ].services.user.fetch({
      id: user.id
    })

    // if user has previous avatar and check if query id is equal to user's avatar id
    if (userData?.avatar?.id) {
      if (!id)
        return ctx.badRequest(
          'The user is using avatar currently. You can only update the avatar by adding file id on the params'
        )
      if (userData.avatar.id !== +id)
        return ctx.badRequest(
          'You are not allowed to update file with id ' + id
        )
    }

    await (userData?.avatar?.id
      ? controller.replaceFile
      : controller.uploadFiles)(ctx)
  },
  async destroy(ctx) {
    const { user, isAuthenticatedAdmin } = ctx.state
    const {
      params: { id }
    } = ctx

    const file = await strapi.plugins['upload'].services.upload.fetch({ id })

    if (!file) {
      return ctx.notFound('file.notFound')
    }

    const relatedId = file.related?.[0]?.id

    if (user.id !== relatedId && !isAuthenticatedAdmin) {
      return ctx.unauthorized(
        'You are not allowed to delete file on user ' + relatedId
      )
    }

    await strapi.plugins['upload'].services.upload.remove(file)

    delete file.related

    ctx.body = sanitize(file)
  }
}
