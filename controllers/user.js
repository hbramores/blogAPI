const User = require('../models/User');
const bcrypt = require('bcryptjs');
const auth = require("../auth");
const { errorHandler } = require('../auth');

module.exports.checkEmailExists = (req, res) => {

    if (req.body.email.includes("@")) {

        return User.find({ email: req.body.email })
        .then(result => {

            if (result.length > 0) {
                return res.status(409).send({ message: "Duplicate email found" });
            } else {
                return res.status(200).send({ message: "No duplicate email found" });
            }

        })
        .catch(error => errorHandler(error, req, res));

    } else {
        return res.status(400).send({ message: "Email invalid" });
    }
};


module.exports.registerUser = (req, res) => {

    if (!req.body.email.includes("@")) {
        return res.status(400).send({ message: 'Invalid email format' });
    }

    else if (req.body.password.length < 8) {
        return res.status(400).send({ message: 'Password must be at least 8 characters long' });
    }

    else {

        let newUser = new User({
            username: req.body.username,
            email: req.body.email,
            password: bcrypt.hashSync(req.body.password, 10)
        });

        return newUser.save()
        .then(result => res.status(201).send({
            message: 'User registered successfully',
            user: result
        }))
        .catch(error => errorHandler(error, req, res));
    }
};


module.exports.loginUser = (req, res) => {

    if (!req.body.email.includes("@")) {
        return res.status(400).send({ message: 'Invalid email format' });
    }

    return User.findOne({ email: req.body.email })
    .then(result => {

        if (!result) {
            return res.status(404).send({ message: 'No email found' });
        }

        const isPasswordCorrect = bcrypt.compareSync(req.body.password, result.password);

        if (!isPasswordCorrect) {
            return res.status(401).send({ message: 'Incorrect email or password' });
        }

        return res.status(200).send({
            message: 'User logged in successfully',
            access: auth.createAccessToken(result)
        });

    })
    .catch(error => errorHandler(error, req, res));
};


module.exports.getProfile = (req, res) => {

    // FIX: supports both "id" and "_id" depending on JWT structure
    const userId = req.user.id || req.user._id;

    return User.findById(userId)
    .then(user => {

        if (!user) {
            return res.status(404).send({ message: 'User not found' });
        }

        const safeUser = user.toObject();
        delete safeUser.password; // safer than empty string

        return res.status(200).send(safeUser);
    })
    .catch(error => errorHandler(error, req, res));
};