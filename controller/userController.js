const ErrorHandler = require("../utils/errorhandler");
const catchAsyncErrors = require("../middleware/catchAsyncError");
const User = require("../models/userModel");
const sendToken = require("../utils/jwtToken")
const sendEmail = require("../utils/sendEmail")
const crypto = require("crypto");

// Register a user
exports.registerUser = catchAsyncErrors(async (req, res, next) => {
    const { name, email, password } = req.body
    const user = await User.create({
        name,
        email,
        password,
        avatar: {
            public_id: "this is a sample id",
            url: "profilepicUrl"
        }
    })

    sendToken(user, 201, res)
})

// Login User

exports.loginUser = catchAsyncErrors(async (req, res, next) => {
    const { email, password } = req.body;

    //checking if user has given password and email both

    if (!email || !password) {
        return next(new ErrorHandler("please Enter the valide email and password", 400))
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
        return next(new ErrorHandler("invalid email or password", 401))
    }//401 unautherised

    const isPasswordMatched = user.comparePassword(password)
    if (!isPasswordMatched) {
        return next(new ErrorHandler("invalid email or password", 401))
    }

    sendToken(user, 200, res)
})

// logout User
exports.logoutUser = catchAsyncErrors(async (req, res, next) => {

    res.cookie("token", null, {
        expires: new Date(Date.now()),
        httpOnly: true,
    });

    res.status(200).json({
        status: "success",
        message: "logged out"
    })
})

// Forgot Password 
exports.forgotPassword = catchAsyncErrors(async (req, res, next) => {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
        return next(new ErrorHandler("user is not defined", 404));
    }

    //get resetPassword Token
    const resetToken = user.getResetPasswordToken();

    await user.save({ validateBeforSave: false });

    const resetPasswordUrl = `${req.protocol}://${req.get("host")}/api/v1/password/reset/${resetToken}`

    const message = `Your password reset token is :- \n\n ${resetPasswordUrl} \n\n If you have not request this email then, Please ignor it `;

    console.log(user.email)

    try {

        await sendEmail({
            email: user.email,
            subject: `Ecommerce password recovery`,
            message,

        });

        res.status(200).json({
            status: "success",
            message: `Email is send to ${user.email} successfully`
        })

    } catch (error) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save({ validateBeforSave: false });

        return next(new ErrorHandler(error.message, 500))
    }

})

// Reset Password
exports.resetPassword = catchAsyncErrors(async (req, res, next) => {
    // creating token hash
    const resetPasswordToken = crypto
        .createHash("sha256")
        .update(req.params.token)
        .digest("hex");

    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
        return next(new ErrorHandler("Reset password token is invalid or has been expired", 404));
    }

    if (req.body.password !== req.body.confirmPassword) {
        return next(new ErrorHandler("Password does not match", 404));
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    sendToken(user, 200, res)

})


// Get USer Detail
exports.getUserDetails = catchAsyncErrors(async (req, res, next) => {
    const user = await User.findById(req.user.id)

    res.status(200).json({
        status: "success",
        user
    })
})

// Update User Password
exports.updatePassword = catchAsyncErrors(async (req, res, next) => {
    const user = await User.findById(req.user.id).select("+password");

    const isPasswordMatched = await user.comparePassword(req.body.oldPassword);

    if (!isPasswordMatched) {
        return next(new ErrorHandler("old password is not correct", 400))
    }

    if (req.body.newPassword !== req.body.confirmPassword) {
        return next(new ErrorHandler("password does not match", 400))
    }

    user.password = req.body.newPassword;

    await user.save();

    sendToken(user, 200, res)

})

// Update User Profile
exports.updateProfile = catchAsyncErrors(async (req, res, next) => {
    const newUserData = {
        name: req.body.name,
        email: req.body.email,
    };

    // We will add cloudinary later

    const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
        new: true,
        runValidators: true,
        userFindAndModify: false,
    });

    res.status(200).json({
        status: "success"
    })
})

// Get all users(admin)
exports.getAllUser = catchAsyncErrors(async (req, res, next) => {
    const users = await User.find();
    res.status(200).json({
        status: "success",
        users
    })
})

// Get single user(admin)
exports.getSingleUser = catchAsyncErrors(async (req, res, next) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        return next(new ErrorHandler(`user does not exist with id: ${req.params.id}`))
    }

    res.status(200).json({
        status: "success",
        user
    })
})

// Update User Role --Admin
exports.updateUserRole = catchAsyncErrors(async (req, res, next) => {
    const newUserData = {
        name: req.body.name,
        email: req.body.email,
        role: req.body.role,
    }

    const user = await User.findByIdAndUpdate(req.params.id, newUserData, {
        new: true,
        runValidators: true,
        userFindAndModify: false,
    })

    res.status(200).json({
        status: "success"
    })
})

// Delete User  --Admin
exports.deleteUser = catchAsyncErrors(async (req, res, next) => {
    const user = await User.findById(req.params.id)

    if (!user) {
        return next(
            new ErrorHandler(`User does not exist with id ${req.params.id}`, 400)
        )
    }
    await user.remove();

    res.status(200).json({
        status: "success",
        message: "user deleted successfully"
    })
})
