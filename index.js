const express = require('express');
const cors = require('cors');
const monk = require('monk');
const rateLimit = require('express-rate-limit');
const expressLayouts = require('express-ejs-layouts');
const mongoose = require('mongoose');
const flash = require('connect-flash');
const session = require('express-session');
const passport = require('passport');

const app = express();

//Passport config
require('../server/config/passport')(passport);

app.use(cors());
app.use(express.json());
app.use(expressLayouts);
app.set('view engine', 'ejs');
//Connect flash
app.use(flash());
app.use(express.static(__dirname + '/assets'));


app.use((error, req, res, next) => {
    res.status(500);
    res.json({
        message: error.message
    });
});

//DB
const db = 'mongodb://127.0.0.1:27017/meower' || process.env.MONGO_URI;
// process.env.MONGODB_URI
mongoose.connect(db, { useNewUrlParser: true })
    .then(() => console.log('Connected to db'))
    .catch(err => console.log(err));

//EJS
app.use(expressLayouts);
app.set('view engine', 'ejs');

//Bodyparser
app.use(express.urlencoded({ extended: false }));

// Express Session
app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true,
}));

//Passport middleware
app.use(passport.initialize());
app.use(passport.session());


//GLobal vars
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    res.locals.userName = req.user;
    next();
});


const port = process.env.PORT || 5000;

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});
app.use('/public', express.static('public'));
app.use('/users', require('../server/routes/user'));
app.use('/', require('../server/routes/meows.js'));

