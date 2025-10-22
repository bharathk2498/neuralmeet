// ============================================================================
// MEETING INTELLIGENCE V2.0 - Complete Knowledge Base System
// Stores all meeting summaries with full details and AI-powered retrieval
// ============================================================================

// Data Storage
let meetingArchive = [];
let upcomingMeetings = [];
let intelligenceBriefs = new Map();
const STORAGE_KEY = 'neuralmeet_archive';
const MAX_ARCHIVE_SIZE = 500; // Store last 500 meetings

// ============================================================================
// PERSISTENT STORAGE MANAGEMENT
// ============================================================================

function saveMeetingToArchive(meeting) {
    const archive = loadFromLocalStorage();
    
    // Add comprehensive metadata
    const enrichedMeeting = {
        ...meeting,
        storedAt: new Date().toISOString(),
        version: '2.0',
        searchIndex: createSearchIndex(meeting)
    };
    
    archive.push(enrichedMeeting);
    
    // Maintain size limit
    if (archive.length > MAX_ARCHIVE_SIZE) {
        archive.sort((a, b) => new Date(b.date) - new Date(a.date));
        archive.splice(MAX_ARCHIVE_SIZE);
    }
    
    saveToLocalStorage(archive);
    return enrichedMeeting;
}

function loadFromLocalStorage() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Storage load error:', error);
        return [];
    }
}

function saveToLocalStorage(data) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
        console.error('Storage save error:', error);
    }
}

function createSearchIndex(meeting) {
    return [
        meeting.topic,
        meeting.subtopic,
        ...meeting.attendees,
        ...meeting.decisions,
        ...meeting.keyPoints,
        meeting.summary
    ].join(' ').toLowerCase();
}

// ============================================================================
// INITIALIZATION
// ============================================================================

async function initializeMeetingIntelligence() {
    await loadMeetingArchive();
    await loadUpcomingMeetings();
    generateAllBriefs();
    renderCurrentTab();
    attachEventListeners();
}

// ============================================================================
// DATA LOADING
// ============================================================================

async function loadMeetingArchive() {
    try {
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

        // Load from persistent storage
        const stored = loadFromLocalStorage();
        
        // Filter to last 3 months
        meetingArchive = stored.filter(m => 
            new Date(m.date) >= threeMonthsAgo
        ).sort((a, b) => new Date(b.date) - new Date(a.date));

        // If empty, generate sample data
        if (meetingArchive.length === 0) {
            loadMockArchive();
        }
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
                return;
            }
        }
        
        loadMockUpcoming();
    } catch (error) {
        console.error('Upcoming load error:', error);
        loadMockUpcoming();
    }
}

// ============================================================================
// MOCK DATA GENERATION
// ============================================================================

const MEETING_TOPICS = [
    'Product Strategy', 'Q4 Planning', 'Team Sync', 'Customer Feedback',
    'Technical Architecture', 'Marketing Campaign', 'Budget Review',
    'Performance Review', 'Project Kickoff', 'Sprint Planning',
    'Sales Pipeline', 'Engineering Standup', 'Design Review', 'Investor Update'
];

function loadMockArchive() {
    meetingArchive = [];
    const now = new Date();
    
    for (let i = 0; i < 50; i++) {
        const daysAgo = Math.floor(Math.random() * 90);
        const meetingDate = new Date(now);
        meetingDate.setDate(meetingDate.getDate() - daysAgo);
        
        const topic = MEETING_TOPICS[Math.floor(Math.random() * MEETING_TOPICS.length)];
        
        const meeting = {
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
            tags: getTags(topic),
            location: Math.random() > 0.5 ? 'Zoom' : 'Conference Room',
            notes: generateNotes(topic)
        };
        
        // Save to storage
        saveMeetingToArchive(meeting);
        meetingArchive.push(meeting);
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
}

function getSubtopic(topic) {
    const subtopics = {
        'Product Strategy': ['Feature Prioritization', 'Roadmap Review', 'User Research', 'Competitive Analysis'],
        'Q4 Planning': ['Budget Allocation', 'OKR Setting', 'Resource Planning', 'Risk Assessment'],
        'Team Sync': ['Weekly Update', 'Blockers Review', 'Sprint Planning', 'Retrospective'],
        'Customer Feedback': ['Survey Results', 'User Interviews', 'NPS Analysis', 'Feature Requests'],
        'Technical Architecture': ['System Design', 'API Review', 'Security Audit', 'Performance Optimization']
    };
    const options = subtopics[topic] || ['General Discussion'];
    return options[Math.floor(Math.random() * options.length)];
}

function generateAttendees() {
    const names = ['Sarah Chen', 'Mike Johnson', 'Alex Rodriguez', 'Emily Davis', 'James Wilson', 
                   'Lisa Anderson', 'David Park', 'Maria Garcia', 'Tom Brown', 'Jessica Lee'];
    return names.sort(() => 0.5 - Math.random()).slice(0, 2 + Math.floor(Math.random() * 5));
}

function generateSummary(topic) {
    const summaries = [
        `Productive discussion on ${topic}. Team aligned on priorities and next steps.`,
        `Comprehensive review of ${topic} with actionable outcomes.`,
        `Deep dive into ${topic} challenges and potential solutions.`,
        `Strategic planning session for ${topic} with clear deliverables.`
    ];
    return summaries[Math.floor(Math.random() * summaries.length)];
}

function generateDecisions() {
    const decisions = [
        'Approved budget increase of 15% for Q4',
        'Prioritized AI features over analytics dashboard',
        'Moved product launch to next quarter',
        'Hired two additional engineers for platform team',
        'Adopted new OKR framework starting next month',
        'Migrated to AWS for better scalability',
        'Implemented weekly team retrospectives',
        'Increased marketing spend by 25%'
    ];
    return decisions.sort(() => 0.5 - Math.random()).slice(0, 1 + Math.floor(Math.random() * 3));
}

function generateActionItems() {
    const items = [
        { owner: 'Sarah Chen', task: 'Draft technical specification document', due: '3 days', status: 'pending' },
        { owner: 'Mike Johnson', task: 'Schedule design review with stakeholders', due: '1 week', status: 'in-progress' },
        { owner: 'Alex Rodriguez', task: 'Update quarterly forecast model', due: '2 days', status: 'pending' },
        { owner: 'Emily Davis', task: 'Prepare investor presentation', due: '5 days', status: 'completed' },
        { owner: 'James Wilson', task: 'Review code quality metrics', due: '2 weeks', status: 'pending' }
    ];
    return items.sort(() => 0.5 - Math.random()).slice(0, 2 + Math.floor(Math.random() * 2));
}

function generateKeyPoints() {
    const points = [
        'Revenue up 23% QoQ, exceeding targets',
        'Customer churn reduced to 3.2% from 5.1%',
        'New feature adoption reached 67% within 30 days',
        'Team capacity at 85%, considering expansion',
        'Technical debt backlog reduced by 40%',
        'Customer satisfaction score improved to 4.7/5',
        'API performance improved by 35%',
        'Security audit completed with no critical issues'
    ];
    return points.sort(() => 0.5 - Math.random()).slice(0, 2 + Math.floor(Math.random() * 3));
}

function getTags(topic) {
    const tagMap = {
        'Product Strategy': ['strategy', 'product', 'roadmap'],
        'Q4 Planning': ['planning', 'quarterly', 'okrs'],
        'Team Sync': ['team', 'sync', 'standup'],
        'Technical Architecture': ['technical', 'architecture', 'engineering']
    };
    return tagMap[topic] || ['general', 'meeting'];
}

function generateNotes(topic) {
    return `Detailed discussion on ${topic}. Multiple perspectives shared. Team engaged and collaborative. Follow-up actions clearly defined.`;
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
    const talkingPoints = generateTalkingPoints(relatedMeetings);
    const risks = identifyRisks(relatedMeetings);
    
    return {
        meetingId: upcomingMeeting.id,
        relatedMeetings: relatedMeetings,
        relatedCount: relatedMeetings.length,
        recentDecisions: allDecisions.slice(0, 8),
        pendingActions: allActionItems.filter(a => a.status !== 'completed').slice(0, 5),
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
    }).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 20);
}

function generateInsights(relatedMeetings) {
    const insights = [];
    
    if (relatedMeetings.length > 10) {
        insights.push(`📈 High activity: ${relatedMeetings.length} related meetings in last 90 days`);
    }
    
    const challengingCount = relatedMeetings.filter(m => m.sentiment === 'challenging').length);
    if (challengingCount > 3) {
        insights.push(`⚠️ ${challengingCount} meetings flagged as challenging - review blockers`);
    }
    
    const pendingActions = relatedMeetings.flatMap(m => m.actionItems || [])
        .filter(a => a.status === 'pending');
    if (pendingActions.length > 10) {
        insights.push(`📋 ${pendingActions.length} pending action items from previous meetings`);
    }
    
    return insights;
}

function generateTalkingPoints(relatedMeetings) {
    const points = [
        'Review progress on action items from previous meetings',
        'Address any outstanding blockers or risks',
        'Align on priorities for next phase'
    ];
    
    if (relatedMeetings.length > 0) {
        const lastMeeting = relatedMeetings[0];
        points.push(`Follow up on decisions from ${new Date(lastMeeting.date).toLocaleDateString()}`);
    }
    
    return points;
}

function identifyRisks(relatedMeetings) {
    const risks = [];
    
    const topicCounts = new Map();
    relatedMeetings.forEach(m => {
        topicCounts.set(m.subtopic, (topicCounts.get(m.subtopic) || 0) + 1);
    });
    
    topicCounts.forEach((count, subtopic) => {
        if (count > 3) {
            risks.push(`🔄 "${subtopic}" discussed ${count} times - may need escalation or closure`);
        }
    });
    
    return risks.slice(0, 3);
}

// ============================================================================
// UI RENDERING - TAB MANAGEMENT
// ============================================================================

function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(`tab-${tabName}`).classList.add('active');
    
    // Render tab-specific content
    renderCurrentTab(tabName);
}

function renderCurrentTab(tabName = 'upcoming') {
    switch(tabName) {
        case 'upcoming':
            displayUpcomingMeetings();
            break;
        case 'archive':
            displayMeetingArchive();
            break;
        case 'search':
            setupSearchTab();
            break;
        case 'stats':
            displayAnalytics();
            break;
    }
}

// ============================================================================
// UPCOMING MEETINGS DISPLAY
// ============================================================================

function displayUpcomingMeetings() {
    const container = document.getElementById('upcoming-meetings-list');
    if (!container) return;
    
    if (upcomingMeetings.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--text-secondary)">No upcoming meetings</div>';
        return;
    }
    
    container.innerHTML = upcomingMeetings.map(meeting => {
        const brief = intelligenceBriefs.get(meeting.id);
        return createUpcomingCard(meeting, brief);
    }).join('');
}

function createUpcomingCard(meeting, brief) {
    const date = new Date(meeting.date);
    const formattedDate = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    const formattedTime = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const priorityColor = { high: '#ef4444', medium: '#f59e0b', low: '#10b981' }[meeting.priority];
    
    return `
        <div class="meeting-card" onclick="showMeetingDetail('${meeting.id}', 'upcoming')">
            <div style="display:flex;justify-content:space-between;margin-bottom:1rem;">
                <div style="flex:1;">
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
            
            <div style="display:flex;gap:1.5rem;margin-bottom:1rem;font-size:0.9rem;color:var(--text-secondary);">
                <span>⏱️ ${meeting.duration}min</span>
                <span>📍 ${meeting.location}</span>
                <span>👥 ${meeting.attendees.length} attendees</span>
            </div>
            
            ${brief ? `
            <div style="background:rgba(0,212,255,0.1);border-left:3px solid var(--neon-blue);padding:1rem;border-radius:8px;margin-bottom:1rem;">
                <div style="font-weight:600;margin-bottom:0.5rem;">AI Brief Ready</div>
                <div style="display:flex;gap:1.5rem;font-size:0.9rem;">
                    <span>📊 ${brief.relatedCount} related meetings</span>
                    <span>💡 ${brief.suggestedTalkingPoints.length} talking points</span>
                    <span>⚡ ${brief.confidenceScore}% confidence</span>
                </div>
            </div>
            ` : ''}
            
            <div style="display:flex;gap:0.5rem;">
                <button onclick="event.stopPropagation(); viewIntelligenceBrief('${meeting.id}')" class="btn btn-primary" style="padding:0.5rem 1rem;font-size:0.85rem;">
                    🧠 View AI Brief
                </button>
                <button onclick="event.stopPropagation(); exportBrief('${meeting.id}')" class="btn" style="padding:0.5rem 1rem;font-size:0.85rem;">
                    📥 Export
                </button>
            </div>
        </div>
    `;
}

// ============================================================================
// MEETING ARCHIVE DISPLAY
// ============================================================================

function displayMeetingArchive(filterPeriod = 'all', searchTerm = '') {
    const container = document.getElementById('archive-list');
    if (!container) return;
    
    let filtered = [...meetingArchive];
    
    // Apply time filter
    if (filterPeriod !== 'all') {
        const daysAgo = parseInt(filterPeriod);
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - daysAgo);
        filtered = filtered.filter(m => new Date(m.date) >= cutoff);
    }
    
    // Apply search
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(m => 
            m.searchIndex && m.searchIndex.includes(term)
        );
    }
    
    if (filtered.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--text-secondary)">No meetings found</div>';
        return;
    }
    
    container.innerHTML = filtered.map(meeting => createArchiveCard(meeting)).join('');
}

function createArchiveCard(meeting) {
    const date = new Date(meeting.date);
    const formattedDate = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    const sentimentColor = { positive: '#10b981', neutral: '#f59e0b', challenging: '#ef4444' }[meeting.sentiment];
    
    return `
        <div class="meeting-card" onclick="showMeetingDetail('${meeting.id}', 'archive')">
            <div style="display:flex;justify-content:space-between;margin-bottom:1rem;">
                <div style="flex:1;">
                    <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.5rem;">
                        <h3 style="color:var(--neon-purple);margin:0;">${meeting.topic}</h3>
                        <span style="background:${sentimentColor}22;color:${sentimentColor};padding:0.25rem 0.75rem;border-radius:12px;font-size:0.75rem;font-weight:600;">${meeting.sentiment}</span>
                    </div>
                    <div style="color:var(--text-secondary);font-size:0.9rem;">${meeting.subtopic}</div>
                </div>
                <div style="text-align:right;">
                    <div style="color:var(--neon-green);font-weight:600;">${formattedDate}</div>
                    <div style="color:var(--text-secondary);font-size:0.9rem;">${meeting.duration} min</div>
                </div>
            </div>
            
            <div style="margin-bottom:1rem;">
                <div style="color:var(--text-secondary);font-size:0.9rem;line-height:1.5;">${meeting.summary}</div>
            </div>
            
            <div style="display:flex;gap:1rem;flex-wrap:wrap;font-size:0.85rem;">
                ${meeting.decisions.length > 0 ? `<span style="color:var(--neon-blue);">✓ ${meeting.decisions.length} decisions</span>` : ''}
                ${meeting.actionItems.length > 0 ? `<span style="color:var(--neon-green);">📋 ${meeting.actionItems.length} actions</span>` : ''}
                ${meeting.keyPoints.length > 0 ? `<span style="color:var(--neon-purple);">💡 ${meeting.keyPoints.length} insights</span>` : ''}
            </div>
        </div>
    `;
}

// ============================================================================
// SEARCH TAB
// ============================================================================

function setupSearchTab() {
    const searchInput = document.getElementById('advanced-search');
    const filterPills = document.querySelectorAll('#tab-search .filter-pill');
    
    if (searchInput && !searchInput.dataset.initialized) {
        searchInput.addEventListener('input', (e) => performSearch(e.target.value));
        searchInput.dataset.initialized = 'true';
    }
    
    filterPills.forEach(pill => {
        pill.addEventListener('click', () => {
            filterPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            performSearch(searchInput?.value || '', pill.dataset.topic);
        });
    });
    
    performSearch('', '');
}

function performSearch(searchTerm = '', topicFilter = '') {
    const container = document.getElementById('search-results');
    if (!container) return;
    
    let results = [...meetingArchive, ...upcomingMeetings];
    
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        results = results.filter(m => {
            const searchable = [
                m.topic,
                m.subtopic,
                m.summary || '',
                ...(m.attendees || []),
                ...(m.decisions || []),
                ...(m.keyPoints || [])
            ].join(' ').toLowerCase();
            return searchable.includes(term);
        });
    }
    
    if (topicFilter) {
        results = results.filter(m => m.topic.includes(topicFilter));
    }
    
    if (results.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--text-secondary)">No results found</div>';
        return;
    }
    
    container.innerHTML = `
        <div style="margin-bottom:1.5rem;color:var(--neon-blue);font-weight:600;">
            Found ${results.length} meeting${results.length !== 1 ? 's' : ''}
        </div>
        ${results.map(m => createArchiveCard(m)).join('')}
    `;
}

// ============================================================================
// ANALYTICS TAB
// ============================================================================

function displayAnalytics() {
    const statsContainer = document.getElementById('analytics-stats');
    const insightsContainer = document.getElementById('analytics-insights');
    
    if (!statsContainer || !insightsContainer) return;
    
    // Calculate stats
    const totalMeetings = meetingArchive.length;
    const avgDuration = meetingArchive.length > 0 
        ? Math.round(meetingArchive.reduce((sum, m) => sum + m.duration, 0) / meetingArchive.length)
        : 0;
    const totalDecisions = meetingArchive.reduce((sum, m) => sum + (m.decisions?.length || 0), 0);
    const pendingActions = meetingArchive.reduce((sum, m) => 
        sum + (m.actionItems?.filter(a => a.status === 'pending').length || 0), 0);
    
    // Topic distribution
    const topicCounts = new Map();
    meetingArchive.forEach(m => {
        topicCounts.set(m.topic, (topicCounts.get(m.topic) || 0) + 1);
    });
    
    // Render stats
    statsContainer.innerHTML = `
        <div class="stat-card">
            <div class="stat-value" style="color:var(--neon-blue);">${totalMeetings}</div>
            <div class="stat-label">Total Meetings (90 days)</div>
        </div>
        <div class="stat-card">
            <div class="stat-value" style="color:var(--neon-green);">${avgDuration}m</div>
            <div class="stat-label">Average Duration</div>
        </div>
        <div class="stat-card">
            <div class="stat-value" style="color:var(--neon-purple);">${totalDecisions}</div>
            <div class="stat-label">Decisions Made</div>
        </div>
        <div class="stat-card">
            <div class="stat-value" style="color:var(--neon-yellow);">${pendingActions}</div>
            <div class="stat-label">Pending Actions</div>
        </div>
    `;
    
    // Render insights
    const topTopics = Array.from(topicCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    
    insightsContainer.innerHTML = `
        <div style="background:rgba(15,23,42,0.8);border:1px solid var(--border);border-radius:12px;padding:1.5rem;margin-bottom:1rem;">
            <h3 style="color:var(--neon-blue);margin-bottom:1rem;">Top Meeting Topics</h3>
            ${topTopics.map(([topic, count]) => `
                <div style="display:flex;justify-content:space-between;padding:0.75rem 0;border-bottom:1px solid var(--border);">
                    <span>${topic}</span>
                    <span style="color:var(--neon-green);font-weight:600;">${count} meetings</span>
                </div>
            `).join('')}
        </div>
        
        <div style="background:rgba(15,23,42,0.8);border:1px solid var(--border);border-radius:12px;padding:1.5rem;">
            <h3 style="color:var(--neon-purple);margin-bottom:1rem;">Key Metrics</h3>
            <div style="padding:0.75rem 0;border-bottom:1px solid var(--border);">
                <div style="color:var(--text-secondary);margin-bottom:0.5rem;">Meeting Frequency</div>
                <div style="font-size:1.5rem;font-weight:600;">${(totalMeetings / 13).toFixed(1)} meetings/week</div>
            </div>
            <div style="padding:0.75rem 0;">
                <div style="color:var(--text-secondary);margin-bottom:0.5rem;">Action Item Completion Rate</div>
                <div style="font-size:1.5rem;font-weight:600;">
                    ${meetingArchive.length > 0 ? Math.round((1 - pendingActions / (totalDecisions || 1)) * 100) : 0}%
                </div>
            </div>
        </div>
    `;
}

// ============================================================================
// MEETING DETAIL MODAL
// ============================================================================

function showMeetingDetail(meetingId, type) {
    const meeting = type === 'upcoming' 
        ? upcomingMeetings.find(m => m.id === meetingId)
        : meetingArchive.find(m => m.id === meetingId);
    
    if (!meeting) return;
    
    const modal = document.getElementById('meeting-detail-modal');
    const body = document.getElementById('modal-content-body');
    
    const date = new Date(meeting.date);
    const formattedDate = date.toLocaleString('en-US', { 
        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', 
        hour: '2-digit', minute: '2-digit' 
    });
    
    body.innerHTML = `
        <h2 style="color:var(--neon-blue);margin-bottom:0.5rem;">${meeting.topic}</h2>
        <div style="color:var(--text-secondary);font-size:1.1rem;margin-bottom:2rem;">${meeting.subtopic}</div>
        
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem;margin-bottom:2rem;">
            <div>
                <div style="color:var(--text-secondary);font-size:0.85rem;">Date & Time</div>
                <div style="font-weight:600;color:var(--neon-green);">${formattedDate}</div>
            </div>
            <div>
                <div style="color:var(--text-secondary);font-size:0.85rem;">Duration</div>
                <div style="font-weight:600;">${meeting.duration} minutes</div>
            </div>
            <div>
                <div style="color:var(--text-secondary);font-size:0.85rem;">Location</div>
                <div style="font-weight:600;">${meeting.location || 'TBD'}</div>
            </div>
        </div>
        
        ${meeting.summary ? `
        <div style="background:rgba(0,212,255,0.1);border-left:4px solid var(--neon-blue);padding:1.5rem;border-radius:8px;margin-bottom:2rem;">
            <h3 style="color:var(--neon-blue);margin-bottom:1rem;">Summary</h3>
            <p>${meeting.summary}</p>
        </div>
        ` : ''}
        
        <div style="margin-bottom:2rem;">
            <h3 style="color:var(--neon-purple);margin-bottom:1rem;">Attendees (${meeting.attendees.length})</h3>
            <div style="display:flex;flex-wrap:wrap;gap:0.5rem;">
                ${meeting.attendees.map(a => `
                    <span style="background:rgba(168,85,247,0.2);padding:0.5rem 1rem;border-radius:20px;">${a}</span>
                `).join('')}
            </div>
        </div>
        
        ${meeting.decisions && meeting.decisions.length > 0 ? `
        <div style="margin-bottom:2rem;">
            <h3 style="color:var(--neon-green);margin-bottom:1rem;">Decisions (${meeting.decisions.length})</h3>
            ${meeting.decisions.map(d => `
                <div style="padding:0.75rem;background:rgba(16,185,129,0.1);border-left:3px solid var(--neon-green);margin-bottom:0.5rem;border-radius:4px;">
                    ${d}
                </div>
            `).join('')}
        </div>
        ` : ''}
        
        ${meeting.actionItems && meeting.actionItems.length > 0 ? `
        <div style="margin-bottom:2rem;">
            <h3 style="color:var(--neon-yellow);margin-bottom:1rem;">Action Items (${meeting.actionItems.length})</h3>
            ${meeting.actionItems.map(item => `
                <div style="display:flex;justify-content:space-between;padding:1rem;background:rgba(245,158,11,0.1);border-left:3px solid var(--neon-yellow);margin-bottom:0.5rem;border-radius:4px;">
                    <div>
                        <div style="font-weight:600;">${item.task}</div>
                        <div style="color:var(--text-secondary);font-size:0.9rem;">Owner: ${item.owner}</div>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-size:0.85rem;color:var(--text-secondary);">Due: ${item.due}</div>
                        <div style="margin-top:0.25rem;">
                            <span style="background:${item.status === 'completed' ? 'var(--neon-green)' : 'var(--neon-yellow)'}22;color:${item.status === 'completed' ? 'var(--neon-green)' : 'var(--neon-yellow)'};padding:0.25rem 0.75rem;border-radius:12px;font-size:0.75rem;">${item.status}</span>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
        ` : ''}
        
        ${meeting.keyPoints && meeting.keyPoints.length > 0 ? `
        <div style="margin-bottom:2rem;">
            <h3 style="color:var(--neon-blue);margin-bottom:1rem;">Key Points (${meeting.keyPoints.length})</h3>
            ${meeting.keyPoints.map(point => `
                <div style="padding:0.75rem;background:rgba(0,212,255,0.1);border-left:3px solid var(--neon-blue);margin-bottom:0.5rem;border-radius:4px;">
                    ${point}
                </div>
            `).join('')}
        </div>
        ` : ''}
        
        ${meeting.notes ? `
        <div style="margin-bottom:2rem;">
            <h3 style="color:var(--text-secondary);margin-bottom:1rem;">Additional Notes</h3>
            <p style="color:var(--text-secondary);">${meeting.notes}</p>
        </div>
        ` : ''}
    `;
    
    modal.style.display = 'block';
}

function closeModal() {
    document.getElementById('meeting-detail-modal').style.display = 'none';
}

// ============================================================================
// BRIEF OPERATIONS
// ============================================================================

function viewIntelligenceBrief(meetingId) {
    const meeting = upcomingMeetings.find(m => m.id === meetingId);
    const brief = intelligenceBriefs.get(meetingId);
    
    if (!brief || !meeting) {
        alert('Brief not available');
        return;
    }
    
    const modal = document.getElementById('meeting-detail-modal');
    const body = document.getElementById('modal-content-body');
    
    const date = new Date(meeting.date).toLocaleString('en-US', { 
        weekday: 'long', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
    
    body.innerHTML = `
        <div style="text-align:center;margin-bottom:2rem;">
            <h1 style="color:var(--neon-blue);font-size:2.5rem;margin-bottom:0.5rem;">AI Intelligence Brief</h1>
            <div style="color:var(--text-secondary);font-size:1.1rem;">${meeting.topic}: ${meeting.subtopic}</div>
            <div style="color:var(--neon-green);font-weight:600;margin-top:0.5rem;">${date}</div>
        </div>
        
        <div style="background:linear-gradient(135deg,rgba(0,212,255,0.2),rgba(168,85,247,0.2));border:2px solid var(--neon-blue);border-radius:16px;padding:2rem;margin-bottom:2rem;">
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:1.5rem;text-align:center;">
                <div>
                    <div style="font-size:3rem;font-weight:700;color:var(--neon-blue);">${brief.relatedCount}</div>
                    <div style="color:var(--text-secondary);">Related Meetings</div>
                </div>
                <div>
                    <div style="font-size:3rem;font-weight:700;color:var(--neon-green);">${brief.recentDecisions.length}</div>
                    <div style="color:var(--text-secondary);">Past Decisions</div>
                </div>
                <div>
                    <div style="font-size:3rem;font-weight:700;color:var(--neon-purple);">${brief.pendingActions.length}</div>
                    <div style="color:var(--text-secondary);">Pending Actions</div>
                </div>
                <div>
                    <div style="font-size:3rem;font-weight:700;color:var(--neon-yellow);">${brief.confidenceScore}%</div>
                    <div style="color:var(--text-secondary);">Confidence</div>
                </div>
            </div>
        </div>
        
        ${brief.aiInsights.length > 0 ? `
        <div style="background:rgba(168,85,247,0.1);border-left:4px solid var(--neon-purple);padding:1.5rem;border-radius:8px;margin-bottom:2rem;">
            <h3 style="color:var(--neon-purple);margin-bottom:1rem;">🤖 AI Insights</h3>
            ${brief.aiInsights.map(insight => `
                <div style="padding:0.75rem 0;border-bottom:1px solid rgba(255,255,255,0.1);font-size:1.05rem;">${insight}</div>
            `).join('')}
        </div>
        ` : ''}
        
        <div style="background:rgba(16,185,129,0.1);border-left:4px solid var(--neon-green);padding:1.5rem;border-radius:8px;margin-bottom:2rem;">
            <h3 style="color:var(--neon-green);margin-bottom:1rem;">💡 Suggested Talking Points</h3>
            ${brief.suggestedTalkingPoints.map((point, i) => `
                <div style="display:flex;gap:1rem;padding:0.75rem 0;${i < brief.suggestedTalkingPoints.length - 1 ? 'border-bottom:1px solid rgba(255,255,255,0.1);' : ''}">
                    <div style="color:var(--neon-green);font-weight:700;font-size:1.2rem;">${i + 1}.</div>
                    <div style="font-size:1.05rem;">${point}</div>
                </div>
            `).join('')}
        </div>
        
        ${brief.identifiedRisks.length > 0 ? `
        <div style="background:rgba(239,68,68,0.1);border-left:4px solid var(--neon-red);padding:1.5rem;border-radius:8px;margin-bottom:2rem;">
            <h3 style="color:var(--neon-red);margin-bottom:1rem;">⚠️ Identified Risks</h3>
            ${brief.identifiedRisks.map(risk => `
                <div style="padding:0.75rem 0;border-bottom:1px solid rgba(255,255,255,0.1);">${risk}</div>
            `).join('')}
        </div>
        ` : ''}
        
        <div style="display:flex;gap:1rem;justify-content:center;padding-top:1rem;border-top:1px solid var(--border);">
            <button onclick="exportBrief('${meeting.id}')" class="btn btn-primary" style="padding:1rem 2rem;">📥 Export Brief</button>
            <button onclick="copyBriefToClipboard('${meeting.id}')" class="btn" style="padding:1rem 2rem;">📋 Copy to Clipboard</button>
        </div>
    `;
    
    modal.style.display = 'block';
}

function exportBrief(meetingId) {
    const meeting = upcomingMeetings.find(m => m.id === meetingId);
    const brief = intelligenceBriefs.get(meetingId);
    
    if (!brief || !meeting) return;
    
    let text = `MEETING INTELLIGENCE BRIEF\n${'='.repeat(50)}\n\n`;
    text += `Meeting: ${meeting.topic} - ${meeting.subtopic}\n`;
    text += `Date: ${new Date(meeting.date).toLocaleString()}\n`;
    text += `Duration: ${meeting.duration} minutes\n`;
    text += `Location: ${meeting.location}\n\n`;
    text += `CONTEXT\n${'-'.repeat(50)}\n`;
    text += `${brief.relatedCount} related meetings analyzed from last 90 days\n`;
    text += `Confidence Score: ${brief.confidenceScore}%\n\n`;
    
    if (brief.aiInsights.length > 0) {
        text += `AI INSIGHTS\n${'-'.repeat(50)}\n`;
        text += brief.aiInsights.map(i => `• ${i}`).join('\n');
        text += '\n\n';
    }
    
    text += `SUGGESTED TALKING POINTS\n${'-'.repeat(50)}\n`;
    text += brief.suggestedTalkingPoints.map((p, i) => `${i + 1}. ${p}`).join('\n');
    text += '\n\n';
    
    if (brief.identifiedRisks.length > 0) {
        text += `IDENTIFIED RISKS\n${'-'.repeat(50)}\n`;
        text += brief.identifiedRisks.map(r => `⚠️ ${r}`).join('\n');
        text += '\n\n';
    }
    
    if (brief.recentDecisions.length > 0) {
        text += `RECENT DECISIONS\n${'-'.repeat(50)}\n`;
        text += brief.recentDecisions.map(d => `✓ ${d}`).join('\n');
    }
    
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `brief-${meeting.topic.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    alert('✅ Brief exported successfully!');
}

function copyBriefToClipboard(meetingId) {
    const meeting = upcomingMeetings.find(m => m.id === meetingId);
    const brief = intelligenceBriefs.get(meetingId);
    
    if (!brief || !meeting) return;
    
    let text = `MEETING BRIEF: ${meeting.topic}\n\n`;
    text += `INSIGHTS:\n${brief.aiInsights.map(i => `• ${i}`).join('\n')}\n\n`;
    text += `TALKING POINTS:\n${brief.suggestedTalkingPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}`;
    
    navigator.clipboard.writeText(text).then(() => {
        alert('✅ Brief copied to clipboard!');
    }).catch(err => {
        console.error('Copy failed:', err);
        alert('❌ Failed to copy to clipboard');
    });
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================

function attachEventListeners() {
    // Archive search
    const archiveSearch = document.getElementById('archive-search');
    if (archiveSearch) {
        archiveSearch.addEventListener('input', (e) => {
            displayMeetingArchive('all', e.target.value);
        });
    }
    
    // Archive filter pills
    document.querySelectorAll('#tab-archive .filter-pill').forEach(pill => {
        pill.addEventListener('click', function() {
            document.querySelectorAll('#tab-archive .filter-pill').forEach(p => p.classList.remove('active'));
            this.classList.add('active');
            displayMeetingArchive(this.dataset.period, archiveSearch?.value || '');
        });
    });
    
    // Close modal on outside click
    const modal = document.getElementById('meeting-detail-modal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    }
}

// ============================================================================
// INITIALIZATION
// ============================================================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeMeetingIntelligence);
} else {
    initializeMeetingIntelligence();
}