require("dotenv").config();
const express = require("express");
const cors = require("cors");

// DB Connection and Setup
const { ConnectDb } = require("./db/database");

const app = express();
const PORT = process.env.PORT || 3000;


// Enable CORS for localhost:8080
app.use(cors({
    origin: ["http://localhost:8080", "http://127.0.0.1:8080"],
    methods: ["GET", "POST", "PUT", "DELETE"]
}));

// Use JSON Format
app.use(express.json());

// Define the routes 
const SetupEndpoints = () => {
    // USER ROUTES
    app.use("/login", require("./user/login"));
    app.use("/register", require("./user/register"));
    
    // BOARD ROUTES
    app.use('/board', require('./boards/board')); // POST, GET and DELETE routes
    
    // COLUMN ROUTES
    app.use('/columns', require('./boards/columns/column'));
    
    // STICKY ROUTES
    app.use('/stickies', require('./boards/stickies/sticky'));
};

// ENTRY POINT OF THE APP
(async () => {
    if (!process.env.TASKLY_ENVIRONMENT) {
        console.error(".env file not present, aborting. Please add an .env file at /backend/.env");
        
        return false;
    }

    // Connect to postgresql and setup tables
    await ConnectDb();

    // Setup endpoints
    SetupEndpoints();
    
    // Start the server
    app.listen(PORT, () => {
        console.log(`Server started on port ${PORT}`);
    });
})();