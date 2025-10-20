let clones = [];
let selectedClone = null;

// Load clones on page load
document.addEventListener('DOMContentLoaded', loadClones);

async function loadClones() {
    try {
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
    card.className = 'bg-gray-800 rounded-lg overflow-hidden hover:ring-2 hover:ring-blue-500 transition cursor-pointer';
    card.onclick = () => openCloneModal(clone);

    const createdDate = new Date(clone.createdAt).toLocaleDateString();
    const duration = clone.duration ? `${clone.duration}s` : 'N/A';

    card.innerHTML = `
        <div class="aspect-video bg-gray-900 relative">
            ${clone.thumbnailUrl ? 
                `<img src="${clone.thumbnailUrl}" alt="${clone.name}" class="w-full h-full object-cover" />` :
                `<div class="flex items-center justify-center h-full">
                    <span class="text-6xl">🤖</span>
                </div>`
            }
            <div class="absolute bottom-2 right-2 bg-black bg-opacity-75 px-2 py-1 rounded text-sm">
                ${duration}
            </div>
        </div>
        <div class="p-4">
            <h3 class="font-semibold text-lg mb-2">${clone.name}</h3>
            <div class="text-sm text-gray-400 space-y-1">
                <div>Created: ${createdDate}</div>
                <div>Used: ${clone.usageCount || 0} times</div>
            </div>
            <button onclick="event.stopPropagation(); quickUseClone('${clone.id}')" class="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold transition">
                Use in Meeting
            </button>
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
    }

    document.getElementById('clone-modal').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('clone-modal').classList.add('hidden');
    document.getElementById('modal-video').pause();
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
    } catch (error) {
        console.error('Error updating usage:', error);
    }
}

function showUsageInstructions(clone) {
    const instructions = `
📹 HOW TO USE YOUR AI CLONE IN MEETINGS

Your clone video: ${clone.name}

METHOD 1: Screen Share (Easiest)
1. Download video (click Download button below)
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

    if (!confirm(`Are you sure you want to delete "${selectedClone.name}"?`)) {
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