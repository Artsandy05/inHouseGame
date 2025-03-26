require("dotenv").config(); // Load dotenv

import { Sequelize } from "sequelize";
import config from "./config";

// Define the type for the dialect
type ValidDialect = "mysql" | "postgres" | "sqlite" | "mssql";

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
    dialect: `${DB_DIALECT}` as ValidDialect,
    host: DB_HOST,
    timezone: "+08:00",
    logging: false,
  }
);

export default connection;
