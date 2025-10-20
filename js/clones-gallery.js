let clones = [];
let selectedClone = null;

// Load clones on page load
document.addEventListener('DOMContentLoaded', loadClones);

async function loadClones() {
    try {
        if (!BACKEND_CONFIG.url) {
            showError('Backend not configured');
            return;
        }

        const response = await fetch(`${BACKEND_CONFIG.url}/api/clone/saved`);
        const data = await response.json();

        if (data.success) {
            clones = data.clones || [];
            displayClones();
        } else {
            showError('Failed to load clones');
        }
    } catch (error) {
        console.error('Error loading clones:', error);
        showError('Error loading clones: ' + error.message);
    }
}

function displayClones() {
    const loading = document.getElementById('loading');
    const emptyState = document.getElementById('empty-state');
    const grid = document.getElementById('clones-grid');

    loading.classList.add('hidden');

    if (clones.length === 0) {
        emptyState.classList.remove('hidden');
        grid.classList.add('hidden');
    } else {
        emptyState.classList.add('hidden');
        grid.classList.remove('hidden');
        renderClones();
    }
}

function renderClones() {
    const grid = document.getElementById('clones-grid');
    grid.innerHTML = '';

    clones.forEach(clone => {
        const card = createCloneCard(clone);
        grid.appendChild(card);
    });
}

function createCloneCard(clone) {
    const card = document.createElement('div');
    card.className = 'clone-card';
    card.onclick = () => openCloneModal(clone);

    const createdDate = new Date(clone.createdAt).toLocaleDateString();
    const duration = clone.duration ? `${clone.duration}s` : 'N/A';

    card.innerHTML = `
        <div class="clone-thumbnail">
            ${clone.thumbnailUrl ? 
                `<img src="${clone.thumbnailUrl}" alt="${clone.name}" />` :
                `<div class="clone-placeholder">AI</div>`
            }
            <div class="clone-duration">${duration}</div>
        </div>
        <div class="clone-info">
            <h3 class="clone-name">${clone.name}</h3>
            <div class="clone-stats">
                <span>Created: ${createdDate}</span>
                <span>Used: ${clone.usageCount || 0}×</span>
            </div>
            <div class="clone-actions">
                <button onclick="event.stopPropagation(); quickUseClone('${clone.id}')" class="btn btn-quantum btn-small">
                    Deploy
                </button>
                <button onclick="event.stopPropagation(); openCloneModal(clones.find(c => c.id === '${clone.id}'))" class="btn btn-neural btn-small">
                    Details
                </button>
            </div>
        </div>
    `;

    return card;
}

function openCloneModal(clone) {
    selectedClone = clone;
    
    document.getElementById('modal-clone-name').textContent = clone.name;
    document.getElementById('modal-video').src = clone.videoUrl;
    document.getElementById('modal-created-at').textContent = new Date(clone.createdAt).toLocaleString();
    document.getElementById('modal-duration').textContent = clone.duration ? `${clone.duration} seconds` : 'N/A';
    document.getElementById('modal-usage-count').textContent = clone.usageCount || 0;
    document.getElementById('modal-last-used').textContent = clone.lastUsed ? new Date(clone.lastUsed).toLocaleString() : 'Never';
    
    if (clone.communicationStyle) {
        document.getElementById('modal-comm-style-container').classList.remove('hidden');
        document.getElementById('modal-comm-style').textContent = clone.communicationStyle;
    } else {
        document.getElementById('modal-comm-style-container').classList.add('hidden');
    }

    document.getElementById('clone-modal').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('clone-modal').classList.add('hidden');
    const video = document.getElementById('modal-video');
    video.pause();
    video.currentTime = 0;
    selectedClone = null;
}

async function quickUseClone(cloneId) {
    const clone = clones.find(c => c.id === cloneId);
    if (!clone) return;

    selectedClone = clone;
    await useClone();
}

async function useClone() {
    if (!selectedClone) return;

    try {
        // Update usage count
        await fetch(`${BACKEND_CONFIG.url}/api/clone/saved/${selectedClone.id}/use`, {
            method: 'PUT'
        });

        // Show usage instructions
        showUsageInstructions(selectedClone);
        
        // Reload to update usage count
        await loadClones();
    } catch (error) {
        console.error('Error updating usage:', error);
    }
}

function showUsageInstructions(clone) {
    const instructions = `
HOW TO USE YOUR AI CLONE IN MEETINGS

Your clone: ${clone.name}

METHOD 1: Screen Share (Easiest)
1. Download video (click Download button)
2. Join your Zoom/Teams/Meet meeting
3. Click "Share Screen"
4. Select video player window
5. Press play on video
6. Your AI clone presents!

METHOD 2: Virtual Camera (Professional)
1. Install OBS Studio (free): https://obsproject.com
2. Add video source → Select your clone video
3. Set up virtual camera in OBS
4. Join meeting
5. Select "OBS Virtual Camera" as camera
6. AI clone appears as your webcam!

METHOD 3: Pre-record & Share Link
1. Upload video to YouTube/Vimeo
2. Share link in meeting chat
3. Attendees watch your AI clone presentation

VIDEO LINK: ${clone.videoUrl}

Would you like to download the video now?
    `;

    if (confirm(instructions)) {
        downloadClone();
    }
}

function downloadClone() {
    if (!selectedClone) return;

    const a = document.createElement('a');
    a.href = selectedClone.videoUrl;
    a.download = `${selectedClone.name.replace(/\s+/g, '-')}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

async function deleteClone() {
    if (!selectedClone) return;

    if (!confirm(`Are you sure you want to permanently delete "${selectedClone.name}"?\n\nThis action cannot be undone.`)) {
        return;
    }

    try {
        const response = await fetch(`${BACKEND_CONFIG.url}/api/clone/saved/${selectedClone.id}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (data.success) {
            closeModal();
            await loadClones();
        } else {
            showError('Failed to delete clone');
        }
    } catch (error) {
        console.error('Error deleting clone:', error);
        showError('Error deleting clone: ' + error.message);
    }
}

function showError(message) {
    alert(message);
}

// Close modal on escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
    }
});

// Click outside modal to close
document.getElementById('clone-modal').addEventListener('click', (e) => {
    if (e.target.id === 'clone-modal') {
        closeModal();
    }
});