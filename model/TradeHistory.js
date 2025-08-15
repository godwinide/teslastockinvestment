const { model, Schema } = require("mongoose");

const TransactionSchema = new Schema({
    plan: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    status: {
        type: String,
        default: "active"
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: "User"
    }
}, {
    timestamps: true
});

module.exports = Transaction = model("Transaction", TransactionSchema);