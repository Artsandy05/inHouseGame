require("dotenv").config(); // Load dotenv
const { Sequelize } = require("sequelize");
const config = require("../config.js");

const environment = process.env.NODE_ENV;
const DB_DIALECT = config[environment].dialect;
const DB_HOST = config[environment].host;
const DB_USER = config[environment].username;
const DB_PASS = config[environment].password;
const DB_NAME = config[environment].database;


// Initialize your Sequelize instance
const connection = new Sequelize(
  DB_NAME,
  DB_USER,
  DB_PASS,
  {
    dialect: DB_DIALECT,
    host: DB_HOST,
    timezone: "+08:00",
    logging: false, // Set to true to log SQL queries
  }
);

module.exports = connection;
