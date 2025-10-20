const express = require('express');
const router = express.Router();
const multer = require('multer');
const didService = require('../services/didService');
const path = require('path');
const fs = require('fs').promises;

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
    } else {
      cb(new Error('Invalid field name'));
    }
  }
});

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

      // Force HTTPS for production URLs (Render uses reverse proxy)
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