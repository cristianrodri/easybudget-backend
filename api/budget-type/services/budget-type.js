"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

const { isDraft } = require("strapi-utils").contentTypes;

module.exports = {
  async create(data) {
    const isDraftChecked = isDraft(data, strapi.models["budget-type"]);
    const validData = await strapi.entityValidator.validateEntityCreation(
      strapi.models["budget-type"],
      data,
      { isDraftChecked }
    );

    const entry = await strapi.query("budget-type").create(validData);

    return this.findOne({ id: entry.id }, []);
  },
  async update(params, data) {
    await strapi.query("budget-type").update(params, data);

    // after updating get data without user and budget collections
    return strapi.query("budget-type").findOne(params, []);
  },
  find(params) {
    return strapi.query("budget-type").find(params, []);
  },
  findOne(params) {
    return strapi.query("budget-type").findOne(params, []);
  },
};
