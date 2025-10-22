// ============================================================================
// PREDICTIVE ANALYTICS ENGINE
// AI-powered forecasting and outcome prediction
// ============================================================================

function initializePredictiveAnalytics() {
    renderSuccessTrendChart();
    renderOpportunities();
    renderRiskAlerts();
}

function renderSuccessTrendChart() {
    const ctx = document.getElementById('successTrendChart').getContext('2d');
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [
                {
                    label: 'Actual Success Rate',
                    data: [72, 75, 78, 82, 85, 87, 89, 91, 93, 94, null, null],
                    borderColor: '#00d4ff',
                    backgroundColor: 'rgba(0, 212, 255, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Predicted Success Rate',
                    data: [null, null, null, null, null, null, null, null, null, 94, 95, 96],
                    borderColor: '#b537f2',
                    backgroundColor: 'rgba(181, 55, 242, 0.1)',
                    borderDash: [5, 5],
                    tension: 0.4,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        color: '#f8fafc',
                        font: { size: 12 }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    min: 60,
                    max: 100,
                    ticks: {
                        color: '#cbd5e1',
                        callback: function(value) {
                            return value + '%';
                        }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    }
                },
                x: {
                    ticks: { color: '#cbd5e1' },
                    grid: { color: 'rgba(255, 255, 255, 0.05)' }
                }
            }
        }
    });
}

function renderOpportunities() {
    const container = document.getElementById('opportunities-list');
    
    const opportunities = [
        {
            title: 'Enterprise Deal - TechCorp',
            value: '$150K',
            probability: 87,
            timeline: '14 days',
            trend: 'up'
        },
        {
            title: 'Partnership - DataSystems Inc',
            value: '$95K',
            probability: 72,
            timeline: '21 days',
            trend: 'up'
        },
        {
            title: 'Upsell - CloudNet Solutions',
            value: '$45K',
            probability: 94,
            timeline: '7 days',
            trend: 'up'
        },
        {
            title: 'Renewal - GlobalTech',
            value: '$120K',
            probability: 65,
            timeline: '30 days',
            trend: 'down'
        }
    ];

    container.innerHTML = opportunities.map(opp => `
        <div class="forecast-item">
            <div>
                <strong style="color:var(--neon-blue);">${opp.title}</strong>
                <div style="color:var(--text-secondary);font-size:0.9rem;margin-top:0.25rem;">
                    ${opp.value} · ${opp.timeline}
                </div>
            </div>
            <div style="text-align:right;">
                <div style="font-size:1.5rem;font-weight:700;color:${opp.probability >= 80 ? 'var(--neon-green)' : 'var(--neon-yellow)'};"> 
                    ${opp.probability}%
                </div>
                <div class="trend-indicator ${opp.trend === 'up' ? 'trend-up' : 'trend-down'}">
                    ${opp.trend === 'up' ? '↑' : '↓'} ${opp.trend === 'up' ? '+' : '-'}${Math.floor(Math.random() * 10)}%
                </div>
            </div>
        </div>
    `).join('');
}

function renderRiskAlerts() {
    const container = document.getElementById('risk-alerts');
    
    const risks = [
        {
            severity: 'medium',
            title: 'Meeting Fatigue Detected',
            description: 'Team has 18 meetings this week - 25% above optimal',
            action: 'Consider rescheduling 3-4 low-priority meetings',
            impact: 'Productivity may drop 15%'
        },
        {
            severity: 'low',
            title: 'Decision Bottleneck',
            description: '5 pending decisions from last 2 weeks',
            action: 'Schedule decision-making session this week',
            impact: '2-3 projects blocked'
        },
        {
            severity: 'high',
            title: 'Budget Velocity Alert',
            description: 'Spending 23% faster than planned for Q4',
            action: 'Review discretionary spending immediately',
            impact: 'Potential $45K overrun'
        }
    ];

    const severityColors = {
        high: 'var(--neon-red)',
        medium: 'var(--neon-yellow)',
        low: 'var(--neon-green)'
    };

    container.innerHTML = risks.map(risk => `
        <div class="forecast-item" style="border-left:4px solid ${severityColors[risk.severity]};">
            <div style="flex:1;">
                <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.5rem;">
                    <strong style="color:${severityColors[risk.severity]};">${risk.title}</strong>
                    <span style="background:${severityColors[risk.severity]}22;color:${severityColors[risk.severity]};padding:0.25rem 0.75rem;border-radius:12px;font-size:0.75rem;font-weight:600;">
                        ${risk.severity.toUpperCase()}
                    </span>
                </div>
                <p style="color:var(--text-secondary);margin-bottom:0.5rem;">${risk.description}</p>
                <div style="background:rgba(15,23,42,0.8);padding:0.75rem;border-radius:8px;margin-top:0.75rem;">
                    <div style="color:var(--neon-blue);font-size:0.9rem;margin-bottom:0.25rem;"><strong>→ Recommended Action:</strong></div>
                    <div style="color:var(--text-secondary);font-size:0.9rem;">${risk.action}</div>
                </div>
                <small style="color:${severityColors[risk.severity]};font-weight:600;margin-top:0.5rem;display:block;">
                    ⚠️ Impact: ${risk.impact}
                </small>
            </div>
        </div>
    `).join('');
}

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePredictiveAnalytics);
} else {
    initializePredictiveAnalytics();
}