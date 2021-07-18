module.exports = {
  /**
   * Triggered before user creation.
   */
  lifecycles: {
    async afterDelete(result, params) {
      // delete all budgets related to the deleted user
      result.budgets.forEach((entity) => {
        strapi.services.budget.delete({
          id: entity.id,
        });
      });
    },
  },
};
