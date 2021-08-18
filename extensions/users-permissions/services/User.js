'use strict'

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
    return strapi
      .query('user', 'users-permissions')
      .findOne(params, ['role', 'avatar'])
  },
  /**
   * Promise to fetch authenticated user.
   * @return {Promise}
   */
  fetchAuthenticatedUser(id) {
    return strapi
      .query('user', 'users-permissions')
      .findOne({ id }, ['role', 'budget_types', 'avatar']) // budget_types added
  },
  /**
   * Promise to remove a/an user.
   * @return {Promise}
   */
  async remove(params) {
    const user = await strapi.query('user', 'users-permissions').delete(params)

    delete user.budgets
    delete user['budget_types']
    delete user.avatar

    return user
  }
}
