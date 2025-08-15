const { model, Schema } = require("mongoose");

const OtherTransactionSchema = new Schema({
    amount: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    narration: {
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

module.exports = OtherTransaction = model("OtherTransaction", OtherTransactionSchema);