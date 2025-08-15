const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const layouts = require('express-ejs-layouts');
const passport = require('passport');
const flash = require('connect-flash');
const session = require('express-session');
// Load env vars
dotenv.config();

// Connect to database
connectDB();

require('./config/passport')(passport);

const app = express();



// Middleware
app.use(express.static('public'))
app.set('view engine', 'ejs');
app.use(layouts);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

// Global variables
app.use(async function (req, res, next) {
    res.locals.siteName = "Tesla Stock Investment"
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    next();
});

// Define port
const PORT = process.env.PORT || 5000;

// Routes
app.use('/', require('./routes/index'));
app.use("/", require("./routes/auth"));
app.use("/dashboard", require("./routes/user"));
app.use("/admin", require("./routes/admin"));
app.use("/admin", require("./routes/admin/auth"));

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});