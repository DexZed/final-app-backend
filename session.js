import express from "express";
import { v4 as uuidv4 } from "uuid";

const sessionsRouter = express.Router();

const setupSessionRoutes = (sessionCollection, verifyToken) => {
  sessionsRouter.post("/postSessions", verifyToken, async (req, res) => {
    try {
      const sessionId = uuidv4();
      const now = new Date();

      const sessionData = {
        sessionId,
        userId: req.user.uid,
        createdAt: now.toISOString(),
        lastAccessedAt: now.toISOString(),
        expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
      };

      await sessionCollection.insertOne(sessionData);
      res.cookie("session", sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: "lax",
        domain: "localhost",
      });

      return res.status(200).json({ message: "Session created", sessionId });
    } catch (error) {
      console.error("[DB INSERT ERROR]:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // Define other session routes here...
  // Route: Logout - Clear Session Cookie and Remove from MongoDB
  sessionsRouter.delete("/delSessions", async (req, res) => {
    const sessionId = req.cookies.session;
  
    if (!sessionId) {
      console.error("[LOGOUT ERROR] No session cookie provided.");
      return res.status(400).json({ error: "Bad Request: No session cookie provided" });
    }
  
    try {
      const result = await sessionCollection.deleteOne({ sessionId });
  
      if (result.deletedCount === 0) {
        console.error(`[DB DELETE ERROR] Session not found for Session ID: ${sessionId}`);
        return res.status(404).json({ error: "Session not found" });
      }
  
      res.clearCookie("session");
      console.log(`[DB DELETE SUCCESS] Session cleared for Session ID: ${sessionId}`);
      return res.status(200).json({ message: "Session cookie cleared and session removed from DB" });
    } catch (error) {
      console.error("[DB DELETE ERROR] Failed to remove session:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  });

  sessionsRouter.get("/getSessions", async (req, res) => {
    const sessionCookie = req.cookies.session;
  
    if (!sessionCookie) {
      return res.status(401).json({ error: "Unauthorized: No session cookie" });
    }
  
    try {
      // Check if session exists in database
      const session = await sessionCollection.findOne({ sessionId: sessionCookie });
  
      if (!session) {
        return res.status(401).json({ error: "Unauthorized: Invalid session" });
      }
  
      // If the session exists, return session info
      return res.status(200).json({
        message: "Session is valid",
        userId: session.userId,
        sessionId: session.sessionId,
        expiresAt: session.expiresAt,
      });
    } catch (error) {
      console.error("Session verification error:", error);
      return res.status(401).json({ error: "Unauthorized: Invalid session" });
    }
  });

  return sessionsRouter;
};

export default setupSessionRoutes;
