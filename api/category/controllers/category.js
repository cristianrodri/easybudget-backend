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
    const { user } = ctx.state

    if (!type || !name)
      return ctx.badRequest(`You need to provide the ${type ? 'name' : 'type'}`)

    const category = await strapi.services.category.findOne({
      'user.id': user.id,
      name: name.trim(),
      type: type.trim()
    })

    // if some category is found with same name and the same type (income or expense), the updated one cannot be updated with equal name. Only if params.id and category.id share the same id
    if (category && category.id !== +id) {
      return ctx.badRequest(
        `You cannot repeat ${category.name} in '${category.type}' type.`
      )
    }

    const relatedBudgets = await strapi.services.budget.count({
      'user.id': ctx.state.user.id,
      category: ctx.params.id
    })

    // If type of related category is different from ctx.request.body.type AND related budgets (from the related category) is greater than 0... cannot update the type
    if (relatedBudgets > 0) {
      const relatedCategory = await strapi.services.category.findOne({
        'user.id': user.id,
        id
      })

      if (relatedCategory?.type !== type)
        return ctx.badRequest(
          'You are not be able to update this category type because it has one or more budgets related'
        )
    }

    const entity = await strapi.services.category.update(
      { id, user: ctx.state.user.id },
      { name, type }
    )

    return sanitizeEntity(entity, { model: strapi.models.category })
  },

  // Delete one category
  async delete(ctx) {
    const relatedBudgets = await strapi.services.budget.count({
      'user.id': ctx.state.user.id,
      category: ctx.params.id
    })

    if (relatedBudgets > 0) {
      return ctx.badRequest(
        `You are not be able to delete this category because it has ${relatedBudgets} budget${
          relatedBudgets > 1 ? 's' : ''
        } related to it`
      )
    }

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
