const router = require('express').Router();

const { authenticate } = require('../utilities/jwt.js');
const { GetClient } = require("../db/database.js");


const NAME_MIN = 1;
const NAME_MAX = 200;

// Create a board
router.post("/", authenticate, async (req, res) => {
    let { name, make_empty } = req.body;
    const userId = req.user.id;

    // If name is provided, ensure its the right format
    if (name && (typeof(name) !== 'string' || name.length < NAME_MIN || name.length > NAME_MAX)) {
        return res.status(400).json({ success: false, error: `Name must be a string of ${NAME_MAX} to ${NAME_MAX} chacraters long.` });
    }

    // If name is not provided, set a default name
    if (!name) {
        name = 'Unnamed board';
    }

    try {
        // Create board and return its ID
        const result = await GetClient().query(
            `INSERT INTO "board" (name, user_id) VALUES ($1, $2) RETURNING id, name, user_id, created_at, updated_at`,
            [name, userId]
        );

        const board = result.rows[0];

        // Add default columns if 'make_empty' is not set
        if (!make_empty) {
            const defaultColumns = [
                { name: "TODO", position: 1 },
                { name: "IN PROGRESS", position: 2 },
                { name: "DONE", position: 3 },
            ];

            // Insert default columns into the 'board_column' table
            const columnInsertPromises = defaultColumns.map((column) =>
                GetClient().query(
                    `INSERT INTO "board_column" (board_id, name, position) VALUES ($1, $2, $3)`,
                    [board.id, column.name, column.position]
                )
            );

            await Promise.all(columnInsertPromises);
        }

        return res.status(201).json({ success: true, board });

    } catch (error) {
        console.error("Error creating board:", error);
        return res.status(500).json({ success: false, error: "Internal server error." });
    }
});

// Get all boards for a user
router.get("/", authenticate, async (req, res) => {
    const userId = req.user.id;

    try {
        const result = await GetClient().query(
            `SELECT * FROM "board" WHERE user_id = $1`,
            [userId]
        );
        return res.status(200).json({ success: true, boards: result.rows });
    } catch (error) {
        console.error("Error retrieving boards:", error);
        return res.status(500).json({ success: false, error: "Internal server error." });
    }
});


// Get a board by ID
// boards are by default public
router.get("/:board_id", authenticate, async (req, res) => {
    let { board_id } = req.params;
    const userId = req.user.id;

    // parse string as int
    const id_int = parseInt(board_id, 10);
    if (!id_int || typeof(id_int) !== 'number') {
        return res.status(400).json({ success: false, error: "Board id must be a positive number" });
    }

    // set board id
    board_id = id_int;

    
    try {
        // 1. Find the board
        const boardResult = await GetClient().query(
            `SELECT * FROM "board" WHERE id = $1`,
            [board_id]
        );
        
        // If board doesn't exist, return 404
        if (boardResult.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: "Board not found." 
            });
        }
        
        const board = boardResult.rows[0];
        
        // 2. Check if user is the owner
        board.owner = board.user_id === userId;
        
        // 3. Get all columns for the board with their positions
        const columnsResult = await GetClient().query(
            `SELECT * FROM "board_column" 
             WHERE board_id = $1 
             ORDER BY position ASC`,
            [board_id]
        );
        
        const columns = columnsResult.rows;
        
        // 4. Get all stickies for this board in one query
        const stickiesResult = await GetClient().query(
            `SELECT s.* 
             FROM "sticky" s
             JOIN "board_column" bc ON s.column_id = bc.id
             WHERE bc.board_id = $1
             ORDER BY s.priority_level ASC, s.due_date ASC NULLS LAST`,
            [board_id]
        );
        
        // 5. Organize stickies into their respective columns
        columns.forEach(column => {
            column.stickies = stickiesResult.rows.filter(sticky => 
                sticky.column_id === column.id
            );
        });
        
        // 6. Add columns to board
        board.columns = columns;
        
        return res.status(200).json({ 
            success: true, 
            board: board 
        });
        
    } catch (error) {
        console.error("Error retrieving board:", error);
        return res.status(500).json({ 
            success: false, 
            error: "Internal server error." 
        });
    }
});

// Update a board
router.put("/:board_id", authenticate, async (req, res) => {
    let { board_id } = req.params;
    const { name } = req.body;
    const userId = req.user.id;

    // Parse string as int
    const id_int = parseInt(board_id, 10);
    if (!id_int || typeof(id_int) !== 'number') {
        return res.status(400).json({ success: false, error: "Board id must be a positive number" });
    }

    // Set board id
    board_id = id_int;

    // Validate name if provided
    if (name !== undefined) {
        if (typeof(name) !== 'string' || name.length < NAME_MIN || name.length > NAME_MAX) {
            return res.status(400).json({ 
                success: false, 
                error: `Name must be a string of ${NAME_MIN} to ${NAME_MAX} characters long.` 
            });
        }
    } else {
        return res.status(400).json({ 
            success: false, 
            error: "Name is required to update the board." 
        });
    }

    try {
        // Check if board exists and belongs to user
        const boardCheck = await GetClient().query(
            `SELECT id, name FROM "board" WHERE id = $1 AND user_id = $2`,
            [board_id, userId]
        );

        if (boardCheck.rowCount === 0) {
            return res.status(404).json({ 
                success: false, 
                error: "Board not found or unauthorized." 
            });
        }

        // Update the board name
        const result = await GetClient().query(
            `UPDATE "board" 
             SET name = $1, updated_at = NOW()
             WHERE id = $2
             RETURNING id, name, user_id, created_at, updated_at`,
            [name, board_id]
        );

        const updatedBoard = result.rows[0];

        return res.status(200).json({ 
            success: true, 
            board: updatedBoard 
        });

    } catch (error) {
        console.error("Error updating board:", error);
        return res.status(500).json({ 
            success: false, 
            error: "Internal server error." 
        });
    }
});

// Delete a board (and its columns and stickies)
router.delete("/:delete_id", authenticate, async (req, res) => {
    const { delete_id } = req.params;

    try {
        // Ensure the board belongs to the user
        const boardCheck = await GetClient().query(
            `SELECT id FROM "board" WHERE id = $1 AND user_id = $2`,
            [delete_id, req.user.id]
        );

        // ensure board exists
        if (boardCheck.rowCount === 0) {
            return res.status(404).json({ success: false, error: "Board not found or unauthorized." });
        }

        // Delete board (stickies and columns will be deleted due to ON DELETE CASCADE)
        await GetClient().query(`DELETE FROM "board" WHERE id = $1`, [delete_id]);

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error("Error deleting board:", error);
        return res.status(500).json({ success: false, error: "Internal server error." });
    }
});

module.exports = router;
