"use strict";
const { parseMultipartData, sanitizeEntity } = require("strapi-utils");

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

const unauthorizedMessage = (methodMessage) =>
  `You're not allowed to ${methodMessage} budgets. Login first.`;

module.exports = {
  async findOne(ctx) {
    const budget = await strapi.services.budget.findOne({
      id: ctx.params.id,
      "user.id": ctx.state.user.id,
    });

    if (!budget) {
      return ctx.unauthorized(`You can't view this budget`);
    }

    return sanitizeEntity(budget, { model: strapi.models.budget });
  },

  // Get logged user budgets
  async find(ctx) {
    const user = ctx.state?.user;

    if (!user) {
      return ctx.badRequest(null, [
        { messages: [{ id: "No authorization header was found" }] },
      ]);
    }

    const data = await strapi.services.budget.find({ user: user.id });

    return sanitizeEntity(data, { model: strapi.models.budget });
  },

  async create(ctx) {
    if (!ctx.state?.user) {
      return ctx.unauthorized(unauthorizedMessage("create"));
    }

    let entity;
    if (ctx.is("multipart")) {
      const { data, files } = parseMultipartData(ctx);
      data.user = ctx.state.user.id;
      entity = await strapi.services.budget.create(data, { files });
    } else {
      ctx.request.body.user = ctx.state.user.id;
      entity = await strapi.services.budget.create(ctx.request.body);
    }
    return sanitizeEntity(entity, { model: strapi.models.budget });
  },

  async update(ctx) {
    const { id } = ctx.params;

    if (!ctx.state?.user) {
      return ctx.unauthorized(unauthorizedMessage("update"));
    }

    let entity;

    const [budget] = await strapi.services.budget.find({
      id: ctx.params.id,
      "user.id": ctx.state.user.id,
    });

    if (!budget) {
      return ctx.unauthorized(`You can't update this entry`);
    }

    if (ctx.is("multipart")) {
      const { data, files } = parseMultipartData(ctx);
      entity = await strapi.services.budget.update({ id }, data, {
        files,
      });
    } else {
      entity = await strapi.services.budget.update({ id }, ctx.request.body);
    }

    return sanitizeEntity(entity, { model: strapi.models.budget });
  },

  async delete(ctx) {
    const { id } = ctx.params;

    if (!ctx.state?.user) {
      return ctx.unauthorized(unauthorizedMessage("delete"));
    }

    let entity;

    const [budget] = await strapi.services.budget.find({
      id: ctx.params.id,
      "user.id": ctx.state.user.id,
    });

    if (!budget) {
      return ctx.unauthorized(`You can't delete this entry`);
    }

    entity = await strapi.services.budget.delete({ id });

    return sanitizeEntity(entity, { model: strapi.models.budget });
  },
};
