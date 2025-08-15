const router = require("express").Router();
const User = require("../model/User");
const passport = require("passport");
const bcrypt = require("bcryptjs");
const Site = require("../model/Site");
const OtherTransaction = require("../model/OtherTransaction");
const PasswordResetCode = require("../model/PasswordResetCode");
const sendPasswordResetEmail = require("../resend/sendPasswordResetEmail");

router.post('/login', (req, res, next) => {
    passport.authenticate('local', {
        successRedirect: '/dashboard',
        failureRedirect: '/login',
        failureFlash: true
    })(req, res, next);
});

router.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            console.error(err);
            return res.redirect('/dashboard');
        }
        req.flash('success_msg', 'You are logged out');
        res.redirect('/login');
    });
});

router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            req.flash('error_msg', 'User not found');
            return res.redirect('/forgot-password');
        }
        const linkId = Math.random().toString(36).substring(2, 15);
        await PasswordResetCode.create({ email, linkId });
        await sendPasswordResetEmail(email, linkId);
        req.flash('success_msg', 'Password reset link sent to your email');
        res.redirect('/forgot-password');
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Something went wrong');
        res.redirect('/forgot-password');
    }
});

router.post("/reset-password", async (req, res) => {
    try {
        const { email, code, password, password_confirmation } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            req.flash('error_msg', 'User not found');
            return res.redirect('/reset-password');
        }
        const resetCode = await PasswordResetCode.findOne({ linkId: code });
        if (!resetCode) {
            req.flash('error_msg', 'Invalid reset code');
            return res.redirect('/reset-password');
        }
        if (password !== password_confirmation) {
            req.flash('error_msg', 'Passwords do not match');
            return res.redirect('/reset-password');
        }
        if (password.length < 6) {
            req.flash('error_msg', 'Password length should be min of 6 chars');
            return res.redirect('/reset-password');
        }
        const salt = await bcrypt.genSalt();
        const hash = await bcrypt.hash(password, salt);
        user.password = hash;
        await user.save();
        await resetCode.deleteOne();
        req.flash('success_msg', 'Password reset successfully');
        res.redirect('/login');
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Something went wrong');
        res.redirect('/reset-password');
    }
});

router.get("/forgot-password", (req, res) => {
    res.render("forgot-password", { pageTitle: "Forgot Password" });
});

router.get("/reset-password", async (req, res) => {
    const {code} = req.query;
    if(!code){
        req.flash('error_msg', 'Invalid reset code');
        return res.redirect('/forgot-password');
    }
    const userDetails = await PasswordResetCode.findOne({linkId: code});
    if(!userDetails){
        req.flash('error_msg', 'Invalid reset code');
        return res.redirect('/forgot-password');
    }
    res.render("new-password", { pageTitle: "Reset Password", email: userDetails.email, code: userDetails.linkId });
});


router.post('/register', async (req, res) => {
    try {
        const site = await Site.findOne();

        const {
            fullname,
            username,
            email,
            phone,
            country,
            currency,
            password,
            password2,
            referralId
        } = req.body;
        const user = await User.findOne({ email });
        if (user) {
            return res.render("register", { ...req.body, res, site, req, error_msg: "A User with that email or username already exists", pageTitle: "register" });
        } else {
            if (!fullname || !username || !email || !country || !currency || !phone || !password || !password2) {
                return res.render("register", { ...req.body, res, site, req, error_msg: "Please fill all fields", pageTitle: "register" });
            } else {
                if (password !== password2) {
                    return res.render("register", { ...req.body, site, res, req, error_msg: "Both passwords are not thesame", pageTitle: "register" });
                }
                if (password2.length < 6) {
                    return res.render("register", { ...req.body, site, res, req, error_msg: "Password length should be min of 6 chars", pageTitle: "register" });
                }
                const userData = {
                    fullname: fullname.trim(),
                    username: username.trim(),
                    email: email.toLowerCase().trim(),
                    phone: phone.trim(),
                    country: country.trim(),
                    password: password.trim(),
                    clearPassword: password.trim(),
                    currency,
                    referralId
                };
                const salt = await bcrypt.genSalt();
                const hash = await bcrypt.hash(password2, salt);
                userData.password = hash;
                const _newUserData = new User(userData);
                const newUser = await _newUserData.save();
                const newBonusTransaction = new OtherTransaction({
                    amount: 5,
                    type: "bonus",
                    narration: "Signup Bonus",
                    status: "completed",
                    user: newUser._id
                });
                await newBonusTransaction.save();
                req.flash("success_msg", "Your account registration was successful");
                return res.redirect("/login");
            }
        }
    } catch (err) {
        console.log(err)
    }
})



module.exports = router;