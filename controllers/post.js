const Post = require("../models/Post");
const User = require("../models/User");
const { errorHandler } = require("../auth");

const formatCommentsResponse = async (comments) => {
    const plainComments = comments.map(comment => comment.toObject ? comment.toObject() : comment);
    const userIds = [...new Set(plainComments.map(comment => comment.userId).filter(Boolean))];
    const users = await User.find({ _id: { $in: userIds } }, "username");
    const userMap = new Map(users.map(user => [user._id.toString(), user.username]));

    return plainComments.map(comment => ({
        ...comment,
        author: userMap.get(comment.userId) || comment.userId
    }));
};

const formatPostResponse = async (post) => {
    const plainPost = post.toObject ? post.toObject() : post;
    const author = await User.findById(plainPost.author, "username");

    return {
        ...plainPost,
        authorId: plainPost.author,
        author: author ? author.username : plainPost.author,
        comments: await formatCommentsResponse(plainPost.comments || [])
    };
};

const formatPostsResponse = async (posts) => {
    const plainPosts = posts.map(post => post.toObject ? post.toObject() : post);
    const authorIds = [...new Set(plainPosts.map(post => post.author))];
    const authors = await User.find({ _id: { $in: authorIds } }, "username");
    const authorMap = new Map(authors.map(author => [author._id.toString(), author.username]));

    return plainPosts.map(post => ({
        ...post,
        authorId: post.author,
        author: authorMap.get(post.author) || post.author
    }));
};

module.exports.addPost = (req, res) => {
    const newPost = new Post({
        title: req.body.title,
        content: req.body.content,
        imageUrl: req.body.imageUrl || '',
        author: req.user.id
    });

    Post.findOne({ title: req.body.title })
        .then(existingPost => {
            if (existingPost) {
                return res.status(409).send({ message: "Post already exists" });
            }

            return newPost.save()
                .then(async result => res.status(201).send({
                    success: true,
                    message: "Post added successfully",
                    result: await formatPostResponse(result)
                }))
                .catch(error => errorHandler(error, req, res));
        })
        .catch(error => errorHandler(error, req, res));
};

module.exports.getAllPosts = async (req, res) => {
    try {
        const result = await Post.find({});

        if (result.length === 0) {
            return res.status(404).send({ message: "No posts found" });
        }

        return res.status(200).send(await formatPostsResponse(result));

    } catch (error) {
        return errorHandler(error, req, res);
    }
};

module.exports.getSpecificPost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).send({ message: "Post not found" });
        }

        return res.status(200).send(await formatPostResponse(post));

    } catch (error) {
        return errorHandler(error, req, res);
    }
};

module.exports.updatePost = async (req, res) => {
    const updatedPost = {
        title: req.body.title,
        content: req.body.content,
        imageUrl: req.body.imageUrl || ''
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
        post.imageUrl = updatedPost.imageUrl;

        const savedPost = await post.save();

        return res.status(200).send({
            message: "Post updated successfully",
            updatedPost: await formatPostResponse(savedPost)
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
            comments: await formatCommentsResponse(post.comments)
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

        return res.status(200).send({
            title: post.title,
            comments: await formatCommentsResponse(post.comments)
        });

    } catch (error) {
        return errorHandler(error, req, res);
    }
};
