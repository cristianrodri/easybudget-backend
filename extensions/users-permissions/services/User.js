'use strict'

const { getUserData } = require('./utils/utils')

module.exports = {
  /**
   * Promise to edit a/an user.
   * @return {Promise}
   */
  async edit(params, values) {
    if (values.password) {
      values.password = await strapi.plugins[
        'users-permissions'
      ].services.user.hashPassword(values)
    }

    await strapi.query('user', 'users-permissions').update(params, values)
    return strapi.query('user', 'users-permissions').findOne(params, ['avatar'])
  },
  /**
   * Promise to fetch authenticated user.
   * @return {Promise}
   */
  async fetchAuthenticatedUser(id) {
    const user = await getUserData('id', id)

    return user
  },
  /**
   * Promise to remove a/an user.
   * @return {Promise}
   */
  async remove(params) {
    const user = await strapi.query('user', 'users-permissions').delete(params)

    delete user.budgets
    delete user.categories
    delete user.avatar

    return user
  }
}
