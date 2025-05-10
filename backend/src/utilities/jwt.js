const jwt = require("jsonwebtoken");

const JWT_LIFETIME = "1w";  // Token lifetime (week)

// function to create jwt tokens from id and name
const CreateJwt = (userId, username) => {

    // construct payload
    const payload = {
        userId: userId,
        username: username,
    };
    
    // Ensure secret exists
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("JWT_SECRET is not defined in .env");
    }
    
    // Generate the JWT token
    const token = jwt.sign(payload, secret, {
        expiresIn: JWT_LIFETIME,  // Set the expiration time for the token
    });
    
    return token;
};

// Middleware to authenticate JWT token
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ success: false, message: "Unauthorized: No token provided" });
    }

    const token = authHeader.split(" ")[1]; // Extract token from "Bearer <token>"

    try {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new Error("JWT_SECRET is not defined in .env");
        }

        // Verify token
        const decoded = jwt.verify(token, secret);

        // Attach user info to request object
        req.user = {
            id: decoded.userId,
            username: decoded.username,
        };

        next(); // Proceed to the next middleware or route
    } catch (error) {
        return res.status(403).json({ success: false, message: "Unauthorized: Invalid or expired token" });
    }
};

module.exports = { CreateJwt, authenticate };