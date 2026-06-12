require('dotenv').config({ path: require('path').resolve(__dirname, '../../../../.env') });
const { pool, query } = require('./pool');

async function seed() {
  console.log('Seeding EventFlow test data...\n');
  try {
    await query(`DELETE FROM events WHERE event_code = 'TEST01'`);

    const evRes = await query(`
      INSERT INTO events (name, venue, event_date, capacity, event_code, status)
      VALUES ($1,$2,NOW() + INTERVAL '7 days',$3,$4,'pre_event') RETURNING id`,
      ['EventFlow Demo — Tech Summit 2025','Patna Exhibition Ground, Bihar',15000,'TEST01']);
    const eventId = evRes.rows[0].id;

    const zones = [
      {name:'North Gate',label:'GATE-N',cap:3000,sort:1},
      {name:'South Gate',label:'GATE-S',cap:3000,sort:2},
      {name:'Main Stage',label:'STAGE', cap:5000,sort:3},
      {name:'Food Court',label:'FOOD',  cap:2000,sort:4},
      {name:'Parking East',label:'PARK-E',cap:1500,sort:5},
      {name:'Medical Post',label:'MED', cap:null,sort:6},
      {name:'Help Desk',  label:'INFO', cap:null,sort:7},
    ];
    const zoneIds = {};
    for (const z of zones) {
      const r = await query(
        `INSERT INTO zones (event_id,name,label,capacity,sort_order) VALUES ($1,$2,$3,$4,$5) RETURNING id`,
        [eventId,z.name,z.label,z.cap,z.sort]);
      zoneIds[z.label] = r.rows[0].id;
    }

    const operators = [
      {name:'Arjun Sharma',    phone:'+917001000001',role:'command',  zone:null},
      {name:'Priya Nair',      phone:'+917001000010',role:'manager',  zone:'GATE-N'},
      {name:'Ravi Kumar',      phone:'+917001000011',role:'manager',  zone:'GATE-S'},
      {name:'Sunita Devi',     phone:'+917001000012',role:'manager',  zone:'STAGE'},
      {name:'Mohammed Iqbal',  phone:'+917001000013',role:'manager',  zone:'FOOD'},
      {name:'Deepak Singh',    phone:'+917001000020',role:'security', zone:'GATE-N'},
      {name:'Anita Yadav',     phone:'+917001000021',role:'security', zone:'GATE-S'},
      {name:'Rakesh Gupta',    phone:'+917001000022',role:'security', zone:'STAGE'},
      {name:'Pooja Mishra',    phone:'+917001000023',role:'security', zone:'PARK-E'},
      {name:'Dr. Sanjay Patel',phone:'+917001000030',role:'medical',  zone:'MED'},
      {name:'Nurse Rekha',     phone:'+917001000031',role:'medical',  zone:'MED'},
      {name:'Amit Chauhan',    phone:'+917001000040',role:'volunteer',zone:'GATE-N'},
      {name:'Kavya Reddy',     phone:'+917001000041',role:'volunteer',zone:'GATE-N'},
      {name:'Vikram Joshi',    phone:'+917001000042',role:'volunteer',zone:'GATE-S'},
      {name:'Meena Kumari',    phone:'+917001000043',role:'volunteer',zone:'STAGE'},
      {name:'Suresh Babu',     phone:'+917001000044',role:'volunteer',zone:'FOOD'},
      {name:'Lakshmi Iyer',    phone:'+917001000045',role:'volunteer',zone:'FOOD'},
      {name:'Niraj Pandey',    phone:'+917001000046',role:'volunteer',zone:'INFO'},
      {name:'Parking Team A',  phone:'+917001000050',role:'parking',  zone:'PARK-E'},
      {name:'Vendor Coord.',   phone:'+917001000051',role:'vendor',   zone:'FOOD'},
    ];
    const opIds = {};
    for (const op of operators) {
      const r = await query(
        `INSERT INTO operators (event_id,zone_id,name,phone,role) VALUES ($1,$2,$3,$4,$5) RETURNING id`,
        [eventId, op.zone ? zoneIds[op.zone] : null, op.name, op.phone, op.role]);
      opIds[op.phone] = r.rows[0].id;
    }

    await query(
      `INSERT INTO timeline_entries (event_id,actor_id,actor_label,action,detail,entry_type) VALUES ($1,$2,$3,$4,$5,$6)`,
      [eventId,opIds['+917001000001'],'Command — Arjun Sharma','Event created','EventFlow activated for Tech Summit 2025','system']);

    console.log('─────────────────────────────────────────');
    console.log('  EventFlow Test Data Ready');
    console.log('─────────────────────────────────────────');
    console.log(`  Event Code:     TEST01`);
    console.log(`  Command login:  +917001000001`);
    console.log(`  Manager login:  +917001000010  (North Gate)`);
    console.log(`  Operator login: +917001000040  (Volunteer)`);
    console.log(`  Zones:          ${zones.length} | Operators: ${operators.length}`);
    console.log('─────────────────────────────────────────\n');
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}
seed();
