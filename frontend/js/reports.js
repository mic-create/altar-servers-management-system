// FILE: frontend/js/reports.js
document.addEventListener('DOMContentLoaded', () => {
  const mobileMenuToggle = document.getElementById('mobileMenuToggle');
  const sidebar = document.getElementById('sidebar');
  const sidebarOverlay = document.getElementById('sidebarOverlay');

  if (mobileMenuToggle && sidebar && sidebarOverlay) {
    mobileMenuToggle.addEventListener('click', () => {
      sidebar.classList.toggle('active');
      sidebarOverlay.classList.toggle('active');
    });

    sidebarOverlay.addEventListener('click', () => {
      sidebar.classList.remove('active');
      sidebarOverlay.classList.remove('active');
    });
  }

  const token = localStorage.getItem('sfcc_auth_token') || sessionStorage.getItem('sfcc_auth');
  if (!token) {
    window.location.href = 'index.html';
    return;
  }

  const API_BASE = window.API_BASE || ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') 
    ? 'http://127.0.0.1:5000/api' 
    : 'https://altar-servers-management-system.onrender.com/api');

  const loadingState = document.getElementById('loadingState');
  const errorState = document.getElementById('errorState');
  const errorMessage = document.getElementById('errorMessage');
  const retryBtn = document.getElementById('retryBtn');
  const reportsDashboard = document.getElementById('reportsDashboard');

  let reportDataCache = null;

  async function fetchReports() {
    const currentAuthToken = localStorage.getItem('sfcc_auth_token') || sessionStorage.getItem('sfcc_auth');
    try {
      if (loadingState) loadingState.style.display = 'block';
      if (errorState) errorState.style.display = 'none';
      if (reportsDashboard) reportsDashboard.style.display = 'none';

      const response = await fetch(`${API_BASE}/reports`, { 
        headers: { 'Authorization': `Bearer ${currentAuthToken}` },
        credentials: 'include' 
      });

      if (response.status === 401) {
        localStorage.removeItem('sfcc_auth_token');
        sessionStorage.removeItem('sfcc_auth');
        window.location.href = 'index.html';
        return;
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text();
        console.error('Non-JSON response received:', textResponse);
        throw new Error('Server returned an invalid response format (not JSON).');
      }

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to retrieve system reports.');
      }

      reportDataCache = result;
      renderReports(result);

      if (loadingState) loadingState.style.display = 'none';
      if (reportsDashboard) reportsDashboard.style.display = 'block';

    } catch (err) {
      console.error('Error loading reports:', err);
      if (loadingState) loadingState.style.display = 'none';
      if (errorMessage) errorMessage.textContent = err.message || 'Unable to load reports.';
      if (errorState) errorState.style.display = 'block';
    }
  }

  function renderReports(data) {
    document.getElementById('statTotalMembers').textContent = data.summary.total_members;
    document.getElementById('statTotalMeetings').textContent = data.summary.total_meetings;
    document.getElementById('statTotalPresent').textContent = data.summary.total_present_records;
    document.getElementById('statOverallRate').textContent = `${data.summary.overall_attendance_rate}%`;

    renderMemberTable(data.members);
    renderMeetingTable(data.meetings);
  }

  function renderMemberTable(members) {
    const tbody = document.getElementById('memberStatsTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (!members || members.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 32px;">No altar servers found in database.</td></tr>';
      return;
    }

    members.forEach((m, index) => {
      const tr = document.createElement('tr');
      const isGood = m.attendance_rate >= 70;
      const rateBadgeClass = isGood ? 'badge-success' : 'badge-danger';

      tr.innerHTML = `
        <td class="text-muted" style="font-weight: 600;">${String(index + 1).padStart(2, '0')}</td>
        <td><strong class="member-name-cell">${escapeHtml(m.name)}</strong></td>
        <td class="text-center">${m.meetings_attended}</td>
        <td class="text-center">${m.meetings_absent}</td>
        <td class="text-right">
          <span class="rate-badge ${rateBadgeClass}">${m.attendance_rate}%</span>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  function renderMeetingTable(meetings) {
    const tbody = document.getElementById('meetingHistoryTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (!meetings || meetings.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 32px;">No meeting records available yet.</td></tr>';
      return;
    }

    meetings.forEach((meeting) => {
      const formattedDate = meeting.scheduled_at ? new Date(meeting.scheduled_at).toLocaleString('en-US', {
        weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      }) : 'Scheduled Assembly';

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="meeting-date-cell">${formattedDate}</td>
        <td><strong class="meeting-title-cell">${escapeHtml(meeting.title)}</strong></td>
        <td class="text-center">${meeting.present_count}</td>
        <td class="text-center">${meeting.absent_count}</td>
        <td class="text-center"><span class="table-stat-bold">${meeting.attendance_percentage}%</span></td>
        <td class="text-right">
          <button class="action-btn edit-btn view-meeting-btn" data-id="${meeting.id}">
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            <span>View Report</span>
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    document.querySelectorAll('.view-meeting-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetBtn = e.target.closest('.view-meeting-btn');
        if (!targetBtn) return;
        const meetingId = parseInt(targetBtn.getAttribute('data-id'), 10);
        openMeetingModal(meetingId);
      });
    });
  }

  function openMeetingModal(meetingId) {
    if (!reportDataCache) return;
    const meeting = reportDataCache.meetings.find(m => m.id === meetingId);
    if (!meeting) return;

    document.getElementById('modalMeetingTitle').textContent = meeting.title;
    document.getElementById('modalMeetingMeta').textContent = `Date: ${meeting.scheduled_at ? new Date(meeting.scheduled_at).toLocaleString() : 'N/A'}  •  Present: ${meeting.present_count}  •  Absent: ${meeting.absent_count}`;

    const modalBodyTable = document.getElementById('modalAttendanceBody');
    if (!modalBodyTable) return;
    modalBodyTable.innerHTML = '';

    reportDataCache.members.forEach(member => {
      const record = member.history.find(h => h.meeting_id === meetingId);
      const status = record ? record.status : 'unmarked';

      let statusBadgeClass = 'badge-unmarked';
      if (status === 'present') statusBadgeClass = 'badge-success';
      if (status === 'absent') statusBadgeClass = 'badge-danger';

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong class="member-name-cell">${escapeHtml(member.name)}</strong></td>
        <td class="text-right"><span class="status-pill ${statusBadgeClass}">${status.toUpperCase()}</span></td>
      `;
      modalBodyTable.appendChild(tr);
    });

    document.getElementById('meetingModal').style.display = 'flex';
  }

  const closeModalBtn = document.getElementById('closeModalBtn');
  if (closeModalBtn) closeModalBtn.addEventListener('click', () => { document.getElementById('meetingModal').style.display = 'none'; });
  
  const modalCloseActionBtn = document.getElementById('modalCloseActionBtn');
  if (modalCloseActionBtn) modalCloseActionBtn.addEventListener('click', () => { document.getElementById('meetingModal').style.display = 'none'; });

  const memberSearchInput = document.getElementById('memberSearchInput');
  if (memberSearchInput) {
    memberSearchInput.addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase();
      if (!reportDataCache) return;
      const filtered = reportDataCache.members.filter(m => m.name.toLowerCase().includes(term));
      renderMemberTable(filtered);
    });
  }

  const printReportBtn = document.getElementById('printReportBtn');
  if (printReportBtn) printReportBtn.addEventListener('click', () => { window.print(); });

  const exportCsvBtn = document.getElementById('exportCsvBtn');
  if (exportCsvBtn) {
    exportCsvBtn.addEventListener('click', () => {
      if (!reportDataCache || !reportDataCache.members) return;
      let csvContent = "data:text/csv;charset=utf-8,No.,Altar Server Name,Meetings Attended,Meetings Absent,Attendance Rate (%)\n";
      
      reportDataCache.members.forEach((m, index) => {
        csvContent += `${index + 1},"${m.name.replace(/"/g, '""')}",${m.meetings_attended},${m.meetings_absent},${m.attendance_rate}\n`;
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `SFCC_Altar_Servers_Attendance_Report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  }

  if (retryBtn) retryBtn.addEventListener('click', fetchReports);

  function escapeHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  fetchReports();
});