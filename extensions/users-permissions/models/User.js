module.exports = {
  /**
   * Triggered before user creation.
   */
  lifecycles: {
    async afterDelete(result) {
      // check if result is an array, otherwise is an object (data.length === undefined)
      if (typeof result.length === 'number') {
        // code used when data is removed by admin
        result.forEach(async (user) => {
          // delete avatar
          if (user.avatar?.id) {
            const file = await strapi.plugins['upload'].services.upload.fetch({
              id: user.avatar.id
            })
            await strapi.plugins['upload'].services.upload.remove(file)
          }

          // delete all budgets related to the deleted user
          user.budgets.forEach((entity) => {
            strapi.services.budget.delete({
              id: entity.id
            })
          })

          // delete all budget types related to the deleted user
          user['budget_types'].forEach((entity) => {
            strapi.services['budget-type'].delete({
              id: entity.id
            })
          })
        })
      } else {
        // code used when data is removed by user
        // delete avatar
        if (result.avatar?.id) {
          const file = await strapi.plugins['upload'].services.upload.fetch({
            id: result.avatar.id
          })
          await strapi.plugins['upload'].services.upload.remove(file)
          console.log('Avatar deleted after deleting user')
        }

        // delete all budgets related to the deleted user
        result.budgets.forEach((entity) => {
          strapi.services.budget.delete({
            id: entity.id
          })
        })

        console.log('Budgets deleted after deleting user')

        // delete all budget types related to the deleted user
        result['budget_types'].forEach((entity) => {
          strapi.services['budget-type'].delete({
            id: entity.id
          })
        })
        console.log('Budget types deleted after deleting user')
      }
    }
  }
}
