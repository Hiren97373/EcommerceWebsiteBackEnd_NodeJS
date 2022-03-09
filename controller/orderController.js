const Order = require("../models/orderModel")
const Product = require("../models/productModel");
const ErrorHandler = require("../utils/errorhandler");
const catchAsyncErrors = require("../middleware/catchAsyncError");


// create new product
exports.newOrder = catchAsyncErrors(async (req, res, next) => {
    const {
        shippingInfo,
        orderItems,
        paymentInfo,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice
    } = req.body;

    const order = await Order.create({
        shippingInfo,
        orderItems,
        paymentInfo,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
        paidAt: Date.now(),
        user: req.user._id
    })

    res.status(201).json({
        status: "success",
        order
    })
})

// Get Single Order
exports.getSingleOrder = catchAsyncErrors(async (req, res, next) => {
    const order = await Order.findById(req.params.id).populate("user", "name email");

    if (!order) {
        return next(new ErrorHandler("order not found with this id", 404))
    }

    res.status(200).json({
        status: "success",
        order,
    })
})

// get logged in user Orders
exports.myOrders = catchAsyncErrors(async (req, res, next) => {
    const orders = await Order.find({ user: req.user._id });

    res.status(200).json({
        status: "success",
        orders
    })
})

// get all orders --Admin
exports.getAllOrders = catchAsyncErrors(async (req, res, next) => {
    const orders = await Order.find();

    let totalAmount = 0;

    orders.forEach((order) => {
        totalAmount += order.totalPrice;
    });
    console.log(totalAmount)

    res.status(200).json({
        status: "success",
        totalAmount,
        orders
    })
})

// update Order status --Admin
exports.updateOrder = catchAsyncErrors(async (req, res, next) => {
    const order = await Order.findById(req.params.id);

    if (!order) {
        return next(new ErrorHandler("order not found with this Id", 404));

    }
    if (order.orderStatus === "Delivered") {
        return next(new ErrorHandler("You have already delivered this order", 400))
    }
    order.orderItems.forEach(async (o) => {
        await updateeStock(o.product, o.quantity);
    })
    order.orderStatus = req.body.status;
    if (req.body.status === "Delivered") {
        order.deliveredAt = Date.now();
    }
    await order.save({ validateBeforeSave: false });
    res.status(200).json({
        status: "success"
    })
})

async function updateeStock(id, quantity) {
    const product = await Product.findById(id);
    product.stock -= quantity;
    await product.save({ validateBeforeSave: false })
}

// delete order --Admin
exports.deleteOrder = catchAsyncErrors(async (req, res, next) => {
    const order = await Order.findById(req.params.id);

    if (!order) {
        return next(new ErrorHandler("order not found with this id", 404))
    }

    await order.remove();
    res.status(200).json({
        status: "success"
    })
})