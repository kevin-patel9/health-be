const User = require("../models/User");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const twilio = require("twilio");

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASS
    }
});

// Function to send OTP via email
function sendOTPEmail(email, otp) {
    const mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: 'Your OTP for Verification',
        text: `Your OTP is: ${otp}. Please use this OTP to Login.`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending OTP:', error);
        } else {
            console.log('OTP sent:', info.response);
        }
    });
}

const generateRandomOTP = () => {
    const numbers = "023456789";
    let randomOTP = "";

    randomOTP += numbers.charAt(Math.floor(Math.random() * numbers.length));

    const characters = numbers;

    for (let i = 1; i < 4; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        randomOTP += characters.charAt(randomIndex);
    }

    randomOTP = randomOTP
        .split("")
        .sort(() => 0.5 - Math.random())
        .join("");

    return randomOTP;
};

const sendOTPSMS = async (phoneNumber, otp) => {
    const accountSid = process.env.SID;
    const authToken =   process.env.TOKEN;
    const client = twilio(accountSid, authToken);

    const toPhoneNumber = `+91${phoneNumber}`; // Replace with recipient's phone number
    const generatedOTP = otp; // Replace with the generated OTP

    try {
        const message = await client.messages.create({
            body: `Your OTP is: ${generatedOTP}. Use it to login to your account.`,
            from: process.env.PHONE,
            to: toPhoneNumber,
        });
    
        console.log('OTP sent successfully:', message.sid);
    } catch (error) {
        console.error('Error sending OTP:', error);
    }
};

exports.register = async (req, res) => {
    try {
        const { password, phoneNumber, email } = req.body;
        
        const checkPhoneNumberExist = await User.findOne({ phoneNumber });

        if (checkPhoneNumberExist) {
            return res.status(400).send({
                success: false,
                message: "User already exist. Try another unique Phone Number",
            });
        }

        const newUser = { 
            password,
            phoneNumber,
            email
        };

        const user = await User.create(newUser);

        const token = await user.generateToken();
        const options = {
            expires: new Date(Date.now() + 360 * 24 * 60 * 1000),
            httpOnly: true,
        };

        return res.status(201).cookie("token", token, options).send({
            success: true,
            user,
            token,
        });
    } catch (err) {
        res.status(500).send({
            success: false,
            message: err.message,
        });
    }
};

exports.loginEmail = async (req, res) => {

    try {
        let { email, password } = req.body;

        const user = await User.findOne({ email }).select("+password");
        if (!user) {
            return res.status(400).send({
                success: false,
                message: "User does not exist",
            });
        }

        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            return res.status(400).send({
                success: false,
                message: "Invalid password",
            });
        }

        const token = await user.generateToken();
        const options = {
            expires: new Date(Date.now() + 360 * 24 * 60 * 60 * 1000),
            httpOnly: true,
        };

        return res.status(200).cookie("token", token, options).send({
            success: true,
            user,
            token
        });
    } catch (err) {
        return res.status(500).send({
            success: false,
            message: err.message,
        });
    }
};

exports.sendOTP = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).send({
                success: false,
                message: "User does not exist",
            });
        }
        
        const otp = generateRandomOTP();
        user.otp = otp;
        await user.save();

        sendOTPEmail(email, otp);

        return res.status(200).send({
            success: true,
        });
    } catch (err) {
        return res.status(500).send({
            success: false,
            message: err.message,
        });
    }
}

exports.sendOTPForPhone = async (req, res) => {
    try {
        const { phoneNumber } = req.body;

        const user = await User.findOne({ phoneNumber });
        if (!user) {
            return res.status(400).send({
                success: false,
                message: "User does not exist",
            });
        }
        
        const otp = generateRandomOTP();
        user.otp = otp;
        await user.save();

        sendOTPSMS(phoneNumber, otp);

        return res.status(200).send({
            success: true,
        });
    } catch (err) {
        return res.status(500).send({
            success: false,
            message: err.message,
        });
    }
}

exports.verifyEmail = async (req, res) => {
    try {
        const { email, otp, phoneNumber } = req.body;

        const user = await User.findOne({ 
            $or: [{ email }, {phoneNumber}]
        });

        if (!user) {
            return res.status(400).send({
                success: false,
                message: "User does not exist",
            });
        }

        if (Number(otp) !== user.otp){
            return res.status(400).send({
                success: false,
                message: "Invalid OTP",
            });
        }

        user.otp = "2903";
        await user.save();

        return res.status(200).send({
            success: true,
            message: "Valid OTP"
        });
    } catch (err) {
        return res.status(500).send({
            success: false,
            message: err.message,
        });
    }
}

exports.verifyPhoneNumber = async (req, res) => {
    try {
        const { phoneNumber, otp } = req.body;

        const user = await User.findOne({ phoneNumber });
        if (!user) {
            return res.status(400).send({
                success: false,
                message: "User does not exist",
            });
        }

        if (Number(otp) !== user.otp){
            return res.status(400).send({
                success: false,
                message: "Invalid OTP",
            });
        }

        user.otp = "2903";
        await user.save();

        return res.status(200).send({
            success: true,
            message: "Valid OTP"
        });
    } catch (err) {
        return res.status(500).send({
            success: false,
            message: err.message,
        });
    }
}

exports.updatePassword = async (req, res) => {
    try {
        const { email, newPassword, confirmPassword, phoneNumber } = req.body;
        
        if (!confirmPassword || !newPassword) {
            return res.status(400).send({
                success: false,
                message: "Both new and confirm password are required",
            });
        }

        if (newPassword !== confirmPassword){
            return res.status(400).send({
                success: false,
                message: "Invalid Confirm Password",
            });
        }

        const user = await User.findOne({ 
            $or: [{email}, {phoneNumber}]
        }).select("+password");

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        return res.status(200).send({
            success: true,
            message: "Password updated",
        });
        } catch (err) {
            return res.status(500).send({
                success: false,
                message: err.message,
        });
    }
};

exports.logout = async (req, res) => {
    try {
        return res.status(200)
                .cookie("token", null, { expires: new Date(Date.now()), httpOnly: true })
                .send({
                    success: true,
                    message: "Logged out",
                });
    } catch (err) {
        return res.status(500).send({
            message: err.message,
        });
    }
};
