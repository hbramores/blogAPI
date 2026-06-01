const Post = require("../models/Post");
const { errorHandler } = require("../auth");

module.exports.addPost = (req, res) => {
    const newPost = new Post({
        title: req.body.title,
        content: req.body.content,
        author: req.user.id
    });

    Post.findOne({ title: req.body.title })
        .then(existingPost => {
            if (existingPost) {
                return res.status(409).send({ message: "Post already exists" });
            }

            return newPost.save()
                .then(result => res.status(201).send({
                    success: true,
                    message: "Post added successfully",
                    result
                }))
                .catch(error => errorHandler(error, req, res));
        })
        .catch(error => errorHandler(error, req, res));
};

module.exports.getAllPosts = (req, res) => {
    Post.find({})
        .then(result => {
            if (result.length === 0) {
                return res.status(404).send({ message: "No posts found" });
            }

            return res.status(200).send(result);
        })
        .catch(error => errorHandler(error, req, res));
};

module.exports.getSpecificPost = (req, res) => {
    Post.findById(req.params.id)
        .then(post => {
            if (!post) {
                return res.status(404).send({ message: "Post not found" });
            }

            return res.status(200).send(post);
        })
        .catch(error => errorHandler(error, req, res));
};

module.exports.updatePost = async (req, res) => {
    const updatedPost = {
        title: req.body.title,
        content: req.body.content
    };

    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).send({ message: "Post not found" });
        }

        if (post.author !== req.user.id) {
            return res.status(403).send({ message: "You can only update your own posts" });
        }

        post.title = updatedPost.title;
        post.content = updatedPost.content;

        const savedPost = await post.save();

        return res.status(200).send({
            message: "Post updated successfully",
            updatedPost: savedPost
        });

    } catch (error) {
        return errorHandler(error, req, res);
    }
};

module.exports.deletePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).send({ message: "Post not found" });
        }

        if (post.author !== req.user.id && !req.user.isAdmin) {
            return res.status(403).send({ message: "You can only delete your own posts" });
        }

        const deletedPost = await Post.findByIdAndDelete(req.params.id);

        return res.status(200).send({
            message: "Post deleted successfully",
            deletedPost
        });

    } catch (error) {
        return errorHandler(error, req, res);
    }
};

module.exports.addPostComment = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).send({ message: "Post not found" });
        }

        const newComment = {
            userId: req.user.id,
            comment: req.body.comment
        };

        post.comments.push(newComment);
        await post.save();

        return res.status(200).send({
            message: "Comment added successfully",
            comments: post.comments
        });

    } catch (error) {
        return errorHandler(error, req, res);
    }
};

module.exports.getPostComments = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id, "title comments");

        if (!post) {
            return res.status(404).send({ message: "Post not found" });
        }

        return res.status(200).send(post);

    } catch (error) {
        return errorHandler(error, req, res);
    }
};
