const router = require("express").Router();
const User = require("../../model/User");
const Deposit = require("../../model/DepositTransaction");
const Withdraw = require("../../model/WithdrawTransaction");
const History = require("../../model/TradeHistory");
const { ensureAdmin } = require("../../config/auth");
const comma = require("../../utils/comma");
const bcrypt = require("bcryptjs");
const Site = require("../../model/Site");
const uuid = require("uuid");
const Investment = require("../../model/Investment");
const DepositTransaction = require("../../model/DepositTransaction");

router.get("/", ensureAdmin, async (req, res) => {
    try {
        const users = await User.find({ isAdmin: false });
        const pendingDeposits = await Deposit.find({ status: "pending" }).populate("user");
        const pendingWithdrawals = await Withdraw.find({ status: "pending" }).populate("user");
        const pendingKYCUsers = await User.find({ kycSubmitted: true, kycVerified: false, status: "pending" });
        return res.render("admin/dashboard", { 
            layout: "layout3", 
            req,
            res,
            comma, 
            users, 
            pendingDeposits, 
            pendingWithdrawals,
            pendingKYCUsers
        });
    }
    catch (err) {
        console.error(err);
        req.flash('error_msg', 'Internal server error');
        return res.redirect("/admin");
    }
});

router.get("/settings", ensureAdmin, async (req, res) => {
    try {
        const site = await Site.findOne();
        return res.render("admin/settings", { 
            layout: "layout3", 
            req,
            res,
            comma,
            site: site || {}
        });
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Internal server error');
        return res.redirect("/admin");
    }
});

router.post("/settings/addresses", ensureAdmin, async (req, res) => {
    try {
        const {
            bitcoin,
            ethereum,
            tether
        } = req.body;

        const siteExists = await Site.findOne({});
        if (siteExists) {
            await Site.updateOne({ _id: siteExists._id }, {
                bitcoin: bitcoin || siteExists.bitcoin,
                ethereum: ethereum || siteExists.ethereum,
                tether: tether || siteExists.tether,
            });
        } else {
            const newSite = new Site({
                bitcoin,
                ethereum,
                tether
            });
            await newSite.save();
        }

        req.flash("success_msg", "Addresses updated successfully");
        return res.redirect("/admin/settings");

    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Internal server error');
        return res.redirect("/admin/settings");
    }
});

router.post("/settings", ensureAdmin, async (req, res) => {
    try {
        const { password, password2 } = req.body;
        if (!password || !password2) {
            req.flash("error_msg", "Enter new password");
            return res.redirect("/admin/settings");
        }
        if (password.length < 8) {
            req.flash("error_msg", "Password should be at least 8 characters long");
            return res.redirect("/admin/settings")
        }

        if (password !== password2) {
            req.flash("error_msg", "Passwords do not match");
            return res.redirect("/admin/settings");
        }

        const salt = await bcrypt.genSalt();
        const hash = await bcrypt.hash(password, salt);

        await User.updateOne({ email: req.user.email }, { password: hash })
        req.flash("success_msg", "Password updated successfully");
        return res.redirect("/admin/settings");
    } catch (err) {
        return res.redirect("/admin")
    }
});

router.post("/credit-user/:client_id", ensureAdmin, async (req, res) => {
    try {
        const { client_id } = req.params;
        const { amount } = req.body;
        const user = await User.findById(client_id);
        if (!user) {
            req.flash("error_msg", "User with that Id not found");
            return res.redirect("/admin/edit-user/" + client_id)
        }
        const cleanAmount = Number(amount.trim());
        user.balance += cleanAmount;
        user.totalProfit += cleanAmount; 

        const investment = await Investment.find({user: user._id});

        const newHist = new History({
            plan: investment[0]?.plan || 'Current Plan',
            amount,
            type: 'Profit',
            user: user._id,
            status: 'approved'
        });

        await newHist.save();
        await user.save();

        req.flash("success_msg", "User profited successfully");
        return res.redirect("/admin/edit-user/" + client_id);

    } catch (err) {
        console.log(err);
        req.flash("error_msg", "internal server error");
        return res.redirect("/admin/edit-user/" + req.params.client_id);
    }
})

router.post("/deposit-user/:client_id", ensureAdmin, async (req, res) => {
    try {
        const { client_id } = req.params;
        const { amount } = req.body;
        const user = await User.findById(client_id);
        if (!user) {
            req.flash("error_msg", "User with that Id not found");
            return res.redirect("/admin/edit-user/" + client_id)
        }
        const cleanAmount = Number(amount.trim());
        user.balance += cleanAmount;
        user.totalDeposit += cleanAmount;

        const newHist = new DepositTransaction({
            amount: cleanAmount,
            method: 'Company Deposit',
            status: 'approved',
            proof: 'proof',
            user: user._id,
        });

        await newHist.save();
        await user.save();

        req.flash("success_msg", "Account Deposit successfully");
        return res.redirect("/admin/edit-user/" + client_id);

    } catch (err) {
        console.log(err);
        req.flash("error_msg", "internal server error");
        return res.redirect("/admin/edit-user/" + req.params.client_id);
    }
})

router.get("/approve-deposit/:id", ensureAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const dep = await Deposit.findById(id);
        
        if (!dep) {
            req.flash('error_msg', 'Deposit not found');
            return res.redirect("/admin");
        }

        const user = await User.findById(dep.user);
        if (!user) {
            req.flash('error_msg', 'User not found');
            return res.redirect("/admin");
        }

        dep.status = "approved";
        await dep.save();

        user.balance = user.balance + Number(dep.amount);
        user.totalDeposit = user.totalDeposit + Number(dep.amount);
        await user.save();

        req.flash("success_msg", "Deposit Approved");
        return res.redirect("/admin");
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Internal server error');
        return res.redirect("/admin");
    }
});

router.get("/reject-deposit/:id", ensureAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const dep = await Deposit.findById(id);
        
        if (!dep) {
            req.flash('error_msg', 'Deposit not found');
            return res.redirect("/admin");
        }

        const user = await User.findById(dep.user);
        if (!user) {
            req.flash('error_msg', 'User not found');
            return res.redirect("/admin");
        }

        dep.status = "rejected";
        await dep.save();

        req.flash("success_msg", "Deposit Rejected");
        return res.redirect("/admin");
    } catch (err) {
        return res.redirect("/admin")
    }
});

router.get("/approve-withdrawal/:id", ensureAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const withdrawal = await Withdraw.findById(id);

        if (!withdrawal) {
            req.flash('error_msg', 'Withdrawal not found');
            return res.redirect("/admin");
        }

        const user = await User.findById(withdrawal.user);
        if (!user) {
            req.flash('error_msg', 'User not found');
            return res.redirect("/admin");
        }

        withdrawal.status = "approved";
        await withdrawal.save();

        user.balance = user.balance - Number(withdrawal.amount);
        await user.save();
        
        req.flash("success_msg", "Withdrawal Approved");
        return res.redirect("/admin");
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Internal server error');
        return res.redirect("/admin");
    }
});


router.get("/reject-withdrawal/:id", ensureAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const withdrawal = await Withdraw.findById(id);

        if (!withdrawal) {
            req.flash('error_msg', 'Withdrawal not found');
            return res.redirect("/admin");
        }

        const user = await User.findById(withdrawal.user);
        if (!user) {
            req.flash('error_msg', 'User not found');
            return res.redirect("/admin");
        }

        withdrawal.status = "rejected";
        await withdrawal.save();

        req.flash("success_msg", "Withdrawal Rejected");
        return res.redirect("/admin");
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Internal server error');
        return res.redirect("/admin");
    }
});


router.get("/delete-account/:clientID", ensureAdmin, async (req, res) => {
    try {
        const { clientID } = req.params;
        await User.deleteOne({ _id: clientID });
        req.flash("success_msg", "Account Deleted Succesfully");
        return res.redirect("/admin");
    } catch (err) {
        return res.redirect("/admin")
    }
});

router.get("/edit-user/:id", ensureAdmin, async (req, res) => {
    try {
        const userID = req.params.id;
        const client = await User.findById(userID);
        
        if (!client) {
            req.flash('error_msg', 'User not found');
            return res.redirect("/admin");
        }

        return res.render("admin/editUser", { 
            layout: "layout3", 
            req,
            res,
            comma,
            client 
        });
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Internal server error');
        return res.redirect("/admin");
    }
});

router.get("/kyc-details/:id", ensureAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);
        
        if (!user) {
            req.flash('error_msg', 'User not found');
            return res.redirect("/admin");
        }

        return res.render("admin/kycDetails", { 
            layout: "layout3", 
            req,
            res,
            comma,
            user
        });
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Internal server error');
        return res.redirect("/admin");
    }
});

router.get("/approve-kyc/:id", ensureAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);
        
        if (!user) {
            req.flash('error_msg', 'User not found');
            return res.redirect("/admin");
        }

        if (!user.kycSubmitted) {
            req.flash('error_msg', 'No KYC submission found for this user');
            return res.redirect("/admin");
        }

        user.kycVerified = true;
        user.status = "verified";
        await user.save();

        req.flash("success_msg", "KYC Approved for " + user.fullname);
        return res.redirect("/admin");
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Internal server error');
        return res.redirect("/admin");
    }
});

router.get("/reject-kyc/:id", ensureAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);
        
        if (!user) {
            req.flash('error_msg', 'User not found');
            return res.redirect("/admin");
        }

        if (!user.kycSubmitted) {
            req.flash('error_msg', 'No KYC submission found for this user');
            return res.redirect("/admin");
        }

        user.kycSubmitted = false;
        user.kycVerified = false;
        user.status = "unverified";
        user.kycSubmissionDate = null;
        user.kycDocuments = {
            idProof: '',
            addressProof: '',
            selfie: ''
        };
        await user.save();

        req.flash("success_msg", "KYC Rejected for " + user.fullname);
        return res.redirect("/admin");
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Internal server error');
        return res.redirect("/admin");
    }
});

router.post("/edit-user/:id", ensureAdmin, async (req, res) => {
    try {
        const {
            fullname,
            email,
            phone,
            balance,
            totalProfit,
            totalDeposit,
            totalWithdrawals,
            totalBonus,
            totalReferralBonus,
            // upgrade,
            // disabled,
            // accountLevel,
            cot,
            currency,
            withdrawalPin
        } = req.body;

        const userID = req.params.id;
        const user = await User.findById(userID);

        if (!user) {
            req.flash('error_msg', 'User not found');
            return res.redirect("/admin");
        }

        await User.updateOne({ _id: userID }, {
            fullname: fullname || user.fullname,
            email: email || user.email,
            balance: balance || user.balance,
            totalProfit: totalProfit || user.totalProfit,
            totalDeposit: totalDeposit || user.totalDeposit,
            totalWithdrawals: totalWithdrawals || user.totalWithdrawals,
            totalBonus: totalBonus || user.totalBonus,
            totalReferralBonus: totalReferralBonus || user.totalReferralBonus,
            cot: cot || user.cot,
            phone: phone || user.phone,
            currency: currency || user.currency,
            withdrawalPin: withdrawalPin || user.withdrawalPin
        });

        req.flash("success_msg", "Client Account updated successfully");
        return res.redirect("/admin/edit-user/" + userID);
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Internal server error');
        return res.redirect("/admin");
    }
});

module.exports = router;