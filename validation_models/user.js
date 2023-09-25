const Joi = require('@hapi/joi');

exports.USER_MODEL = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).max(100).required()
})

exports.USER_LOGIN_MODEL = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
})

exports.FORGOT_PASSWORD_MODEL = Joi.object({
    email: Joi.string().email().required()
})

exports.RESET_PASSWORD_MODEL = Joi.object({
    password: Joi.string().min(8).max(100).required(),
    confirmPassword: Joi.string().min(8).max(100).required(),
    otp: Joi.number().required()
})