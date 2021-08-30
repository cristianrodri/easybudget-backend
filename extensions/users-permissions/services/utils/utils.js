'use strict'

const _ = require('lodash')

const getUserData = async (
  query,
  params,
  { budgets_date_start, budgets_date_end } = {}
) => {
  let firstDayOfMonth
  let nextMonth

  // If client dates are provided by ctx.query
  if (budgets_date_start && budgets_date_end) {
    firstDayOfMonth = new Date(budgets_date_start)
    nextMonth = new Date(budgets_date_end)
  } else {
    const today = new Date()
    firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1)
  }
  const greaterThanOrEqual = ['date', '>=', firstDayOfMonth]
  const lessThan = ['date', '<', nextMonth]

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
            qb.where(...greaterThanOrEqual).andWhere(...lessThan)
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
