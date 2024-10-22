const mongoose = require("mongoose");

// Define product subcategory schema
const subcategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "category",
        required: true
    }
})

// Export product subcategory model
module.exports = mongoose.model("subcategory", subcategorySchema)