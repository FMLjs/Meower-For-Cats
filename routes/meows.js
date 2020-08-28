const express = require('express');
const router = express.Router();
const Filter = require('bad-words');
const filter = new Filter();
const { ensureAuthenticated } = require('../config/auth');

const Meows = require('../models/Meows');
const User = require('../models/User');

const { urlencoded } = require('express');

const isValidMeow = (meow) => {
    return meow.name && meow.name.toString().trim() !== '' &&
        meow.content && meow.content.toString().trim() !== '';
};

async function processArray(array) {
    let subscriptionsMeows = [];
    for (const item of array) {
        const allMeows = await User.findOne({ name: item.name }).populate('meows', 'name content created');
        allMeows.meows.forEach(meow => {
            subscriptionsMeows.push({ name: item.name, meows: meow });
        })
    }
    return subscriptionsMeows.sort(function (a, b) {
        var dateA = new Date(a.meows.created), dateB = new Date(b.meows.created);
        return dateB - dateA;
    });
}
router.get('/', (req, res) => { res.render('welcome'); });

router.get('/commentMeow/:name&:content', ensureAuthenticated, async (req, res) => {
    const { name, content } = req.params;
    const allMeows = await User.findOne({ name: name }).populate('meows', 'name content created comments');
    allMeows.meows.forEach(element => {
        if (element.content === content) {
            res.render('comments', {
                name,
                content: element.content,
                created: element.created,
                comments: element.comments
            });
        }
    });
});

router.post('/commentMeow/:name&:content', async (req, res) => {
    //запись
    const { name, content } = req.params;
    // комментарий
    const commentator = req.user.name;
    const comment = req.body.content;

    if (isValidMeow({ name: commentator, content: comment })) {
        try {
            const allMeows = await User.findOne({ name: name }).populate('meows', '_id name content created comments');
            allMeows.meows.forEach(async element => {
                if (element.content === content) {
                    const newComment = {
                        name: commentator,
                        comment: comment,
                        created: new Date(),
                    };
                    element.comments.push(newComment);
                    await element.save();
                }
            });
            res.redirect(`/commentMeow/${name}&${content}`);

        } catch (next) {
            console.log(next)
        }
    } else {
        req.flash('error_msg', 'Hey! Name and Content are required!');
        res.redirect('/dashboard');
    }

});
router.post('/newmeow', async (req, res, next) => {
    const name = req.user.name;
    const content = req.body.content;
    if (isValidMeow({ name, content })) {
        try {
            const user = await User.findOne({ name: name }, async (err, user) => {
                if (user) {
                    const meow = new Meows({
                        content: filter.clean(content.toString()),
                        created: new Date(),
                        owner: user._id,
                    });
                    await meow.save(err => {
                        if (err) throw err;
                    });
                    user.meows.push(meow);
                    await user.save(err => {
                        if (err) throw err;
                    });
                } else throw err;

            });
            res.redirect('/dashboard');
        } catch (next) {
            console.log(next)
        }
    } else {
        req.flash('error_msg', 'Hey! Name and Content are required!');
        res.redirect('/dashboard');
    }
});

router.get('/dashboard', ensureAuthenticated, async (req, res, next) => {
    Promise.all([
        total = await Meows.countDocuments({}),

        allMeows = await Meows.find().lean().sort({ created: -1 })
    ]);
    for (let i = 0; i < allMeows.length; i++) {
        let meaw = allMeows[i];
        const usr = await User.findById(meaw.owner._id);
        allMeows[i].name = usr.name;
    }
    res.render('dashboard', {
        allMeows
    });
});


router.get('/home', ensureAuthenticated, async (req, res) => {
    const name = req.user.name;
    let description = ''
    const allMeows = await User.findOne({ name: name }, (err, user) => {
        if (user) {
            description = user.description;
        } else throw err;
    }).populate('meows', 'name content created').sort({ created: -1 });

    res.render('home', {
        name,
        allMeows,
        description
    });
});

router.get('/profile/:name', ensureAuthenticated, async (req, res) => {
    const name = req.params.name;
    let description = '';
    const allMeows = await User.findOne({ name: name }, (err, user) => {
        if (user) {
            description = user.description;
        }
    }).populate('meows', 'name content created').sort({ created: -1 });
    let subscription = 'Subscribe'
    await User.findOne({ name: req.user.name }, (err, user) => {
        if (user) {
            const subscriptions = user.subscriptions;
            if (subscriptions != null) {
                if (subscriptions.some(e => e.name === name)) {
                    subscription = 'Unsubscribe'
                }
            }
            const self = name === req.user.name ? false : true;

            res.render('profile', {
                name,
                allMeows,
                subscription,
                self,
                description
            });
        } else throw err;
    });
});

router.get('/subscribe/:name', ensureAuthenticated, async (req, res) => {
    const name = req.params.name;
    await User.findOne({ name: req.user.name }, async (err, user) => {
        if (user) {
            user.subscriptions.push({ name });
        } else throw err;
        await user.save();
    });
    await User.findOne({ name: name }, async (err, user) => {
        if (user) {
            user.subscribers.push({ name: req.user.name });
        }
        await user.save();
    });
    res.redirect(`/profile/${name}`);
});

router.get('/unsubscribe/:name', ensureAuthenticated, async (req, res) => {
    const name = req.params.name;
    await User.findOne({ name: req.user.name }, async (err, user) => {
        if (user) {
            user.subscriptions.splice(user.subscriptions.indexOf(name));
        } else throw err;
        await user.save();
    });
    await User.findOne({ name: name }, async (err, user) => {
        if (user) {
            user.subscriptions.splice(user.subscriptions.indexOf(req.user.name));
        }
        await user.save();
    });
    res.redirect(`/profile/${name}`);
});


router.get('/subscriptions', ensureAuthenticated, async (req, res) => {
    await User.findOne({ name: req.user.name }, async (err, user) => {
        if (user) {
            const subscriptions = user.subscriptions;
            const allMeows = await processArray(subscriptions);
            const subscriptionsLen = subscriptions.length;
            const subscribersLen = user.subscribers.length;
            res.render('subscriptions', {
                allMeows,
                subscriptionsLen,
                subscribersLen
            })
        } else throw err;

    });
});

router.get('/subscriptionlist/:mode', ensureAuthenticated, async (req, res) => {
    const mode = req.params.mode;
    await User.findOne({ name: req.user.name }, async (err, user) => {
        if (user) {
            const subs = user[mode];
            res.render('subscriptionlist', {
                subs,
                mode
            })
        } else throw err;

    });
});

router.post('/changedescription', ensureAuthenticated, async (req, res) => {
    await User.findOne({ name: req.user.name }, async (err, user) => {
        if (user) {
            console.log(req.body.description);
            user.description = req.body.description;
            await user.save(err => {
                if (err) throw err;
            });
            res.redirect('/home');
        } else throw err;
    });
});

router.post('/search', ensureAuthenticated, async (req, res) => {
    let val = req.body;
    if (val != '') {
        let users = await User.find({}).select('name -_id');
        let appear = [];
        users.forEach((elem) => {
            if (elem.name.toUpperCase().indexOf(val.data.toUpperCase()) > -1) {
                appear.push(elem.name);
            }
        });
        res.json(appear);
    }
});
module.exports = router;
