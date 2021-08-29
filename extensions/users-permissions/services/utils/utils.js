'use strict'

const _ = require('lodash')

const getUserData = async (query, params) => {
  const today = new Date()
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1)
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
          budgets: (qb) => {
            // Get current month's budgets
            qb.where(...greaterThanOrEqual).andWhere(...lessThan)
          },
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
          delete budget.category
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
