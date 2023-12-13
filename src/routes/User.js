const express = require("express");
const { register, loginEmail, verifyEmail, logout, updatePassword, sendOTP, sendOTPForPhone, verifyPhoneNumber } = require("../controllers/User");

const router = express.Router();

router.post("/register", register);
router.post("/login", loginEmail);
router.post("/verifyEmail", verifyEmail);
router.post("/verifyPhoneNumber", verifyPhoneNumber);
router.post("/sendOtp", sendOTP);
router.post("/sendOTPForPhone", sendOTPForPhone);
router.post("/updatePassword", updatePassword);
router.post("/logout", logout);

module.exports = router;