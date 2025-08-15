const { model, Schema } = require("mongoose");

const WithdrawTransactionSchema = new Schema({
    amount_requested: {
        type: Number,
        required: true
    },
    amount_and_charges: {
        type: Number,
        required: true
    },
    method: {
        type: String,
        required: true
    },
    status: {
        type: String,
        required: true
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: "User"
    }
}, {
    timestamps: true
});

module.exports = WithdrawTransaction = model("WithdrawTransaction", WithdrawTransactionSchema);