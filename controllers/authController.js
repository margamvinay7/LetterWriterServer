import firebaseAdmin from "../utils/firebaseAdmin.js";
import jwt from "jsonwebtoken";

// Ensure environment variables are properly loaded
const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key"; // Use a secure secret in production
const JWT_EXPIRY = process.env.JWT_EXPIRY || "1h"; // Set token expiry time

export const login = async (req, res) => {
  try {
    const { userAccessToken } = req.body;

    console.log(userAccessToken);

    if (!userAccessToken) {
      return res
        .status(400)
        .json({ error: "ID token and userAccessToken are required" });
    }

    // Verify Firebase ID token
    const decodedToken = req.decodedToken;
    console.log("decodedToken", decodedToken);
    // // Generate JWT for session management
    // const accessToken = jwt.sign(
    //   { uid: decodedToken.uid, email: decodedToken.email },
    //   JWT_SECRET,
    //   { expiresIn: JWT_EXPIRY, algorithm: "HS256" }
    // );

    // Optionally fetch user details from Firebase
    const user = await firebaseAdmin.auth().getUser(decodedToken.uid);

    res.status(200).json({
      message: "Authentication successful",
      //   token: accessToken,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
      },
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ error: "Failed to authenticate user" });
  }
};
