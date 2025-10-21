// Meeting Archive - Retrieve past meeting notes and context
let meetingArchive = [];
let selectedMeetings = [];

const MEETING_TOPICS = [
    'Product Strategy', 'Q4 Planning', 'Team Sync', 'Customer Feedback',
    'Technical Architecture', 'Marketing Campaign', 'Budget Review',
    'Performance Review', 'Project Kickoff', 'Sprint Planning'
];

async function loadMeetingArchive() {
    try {
        if (!BACKEND_CONFIG.url) {
            loadMockMeetings();
            return;
        }

        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

        const response = await fetch(`${BACKEND_CONFIG.url}/api/meetings/archive?since=${threeMonthsAgo.toISOString()}`);
        const data = await response.json();

        if (data.success) {
            meetingArchive = data.meetings || [];
            displayMeetingArchive();
        } else {
            loadMockMeetings();
        }
    } catch (error) {
        console.error('Error loading meeting archive:', error);
        loadMockMeetings();
    }
}

function loadMockMeetings() {
    meetingArchive = [];
    const now = new Date();
    
    for (let i = 0; i < 25; i++) {
        const daysAgo = Math.floor(Math.random() * 90);
        const meetingDate = new Date(now);
        meetingDate.setDate(meetingDate.getDate() - daysAgo);
        
        const topic = MEETING_TOPICS[Math.floor(Math.random() * MEETING_TOPICS.length)];
        
        meetingArchive.push({
            id: 'meeting-' + Date.now() + '-' + i,
            topic: topic,
            date: meetingDate.toISOString(),
            duration: Math.floor(Math.random() * 60) + 15,
            attendees: Math.floor(Math.random() * 10) + 2,
            notes: `Key discussion points from ${topic} meeting:\n\n` +
                   `• Reviewed quarterly metrics and identified opportunities\n` +
                   `• Discussed customer feedback and priorities\n` +
                   `• Aligned on technical approach\n\n` +
                   `Action items assigned and next steps defined.`,
            hasRecording: Math.random() > 0.3,
            hasTranscript: Math.random() > 0.5,
            tags: getTags(topic)
        });
    }
    
    displayMeetingArchive();
}

function getTags(topic) {
    const tagMap = {
        'Product Strategy': ['strategy', 'product', 'roadmap'],
        'Q4 Planning': ['planning', 'quarterly', 'goals'],
        'Team Sync': ['team', 'sync', 'updates']
    };
    return tagMap[topic] || ['general'];
}

function displayMeetingArchive(filteredMeetings = null) {
    const meetings = filteredMeetings || meetingArchive;
    const container = document.getElementById('archive-meetings-list');
    
    if (!container) return;
    
    if (meetings.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 3rem;">
                <h3>No Meetings Found</h3>
            </div>
        `;
        return;
    }
    
    meetings.sort((a, b) => new Date(b.date) - new Date(a.date));
    container.innerHTML = meetings.map(meeting => createMeetingCard(meeting)).join('');
    updateArchiveStats(meetings);
    updateBatchActions();
}

function createMeetingCard(meeting) {
    const date = new Date(meeting.date);
    const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const isSelected = selectedMeetings.includes(meeting.id);
    
    return `
        <div class="meeting-archive-card ${isSelected ? 'selected' : ''}" data-meeting-id="${meeting.id}" style="background: rgba(26, 26, 36, 0.9); border: 1px solid var(--border); border-radius: 12px; padding: 1.5rem; margin-bottom: 1rem;">
            <div style="display: flex; gap: 1rem; margin-bottom: 1rem;">
                <input type="checkbox" onchange="toggleMeetingSelection('${meeting.id}')" ${isSelected ? 'checked' : ''}>
                <div style="flex: 1;">
                    <h3 style="color: var(--neon-blue); margin-bottom: 0.5rem;">${meeting.topic}</h3>
                    <div style="font-size: 0.85rem; color: var(--text-secondary);">
                        📅 ${formattedDate} • ⏱️ ${meeting.duration}min • 👥 ${meeting.attendees} attendees
                    </div>
                </div>
            </div>
            <div style="background: rgba(0,0,0,0.3); padding: 1rem; border-radius: 8px; margin-bottom: 1rem; white-space: pre-line;">
                ${meeting.notes}
            </div>
            <div style="display: flex; gap: 0.5rem;">
                <button onclick="viewMeetingDetails('${meeting.id}')" class="btn btn-quantum" style="padding: 0.5rem 1rem; font-size: 0.85rem;">View</button>
                ${meeting.hasRecording ? `<button onclick="convertToClone('${meeting.id}')" class="btn btn-neural" style="padding: 0.5rem 1rem; font-size: 0.85rem;">Convert to Clone</button>` : ''}
            </div>
        </div>
    `;
}

function toggleMeetingSelection(meetingId) {
    const index = selectedMeetings.indexOf(meetingId);
    if (index > -1) {
        selectedMeetings.splice(index, 1);
    } else {
        selectedMeetings.push(meetingId);
    }
    updateSelectedCount();
    updateBatchActions();
}

function updateSelectedCount() {
    const countEl = document.getElementById('selected-count');
    if (countEl) countEl.textContent = selectedMeetings.length;
}

function updateBatchActions() {
    const batchDiv = document.getElementById('batch-actions');
    if (batchDiv) {
        batchDiv.style.display = selectedMeetings.length > 0 ? 'block' : 'none';
    }
}

function updateArchiveStats(meetings) {
    const statsContainer = document.getElementById('archive-stats');
    if (!statsContainer) return;
    
    statsContainer.innerHTML = `
        <div class="neuro-card"><div class="stat-value" style="font-size: 2rem;">${meetings.length}</div><div>Total Meetings</div></div>
        <div class="neuro-card"><div class="stat-value" style="font-size: 2rem;">${meetings.filter(m => m.hasRecording).length}</div><div>With Recordings</div></div>
    `;
}

function generateContextSummary() {
    if (selectedMeetings.length === 0) {
        alert('Please select at least one meeting');
        return;
    }
    
    const selectedData = meetingArchive.filter(m => selectedMeetings.includes(m.id));
    let summary = '📋 MEETING CONTEXT SUMMARY\n\n';
    
    selectedData.forEach((meeting, i) => {
        summary += `${i + 1}. ${meeting.topic}\n${meeting.notes}\n\n`;
    });
    
    navigator.clipboard.writeText(summary).then(() => alert('Context copied to clipboard!'));
}

function filterMeetingsByTopic(topic) {
    const filtered = topic === 'all' ? meetingArchive : meetingArchive.filter(m => m.topic === topic);
    displayMeetingArchive(filtered);
}

function searchMeetings(query) {
    if (!query.trim()) {
        displayMeetingArchive();
        return;
    }
    const filtered = meetingArchive.filter(m => 
        m.topic.toLowerCase().includes(query.toLowerCase()) ||
        m.notes.toLowerCase().includes(query.toLowerCase())
    );
    displayMeetingArchive(filtered);
}

function viewMeetingDetails(meetingId) {
    const meeting = meetingArchive.find(m => m.id === meetingId);
    if (!meeting) return;
    alert(`${meeting.topic}\n\n${meeting.notes}`);
}

function convertToClone(meetingId) {
    const meeting = meetingArchive.find(m => m.id === meetingId);
    if (confirm(`Convert "${meeting.topic}" to AI clone?`)) {
        sessionStorage.setItem('meetingToConvert', JSON.stringify(meeting));
        window.location.hash = 'clone';
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadMeetingArchive);
} else {
    loadMeetingArchive();
}