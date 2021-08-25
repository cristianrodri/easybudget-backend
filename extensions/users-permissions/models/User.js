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
          user.categories.forEach((entity) => {
            strapi.services.category.delete({
              id: entity.id,
              user: user.id
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
            id: entity.id,
            user: result.id
          })
        })

        console.log('Budgets deleted after deleting user')

        // delete all budget types related to the deleted user
        result.categories.forEach((entity) => {
          strapi.services.category.delete({
            id: entity.id,
            user: result.id
          })
        })
        console.log('Categories deleted after deleting user')
      }
    }
  }
}
