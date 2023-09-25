const connection = require('../service/db');
const { isEmpty } = require('../utils/object_isEmpty');
const AppError = require('../utils/error');
const bcrypt = require('bcryptjs');
const { USER_MODEL, USER_LOGIN_MODEL, FORGOT_PASSWORD_MODEL, RESET_PASSWORD_MODEL } = require('../validation_models/user');
const JWT = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const secretKey = 'your_secret_key';

exports.user_login = (req, res, next) => {

    if (isEmpty(req.body)) return next(new AppError('form data not found', 400));

    try {

        const { error } = USER_LOGIN_MODEL.validate(req.body);

        if (error) return next(new AppError(error.details[0].message, 400));

        connection.query("SELECT * FROM user WHERE email = ?", [[req.body.email]], async (err, data, fields) => {
            if (err) return next(new AppError(err, 500));

            if (!data.length) return next(new AppError("email or password invalid", 400));

            const isMatch = await bcrypt.compare(req.body.password, data[0].password);

            if (!isMatch) return next(new AppError("email or password invalid", 400));

            const token = JWT.sign({ id: data[0].id, email: data[0].email }, secretKey, { expiresIn: "1d" });

            res.json({
                data: "Login successful",
                token: token
            })

        })

    }
    catch (err) {
        return next(new AppError(err, 500));
    }

}

exports.user_register = (req, res, next) => {

    if (isEmpty(req.body)) return next(new AppError('form data not found', 400));

    try {

        const { error } = USER_MODEL.validate(req.body);

        if (error) return next(new AppError(error.details[0].message, 400));

        connection.query("SELECT * FROM user WHERE email = ?", [[req.body.email]], async (err, data, fields) => {
            if (err) return next(new AppError(err, 500));

            if (data.length) {
                return next(new AppError("Email is already used", 400))
            }

            const solt = await bcrypt.genSalt(10);

            const hashedPassword = await bcrypt.hash(req.body.password, solt);

            connection.query("INSERT INTO user (id, email, password, otp, otpExpire) VALUES(null, ?)", [[req.body.email, hashedPassword, null, null]], (err, data, fields) => {
                if (err) return next(new AppError(err, 500));

                res.json({
                    data: "Registration successful"
                })
            })

        })

    }
    catch (err) {
        return next(new AppError(err, 500));
    }

}

exports.user_forgotPassword = (req, res, next) => {

    if (isEmpty(req.body)) return next(new AppError('form data not found', 400));

    try {

        const { error } = FORGOT_PASSWORD_MODEL.validate(req.body);

        if (error) return next(new AppError(error.details[0].message, 400));

        connection.query("SELECT * FROM user WHERE email = ?", [[req.body.email]], async (err, data1, fields) => {
            if (err) return next(new AppError(err, 500));

            if (data1.length == 0) {
                return next(new AppError("user not exist", 400))
            }

            const otp = Math.floor(1000 + Math.random() * 9000);

            const otpExpier = new Date();
            otpExpier.setMinutes(otpExpier.getMinutes() + 1);

            connection.query("UPDATE user SET otp = ?, otpExpire = ? WHERE email = ?", [otp, otpExpier, req.body.email], (err, data2, fields) => {
                if (err) return next(new AppError(err, 500));

                const transporter = nodemailer.createTransport({
                    service: 'Gmail',
                    auth: {
                        user: 'example@gmail.com',
                        pass: '*****************',
                    },
                });

                const mailOptions = {
                    from: 'example@gmail.com',
                    to: req.body.email,
                    subject: 'Password reset OTP',
                    text: `Your OTP (It is expired after 1 min) : ${otp}`,
                };

                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        return next(new AppError(error, 500));
                    } else {
                        res.json({
                            data: "Your OTP send to the email"
                        })
                    }
                });

            })

        })

    }
    catch (err) {
        return next(new AppError(err, 500));
    }
}

exports.user_resetPassword = (req, res, next) => {

    const body = req.body;
    const password = body.password;
    const confirmPassword = body.confirmPassword;

    if (isEmpty(body)) return next(new AppError('form data not found', 400));

    try {

        const { error } = RESET_PASSWORD_MODEL.validate(body);

        if (error) return next(new AppError(error.details[0].message, 400));

        if (password.localeCompare(confirmPassword) != 0) return next(new AppError('passwords are not equal', 400));

        connection.query("SELECT * FROM user WHERE otp = ? AND otpExpire > NOW()", [[body.otp]], async (err, data, fields) => {
            if (err) return next(new AppError(err, 500));

            if (data.length == 0) return next(new AppError('Invalid or expired OTP', 400));

            const solt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, solt);

            connection.query("UPDATE user SET password = ?, otp = null, otpExpire = null WHERE otp = ?", [hashedPassword, body.otp], async (err, data, fields) => {
                if (err) return next(new AppError(err, 500));

                res.json({
                    data: 'Password reset successful'
                })

            })

        })

    }
    catch (err) {
        return next(new AppError(err, 500));
    }

}