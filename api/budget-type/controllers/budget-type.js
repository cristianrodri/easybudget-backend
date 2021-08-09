"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

const { sanitizeEntity } = require("strapi-utils");
const lf = new Intl.ListFormat("en");

const unauthorizedMessage = `This budget type doesn't exist or belongs to another user.`;

module.exports = {
  // Get logged user budget-type
  async find(ctx) {
    const user = ctx.state.user;

    const entity = await strapi.services["budget-type"].find({
      "user.id": user.id,
    });
    return sanitizeEntity(entity, { model: strapi.models["budget-type"] });
  },

  // Get one income type by id
  async findOne(ctx) {
    const budgetType = await strapi.services["budget-type"].findOne({
      id: ctx.params.id,
      "user.id": ctx.state.user.id,
    });

    if (!budgetType) {
      return ctx.unauthorized(unauthorizedMessage);
    }

    return sanitizeEntity(budgetType, { model: strapi.models["budget-type"] });
  },

  // Create budget-type by getting an array of object "type" in request.body
  async create(ctx) {
    const user = ctx.state.user;
    const types = ctx.request.body;

    const budgetTypesUser = await strapi.services["budget-type"].find({
      "user.id": user.id,
    });

    const checkPreviousTypes = budgetTypesUser.filter((incType) =>
      types.some(
        (type) => type.type === incType.type && type.name === incType.name
      )
    );

    // check if user has inserted repeated type before
    if (checkPreviousTypes.length > 0) {
      const repeatedTypes = checkPreviousTypes.map(
        (type) => `'${type.name}' in ${type.type}`
      );
      const format = lf.format(repeatedTypes);
      return ctx.badRequest(`You cannot repeat ${format}.`);
    }

    const entities = Promise.all(
      types.map(async (t) => {
        t.user = ctx.state.user.id;
        const entity = await strapi.services["budget-type"].create(t);
        return sanitizeEntity(entity, { model: strapi.models["budget-type"] });
      })
    );
    return entities;
  },

  // update one income type
  async update(ctx) {
    const { id } = ctx.params;
    const { name } = ctx.request.body;

    const budgetTypes = await strapi.services["budget-type"].findOne({
      id: ctx.params.id,
      "user.id": ctx.state.user.id,
    });

    if (!budgetTypes) {
      return ctx.unauthorized(unauthorizedMessage);
    }

    const entity = await strapi.services["budget-type"].update(
      { id },
      { name }
    );

    return sanitizeEntity(entity, { model: strapi.models["budget-type"] });
  },

  async delete(ctx) {
    const { id } = ctx.params;

    const budgetTypes = await strapi.services["budget-type"].findOne({
      id: ctx.params.id,
      "user.id": ctx.state.user.id,
    });

    if (!budgetTypes) {
      return ctx.unauthorized(unauthorizedMessage);
    }

    const entity = await strapi.services["budget-type"].delete({ id });

    return sanitizeEntity(entity, { model: strapi.models["budget-type"] });
  },
};
