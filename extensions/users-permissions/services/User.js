"use strict";

module.exports = {
  /**
   * Promise to edit a/an user.
   * @return {Promise}
   */
  async edit(params, values) {
    if (values.password) {
      values.password = await strapi.plugins[
        "users-permissions"
      ].services.user.hashPassword(values);
    }

    await strapi.query("user", "users-permissions").update(params, values);
    return strapi.query("user", "users-permissions").findOne(params, ["role"]);
  },
  /**
   * Promise to fetch authenticated user.
   * @return {Promise}
   */
  fetchAuthenticatedUser(id) {
    return strapi
      .query("user", "users-permissions")
      .findOne({ id }, ["role", "budget_types"]); // budget_types added
  },
};
