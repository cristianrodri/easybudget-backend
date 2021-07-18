"use strict";

/**
 * Upload.js controller
 *
 */

const _ = require("lodash");
const adminUploadController = require("strapi-plugin-upload/controllers/upload/admin");
const apiUploadController = require("strapi-plugin-upload/controllers/upload/api");
const { sanitizeEntity } = require("strapi-utils/lib");

const resolveController = (ctx) => {
  const {
    state: { isAuthenticatedAdmin },
  } = ctx;

  return isAuthenticatedAdmin ? adminUploadController : apiUploadController;
};

const sanitize = (data, options = {}) => {
  return sanitizeEntity(data, {
    model: strapi.getModel("file", "upload"),
    ...options,
  });
};

module.exports = {
  async upload(ctx) {
    const userId = ctx.state?.user.id;
    const refId = +ctx.request.body.refId;
    console.log(userId, refId);

    if (!ctx.state?.user) {
      return ctx.badRequest(null, [
        { messages: [{ id: "No authorization header was found" }] },
      ]);
    }

    // only add or update file on your own account
    if (userId !== refId) {
      return ctx.unauthorized(
        "You are not allowed to add or update file on user " + refId
      );
    }

    const isUploadDisabled =
      _.get(strapi.plugins, "upload.config.enabled", true) === false;

    if (isUploadDisabled) {
      throw strapi.errors.badRequest(null, {
        errors: [
          { id: "Upload.status.disabled", message: "File upload is disabled" },
        ],
      });
    }

    const {
      query: { id },
      request: { files: { files } = {} },
    } = ctx;
    const controller = resolveController(ctx);

    if (id && (_.isEmpty(files) || files.size === 0)) {
      return controller.updateFileInfo(ctx);
    }

    if (_.isEmpty(files) || files.size === 0) {
      throw strapi.errors.badRequest(null, {
        errors: [{ id: "Upload.status.empty", message: "Files are empty" }],
      });
    }

    await (id ? controller.replaceFile : controller.uploadFiles)(ctx);
  },
  async destroy(ctx) {
    const { id: userId } = ctx.state?.user;
    const {
      params: { id },
    } = ctx;

    const file = await strapi.plugins["upload"].services.upload.fetch({ id });

    if (!file) {
      return ctx.notFound("file.notFound");
    }

    const relatedId = file.related?.[0]?.id;
    const isAdmin = ctx.state?.admin;

    if (userId !== relatedId && !isAdmin) {
      return ctx.unauthorized(
        "You are not allowed to delete file on user " + relatedId
      );
    }

    await strapi.plugins["upload"].services.upload.remove(file);

    ctx.body = sanitize(file);
  },
};
