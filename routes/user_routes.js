const express = require('express');
const { user_register, user_login, user_forgotPassword, user_resetPassword } = require('../controller/user_controller');

const router = express.Router();

router.route("/register").post(user_register);
router.route("/login").post(user_login);
router.route("/forgotPassword").post(user_forgotPassword);
router.route("/resetPassword").post(user_resetPassword);

module.exports = router;