import dotenv from 'dotenv';
dotenv.config();
import admin from 'firebase-admin';
let appAdmin;
if (!admin.apps.length) {
  const firebaseConfig = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);
  firebaseConfig.private_key = firebaseConfig.private_key.replace(/\\n/g, "\n");
  appAdmin = admin.initializeApp({
    credential: admin.credential.cert(firebaseConfig),
  });
}
// check initialization
try {
  const apps = admin.apps;
 // console.log("Firebase apps initialized:", apps.map((app) => app?.name));
} catch (error) {
  console.error("Error fetching Firebase apps:", error);
}

// Middleware to verify Firebase token
const verifyToken = async (req, res, next) => {
   // console.log("[VERIFY TOKEN] Middleware triggered.");
  
    const authHeader = req.headers.authorization;
  
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      //console.error("[AUTH ERROR] No token provided in Authorization header.");
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }
  
    const idToken = authHeader.split(" ")[1];
    //console.log(`[VERIFY TOKEN] Extracted ID token: ${idToken}`);
  
    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      req.user = decodedToken; // Attach token details to the request object
      //console.log(`[AUTH SUCCESS] User ID: ${decodedToken.uid}`);
      next(); // Proceed to the next middleware/route
    } catch (error) {
      console.error("[AUTH ERROR] Token verification failed:", error);
      return res.status(401).json({ error: "Unauthorized: Invalid token" }); // Ensure proper exit here
    }
  };
export default verifyToken;