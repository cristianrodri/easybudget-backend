"use strict";

const _ = require("lodash");
const { sanitizeEntity } = require("strapi-utils");

module.exports = {
  async update(ctx) {
    // custom code
    const authUser = ctx.state?.user;

    if (!authUser) {
      return ctx.badRequest(null, [
        { messages: [{ id: "No authorization header was found" }] },
      ]);
    }

    const { id } = ctx.params;
    const paramsIdIsEqualToAuthId = +id === authUser.id;

    if (!paramsIdIsEqualToAuthId) {
      return ctx.unauthorized("You are not allowed to update this user");
    }

    // strapi code
    const advancedConfigs = await strapi
      .store({
        environment: "",
        type: "plugin",
        name: "users-permissions",
        key: "advanced",
      })
      .get();

    const { email, username, password } = ctx.request.body;

    const user = await strapi.plugins["users-permissions"].services.user.fetch({
      id,
    });

    if (_.has(ctx.request.body, "email") && !email) {
      return ctx.badRequest("email.notNull");
    }

    if (_.has(ctx.request.body, "username") && !username) {
      return ctx.badRequest("username.notNull");
    }

    if (
      _.has(ctx.request.body, "password") &&
      !password &&
      user.provider === "local"
    ) {
      return ctx.badRequest("password.notNull");
    }

    if (_.has(ctx.request.body, "username")) {
      const userWithSameUsername = await strapi
        .query("user", "users-permissions")
        .findOne({ username });

      if (userWithSameUsername && userWithSameUsername.id != id) {
        return ctx.badRequest(
          null,
          formatError({
            id: "Auth.form.error.username.taken",
            message: "username.alreadyTaken.",
            field: ["username"],
          })
        );
      }
    }

    if (_.has(ctx.request.body, "email") && advancedConfigs.unique_email) {
      const userWithSameEmail = await strapi
        .query("user", "users-permissions")
        .findOne({ email: email.toLowerCase() });

      if (userWithSameEmail && userWithSameEmail.id != id) {
        return ctx.badRequest(
          null,
          formatError({
            id: "Auth.form.error.email.taken",
            message: "Email already taken",
            field: ["email"],
          })
        );
      }
      ctx.request.body.email = ctx.request.body.email.toLowerCase();
    }

    let updateData = {
      ...ctx.request.body,
    };

    if (_.has(ctx.request.body, "password") && password === user.password) {
      delete updateData.password;
    }

    const data = await strapi.plugins["users-permissions"].services.user.edit(
      { id },
      updateData
    );

    ctx.send(
      sanitizeEntity(data, {
        model: strapi.query("user", "users-permissions").model,
      })
    );
  },
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
