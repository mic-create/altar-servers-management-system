// FILE: frontend/js/attendance.js
document.addEventListener('DOMContentLoaded', () => {
  if (!sessionStorage.getItem('sfcc_auth')) {
    window.location.href = 'index.html';
    return;
  }

  const API_BASE = window.API_BASE || 'http://localhost:5000/api';

  const urlParams = new URLSearchParams(window.location.search);
  const meetingId = urlParams.get('meetingId');

  if (!meetingId) {
    showError('No meeting ID specified in URL parameters.');
    return;
  }

  const logoutBtn = document.getElementById('logoutBtn');
  const meetingInfoCard = document.getElementById('meetingInfoCard');
  const statTotal = document.getElementById('statTotal');
  const statPresent = document.getElementById('statPresent');
  const statAbsent = document.getElementById('statAbsent');
  const statUnmarked = document.getElementById('statUnmarked');
  const progressText = document.getElementById('progressText');
  const progressPercentage = document.getElementById('progressPercentage');
  const progressBarFill = document.getElementById('progressBarFill');
  const searchInput = document.getElementById('searchInput');
  const markAllBtn = document.getElementById('markAllBtn');
  const clearAllBtn = document.getElementById('clearAllBtn');
  const saveAttendanceBtn = document.getElementById('saveAttendanceBtn');
  const attendanceTableBody = document.getElementById('attendanceTableBody');
  const loadingState = document.getElementById('loadingState');
  const errorState = document.getElementById('errorState');
  const errorText = document.getElementById('errorText');
  const retryBtn = document.getElementById('retryBtn');
  const emptyState = document.getElementById('emptyState');
  const toast = document.getElementById('toast');

  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const sidebar = document.getElementById('sidebar');
  const sidebarOverlay = document.getElementById('sidebarOverlay');

  let activeMembers = [];
  let attendanceMap = {};

  initMobileNavigation();

  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        await fetch(`${API_BASE}/auth/logout`, { method: 'POST', credentials: 'include' });
      } catch (err) {
        console.error('Logout error:', err);
      } finally {
        sessionStorage.removeItem('sfcc_auth');
        window.location.href = 'index.html';
      }
    });
  }

  loadMeetingAndAttendanceData();

  if (retryBtn) {
    retryBtn.addEventListener('click', loadMeetingAndAttendanceData);
  }

  if (searchInput) {
    searchInput.addEventListener('input', renderTable);
  }

  if (markAllBtn) {
    markAllBtn.addEventListener('click', () => {
      activeMembers.forEach(m => {
        attendanceMap[m.id] = 'present';
      });
      updateStatsAndRender();
      showToast('All servers marked present.', 'success');
    });
  }

  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to clear all attendance marks for this meeting?')) {
        attendanceMap = {};
        updateStatsAndRender();
        showToast('Attendance cleared.', 'info');
      }
    });
  }

  if (saveAttendanceBtn) {
    saveAttendanceBtn.addEventListener('click', saveAttendanceToServer);
  }

  function initMobileNavigation() {
    if (mobileMenuBtn && sidebar && sidebarOverlay) {
      mobileMenuBtn.addEventListener('click', () => {
        sidebar.classList.toggle('mobile-open');
        sidebarOverlay.classList.toggle('active');
      });

      sidebarOverlay.addEventListener('click', () => {
        sidebar.classList.remove('mobile-open');
        sidebarOverlay.classList.remove('active');
      });
    }
  }

  async function loadMeetingAndAttendanceData() {
    loadingState.style.display = 'flex';
    errorState.style.display = 'none';
    emptyState.style.display = 'none';
    attendanceTableBody.innerHTML = '';

    try {
      const [meetingRes, membersRes] = await Promise.all([
        fetch(`${API_BASE}/meetings/${meetingId}/attendance`, { credentials: 'include' }),
        fetch(`${API_BASE}/members?status=active`, { credentials: 'include' })
      ]);

      if (meetingRes.status === 401 || membersRes.status === 401) {
        sessionStorage.removeItem('sfcc_auth');
        window.location.href = 'index.html';
        return;
      }

      if (meetingRes.status === 404) {
        throw new Error('Meeting not found.');
      }

      if (!meetingRes.ok || !membersRes.ok) {
        throw new Error('Failed to retrieve server data.');
      }

      const meetingJson = await meetingRes.json();
      const membersJson = await membersRes.json();

      renderMeetingInfo(meetingJson.meeting || meetingJson.data);

      let membersList = [];
      if (Array.isArray(membersJson)) {
        membersList = membersJson;
      } else if (membersJson.data && Array.isArray(membersJson.data)) {
        membersList = membersJson.data;
      } else if (membersJson.members && Array.isArray(membersJson.members)) {
        membersList = membersJson.members;
      }

      activeMembers = membersList
        .filter(m => !m.status || m.status.toLowerCase() === 'active')
        .sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''));

      if (activeMembers.length === 0) {
        loadingState.style.display = 'none';
        emptyState.style.display = 'flex';
        return;
      }

      const existingRecords = meetingJson.attendance || meetingJson.data || [];
      attendanceMap = {};
      
      const recordsArray = Array.isArray(meetingJson.data) ? meetingJson.data : (Array.isArray(existingRecords) ? existingRecords : []);
      
      recordsArray.forEach(record => {
        if (record.member_id && record.status) {
          attendanceMap[record.member_id] = record.status.toLowerCase();
        }
      });

      loadingState.style.display = 'none';
      updateStatsAndRender();

    } catch (err) {
      console.error('Data load error:', err);
      loadingState.style.display = 'none';
      errorText.textContent = err.message || 'Unable to load attendance data.';
      errorState.style.display = 'flex';
    }
  }

  function renderMeetingInfo(meeting) {
    if (!meeting) {
      meetingInfoCard.innerHTML = `<p>General Meeting (ID: ${escapeHtml(meetingId)})</p>`;
      return;
    }

    const scheduledDate = meeting.scheduled_at || meeting.meeting_date || '';
    let formattedDate = scheduledDate;
    
    try {
      const dateObj = new Date(scheduledDate);
      if (!isNaN(dateObj.getTime())) {
        formattedDate = dateObj.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          timeZone: 'Africa/Lagos'
        });
      }
    } catch (e) {
      console.error('Date parse error:', e);
    }

    meetingInfoCard.innerHTML = `
      <div class="meeting-info-header">
        <span class="badge-upcoming">Official Assembly</span>
        <h2>${escapeHtml(meeting.title || 'General Meeting')}</h2>
      </div>
      <div class="meeting-info-meta">
        <p><strong>Scheduled Date & Time:</strong> ${formattedDate}</p>
        <p><strong>Association:</strong> SFCC Altar Servers Association, Idimu</p>
        <p><strong>Database Meeting ID:</strong> ${escapeHtml(String(meeting.id || meetingId))}</p>
      </div>
      ${meeting.description ? `<p style="margin-top: 0.5rem; color: var(--text-muted); font-size: 0.875rem;">${escapeHtml(meeting.description)}</p>` : ''}
    `;
  }

  function updateStatsAndRender() {
    const total = activeMembers.length;
    let presentCount = 0;
    let absentCount = 0;

    activeMembers.forEach(m => {
      const status = attendanceMap[m.id];
      if (status === 'present') presentCount++;
      else if (status === 'absent') absentCount++;
    });

    const unmarkedCount = total - (presentCount + absentCount);

    statTotal.textContent = total;
    statPresent.textContent = presentCount;
    statAbsent.textContent = absentCount;
    statUnmarked.textContent = unmarkedCount;

    const markedCount = presentCount + absentCount;
    const percentage = total > 0 ? Math.round((markedCount / total) * 100) : 0;

    progressText.textContent = `${markedCount} / ${total} marked`;
    progressPercentage.textContent = `${percentage}%`;
    progressBarFill.style.width = `${percentage}%`;

    renderTable();
  }

  function renderTable() {
    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
    attendanceTableBody.innerHTML = '';

    const filtered = activeMembers.filter(m => {
      const name = (m.full_name || '').toLowerCase();
      return name.includes(searchTerm);
    });

    if (filtered.length === 0) {
      attendanceTableBody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">No altar servers match your search criteria.</td></tr>`;
      return;
    }

    filtered.forEach((member, index) => {
      const tr = document.createElement('tr');
      const status = attendanceMap[member.id] || 'unmarked';
      
      let badgeClass = 'badge-unmarked';
      let badgeText = 'UNMARKED';
      if (status === 'present') {
        badgeClass = 'badge-present';
        badgeText = 'PRESENT';
      } else if (status === 'absent') {
        badgeClass = 'badge-absent';
        badgeText = 'ABSENT';
      }

      tr.innerHTML = `
        <td style="color: var(--text-muted); font-weight: 600;">${String(index + 1).padStart(2, '0')}</td>
        <td class="member-name">${escapeHtml(member.full_name)}</td>
        <td><span class="status-badge ${badgeClass}">${badgeText}</span></td>
        <td class="action-cell">
          <button type="button" class="btn-status ${status === 'present' ? 'active-present' : ''}" onclick="setAttendance('${member.id}', 'present')">Present</button>
          <button type="button" class="btn-status ${status === 'absent' ? 'active-absent' : ''}" onclick="setAttendance('${member.id}', 'absent')">Absent</button>
        </td>
      `;
      attendanceTableBody.appendChild(tr);
    });
  }

  window.setAttendance = function(memberId, status) {
    if (attendanceMap[memberId] === status) {
      delete attendanceMap[memberId];
    } else {
      attendanceMap[memberId] = status;
    }
    updateStatsAndRender();
  };

  async function saveAttendanceToServer() {
    saveAttendanceBtn.disabled = true;
    saveAttendanceBtn.textContent = 'Saving attendance...';

    const attendancePayload = activeMembers.map(m => ({
      member_id: m.id,
      status: attendanceMap[m.id] || 'unmarked'
    }));

    try {
      const res = await fetch(`${API_BASE}/meetings/${meetingId}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ attendance: attendancePayload })
      });

      if (res.status === 401) {
        sessionStorage.removeItem('sfcc_auth');
        window.location.href = 'index.html';
        return;
      }

      const json = await res.json();
      if (res.ok && json.success) {
        showToast('Attendance saved successfully.', 'success');
      } else {
        throw new Error(json.message || 'Failed to save attendance.');
      }
    } catch (err) {
      console.error('Save attendance error:', err);
      showToast(err.message || 'Network error saving attendance.', 'error');
    } finally {
      saveAttendanceBtn.disabled = false;
      saveAttendanceBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
          <polyline points="17 21 17 13 7 13 7 21"></polyline>
          <polyline points="7 3 7 8 15 8"></polyline>
        </svg>
        <span>Save Attendance</span>
      `;
    }
  }

  function showError(msg) {
    if (loadingState) loadingState.style.display = 'none';
    if (errorText) errorText.textContent = msg;
    if (errorState) errorState.style.display = 'flex';
  }

  function showToast(message, type = 'success') {
    if (!toast) return;
    toast.textContent = message;
    toast.className = `toast-notification toast-${type}`;
    toast.style.display = 'flex';
    setTimeout(() => { toast.style.display = 'none'; }, 4000);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }
});