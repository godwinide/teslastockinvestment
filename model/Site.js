const { model, Schema } = require("mongoose");

const SiteSchema = new Schema({
    bitcoin: {
        type: String,
        required: false
    },
    tether: {
        type: String,
        required: false
    },
    ethereum: {
        type: String,
        required: false
    }
}, {
    timestamps: true
});

module.exports = Site = model("Site", SiteSchema);