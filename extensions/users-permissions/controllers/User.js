"use strict";
const { sanitizeData, sanitizeEntity } = require("strapi-utils");

module.exports = {
  async destroy(ctx) {
    const authUser = ctx.state?.user;

    if (!authUser) {
      return ctx.badRequest(null, [
        { messages: [{ id: "No authorization header was found" }] },
      ]);
    }

    const { id } = ctx.params;
    const paramsIdIsEqualToAuthId = +id === authUser.id;

    if (!paramsIdIsEqualToAuthId) {
      return ctx.unauthorized("You are not allowed to delete this user");
    }

    const data = await strapi.plugins["users-permissions"].services.user.remove(
      {
        id: authUser.id,
      }
    );

    return sanitizeEntity(data, {
      model: strapi.plugins["users-permissions"].models.user,
    });
  },
};
