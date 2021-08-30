'use strict'

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

const { isDraft } = require('strapi-utils').contentTypes
const _ = require('lodash')

const budgetsMoney = (budgets) => _.sumBy(budgets, 'money')

module.exports = {
  async create(data) {
    const isDraftChecked = isDraft(data, strapi.models.category)
    const validData = await strapi.entityValidator.validateEntityCreation(
      strapi.models.category,
      data,
      { isDraftChecked }
    )

    const entry = await strapi.query('category').create(validData)
    const category = await strapi
      .query('category')
      .findOne({ id: entry.id }, ['budgets'])

    category.money = 0

    return category
  },
  async update(params, data) {
    await strapi.query('category').update(params, data)

    const category = await strapi.query('category').findOne(params, ['budgets'])

    if (category) {
      category.money = budgetsMoney(category.budgets)
    }

    return category
  },
  async find(params) {
    const { budgets_date_start, budgets_date_end } = params
    const startDate = new Date(budgets_date_start)
    const endDate = new Date(budgets_date_end)

    const categories = await strapi
      .query('category')
      .model.query((qb) => {
        qb.where('user', params['user.id'])
      })
      .fetchAll({
        withRelated: [
          {
            budgets: (qb) => {
              if (budgets_date_start && budgets_date_end) {
                qb.where('date', '>=', startDate).andWhere('date', '<', endDate)
              } else if (budgets_date_start) {
                qb.where('date', '>=', startDate)
              } else if (budgets_date_end) {
                qb.where('date', '<', endDate)
              }
            }
          }
        ]
      })
      .then((data) => {
        const results = data.toJSON()

        const output = _.map(results, (result) => {
          result.money = _.sumBy(result.budgets, 'money')
          return result
        })

        return output
      })

    return categories
  },
  async findOne(params) {
    const category = await strapi.query('category').findOne(params, ['budgets'])

    if (category) {
      category.money = budgetsMoney(category.budgets)
    }

    return category
  },
  /**
   * Promise to delete a record
   *
   * @return {Promise}
   */

  async delete(params) {
    return strapi.query('category').delete(params, ['budgets'])
  }
}
