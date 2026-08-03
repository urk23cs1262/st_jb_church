const fs = require('fs');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const Booking = require('../models/Booking');
const Donation = require('../models/Donation');
const PrayerRequest = require('../models/PrayerRequest');
const Ticket = require('../models/Ticket');

// GET /api/users — admin
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role } = req.query;
    const query = {};
    if (search) query.$or = [{ name: new RegExp(search, 'i') }, { phone: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }];
    if (role) query.role = role;
    const total = await User.countDocuments(query);
    const users = await User.find(query).select('-passwordHash -otp -otpExpires').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit));
    res.json({ success: true, total, page: Number(page), users });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// GET /api/users/:id — admin or self
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-passwordHash -otp -otpExpires');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// PUT /api/users/profile — self
const updateProfile = async (req, res) => {
  try {
    let { 
      name, familyName, dob, gender, address, email, phone,
      preferredLanguage, subStation, familyRole, familyMembers, settings 
    } = req.body;
    
    if (email === "") email = undefined;
    if (gender === "" || gender === null) gender = undefined;

    // Parse familyMembers if sent as a JSON string from FormData
    if (typeof familyMembers === 'string') {
      try {
        familyMembers = JSON.parse(familyMembers);
      } catch (e) {
        console.error('Error parsing familyMembers:', e);
        familyMembers = [];
      }
    }

    if (typeof settings === 'string') {
      try {
        settings = JSON.parse(settings);
      } catch (e) {
        console.error('Error parsing settings:', e);
      }
    }

    const updateData = { 
      name, familyName, dob, gender, address, email, 
      preferredLanguage, subStation, familyRole, 
      familyMembers: Array.isArray(familyMembers) ? familyMembers : [] 
    };

    if (phone && phone.trim()) {
      phone = phone.trim();
      const phoneExists = await User.findOne({ phone, _id: { $ne: req.user._id } });
      if (phoneExists) {
        return res.status(409).json({ success: false, message: 'This phone number is already registered with another account.' });
      }
      updateData.phone = phone;
    }

    if (settings) updateData.settings = settings;

    if (req.body.removeProfilePhoto === 'true' || req.body.profilePhoto === '') {
      updateData.profilePhoto = '';
    } else if (req.file) {
      try {
        const fileBuffer = fs.readFileSync(req.file.path);
        const mime = req.file.mimetype || 'image/jpeg';
        updateData.profilePhoto = `data:${mime};base64,${fileBuffer.toString('base64')}`;
        try { fs.unlinkSync(req.file.path); } catch (e) {}
      } catch (e) {
        console.error('Error converting photo to base64:', e.message);
        updateData.profilePhoto = `/uploads/profiles/${req.file.filename}`;
      }
    }
    
    const user = await User.findByIdAndUpdate(req.user._id, updateData, { new: true }).select('-passwordHash -otp -otpExpires');
    res.json({ success: true, user });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// PUT /api/users/:id — admin
const updateUser = async (req, res) => {
  try {
    const { role, isActive, isVerified, name, email, phone, parishMemberId, gender, dob, address, subStation, familyName } = req.body;
    const updateData = { role, isActive, isVerified };
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email === "" ? undefined : email;
    if (phone !== undefined) updateData.phone = phone;
    if (parishMemberId !== undefined) updateData.parishMemberId = parishMemberId;
    if (gender !== undefined) updateData.gender = (gender === "" || gender === null) ? undefined : gender;
    if (dob !== undefined) updateData.dob = dob;
    if (address !== undefined) updateData.address = address;
    if (subStation !== undefined) updateData.subStation = subStation;
    if (familyName !== undefined) updateData.familyName = familyName;
    
    const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true }).select('-passwordHash');
    res.json({ success: true, user });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// DELETE /api/users/:id — admin
const deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// PUT /api/users/change-password — self
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    const match = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!match) return res.status(400).json({ success: false, message: 'Current password incorrect' });
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await User.findByIdAndUpdate(req.user._id, { passwordHash });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// PUT /api/users/settings — self

const updateSettings = async (req, res) => {
  try {
    const { settings } = req.body;
    if (!settings) {
      return res.status(400).json({ success: false, message: 'Settings payload is required' });
    }
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { settings } },
      { new: true }
    ).select('-passwordHash -otp -otpExpires');

    res.json({ success: true, message: 'Settings saved successfully', user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/users/:id/pdf — Option 1: Individual User Details PDF Report
const getUserPdfReport = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-passwordHash -otp -otpExpires');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Authorization check
    if (req.user.role !== 'admin' && req.user._id.toString() !== user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Aggregate statistics
    const massBookingsCount = await Booking.countDocuments({ userId: user._id });
    const donationStats = await Donation.aggregate([
      { $match: { userId: user._id } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const donationsTotal = donationStats[0]?.total || 0;
    const prayerRequestsCount = await PrayerRequest.countDocuments({ userId: user._id });
    const ticketsCount = await Ticket.countDocuments({ userId: user._id });

    // Generate secure QR code containing web report URL with token (no raw personal data inside QR image)
    const jwt = require('jsonwebtoken');
    const secureToken = jwt.sign(
      { userId: user._id, type: 'member_report' },
      process.env.JWT_SECRET || 'sjdb_secret_key_2024',
      { expiresIn: '30d' }
    );

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const qrReportWebUrl = `${clientUrl}/member-report/${secureToken}`;

    const qrDataUrl = await QRCode.toDataURL(qrReportWebUrl);
    const qrImageBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');

    const doc = new PDFDocument({ margin: 36, size: 'A4', bufferPages: true });

    const safeName = (user.name || 'User').replace(/[^a-zA-Z0-9_-]/g, '_');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=User_${safeName}_Report.pdf`);

    doc.pipe(res);

    const pageWidth = 595.28;
    const margin = 36;
    const contentWidth = pageWidth - margin * 2; // 523.28

    // --- Header Section ---
    doc.rect(margin, 36, contentWidth, 5).fill('#1e3a8a');

    // Title & Subtitle (Left aligned with high contrast)
    doc.fillColor('#1e3a8a').fontSize(22).font('Helvetica-Bold').text("St. John de Britto's Church", margin, 48, { width: contentWidth - 95, align: 'left' });
    doc.fillColor('#b45309').fontSize(10).font('Helvetica-Bold').text("Kalayarkoil, Sivagangai District, Tamil Nadu - 630551", margin, 74, { width: contentWidth - 95, align: 'left' });

    // QR Code on top right inside frame
    doc.rect(pageWidth - margin - 75, 46, 75, 75).fillAndStroke('#f8fafc', '#cbd5e1');
    doc.image(qrImageBuffer, pageWidth - margin - 71, 50, { width: 67, height: 67 });

    // Document Subtitle & Timestamp
    doc.fillColor('#0f172a').fontSize(13).font('Helvetica-Bold').text("MEMBER PROFILE & ACTIVITY REPORT", margin, 92);
    doc.fillColor('#64748b').fontSize(8.5).font('Helvetica').text(`Generated On: ${new Date().toLocaleString('en-GB')}`, margin, 108);

    // Divider Line
    doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(margin, 124).lineTo(pageWidth - margin, 124).stroke();

    let curY = 136;

    // Helper: Draw Section Title Box
    const drawSectionHeader = (title) => {
      doc.rect(margin, curY, contentWidth, 20).fill('#f1f5f9');
      doc.rect(margin, curY, 4, 20).fill('#1e3a8a');
      doc.fillColor('#1e3a8a').fontSize(10).font('Helvetica-Bold').text(title, margin + 12, curY + 5);
      curY += 26;
    };

    // Helper: Draw Single Key-Value Row (One by One for Full Visibility)
    const renderFieldLine = (label, value, isHighlight = false) => {
      const labelX = margin + 12;
      const valX = margin + 175;
      const maxValWidth = contentWidth - 187;

      doc.fillColor('#475569').fontSize(9.5).font('Helvetica-Bold').text(label, labelX, curY, { width: 155 });

      const displayVal = (value !== undefined && value !== null && String(value).trim() !== '') ? String(value) : 'N/A';
      
      if (isHighlight) {
        doc.fillColor('#1e3a8a').fontSize(9.5).font('Helvetica-Bold').text(displayVal, valX, curY, { width: maxValWidth });
      } else {
        doc.fillColor('#0f172a').fontSize(9.5).font('Helvetica').text(displayVal, valX, curY, { width: maxValWidth });
      }

      const textHeight = doc.heightOfString(displayVal, { width: maxValWidth });
      curY += Math.max(16, textHeight + 4);
    };

    // 1. PERSONAL INFORMATION
    drawSectionHeader('PERSONAL INFORMATION');

    const formattedDob = user.dob ? new Date(user.dob).toLocaleDateString('en-GB') : 'N/A';
    const formattedRegDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-GB') : 'N/A';
    const formattedLastLogin = user.lastLogin ? new Date(user.lastLogin).toLocaleString('en-GB') : (user.lastSuccessfulLogin ? new Date(user.lastSuccessfulLogin).toLocaleString('en-GB') : 'Never');

    renderFieldLine('Full Name:', user.name);
    renderFieldLine('Parish Member ID:', user.parishMemberId || 'N/A', true);
    renderFieldLine('Phone Number:', user.phone);
    renderFieldLine('Email Address:', user.email);
    renderFieldLine('Date of Birth:', formattedDob);
    renderFieldLine('Gender:', user.gender ? user.gender.charAt(0).toUpperCase() + user.gender.slice(1) : 'Not Specified');
    renderFieldLine('Residential Address:', user.address);
    renderFieldLine('Registration Date:', formattedRegDate);
    renderFieldLine('Last Login:', formattedLastLogin);

    curY += 6;

    // 2. ACCOUNT & SECURITY INFORMATION
    drawSectionHeader('ACCOUNT & MEMBERSHIP INFORMATION');

    const statusText = user.isSuspended ? 'Suspended (Security Review)' : (user.isActive ? 'Active' : 'Inactive');

    renderFieldLine('User ID:', user._id.toString());
    renderFieldLine('System Role:', (user.role || 'user').toUpperCase());
    renderFieldLine('Account Status:', statusText);
    renderFieldLine('Email Verified:', user.isVerified ? 'Yes' : 'No');
    renderFieldLine('WhatsApp Opt-In:', user.whatsappOptIn !== false ? 'Yes' : 'No');

    curY += 6;

    // 3. CHURCH & FAMILY INFORMATION
    drawSectionHeader('CHURCH & FAMILY INFORMATION');

    renderFieldLine('Primary Parish:', "St. John de Britto's Church");
    renderFieldLine('Sub-Station:', user.subStation || 'Kalayarkoil (Main Parish)');
    renderFieldLine('Family Name:', user.familyName);
    renderFieldLine('Role in Family:', user.familyRole);

    if (user.familyMembers && user.familyMembers.length > 0) {
      const famList = user.familyMembers.map(m => `${m.name} (${m.role})`).join(', ');
      renderFieldLine('Family Members:', famList);
    } else {
      renderFieldLine('Family Members:', 'None registered');
    }

    curY += 6;

    // 4. ACTIVITY & METRICS SUMMARY (4 Metrics Cards Grid)
    drawSectionHeader('ACTIVITY & STATISTICS SUMMARY');

    const cardWidth = (contentWidth - 30) / 4; // ~123px per card
    const cardHeight = 46;
    const cardY = curY;

    const metrics = [
      { label: 'Mass Bookings', val: `${massBookingsCount}`, color: '#2563eb' },
      { label: 'Total Donations', val: `Rs. ${donationsTotal.toLocaleString('en-IN')}`, color: '#16a34a' },
      { label: 'Prayer Requests', val: `${prayerRequestsCount}`, color: '#d97706' },
      { label: 'Support Tickets', val: `${ticketsCount}`, color: '#9333ea' }
    ];

    metrics.forEach((m, idx) => {
      const cardX = margin + idx * (cardWidth + 10);
      doc.rect(cardX, cardY, cardWidth, cardHeight).fillAndStroke('#f8fafc', '#cbd5e1');
      doc.rect(cardX, cardY, cardWidth, 3).fill(m.color);

      doc.fillColor('#64748b').fontSize(8).font('Helvetica-Bold').text(m.label, cardX + 4, cardY + 8, { width: cardWidth - 8, align: 'center' });
      doc.fillColor(m.color).fontSize(12).font('Helvetica-Bold').text(m.val, cardX + 4, cardY + 22, { width: cardWidth - 8, align: 'center' });
    });

    curY += cardHeight + 10;

    // 5. EMERGENCY CONTACT (if present)
    if (user.settings?.emergencyContact?.name) {
      drawSectionHeader('EMERGENCY CONTACT');
      renderFieldLine('Contact Name:', user.settings.emergencyContact.name);
      renderFieldLine('Relationship:', user.settings.emergencyContact.relationship);
      renderFieldLine('Emergency Phone:', user.settings.emergencyContact.phone);
      curY += 4;
    }

    // --- Footer Page Numbers ---
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      doc.strokeColor('#cbd5e1').lineWidth(0.5).moveTo(margin, 765).lineTo(pageWidth - margin, 765).stroke();
      doc.fillColor('#64748b').fontSize(8.5).font('Helvetica').text(
        `St. John de Britto's Church, Kalayarkoil — Official Member Record | Page ${i + 1} of ${range.count}`,
        margin,
        774,
        { align: 'center', width: contentWidth }
      );
    }

    doc.end();
  } catch (err) {
    console.error('Error generating user PDF report:', err);
    res.status(500).json({ success: false, message: 'Failed to generate user PDF report: ' + err.message });
  }
};

// GET /api/users/export/pdf — Option 2: Export All Users PDF Report
const getAllUsersPdfReport = async (req, res) => {
  try {
    const users = await User.find({}).select('-passwordHash -otp -otpExpires').sort({ createdAt: -1 });

    const doc = new PDFDocument({ margin: 30, size: 'A4', bufferPages: true });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=All_Users_Report_${Date.now()}.pdf`);

    doc.pipe(res);

    const pageWidth = 595.28;
    const margin = 30;
    const contentWidth = pageWidth - margin * 2;

    // Header Accent Bar
    doc.rect(margin, 30, contentWidth, 5).fill('#1e3a8a');

    // Title / Header Banner
    doc.fillColor('#1e3a8a').fontSize(20).font('Helvetica-Bold').text("St. John de Britto's Church", margin, 42, { align: 'center', width: contentWidth });
    doc.fillColor('#b45309').fontSize(10).font('Helvetica-Bold').text("Kalayarkoil — All Registered Members Master Report", margin, 66, { align: 'center', width: contentWidth });
    doc.fillColor('#64748b').fontSize(8.5).font('Helvetica').text(`Total Members: ${users.length} | Generated On: ${new Date().toLocaleString('en-GB')}`, margin, 80, { align: 'center', width: contentWidth });

    doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(margin, 95).lineTo(pageWidth - margin, 95).stroke();

    // Table Header
    const drawTableHeader = (y) => {
      doc.rect(margin, y, contentWidth, 22).fill('#1e3a8a');
      doc.fillColor('#ffffff').fontSize(8.5).font('Helvetica-Bold');
      doc.text('#', margin + 5, y + 6, { width: 25 });
      doc.text('Name', margin + 30, y + 6, { width: 110 });
      doc.text('Phone', margin + 145, y + 6, { width: 85 });
      doc.text('Email / ID', margin + 235, y + 6, { width: 120 });
      doc.text('Sub-Station', margin + 360, y + 6, { width: 85 });
      doc.text('Role', margin + 450, y + 6, { width: 40 });
      doc.text('Status', margin + 495, y + 6, { width: 40 });
    };

    let currentY = 105;
    drawTableHeader(currentY);
    currentY += 24;

    users.forEach((u, idx) => {
      if (currentY > 750) {
        doc.addPage();
        currentY = 36;
        drawTableHeader(currentY);
        currentY += 24;
      }

      const bgColor = idx % 2 === 0 ? '#f8fafc' : '#ffffff';
      doc.rect(margin, currentY, contentWidth, 20).fill(bgColor);

      doc.fillColor('#475569').fontSize(8).font('Helvetica');
      doc.text(String(idx + 1), margin + 5, currentY + 5, { width: 25 });
      doc.fillColor('#0f172a').font('Helvetica-Bold');
      doc.text(u.name || 'N/A', margin + 30, currentY + 5, { width: 110, height: 12, ellipsis: true });
      doc.fillColor('#334155').font('Helvetica');
      doc.text(u.phone || 'N/A', margin + 145, currentY + 5, { width: 85 });
      doc.text(u.email || u.parishMemberId || '—', margin + 235, currentY + 5, { width: 120, height: 12, ellipsis: true });
      doc.text(u.subStation || 'Main Parish', margin + 360, currentY + 5, { width: 85, height: 12, ellipsis: true });

      doc.fillColor(u.role === 'admin' ? '#dc2626' : '#2563eb').font('Helvetica-Bold');
      doc.text(u.role?.toUpperCase() || 'USER', margin + 450, currentY + 5, { width: 40 });

      const statusText = u.isSuspended ? 'Suspended' : (u.isActive ? 'Active' : 'Inactive');
      const statusColor = u.isSuspended ? '#dc2626' : (u.isActive ? '#16a34a' : '#64748b');
      doc.fillColor(statusColor).font('Helvetica-Bold');
      doc.text(statusText, margin + 495, currentY + 5, { width: 40 });

      currentY += 21;
    });

    // Page Numbers
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      doc.strokeColor('#e2e8f0').lineWidth(0.5).moveTo(margin, 775).lineTo(pageWidth - margin, 775).stroke();
      doc.fillColor('#64748b').fontSize(8.5).font('Helvetica').text(
        `St. John de Britto's Church, Kalayarkoil — All Registered Members Master Report | Page ${i + 1} of ${range.count}`,
        margin,
        782,
        { align: 'center', width: contentWidth }
      );
    }

    doc.end();
  } catch (err) {
    console.error('Error generating all users PDF report:', err);
    res.status(500).json({ success: false, message: 'Failed to generate all users PDF report: ' + err.message });
  }
};

// GET /api/users/member-id-format — admin
const getMemberIdFormatInfo = async (req, res) => {
  try {
    const { getMemberIdFormat } = require('../services/memberIdService');
    const info = getMemberIdFormat();
    res.json({ success: true, ...info });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/users/update-member-id-format — admin
const updateMemberIdFormat = async (req, res) => {
  try {
    const { regenerateAllMemberIds } = require('../services/memberIdService');
    const { prefix, padLength } = req.body;
    if (!prefix || !prefix.trim()) {
      return res.status(400).json({ success: false, message: 'Member ID prefix is required (e.g. SJDB_M)' });
    }
    const result = await regenerateAllMemberIds(prefix, padLength || 2);
    res.json({ success: true, message: `Successfully updated format to "${result.newFormat}" for all users`, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/users/lookup/scan?code=... — admin / lookup
const lookupUserByQr = async (req, res) => {
  try {
    const raw = req.query.code || '';
    if (!raw || !raw.trim()) {
      return res.status(400).json({ success: false, message: 'Scan code or text is required' });
    }

    const cleanRaw = raw.trim();
    let user = null;

    // 1. Try matching Member ID in text (e.g. SJDB_M03 or Member ID: SJDB_M03)
    const memberIdMatch = cleanRaw.match(/[A-Za-z0-9_]+_M\d+/i) || cleanRaw.match(/Member ID:\s*([^\s\n]+)/i);
    if (memberIdMatch) {
      const targetId = memberIdMatch[1] || memberIdMatch[0];
      user = await User.findOne({ parishMemberId: new RegExp(`^${targetId}$`, 'i') });
    }

    // 2. Try matching MongoDB ObjectId (24 hex chars)
    if (!user) {
      const mongoIdMatch = cleanRaw.match(/[a-fA-F0-9]{24}/);
      if (mongoIdMatch) {
        user = await User.findById(mongoIdMatch[0]);
      }
    }

    // 3. Try exact/case-insensitive search by parishMemberId, email, phone, or name
    if (!user) {
      user = await User.findOne({
        $or: [
          { parishMemberId: new RegExp(`^${cleanRaw}$`, 'i') },
          { email: cleanRaw.toLowerCase() },
          { phone: cleanRaw },
          { name: new RegExp(cleanRaw, 'i') }
        ]
      });
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'No member found matching scanned code/ID.' });
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const pdfReportUrl = `${baseUrl}/api/users/${user._id}/pdf`;

    res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        parishMemberId: user.parishMemberId || 'N/A',
        phone: user.phone || 'N/A',
        email: user.email || 'N/A',
        dob: user.dob ? new Date(user.dob).toLocaleDateString('en-GB') : 'N/A',
        gender: user.gender ? user.gender.charAt(0).toUpperCase() + user.gender.slice(1) : 'Not Specified',
        address: user.address || 'N/A',
        role: (user.role || 'user').toUpperCase(),
        isActive: user.isActive,
        isSuspended: user.isSuspended,
        statusText: user.isSuspended ? 'Suspended' : (user.isActive ? 'Active' : 'Inactive'),
        createdAt: user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-GB') : 'N/A',
        lastLogin: user.lastLogin ? new Date(user.lastLogin).toLocaleString('en-GB') : 'Never',
        pdfReportUrl
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lookup failed: ' + err.message });
  }
};

// GET /api/users/member-report/:token — Secure QR Scan Web Verification
const getMemberReportByToken = async (req, res) => {
  try {
    const { token } = req.params;
    if (!token || !token.trim()) {
      return res.status(400).json({ success: false, message: 'Report token is required' });
    }

    const jwt = require('jsonwebtoken');
    let decoded;
    try {
      decoded = jwt.verify(token.trim(), process.env.JWT_SECRET || 'sjdb_secret_key_2024');
    } catch (err) {
      return res.status(401).json({
        success: false,
        tokenExpired: true,
        message: 'Invalid or expired member report link. Please request an updated report.'
      });
    }

    if (decoded.type !== 'member_report' || !decoded.userId) {
      return res.status(400).json({ success: false, message: 'Invalid report token payload' });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Member record not found in system' });
    }

    // Security & Access Control Check
    if (!req.user) {
      return res.status(401).json({
        success: false,
        requireLogin: true,
        message: 'Authentication required. Please log in with an authorized Parish account to access member records.'
      });
    }

    const userRole = (req.user.role || '').toLowerCase();
    const isAdminOrStaff = ['admin', 'priest', 'staff'].includes(userRole);
    const isSelf = req.user._id.toString() === user._id.toString();

    if (!isAdminOrStaff && !isSelf) {
      return res.status(403).json({
        success: false,
        accessDenied: true,
        message: 'Access restricted. Only authorized parish administrators or the member themselves can view this report.'
      });
    }

    const pdfUrl = `/api/users/${user._id}/pdf`;
    const tokenPdfUrl = `/api/users/member-report/${token}/pdf`;

    res.json({
      success: true,
      member: {
        _id: user._id,
        name: user.name || 'N/A',
        parishMemberId: user.parishMemberId || 'N/A',
        phone: user.phone || 'N/A',
        email: user.email || 'N/A',
        familyName: user.familyName || 'N/A',
        roleInFamily: user.roleInFamily || 'N/A',
        dob: user.dob ? new Date(user.dob).toLocaleDateString('en-GB') : 'N/A',
        gender: user.gender ? user.gender.charAt(0).toUpperCase() + user.gender.slice(1) : 'Not Specified',
        address: user.address || 'N/A',
        subStation: user.subStation || 'Kalayarkoil (Main Parish)',
        role: (user.role || 'user').toUpperCase(),
        isActive: user.isActive,
        isSuspended: user.isSuspended,
        statusText: user.isSuspended ? 'Suspended' : (user.isActive ? 'Active' : 'Inactive'),
        createdAt: user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-GB') : 'N/A',
        lastLogin: user.lastLogin ? new Date(user.lastLogin).toLocaleString('en-GB') : 'Never'
      },
      pdfUrl,
      tokenPdfUrl
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Report lookup error: ' + err.message });
  }
};

// GET /api/users/member-report/:token/pdf — Direct PDF Download Stream for Scanned Devices
const getMemberReportPdfByToken = async (req, res) => {
  try {
    const { token } = req.params;
    if (!token || !token.trim()) {
      return res.status(400).json({ success: false, message: 'Report token is required' });
    }

    const jwt = require('jsonwebtoken');
    let decoded;
    try {
      decoded = jwt.verify(token.trim(), process.env.JWT_SECRET || 'sjdb_secret_key_2024');
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Invalid or expired member report link.' });
    }

    if (decoded.type !== 'member_report' || !decoded.userId) {
      return res.status(400).json({ success: false, message: 'Invalid report token payload' });
    }

    const user = await User.findById(decoded.userId).select('-passwordHash -otp -otpExpires');
    if (!user) {
      return res.status(404).json({ success: false, message: 'Member record not found' });
    }

    // Security Check
    if (req.user) {
      const userRole = (req.user.role || '').toLowerCase();
      const isAdminOrStaff = ['admin', 'priest', 'staff'].includes(userRole);
      const isSelf = req.user._id.toString() === user._id.toString();
      if (!isAdminOrStaff && !isSelf) {
        return res.status(403).json({ success: false, message: 'Access restricted.' });
      }
    }

    // Generate PDF stream directly for browser attachment download
    const PDFDocument = require('pdfkit');
    const QRCode = require('qrcode');
    const Booking = require('../models/Booking');
    const Donation = require('../models/Donation');
    const PrayerRequest = require('../models/PrayerRequest');
    const Ticket = require('../models/Ticket');

    const secureToken = jwt.sign(
      { userId: user._id, type: 'member_report' },
      process.env.JWT_SECRET || 'sjdb_secret_key_2024',
      { expiresIn: '30d' }
    );
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const qrReportWebUrl = `${clientUrl}/member-report/${secureToken}`;

    const qrDataUrl = await QRCode.toDataURL(qrReportWebUrl);
    const qrImageBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');

    const doc = new PDFDocument({ margin: 36, size: 'A4', bufferPages: true });
    const safeName = (user.name || 'User').replace(/[^a-zA-Z0-9_-]/g, '_');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=User_${safeName}_Report.pdf`);

    doc.pipe(res);

    const pageWidth = 595.28;
    const margin = 36;
    const contentWidth = pageWidth - margin * 2;

    doc.rect(margin, 36, contentWidth, 5).fill('#1e3a8a');
    doc.fillColor('#1e3a8a').fontSize(22).font('Helvetica-Bold').text("St. John de Britto's Church", margin, 48, { width: contentWidth - 95, align: 'left' });
    doc.fillColor('#b45309').fontSize(10).font('Helvetica-Bold').text("Kalayarkoil, Sivagangai District, Tamil Nadu - 630551", margin, 74, { width: contentWidth - 95, align: 'left' });

    doc.rect(pageWidth - margin - 75, 46, 75, 75).fillAndStroke('#f8fafc', '#cbd5e1');
    doc.image(qrImageBuffer, pageWidth - margin - 71, 50, { width: 67, height: 67 });

    doc.fillColor('#0f172a').fontSize(13).font('Helvetica-Bold').text("MEMBER PROFILE & ACTIVITY REPORT", margin, 92);
    doc.fillColor('#64748b').fontSize(8.5).font('Helvetica').text(`Generated On: ${new Date().toLocaleString('en-GB')}`, margin, 108);

    doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(margin, 124).lineTo(pageWidth - margin, 124).stroke();

    let curY = 136;
    const drawSectionHeader = (title) => {
      doc.rect(margin, curY, contentWidth, 20).fill('#f1f5f9');
      doc.rect(margin, curY, 4, 20).fill('#1e3a8a');
      doc.fillColor('#1e3a8a').fontSize(10).font('Helvetica-Bold').text(title, margin + 12, curY + 5);
      curY += 26;
    };

    const renderFieldLine = (label, value, isHighlight = false) => {
      const labelX = margin + 12;
      const valX = margin + 175;
      const maxValWidth = contentWidth - 187;
      doc.fillColor('#475569').fontSize(9.5).font('Helvetica-Bold').text(label, labelX, curY, { width: 155 });
      const displayVal = (value !== undefined && value !== null && String(value).trim() !== '') ? String(value) : 'N/A';
      if (isHighlight) {
        doc.fillColor('#1e3a8a').fontSize(9.5).font('Helvetica-Bold').text(displayVal, valX, curY, { width: maxValWidth });
      } else {
        doc.fillColor('#0f172a').fontSize(9.5).font('Helvetica').text(displayVal, valX, curY, { width: maxValWidth });
      }
      const textHeight = doc.heightOfString(displayVal, { width: maxValWidth });
      curY += Math.max(16, textHeight + 4);
    };

    drawSectionHeader('PERSONAL INFORMATION');
    renderFieldLine('Full Name:', user.name);
    renderFieldLine('Parish Member ID:', user.parishMemberId || 'N/A', true);
    renderFieldLine('Phone Number:', user.phone);
    renderFieldLine('Email Address:', user.email);
    renderFieldLine('Date of Birth:', user.dob ? new Date(user.dob).toLocaleDateString('en-GB') : 'N/A');
    renderFieldLine('Gender:', user.gender ? user.gender.charAt(0).toUpperCase() + user.gender.slice(1) : 'Not Specified');
    renderFieldLine('Residential Address:', user.address);
    renderFieldLine('Registration Date:', user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-GB') : 'N/A');

    curY += 6;
    drawSectionHeader('ACCOUNT & MEMBERSHIP INFORMATION');
    renderFieldLine('User ID:', user._id.toString());
    renderFieldLine('System Role:', (user.role || 'user').toUpperCase());
    renderFieldLine('Account Status:', user.isSuspended ? 'Suspended' : (user.isActive ? 'Active' : 'Inactive'));

    doc.end();
  } catch (err) {
    res.status(500).json({ success: false, message: 'PDF Download error: ' + err.message });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateProfile,
  updateUser,
  deleteUser,
  changePassword,
  updateSettings,
  getUserPdfReport,
  getAllUsersPdfReport,
  getMemberIdFormatInfo,
  updateMemberIdFormat,
  lookupUserByQr,
  getMemberReportByToken,
  getMemberReportPdfByToken
};

