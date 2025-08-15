const router = require("express").Router();
const passport = require("passport");
const { forwardAuthenticated, ensureAdmin } = require("../../config/auth");

router.get("/signin", (req, res) => {
    try {
        return res.render("admin/signin", { 
            layout: false, 
            pageTitle: "Admin Login" 
        });
    } catch (err) {
        console.error(err);
        return res.redirect("/admin/signin");
    }
});

router.post('/signin', (req, res, next) => {
    passport.authenticate('local', {
        successRedirect: '/admin',
        failureRedirect: '/admin/signin',
        failureFlash: true
    })(req, res, next);
});

router.get('/logout', ensureAdmin, (req, res) => {
    req.logout((err) => {
        if (err) {
            console.error(err);
            return res.redirect('/admin');
        }
        req.flash('success_msg', 'You are logged out');
        res.redirect('/admin/signin');
    });
});

module.exports = router;