// ============================================================================
// AI MEETING COACH - Real-Time Intelligence Engine
// Provides live coaching, insights, and suggestions during meetings
// ============================================================================

let coachingInterval;
const insights = [];
const suggestions = [];

// ============================================================================
// INITIALIZATION
// ============================================================================

function initializeAICoach() {
    startRealTimeCoaching();
    updateMetrics();
    generateInitialSuggestions();
}

// ============================================================================
// REAL-TIME COACHING ENGINE
// ============================================================================

function startRealTimeCoaching() {
    // Generate insights every 15 seconds
    coachingInterval = setInterval(() => {
        generateInsight();
        updateMetrics();
        updateSuggestions();
    }, 15000);
}

function generateInsight() {
    const insightTemplates = [
        {
            type: 'success',
            icon: '✅',
            title: 'Great Pacing',
            message: 'Meeting is on track. You\'ve covered 3/4 agenda items in optimal time.'
        },
        {
            type: 'warning',
            icon: '⚠️',
            title: 'Energy Dip Detected',
            message: 'Participant engagement dropped 15%. Consider a quick break or topic change.'
        },
        {
            type: 'insight',
            icon: '💡',
            title: 'Decision Opportunity',
            message: 'Current discussion ready for decision. AI suggests moving to vote.'
        },
        {
            type: 'critical',
            icon: '🎯',
            title: 'Time Alert',
            message: 'Only 10 minutes remaining. Prioritize final 2 agenda items.'
        },
        {
            type: 'success',
            icon: '🚀',
            title: 'High Impact Moment',
            message: 'This topic generated 87% engagement - excellent discussion!'
        },
        {
            type: 'insight',
            icon: '📊',
            title: 'Data Point',
            message: 'Similar meetings resulted in 3-4 action items. Current count: 2.'
        },
        {
            type: 'warning',
            icon: '⏰',
            title: 'Overrun Risk',
            message: 'Current topic taking 2x planned time. Consider tabling for follow-up.'
        },
        {
            type: 'success',
            icon: '👥',
            title: 'Balanced Participation',
            message: 'All attendees have contributed. Team engagement is optimal.'
        }
    ];

    const insight = insightTemplates[Math.floor(Math.random() * insightTemplates.length)];
    const timestamp = new Date().toLocaleTimeString();

    addInsightToFeed(insight, timestamp);
}

function addInsightToFeed(insight, timestamp) {
    const feed = document.getElementById('insights-feed');
    
    const insightCard = document.createElement('div');
    insightCard.className = `insight-card ${insight.type}`;
    insightCard.innerHTML = `
        <div style="display:flex;align-items:start;gap:1rem;">
            <div style="font-size:2rem;">${insight.icon}</div>
            <div style="flex:1;">
                <div style="display:flex;justify-content:space-between;margin-bottom:0.5rem;">
                    <strong style="font-size:1.1rem;">${insight.title}</strong>
                    <span style="color:var(--text-secondary);font-size:0.85rem;">${timestamp}</span>
                </div>
                <p style="color:var(--text-secondary);">${insight.message}</p>
            </div>
        </div>
    `;

    feed.insertBefore(insightCard, feed.firstChild);

    // Keep only last 10 insights
    while (feed.children.length > 10) {
        feed.removeChild(feed.lastChild);
    }
}

// ============================================================================
// SUGGESTIONS ENGINE
// ============================================================================

function generateInitialSuggestions() {
    const suggestionsList = document.getElementById('suggestions-list');
    
    const initialSuggestions = [
        {
            icon: '📝',
            color: 'var(--neon-blue)',
            text: 'Start with a 2-minute team energy check-in',
            priority: 'high'
        },
        {
            icon: '🎯',
            color: 'var(--neon-purple)',
            text: 'Recap last meeting\'s action items (3 pending)',
            priority: 'high'
        },
        {
            icon: '⏱️',
            color: 'var(--neon-green)',
            text: 'Allocate 15 min for Q4 budget discussion',
            priority: 'medium'
        },
        {
            icon: '👥',
            color: 'var(--neon-yellow)',
            text: 'Ensure Sarah and Mike get airtime (quiet today)',
            priority: 'medium'
        },
        {
            icon: '📊',
            color: 'var(--neon-blue)',
            text: 'Share screen with latest metrics at 10:15 AM',
            priority: 'low'
        }
    ];

    suggestionsList.innerHTML = initialSuggestions.map(createSuggestionItem).join('');
}

function updateSuggestions() {
    // This would dynamically update based on real meeting progress
    // For now, it rotates through suggestions
}

function createSuggestionItem(suggestion) {
    return `
        <li class="suggestion-item">
            <div class="suggestion-icon" style="background:${suggestion.color}22;color:${suggestion.color};">
                ${suggestion.icon}
            </div>
            <div style="flex:1;">
                <div>${suggestion.text}</div>
                ${suggestion.priority === 'high' ? '<small style="color:var(--neon-red);font-weight:600;">HIGH PRIORITY</small>' : ''}
            </div>
        </li>
    `;
}

// ============================================================================
// METRICS UPDATE
// ============================================================================

function updateMetrics() {
    // Simulate dynamic metric updates
    const metrics = {
        engagement: Math.floor(75 + Math.random() * 20),
        clarity: Math.floor(80 + Math.random() * 15),
        efficiency: Math.floor(70 + Math.random() * 25),
        decisionQuality: Math.floor(85 + Math.random() * 10),
        actionItems: Math.floor(3 + Math.random() * 5),
        success: Math.floor(88 + Math.random() * 10)
    };

    document.getElementById('engagement-score').textContent = metrics.engagement + '%';
    document.getElementById('clarity-score').textContent = metrics.clarity + '%';
    document.getElementById('time-efficiency').textContent = metrics.efficiency + '%';
    document.getElementById('decision-quality').textContent = metrics.decisionQuality + '%';
    document.getElementById('action-items').textContent = metrics.actionItems;
    document.getElementById('predicted-success').textContent = metrics.success + '%';
}

// ============================================================================
// TALKING POINTS GENERATOR
// ============================================================================

function generateTalkingPoints() {
    const talkingPointsContainer = document.getElementById('talking-points');
    
    const points = [
        {
            topic: 'Q4 Budget Review',
            points: [
                'Revenue up 23% QoQ - highlight marketing ROI',
                'Propose 15% increase for AI infrastructure',
                'Reference competitor spending (prepared data)'
            ]
        },
        {
            topic: 'Team Performance',
            points: [
                'Sprint velocity improved by 32%',
                'Zero critical bugs in production this month',
                'New hire onboarding 40% faster'
            ]
        },
        {
            topic: 'Strategic Initiatives',
            points: [
                'AI product launch scheduled for Dec 15',
                'Partnership discussions with 3 enterprise clients',
                'Patent application filed last week'
            ]
        }
    ];

    talkingPointsContainer.innerHTML = points.map(section => `
        <div style="background:rgba(15,23,42,0.8);border-radius:12px;padding:1.5rem;margin-bottom:1rem;">
            <h3 style="color:var(--neon-blue);margin-bottom:1rem;">${section.topic}</h3>
            <ul style="list-style:none;">
                ${section.points.map(point => `
                    <li style="padding:0.75rem 0;border-bottom:1px solid var(--border);">
                        <span style="color:var(--neon-green);margin-right:0.5rem;">▸</span>
                        ${point}
                    </li>
                `).join('')}
            </ul>
        </div>
    `).join('');
}

// ============================================================================
// CLEANUP
// ============================================================================

window.addEventListener('beforeunload', () => {
    if (coachingInterval) {
        clearInterval(coachingInterval);
    }
});

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initializeAICoach();
        generateTalkingPoints();
    });
} else {
    initializeAICoach();
    generateTalkingPoints();
}