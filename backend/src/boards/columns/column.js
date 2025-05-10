const router = require("express").Router();

const { GetClient } = require("../../db/database");

// Create a new column in a board
router.post("/", async (req, res) => {
    try {
        const { board_id, name, position } = req.body;
        
        if (!board_id || !name || position === undefined) {
            return res.status(400).json({ error: "board_id, name, and position are required" });
        }
        
        const client = GetClient();
        const result = await client.query(
            `INSERT INTO "board_column" (board_id, name, position) 
            VALUES ($1, $2, $3) 
            RETURNING id, board_id, name, position, created_at`,
            [board_id, name, position]
        );
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error("Error creating column:", error);
        res.status(500).json({ error: "Failed to create column" });
    }
});

// Get all columns for a board
router.get("/board/:board_id", async (req, res) => {
    try {
        const { board_id } = req.params;
        
        const client = GetClient();
        const result = await client.query(
            `SELECT * FROM "board_column" 
            WHERE board_id = $1
            ORDER BY position ASC`,
            [board_id]
        );
        
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching columns:", error);
        res.status(500).json({ error: "Failed to fetch columns" });
    }
});

// Update a column
router.put("/:column_id", async (req, res) => {
    try {
        const { column_id } = req.params;
        const { name, position } = req.body;
        
        if (!name && position === undefined) {
            return res.status(400).json({ error: "At least one field (name or position) is required" });
        }
        
        const client = GetClient();
        let query = 'UPDATE "board_column" SET ';
        const values = [];
        let valueIndex = 1;
        
        if (name) {
            query += `name = $${valueIndex}, `;
            values.push(name);
            valueIndex++;
        }
        
        if (position !== undefined) {
            query += `position = $${valueIndex}, `;
            values.push(position);
            valueIndex++;
        }
        
        // Remove trailing comma and space if present
        if (query.endsWith(', ')) {
            query = query.slice(0, -2);
        }
        
        // Add WHERE clause
        query += ` WHERE id = $${valueIndex} RETURNING *`;
        values.push(column_id);
        
        const result = await client.query(query, values);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Column not found" });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error("Error updating column:", error);
        res.status(500).json({ error: "Failed to update column" });
    }
});

// Delete a column
router.delete("/:column_id", async (req, res) => {
    try {
        const { column_id } = req.params;
        
        const client = GetClient();
        const result = await client.query(
            `DELETE FROM "board_column" WHERE id = $1 RETURNING *`,
            [column_id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Column not found" });
        }
        
        res.json({ message: "Column deleted successfully", column: result.rows[0] });
    } catch (error) {
        console.error("Error deleting column:", error);
        res.status(500).json({ error: "Failed to delete column" });
    }
});

module.exports = router; 