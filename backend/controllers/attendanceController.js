const pool = require('../config/database');

// Get attendance for a specific meeting along with all active members
exports.getMeetingAttendance = async (req, res) => {
  try {
    const { meetingId } = req.params;

    // Verify meeting exists using PostgreSQL meetings.id
    const meetingCheck = await pool.query('SELECT * FROM meetings WHERE id = $1', [meetingId]);
    if (meetingCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Meeting not found.' });
    }

    const meeting = meetingCheck.rows[0];

    // Fetch all active members alphabetically, joined with existing attendance for this meeting if any
    const query = `
      SELECT 
        m.id AS member_id,
        m.full_name,
        m.status AS member_status,
        a.status AS attendance_status
      FROM members m
      LEFT JOIN attendance a ON m.id = a.member_id AND a.meeting_id = $1
      WHERE m.status = 'active'
      ORDER BY m.full_name ASC;
    `;
    const result = await pool.query(query, [meetingId]);

    res.json({
      success: true,
      meeting,
      data: result.rows
    });
  } catch (err) {
    console.error('Error fetching meeting attendance:', err);
    res.status(500).json({ success: false, message: 'Server error while fetching attendance.' });
  }
};

// Save or update attendance using safe UPSERT behavior with meetings.id
exports.saveMeetingAttendance = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { attendance } = req.body;

    if (!Array.isArray(attendance) || attendance.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid attendance data format.' });
    }

    // Verify meeting exists using PostgreSQL meetings.id
    const meetingCheck = await pool.query('SELECT id FROM meetings WHERE id = $1', [meetingId]);
    if (meetingCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Meeting not found.' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      for (const record of attendance) {
        const { member_id, status } = record;

        if (!member_id || !['present', 'absent'].includes(status)) {
          throw new Error('Invalid member ID or status value.');
        }

        const memberCheck = await client.query('SELECT id, status FROM members WHERE id = $1', [member_id]);
        if (memberCheck.rows.length === 0) {
          throw new Error(`Member ID ${member_id} does not exist.`);
        }

        const upsertQuery = `
          INSERT INTO attendance (meeting_id, member_id, status, created_at, updated_at)
          VALUES ($1, $2, $3, NOW(), NOW())
          ON CONFLICT (meeting_id, member_id)
          DO UPDATE SET status = EXCLUDED.status, updated_at = NOW();
        `;
        await client.query(upsertQuery, [meetingId, member_id, status]);
      }

      await client.query('COMMIT');
      res.json({
        success: true,
        message: 'Attendance saved successfully.'
      });
    } catch (txErr) {
      await client.query('ROLLBACK');
      throw txErr;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error saving attendance:', err);
    res.status(400).json({ success: false, message: err.message || 'Server error while saving attendance.' });
  }
};