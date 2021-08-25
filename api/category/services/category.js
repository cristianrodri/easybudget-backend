'use strict'

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

const { isDraft } = require('strapi-utils').contentTypes

module.exports = {
  async create(data) {
    const isDraftChecked = isDraft(data, strapi.models.category)
    const validData = await strapi.entityValidator.validateEntityCreation(
      strapi.models.category,
      data,
      { isDraftChecked }
    )

    const entry = await strapi.query('category').create(validData)

    return this.findOne({ id: entry.id }, [])
  },
  async update(params, data) {
    await strapi.query('category').update(params, data)

    // after updating get data without user and budget collections
    return strapi.query('category').findOne(params, [])
  },
  find(params) {
    return strapi.query('category').find(params, [])
  },
  findOne(params) {
    return strapi.query('category').findOne(params, [])
  },
  /**
   * Promise to delete a record
   *
   * @return {Promise}
   */

  async delete(params) {
    const category = await strapi.query('category').delete(params)

    delete category.budgets
    category.user = category.user.id
    return category
  }
}
