// FILE: backend/controllers/reportController.js
const pool = require('../config/database');

exports.getSystemReports = async (req, res) => {
  try {
    const membersResult = await pool.query("SELECT id, full_name FROM members ORDER BY full_name ASC");
    const membersList = membersResult.rows || [];
    const totalMembers = membersList.length;

    const meetingsResult = await pool.query("SELECT * FROM meetings ORDER BY id DESC");
    const meetings = meetingsResult.rows || [];
    const totalMeetings = meetings.length;

    const presentResult = await pool.query("SELECT COUNT(*) FROM attendance WHERE status = 'present'");
    const totalPresentRecords = parseInt(presentResult.rows[0].count, 10);

    const meetingReports = [];
    for (const meeting of meetings) {
      const attResult = await pool.query("SELECT member_id, status FROM attendance WHERE meeting_id = $1", [meeting.id]);
      const attRows = attResult.rows;
      const presentCount = attRows.filter(r => r.status === 'present').length;
      const absentCount = attRows.filter(r => r.status === 'absent').length;
      const percentage = totalMembers > 0 ? Math.round((presentCount / totalMembers) * 100) : 0;

      meetingReports.push({
        id: meeting.id,
        title: meeting.title || meeting.name || 'Meeting / Assembly',
        scheduled_at: meeting.scheduled_at || meeting.meeting_date || meeting.date || null,
        present_count: presentCount,
        absent_count: absentCount,
        attendance_percentage: percentage
      });
    }

    const memberReports = [];
    let cumulativePresent = 0;
    let cumulativePossible = totalMeetings * totalMembers;

    for (const member of membersList) {
      const memberId = member.id;
      const memberName = member.full_name || 'Altar Server';

      const memAttResult = await pool.query("SELECT meeting_id, status FROM attendance WHERE member_id = $1", [memberId]);
      const memAttRows = memAttResult.rows;

      const attendedCount = memAttRows.filter(r => r.status === 'present').length;
      const absentCount = Math.max(0, totalMeetings - attendedCount);
      const rate = totalMeetings > 0 ? Math.round((attendedCount / totalMeetings) * 100) : 0;

      cumulativePresent += attendedCount;

      memberReports.push({
        id: memberId,
        name: memberName,
        meetings_attended: attendedCount,
        meetings_absent: absentCount,
        attendance_rate: rate,
        history: memAttRows
      });
    }

    const overallRate = cumulativePossible > 0 ? Math.round((cumulativePresent / cumulativePossible) * 100) : 0;

    return res.status(200).json({
      success: true,
      summary: {
        total_members: totalMembers,
        total_meetings: totalMeetings,
        total_present_records: totalPresentRecords,
        overall_attendance_rate: overallRate
      },
      meetings: meetingReports,
      members: memberReports
    });

  } catch (err) {
    console.error('Database error generating reports:', err);
    return res.status(500).json({ success: false, message: 'Database error generating reports: ' + err.message });
  }
};