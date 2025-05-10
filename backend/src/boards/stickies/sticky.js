const router = require("express").Router();

const { GetClient } = require("../../db/database");

// Create a new sticky
router.post("/", async (req, res) => {
    try {
        const { column_id, text, description, priority_level, due_date } = req.body;
        
        if (!column_id || !text || !priority_level) {
            return res.status(400).json({ success: false, error: "column_id, text, and priority_level are required" });
        }
        
        // Validate priority level (1-3)
        if (priority_level < 1 || priority_level > 3) {
            return res.status(400).json({ success: false, error: "priority_level must be between 1 and 3" });
        }
        
        const client = GetClient();
        const query = `
            INSERT INTO "sticky" (column_id, text, description, priority_level, due_date)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, column_id, text, description, priority_level, due_date, created_at
        `;
        
        const values = [column_id, text, description || null, priority_level, due_date || null];
        const result = await client.query(query, values);
        
        res.status(201).json({ success: true, sticky: result.rows[0] });
    } catch (error) {
        console.error("Error creating sticky:", error);
        res.status(500).json({ success: false, error: "Server error." });
    }
});

// Get all stickies for a column
router.get("/column/:column_id", async (req, res) => {
    try {
        const { column_id } = req.params;
        
        const client = GetClient();
        const result = await client.query(
            `SELECT * FROM "sticky" WHERE column_id = $1`,
            [column_id]
        );
        
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching stickies:", error);
        res.status(500).json({ success: false, error: "Server error." });
    }
});

// Get a specific sticky by ID
router.get("/:sticky_id", async (req, res) => {
    try {
        const { sticky_id } = req.params;
        
        const client = GetClient();
        const result = await client.query(
            `SELECT * FROM "sticky" WHERE id = $1`,
            [sticky_id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Sticky not found" });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error("Error fetching sticky:", error);
        res.status(500).json({ success: false, error: "Server error." });
    }
});

// Update a sticky
router.put("/:sticky_id", async (req, res) => {
    try {
        const { sticky_id } = req.params;
        const { column_id, text, description, priority_level, due_date } = req.body;
        
        if (!Object.keys(req.body).length) {
            return res.status(400).json({ error: "At least one field is required for update" });
        }
        
        // Validate priority level if provided
        if (priority_level !== undefined && (priority_level < 1 || priority_level > 5)) {
            return res.status(400).json({ error: "priority_level must be between 1 and 5" });
        }
        
        const client = GetClient();
        let query = 'UPDATE "sticky" SET ';
        const values = [];
        let valueIndex = 1;
        
        // Build query based on provided fields
        if (column_id !== undefined) {
            query += `column_id = $${valueIndex}, `;
            values.push(column_id);
            valueIndex++;
        }
        
        if (text !== undefined) {
            query += `text = $${valueIndex}, `;
            values.push(text);
            valueIndex++;
        }
        
        if (description !== undefined) {
            query += `description = $${valueIndex}, `;
            values.push(description);
            valueIndex++;
        }
        
        if (priority_level !== undefined) {
            query += `priority_level = $${valueIndex}, `;
            values.push(priority_level);
            valueIndex++;
        }
        
        if (due_date !== undefined) {
            query += `due_date = $${valueIndex}, `;
            values.push(due_date);
            valueIndex++;
        }
        
        // Remove trailing comma and space
        query = query.slice(0, -2);
        
        // Add WHERE clause
        query += ` WHERE id = $${valueIndex} RETURNING *`;
        values.push(sticky_id);
        
        const result = await client.query(query, values);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Sticky not found" });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error("Error updating sticky:", error);
        res.status(500).json({ success: false, error: "Server error." });
    }
});

// Move a sticky to a different column
router.put("/:sticky_id/move", async (req, res) => {
    try {
        const { sticky_id } = req.params;
        const { new_column_id } = req.body;
        
        if (!new_column_id) {
            return res.status(400).json({ error: "new_column_id is required" });
        }
        
        const client = GetClient();
        const result = await client.query(
            `UPDATE "sticky" SET column_id = $1 WHERE id = $2 RETURNING *`,
            [new_column_id, sticky_id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Sticky not found" });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error("Error moving sticky:", error);
        res.status(500).json({ success: false, error: "Server error." });
    }
});

// Delete a sticky
router.delete("/:sticky_id", async (req, res) => {
    try {
        const { sticky_id } = req.params;
        
        const client = GetClient();
        const result = await client.query(
            `DELETE FROM "sticky" WHERE id = $1 RETURNING *`,
            [sticky_id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Sticky not found" });
        }
        
        res.json({ message: "Sticky deleted successfully", sticky: result.rows[0] });
    } catch (error) {
        console.error("Error deleting sticky:", error);
        res.status(500).json({ success: false, error: "Server error." });
    }
});

module.exports = router; 