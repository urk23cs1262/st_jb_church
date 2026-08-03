const User = require('../models/User');
const fs = require('fs');
const path = require('path');

const CONFIG_FILE = path.join(__dirname, '../config/memberIdConfig.json');

// Default configuration
let config = {
  prefix: 'SJDB_M',
  padLength: 2
};

// Load config from file if exists
function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, 'utf8');
      config = { ...config, ...JSON.parse(data) };
    }
  } catch (err) {
    console.error('Error loading member ID config:', err.message);
  }
  return config;
}

// Save config to file
function saveConfig(newConfig) {
  try {
    config = { ...config, ...newConfig };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving member ID config:', err.message);
  }
}

// Get current format metadata
function getMemberIdFormat() {
  loadConfig();
  return {
    prefix: config.prefix || 'SJDB_M',
    padLength: config.padLength || 2,
    sample: formatMemberId(1, config.prefix, config.padLength)
  };
}

// Helper to format a number into member ID string
function formatMemberId(num, prefix = config.prefix, padLength = config.padLength) {
  const padded = String(num).padStart(padLength, '0');
  return `${prefix}${padded}`;
}

/**
 * Generates the next sequential Parish Member ID
 */
async function generateNextMemberId() {
  loadConfig();
  const prefix = config.prefix || 'SJDB_M';
  const padLength = config.padLength || 2;

  // Escape special regex characters in prefix
  const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`^${escapedPrefix}(\\d+)$`, 'i');

  const users = await User.find({ parishMemberId: { $exists: true, $ne: null } })
    .select('parishMemberId')
    .lean();

  let maxNum = 0;
  users.forEach(u => {
    if (u.parishMemberId) {
      const match = u.parishMemberId.match(regex);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }
  });

  const nextNum = maxNum + 1;
  return formatMemberId(nextNum, prefix, padLength);
}

/**
 * Automatically assigns unique sequential member IDs to any users missing one or having duplicates
 */
async function autoAssignMemberIds() {
  loadConfig();
  try {
    const allUsers = await User.find({}).sort({ createdAt: 1 });
    const seenIds = new Set();
    let num = 1;
    let updatedCount = 0;

    for (const u of allUsers) {
      const currentId = (u.parishMemberId || '').trim();
      if (!currentId || seenIds.has(currentId.toUpperCase())) {
        let newId = formatMemberId(num, config.prefix, config.padLength);
        while (seenIds.has(newId.toUpperCase())) {
          num++;
          newId = formatMemberId(num, config.prefix, config.padLength);
        }
        const updateObj = { parishMemberId: newId };
        const unsetObj = {};
        if (u.gender === '') unsetObj.gender = 1;
        if (u.email === '') unsetObj.email = 1;

        await User.updateOne(
          { _id: u._id },
          { 
            $set: updateObj, 
            ...(Object.keys(unsetObj).length > 0 ? { $unset: unsetObj } : {}) 
          }
        );

        u.parishMemberId = newId;
        seenIds.add(newId.toUpperCase());
        updatedCount++;
        num++;
      } else {
        seenIds.add(currentId.toUpperCase());
      }
    }

    if (updatedCount > 0) {
      console.log(`✅ Auto-assigned unique Parish Member IDs for ${updatedCount} users`);
    } else {
      console.log('✅ All users already have unique Parish Member IDs');
    }
  } catch (err) {
    console.error('❌ Error auto-assigning member IDs:', err.message);
  }
}

/**
 * Regenerates Member IDs for ALL existing users with new prefix and padding format
 */
async function regenerateAllMemberIds(newPrefix, newPadLength = 2) {
  const prefix = (newPrefix || 'SJDB_M').trim();
  const padLength = parseInt(newPadLength, 10) || 2;

  // Save new format configuration
  saveConfig({ prefix, padLength });

  const allUsers = await User.find({}).sort({ createdAt: 1 });
  let num = 1;
  const updatedUsers = [];

  for (const u of allUsers) {
    const newMemberId = formatMemberId(num, prefix, padLength);
    
    const updateObj = { parishMemberId: newMemberId };
    const unsetObj = {};
    if (u.gender === '') unsetObj.gender = 1;
    if (u.email === '') unsetObj.email = 1;

    await User.updateOne(
      { _id: u._id },
      { 
        $set: updateObj, 
        ...(Object.keys(unsetObj).length > 0 ? { $unset: unsetObj } : {}) 
      }
    );

    updatedUsers.push({ id: u._id, name: u.name, parishMemberId: newMemberId });
    num++;
  }

  console.log(`✅ Successfully regenerated Member IDs for all ${allUsers.length} users with format "${prefix}"`);
  return {
    success: true,
    totalUpdated: allUsers.length,
    newFormat: `${prefix}${String(1).padStart(padLength, '0')}`,
    updatedUsers
  };
}

module.exports = {
  getMemberIdFormat,
  generateNextMemberId,
  autoAssignMemberIds,
  regenerateAllMemberIds
};
