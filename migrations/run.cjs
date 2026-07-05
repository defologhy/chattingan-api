const { Sequelize } = require('sequelize');

const seq = new Sequelize(
  process.env.DB_NAME || 'chattingan',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  { host: process.env.DB_HOST || 'localhost', dialect: 'mysql', logging: false }
);

(async () => {
  try {
    await seq.authenticate();
    console.log('Connected');

    const queries = [
      `ALTER TABLE users ADD COLUMN avatar VARCHAR(255) DEFAULT NULL AFTER password`,
      `ALTER TABLE users ADD COLUMN last_seen DATETIME DEFAULT NULL AFTER avatar`,
      `ALTER TABLE messages ADD COLUMN group_id INT DEFAULT NULL AFTER receiver_id`,
      `ALTER TABLE messages ADD COLUMN message_type ENUM('text','image','voice','document') DEFAULT 'text' AFTER message`,
      `ALTER TABLE messages ADD COLUMN reply_to_id INT DEFAULT NULL AFTER message_type`,
      `ALTER TABLE messages ADD COLUMN reactions JSON DEFAULT NULL AFTER reply_to_id`,
      `ALTER TABLE messages ADD COLUMN is_read BOOLEAN DEFAULT false AFTER reactions`,
      `ALTER TABLE messages ADD COLUMN delivered_at DATETIME DEFAULT NULL AFTER is_read`,
      `ALTER TABLE messages ADD COLUMN read_at DATETIME DEFAULT NULL AFTER delivered_at`,
      `ALTER TABLE messages ADD COLUMN deleted_by INT DEFAULT NULL AFTER read_at`,
    ];

    for (const q of queries) {
      try {
        await seq.query(q);
        console.log('OK: ' + q.split(' ').slice(2, 4).join(' '));
      } catch (e) {
        if (e.message.includes('Duplicate') || e.message.includes('already exists')) {
          console.log('SKIP (exists)');
        } else {
          console.log('ERR: ' + e.message);
        }
      }
    }
    console.log('Done');
  } catch (e) {
    console.error('Failed:', e.message);
  }
  await seq.close();
})();
