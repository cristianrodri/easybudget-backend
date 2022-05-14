'use strict'

/**
 * User.js controller
 *
 * @description: A set of functions called "actions" for managing `User`.
 */

const _ = require('lodash')
const { sanitizeEntity } = require('strapi-utils')
const adminUserController = require('./user/admin')
const apiUserController = require('./user/api')

const sanitizeUser = (user) =>
  sanitizeEntity(user, {
    model: strapi.query('user', 'users-permissions').model
  })

const resolveController = (ctx) => {
  const {
    state: { isAuthenticatedAdmin }
  } = ctx

  return isAuthenticatedAdmin ? adminUserController : apiUserController
}

const resolveControllerMethod = (method) => (ctx) => {
  const controller = resolveController(ctx)
  const callbackFn = controller[method]

  if (!_.isFunction(callbackFn)) {
    return ctx.notFound()
  }

  return callbackFn(ctx)
}

module.exports = {
  create: resolveControllerMethod('create'),
  update: resolveControllerMethod('update'),

  /**
   * Retrieve authenticated user.
   * @return {Object|Array}
   */
  async me(ctx) {
    const user = ctx.state.user

    const data = await strapi.plugins[
      'users-permissions'
    ].services.user.findOne({
      id: user.id,
      ...ctx.query
    })

    if (!data) {
      return ctx.badRequest(null, [
        { messages: [{ id: 'No authorization header was found' }] }
      ])
    }

    ctx.body = sanitizeUser(data)
  },

  /**
   * Destroy the auth user record.
   * @return {Object}
   */
  async destroy(ctx) {
    const authUser = ctx.state?.user

    if (!authUser) {
      return ctx.badRequest(null, [
        { messages: [{ id: 'No authorization header was found' }] }
      ])
    }

    const { id } = ctx.params
    const paramsIdIsEqualToAuthId = +id === authUser.id

    if (!paramsIdIsEqualToAuthId) {
      return ctx.unauthorized('You are not allowed to delete this user')
    }

    const data = await strapi.plugins['users-permissions'].services.user.remove(
      {
        id: authUser.id
      }
    )

    return sanitizeEntity(data, {
      model: strapi.plugins['users-permissions'].models.user
    })
  }
}
