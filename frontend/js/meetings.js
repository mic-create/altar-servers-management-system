// FILE: frontend/js/meetings.js
document.addEventListener('DOMContentLoaded', () => {
  if (!sessionStorage.getItem('sfcc_auth')) {
    window.location.href = 'index.html';
    return;
  }

  const API_BASE = window.API_BASE || 'https://altar-servers-management-system.onrender.com/api';

  const logoutBtn = document.getElementById('logoutBtn');
  const upcomingCard = document.getElementById('upcomingCard');
  const meetingsTableBody = document.getElementById('meetingsTableBody');
  const emptyMeetings = document.getElementById('emptyMeetings');
  
  const openCreateModalBtn = document.getElementById('openCreateModalBtn');
  const meetingModal = document.getElementById('meetingModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const meetingForm = document.getElementById('meetingForm');
  const modalMonthSelect = document.getElementById('modalMonthSelect');
  const modalTitleInput = document.getElementById('modalTitleInput');
  const modalTimeInput = document.getElementById('modalTimeInput');
  const modalCalculatedDateDisplay = document.getElementById('modalCalculatedDateDisplay');
  const hiddenMeetingDate = document.getElementById('hiddenMeetingDate');
  const hiddenScheduledAt = document.getElementById('hiddenScheduledAt');
  const modalDescInput = document.getElementById('modalDescInput');
  const modalError = document.getElementById('modalError');
  const toast = document.getElementById('toast');

  let allMeetings = [];

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

  fetchMeetings();

  if (openCreateModalBtn) {
    openCreateModalBtn.addEventListener('click', () => {
      populateMonthSelector();
      modalError.style.display = 'none';
      modalTitleInput.value = 'General Meeting';
      if (modalTimeInput) modalTimeInput.value = '10:00';
      modalDescInput.value = '';
      meetingModal.style.display = 'flex';
      updateCalculatedDatePreview();
    });
  }

  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
      meetingModal.style.display = 'none';
    });
  }

  if (modalMonthSelect) {
    modalMonthSelect.addEventListener('change', updateCalculatedDatePreview);
  }

  if (modalTimeInput) {
    modalTimeInput.addEventListener('change', updateScheduledAtDateTime);
  }

  async function fetchMeetings() {
    try {
      const res = await fetch(`${API_BASE}/meetings`, { credentials: 'include' });
      if (res.status === 401) {
        sessionStorage.removeItem('sfcc_auth');
        window.location.href = 'index.html';
        return;
      }
      const json = await res.json();
      if (json.success) {
        allMeetings = json.data;
        renderMeetingsPage();
      }
    } catch (err) {
      console.error('Failed to load meetings:', err);
      showToast('Unable to load meetings from server.', 'error');
    }
  }

  function getLastSaturday(year, month) {
    const date = new Date(year, month + 1, 0);
    while (date.getDay() !== 6) {
      date.setDate(date.getDate() - 1);
    }
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function formatDateTimeReadable(scheduledAt) {
    if (!scheduledAt) return '';
    const dateObj = new Date(scheduledAt);
    if (isNaN(dateObj.getTime())) return scheduledAt;
    
    const dateFormatted = dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Africa/Lagos'
    });
    const timeFormatted = dateObj.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Africa/Lagos'
    });
    return `${dateFormatted} at ${timeFormatted}`;
  }

  function renderMeetingsPage() {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const expectedDateStr = getLastSaturday(currentYear, currentMonth);

    const matchingDbMeeting = allMeetings.find(m => {
      if (!m.scheduled_at && !m.meeting_date) return false;
      const mDate = m.scheduled_at ? m.scheduled_at.split('T')[0] : m.meeting_date.split('T')[0];
      return mDate === expectedDateStr;
    });

    if (matchingDbMeeting) {
      const formattedDT = formatDateTimeReadable(matchingDbMeeting.scheduled_at || matchingDbMeeting.meeting_date);
      upcomingCard.innerHTML = `
        <div class="upcoming-details">
          <span class="badge-upcoming">Next Scheduled</span>
          <h3>${escapeHtml(matchingDbMeeting.title)}</h3>
          <p class="upcoming-date">${formattedDT}</p>
          ${matchingDbMeeting.description ? `<p class="upcoming-desc">${escapeHtml(matchingDbMeeting.description)}</p>` : ''}
          <p class="upcoming-desc">Attendance: ${matchingDbMeeting.present_count || 0} / 61</p>
        </div>
        <div class="upcoming-actions">
          <button class="btn btn-primary" onclick="window.location.href='attendance.html?meetingId=${matchingDbMeeting.id}'">Take Attendance</button>
        </div>
      `;
    } else {
      const expectedScheduledAt = `${expectedDateStr}T10:00:00+01:00`;
      const formattedExpected = formatDateTimeReadable(expectedScheduledAt);
      upcomingCard.innerHTML = `
        <div class="upcoming-details">
          <span class="badge-upcoming">Next Scheduled</span>
          <h3>General Meeting</h3>
          <p class="upcoming-date">${formattedExpected}</p>
          <p class="upcoming-desc">No database meeting record created yet for this cycle.</p>
        </div>
        <div class="upcoming-actions">
          <button class="btn btn-primary" onclick="openCreateForDate('${expectedDateStr}')">Create General Meeting</button>
        </div>
      `;
    }

    meetingsTableBody.innerHTML = '';
    const nowISO = now.toISOString();

    const pastMeetings = allMeetings.filter(m => {
      const sched = m.scheduled_at || m.meeting_date;
      return sched < nowISO;
    });

    const futureMeetings = allMeetings.filter(m => {
      const sched = m.scheduled_at || m.meeting_date;
      return sched >= nowISO && (!matchingDbMeeting || m.id !== matchingDbMeeting.id);
    });

    const displayList = [...futureMeetings, ...pastMeetings];

    if (displayList.length === 0) {
      emptyMeetings.style.display = 'block';
    } else {
      emptyMeetings.style.display = 'none';
      displayList.forEach(m => {
        const tr = document.createElement('tr');
        const sched = m.scheduled_at || m.meeting_date;
        const isCompleted = sched < nowISO;
        const statusLabel = isCompleted ? 'COMPLETED' : 'UPCOMING';
        const statusClass = isCompleted ? 'badge-completed' : 'badge-upcoming';
        const attendanceDisplay = `${m.present_count || 0} / 61`;

        tr.innerHTML = `
          <td class="date-cell">${formatDateTimeReadable(sched)}</td>
          <td class="member-name">${escapeHtml(m.title)}</td>
          <td>${attendanceDisplay}</td>
          <td><span class="status-badge ${statusClass}">${statusLabel}</span></td>
          <td class="text-right action-links">
            <button class="link-btn" onclick="window.location.href='attendance.html?meetingId=${m.id}'">View Attendance</button>
          </td>
        `;
        meetingsTableBody.appendChild(tr);
      });
    }
  }

  window.openCreateForDate = function(dateStr) {
    populateMonthSelector();
    modalError.style.display = 'none';
    modalTitleInput.value = 'General Meeting';
    if (modalTimeInput) modalTimeInput.value = '10:00';
    modalDescInput.value = '';
    hiddenMeetingDate.value = dateStr;
    updateScheduledAtDateTime();
    meetingModal.style.display = 'flex';
  };

  function populateMonthSelector() {
    if (!modalMonthSelect) return;
    modalMonthSelect.innerHTML = '';
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const year = d.getFullYear();
      const month = d.getMonth();
      const monthName = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      
      const option = document.createElement('option');
      option.value = JSON.stringify({ year, month });
      option.textContent = monthName;
      modalMonthSelect.appendChild(option);
    }
  }

  async function updateCalculatedDatePreview() {
    if (!modalMonthSelect || !modalMonthSelect.value) return;
    try {
      const { year, month } = JSON.parse(modalMonthSelect.value);
      const res = await fetch(`${API_BASE}/meetings/calculate?year=${year}&month=${month}`, { credentials: 'include' });
      const json = await res.json();
      if (json.success) {
        hiddenMeetingDate.value = json.date;
        updateScheduledAtDateTime();
      }
    } catch (err) {
      console.error('Calculation error:', err);
    }
  }

  function updateScheduledAtDateTime() {
    const dateStr = hiddenMeetingDate.value;
    const timeStr = modalTimeInput ? modalTimeInput.value : '10:00';
    if (!dateStr) return;
    
    const fullScheduledAt = `${dateStr}T${timeStr}:00+01:00`;
    if (hiddenScheduledAt) {
      hiddenScheduledAt.value = fullScheduledAt;
    }
    if (modalCalculatedDateDisplay) {
      modalCalculatedDateDisplay.value = formatDateTimeReadable(fullScheduledAt);
    }
  }

  if (meetingForm) {
    meetingForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = modalTitleInput.value.trim();
      const description = modalDescInput.value.trim();
      const scheduled_at = hiddenScheduledAt.value;

      try {
        const res = await fetch(`${API_BASE}/meetings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ title, description, scheduled_at })
        });

        if (res.status === 401) {
          sessionStorage.removeItem('sfcc_auth');
          window.location.href = 'index.html';
          return;
        }

        const json = await res.json();
        if (res.ok && json.success) {
          meetingModal.style.display = 'none';
          showToast(json.message || 'Meeting created successfully.', 'success');
          fetchMeetings();
        } else if (res.status === 409) {
          modalError.style.display = 'block';
          modalError.innerHTML = `${json.message} <button class="link-btn" onclick="window.location.href='attendance.html?meetingId=${json.existingId}'">View Meeting</button>`;
        } else {
          modalError.style.display = 'block';
          modalError.textContent = json.message || 'Failed to create meeting.';
        }
      } catch (err) {
        console.error('Create meeting submit error:', err);
        modalError.style.display = 'block';
        modalError.textContent = 'Unable to connect to server.';
      }
    });
  }

  function showToast(message, type = 'success') {
    if (!toast) return;
    toast.textContent = message;
    toast.className = `toast toast-${type}`;
    toast.style.display = 'block';
    setTimeout(() => { toast.style.display = 'none'; }, 4000);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }
});