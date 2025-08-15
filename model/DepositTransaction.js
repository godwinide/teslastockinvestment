const { model, Schema } = require("mongoose");

const DepositTransactionSchema = new Schema({
    amount: {
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
    proof: {
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

module.exports = DepositTransaction = model("DepositTransaction", DepositTransactionSchema);