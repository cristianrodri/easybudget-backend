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
    return strapi.query('user', 'users-permissions').findOne(params, ['avatar'])
  },
  /**
   * Promise to fetch authenticated user.
   * @return {Promise}
   */
  async fetchAuthenticatedUser(id) {
    const today = new Date()
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1)

    const result = await strapi
      .query('user', 'users-permissions')
      .model.query((qb) => {
        qb.where('id', id)
      })
      .fetch({
        withRelated: [
          {
            budgets: (qb) => {
              qb.where('date', '>=', firstDayOfMonth).andWhere(
                'date',
                '<',
                nextMonth
              )
            },
            budget_types: (qb) => {
              qb.column()
            },
            avatar: (qb) => {
              qb.column()
            }
          }
        ]
      })

    const fields = result.toJSON()

    return fields
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
