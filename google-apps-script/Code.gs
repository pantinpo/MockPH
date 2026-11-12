const SHEET_NAME = 'Bookings';
const RESULT_TYPE = 'mockcall-booking-result';
const CATEGORIES = {
  'call-center-bpo': { name: 'Call Center / BPO', basePrice: 100 },
  'admin-executive-assistant': { name: 'Admin / Executive Assistant', basePrice: 125 },
  'hr-recruitment': { name: 'HR / Recruitment', basePrice: 150 },
  'general-qa': { name: 'General QA', basePrice: 150 },
  'finance-accounting': { name: 'Finance / Accounting', basePrice: 175 },
  'workforce-management': { name: 'Workforce Management', basePrice: 200 },
  'reporting-data-analyst': { name: 'Reporting / Data Analyst', basePrice: 225 },
  'business-intelligence-power-bi': { name: 'Business Intelligence / Power BI', basePrice: 250 },
  'team-lead-supervisor': { name: 'Team Lead / Supervisor', basePrice: 250 },
  'software-qa-automation': { name: 'Software QA / Automation', basePrice: 275 },
  'programming-development': { name: 'Programming / Development', basePrice: 300 },
  'operations-manager': { name: 'Operations Manager', basePrice: 300 },
  'senior-management': { name: 'Senior Management', basePrice: 400 },
};
const STAGES = {
  screening: { name: 'Initial Screening', multiplier: 1, fixedPrice: 100 },
  hiringManager: { name: 'Hiring Manager', multiplier: 1.25 },
  technical: { name: 'Technical Interview', multiplier: 1.5 },
  final: { name: 'Final Interview', multiplier: 2 },
};
const HEADERS = [
  'Request ID',
  'Received At',
  'Full Name',
  'Email',
  'Other Contact',
  'Target Role',
  'Company / Industry',
  'Experience Level',
  'Job Category',
  'Interview Stage',
  'Duration (minutes)',
  'Package Price (PHP)',
  'Preferred Date',
  'Preferred Time',
  'Timezone',
  'Notes',
  'Privacy Notice Accepted',
  'Request Status',
];

function doPost(event) {
  let success = false;
  try {
    const rawPayload = event && event.parameter && event.parameter.payload;
    if (!rawPayload || rawPayload.length > 12000) {
      throw new Error('Invalid request payload.');
    }

    const booking = JSON.parse(rawPayload);
    validateBooking_(booking);
    if (booking.honeypot) {
      throw new Error('Invalid request.');
    }

    const category = CATEGORIES[booking.jobCategory];
    const stage = STAGES[booking.interviewStage];
    const expectedPrice = booking.interviewStage === 'screening'
      ? stage.fixedPrice
      : Math.round(category.basePrice * stage.multiplier * 100) / 100;
    if (Number(booking.packagePrice) !== expectedPrice) {
      throw new Error('Package price did not match the configured price.');
    }

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      const spreadsheetId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
      if (!spreadsheetId) {
        throw new Error('Set the SPREADSHEET_ID script property before accepting requests.');
      }

      const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
      const sheet = spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.insertSheet(SHEET_NAME);
      if (sheet.getLastRow() === 0) {
        sheet.appendRow(HEADERS);
        sheet.setFrozenRows(1);
      }
      sheet.appendRow([
        Utilities.getUuid(),
        new Date(),
        safeCell_(booking.fullName),
        safeCell_(booking.email),
        safeCell_(booking.contactValue),
        safeCell_(booking.targetRole),
        safeCell_(booking.companyOrIndustry),
        safeCell_(booking.experienceLevel),
        category.name,
        stage.name,
        30,
        expectedPrice,
        safeCell_(booking.preferredDate),
        safeCell_(booking.preferredTime),
        'Asia/Manila',
        safeCell_(booking.notes),
        true,
        'Request received',
      ]);
    } finally {
      lock.releaseLock();
    }
    success = true;
  } catch (error) {
    console.error(error && error.message ? error.message : 'Booking request could not be saved.');
  }
  return response_(success);
}

function validateBooking_(booking) {
  if (!booking || typeof booking !== 'object') {
    throw new Error('Invalid booking.');
  }

  const requiredText = ['fullName', 'targetRole', 'preferredDate', 'preferredTime'];
  requiredText.forEach(function (key) {
    if (typeof booking[key] !== 'string' || !booking[key].trim()) {
      throw new Error('A required booking field is missing.');
    }
  });
  if (typeof booking.email !== 'string' || typeof booking.contactValue !== 'string' ||
      (!booking.email.trim() && !booking.contactValue.trim())) {
    throw new Error('A valid contact method is required.');
  }
  if (booking.fullName.length > 120 || booking.email.length > 254 ||
      booking.contactValue.length > 200 || booking.targetRole.length > 160 ||
      String(booking.companyOrIndustry || '').length > 160) {
    throw new Error('A booking field is too long.');
  }
  if (booking.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(booking.email.trim())) {
    throw new Error('Invalid email address.');
  }
  if (!CATEGORIES[booking.jobCategory] || !STAGES[booking.interviewStage]) {
    throw new Error('Unknown package selection.');
  }
  if (booking.durationMinutes !== 30 || booking.timezone !== 'Asia/Manila') {
    throw new Error('Unsupported duration or timezone.');
  }
  if (booking.privacyNoticeAccepted !== true) {
    throw new Error('Privacy notice acceptance is required.');
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(booking.preferredDate) ||
      !/^\d{2}:\d{2}$/.test(booking.preferredTime)) {
    throw new Error('Invalid preferred schedule.');
  }
  if (typeof booking.notes !== 'string' || booking.notes.length > 700) {
    throw new Error('The note is too long.');
  }
  if (!['first', 'some', 'experienced'].includes(booking.experienceLevel)) {
    throw new Error('Invalid interview experience level.');
  }
}

function safeCell_(value) {
  const text = String(value || '').trim();
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function response_(ok) {
  const message = JSON.stringify({ type: RESULT_TYPE, ok: ok });
  return HtmlService.createHtmlOutput(
    '<!doctype html><meta charset="utf-8"><script>window.parent.postMessage(' +
      message +
      ', "*");</script>',
  ).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
