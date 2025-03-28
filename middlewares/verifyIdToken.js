import firebaseAdmin from "../utils/firebaseAdmin.js";

const verifyIdToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized: Missing token" });
    }

    const idToken = authHeader.split(" ")[1]; // Extract token after "Bearer "

    // Verify Firebase ID token
    const decodedToken = await firebaseAdmin.auth().verifyIdToken(idToken);
    if (!decodedToken) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    req.decodedToken = decodedToken; // Attach user info to request object
    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(403).json({ error: "Forbidden: Invalid token" });
  }
};

export default verifyIdToken;
