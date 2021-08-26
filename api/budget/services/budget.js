'use strict'

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

const { isDraft } = require('strapi-utils').contentTypes

module.exports = {
  async create(data) {
    const isDraftChecked = isDraft(data, strapi.models.budget)
    const validData = await strapi.entityValidator.validateEntityCreation(
      strapi.models.budget,
      data,
      { isDraftChecked }
    )

    const entry = await strapi.query('budget').create(validData)

    return this.findOne({ id: entry.id }, ['category'])
  },
  async update(params, data) {
    await strapi.query('budget').update(params, data)

    // after updating get data without user and budget collections
    return strapi.query('budget').findOne(params, ['category'])
  },
  find(params) {
    return strapi.query('budget').find(params, ['category'])
  },
  findOne(params) {
    return strapi.query('budget').findOne(params, ['category'])
  },
  /**
   * Promise to delete a record
   *
   * @return {Promise}
   */

  async delete(params) {
    const budget = await strapi.query('budget').delete(params, [])

    return budget
  }
}
