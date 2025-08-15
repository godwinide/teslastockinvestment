const router = require("express").Router();

router.get('/', (req, res) => {
    try {
        res.render('index', {layout: false});
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

router.get('/homepage', (req, res) => {
    try {
        res.render('homepage');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

router.get('/shopping', (req, res) => {
    try {
        res.render('shopping', {layout: false});
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

router.get('/about', (req, res) => {
    try {
        res.render('about');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});


router.get('/faq', (req, res) => {
    try {
        res.render('faq');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});


router.get('/contact', (req, res) => {
    try {
        res.render('contact');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});


router.post('/sendcontact', (req, res) => {
    try {
        res.render('contact');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});


router.get('/login', (req, res) => {
    try {
        res.render('login');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});


router.get('/register', (req, res) => {
    try {
        res.render('register');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});


module.exports = router;