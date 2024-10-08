const Trycatch = require("../../middleware/Trycatch");
const Nutrition = require("../../model/Product/nutrition");

// create product nutrition
const CreateNutrition = Trycatch(async (req, res, next) => {
    const nutrition = await Nutrition.create(req.body);
    res.status(201).json({
        success: true,
        nutrition,
    });
});


// get all product nutrition
const GetAllNutrition = Trycatch(async (req, res, next) => {
    const nutrition = await Nutrition.find();
    const totalNutrition = nutrition.length;
    res.status(200).json({
        success: true,
        totalNutrition,
        nutrition,
    });
});

// get single product nutrition
const GetSingleNutrition = Trycatch(async (req, res, next) => {
    const nutrition = await Nutrition.findById(req.params.id);
    if (!nutrition) {
        return res.status(404).json({
            success: false,
            message: "Nutrition not found",
        });
    }
    res.status(200).json({
        success: true,
        nutrition,
    });
});

// update product nutrition
const UpdateNutrition = Trycatch(async (req, res, next) => {
    const nutrition = await Nutrition.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    });
    res.status(200).json({
        success: true,
        nutrition,
    });
});

// delete product nutrition
const DeleteNutrition = Trycatch(async (req, res, next) => {
    const nutrition = await Nutrition.findByIdAndDelete(req.params.id);
    res.status(200).json({
        success: true,
        nutrition,
    });
});

module.exports = {
    CreateNutrition,
    GetAllNutrition,
    GetSingleNutrition,
    UpdateNutrition,
    DeleteNutrition,
}