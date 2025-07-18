const mongoose = require('mongoose');
const OrderProduct = require('../models/OrderProductModel');
const Product = require('../models/ProductModel'); 

// --- START: Add the new controller function ---
// Get all order products for a specific order ID
const getOrderProductsByOrderId = async (req, res) => {
    const { orderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
        return res.status(404).json({error: 'Invalid Order ID'});
    }    
    try {
        // ✅ FIX: Modified .populate() to fetch the fields that actually exist in your ProductModel.
        // This now correctly gets the main product image filename.
        const orderProducts = await OrderProduct.find({ order_id: orderId })
            .populate('product_id', 'product_name product_image product_image2 product_image3 product_image4 product_image5 product_image6 product_image7 product_image8 description');

        if (!orderProducts) {
            // Send an empty array if no products found, which is not an error
            return res.status(200).json([]);
        }

        res.status(200).json(orderProducts);
    } catch (error) {
        res.status(500).json({ error: 'Server error fetching order products' });
    }
}
// --- END: Add the new controller function ---

// Get all order products (for admin purposes, likely)
const getOrderProducts = async (req, res) => {
    const orderProducts = await OrderProduct.find({}).sort({createdAt: -1});

    res.status(200).json(orderProducts);
}

// Get a single order product by its own ID
const getOrderProduct = async (req, res) => {
    const {id} = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({error: 'Invalid order-product ID'});
    }

    const orderProduct = await OrderProduct.findById(id);

    if (!orderProduct) {
        return res.status(404).json({error: 'Order product not found'});
    }
    res.status(200).json(orderProduct);
}

// MODIFIED: Create a new order product AND update inventory
const createOrderProduct = async (req, res) => {
    const {
        order_id,
        product_id,
        order_qty,
        order_unit_price,
        order_type,
        order_shape,
        order_size,
        order_material,
        order_thickness
    } = req.body;
    
    try {
        const product = await Product.findById(product_id);
        if (!product) {
            return res.status(404).json({ error: 'Product not found. Cannot update inventory.' });
        }

        if (product.warehouse_quantity < order_qty) {
            return res.status(400).json({ 
                error: `Insufficient stock for product: ${product.product_name}. Available: ${product.warehouse_quantity}, Requested: ${order_qty}` 
            });
        }
        
        product.warehouse_quantity -= order_qty;
        await product.save();

        const orderProduct = await OrderProduct.create({
            order_id,
            product_id,
            order_qty,
            order_unit_price,
            order_type,
            order_shape,
            order_size,
            order_material,
            order_thickness
        });
        res.status(200).json(orderProduct);

    } catch (error) {
        console.error("Error creating order product and updating stock: ", error);
        res.status(500).json({error: `Server error while processing order item: ${error.message}`});
    }
}

const deleteOrderProduct = async (req, res) => {
    const {id} = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({error: 'Invalid order product ID'});
    }

    const orderProduct = await OrderProduct.findByIdAndDelete({_id: id});

    if (!orderProduct) {
        return res.status(404).json({error: 'Order product not found'});
    }
    res.status(200).json(orderProduct);
}

const updateOrderProduct = async (req, res) => {
    const {id} = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({error: 'Invalid order product ID'});
    }

    const orderProduct = await OrderProduct.findOneAndUpdate({_id: id}, {
        ...req.body
    });

    if (!orderProduct) {
        return res.status(404).json({error: 'Order product not found'});
    }

    res.status(200).json(orderProduct);
}

module.exports = {
    getOrderProductsByOrderId,
    getOrderProducts,
    getOrderProduct,
    createOrderProduct,
    deleteOrderProduct,
    updateOrderProduct
};