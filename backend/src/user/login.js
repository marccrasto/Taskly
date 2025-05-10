const router = require("express").Router();

const { GetClient } = require("../db/database");
const bcrypt = require("bcrypt");
const { CreateJwt } = require("../utilities/jwt");


// Validation constants
const NAME_MIN = 2;
const NAME_MAX = 20;
const PASS_MIN = 6;
const PASS_MAX = 32;

router.post("/", async (req, res) => {
    const { username, password } = req.body;
    
    // Validate username and password
    if (!username || typeof(username) !== 'string' || username.length < NAME_MIN || username.length > NAME_MAX) {
        return res.status(400).json({ success: false, error: `Username must be a string between ${NAME_MIN} and ${NAME_MAX} characters` });
    }
    
    if (!password || typeof(password) !== 'string' || password.length < PASS_MIN || password.length > PASS_MAX) {
        return res.status(400).json({ success: false, error: `Password must be a string between ${PASS_MIN} and ${PASS_MAX} characters` });
    }
    
    try {        
        // Check if the username exists
        const result = await GetClient().query("SELECT * FROM \"user\" WHERE username = $1", [username]);
        
        if (result.rows.length === 0) {
            return res.status(400).json({ success: false, error: "Invalid credentials." });
        }
        
        const user = result.rows[0];
        
        // Compare the password with the stored hashed password
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(400).json({ success: false, error: "Invalid credentials." });
        }
        
        // Generate a JWT
        const jwt = CreateJwt(user.id, user.username);
        
        // Return success with JWT
        return res.status(200).json({
            success: true,
            token: jwt,
        });
    } catch (error) {
        console.error("Login error: ", error);
        return res.status(500).json({ success: false, error: "Database error" });
    }
});

module.exports = router;
