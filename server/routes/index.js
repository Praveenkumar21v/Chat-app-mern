const express = require('express');
const registerUser = require('../controller/registerUser');
const checkEmail = require('../controller/checkEmail');
const checkPassword = require('../controller/checkPassword');
const userDetails = require('../controller/userDetails');
const logout = require('../controller/logout');
const updateUserDetails = require('../controller/updateUserDetails');
const searchUser = require('../controller/searchUser');
const { generateOtp, verifyOtp, updatePassword } = require('../controller/forgotPassword');
const clearChat = require('../controller/clearChat');
const authenticateUser  = require('../helpers/authenticateUser');
const router = express.Router()

router.post('/register',registerUser)
router.post('/email',checkEmail)
router.post('/password',checkPassword)
router.get('/user-details',userDetails)
router.get('/logout',logout)
router.post('/update-user',updateUserDetails)
router.post("/search-user",searchUser)
router.post('/forgot-password/generate-otp', generateOtp);
router.post('/forgot-password/verify-otp', verifyOtp);
router.post('/forgot-password/update-password', updatePassword);
router.delete('/clear-chat/:userId',authenticateUser, clearChat);

module.exports = router;