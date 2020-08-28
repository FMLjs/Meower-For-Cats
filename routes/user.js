const express = require('express');
const passport = require('passport');
const router = express.Router();
const bcrypt = require('bcryptjs');

//User model
const User = require('../models/User');

router.get('/login', (req, res) => { res.render('login'); });

router.get('/register', (req, res) => { res.render('register'); });


//Register handler
router.post('/register', async (req, res) => {
    const { name, email, password, password2 } = req.body;
    let errors = [];
    //check required fields 
    if (!name || !email || !password || !password2) {
        errors.push({ msg: 'Please fill all fields' });
    }
    //check passwords match
    if (password !== password2) {
        errors.push({ msg: 'Passwords do not match' });
    }

    //check password length
    if (password.length < 6) {
        errors.push({ msg: 'Password should be at least 6 characters' });
    }

    if (errors.length > 0) {
        res.render('register', {
            errors,
            name,
            email,
            password,
            password2
        });
    } else {
        //Validation passed
        const user = await User.findOne({ email: email });
        if (user) {
            //user exists
            errors.push({ msg: 'Email is already registered' })
        }
        const userName = await User.findOne({ name: name });
        if (userName) {
            errors.push({ msg: 'Name is already registered' })

        }
        if (errors.length > 0) {
            res.render('register', {
                errors,
                name,
                email,
                password,
                password2
            });
        }
        else {
            const description = 'Empty description';
            const newUser = new User({
                name,
                email,
                password,
                description
            });

            //Hash Password
            bcrypt.genSalt(10, (err, salt) =>
                bcrypt.hash(newUser.password, salt, async (err, hash) => {
                    if (err) throw err;
                    newUser.password = hash;
                    try {
                        const usr = await newUser.save();
                        req.flash('success_msg', 'You are now registered and can log in');
                        res.redirect('/users/login');
                    } catch (err) {
                        console.log(err);
                    }

                }));
        }
    }
});

//Login Handle
router.post('/login', (req, res, next) => {
    passport.authenticate('local', {
        successRedirect: '/dashboard',
        failureRedirect: '/users/login',
        failureFlash: true
    })(req, res, next);
});

//Logout Handle
router.get('/logout', (req, res) => {
    req.logout();
    req.flash('success_msg', 'You are logged out');
    res.redirect('/users/login');
})

module.exports = router;