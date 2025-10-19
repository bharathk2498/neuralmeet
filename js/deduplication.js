// Add this function before uploadToSupabase()

async function getFileHash(file) {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function checkDuplicateFile(userId, fileName, fileHash, bucket) {
    const tableName = bucket === 'voice-samples' ? 'voice_samples' : 'video_samples';
    
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
}
