"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

const { sanitizeEntity } = require("strapi-utils");

module.exports = {
  // Get logged user income-types
  async find(ctx) {
    const user = ctx.state.user;

    const entity = await strapi.services["income-types"].find({
      "user.id": user.id,
    });
    return sanitizeEntity(entity, { model: strapi.models["income-types"] });
  },

  // Get one income type by id
  async findOne(ctx) {
    const incomeType = await strapi.services["income-types"].findOne({
      id: ctx.params.id,
      "user.id": ctx.state.user.id,
    });

    if (!incomeType) {
      return ctx.unauthorized(
        `This type doesn't exist or belongs to another user.`
      );
    }

    return sanitizeEntity(incomeType, { model: strapi.models["income-types"] });
  },

  // Create income-types by getting an array of object "type" in request.body
  async create(ctx) {
    const user = ctx.state.user;
    const types = ctx.request.body;

    const incomeTypesUser = await strapi.services["income-types"].find({
      "user.id": user.id,
    });

    const checkPreviousTypes = incomeTypesUser.filter((incType) =>
      types.some((type) => type.type === incType.type)
    );

    // check if user has inserted repeated type before
    if (checkPreviousTypes.length > 0) {
      const repeatedTypes = checkPreviousTypes
        .map((type) => type.type)
        .join(", ");
      return ctx.badRequest(
        `You cannot repeat ${repeatedTypes} in your income types`
      );
    }

    const entities = Promise.all(
      types.map(async (t) => {
        t.user = ctx.state.user.id;
        const entity = await strapi.services["income-types"].create(t);
        return sanitizeEntity(entity, { model: strapi.models["income-types"] });
      })
    );
    return entities;
  },

  // update one income type
  async update(ctx) {
    const { id } = ctx.params;
    const { type } = ctx.request.body;

    const incomeTypes = await strapi.services["income-types"].findOne({
      id: ctx.params.id,
      "user.id": ctx.state.user.id,
    });

    if (!incomeTypes) {
      return ctx.unauthorized(
        `This entry doesn't exist or belongs to another user`
      );
    }

    const entity = await strapi.services["income-types"].update(
      { id },
      { type }
    );

    return sanitizeEntity(entity, { model: strapi.models["income-types"] });
  },

  async delete(ctx) {
    const { id } = ctx.params;

    const incomeTypes = await strapi.services["income-types"].findOne({
      id: ctx.params.id,
      "user.id": ctx.state.user.id,
    });

    if (!incomeTypes) {
      return ctx.unauthorized(
        `This entry doesn't exist or belongs to another user`
      );
    }

    const entity = await strapi.services["income-types"].delete({ id });

    return sanitizeEntity(entity, { model: strapi.models["income-types"] });
  },
};
