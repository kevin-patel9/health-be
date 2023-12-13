const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema(
    {
        phoneNumber: {
            type: String,
            required: [true, "Please enter a Phone number"],
            unique: [true, "Phone Number already exists"],
            index: true,
        },
        password: {
            type: String,
            required: [true, "Please enter a password"],
            minLength: [6, "Password must be atleast 6 characters"],
            select: false,
        },
        email: {
            type: String,
            required: [true, "Please enter a email"],
            index: true
        },
        otp: {
            type: Number
        }
    },
    { timestamps: true }
);

userSchema.pre("save", async function (next) {
    if (this.isModified("password")) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

userSchema.methods.matchPassword = async function (password) {
    return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateToken = function () {
    return jwt.sign({ _id: this._id }, "SECRETKEY");
};

module.exports = mongoose.model("User", userSchema);
