const router = require("express").Router();
const { ensureAuthenticated } = require("../config/auth");
const upload = require("../config/upload");
const DepositTransaction = require("../model/DepositTransaction");
const Investment = require("../model/Investment");
const Site = require("../model/Site");
const TradeHistory = require("../model/TradeHistory");
const WithdrawTransaction = require("../model/WithdrawTransaction");
const OtherTransaction = require("../model/OtherTransaction");
const commaFunc = require("../utils/comma");
const path = require("path");
const fs = require("fs");

// Ensure upload directory exists
const kycUploadDir = path.join(__dirname, "../public/uploads/kyc");
if (!fs.existsSync(kycUploadDir)) {
    fs.mkdirSync(kycUploadDir, { recursive: true });
}

// Configure multer for KYC document uploads
const kycUpload = upload.fields([
    { name: "idProof", maxCount: 1 },
    { name: "addressProof", maxCount: 1 },
    { name: "selfie", maxCount: 1 }
]);

router.get('/', ensureAuthenticated, (req, res) => {
    try {
        res.render('dashboard', {
            user: req.user,
            comma: commaFunc,
            layout: 'layout2',
            req
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

router.get('/tradingHistory', ensureAuthenticated, async(req, res) => {
    try {
        const history = await TradeHistory.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.render('tradingHistory', {
            user: req.user,
            layout: 'layout2',
            history,
            req
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

router.get('/accountHistory', ensureAuthenticated, async(req, res) => {
    try {
        const deposits = await DepositTransaction.find({ user: req.user._id });
        const withdrawals = await WithdrawTransaction.find({ user: req.user._id });
        const others = await OtherTransaction.find({ user: req.user._id });
        res.render('accountHistory', {
            user: req.user,
            layout: 'layout2',
            deposits,
            withdrawals,
            others,
            req

        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

router.get('/asset-balance', ensureAuthenticated, (req, res) => {
    try {
        res.render('asset-balance', {
            user: req.user,
            layout: 'layout2'
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

router.get('/buy-plan', ensureAuthenticated, (req, res) => {
    try {
        res.render('buy-plan', {
            user: req.user,
            layout: 'layout2'
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

router.post('/buy-plan', ensureAuthenticated, async (req, res) => {
    try {
        const { amount, plan, duration } = req.body;

        if(!amount || !plan || !duration){
            req.flash("error_msg", "Please fill in all fields");
            return res.redirect('/dashboard/buy-plan');
        }

        if(req.user.balance < amount) {
            req.flash("error_msg", "Insufficient balance");
            return res.redirect('/dashboard/buy-plan');
        }

        // update user balance
        req.user.balance -= amount;
        await req.user.save();

        // update user total investment plans
        req.user.totalInvestmentPlans += 1;
        await req.user.save();

        // update user total active investment
        req.user.totalActiveInvestmentPlans += 1;
        await req.user.save();

        const newInvestment = new Investment({
            amount,
            plan,
            duration,
            status: 'active',
            user: req.user._id
        });

        const newTradeHistory = new TradeHistory({
            plan,
            amount,
            type: 'plan purchase',
            status: 'active',
            user: req.user._id
        });

        await newTradeHistory.save();
        await newInvestment.save();
        req.flash("success_msg", "Plan purchased successfully");
        res.redirect('/dashboard');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

router.get('/support', ensureAuthenticated, (req, res) => {
    try {
        res.render('support', {
            user: req.user,
            layout: 'layout2'
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

router.get('/referuser', ensureAuthenticated, (req, res) => {
    try {
        res.render('referuser', {
            user: req.user,
            layout: 'layout2'
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

router.get('/deposits', ensureAuthenticated, (req, res) => {
    try {
        res.render('deposits', {
            user: req.user,
            layout: 'layout2'
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

router.post('/deposits', ensureAuthenticated, async(req, res) => {
    try {
        const { amount, method } = req.body;
        const site = await Site.findOne();
        let address;
        let network;

        if(amount < 10) {
            req.flash("error_msg", "Amount must be at least $10");
            return res.redirect('/dashboard/deposits');
        }
        
        switch (method) {
            case 'Bitcoin':
                address = site?.bitcoin;
                network = 'Bitcoin';
                break;
            case 'Ethereum':
                address = site?.ethereum;
                network = 'Ethereum';
                break;
            case 'Tether':
                address = site?.tether;
                network = 'Tether';
                break;
            default:
                req.flash("error_msg", "Invalid payment method");
                return res.redirect('/dashboard/deposits');
        }

        return res.render('payment', {address, amount, network, user: req.user, layout: 'layout2'});
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});


// receives amount, method, and receipt image
// stores image in public/uploads with a uuid
router.post('/payment', ensureAuthenticated, (req, res) => {
    try {
        const { amount, network } = req.body;
        

        if(!amount || !network) {
            req.flash("error_msg", "Please fill in all fields");
            return res.redirect('/dashboard/deposits');
        }

        const newDeposit = new DepositTransaction({
            amount,
            method: network,
            status: 'pending',
            proof: "filename",
            user: req.user._id
        });

        newDeposit.save().then(() => {
            req.flash("success_msg", "Deposit submitted successfully, please wait for approval");
            res.redirect('/dashboard/deposits');
        }).catch(err => {
            console.error(err);
            req.flash("error_msg", "Failed to process deposit");
            res.redirect('/dashboard/deposits');
        });
        
    } catch (error) {
        console.error(error);
        req.flash("error_msg", "Internal server error")
        res.redirect('/dashboard/deposits');
    }
});

router.get('/withdrawals', ensureAuthenticated, (req, res) => {
    try {
        res.render('withdrawals', {
            user: req.user,
            layout: 'layout2'
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

router.post("/withdrawals", ensureAuthenticated, async (req, res) => {
    try{
        const {amount, pin, method} = req.body;

        console.log(req.body);

        if(!amount || !pin || !method){
            req.flash("error_msg", "Please fill all fields");
            return res.redirect("/dashboard/withdrawals");
        }

        if(req.user.balance < amount) {
            req.flash("error_msg", "insufficient funds");
            return res.redirect("/dashboard/withdrawals");
        }

        if(pin != req.user.withdrawalPin){
            req.flash("error_msg", "Incorrect withdrawal PIN, please contact support for PIN");
            return res.redirect("/dashboard/withdrawals");
        }

        if(req.user.cot > 0){
            req.flash("error_msg", "You are required to pay " + req.user.currency + req.user.cot + " cost of transfer fee to process withdrawal");
            return res.redirect("/dashboard/withdrawals");
        }

        req.user.totalWithdrawals += amount;
        req.user.balance -= amount;
        await req.user.save();

        const newWithdrawal = new WithdrawTransaction({
            amount_requested: amount,
            amount_and_charges: amount + req.user.cot,
            method,
            status: 'pending',
            user: req.user._id
        });

        await newWithdrawal.save();
        req.flash("success_msg", "Withdrawal request submitted successfully");
        res.redirect("/dashboard/withdrawals");
    }catch(error){
        console.error(error);
        req.flash("error_msg", "Internal server error");
        res.redirect('/dashboard/withdrawals');
    }
})

router.get("/verify-account", ensureAuthenticated, async (req, res) => {
    try {
        res.render("verifyAccount", {
            user: req.user,
            layout: "layout2",
            csrfToken: req.csrfToken ? req.csrfToken() : ""
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
});

router.post("/submit-kyc", ensureAuthenticated, kycUpload, async (req, res) => {
    try {
        if (!req.files || Object.keys(req.files).length === 0) {
            req.flash("error_msg", "No files were uploaded. Please upload all required documents.");
            return res.redirect("/dashboard/verify-account");
        }

        const user = req.user;
        const filePaths = {
            idProof: req.files["idProof"] ? `/uploads/kyc/${req.files["idProof"][0].filename}` : "",
            addressProof: req.files["addressProof"] ? `/uploads/kyc/${req.files["addressProof"][0].filename}` : "",
            selfie: req.files["selfie"] ? `/uploads/kyc/${req.files["selfie"][0].filename}` : ""
        };

        // Update user with KYC document paths and submission status
        user.kycDocuments = filePaths;
        user.kycSubmitted = true;
        user.kycSubmissionDate = new Date();
        user.status = "pending"; // Update status from unverified to pending

        await user.save();

        req.flash("success_msg", "KYC documents uploaded successfully. Your verification is under review.");
        res.redirect("/dashboard/verify-account");
    } catch (error) {
        console.error(error);
        req.flash("error_msg", "There was an error uploading your documents. Please try again.");
        res.redirect("/dashboard/verify-account");
    }
});

module.exports = router;
