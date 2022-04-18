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

    return entry
  },
  async update(params, data) {
    await strapi.query('budget').update(params, data)

    // after updating get data without user and budget collections
    return strapi.query('budget').findOne(params, [])
  },
  find(params) {
    const realParams = { ...params }

    // _categorydata property is delete before the query is called because doesn't exit in budget model
    delete params._categorydata
    return (
      strapi
        .query('budget')
        // If _categorydata property is provided into the API query, then get budgets data with categories data, otherwise just received the category id by providing and emtpy array
        .find(params, realParams?._categorydata ? undefined : [])
    )
  },
  findOne(params) {
    return strapi.query('budget').findOne(params, [])
  },
  /**
   * Promise to delete a record
   *
   * @return {Promise}
   */

  async delete(params) {
    return strapi.query('budget').delete(params, [])
  }
}
