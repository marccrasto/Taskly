const { Client } = require("pg");

let client;

// Connect to Postgreql DB
const ConnectDb = async () => {
    // Create client if not already created
    if (!client) {
        client = new Client({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            user: process.env.DB_USER,
            password: process.env.DB_PWD,
            database: process.env.DB_NAME,

            // Apprantly this is not actually needed
            // ssl: { rejectUnauthorized: false }, // Used for self-signed SSL
        });
        
        try {
            await client.connect();
            console.log(`Connected to PostgreSQL at ${process.env.DB_HOST}`);
            await SetupTables(client);  // Setup tables on successful connection
            return client;
        } catch (error) {
            console.error("Database connection error:", error);
            process.exit(1);
        }
    }
};

const GetClient = () => {
    if (!client) {
        console.error("Client is undefined");
    }

    return client;
}

// Place table logic here!
const SetupTables = async (client) => {
    try {
        // USER TABLE
        await client.query(`
            CREATE TABLE IF NOT EXISTS "user" (
                id SERIAL PRIMARY KEY,
                username VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL
            );
        `);

        // Create update timestamp function if it doesn't exist
        await client.query(`
            CREATE OR REPLACE FUNCTION update_timestamp()
            RETURNS TRIGGER AS $$
            BEGIN
               NEW.updated_at = CURRENT_TIMESTAMP;
               RETURN NEW;
            END;
            $$ language 'plpgsql';
        `);

        // BOARD
        await client.query(`
            CREATE TABLE IF NOT EXISTS "board" (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                visibility TEXT NOT NULL DEFAULT 'public',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE
            );
            CREATE INDEX IF NOT EXISTS idx_board_user_id ON "board"(user_id);
        `);
        
        // Add trigger to board table
        await client.query(`
            DROP TRIGGER IF EXISTS update_board_timestamp ON "board";
            CREATE TRIGGER update_board_timestamp
            BEFORE UPDATE ON "board"
            FOR EACH ROW
            EXECUTE FUNCTION update_timestamp();
        `);

        // BOARD COLUMNS
        await client.query(`
            CREATE TABLE IF NOT EXISTS "board_column" (
                id SERIAL PRIMARY KEY,
                board_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                position INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                FOREIGN KEY (board_id) REFERENCES "board"(id) ON DELETE CASCADE
            );

            CREATE INDEX IF NOT EXISTS idx_board_column_board_id ON "board_column"(board_id);
        `);
        
        // Add trigger to board_column table
        await client.query(`
            DROP TRIGGER IF EXISTS update_board_column_timestamp ON "board_column";
            CREATE TRIGGER update_board_column_timestamp
            BEFORE UPDATE ON "board_column"
            FOR EACH ROW
            EXECUTE FUNCTION update_timestamp();
        `);

        // BOARD STICKIES
        await client.query(`
            CREATE TABLE IF NOT EXISTS "sticky" (
                id SERIAL PRIMARY KEY,
                column_id INTEGER NOT NULL,
                text TEXT NOT NULL,
                description TEXT,
                priority_level INTEGER NOT NULL CHECK (priority_level >= 1 AND priority_level <= 5),
                due_date TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                FOREIGN KEY (column_id) REFERENCES "board_column"(id) ON DELETE CASCADE
            );

            CREATE INDEX IF NOT EXISTS idx_sticky_column_id ON "sticky"(column_id);    
        `);

        console.log("Tables setup complete.");
        
    } catch (error) {
        console.error("Table setup failed:", error);
        process.exit(1);
    }
};

module.exports = { ConnectDb, GetClient };
