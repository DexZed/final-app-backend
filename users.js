import express from 'express';

const userRouter = express.Router();

const userRoutes = (userCollection,verifyToken) => {
    // Define POST endpoint for users collection with verbose logging
    userRouter.post("/createUsers", verifyToken, async (req, res) => {
        console.log("POST /api/createUsers", req.body);
      
        const {userId, name, picture, email, password, bloodGroup, district, upazilla, role, status } = req.body;
      
        if (!name || !email || !password) {
          return res.status(400).json({ message: "Missing required fields: name, email, password." });
        }
      
        try {
          const user = await userCollection.insertOne({
            userId,
            name,
            picture,
            email,
            password, // Ideally, hash the password before saving
            bloodGroup,
            district,
            upazilla,
            role,
            status,
            createdAt: new Date(),
          });
      
          res.status(201).json({ userId: user.insertedId });
        } catch (error) {
          //console.error("Error creating user:", error);
          res.status(500).json({ message: "Failed to create user" });
        }
      });

      userRouter.get("/getUser/:id", verifyToken, async (req, res) => {
        console.log("GET /api/getUser/:id", { params: req.params });
      
        const email = req.params.id;
      
        if (!email) {
          console.warn("User email is missing in request parameters.");
          return res.status(400).json({ message: "Missing required parameter: email" });
        }
      
        try {
          console.log("Searching for user in database with ID:", email);
      
          const user = await userCollection.findOne({ email });
      
          if (!user) {
            console.warn("No user found with the provided ID:", email);
            return res.status(404).json({ message: "User not found." });
          }
      
          console.log("User found:", user);
      
          res.status(200).json({ user });
        } catch (error) {
          console.error("Error fetching user:", error);
          res.status(500).json({ message: "Failed to fetch user." });
        }
      });

      userRouter.patch("/updateUser/:id", verifyToken, async (req, res) => {
        //console.log("PATCH /api/updateUser/:id", { params: req.params, body: req.body });
      
        const email = req.params.id;
        const updates = req.body;
      
        if (!email) {
          console.warn("User email is missing in request parameters.");
          return res.status(400).json({ message: "Missing required parameter: email" });
        }
      
        if (!updates || Object.keys(updates).length === 0) {
          console.warn("No updates provided in request body.");
          return res.status(400).json({ message: "No updates provided." });
        }
      
        try {
          console.log("Attempting to update user in database with ID:", email, "and updates:", updates);
      
          const updateResult = await userCollection.updateOne(
            { email },
            { $set: updates }
          );
      
          if (updateResult.matchedCount === 0) {
            console.warn("No user found with the provided ID:", email);
            return res.status(404).json({ message: "User not found." });
          }
      
          console.log("User successfully updated. Matched count:", updateResult.matchedCount, "Modified count:", updateResult.modifiedCount);
      
          res.status(200).json({ message: "User updated successfully.", updateResult });
        } catch (error) {
          console.error("Error updating user:", error);
          res.status(500).json({ message: "Failed to update user." });
        }
      });
      userRouter.get("/getAllUsers", verifyToken, async (req, res) => {
        console.log("GET /api/getAllUsers");
      
        try {
          console.log("Fetching all users from the database...");
      
          const users = await userCollection.find({}).toArray(); // Assuming you're using MongoDB
      
          if (!users || users.length === 0) {
            console.warn("No users found in the database.");
            return res.status(404).json({ message: "No users found." });
          }
      
          console.log("Users fetched successfully:", users);
      
          res.status(200).json({ users });
        } catch (error) {
          console.error("Error fetching users:", error);
          res.status(500).json({ message: "Failed to fetch users." });
        }
      });
      
    return userRouter}

export default userRoutes;