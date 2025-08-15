const mongoose = require('mongoose');

const PasswordResetCodeSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: false
    },
    linkId: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 3600
    }
});

module.exports = PasswordResetCode = mongoose.model('PasswordResetCode', PasswordResetCodeSchema);
