const express = require("express");
const postController = require("../controllers/post");
const auth = require("../auth");

const { verify } = auth;

const router = express.Router();

// CREATE POST
router.post("/addPost", verify, postController.addPost);

// GET ALL POSTS
router.get("/getAllPosts", verify, postController.getAllPosts);

// GET SINGLE POST
router.get("/getSpecificPost/:id", verify, postController.getSpecificPost);

// UPDATE POST
router.patch("/updatePost/:id", verify, postController.updatePost);

// DELETE POST
router.delete("/deletePost/:id", verify, postController.deletePost);

// COMMENTS
router.post("/addComment/:id", verify, postController.addPostComment);
router.get("/getComments/:id", postController.getPostComments);

module.exports = router;
