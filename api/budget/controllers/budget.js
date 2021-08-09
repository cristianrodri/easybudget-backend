"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

const { sanitizeEntity } = require("strapi-utils");

const unauthorizedMessage = `This budget doesn't exist or belongs to another user.`;

module.exports = {
  // Get logged user budget-type
  async find(ctx) {
    const user = ctx.state.user;

    const entity = await strapi.services.budget.find({
      "user.id": user.id,
    });
    return sanitizeEntity(entity, { model: strapi.models.budget });
  },

  // Get one income type by id
  async findOne(ctx) {
    const budget = await strapi.services.budget.findOne({
      id: ctx.params.id,
      "user.id": ctx.state.user.id,
    });

    if (!budget) {
      return ctx.unauthorized(unauthorizedMessage);
    }

    return sanitizeEntity(budget, { model: strapi.models.budget });
  },

  // Create budget
  async create(ctx) {
    const user = ctx.state.user;
    const budgetTypeId = ctx.request.body.budget_type;

    const budgetType = await strapi.services["budget-type"].findOne({
      id: budgetTypeId,
      "user.id": user.id,
    });

    if (!budgetType) {
      return ctx.unauthorized(
        "You cannot create budget on budget_type with id " + budgetTypeId
      );
    }

    ctx.request.body.user = user.id;
    const entity = await strapi.services.budget.create(ctx.request.body);
    return sanitizeEntity(entity, { model: strapi.models.budget });
  },

  // update one income type
  async update(ctx) {
    const { id } = ctx.params;
    const user = ctx.state.user;
    const budgetTypeId = ctx.request.body?.["budget_type"];

    const budget = await strapi.services.budget.findOne({
      id: ctx.params.id,
      "user.id": user.id,
    });

    if (!budget) {
      return ctx.unauthorized(unauthorizedMessage);
    }

    // If budget type is provided in request.body, check if exist, otherwise return error
    if (budgetTypeId) {
      const budgetType = await strapi.services["budget-type"].findOne({
        id: budgetTypeId,
        "user.id": user.id,
      });

      if (!budgetType)
        return ctx.badRequest(
          "You cannot move this budget in budget-type with id " + budgetTypeId
        );
    }

    const entity = await strapi.services.budget.update(
      { id },
      ctx.request.body
    );

    return sanitizeEntity(entity, { model: strapi.models.budget });
  },

  async delete(ctx) {
    const { id } = ctx.params;

    const budget = await strapi.services.budget.findOne({
      id: ctx.params.id,
      "user.id": ctx.state.user.id,
    });

    if (!budget) {
      return ctx.unauthorized(unauthorizedMessage);
    }

    const entity = await strapi.services.budget.delete({ id });

    return sanitizeEntity(entity, { model: strapi.models.budget });
  },
  count(ctx) {
    return strapi.services.budget.count({
      "user.id": ctx.state.user.id,
    });
  },
};
