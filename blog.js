import express from 'express';
import { ObjectId } from "mongodb";
const postRoute = express.Router();

const postRoutes = (postCollection, verifyToken) => {
    // Create a new post
    postRoute.post("/createPost", verifyToken, async (req, res) => {
        //console.log("POST /api/createPost", req.body);

        const { title, content, picture, status } = req.body;

        if (!title || !content) {
            return res.status(400).json({ message: "Missing required fields: title, content." });
        }

        try {
            const post = await postCollection.insertOne({
                title,
                content,
                picture,
                status: status || "draft",
                createdAt: new Date(),
            });

            res.status(201).json({ postId: post.insertedId });
        } catch (error) {
            console.error("Error creating post:", error);
            res.status(500).json({ message: "Failed to create post" });
        }
    });

    // Update an existing post
    postRoute.patch("/updatePost/:id", verifyToken, async (req, res) => {
        //console.log("PATCH /api/updatePost", req.params.id, req.body);

        const { id } = req.params;
        const { title, content, picture, status } = req.body;

        if (!id) {
            return res.status(400).json({ message: "Missing required parameter: id." });
        }

        try {
            const result = await postCollection.updateOne(
                { _id: new ObjectId(id)  },
                { $set: { title, content, picture, status, updatedAt: new Date() } }
            );

            if (result.matchedCount === 0) {
                return res.status(404).json({ message: "Post not found." });
            }

            res.status(200).json({ message: "Post updated successfully." });
        } catch (error) {
            console.error("Error updating post:", error);
            res.status(500).json({ message: "Failed to update post" });
        }
    });

    // Delete a post
    postRoute.delete("/deletePost/:id", verifyToken, async (req, res) => {
        console.log("DELETE /api/deletePost", req.params.id);

        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ message: "Missing required parameter: id." });
        }

        try {
            const result = await postCollection.deleteOne({_id: new ObjectId(id) });

            if (result.deletedCount === 0) {
                return res.status(404).json({ message: "Post not found." });
            }

            res.status(200).json({ message: "Post deleted successfully." });
        } catch (error) {
            console.error("Error deleting post:", error);
            res.status(500).json({ message: "Failed to delete post" });
        }
    });

    // Get all posts or a single post
    postRoute.get("/getPost/:id?", verifyToken, async (req, res) => {
        console.log("GET /api/getPost", req.params.id);

        const { id } = req.params;

        try {
            if (id) {
                const post = await postCollection.findOne({ _id: new ObjectId(id) });

                if (!post) {
                    return res.status(404).json({ message: "Post not found." });
                }

                res.status(200).json(post);
            } else {
                const posts = await postCollection.find().toArray();
                res.status(200).json(posts);
            }
        } catch (error) {
            console.error("Error fetching posts:", error);
            res.status(500).json({ message: "Failed to fetch posts" });
        }
    });

    return postRoute
}

export default postRoutes;