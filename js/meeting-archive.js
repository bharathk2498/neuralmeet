// Meeting Archive - Retrieve past meeting notes and context
let meetingArchive = [];
let selectedMeetings = [];

const MEETING_TOPICS = [
    'Product Strategy',
    'Q4 Planning',
    'Team Sync',
    'Customer Feedback',
    'Technical Architecture',
    'Marketing Campaign',
    'Budget Review',
    'Performance Review',
    'Project Kickoff',
    'Sprint Planning'
];

// Initialize meeting archive on page load
async function loadMeetingArchive() {
    try {
        if (!BACKEND_CONFIG.url) {
            loadMockMeetings();
            return;
        }

        // Get meetings from last 3 months
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
    // Generate mock meeting data for last 3 months
    meetingArchive = [];
    const now = new Date();
    
    for (let i = 0; i < 25; i++) {
        const daysAgo = Math.floor(Math.random() * 90); // Random day in last 3 months
        const meetingDate = new Date(now);
        meetingDate.setDate(meetingDate.getDate() - daysAgo);
        
        const topic = MEETING_TOPICS[Math.floor(Math.random() * MEETING_TOPICS.length)];
        
        meetingArchive.push({
            id: 'meeting-' + Date.now() + '-' + i,
            topic: topic,
            date: meetingDate.toISOString(),
            duration: Math.floor(Math.random() * 60) + 15, // 15-75 minutes
            attendees: Math.floor(Math.random() * 10) + 2,
            notes: `Key discussion points from ${topic} meeting:\n\n` +
                   `• ${generateMockNote()}\n` +
                   `• ${generateMockNote()}\n` +
                   `• ${generateMockNote()}\n\n` +
                   `Action items assigned and next steps defined.`,
            hasRecording: Math.random() > 0.3,
            hasTranscript: Math.random() > 0.5,
            tags: generateTags(topic)
        });
    }
    
    displayMeetingArchive();
}

function generateMockNote() {
    const notes = [
        'Reviewed quarterly metrics and identified growth opportunities',
        'Discussed customer feedback and prioritized feature requests',
        'Aligned on technical approach for upcoming sprint',
        'Analyzed market trends and competitive positioning',
        'Reviewed budget allocations and resource planning',
        'Evaluated team performance and set new objectives',
        'Brainstormed creative solutions for current challenges',
        'Defined success criteria and key milestones',
        'Coordinated cross-functional dependencies',
        'Established timeline and deliverable expectations'
    ];
    return notes[Math.floor(Math.random() * notes.length)];
}

function generateTags(topic) {
    const tagMap = {
        'Product Strategy': ['strategy', 'product', 'roadmap'],
        'Q4 Planning': ['planning', 'quarterly', 'goals'],
        'Team Sync': ['team', 'sync', 'updates'],
        'Customer Feedback': ['customer', 'feedback', 'insights'],
        'Technical Architecture': ['technical', 'architecture', 'engineering'],
        'Marketing Campaign': ['marketing', 'campaign', 'outreach'],
        'Budget Review': ['budget', 'finance', 'review'],
        'Performance Review': ['performance', 'review', 'evaluation'],
        'Project Kickoff': ['project', 'kickoff', 'launch'],
        'Sprint Planning': ['sprint', 'planning', 'development']
    };
    return tagMap[topic] || ['general'];
}

function displayMeetingArchive(filteredMeetings = null) {
    const meetings = filteredMeetings || meetingArchive;
    const container = document.getElementById('archive-meetings-list');
    
    if (!container) return;
    
    if (meetings.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                <div style="font-size: 3rem; margin-bottom: 1rem;">📁</div>
                <h3>No Meetings Found</h3>
                <p>No meetings match your search criteria</p>
            </div>
        `;
        return;
    }
    
    // Sort by date (newest first)
    meetings.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    container.innerHTML = meetings.map(meeting => createMeetingCard(meeting)).join('');
    
    // Update stats
    updateArchiveStats(meetings);
}

function createMeetingCard(meeting) {
    const date = new Date(meeting.date);
    const formattedDate = date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
    });
    const timeAgo = getTimeAgo(date);
    
    const isSelected = selectedMeetings.includes(meeting.id);
    
    return `
        <div class="meeting-archive-card ${isSelected ? 'selected' : ''}" data-meeting-id="${meeting.id}" style="background: linear-gradient(135deg, rgba(26, 26, 36, 0.9), rgba(17, 17, 24, 0.9)); border: 1px solid var(--border); border-radius: 16px; padding: 1.5rem; margin-bottom: 1.5rem; transition: all 0.3s;">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                <div style="flex: 1; display: flex; gap: 1rem;">
                    <input type="checkbox" 
                           class="meeting-checkbox" 
                           data-meeting-id="${meeting.id}"
                           ${isSelected ? 'checked' : ''}
                           onchange="toggleMeetingSelection('${meeting.id}')"
                           style="width: 20px; height: 20px; cursor: pointer;">
                    <div style="flex: 1;">
                        <h3 style="font-size: 1.2rem; font-weight: 700; color: var(--neon-blue); margin-bottom: 0.5rem;">
                            ${meeting.topic}
                        </h3>
                        <div style="display: flex; gap: 1rem; flex-wrap: wrap; font-size: 0.85rem; color: var(--text-secondary);">
                            <span>📅 ${formattedDate}</span>
                            <span>⏱️ ${meeting.duration}min</span>
                            <span>👥 ${meeting.attendees} attendees</span>
                            <span style="color: var(--text-muted);">${timeAgo}</span>
                        </div>
                    </div>
                </div>
                <div style="display: flex; gap: 0.5rem;">
                    ${meeting.hasRecording ? '<span title="Has Recording" style="font-size: 1.2rem;">🎥</span>' : ''}
                    ${meeting.hasTranscript ? '<span title="Has Transcript" style="font-size: 1.2rem;">📝</span>' : ''}
                </div>
            </div>
            
            <div style="margin-bottom: 1rem;">
                <div style="font-weight: 600; margin-bottom: 0.5rem; color: var(--text-secondary); font-size: 0.9rem;">Meeting Notes:</div>
                <div style="background: rgba(0, 0, 0, 0.4); padding: 1rem; border-radius: 8px; border-left: 3px solid var(--neon-blue); white-space: pre-line; font-size: 0.9rem; line-height: 1.6;">
                    ${meeting.notes}
                </div>
            </div>
            
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1rem;">
                ${meeting.tags.map(tag => `
                    <span style="padding: 0.25rem 0.75rem; background: rgba(79, 70, 229, 0.2); border: 1px solid var(--neon-blue); border-radius: 12px; font-size: 0.75rem; color: var(--neon-blue);">
                        ${tag}
                    </span>
                `).join('')}
            </div>
            
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                <button onclick="viewMeetingDetails('${meeting.id}')" class="btn btn-quantum" style="padding: 0.6rem 1.2rem; font-size: 0.85rem;">
                    View Full Details
                </button>
                ${meeting.hasRecording ? `
                    <button onclick="convertToClone('${meeting.id}')" class="btn btn-neural" style="padding: 0.6rem 1.2rem; font-size: 0.85rem;">
                        Convert to Clone
                    </button>
                ` : ''}
            </div>
        </div>
    `;
}

function getTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
}

function updateArchiveStats(meetings) {
    const statsContainer = document.getElementById('archive-stats');
    if (!statsContainer) return;
    
    const totalMeetings = meetings.length;
    const withRecordings = meetings.filter(m => m.hasRecording).length;
    const totalHours = Math.floor(meetings.reduce((sum, m) => sum + m.duration, 0) / 60);
    const topicsCount = new Set(meetings.map(m => m.topic)).size;
    
    statsContainer.innerHTML = `
        <div class="neuro-card" style="text-align: center;">
            <div class="stat-value" style="font-size: 2rem;">${totalMeetings}</div>
            <div style="color: var(--text-secondary);">Total Meetings</div>
        </div>
        <div class="neuro-card" style="text-align: center;">
            <div class="stat-value" style="font-size: 2rem;">${withRecordings}</div>
            <div style="color: var(--text-secondary);">With Recordings</div>
        </div>
        <div class="neuro-card" style="text-align: center;">
            <div class="stat-value" style="font-size: 2rem;">${totalHours}h</div>
            <div style="color: var(--text-secondary);">Total Time</div>
        </div>
        <div class="neuro-card" style="text-align: center;">
            <div class="stat-value" style="font-size: 2rem;">${topicsCount}</div>
            <div style="color: var(--text-secondary);">Unique Topics</div>
        </div>
    `;
}

function filterMeetingsByTopic(topic) {
    if (topic === 'all') {
        displayMeetingArchive();
    } else {
        const filtered = meetingArchive.filter(m => m.topic === topic);
        displayMeetingArchive(filtered);
    }
}

function searchMeetings(query) {
    if (!query.trim()) {
        displayMeetingArchive();
        return;
    }
    
    const lowerQuery = query.toLowerCase();
    const filtered = meetingArchive.filter(m => 
        m.topic.toLowerCase().includes(lowerQuery) ||
        m.notes.toLowerCase().includes(lowerQuery) ||
        m.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
    
    displayMeetingArchive(filtered);
}

function toggleMeetingSelection(meetingId) {
    const index = selectedMeetings.indexOf(meetingId);
    if (index > -1) {
        selectedMeetings.splice(index, 1);
    } else {
        selectedMeetings.push(meetingId);
    }
    
    updateSelectedCount();
    
    // Update card visual state
    const card = document.querySelector(`[data-meeting-id="${meetingId}"]`);
    if (card) {
        if (selectedMeetings.includes(meetingId)) {
            card.style.borderColor = 'var(--neon-blue)';
            card.style.boxShadow = '0 0 20px rgba(0, 212, 255, 0.4)';
        } else {
            card.style.borderColor = 'var(--border)';
            card.style.boxShadow = 'none';
        }
    }
}

function updateSelectedCount() {
    const countEl = document.getElementById('selected-count');
    const batchActions = document.getElementById('batch-actions');
    
    if (countEl) {
        countEl.textContent = selectedMeetings.length;
    }
    
    if (batchActions) {
        batchActions.style.display = selectedMeetings.length > 0 ? 'block' : 'none';
    }
}

function generateContextSummary() {
    if (selectedMeetings.length === 0) {
        alert('Please select at least one meeting to generate context');
        return;
    }
    
    const selectedData = meetingArchive.filter(m => selectedMeetings.includes(m.id));
    
    let summary = '📋 MEETING CONTEXT SUMMARY FOR UPCOMING MEETING\n';
    summary += '═'.repeat(60) + '\n\n';
    summary += `Generated from ${selectedMeetings.length} meeting(s) over the last 3 months\n\n`;
    
    selectedData.forEach((meeting, index) => {
        const date = new Date(meeting.date).toLocaleDateString();
        summary += `\n${index + 1}. ${meeting.topic.toUpperCase()} (${date})\n`;
        summary += '─'.repeat(50) + '\n';
        summary += meeting.notes + '\n';
    });
    
    summary += '\n\n💡 PREPARATION TIPS:\n';
    summary += '• Review all action items from previous meetings\n';
    summary += '• Prepare updates on ongoing initiatives\n';
    summary += '• Bring relevant data and metrics\n';
    summary += '• Consider dependencies and blockers\n';
    
    // Copy to clipboard
    navigator.clipboard.writeText(summary).then(() => {
        alert('✅ Meeting context copied to clipboard!\n\nPaste this into your meeting prep document or share with attendees.');
    }).catch(() => {
        // Fallback: show in modal
        showContextModal(summary);
    });
}

function showContextModal(content) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 800px; max-height: 90vh; overflow-y: auto;">
            <div class="modal-header">
                <h3 class="modal-title">Meeting Context Summary</h3>
                <button onclick="this.closest('.modal').remove()" class="modal-close">×</button>
            </div>
            <div style="padding: 1.5rem;">
                <textarea readonly style="width: 100%; min-height: 400px; background: rgba(0,0,0,0.5); color: white; border: 1px solid var(--border); border-radius: 8px; padding: 1rem; font-family: monospace; font-size: 0.9rem; line-height: 1.6; white-space: pre-line;">${content}</textarea>
                <div style="display: flex; gap: 1rem; margin-top: 1rem;">
                    <button onclick="copyToClipboard(\`${content.replace(/`/g, '\\`')}\`); this.closest('.modal').remove();" class="btn btn-quantum" style="flex: 1;">
                        📋 Copy to Clipboard
                    </button>
                    <button onclick="this.closest('.modal').remove();" class="btn btn-neural" style="flex: 1;">
                        Close
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert('✅ Context copied to clipboard!');
    });
}

function viewMeetingDetails(meetingId) {
    const meeting = meetingArchive.find(m => m.id === meetingId);
    if (!meeting) return;
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 700px;">
            <div class="modal-header">
                <h3 class="modal-title">${meeting.topic}</h3>
                <button onclick="this.closest('.modal').remove()" class="modal-close">×</button>
            </div>
            <div style="padding: 1.5rem;">
                <div style="background: rgba(0,0,0,0.3); padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem;">
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
                        <div>
                            <strong style="color: var(--text-secondary);">Date:</strong><br>
                            ${new Date(meeting.date).toLocaleString()}
                        </div>
                        <div>
                            <strong style="color: var(--text-secondary);">Duration:</strong><br>
                            ${meeting.duration} minutes
                        </div>
                        <div>
                            <strong style="color: var(--text-secondary);">Attendees:</strong><br>
                            ${meeting.attendees} people
                        </div>
                        <div>
                            <strong style="color: var(--text-secondary);">Resources:</strong><br>
                            ${meeting.hasRecording ? '🎥 Recording' : ''} ${meeting.hasTranscript ? '📝 Transcript' : ''}
                        </div>
                    </div>
                </div>
                
                <div style="margin-bottom: 1.5rem;">
                    <strong style="color: var(--neon-blue); display: block; margin-bottom: 0.5rem;">Meeting Notes:</strong>
                    <div style="background: rgba(0,0,0,0.3); padding: 1rem; border-radius: 8px; border-left: 3px solid var(--neon-blue); white-space: pre-line; line-height: 1.6;">
                        ${meeting.notes}
                    </div>
                </div>
                
                <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem;">
                    ${meeting.tags.map(tag => `
                        <span style="padding: 0.25rem 0.75rem; background: rgba(79, 70, 229, 0.2); border: 1px solid var(--neon-blue); border-radius: 12px; font-size: 0.75rem; color: var(--neon-blue);">
                            ${tag}
                        </span>
                    `).join('')}
                </div>
                
                <div style="display: flex; gap: 1rem;">
                    ${meeting.hasRecording ? `
                        <button onclick="convertToClone('${meeting.id}'); this.closest('.modal').remove();" class="btn btn-quantum" style="flex: 1;">
                            Convert to AI Clone
                        </button>
                    ` : ''}
                    <button onclick="toggleMeetingSelection('${meeting.id}'); this.closest('.modal').remove();" class="btn btn-neural" style="flex: 1;">
                        ${selectedMeetings.includes(meeting.id) ? 'Remove from' : 'Add to'} Selection
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

async function convertToClone(meetingId) {
    const meeting = meetingArchive.find(m => m.id === meetingId);
    if (!meeting) return;
    
    if (!meeting.hasRecording) {
        alert('⚠️ This meeting does not have a recording available for clone conversion.');
        return;
    }
    
    if (confirm(`🎯 Convert "${meeting.topic}" to AI Clone?\n\nThis will:\n• Extract your presentation from the meeting\n• Create a reusable AI clone\n• Save it to your Clone Vault\n\nContinue?`)) {
        // Store meeting data for clone creation
        sessionStorage.setItem('meetingToConvert', JSON.stringify(meeting));
        
        // Navigate to generate tab
        switchTab('generate');
        
        // Scroll to top
        window.scrollTo(0, 0);
        
        // Show notification
        setTimeout(() => {
            alert('✅ Meeting loaded!\n\nConfigure your clone settings below and click "Generate Quantum Clone" to create your AI clone from this meeting.');
        }, 500);
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // Load archive when switching to archive tab
        const archiveTab = document.querySelector('[onclick*="archive"]');
        if (archiveTab) {
            archiveTab.addEventListener('click', loadMeetingArchive);
        }
        // Also load on page load if archive tab is visible
        if (window.location.hash === '#clone') {
            setTimeout(loadMeetingArchive, 1000);
        }
    });
} else {
    setTimeout(loadMeetingArchive, 1000);
}
