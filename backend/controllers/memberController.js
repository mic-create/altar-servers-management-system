const db = require('../config/database');

// GET /api/members - Retrieve members with optional status filtering, search, and alphabetical sorting
exports.getMembers = async (req, res, next) => {
  try {
    let { status, search } = req.query;
    let queryText = 'SELECT id, full_name, status, created_at, updated_at FROM members WHERE 1=1';
    const queryParams = [];
    let paramIndex = 1;

    // Default status handling: if status is not specified or 'active', filter by 'active'. 
    // If 'inactive' or 'all' is requested, filter accordingly.
    if (!status) {
      status = 'active';
    }

    if (status !== 'all') {
      queryText += ` AND status = $${paramIndex++}`;
      queryParams.push(status.toLowerCase());
    }

    if (search && search.trim() !== '') {
      queryText += ` AND full_name ILIKE $${paramIndex++}`;
      queryParams.push(`%${search.trim()}%`);
    }

    queryText += ' ORDER BY full_name ASC';

    const result = await db.query(queryText, queryParams);

    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (err) {
    console.error('Error fetching members:', err.message);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// GET /api/members/:id - Retrieve a single member by ID
exports.getMemberById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const queryText = 'SELECT id, full_name, status, created_at, updated_at FROM members WHERE id = $1';
    const result = await db.query(queryText, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    res.status(200).json({
      success: true,
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Error fetching member by ID:', err.message);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// POST /api/members - Create a new altar server
exports.createMember = async (req, res, next) => {
  try {
    let { full_name } = req.body;

    if (!full_name || typeof full_name !== 'string' || full_name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Member full name is required'
      });
    }

    full_name = full_name.trim().toUpperCase();

    // Check for duplicate full_name (case-insensitive check)
    const checkDup = await db.query('SELECT id FROM members WHERE LOWER(full_name) = LOWER($1)', [full_name]);
    if (checkDup.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'An altar server with this name already exists'
      });
    }

    const insertQuery = `
      INSERT INTO members (full_name, status) 
      VALUES ($1, 'active') 
      RETURNING id, full_name, status, created_at, updated_at
    `;
    const result = await db.query(insertQuery, [full_name]);

    res.status(201).json({
      success: true,
      message: 'Altar server created successfully',
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Error creating member:', err.message);
    if (err.code === '23505') { // Postgres unique violation code
      return res.status(409).json({
        success: false,
        message: 'An altar server with this name already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// PUT /api/members/:id - Update a member's name
exports.updateMember = async (req, res, next) => {
  try {
    const { id } = req.params;
    let { full_name } = req.body;

    if (!full_name || typeof full_name !== 'string' || full_name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Member full name is required'
      });
    }

    full_name = full_name.trim().toUpperCase();

    // Check if member exists
    const memberCheck = await db.query('SELECT id FROM members WHERE id = $1', [id]);
    if (memberCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    // Check for duplicate name collision with other records
    const dupCheck = await db.query('SELECT id FROM members WHERE LOWER(full_name) = LOWER($1) AND id != $2', [full_name, id]);
    if (dupCheck.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'An altar server with this name already exists'
      });
    }

    const updateQuery = `
      UPDATE members 
      SET full_name = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $2 
      RETURNING id, full_name, status, created_at, updated_at
    `;
    const result = await db.query(updateQuery, [full_name, id]);

    res.status(200).json({
      success: true,
      message: 'Altar server updated successfully',
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Error updating member:', err.message);
    if (err.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'An altar server with this name already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// PATCH /api/members/:id/status - Change member status (active / inactive)
exports.updateMemberStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    let { status } = req.body;

    if (!status || !['active', 'inactive'].includes(status.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Valid status ("active" or "inactive") is required'
      });
    }

    status = status.toLowerCase();

    const memberCheck = await db.query('SELECT id FROM members WHERE id = $1', [id]);
    if (memberCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    const updateQuery = `
      UPDATE members 
      SET status = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $2 
      RETURNING id, full_name, status, created_at, updated_at
    `;
    const result = await db.query(updateQuery, [status, id]);

    res.status(200).json({
      success: true,
      message: `Altar server status updated to ${status}`,
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Error updating member status:', err.message);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};