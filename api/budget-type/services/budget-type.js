"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

module.exports = {
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
