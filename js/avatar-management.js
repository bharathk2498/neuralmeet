// Avatar Management JavaScript for dashboard.html
// Add this to the <script> section

// ============================================
// AVATAR MANAGEMENT SYSTEM
// ============================================

let userAvatars = [];
let activeAvatarId = null;

// Load all user's avatars on page load
async function loadUserAvatars() {
    if (!currentUser) return;
    
    try {
        const { data: avatars, error } = await supabase
            .from('avatar_training')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        userAvatars = avatars || [];
        
        // Get active avatar setting
        const { data: settings } = await supabase
            .from('avatar_display_settings')
            .select('avatar_training_id')
            .eq('user_id', currentUser.id)
            .single();

        activeAvatarId = settings?.avatar_training_id || null;

        displayAvatarGallery();
        updateActiveAvatarDisplay();

    } catch (error) {
        console.error('Error loading avatars:', error);
    }
}

// Display avatar gallery in UI
function displayAvatarGallery() {
    const container = document.getElementById('avatar-gallery');
    if (!container) return;

    if (userAvatars.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🎭</div>
                <h3>No avatars yet</h3>
                <p>Upload voice and video samples to create your first AI avatar</p>
                <button class="btn btn-primary" onclick="showPage('clone')">
                    Create Avatar
                </button>
            </div>
        `;
        return;
    }

    let html = '<div class="avatar-grid">';

    userAvatars.forEach(avatar => {
        const isActive = avatar.id === activeAvatarId;
        const statusIcon = {
            'completed': '✅',
            'training': '🎬',
            'processing': '⚙️',
            'failed': '❌',
            'pending': '⏳'
        }[avatar.status] || '⏳';

        const statusLabel = {
            'completed': 'Ready',
            'training': `Training ${avatar.progress}%`,
            'processing': 'Processing',
            'failed': 'Failed',
            'pending': 'Pending'
        }[avatar.status] || 'Pending';

        html += `
            <div class="avatar-card ${isActive ? 'active' : ''} ${avatar.status}" data-id="${avatar.id}">
                <div class="avatar-preview">
                    ${avatar.status === 'completed' ? `
                        <video 
                            class="avatar-thumbnail" 
                            poster="${avatar.avatar_thumbnail_url || '/assets/avatar-placeholder.jpg'}"
                            onclick="openAvatarModal('${avatar.id}')"
                        >
                            <source src="${avatar.avatar_video_url}" type="video/mp4">
                        </video>
                        <div class="play-overlay" onclick="openAvatarModal('${avatar.id}')">
                            <span class="play-icon">▶️</span>
                        </div>
                    ` : `
                        <div class="avatar-placeholder">
                            <span class="status-icon">${statusIcon}</span>
                        </div>
                    `}
                    ${isActive ? '<div class="active-badge">Active</div>' : ''}
                </div>
                
                <div class="avatar-info">
                    <div class="avatar-status">
                        <span class="status-dot ${avatar.status}"></span>
                        ${statusLabel}
                    </div>
                    <div class="avatar-date">
                        ${new Date(avatar.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                </div>

                <div class="avatar-actions">
                    ${avatar.status === 'completed' ? `
                        ${!isActive ? `
                            <button class="btn btn-sm btn-primary" onclick="setActiveAvatar('${avatar.id}')">
                                Set Active
                            </button>
                        ` : `
                            <button class="btn btn-sm btn-success" disabled>
                                ✓ Active
                            </button>
                        `}
                        <button class="btn btn-sm btn-secondary" onclick="testAvatar('${avatar.id}')">
                            Test
                        </button>
                    ` : avatar.status === 'training' ? `
                        <div class="progress-bar-mini">
                            <div class="progress-fill" style="width: ${avatar.progress}%"></div>
                        </div>
                    ` : avatar.status === 'failed' ? `
                        <button class="btn btn-sm btn-error" onclick="retryAvatar('${avatar.id}')">
                            Retry
                        </button>
                    ` : ''}
                    
                    <button class="btn btn-sm btn-ghost" onclick="deleteAvatar('${avatar.id}')">
                        🗑️
                    </button>
                </div>
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = html;
}

// Set active avatar
async function setActiveAvatar(avatarId) {
    try {
        showAlert('avatar-alert', 'Setting active avatar...', 'success');

        // Upsert avatar_display_settings
        const { error } = await supabase
            .from('avatar_display_settings')
            .upsert({
                user_id: currentUser.id,
                avatar_training_id: avatarId,
                show_avatar: true,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'user_id'
            });

        if (error) throw error;

        activeAvatarId = avatarId;
        displayAvatarGallery();
        updateActiveAvatarDisplay();

        showAlert('avatar-alert', '✅ Avatar activated successfully!', 'success');

    } catch (error) {
        console.error('Error setting active avatar:', error);
        showAlert('avatar-alert', 'Failed to set active avatar: ' + error.message, 'error');
    }
}

// Update the active avatar display in header/sidebar
function updateActiveAvatarDisplay() {
    const activeAvatar = userAvatars.find(a => a.id === activeAvatarId);
    
    // Update user avatar in top bar
    const avatarElement = document.getElementById('user-avatar');
    if (avatarElement && activeAvatar && activeAvatar.status === 'completed') {
        avatarElement.style.backgroundImage = `url('${activeAvatar.avatar_thumbnail_url}')`;
        avatarElement.style.backgroundSize = 'cover';
        avatarElement.textContent = '';
    }

    // Update active avatar preview section
    const previewSection = document.getElementById('active-avatar-preview');
    if (previewSection) {
        if (activeAvatar && activeAvatar.status === 'completed') {
            previewSection.innerHTML = `
                <div class="active-avatar-widget">
                    <video 
                        class="active-avatar-video" 
                        poster="${activeAvatar.avatar_thumbnail_url}"
                        controls
                    >
                        <source src="${activeAvatar.avatar_video_url}" type="video/mp4">
                    </video>
                    <div class="active-avatar-info">
                        <h4>Active Avatar</h4>
                        <p>Ready to attend meetings</p>
                        <button class="btn btn-sm btn-primary" onclick="testAvatar('${activeAvatar.id}')">
                            Test Avatar
                        </button>
                    </div>
                </div>
            `;
        } else {
            previewSection.innerHTML = `
                <div class="no-active-avatar">
                    <p>No active avatar selected</p>
                    <button class="btn btn-primary" onclick="showPage('avatars')">
                        Choose Avatar
                    </button>
                </div>
            `;
        }
    }
}

// Open avatar preview modal
function openAvatarModal(avatarId) {
    const avatar = userAvatars.find(a => a.id === avatarId);
    if (!avatar || avatar.status !== 'completed') return;

    const modal = document.getElementById('avatar-modal');
    const modalVideo = document.getElementById('modal-avatar-video');
    const modalTitle = document.getElementById('modal-avatar-title');

    if (modal && modalVideo) {
        modalVideo.src = avatar.avatar_video_url;
        modalVideo.poster = avatar.avatar_thumbnail_url;
        modalTitle.textContent = `Avatar created ${new Date(avatar.created_at).toLocaleDateString()}`;
        modal.style.display = 'flex';
        modalVideo.play();
    }
}

// Close avatar modal
function closeAvatarModal() {
    const modal = document.getElementById('avatar-modal');
    const modalVideo = document.getElementById('modal-avatar-video');
    
    if (modal && modalVideo) {
        modal.style.display = 'none';
        modalVideo.pause();
        modalVideo.src = '';
    }
}

// Test avatar with custom speech
async function testAvatar(avatarId) {
    const avatar = userAvatars.find(a => a.id === avatarId);
    if (!avatar) return;

    const text = prompt(
        "What should your avatar say?", 
        "Hello! I'm your AI assistant. I'm ready to attend meetings on your behalf."
    );
    
    if (!text) return;

    showAlert('avatar-alert', '🎬 Generating test video... This takes 30-60 seconds.', 'success');

    // TODO: Call HeyGen/D-ID API to generate video
    // For now, show the existing avatar video
    setTimeout(() => {
        openAvatarModal(avatarId);
        showAlert('avatar-alert', '✅ Test video ready!', 'success');
    }, 2000);
}

// Delete avatar
async function deleteAvatar(avatarId) {
    if (!confirm('Are you sure you want to delete this avatar?')) return;

    try {
        showAlert('avatar-alert', 'Deleting avatar...', 'warning');

        const { error } = await supabase
            .from('avatar_training')
            .delete()
            .eq('id', avatarId)
            .eq('user_id', currentUser.id);

        if (error) throw error;

        // If deleted avatar was active, clear active setting
        if (avatarId === activeAvatarId) {
            await supabase
                .from('avatar_display_settings')
                .update({ avatar_training_id: null })
                .eq('user_id', currentUser.id);
            
            activeAvatarId = null;
        }

        await loadUserAvatars();
        showAlert('avatar-alert', '✅ Avatar deleted successfully', 'success');

    } catch (error) {
        console.error('Error deleting avatar:', error);
        showAlert('avatar-alert', 'Failed to delete avatar: ' + error.message, 'error');
    }
}

// Retry failed avatar training
async function retryAvatar(avatarId) {
    showAlert('avatar-alert', 'Retry functionality coming soon!', 'warning');
    // TODO: Implement retry logic
}

// Real-time avatar updates
function subscribeToAvatarUpdates() {
    if (!currentUser) return;

    supabase
        .channel('avatar-updates')
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'avatar_training',
                filter: `user_id=eq.${currentUser.id}`
            },
            (payload) => {
                console.log('Avatar update received:', payload);
                loadUserAvatars();
            }
        )
        .subscribe();
}

// Initialize avatar system on page load
window.addEventListener('load', () => {
    setTimeout(() => {
        if (currentUser) {
            loadUserAvatars();
            subscribeToAvatarUpdates();
        }
    }, 1000);
});

// Trigger avatar creation after successful upload
// Add this to your existing clone-form submit handler
async function triggerAvatarCreation(cloneId) {
    try {
        showAlert('clone-alert', '🎬 Creating your AI avatar...', 'success');
        
        // Create pending avatar record
        const { data: training, error } = await supabase
            .from('avatar_training')
            .insert({
                user_id: currentUser.id,
                clone_id: cloneId,
                status: 'processing',
                progress: 0,
                provider: 'heygen'
            })
            .select()
            .single();

        if (error) throw error;

        // TODO: Call Edge Function to start training
        // For demo, simulate progress
        simulateAvatarTraining(training.id);

    } catch (error) {
        console.error('Avatar creation error:', error);
        showAlert('clone-alert', 'Avatar creation failed: ' + error.message, 'error');
    }
}

// Simulate avatar training progress (demo only)
async function simulateAvatarTraining(trainingId) {
    const progressSteps = [10, 25, 50, 75, 90, 100];
    
    for (const progress of progressSteps) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        await supabase
            .from('avatar_training')
            .update({
                progress: progress,
                status: progress < 100 ? 'training' : 'completed',
                avatar_video_url: progress === 100 ? 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' : null,
                avatar_thumbnail_url: progress === 100 ? 'https://via.placeholder.com/600x400/4f46e5/ffffff?text=Your+Avatar' : null,
                training_completed_at: progress === 100 ? new Date().toISOString() : null
            })
            .eq('id', trainingId);
    }
}
