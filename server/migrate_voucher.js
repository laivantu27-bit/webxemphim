require('dotenv').config();
const { connect } = require('./src/config/index');
const Voucher = require('./src/models/voucher.model');

async function migrateAndSeed() {
    try {
        console.log('Connecting to database...');
        await connect.authenticate();
        console.log('Database connected successfully.');

        // Alter payments table to add voucherCode and discountAmount if not exists
        try {
            await connect.query(`ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "voucherCode" VARCHAR(255);`);
            await connect.query(`ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "discountAmount" INTEGER DEFAULT 0;`);
            console.log('Payments table columns checked/updated.');
        } catch (e) {
            console.log('Note on payments alter:', e.message);
        }

        // Create vouchers table if not exists with raw SQL to avoid Sequelize Postgres ALTER syntax quirks
        await connect.query(`
            CREATE TABLE IF NOT EXISTS "vouchers" (
                "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                "code" VARCHAR(255) NOT NULL UNIQUE,
                "description" TEXT,
                "discountType" VARCHAR(50) NOT NULL DEFAULT 'fixed',
                "discountValue" INTEGER NOT NULL,
                "minOrderValue" INTEGER NOT NULL DEFAULT 0,
                "maxDiscount" INTEGER DEFAULT 0,
                "quantity" INTEGER NOT NULL DEFAULT 100,
                "usedCount" INTEGER NOT NULL DEFAULT 0,
                "startDate" TIMESTAMP WITH TIME ZONE,
                "endDate" TIMESTAMP WITH TIME ZONE,
                "status" VARCHAR(50) NOT NULL DEFAULT 'active',
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
            );
        `);
        console.log('Voucher table created or verified.');

        // Seed default vouchers if empty
        const [results] = await connect.query(`SELECT COUNT(*) as count FROM "vouchers";`);
        const count = parseInt(results[0]?.count || 0, 10);
        console.log(`Current voucher count: ${count}`);

        if (count === 0) {
            console.log('Seeding initial vouchers...');
            const defaultVouchers = [
                {
                    code: 'GIAM10K',
                    description: 'Giảm ngay 10.000đ cho đơn hàng từ 80.000đ',
                    discountType: 'fixed',
                    discountValue: 10000,
                    minOrderValue: 80000,
                    quantity: 500,
                    usedCount: 0,
                    status: 'active',
                },
                {
                    code: 'BAPNUOC20K',
                    description: 'Giảm 20.000đ khi đặt vé kèm bắp nước từ 150.000đ trở lên',
                    discountType: 'fixed',
                    discountValue: 20000,
                    minOrderValue: 150000,
                    quantity: 300,
                    usedCount: 0,
                    status: 'active',
                },
                {
                    code: 'COMBO30K',
                    description: 'Giảm 30.000đ cho đơn hàng từ 200.000đ trở lên',
                    discountType: 'fixed',
                    discountValue: 30000,
                    minOrderValue: 200000,
                    quantity: 200,
                    usedCount: 0,
                    status: 'active',
                },
                {
                    code: 'VIP50K',
                    description: 'Ưu đãi VIP giảm 50.000đ cho đơn hàng từ 300.000đ trở lên',
                    discountType: 'fixed',
                    discountValue: 50000,
                    minOrderValue: 300000,
                    quantity: 100,
                    usedCount: 0,
                    status: 'active',
                },
                {
                    code: 'DISCOUNT10',
                    description: 'Giảm 10% (tối đa 40.000đ) cho đơn từ 120.000đ trở lên',
                    discountType: 'percent',
                    discountValue: 10,
                    minOrderValue: 120000,
                    maxDiscount: 40000,
                    quantity: 500,
                    usedCount: 0,
                    status: 'active',
                },
                {
                    code: 'SUPER100K',
                    description: 'Siêu ưu đãi nhóm bạn giảm 100.000đ cho đơn từ 500.000đ trở lên',
                    discountType: 'fixed',
                    discountValue: 100000,
                    minOrderValue: 500000,
                    quantity: 50,
                    usedCount: 0,
                    status: 'active',
                },
            ];

            await Voucher.bulkCreate(defaultVouchers);
            console.log(`Seeded ${defaultVouchers.length} vouchers successfully.`);
        }

        const allVouchers = await Voucher.findAll();
        console.log('Current vouchers in DB:', allVouchers.map(v => ({
            code: v.code,
            discountType: v.discountType,
            discountValue: v.discountValue,
            minOrderValue: v.minOrderValue,
            status: v.status
        })));

        process.exit(0);
    } catch (err) {
        console.error('Migration error:', err);
        process.exit(1);
    }
}

migrateAndSeed();

