// FILE: backend/controllers/meetingController.js
const pool = require('../config/database');

exports.getMeetings = async (req, res) => {
  try {
    const query = `
      SELECT m.*, 
             (SELECT COUNT(*) FROM attendance a WHERE a.meeting_id = m.id AND a.status = 'present') AS present_count
      FROM meetings m
      ORDER BY m.scheduled_at DESC
    `;
    const result = await pool.query(query);
    return res.status(200).json({ success: true, data: result.rows || [] });
  } catch (err) {
    console.error('Server error fetching meetings:', err);
    return res.status(500).json({ success: false, message: 'Database error fetching meetings.' });
  }
};

exports.calculateLastSaturdayPreview = async (req, res) => {
  try {
    const { year, month } = req.query;
    const y = parseInt(year, 10);
    const m = parseInt(month, 10);

    if (isNaN(y) || isNaN(m)) {
      return res.status(400).json({ success: false, message: 'Invalid year or month parameters.' });
    }

    const date = new Date(y, m + 1, 0);
    while (date.getDay() !== 6) {
      date.setDate(date.getDate() - 1);
    }

    const resY = date.getFullYear();
    const resM = String(date.getMonth() + 1).padStart(2, '0');
    const resD = String(date.getDate()).padStart(2, '0');
    const dateStr = `${resY}-${resM}-${resD}`;
    const scheduledAtStr = `${dateStr}T10:00:00+01:00`;

    const formatted = date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    return res.status(200).json({ success: true, date: dateStr, scheduled_at: scheduledAtStr, formatted });
  } catch (err) {
    console.error('Calculate Saturday error:', err);
    return res.status(500).json({ success: false, message: 'Server error calculating date.' });
  }
};

exports.getMeetingById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM meetings WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Meeting not found.' });
    }

    return res.status(200).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Get meeting by ID error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.getMeetingAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    
    const meetingResult = await pool.query('SELECT * FROM meetings WHERE id = $1', [id]);
    if (meetingResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Meeting not found.' });
    }

    const meeting = meetingResult.rows[0];
    const attendanceResult = await pool.query('SELECT * FROM attendance WHERE meeting_id = $1', [id]);

    return res.status(200).json({
      success: true,
      meeting,
      data: attendanceResult.rows || []
    });
  } catch (err) {
    console.error('Get meeting attendance error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.createMeeting = async (req, res) => {
  try {
    const { title, description, meeting_date, scheduled_at, time } = req.body;
    
    let finalScheduledAt = scheduled_at;
    if (!finalScheduledAt && meeting_date) {
      const timeStr = time || '10:00';
      finalScheduledAt = `${meeting_date}T${timeStr}:00+01:00`;
    }

    if (!finalScheduledAt) {
      return res.status(400).json({ success: false, message: 'Meeting scheduled date and time are required.' });
    }

    const cleanDate = finalScheduledAt.split('T')[0];

    // Duplicate protection check
    const duplicateCheck = await pool.query(
      'SELECT id FROM meetings WHERE scheduled_at = $1 OR meeting_date = $2',
      [finalScheduledAt, cleanDate]
    );

    if (duplicateCheck.rows.length > 0) {
      return res.status(409).json({ 
        success: false, 
        message: 'A General Meeting is already scheduled for this date and time.',
        existingId: duplicateCheck.rows[0].id
      });
    }

    const query = `
      INSERT INTO meetings (title, description, meeting_date, scheduled_at) 
      VALUES ($1, $2, $3, $4) 
      RETURNING *
    `;
    const values = [title || 'General Meeting', description || '', cleanDate, finalScheduledAt];
    const result = await pool.query(query, values);

    return res.status(201).json({ success: true, message: 'Meeting created successfully.', data: result.rows[0] });
  } catch (err) {
    console.error('Create meeting server error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error.' });
  }
};

exports.saveAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { attendance } = req.body; // Array of { member_id, status }

    const meetingCheck = await pool.query('SELECT id FROM meetings WHERE id = $1', [id]);
    if (meetingCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Meeting not found.' });
    }

    // Process each attendance record
    for (const record of attendance) {
      const { member_id, status } = record;
      
      if (!['present', 'absent'].includes(status)) {
        // If unmarked, delete any existing record
        await pool.query('DELETE FROM attendance WHERE meeting_id = $1 AND member_id = $2', [id, member_id]);
      } else {
        // Upsert attendance record
        const upsertQuery = `
          INSERT INTO attendance (meeting_id, member_id, status)
          VALUES ($1, $2, $3)
          ON CONFLICT (meeting_id, member_id)
          DO UPDATE SET status = EXCLUDED.status, updated_at = CURRENT_TIMESTAMP
        `;
        await pool.query(upsertQuery, [id, member_id, status]);
      }
    }

    return res.status(200).json({ success: true, message: 'Attendance saved successfully.' });
  } catch (err) {
    console.error('Save attendance error:', err);
    return res.status(500).json({ success: false, message: 'Server error saving attendance.' });
  }
};

exports.deleteMeeting = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM meetings WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Meeting not found.' });
    }

    return res.status(200).json({ success: true, message: 'Meeting deleted successfully.' });
  } catch (err) {
    console.error('Delete meeting error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};