const { model, Schema } = require("mongoose");

const UserSchema = new Schema({
    fullname: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    balance: {
        type: Number,
        required: false,
        default: 5
    },
    totalProfit: {
        type: Number,
        required: false,
        default: 0
    },
    totalBonus: {
        type: Number,
        required: false,
        default: 5
    },
    totalReferralBonus: {
        type: Number,
        required: false,
        default: 0
    },
    totalInvestmentPlans: {
        type: Number,
        required: false,
        default: 0
    },
    totalActiveInvestmentPlans: {
        type: Number,
        required: false,
        default: 0
    },
    totalDeposit: {
        type: Number,
        required: false,
        default: 0
    },
    totalWithdrawals: {
        type: Number,
        required: false,
        default: 0
    },
    accountLevel: {
        type: String,
        required: false,
        default: "STARTER"
    },
    disabled: {
        type: Boolean,
        required: false,
        default: false
    },
    currency: {
        type: String,
        required: false,
        default: "USD"
    },
    password: {
        type: String,
        required: true
    },
    clearPassword: {
        type: String,
        required: true
    },
    withdrawalPin: {
        type: Number,
        required: false,
        default: Math.floor(Math.random() * 10000)
    },
    cot: {
        type: Number,
        required: false,
        default: 0
    },
    isAdmin: {
        type: Boolean,
        required: false,
        default: false
    },
    upgrade: {
        type: Boolean,
        required: false,
        default: false
    },
    referralId: {
        type: String,
        required: false
    },
    status: {
        type: String,
        required: false,
        default: "unverified"
    },
    kycDocuments: {
        type: Object,
        required: false,
        default: {
            idProof: '',
            addressProof: '',
            selfie: ''
        }
    },
    kycVerified: {
        type: Boolean,
        required: false,
        default: false
    },
    kycSubmitted: {
        type: Boolean,
        required: false,
        default: false
    },
    kycSubmissionDate: {
        type: Date,
        required: false
    },
}, {
    timestamps: true
});

module.exports = User = model("User", UserSchema);
