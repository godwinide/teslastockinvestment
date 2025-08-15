const { model, Schema } = require("mongoose");

const InvestmentSchema = new Schema({
    amount: {
        type: Number,
        required: true
    },
    duration: {
        type: String,
        required: true
    },
    plan: {
        type: String,
        required: true
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    status: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

module.exports = Investment = model("Investment", InvestmentSchema);