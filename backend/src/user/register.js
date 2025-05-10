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
    
    // Validate username and password length
    if (!username || typeof(username) !== 'string' || username.length < NAME_MIN || username.length > NAME_MAX) {
        return res.status(400).json({ success: false, error: `Field 'username' must be a string between ${NAME_MIN} and ${NAME_MAX} characters` });
    }
    
    if (!password || typeof(password) !== 'string' || password.length < PASS_MIN || password.length > PASS_MAX) {
        return res.status(400).json({ success: false, error: `Field 'password' must be a string between ${PASS_MIN} and ${PASS_MAX} characters` });
    }
    
    try {  
        // Check if username already exists
        const result = await GetClient().query("SELECT * FROM \"user\" WHERE username = $1", [username]);
        
        if (result.rows.length > 0) {
            return res.status(400).json({ success: false, error: "Username already exists" });
        }
        
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Insert the new user into the database
        const insertResult = await GetClient().query(
            "INSERT INTO \"user\" (username, password) VALUES ($1, $2) RETURNING *",
            [username, hashedPassword]
        );
        
        const newUser = insertResult.rows[0];
        
        // Call CreateJwt to generate the token
        const jwt = CreateJwt(newUser.id, newUser.username);
        
        res.status(201).json({
            success: true,
            token: jwt,
        });
        
    } catch (error) {
        console.error("Register error: ", error);
        res.status(500).json({ success: false, error: "Database error" });
    }
});

module.exports = router;
