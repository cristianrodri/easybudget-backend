'use strict'

const _ = require('lodash')

const getUserData = async (
  query,
  params,
  { budgets_date_start, budgets_date_end } = {}
) => {
  const result = await strapi
    .query('user', 'users-permissions')
    .model.query((qb) => {
      qb.where(query, params)
    })
    .fetch({
      withRelated: [
        'categories',
        'avatar',
        {
          'categories.budgets': (qb) => {
            // If client dates are provided by ctx.query
            if (budgets_date_start && budgets_date_end) {
              const firstDayOfMonth = new Date(budgets_date_start)
              const nextMonth = new Date(budgets_date_end)
              qb.where('date', '>=', firstDayOfMonth).andWhere(
                'date',
                '<',
                nextMonth
              )
            }
          }
        }
      ]
    })
    .then((data) => {
      let user = data?.toJSON()

      if (!user) return null

      user.categories = _.map(user.categories, (category) => {
        category.budgets = _.map(category.budgets, (budget) => {
          return budget
        })
        category.money = _.sumBy(category.budgets, 'money')
        return category
      })

      return user
    })

  return result
}

module.exports = {
  getUserData
}
