// ============================================================================
// MEETING ROI CALCULATOR
// Calculate cost, value, and ROI of meetings
// ============================================================================

function initializeROICalculator() {
    renderValueBreakdown();
    renderOptimizationOpportunities();
}

function renderValueBreakdown() {
    const container = document.getElementById('value-breakdown');
    
    const valueItems = [
        {
            category: 'Revenue Generated',
            value: '$485,000',
            percentage: 57,
            description: 'From deals closed in meetings',
            color: 'var(--neon-green)'
        },
        {
            category: 'Decisions Made',
            value: '$187,500',
            percentage: 22,
            description: '125 strategic decisions × $1,500 avg value',
            color: 'var(--neon-blue)'
        },
        {
            category: 'Problems Solved',
            value: '$98,750',
            percentage: 12,
            description: 'Prevented issues & saved costs',
            color: 'var(--neon-purple)'
        },
        {
            category: 'Alignment & Clarity',
            value: '$76,000',
            percentage: 9,
            description: 'Reduced miscommunication costs',
            color: 'var(--neon-yellow)'
        }
    ];

    container.innerHTML = valueItems.map(item => `
        <div class="breakdown-item" style="border-left:4px solid ${item.color};">
            <div style="flex:1;">
                <div style="font-weight:600;font-size:1.1rem;margin-bottom:0.25rem;">${item.category}</div>
                <p style="color:var(--text-secondary);font-size:0.9rem;">${item.description}</p>
            </div>
            <div style="text-align:right;">
                <div style="font-size:1.8rem;font-weight:900;color:${item.color};">${item.value}</div>
                <div style="color:var(--text-secondary);font-size:0.9rem;">${item.percentage}% of total</div>
            </div>
        </div>
    `).join('');
}

function renderOptimizationOpportunities() {
    const container = document.getElementById('optimization-list');
    
    const opportunities = [
        {
            title: 'Reduce Low-Value Meetings',
            potentialSavings: '$45,000/year',
            description: '12 recurring meetings have <40% engagement. Consider canceling or reformatting.',
            action: 'Review & Cancel',
            impact: 'high'
        },
        {
            title: 'Shorten Meeting Duration',
            potentialSavings: '$28,500/year',
            description: '23% of meetings end 10+ minutes early. Default to 25/50 min instead of 30/60 min.',
            action: 'Update Defaults',
            impact: 'medium'
        },
        {
            title: 'Optimize Attendance',
            potentialSavings: '$62,000/year',
            description: '15% of attendees are optional. Make meetings smaller and more focused.',
            action: 'Reduce Attendees',
            impact: 'high'
        },
        {
            title: 'Use Async Communication',
            potentialSavings: '$33,750/year',
            description: '18 weekly status meetings could be replaced with written updates.',
            action: 'Switch to Async',
            impact: 'medium'
        },
        {
            title: 'Implement AI Notetaker',
            potentialSavings: '$19,200/year',
            description: 'Save 15 minutes per meeting on manual note-taking (already included!).',
            action: 'Currently Active ✓',
            impact: 'low'
        }
    ];

    const impactColors = {
        high: 'var(--neon-red)',
        medium: 'var(--neon-yellow)',
        low: 'var(--neon-green)'
    };

    container.innerHTML = opportunities.map(opp => `
        <div class="breakdown-item">
            <div style="flex:1;">
                <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.5rem;">
                    <strong style="font-size:1.1rem;">${opp.title}</strong>
                    <span style="background:${impactColors[opp.impact]}22;color:${impactColors[opp.impact]};padding:0.25rem 0.75rem;border-radius:12px;font-size:0.75rem;font-weight:600;">
                        ${opp.impact.toUpperCase()} IMPACT
                    </span>
                </div>
                <p style="color:var(--text-secondary);margin-bottom:0.75rem;">${opp.description}</p>
                <div style="display:inline-block;background:rgba(0,212,255,0.2);padding:0.5rem 1rem;border-radius:20px;font-size:0.9rem;font-weight:600;color:var(--neon-blue);">
                    ${opp.action}
                </div>
            </div>
            <div style="text-align:right;">
                <div style="font-size:1.8rem;font-weight:900;color:var(--neon-green);">${opp.potentialSavings}</div>
                <small style="color:var(--text-secondary);">Potential Savings</small>
            </div>
        </div>
    `).join('');
}

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeROICalculator);
} else {
    initializeROICalculator();
}