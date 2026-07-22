const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  familyName: { type: String, trim: true },
  dob: { type: Date },
  gender: { type: String, enum: ['male', 'female', 'other'] },
  phone: { type: String, required: true, unique: true, trim: true },
  email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
  address: { type: String },
  subStation: { type: String, trim: true },
  familyRole: { type: String, trim: true },
  familyMembers: [{
    name: { type: String, trim: true },
    role: { type: String, trim: true }
  }],
  parishMemberId: { type: String, unique: true, sparse: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  isVerified: { type: Boolean, default: false },
  otp: { type: String },
  otpExpires: { type: Date },
  profilePhoto: { type: String },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  tokenVersion: { type: Number, default: 0 },
  preferredLanguage: { type: String, enum: ['en', 'ta', 'both'], default: 'en' },
  // WhatsApp Bot preferences — defaults to opted-in for website registrants
  whatsappOptIn: { type: Boolean, default: true },
  botPreferences: {
    type: [{
      type: String,
      enum: ['verse', 'saint', 'mass', 'events', 'announcements', 'birthday']
    }],
    default: ['verse', 'saint', 'mass', 'events', 'announcements', 'birthday']
  },

  // Comprehensive User Settings
  settings: {
    type: Object,
    default: {
      notifications: {
        eventReminders: true,
        massSchedule: true,
        prayerMeetings: true,
        feastDays: true,
        saintOfTheDay: true,
        donationReceipts: true,
        birthdayWishes: true,
        anniversaryWishes: true,
        whatsapp: true,
        email: true,
        push: true
      },
      language: 'en',
      accessibility: {

        fontSize: 'normal',
        highContrast: false,
        reduceAnimations: false,
        screenReader: false
      },
      privacy: {
        visibility: 'members',
        showPhone: true,
        showEmail: true,
        showDob: false,
        showAddress: false
      },
      family: {
        familyHead: '',
        relationship: '',
        requestJoin: ''
      },
      ministries: ['Prayer Group'],
      volunteering: {
        availableDays: ['Sunday'],
        timeOfDay: ['Morning'],
        emergencyVolunteer: false,
        preferredMinistries: []
      },
      prayer: {
        dailyBibleVerse: true,
        saintOfTheDay: true,
        prayerReminder: true,
        rosaryReminder: true,
        massReminder: true
      },
      donations: {
        defaultAmount: 100,
        preferredPaymentMethod: 'UPI',
        recurringDonation: false
      },
      security: {
        twoFactorEnabled: false
      },
      appPreferences: {
        defaultHomePage: 'Dashboard',
        calendarView: 'Month',
        compactMode: false,
        animationsOn: true
      },
      location: {
        enableLocation: true,
        nearestParishSuggestions: true,
        locationBasedEvents: true
      },
      emergencyContact: {
        name: '',
        relationship: '',
        phone: ''
      },
      churchPreferences: {
        preferredParish: 'St. John de Britto Church',
        preferredMassTiming: '7:00 AM',
        preferredLanguage: 'Tamil',
        preferredPriest: ''
      },
      aiSettings: {
        notificationRecommendations: true,
        careerGuidance: false,
        spiritualGrowth: true,
        eventRecommendations: true,
        familyInsights: true,
        prayerSuggestions: true
      },
      adminCommPreferences: {
        receiveAnnouncements: true,
        receiveEmergencyAlerts: true,
        joinBetaFeatures: false,
        autoSyncFamily: true,
        allowStaffContact: true,
        receiveVolunteerRequests: true
      }
    }
  }
}, { timestamps: true });


module.exports = mongoose.model('User', userSchema);
