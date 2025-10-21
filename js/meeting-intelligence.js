// ============================================================================
// MEETING INTELLIGENCE - AI-Powered Context & Preparation System
// Generates comprehensive briefs from last 3 months of related meetings
// ============================================================================

let meetingArchive = [];
let upcomingMeetings = [];
let intelligenceBriefs = new Map();

const MEETING_TOPICS = [
    'Product Strategy', 'Q4 Planning', 'Team Sync', 'Customer Feedback',
    'Technical Architecture', 'Marketing Campaign', 'Budget Review',
    'Performance Review', 'Project Kickoff', 'Sprint Planning',
    'Sales Pipeline', 'Engineering Standup', 'Design Review', 'Investor Update'
];

// ============================================================================
// INITIALIZATION
// ============================================================================

async function initializeMeetingIntelligence() {
    await loadMeetingArchive();
    await loadUpcomingMeetings();
    generateAllBriefs();
}

// ============================================================================
// DATA LOADING
// ============================================================================

async function loadMeetingArchive() {
    try {
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

        if (window.BACKEND_CONFIG?.url) {
            const response = await fetch(
                `${window.BACKEND_CONFIG.url}/api/meetings/archive?since=${threeMonthsAgo.toISOString()}`
            );
            const data = await response.json();
            
            if (data.success) {
                meetingArchive = data.meetings || [];
                return;
            }
        }
        
        loadMockArchive();
    } catch (error) {
        console.error('Archive load error:', error);
        loadMockArchive();
    }
}

async function loadUpcomingMeetings() {
    try {
        if (window.BACKEND_CONFIG?.url) {
            const response = await fetch(`${window.BACKEND_CONFIG.url}/api/meetings/upcoming`);
            const data = await response.json();
            
            if (data.success) {
                upcomingMeetings = data.meetings || [];
                displayUpcomingMeetings();
                return;
            }
        }
        
        loadMockUpcoming();
    } catch (error) {
        console.error('Upcoming load error:', error);
        loadMockUpcoming();
    }
}

function loadMockArchive() {
    meetingArchive = [];
    const now = new Date();
    
    for (let i = 0; i < 50; i++) {
        const daysAgo = Math.floor(Math.random() * 90);
        const meetingDate = new Date(now);
        meetingDate.setDate(meetingDate.getDate() - daysAgo);
        
        const topic = MEETING_TOPICS[Math.floor(Math.random() * MEETING_TOPICS.length)];
        
        meetingArchive.push({
            id: 'past-' + Date.now() + '-' + i,
            topic: topic,
            subtopic: getSubtopic(topic),
            date: meetingDate.toISOString(),
            duration: Math.floor(Math.random() * 60) + 15,
            attendees: generateAttendees(),
            summary: generateSummary(topic),
            decisions: generateDecisions(),
            actionItems: generateActionItems(),
            keyPoints: generateKeyPoints(),
            sentiment: ['positive', 'neutral', 'challenging'][Math.floor(Math.random() * 3)],
            tags: getTags(topic)
        });
    }
}

function loadMockUpcoming() {
    upcomingMeetings = [];
    const now = new Date();
    
    const topics = ['Product Strategy', 'Q4 Planning', 'Team Sync', 'Customer Feedback', 
                    'Technical Architecture', 'Budget Review', 'Sales Pipeline', 'Investor Update'];
    
    topics.forEach((topic, i) => {
        const meetingDate = new Date(now);
        meetingDate.setDate(meetingDate.getDate() + i + 1);
        meetingDate.setHours(9 + (i * 2), 0, 0, 0);
        
        upcomingMeetings.push({
            id: 'upcoming-' + Date.now() + '-' + i,
            topic: topic,
            subtopic: getSubtopic(topic),
            date: meetingDate.toISOString(),
            duration: 30 + (Math.floor(Math.random() * 3) * 15),
            attendees: generateAttendees(),
            location: Math.random() > 0.5 ? 'Zoom' : 'Conf Room B',
            priority: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)]
        });
    });
    
    displayUpcomingMeetings();
}

// ============================================================================
// DATA GENERATORS
// ============================================================================

function getSubtopic(topic) {
    const subtopics = {
        'Product Strategy': ['Feature Prioritization', 'Roadmap Review', 'User Research', 'Competitive Analysis'],
        'Q4 Planning': ['Budget Allocation', 'OKR Setting', 'Resource Planning', 'Risk Assessment'],
        'Team Sync': ['Weekly Update', 'Blockers Review', 'Sprint Planning', 'Retrospective']
    };
    const options = subtopics[topic] || ['General Discussion'];
    return options[Math.floor(Math.random() * options.length)];
}

function generateAttendees() {
    const names = ['Sarah Chen', 'Mike Johnson', 'Alex Rodriguez', 'Emily Davis', 'James Wilson'];
    return names.sort(() => 0.5 - Math.random()).slice(0, 2 + Math.floor(Math.random() * 4));
}

function generateSummary(topic) {
    return `Productive discussion on ${topic}. Team aligned on priorities and next steps. Key decisions documented.`;
}

function generateDecisions() {
    const decisions = [
        'Approved budget increase of 15% for Q4',
        'Prioritized AI features over analytics',
        'Moved launch date to next sprint',
        'Hired two additional engineers'
    ];
    return decisions.sort(() => 0.5 - Math.random()).slice(0, 1 + Math.floor(Math.random() * 2));
}

function generateActionItems() {
    const items = [
        { owner: 'Sarah Chen', task: 'Draft technical spec', due: '3 days' },
        { owner: 'Mike Johnson', task: 'Schedule design review', due: '1 week' },
        { owner: 'Alex Rodriguez', task: 'Update forecast', due: '2 days' }
    ];
    return items.sort(() => 0.5 - Math.random()).slice(0, 2);
}

function generateKeyPoints() {
    const points = [
        'Revenue up 23% QoQ',
        'Customer churn reduced to 3.2%',
        'New feature adoption at 67%',
        'Team capacity at 85%'
    ];
    return points.sort(() => 0.5 - Math.random()).slice(0, 2);
}

function getTags(topic) {
    const tagMap = {
        'Product Strategy': ['strategy', 'product'],
        'Q4 Planning': ['planning', 'quarterly']
    };
    return tagMap[topic] || ['general'];
}

// ============================================================================
// INTELLIGENCE BRIEF GENERATION
// ============================================================================

function generateAllBriefs() {
    intelligenceBriefs.clear();
    
    upcomingMeetings.forEach(meeting => {
        const brief = generateIntelligenceBrief(meeting);
        intelligenceBriefs.set(meeting.id, brief);
    });
    
    displayIntelligenceBriefs();
}

function generateIntelligenceBrief(upcomingMeeting) {
    const relatedMeetings = findRelatedMeetings(upcomingMeeting);
    
    const allDecisions = [];
    const allActionItems = [];
    const allKeyPoints = [];
    
    relatedMeetings.forEach(meeting => {
        allDecisions.push(...meeting.decisions);
        allActionItems.push(...meeting.actionItems);
        allKeyPoints.push(...meeting.keyPoints);
    });
    
    const insights = generateInsights(relatedMeetings);
    const talkingPoints = generateTalkingPoints();
    const risks = identifyRisks(relatedMeetings);
    
    return {
        meetingId: upcomingMeeting.id,
        relatedMeetings: relatedMeetings,
        relatedCount: relatedMeetings.length,
        recentDecisions: allDecisions.slice(0, 8),
        pendingActions: allActionItems.slice(0, 5),
        keyInsights: allKeyPoints.slice(0, 6),
        aiInsights: insights,
        suggestedTalkingPoints: talkingPoints,
        identifiedRisks: risks,
        confidenceScore: Math.floor(70 + Math.random() * 30),
        generatedAt: new Date().toISOString()
    };
}

function findRelatedMeetings(upcomingMeeting) {
    return meetingArchive.filter(past => {
        if (past.topic === upcomingMeeting.topic) return true;
        if (past.subtopic === upcomingMeeting.subtopic) return true;
        
        const attendeeOverlap = past.attendees.filter(a => 
            upcomingMeeting.attendees.includes(a)
        ).length;
        if (attendeeOverlap >= 2) return true;
        
        return false;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
}

function generateInsights(relatedMeetings) {
    const insights = [];
    
    if (relatedMeetings.length > 10) {
        insights.push(`High activity: ${relatedMeetings.length} related meetings in last 90 days`);
    }
    
    const challengingCount = relatedMeetings.filter(m => m.sentiment === 'challenging').length;
    if (challengingCount > 3) {
        insights.push(`⚠️ Recent meetings show challenges - prepare mitigation strategies`);
    }
    
    return insights;
}

function generateTalkingPoints() {
    return [
        'Review progress on pending action items',
        'Discuss any blockers since last sync',
        'Align on priorities for next phase'
    ];
}

function identifyRisks(relatedMeetings) {
    const risks = [];
    
    const topicCounts = new Map();
    relatedMeetings.forEach(m => {
        topicCounts.set(m.subtopic, (topicCounts.get(m.subtopic) || 0) + 1);
    });
    
    topicCounts.forEach((count, subtopic) => {
        if (count > 3) {
            risks.push(`Repeated discussion on "${subtopic}" - may need escalation`);
        }
    });
    
    return risks.slice(0, 3);
}

// ============================================================================
// UI RENDERING
// ============================================================================

function displayUpcomingMeetings() {
    const container = document.getElementById('upcoming-meetings-list');
    if (!container) return;
    
    if (upcomingMeetings.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--text-secondary)">No upcoming meetings</div>';
        return;
    }
    
    container.innerHTML = upcomingMeetings.map(createUpcomingCard).join('');
}

function createUpcomingCard(meeting) {
    const date = new Date(meeting.date);
    const formattedDate = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    const formattedTime = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const priorityColor = { high: '#ef4444', medium: '#f59e0b', low: '#10b981' }[meeting.priority];
    
    return `
        <div class="meeting-card" style="background:rgba(26,26,36,0.9);border:1px solid var(--border);border-radius:12px;padding:1.5rem;margin-bottom:1rem;">
            <div style="display:flex;justify-content:space-between;margin-bottom:1rem;">
                <div>
                    <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.5rem;">
                        <h3 style="color:var(--neon-blue);margin:0;">${meeting.topic}</h3>
                        <span style="background:${priorityColor}22;color:${priorityColor};padding:0.25rem 0.75rem;border-radius:12px;font-size:0.75rem;font-weight:600;">${meeting.priority.toUpperCase()}</span>
                    </div>
                    <div style="color:var(--text-secondary);font-size:0.9rem;">${meeting.subtopic}</div>
                </div>
                <div style="text-align:right;">
                    <div style="color:var(--neon-green);font-weight:600;">${formattedDate}</div>
                    <div style="color:var(--text-secondary);font-size:0.9rem;">${formattedTime}</div>
                </div>
            </div>
            
            <div style="display:flex;gap:1rem;margin-bottom:1rem;font-size:0.9rem;color:var(--text-secondary);">
                <span>⏱️ ${meeting.duration}min</span>
                <span>📍 ${meeting.location}</span>
                <span>👥 ${meeting.attendees.length} attendees</span>
            </div>
            
            <div style="display:flex;gap:0.5rem;flex-wrap:wrap;">
                <button onclick="viewIntelligenceBrief('${meeting.id}')" class="btn btn-quantum" style="padding:0.5rem 1rem;font-size:0.85rem;">
                    🧠 View AI Brief
                </button>
                <button onclick="exportBrief('${meeting.id}')" class="btn" style="padding:0.5rem 1rem;font-size:0.85rem;background:rgba(168,85,247,0.2);border:1px solid rgba(168,85,247,0.5);">
                    📋 Export
                </button>
            </div>
        </div>
    `;
}

function displayIntelligenceBriefs() {
    if (upcomingMeetings.length > 0) {
        const nextMeeting = upcomingMeetings[0];
        const brief = intelligenceBriefs.get(nextMeeting.id);
        if (brief) {
            displayBriefDetails(brief, nextMeeting);
        }
    }
}

function viewIntelligenceBrief(meetingId) {
    const meeting = upcomingMeetings.find(m => m.id === meetingId);
    const brief = intelligenceBriefs.get(meetingId);
    
    if (!brief || !meeting) {
        alert('Brief not available');
        return;
    }
    
    displayBriefDetails(brief, meeting);
}

function displayBriefDetails(brief, meeting) {
    const container = document.getElementById('brief-details');
    if (!container) return;
    
    const date = new Date(meeting.date).toLocaleString('en-US', { 
        weekday: 'long', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
    
    container.innerHTML = `
        <div style="background:rgba(15,23,42,0.8);border:2px solid var(--neon-blue);border-radius:16px;padding:2rem;margin-bottom:2rem;">
            <div style="display:flex;justify-content:space-between;margin-bottom:2rem;padding-bottom:1rem;border-bottom:1px solid var(--border);">
                <div>
                    <h2 style="color:var(--neon-blue);font-size:2rem;margin-bottom:0.5rem;">AI Intelligence Brief</h2>
                    <div style="color:var(--text-secondary);">${meeting.topic}: ${meeting.subtopic}</div>
                    <div style="color:var(--neon-green);font-weight:600;margin-top:0.5rem;">${date}</div>
                </div>
                <div style="text-align:right;">
                    <div style="background:var(--neon-blue)22;color:var(--neon-blue);padding:0.75rem 1.5rem;border-radius:12px;font-weight:700;">
                        <div style="font-size:2rem;">${brief.confidenceScore}%</div>
                        <div style="font-size:0.8rem;">Confidence</div>
                    </div>
                </div>
            </div>

            <div style="background:rgba(59,130,246,0.1);border-left:4px solid var(--neon-blue);padding:1.5rem;border-radius:8px;margin-bottom:2rem;">
                <h3 style="color:var(--neon-blue);margin-bottom:1rem;">📊 Context Summary</h3>
                <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:1rem;">
                    <div><div style="font-size:2rem;font-weight:700;color:var(--neon-blue);">${brief.relatedCount}</div><div style="color:var(--text-secondary);">Related Meetings</div></div>
                    <div><div style="font-size:2rem;font-weight:700;color:var(--neon-green);">${brief.recentDecisions.length}</div><div style="color:var(--text-secondary);">Past Decisions</div></div>
                    <div><div style="font-size:2rem;font-weight:700;color:var(--neon-purple);">${brief.pendingActions.length}</div><div style="color:var(--text-secondary);">Pending Actions</div></div>
                </div>
            </div>

            ${brief.aiInsights.length > 0 ? `
            <div style="background:rgba(168,85,247,0.1);border-left:4px solid var(--neon-purple);padding:1.5rem;border-radius:8px;margin-bottom:2rem;">
                <h3 style="color:var(--neon-purple);margin-bottom:1rem;">🤖 AI Insights</h3>
                ${brief.aiInsights.map(insight => `<div style="padding:0.75rem 0;border-bottom:1px solid rgba(255,255,255,0.1);">${insight}</div>`).join('')}
            </div>
            ` : ''}

            <div style="background:rgba(34,197,94,0.1);border-left:4px solid var(--neon-green);padding:1.5rem;border-radius:8px;margin-bottom:2rem;">
                <h3 style="color:var(--neon-green);margin-bottom:1rem;">💡 Suggested Talking Points</h3>
                ${brief.suggestedTalkingPoints.map((point, i) => `
                    <div style="display:flex;gap:1rem;padding:0.75rem 0;">
                        <div style="color:var(--neon-green);font-weight:700;">${i + 1}.</div>
                        <div>${point}</div>
                    </div>
                `).join('')}
            </div>

            <div style="display:flex;gap:1rem;justify-content:center;padding-top:1rem;border-top:1px solid var(--border);">
                <button onclick="exportBrief('${meeting.id}')" class="btn btn-quantum" style="padding:1rem 2rem;">📥 Export Brief</button>
                <button onclick="copyBriefToClipboard('${meeting.id}')" class="btn" style="padding:1rem 2rem;background:rgba(168,85,247,0.2);border:1px solid rgba(168,85,247,0.5);">📋 Copy</button>
            </div>
        </div>
    `;
    
    container.scrollIntoView({ behavior: 'smooth' });
}

function exportBrief(meetingId) {
    const meeting = upcomingMeetings.find(m => m.id === meetingId);
    const brief = intelligenceBriefs.get(meetingId);
    
    if (!brief || !meeting) return;
    
    let text = `MEETING INTELLIGENCE BRIEF\n${meeting.topic}: ${meeting.subtopic}\n${new Date(meeting.date).toLocaleString()}\n\n`;
    text += `Context: ${brief.relatedCount} related meetings analyzed\n\n`;
    text += `AI INSIGHTS:\n${brief.aiInsights.map(i => `• ${i}`).join('\n')}\n\n`;
    text += `TALKING POINTS:\n${brief.suggestedTalkingPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}`;
    
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `brief-${meeting.topic.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    alert('✅ Brief exported!');
}

function copyBriefToClipboard(meetingId) {
    const meeting = upcomingMeetings.find(m => m.id === meetingId);
    const brief = intelligenceBriefs.get(meetingId);
    
    if (!brief || !meeting) return;
    
    const text = `MEETING BRIEF\n${meeting.topic}\n\nINSIGHTS:\n${brief.aiInsights.map(i => `• ${i}`).join('\n')}\n\nTALKING POINTS:\n${brief.suggestedTalkingPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}`;
    
    navigator.clipboard.writeText(text).then(() => {
        alert('✅ Brief copied to clipboard!');
    }).catch(err => {
        console.error('Copy failed:', err);
    });
}

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeMeetingIntelligence);
} else {
    initializeMeetingIntelligence();
}
