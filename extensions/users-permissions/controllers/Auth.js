'use strict'

/**
 * Auth.js controller
 *
 * @description: A set of functions called "actions" for managing `Auth`.
 */

/* eslint-disable no-useless-escape */
const _ = require('lodash')
const { sanitizeEntity } = require('strapi-utils')
const validator = require('email-validator')

const formatError = (error) => [
  { messages: [{ id: error.id, message: error.message, field: error.field }] }
]

module.exports = {
  async callback(ctx) {
    const provider = ctx.params.provider || 'local'
    const params = ctx.request.body

    const store = await strapi.store({
      environment: '',
      type: 'plugin',
      name: 'users-permissions'
    })

    if (provider === 'local') {
      if (!_.get(await store.get({ key: 'grant' }), 'email.enabled')) {
        return ctx.badRequest(null, 'This provider is disabled.')
      }

      // The identifier is required.
      if (!params.identifier) {
        return ctx.badRequest(
          null,
          formatError({
            id: 'Auth.form.error.email.provide',
            message: 'Please provide your username or your e-mail.'
          })
        )
      }

      // The password is required.
      if (!params.password) {
        return ctx.badRequest(
          null,
          formatError({
            id: 'Auth.form.error.password.provide',
            message: 'Please provide your password.'
          })
        )
      }

      const query = { provider }

      // Check if the provided identifier is an email or not.
      const isEmail = validator.validate(params.identifier)

      // Set the identifier to the appropriate query field.
      if (isEmail) {
        query.email = params.identifier.toLowerCase()
      } else {
        query.username = params.identifier
      }

      const today = new Date()
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
      const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1)

      // Check if the user exists.
      const result = await strapi
        .query('user', 'users-permissions')
        .model.query((qb) => {
          qb.where(
            isEmail ? 'email' : 'username',
            isEmail ? query.email : query.username
          )
        })
        .fetch({
          withRelated: [
            {
              budgets: (qb) => {
                qb.where('date', '>=', firstDayOfMonth).andWhere(
                  'date',
                  '<',
                  nextMonth
                )
              },
              categories: (qb) => {
                qb.column()
              },
              avatar: (qb) => {
                qb.column()
              }
            }
          ]
        })

      const user = result?.toJSON()

      if (!user) {
        return ctx.badRequest(
          null,
          formatError({
            id: 'Auth.form.error.invalid',
            message: 'User not found.'
          })
        )
      }

      if (
        _.get(await store.get({ key: 'advanced' }), 'email_confirmation') &&
        user.confirmed !== true
      ) {
        return ctx.badRequest(
          null,
          formatError({
            id: 'Auth.form.error.confirmed',
            message: 'Your account email is not confirmed'
          })
        )
      }

      if (user.blocked === true) {
        return ctx.badRequest(
          null,
          formatError({
            id: 'Auth.form.error.blocked',
            message: 'Your account has been blocked by an administrator'
          })
        )
      }

      // The user never authenticated with the `local` provider.
      if (!user.password) {
        return ctx.badRequest(
          null,
          formatError({
            id: 'Auth.form.error.password.local',
            message:
              'This user never set a local password, please login with the provider used during account creation.'
          })
        )
      }

      const validPassword = await strapi.plugins[
        'users-permissions'
      ].services.user.validatePassword(params.password, user.password)

      if (!validPassword) {
        return ctx.badRequest(
          null,
          formatError({
            id: 'Auth.form.error.invalid',
            message: 'Invalid password.'
          })
        )
      } else {
        ctx.send({
          jwt: strapi.plugins['users-permissions'].services.jwt.issue({
            id: user.id
          }),
          user: sanitizeEntity(user.toJSON ? user.toJSON() : user, {
            model: strapi.query('user', 'users-permissions').model
          })
        })
      }
    } else {
      if (!_.get(await store.get({ key: 'grant' }), [provider, 'enabled'])) {
        return ctx.badRequest(
          null,
          formatError({
            id: 'provider.disabled',
            message: 'This provider is disabled.'
          })
        )
      }

      // Connect the user with the third-party provider.
      let user
      let error
      try {
        [user, error] = await strapi.plugins[
          'users-permissions'
        ].services.providers.connect(provider, ctx.query)
      } catch ([user, error]) {
        return ctx.badRequest(null, error === 'array' ? error[0] : error)
      }

      if (!user) {
        return ctx.badRequest(null, error === 'array' ? error[0] : error)
      }

      ctx.send({
        jwt: strapi.plugins['users-permissions'].services.jwt.issue({
          id: user.id
        }),
        user: sanitizeEntity(user.toJSON ? user.toJSON() : user, {
          model: strapi.query('user', 'users-permissions').model
        })
      })
    }
  },
  async register(ctx) {
    // if some not accepted property is passed into ctx.request.body, every method return stop returning false
    const allowedUpdates = Object.keys(ctx.request.body).every((prop) =>
      ['username', 'email', 'password'].includes(prop)
    )

    if (!allowedUpdates) {
      return ctx.badRequest(
        'You just need to include email, username and password'
      )
    }

    const pluginStore = await strapi.store({
      environment: '',
      type: 'plugin',
      name: 'users-permissions'
    })

    const settings = await pluginStore.get({
      key: 'advanced'
    })

    if (!settings.allow_register) {
      return ctx.badRequest(
        null,
        formatError({
          id: 'Auth.advanced.allow_register',
          message: 'Register action is currently disabled.'
        })
      )
    }

    const params = {
      ..._.omit(ctx.request.body, [
        'confirmed',
        'confirmationToken',
        'resetPasswordToken'
      ]),
      provider: 'local'
    }

    // Password is required.
    if (!params.password) {
      return ctx.badRequest(
        null,
        formatError({
          id: 'Auth.form.error.password.provide',
          message: 'Please provide your password.'
        })
      )
    }

    // Email is required.
    if (!params.email) {
      return ctx.badRequest(
        null,
        formatError({
          id: 'Auth.form.error.email.provide',
          message: 'Please provide your email.'
        })
      )
    }

    // Throw an error if the password selected by the user
    // contains more than three times the symbol '$'.
    if (
      strapi.plugins['users-permissions'].services.user.isHashed(
        params.password
      )
    ) {
      return ctx.badRequest(
        null,
        formatError({
          id: 'Auth.form.error.password.format',
          message:
            'Your password cannot contain more than three times the symbol `$`.'
        })
      )
    }

    // Throw an error if password has less than 8 characters.
    if (params.password.length < 8) {
      return ctx.badRequest(
        null,
        formatError({
          id: 'Auth.form.error.password.format',
          message: 'Your password must contain at least 8 characters'
        })
      )
    }

    const role = await strapi
      .query('role', 'users-permissions')
      .findOne({ type: settings.default_role }, [])

    if (!role) {
      return ctx.badRequest(
        null,
        formatError({
          id: 'Auth.form.error.role.notFound',
          message: 'Impossible to find the default role.'
        })
      )
    }

    // Check if the provided email is valid or not.
    const isEmail = validator.validate(params.email)

    if (isEmail) {
      params.email = params.email.toLowerCase()
    } else {
      return ctx.badRequest(
        null,
        formatError({
          id: 'Auth.form.error.email.format',
          message: 'Please provide valid email address.'
        })
      )
    }

    params.role = role.id
    params.password = await strapi.plugins[
      'users-permissions'
    ].services.user.hashPassword(params)

    const user = await strapi.query('user', 'users-permissions').findOne({
      email: params.email
    })

    if (user && user.provider === params.provider) {
      return ctx.badRequest(
        null,
        formatError({
          id: 'Auth.form.error.email.taken',
          message: 'Email is already taken.'
        })
      )
    }

    if (user && user.provider !== params.provider && settings.unique_email) {
      return ctx.badRequest(
        null,
        formatError({
          id: 'Auth.form.error.email.taken',
          message: 'Email is already taken.'
        })
      )
    }

    try {
      if (!settings.email_confirmation) {
        params.confirmed = true
      }

      const user = await strapi
        .query('user', 'users-permissions')
        .create(params)

      const sanitizedUser = sanitizeEntity(user, {
        model: strapi.query('user', 'users-permissions').model
      })

      if (settings.email_confirmation) {
        try {
          await strapi.plugins[
            'users-permissions'
          ].services.user.sendConfirmationEmail(user)
        } catch (err) {
          return ctx.badRequest(null, err)
        }

        return ctx.send({ user: sanitizedUser })
      }

      const jwt = strapi.plugins['users-permissions'].services.jwt.issue(
        _.pick(user, ['id'])
      )

      return ctx.send({
        jwt,
        user: sanitizedUser
      })
    } catch (err) {
      ctx.badRequest(
        null,
        formatError({
          id: 'Auth.form.error.username.taken',
          message: 'Username already taken'
        })
      )
    }
  }
}
