'use strict'

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

const { sanitizeEntity } = require('strapi-utils')

module.exports = {
  // Get user budgets
  async find(ctx) {
    const user = ctx.state.user

    const entity = await strapi.services.budget.find({
      'user.id': user.id,
      ...ctx.query
    })
    return sanitizeEntity(entity, { model: strapi.models.budget })
  },

  // Get one user budget by id
  async findOne(ctx) {
    const budget = await strapi.services.budget.findOne({
      id: ctx.params.id,
      'user.id': ctx.state.user.id
    })

    return sanitizeEntity(budget, { model: strapi.models.budget })
  },

  // Create one user budget
  async create(ctx) {
    const user = ctx.state.user
    const categoryId = ctx.request.body.category

    if (!categoryId) {
      return ctx.unauthorized('You need to add the category id')
    }

    const category = await strapi.services.category.findOne({
      id: categoryId,
      'user.id': user.id
    })

    if (!category) {
      return ctx.unauthorized(
        'You cannot create budget on category with id ' + categoryId
      )
    }

    ctx.request.body.user = user.id
    ctx.request.body.date = new Date()
    const entity = await strapi.services.budget.create(ctx.request.body)
    return sanitizeEntity(entity, { model: strapi.models.budget })
  },

  // Update one user budget
  async update(ctx) {
    const { id } = ctx.params
    const user = ctx.state.user
    const categoryId = ctx.request.body?.category

    // If category is provided in request.body, check if exist, otherwise return error
    if (categoryId) {
      const category = await strapi.services.category.findOne({
        id: categoryId,
        'user.id': user.id
      })

      if (!category)
        return ctx.badRequest(
          'You cannot move this budget in category with id ' + categoryId
        )
    }

    const entity = await strapi.services.budget.update(
      { id, user: user.id },
      ctx.request.body
    )

    return sanitizeEntity(entity, { model: strapi.models.budget })
  },

  // Delete one user budget
  async delete(ctx) {
    const { id } = ctx.params
    const user = ctx.state.user

    const entity = await strapi.services.budget.delete({ id, user: user.id })

    return sanitizeEntity(entity, { model: strapi.models.budget })
  },

  count(ctx) {
    return strapi.services.budget.count({
      'user.id': ctx.state.user.id,
      ...ctx.query
    })
  }
}
