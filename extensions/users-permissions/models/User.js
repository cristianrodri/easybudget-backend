module.exports = {
  /**
   * Triggered before user creation.
   */
  lifecycles: {
    async afterDelete(result, params) {
      // delete avatar
      if (result.avatar?.id) {
        const file = await strapi.plugins["upload"].services.upload.fetch({
          id: result.avatar.id,
        });
        await strapi.plugins["upload"].services.upload.remove(file);
        console.log("Avatar deleted after deleting user");
      }

      // delete all budgets related to the deleted user
      result.budgets.forEach((entity) => {
        strapi.services.budget.delete({
          id: entity.id,
        });
      });
      console.log("Budgets deleted after deleting user");
    },
  },
};
