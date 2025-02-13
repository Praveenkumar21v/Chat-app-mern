const UserModel = require("../models/UserModel");
const nodemailer = require("nodemailer");
const bcryptjs = require("bcryptjs");

let otpStore = {};
let emailStore = {}; 

async function generateOtp(request, response) {
    try {
        const { email } = request.body;

        const user = await UserModel.findOne({ email });
        if (!user) {
            return response.status(400).json({
                message: "User  not found",
                error: true,
            });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString(); 
        otpStore[email] = otp; 

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER, 
                pass: process.env.EMAIL_PASS,
            },
        });
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Your OTP Code",
            text: `Your OTP code is ${otp}. It is valid for 10 minutes.`,
        };

        await transporter.sendMail(mailOptions);

        return response.status(200).json({
            message: "OTP sent to your email",
            success: true,
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
        });
    }
}

async function verifyOtp(request, response) {
    try {
        const { otp } = request.body;

        const email = Object.keys(otpStore).find(email => otpStore[email] === otp);
        if (!email) {
            return response.status(400).json({
                message: "Invalid or expired OTP",
                error: true,
            });
        }
        delete otpStore[email];

        emailStore[email] = email; 

        return response.status(200).json({
            message: "OTP verified successfully",
            success: true,
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
        });
    }
}

async function updatePassword(request, response) {
    try {
        const { newPassword } = request.body; 

        const email = Object.keys(emailStore)[0]; 
        if (!email) {
            return response.status(400).json({
                message: "No email found. Please verify OTP first.",
                error: true,
            });
        }

        const user = await UserModel.findOne({ email });
        if (!user) {
            return response.status(400).json({
                message: "User  not found",
                error: true,
            });
        }

        if (!newPassword || newPassword.length < 6) {
            return response.status(400).json({
                message: "Password must be at least 6 characters long",
                error: true,
            });
        }

        const salt = await bcryptjs.genSalt(10);
        const hashPassword = await bcryptjs.hash(newPassword, salt);

        user.password = hashPassword; 
        await user.save(); 

        delete emailStore[email]; 

        return response.status(200).json({
            message: "Password updated successfully",
            success: true,
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
        });
    }
}

module.exports = {
    generateOtp,
    verifyOtp,
    updatePassword,
};