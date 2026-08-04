const { uploadToGridFS, getGridFSStream, getGridFSFileDoc, deleteFromGridFS } = require('../services/gridfsService');
const path = require('path');
const fs = require('fs');

/**
 * Upload single file to GridFS
 */
const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const fileInfo = await uploadToGridFS(req.file.buffer, req.file.originalname, req.file.mimetype);
    res.json({
      success: true,
      message: 'File uploaded successfully to GridFS',
      file: fileInfo,
      fileId: fileInfo.fileId,
      url: fileInfo.url
    });
  } catch (err) {
    console.error('GridFS Upload Error:', err);
    res.status(500).json({ success: false, message: err.message || 'File upload failed' });
  }
};

/**
 * Stream file from GridFS or fallback to local disk
 */
const getFile = async (req, res) => {
  try {
    const idOrFilename = req.params.id;
    const doc = await getGridFSFileDoc(idOrFilename);

    if (doc) {
      res.set('Content-Type', doc.contentType || 'application/octet-stream');
      res.set('Content-Length', doc.length);
      res.set('Cache-Control', 'public, max-age=31536000, immutable');
      
      const stream = getGridFSStream(doc._id);
      stream.on('error', () => {
        if (!res.headersSent) res.status(404).json({ success: false, message: 'File stream error' });
      });
      return stream.pipe(res);
    }

    // Fallback: Check local disk uploads folder for legacy files
    const legacyPath = path.join(__dirname, '../../uploads', idOrFilename);
    if (fs.existsSync(legacyPath)) {
      return res.sendFile(legacyPath);
    }

    res.status(404).json({ success: false, message: 'File not found' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Delete file from GridFS
 */
const deleteFile = async (req, res) => {
  try {
    const success = await deleteFromGridFS(req.params.id);
    if (success) {
      res.json({ success: true, message: 'File deleted from GridFS' });
    } else {
      res.status(404).json({ success: false, message: 'File not found' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  uploadFile,
  getFile,
  deleteFile
};
