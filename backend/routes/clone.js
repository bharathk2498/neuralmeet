const express = require('express');
const router = express.Router();
const multer = require('multer');
const didService = require('../services/didService');
const path = require('path');
const fs = require('fs').promises;

const CLONES_FILE = path.join(__dirname, '../data/clones.json');

// Helper: Read clones from storage
async function readClones() {
  try {
    const data = await fs.readFile(CLONES_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

// Helper: Write clones to storage
async function writeClones(clones) {
  await fs.mkdir(path.dirname(CLONES_FILE), { recursive: true });
  await fs.writeFile(CLONES_FILE, JSON.stringify(clones, null, 2));
}

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = 'uploads';
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const allowedAudioTypes = /mp3|wav|m4a|flac|mp4/;
    const allowedImageTypes = /jpeg|jpg|png/;
    const allowedVideoTypes = /mp4|mov|avi|webm/;

    const extname = path.extname(file.originalname).toLowerCase();
    const mimetype = file.mimetype;

    if (file.fieldname === 'audio') {
      if (allowedAudioTypes.test(extname) || mimetype.startsWith('audio')) {
        cb(null, true);
      } else {
        cb(new Error('Only audio files are allowed (mp3, wav, m4a, flac, mp4)'));
      }
    } else if (file.fieldname === 'image') {
      if (allowedImageTypes.test(extname) || mimetype.startsWith('image')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed (jpg, jpeg, png)'));
      }
    } else if (file.fieldname === 'video') {
      if (allowedVideoTypes.test(extname) || mimetype.startsWith('video')) {
        cb(null, true);
      } else {
        cb(new Error('Only video files are allowed (mp4, mov, avi, webm)'));
      }
    } else {
      cb(new Error('Invalid field name'));
    }
  }
});

// Upload video file (for manual clone imports)
router.post('/upload-video', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No video file uploaded'
      });
    }

    const protocol = process.env.NODE_ENV === 'production' ? 'https' : req.protocol;
    const host = req.get('host');
    const videoUrl = `${protocol}://${host}/uploads/${req.file.filename}`;

    console.log('Video uploaded:', {
      filename: req.file.filename,
      url: videoUrl
    });

    res.json({
      success: true,
      videoUrl: videoUrl,
      filename: req.file.filename
    });
  } catch (error) {
    console.error('Video upload error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create clone
router.post('/create',
  upload.fields([
    { name: 'audio', maxCount: 1 },
    { name: 'image', maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const audioFile = req.files['audio']?.[0];
      const imageFile = req.files['image']?.[0];

      if (!audioFile || !imageFile) {
        return res.status(400).json({
          success: false,
          error: 'Both audio and image files are required'
        });
      }

      console.log('Files received:', {
        audio: audioFile.filename,
        image: imageFile.filename
      });

      const protocol = process.env.NODE_ENV === 'production' ? 'https' : req.protocol;
      const host = req.get('host');
      
      const audioUrl = `${protocol}://${host}/uploads/${audioFile.filename}`;
      const imageUrl = `${protocol}://${host}/uploads/${imageFile.filename}`;

      console.log('File URLs:', {
        audio: audioUrl,
        image: imageUrl
      });

      const result = await didService.createTalk(audioUrl, imageUrl);

      if (!result.success) {
        return res.status(500).json(result);
      }

      res.json({
        success: true,
        talkId: result.data.id,
        status: result.data.status,
        data: result.data
      });
    } catch (error) {
      console.error('Clone creation error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

// Save clone to profile
router.post('/save', async (req, res) => {
  try {
    const { name, talkId, videoUrl, thumbnailUrl, duration, communicationStyle, decisionMaking, source } = req.body;

    if (!name || !talkId || !videoUrl) {
      return res.status(400).json({
        success: false,
        error: 'Name, talkId, and videoUrl are required'
      });
    }

    const clones = await readClones();
    
    const newClone = {
      id: Date.now().toString(),
      name,
      talkId,
      videoUrl,
      thumbnailUrl: thumbnailUrl || '',
      duration: duration || 0,
      communicationStyle: communicationStyle || '',
      decisionMaking: decisionMaking || '',
      source: source || 'generated',
      createdAt: new Date().toISOString(),
      usageCount: 0,
      lastUsed: null
    };

    clones.push(newClone);
    await writeClones(clones);

    res.json({
      success: true,
      clone: newClone
    });
  } catch (error) {
    console.error('Clone save error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get all saved clones
router.get('/saved', async (req, res) => {
  try {
    const clones = await readClones();
    res.json({
      success: true,
      clones
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get single clone by ID
router.get('/saved/:id', async (req, res) => {
  try {
    const clones = await readClones();
    const clone = clones.find(c => c.id === req.params.id);
    
    if (!clone) {
      return res.status(404).json({
        success: false,
        error: 'Clone not found'
      });
    }

    res.json({
      success: true,
      clone
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update clone usage
router.put('/saved/:id/use', async (req, res) => {
  try {
    const clones = await readClones();
    const cloneIndex = clones.findIndex(c => c.id === req.params.id);
    
    if (cloneIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Clone not found'
      });
    }

    clones[cloneIndex].usageCount++;
    clones[cloneIndex].lastUsed = new Date().toISOString();
    await writeClones(clones);

    res.json({
      success: true,
      clone: clones[cloneIndex]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Delete saved clone
router.delete('/saved/:id', async (req, res) => {
  try {
    const clones = await readClones();
    const filteredClones = clones.filter(c => c.id !== req.params.id);
    
    if (filteredClones.length === clones.length) {
      return res.status(404).json({
        success: false,
        error: 'Clone not found'
      });
    }

    await writeClones(filteredClones);

    res.json({
      success: true,
      message: 'Clone deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get clone status
router.get('/status/:talkId', async (req, res) => {
  try {
    const result = await didService.getTalkStatus(req.params.talkId);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get D-ID credits
router.get('/credits', async (req, res) => {
  try {
    const result = await didService.getCredits();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Delete D-ID talk
router.delete('/:talkId', async (req, res) => {
  try {
    const result = await didService.deleteTalk(req.params.talkId);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;