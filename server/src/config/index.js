const { Sequelize } = require('sequelize');
require('dotenv').config();

const dbDialect = process.env.DB_DIALECT || 'postgres';
const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = process.env.DB_PORT ? Number(process.env.DB_PORT) : (dbDialect === 'postgres' ? 5432 : 3306);
const dbName = process.env.DB_NAME || 'movie';
const dbUser = process.env.DB_USER || 'postgres';
const dbPassword = process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '';

const sequelizeOptions = {
    host: dbHost,
    dialect: dbDialect,
    port: dbPort,
    logging: false,
};

if (dbDialect === 'mysql') {
    sequelizeOptions.define = {
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci',
    };
    sequelizeOptions.dialectOptions = {
        charset: 'utf8mb4',
    };
}

const connect = new Sequelize(dbName, dbUser, dbPassword, sequelizeOptions);

const connectDB = async () => {
    try {
        await connect.authenticate();
        console.log(`Connect Database (${dbDialect}) Success!`);
    } catch (error) {
        console.error('error connect database:', error);
    }
};

module.exports = { connectDB, connect };
