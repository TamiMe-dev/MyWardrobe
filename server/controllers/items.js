const { status } = require("express/lib/response");
const Item = require("../models/items");
const mongoose = require('mongoose');
const axios = require("axios");
const fs = require("fs");
const FormData = require('form-data');
const { log } = require("console");


exports.addItem = async (req, res) => {
    const { _id } = req.params;
    let { userId, itemName, categoryName, image, session, inUse, inLaundryBasket, countWear, style } = req.body;

    let imageUrl = null;

    if (req.file) {
        imageUrl = req.file.path.replace(/\\/g, '/');
        console.log("Request image path:", imageUrl, "req.file:", image);
    } else {
        return res.status(400).json({ message: "No file was uploaded. Please try again." });
    }

    if (!itemName || !categoryName) {
        return res.status(400).json({ message: "Item name and category name are required." });
    }

    try {
        const item = { userId, itemName, image: imageUrl, categoryName, session, inUse, inLaundryBasket, countWear, style };

        const newItem = await Item.create(item);

        if (newItem) {
            return res.status(201).json({ newItem: newItem });
        } else {
            return res.status(500).json({ message: "Item creation failed. Please try again later." });
        }
    } catch (error) {

        if (error.name === "MongoNetworkError" || error.code === 'ECONNREFUSED') {
            return res.status(503).json({ message: "Cannot connect to the database. Please try again later." });
        }

        // Default fallback
        return res.status(500).json({
            message: "An unexpected server error occurred while adding the item. Please try again later.",
            details: error.message
        });
    }
};


exports.getAllItemsById = async (req, res) => {
    const { _id } = req.params
    console.log("userId", _id);
    try {
        if (!mongoose.Types.ObjectId.isValid(_id)) {
            console.warn("לא תקין id", _id)
            return res.status(400).json({ message: "Invaild user ID format" })
        }
        const items = await Item.find({ userId: new mongoose.Types.ObjectId(_id) })
        if (!items) {
            return res.status(404).json({ message: "not found items" });
        }
        return res.json(items)
    } catch (error) {
        console.error('failed to get user', error);
        res.status(500).json({ message: 'failed to get user' })
    }
}

exports.getItemById = async (req, res) => {

    const { _id } = req.params;
    try {
        const item = await Item.findOne({ _id });
        if (!item)
            return res.status(404).json({ message: "not found item " })
        res.json(item);
    }
    catch (error) {

        console.log('Failed to get item ', error);
        res.status(500).json({ message: "Failed to get item  " })
    }
}

exports.deletItem = async (req, res) => {
    const _id = req.params;
    console.log(_id);
    try {
        const deletedItem = await Item.findOneAndDelete({ _id });
        console.log(deletedItem);

        if (!deletedItem)
            return res.status(404).json({ message: "not found item " })

        res.json({ message: "Item deleted successfully" })
    }
    catch (error) {
        console.log('Failed to delete item ', error);
        res.status(500).json({ message: "Failed to deleete item  " })
    }
}


exports.updateItemInUse = async (req, res) => {
    const { _id, inUse, userId } = req.body;

    if (!_id || typeof inUse !== 'boolean' || !userId) {
        return res.status(400).json({ message: "Missing _id, inUse or userId" });
    }
    try {
        const updatedItem = await Item.findByIdAndUpdate(
            _id,
            { inUse },
            { new: true }
        );

        if (!updatedItem) {
            return res.status(404).json({ message: "Item not found" });
        }
        const inUseItems = await Item.find({ userId, inUse: true });
        return res.status(200).json({ inUseItems: inUseItems, updatedItem: updatedItem });
    } catch (error) {
        console.error('Failed to update item', error);
        return res.status(500).json({ message: "Failed to update item", error: error.message });
    }
};


exports.updateItemInLaundryBasket = async (req, res) => {
    const { _id, inLaundryBasket, userId } = req.body;
    if (!_id || typeof inLaundryBasket !== 'boolean' || !userId) {
        return res.status(400).json({ message: "Missing _id, inUse or userId" });
    }
    try {
        const updatedItem = await Item.findByIdAndUpdate(
            _id,
            { inLaundryBasket },
            { new: true }
        );
        if (!updatedItem) {
            return res.status(404).json({ message: "Item not found" });
        }
        const inLaundryBasketItems = await Item.find({ userId, inLaundryBasket: true });

        return res.status(200).json({ itemsInLaundry: inLaundryBasketItems, updatedItem: updatedItem });
    } catch (error) {
        console.error('Failed to update item', error);
        return res.status(500).json({ message: "Failed to update item", error: error.message });
    }
};


exports.predictCategory = async (req, res) => {
    try {
        console.log("req.file:", req.file);
        if (!req.file) {
            return res.status(400).json({ error: 'No image file uploaded' });
        }

        const form = new FormData();
        form.append("image", fs.createReadStream(req.file.path), req.file.originalname);

        const response = await axios.post("http://127.0.0.1:5000/predict", form, {
            headers: form.getHeaders()
        });


        res.json({ predictedCategory: response.data.predicted_class });
    } catch (error) {
        console.error("שגיאה בניבוי קטגוריה:", error.message);
        res.status(500).json({ error: "שגיאה בשירות החיזוי" });
    } finally {
        fs.unlinkSync(req.file.path);
    }
};
