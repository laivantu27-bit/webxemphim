const { connect } = require('./config/index');

async function migrate() {
    try {
        await connect.query('ALTER TABLE payments ALTER COLUMN "userId" DROP NOT NULL;');
        console.log('payments.userId altered to allow NULL');
    } catch (e) {
        console.log('payments.userId notice:', e.message);
    }
    process.exit(0);
}

migrate();
