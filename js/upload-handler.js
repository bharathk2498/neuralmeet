/**
 * Secure Upload Handler with validation, progress tracking, and error recovery
 */

class SecureUploadHandler {
  constructor(supabase, userId) {
    this.supabase = supabase;
    this.userId = userId;
    this.activeUploads = new Map();
  }

  async uploadFile(file, bucket, progressCallback) {
    const uploadId = `${bucket}-${Date.now()}-${Math.random()}`;
    
    try {
      // Generate secure path with UUID folder structure
      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `${this.userId}/${bucket}/${timestamp}-${sanitizedName}`;

      console.log(`[Upload ${uploadId}] Starting: ${filePath}`);

      // Track upload
      this.activeUploads.set(uploadId, { file, bucket, path: filePath });

      // Notify upload started
      if (progressCallback) {
        progressCallback({
          progress: 0,
          fileName: file.name,
          status: 'starting'
        });
      }

      // Upload with retry logic
      const { data, error } = await this.uploadWithRetry(
        bucket, 
        filePath, 
        file, 
        (progress) => {
          if (progressCallback) {
            progressCallback({
              progress,
              fileName: file.name,
              status: 'uploading'
            });
          }
        }
      );

      if (error) {
        throw new Error(`Storage error: ${error.message}`);
      }

      // Notify completion
      if (progressCallback) {
        progressCallback({
          progress: 100,
          fileName: file.name,
          status: 'complete'
        });
      }

      console.log(`[Upload ${uploadId}] Complete:`, data);
      this.activeUploads.delete(uploadId);

      return { path: data.path, fullPath: data.fullPath || filePath };

    } catch (error) {
      console.error(`[Upload ${uploadId}] Failed:`, error);
      
      // Notify failure
      if (progressCallback) {
        progressCallback({
          progress: 0,
          fileName: file.name,
          status: 'error',
          error: error.message
        });
      }
      
      this.activeUploads.delete(uploadId);
      throw new Error(`Upload failed: ${error.message}`);
    }
  }

  async uploadWithRetry(bucket, path, file, progressCallback, maxRetries = 3) {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[Upload] Attempt ${attempt}/${maxRetries}`);

        // Simulate chunked upload progress
        const chunkSize = file.size / 10; // Simulate 10 chunks
        let uploadedSize = 0;

        // Start upload
        const uploadPromise = this.supabase.storage
          .from(bucket)
          .upload(path, file, {
            cacheControl: '3600',
            upsert: false
          });

        // Simulate progress (real implementation would use XMLHttpRequest for actual progress)
        const progressInterval = setInterval(() => {
          if (uploadedSize < file.size) {
            uploadedSize += chunkSize;
            const progress = Math.min(95, (uploadedSize / file.size) * 100);
            if (progressCallback) {
              progressCallback(Math.round(progress));
            }
          }
        }, 200);

        const { data, error } = await uploadPromise;
        clearInterval(progressInterval);

        if (error) {
          lastError = error;
          console.warn(`[Upload] Attempt ${attempt} failed:`, error.message);
          
          // Wait before retry (exponential backoff)
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
          }
          continue;
        }

        // Complete progress
        if (progressCallback) {
          progressCallback(100);
        }

        return { data, error: null };

      } catch (err) {
        lastError = err;
        console.error(`[Upload] Attempt ${attempt} exception:`, err);
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
        }
      }
    }

    return { data: null, error: lastError };
  }

  cancelAll() {
    console.log(`[Upload] Cancelling ${this.activeUploads.size} active uploads`);
    this.activeUploads.clear();
  }

  getActiveUploads() {
    return Array.from(this.activeUploads.values());
  }
}

if (typeof window !== 'undefined') {
  window.SecureUploadHandler = SecureUploadHandler;
}
