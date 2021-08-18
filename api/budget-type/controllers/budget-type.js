'use strict'

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

const { sanitizeEntity } = require('strapi-utils')
const lf = new Intl.ListFormat('en')

module.exports = {
  // Get logged user budget-type
  async find(ctx) {
    const user = ctx.state.user

    const entity = await strapi.services['budget-type'].find({
      'user.id': user.id
    })
    return sanitizeEntity(entity, { model: strapi.models['budget-type'] })
  },

  // Get one income type by id
  async findOne(ctx) {
    const budgetType = await strapi.services['budget-type'].findOne({
      id: ctx.params.id,
      'user.id': ctx.state.user.id
    })

    return sanitizeEntity(budgetType, { model: strapi.models['budget-type'] })
  },

  // Create budget-type by getting an array of object "type" in request.body
  async create(ctx) {
    const user = ctx.state.user
    const types = ctx.request.body

    const budgetTypesUser = await strapi.services['budget-type'].find({
      'user.id': user.id
    })

    const checkPreviousTypes = budgetTypesUser.filter((incType) =>
      types.some(
        (type) => type.type === incType.type && type.name === incType.name
      )
    )

    // check if user has inserted repeated type before
    if (checkPreviousTypes.length > 0) {
      const repeatedTypes = checkPreviousTypes.map(
        (type) => `'${type.name}' in ${type.type}`
      )
      const format = lf.format(repeatedTypes)
      return ctx.badRequest(`You cannot repeat ${format}.`)
    }

    const entities = Promise.all(
      types.map(async (t) => {
        t.user = ctx.state.user.id
        const entity = await strapi.services['budget-type'].create(t)
        return sanitizeEntity(entity, { model: strapi.models['budget-type'] })
      })
    )
    return entities
  },

  // update one income type
  async update(ctx) {
    const { id } = ctx.params
    const { name, type } = ctx.request.body

    const budgetType = await strapi.services['budget-type'].findOne({
      'user.id': ctx.state.user.id,
      name: name.trim(),
      type: type.trim()
    })

    // if some budget type is found with same name and the same type (income or expense), the updated one cannot be updated with equal name
    if (budgetType) {
      return ctx.badRequest(
        `You cannot repeat ${budgetType.name} in '${budgetType.type}' type.`
      )
    }

    const entity = await strapi.services['budget-type'].update(
      { id, user: ctx.state.user.id },
      { name }
    )

    return sanitizeEntity(entity, { model: strapi.models['budget-type'] })
  },

  async delete(ctx) {
    const entity = await strapi.services['budget-type'].delete({
      id: ctx.params.id,
      'user.id': ctx.state.user.id
    })

    return sanitizeEntity(entity, { model: strapi.models['budget-type'] })
  },
  count(ctx) {
    return strapi.services['budget-type'].count({
      'user.id': ctx.state.user.id
    })
  }
}
