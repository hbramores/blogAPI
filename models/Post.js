const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is Required']
    },
    content: {
        type: String,
        required: [true, 'Content is Required']
    },
    author: {
        type: String,
        required: [true, 'Author is Required']
    },
    createdOn: {
        type: Date,
        default: Date.now
    },
    comments: [
        {
            userId: {
                type: String
            },
            comment: {
                type: String,
                required: [true, 'Comment is Required']
            }
        }
    ]
});

module.exports = mongoose.model('Blog', blogSchema);