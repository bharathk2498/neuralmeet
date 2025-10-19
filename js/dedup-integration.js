// DEDUPLICATION: Add these functions after supabase initialization

async function getFileHash(file) {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function checkDuplicateFile(userId, fileHash, bucket) {
    const tableName = bucket === 'voice-samples' ? 'voice_samples' : 'video_samples';
    
    try {
        const { data, error } = await supabase
            .from(tableName)
            .select('file_name, file_path, file_hash')
            .eq('user_id', userId)
            .eq('file_hash', fileHash);
        
        if (error) {
            console.warn('Could not check for duplicates:', error);
            return null;
        }
        
        return data && data.length > 0 ? data[0] : null;
    } catch (err) {
        console.warn('Duplicate check failed:', err);
        return null;
    }
}

// UPLOAD WITH DEDUPLICATION: Replace the clone-form submit handler with this

document.getElementById('clone-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('[Dedup] Form submitted - starting clone training');
    
    if (!currentUser) {
        console.error('No user logged in');
        showAlert('clone-alert', 'Please log in first', 'error');
        return;
    }

    if (voiceFiles.length === 0 && videoFiles.length === 0) {
        console.error('No files selected');
        showAlert('clone-alert', 'Please upload at least one voice or video file', 'error');
        return;
    }

    const trainBtn = document.getElementById('train-btn');
    trainBtn.disabled = true;
    trainBtn.textContent = 'Checking for duplicates...';
    updateProgress(0);

    try {
        const communicationStyle = document.getElementById('communication-style').value;
        const decisionStyle = document.getElementById('decision-style').value;

        console.log('[Dedup] Creating clone record in database...');
        const { data: cloneData, error: cloneError } = await supabase
            .from('user_clones')
            .insert({
                user_id: currentUser.id,
                communication_style: communicationStyle,
                decision_style: decisionStyle,
                training_status: 'uploading'
            })
            .select()
            .single();

        if (cloneError) {
            console.error('Database error:', cloneError);
            throw new Error('Database table user_clones not found. Run the SQL setup in Supabase SQL Editor.');
        }

        console.log('[Dedup] Clone record created:', cloneData.id);

        const totalFiles = voiceFiles.length + videoFiles.length;
        let uploadedFiles = 0;
        let skippedFiles = 0;

        trainBtn.textContent = 'Uploading...';

        // Process voice files
        for (const file of voiceFiles) {
            console.log('[Dedup] Processing voice file:', file.name);
            
            // Calculate file hash
            const fileHash = await getFileHash(file);
            console.log('[Dedup] File hash:', fileHash.substring(0, 16) + '...');
            
            // Check for duplicate
            const duplicate = await checkDuplicateFile(currentUser.id, fileHash, 'voice-samples');
            
            if (duplicate) {
                console.log('[Dedup] ⏭️ Skipping duplicate:', file.name);
                showAlert('clone-alert', `⏭️ Skipped duplicate: ${file.name}`, 'warning');
                skippedFiles++;
                uploadedFiles++;
                updateProgress((uploadedFiles / totalFiles) * 100);
                await new Promise(resolve => setTimeout(resolve, 500)); // Brief delay so user sees the message
                continue;
            }
            
            // Upload new file
            console.log('[Dedup] ⬆️ Uploading new file:', file.name);
            const filePath = currentUser.id + '/voice/' + Date.now() + '-' + file.name;
            await uploadToSupabase(file, 'voice-samples', filePath);
            
            await supabase.from('voice_samples').insert({
                user_id: currentUser.id,
                clone_id: cloneData.id,
                file_path: filePath,
                file_name: file.name,
                file_size: file.size,
                file_hash: fileHash
            });

            uploadedFiles++;
            updateProgress((uploadedFiles / totalFiles) * 100);
            console.log('[Dedup] Progress:', Math.round((uploadedFiles / totalFiles) * 100) + '%');
        }

        // Process video files
        for (const file of videoFiles) {
            console.log('[Dedup] Processing video file:', file.name);
            
            // Calculate file hash
            const fileHash = await getFileHash(file);
            console.log('[Dedup] File hash:', fileHash.substring(0, 16) + '...');
            
            // Check for duplicate
            const duplicate = await checkDuplicateFile(currentUser.id, fileHash, 'video-samples');
            
            if (duplicate) {
                console.log('[Dedup] ⏭️ Skipping duplicate:', file.name);
                showAlert('clone-alert', `⏭️ Skipped duplicate: ${file.name}`, 'warning');
                skippedFiles++;
                uploadedFiles++;
                updateProgress((uploadedFiles / totalFiles) * 100);
                await new Promise(resolve => setTimeout(resolve, 500));
                continue;
            }
            
            // Upload new file
            console.log('[Dedup] ⬆️ Uploading new file:', file.name);
            const filePath = currentUser.id + '/video/' + Date.now() + '-' + file.name;
            await uploadToSupabase(file, 'video-samples', filePath);
            
            await supabase.from('video_samples').insert({
                user_id: currentUser.id,
                clone_id: cloneData.id,
                file_path: filePath,
                file_name: file.name,
                file_size: file.size,
                file_hash: fileHash
            });

            uploadedFiles++;
            updateProgress((uploadedFiles / totalFiles) * 100);
            console.log('[Dedup] Progress:', Math.round((uploadedFiles / totalFiles) * 100) + '%');
        }

        await supabase
            .from('user_clones')
            .update({ training_status: 'processing' })
            .eq('id', cloneData.id);

        updateProgress(100);
        console.log('[Dedup] ✅ All files processed!');
        console.log(`[Dedup] Uploaded: ${uploadedFiles - skippedFiles}, Skipped: ${skippedFiles}`);
        
        setTimeout(() => {
            const message = skippedFiles > 0 
                ? `✅ Upload complete! ${uploadedFiles - skippedFiles} new files uploaded, ${skippedFiles} duplicates skipped.`
                : `✅ Upload complete! ${uploadedFiles} files uploaded successfully.`;
            showAlert('clone-alert', message + ' Your AI clone is being trained. This usually takes 10-15 minutes.', 'success');
        }, 500);
        
        document.getElementById('clone-form').reset();
        voiceFiles = [];
        videoFiles = [];
        document.getElementById('voice-file-list').innerHTML = '';
        document.getElementById('video-file-list').innerHTML = '';
        
        const uploadAreas = document.querySelectorAll('.upload-area');
        uploadAreas.forEach(area => area.classList.remove('active'));

    } catch (error) {
        console.error('[Dedup] ❌ Clone training error:', error);
        showAlert('clone-alert', 'Upload failed: ' + error.message, 'error');
    } finally {
        trainBtn.disabled = false;
        trainBtn.textContent = 'Train AI Clone';
        setTimeout(() => {
            document.getElementById('progress-container').style.display = 'none';
            updateProgress(0);
        }, 3000);
    }
});
