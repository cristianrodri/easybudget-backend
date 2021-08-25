'use strict'

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

const { sanitizeEntity } = require('strapi-utils')
const lf = new Intl.ListFormat('en')

module.exports = {
  // Get logged user category
  async find(ctx) {
    const user = ctx.state.user

    const entity = await strapi.services.category.find({
      'user.id': user.id
    })
    return sanitizeEntity(entity, { model: strapi.models.category })
  },

  // Get one income category by id
  async findOne(ctx) {
    const category = await strapi.services.category.findOne({
      id: ctx.params.id,
      'user.id': ctx.state.user.id
    })

    return sanitizeEntity(category, { model: strapi.models.category })
  },

  // Create category by getting an array of object "type" in request.body
  async create(ctx) {
    const user = ctx.state.user
    const categories = ctx.request.body

    const userCategories = await strapi.services.category.find({
      'user.id': user.id
    })

    const checkPreviousCategories = userCategories.filter((incType) =>
      categories.some(
        (type) => type.type === incType.type && type.name === incType.name
      )
    )

    // check if user has inserted repeated category before
    if (checkPreviousCategories.length > 0) {
      const repeatedCategories = checkPreviousCategories.map(
        (type) => `'${type.name}' in ${type.type}`
      )
      const format = lf.format(repeatedCategories)
      return ctx.badRequest(`You cannot repeat ${format}.`)
    }

    const entities = Promise.all(
      categories.map(async (category) => {
        category.user = ctx.state.user.id
        const entity = await strapi.services.category.create(category)
        return sanitizeEntity(entity, { model: strapi.models.category })
      })
    )
    return entities
  },

  // Update one category
  async update(ctx) {
    const { id } = ctx.params
    const { name, type } = ctx.request.body

    const category = await strapi.services.category.findOne({
      'user.id': ctx.state.user.id,
      name: name.trim(),
      type: type.trim()
    })

    // if some budget type is found with same name and the same type (income or expense), the updated one cannot be updated with equal name
    if (category) {
      return ctx.badRequest(
        `You cannot repeat ${category.name} in '${category.type}' type.`
      )
    }

    const entity = await strapi.services.category.update(
      { id, user: ctx.state.user.id },
      { name }
    )

    return sanitizeEntity(entity, { model: strapi.models.category })
  },

  // Delete one category
  async delete(ctx) {
    const entity = await strapi.services.category.delete({
      id: ctx.params.id,
      'user.id': ctx.state.user.id
    })

    return sanitizeEntity(entity, { model: strapi.models.category })
  },

  // Get user's categories count
  count(ctx) {
    return strapi.services.category.count({
      'user.id': ctx.state.user.id
    })
  }
}
