const Document = require('../models/Document');
const { createNotification, notifyAdmins } = require('../services/notificationService');
const User = require('../models/User');
const { sendMail } = require('../config/mailer');
const { sendWhatsApp } = require('../config/twilio');

const getMyDocuments = async (req, res) => {
  try {
    const docs = await Document.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, documents: docs });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const getAllDocuments = async (req, res) => {
  try {
    const { status, type, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;
    if (type) query.type = type;
    const total = await Document.countDocuments(query);
    const docs = await Document.find(query).populate('userId', 'name phone email').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit));
    res.json({ success: true, total, documents: docs });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const requestDocument = async (req, res) => {
  try {
    const { type, requestDetails } = req.body;
    const doc = await Document.create({ userId: req.user._id, type, requestDetails });
    // Notify user (Async)
    createNotification({ userId: req.user._id, title: 'Document Request Received', message: `Your request for ${type.replace('_', ' ')} certificate has been received.`, type: 'document', relatedId: doc._id, channels: ['email'] }).catch(e => console.error('Doc notification error:', e.message));
    
    // Notify admins (Async)
    notifyAdmins({
      title: 'New Document Request',
      message: `A new document request has been received:\n\n👤 User: ${req.user.name}\n📞 Phone: ${req.user.phone || 'N/A'}\n📧 Email: ${req.user.email}\n📄 Type: ${type.replace('_', ' ')}\n📝 Details: ${requestDetails || 'None'}\n\nView details: ${process.env.CLIENT_URL || 'http://localhost:5173'}/admin/documents`
    }).catch(e => console.error('Doc request notification error:', e.message));

    res.status(201).json({ success: true, document: doc });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const updateDocumentStatus = async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    const updateData = { status, adminNote, processedBy: req.user._id, processedAt: new Date() };
    if (req.file) updateData.uploadedFile = `/uploads/documents/${req.file.filename}`;
    const doc = await Document.findByIdAndUpdate(req.params.id, updateData, { new: true });
    // Notify user and admins (Async)
    createNotification({ 
      userId: doc.userId, 
      title: `Document ${status}`, 
      message: `Your ${doc.type.replace('_', ' ')} certificate request has been ${status}.${status === 'approved' ? ' You can now download it below.' : ''}`, 
      type: 'document', 
      relatedId: doc._id, 
      fileUrl: doc.uploadedFile,
      channels: ['email', 'whatsapp'] 
    }).catch(e => console.error('Doc status notification error:', e.message));

    res.json({ success: true, document: doc });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

module.exports = { getMyDocuments, getAllDocuments, requestDocument, updateDocumentStatus };
