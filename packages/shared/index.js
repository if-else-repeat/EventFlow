const INCIDENT_CATEGORIES = {
  CONGESTION:'congestion', MEDICAL:'medical', SECURITY:'security',
  RESOURCE:'resource', INFRASTRUCTURE:'infrastructure', OTHER:'other',
};
const INCIDENT_CATEGORY_LABELS = {
  congestion:'Congestion', medical:'Medical', security:'Security',
  resource:'Resource', infrastructure:'Infrastructure', other:'Other',
};
const INCIDENT_CATEGORY_ICONS = {
  congestion:'🚧', medical:'🏥', security:'🔒',
  resource:'📦', infrastructure:'⚡', other:'📋',
};
const SEVERITY = { LOW:1, MEDIUM:2, HIGH:3, EMERGENCY:4 };
const SEVERITY_LABELS = { 1:'Low', 2:'Medium', 3:'High', 4:'Emergency' };
const SEVERITY_COLORS = { 1:'#6b7280', 2:'#f59e0b', 3:'#f97316', 4:'#ef4444' };
const INCIDENT_STATUS = {
  NEW:'new', UNDER_REVIEW:'under_review', IN_PROGRESS:'in_progress',
  AUTO_ESCALATED:'auto_escalated', RESOLVED:'resolved', CLOSED:'closed',
};
const ZONE_STATUS = { NORMAL:'normal', BUSY:'busy', CRITICAL:'critical', CLOSED:'closed' };
const ZONE_STATUS_COLORS = { normal:'#10b981', busy:'#f59e0b', critical:'#ef4444', closed:'#6b7280' };
const OPERATOR_ROLES = {
  COMMAND:'command', MANAGER:'manager', VOLUNTEER:'volunteer',
  SECURITY:'security', MEDICAL:'medical', VENDOR:'vendor', PARKING:'parking',
};
const EVENT_STATUS = { PRE_EVENT:'pre_event', ACTIVE:'active', EMERGENCY:'emergency', POST_EVENT:'post_event' };
const EVENT_HEALTH = { GREEN:'green', YELLOW:'yellow', ORANGE:'orange', RED:'red' };
const HEALTH_THRESHOLDS = { GREEN:15, YELLOW:40, ORANGE:80 };
const HEALTH_COLORS = { green:'#10b981', yellow:'#f59e0b', orange:'#f97316', red:'#ef4444' };
const BROADCAST_PRIORITY = { INFORMATIONAL:'informational', OPERATIONAL:'operational', EMERGENCY:'emergency' };
const BROADCAST_AUDIENCE = { ALL:'all', OPERATORS:'operators', ATTENDEES:'attendees' };
const BROADCAST_CHANNELS = { APP:'app', SMS:'sms', WHATSAPP:'whatsapp' };
const BROADCAST_TEMPLATES = [
  { id:'gate_use', label:'Use alternate gate', text:'Use {GATE} for faster entry. {GATE} is currently open.', variables:['GATE'], audience:'attendees' },
  { id:'parking_full', label:'Parking lot full', text:'Parking {LOT} is full. Please use Parking {ALT_LOT}.', variables:['LOT','ALT_LOT'], audience:'attendees' },
  { id:'exit_route', label:'Exit route update', text:'Exit via {ROUTE}. {ROUTE} is currently clear.', variables:['ROUTE'], audience:'attendees' },
  { id:'water_location', label:'Water station', text:'Water station available at {LOCATION}.', variables:['LOCATION'], audience:'attendees' },
  { id:'medical_clear', label:'Clear area for medical', text:'Medical team responding near {ZONE}. Please move to the sides.', variables:['ZONE'], audience:'attendees' },
  { id:'delay_notice', label:'Delay announcement', text:'{EVENT} is delayed by approximately {DURATION} minutes.', variables:['EVENT','DURATION'], audience:'all' },
  { id:'all_clear', label:'All clear', text:'The situation at {LOCATION} has been resolved. Normal operations resumed.', variables:['LOCATION'], audience:'attendees' },
  { id:'staff_deploy', label:'Deploy staff', text:'All available staff: please report to {ZONE} immediately.', variables:['ZONE'], audience:'operators' },
  { id:'emergency_alert', label:'Emergency alert', text:'IMPORTANT: {MESSAGE}. Follow staff instructions immediately.', variables:['MESSAGE'], audience:'all', requiresConfirmation:true },
];
const SMS_SEVERITY_MAP = { LOW:1, MEDIUM:2, HIGH:3, EMERGENCY:4, URGENT:4 };
const SMS_CATEGORY_MAP = { CONGESTION:'congestion', MEDICAL:'medical', SECURITY:'security', RESOURCE:'resource', INFRA:'infrastructure', INFRASTRUCTURE:'infrastructure', OTHER:'other' };
const ESCALATION = {
  ZONE_MANAGER_TIMEOUT_SECONDS:120,
  HIGH_CONFIDENCE_TIMEOUT_SECONDS:300,
  MEDIUM_CONFIDENCE_THRESHOLD:3,
  HIGH_CONFIDENCE_THRESHOLD:5,
  CORRELATION_WINDOW_MINUTES:5,
};
const HEALTH_SCORE = {
  SEVERITY_WEIGHTS:{ 1:1, 2:3, 3:7, 4:20 },
  AGE_MULTIPLIERS:[
    { maxMinutes:5, multiplier:1.0 },
    { maxMinutes:10, multiplier:1.5 },
    { maxMinutes:20, multiplier:2.0 },
    { maxMinutes:Infinity, multiplier:3.0 },
  ],
  UNASSIGNED_MULTIPLIER:2.0,
  RECALCULATE_INTERVAL_MS:60000,
};
const WS_EVENTS = {
  INCIDENT_CREATED:'incident:created', INCIDENT_UPDATED:'incident:updated',
  BROADCAST_SENT:'broadcast:sent', ZONE_STATUS_CHANGED:'zone:status_changed',
  HEALTH_UPDATED:'health:updated', TIMELINE_ENTRY:'timeline:entry',
  JOIN_EVENT:'join:event', JOIN_ZONE:'join:zone',
};

module.exports = {
  INCIDENT_CATEGORIES, INCIDENT_CATEGORY_LABELS, INCIDENT_CATEGORY_ICONS,
  SEVERITY, SEVERITY_LABELS, SEVERITY_COLORS, INCIDENT_STATUS,
  ZONE_STATUS, ZONE_STATUS_COLORS, OPERATOR_ROLES, EVENT_STATUS,
  EVENT_HEALTH, HEALTH_THRESHOLDS, HEALTH_COLORS,
  BROADCAST_PRIORITY, BROADCAST_AUDIENCE, BROADCAST_CHANNELS, BROADCAST_TEMPLATES,
  SMS_SEVERITY_MAP, SMS_CATEGORY_MAP, ESCALATION, HEALTH_SCORE, WS_EVENTS,
};
