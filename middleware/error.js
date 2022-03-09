const ErrorHandler = require("../utils/errorhandler")



module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.message = err.message || "Internal server Error";

    // Wrong Mongodb ID error
    if (err.name === "castError") {
        const message = `resource not found invalid: ${err.path}`;
        err = new ErrorHandler(message, 400)
    }

    // Mongoose duplicate key error
    if (err.code === 11000) {
        const message = `Duplicate ${object.keys(err.keyValue)} Entered`;
        err = new ErrorHandler(message, 400)
    }

    // Wrong JWT error
    if (err.name === "JsonWebTokenError") {
        const message = `Json web token is invalid, try again`;
        err = new ErrorHandler(message, 400)
    }

    // Wrong Expire error
    if (err.name === "JsonWebExpiredError") {
        const message = `Json web token is Expired, try again`;
        err = new ErrorHandler(message, 400)
    }

    res.status(err.statusCode).json({
        status: "Fail",
        message: err.message,
        error: err.stack
    })
}