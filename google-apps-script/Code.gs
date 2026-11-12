const SHEET_NAME = 'Bookings';
const RESULT_TYPE = 'mockcall-booking-result';
const CATEGORIES = {
  'call-center-bpo': 'Call Center / BPO',
  'admin-executive-assistant': 'Admin / Executive Assistant',
  'hr-recruitment': 'HR / Recruitment',
  'general-qa': 'General QA',
  'finance-accounting': 'Finance / Accounting',
  'workforce-management': 'Workforce Management',
  'reporting-data-analyst': 'Reporting / Data Analyst',
  'business-intelligence-power-bi': 'Business Intelligence / Power BI',
  'team-lead-supervisor': 'Team Lead / Supervisor',
  'software-qa-automation': 'Software QA / Automation',
  'programming-development': 'Programming / Development',
  'operations-manager': 'Operations Manager',
  'senior-management': 'Senior Management',
};
const STAGES = {
  screening: { name: 'Initial Screening', duration: 15, price: 100 },
  hiringManager: { name: 'Hiring Manager Interview', duration: 30, price: 150 },
  technical: { name: 'Technical Interview', durations: [30, 45], prices: { 30: 200, 45: 220 } },
  final: { name: 'Final Interview', duration: 45, price: 250 },
};
const BUNDLES = {
  corporate: { name: 'Corporate Track', stages: ['screening', 'hiringManager'], price: 220 },
  executive: { name: 'Executive Track', stages: ['screening', 'hiringManager', 'technical', 'final'], price: 500 },
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
  'Package Type',
  'Package',
  'Interview Stages',
  'Duration (minutes)',
  'Technical Stage Duration (minutes)',
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

    const selection = resolvePackage_(booking);
    if (Number(booking.packagePrice) !== selection.price ||
        Number(booking.durationMinutes) !== selection.duration ||
        Number(booking.packageDurationMinutes) !== selection.duration) {
      throw new Error('Package price or duration did not match the configured selection.');
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
        CATEGORIES[booking.jobCategory],
        booking.packageType === 'single' ? 'Single stage' : 'Bundle',
        selection.name,
        selection.stages.map(function (stage) { return stage.name; }).join(', '),
        selection.duration,
        booking.packageType === 'single' && booking.interviewStage === 'technical'
          ? booking.durationMinutes
          : selection.includesTechnical ? booking.technicalDurationMinutes : '',
        selection.price,
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

function resolvePackage_(booking) {
  if (booking.packageType === 'single') {
    const stage = STAGES[booking.interviewStage];
    if (!stage) throw new Error('Unknown interview stage.');
    const duration = Number(booking.durationMinutes);
    const price = booking.interviewStage === 'technical'
      ? stage.prices[duration]
      : stage.duration === duration ? stage.price : null;
    if (!price) throw new Error('Stage duration or price is invalid.');
    return {
      name: stage.name,
      stages: [stage],
      duration: duration,
      price: price,
      includesTechnical: booking.interviewStage === 'technical',
    };
  }

  if (booking.packageType === 'bundle') {
    const bundle = BUNDLES[booking.bundleId];
    if (!bundle) throw new Error('Unknown package bundle.');
    const selectedStages = bundle.stages.map(function (stageId) { return STAGES[stageId]; });
    const includesTechnical = bundle.stages.indexOf('technical') !== -1;
    const duration = selectedStages.reduce(function (total, stage, index) {
      if (bundle.stages[index] === 'technical') return total + Number(booking.technicalDurationMinutes);
      return total + stage.duration;
    }, 0);
    return {
      name: bundle.name,
      stages: selectedStages,
      duration: duration,
      price: bundle.price,
      includesTechnical: includesTechnical,
    };
  }
  throw new Error('Unknown package type.');
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
  if (!Object.prototype.hasOwnProperty.call(CATEGORIES, booking.jobCategory) ||
      !['single', 'bundle'].includes(booking.packageType)) {
    throw new Error('Unknown package selection.');
  }
  if (booking.packageType === 'single' &&
      !Object.prototype.hasOwnProperty.call(STAGES, booking.interviewStage)) {
    throw new Error('Choose an interview stage.');
  }
  if (booking.packageType === 'bundle' &&
      !Object.prototype.hasOwnProperty.call(BUNDLES, booking.bundleId)) {
    throw new Error('Choose a package bundle.');
  }
  if (booking.packageType === 'bundle' && BUNDLES[booking.bundleId].stages.indexOf('technical') !== -1 &&
      ![30, 45].includes(Number(booking.technicalDurationMinutes))) {
    throw new Error('Choose a Technical Interview length for the bundle.');
  }
  if (booking.timezone !== 'Asia/Manila') {
    throw new Error('Unsupported timezone.');
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
