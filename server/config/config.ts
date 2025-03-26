import dotenv from "dotenv";
dotenv.config();

interface DatabaseConfig {
  dialect: string;
  host: string;
  username: string;
  password: string;
  database: string;
  timezone: string;
  migrationStorageTableName: string;
  port: number;
  stasher_url: string;
  stasher_token: string;
  stasher_secret: string;
  megaxcess_api_id: string;
  megaxcess_secret_key: string;
  icorepay_url: string;
  icorepay_service_id: string;
  icorepay_passwork: string;
  icorepay_secret_key: string;
  icorepay_deposit_mode: string;
  icorepay_withdraw_mode: string;
  zoloz_client_id: string;
  zoloz_base_url: string;
  base_url: string;
  frontend_url: string;
  m360_app_key: string,
  m360_secret: string,
  m360_base_url: string,
  twilio_account_sid:  string,
  twilio_auth_token: string,
  twilio_service_sid: string,
  telesign_customer_id: string,
  telesign_key_id:  string,
  telesign_api_key: string,
}

const config: { [key: string]: DatabaseConfig } = {
  local: {
    dialect: "mysql",
    host: process.env.DB_LOCAL_HOST || "",
    username: process.env.DB_LOCAL_USER || "",
    password: process.env.DB_LOCAL_PASS || "",
    database: process.env.DB_LOCAL_NAME || "",
    timezone: process.env.DB_LOCAL_TIMEZONE || "+08:00",
    migrationStorageTableName: "migrations",
    port: 3306,

    stasher_url: process.env.STASHER_DEV_URL || "",
    stasher_token: process.env.STASHER_DEV_TOKEN || "",
    stasher_secret: process.env.STASHER_DEV_SECRET || "",

    megaxcess_api_id: process.env.MEGAXCESS_STAGING_API_ID || "",
    megaxcess_secret_key: process.env.MEGAXCESS_STAGING_SECRET_KEY || "",

    icorepay_url: process.env.ICOREPAY_DEV_URL || "",
    icorepay_service_id: process.env.ICOREPAY_DEV_SERVICE_ID || "",
    icorepay_passwork: process.env.ICOREPAY_DEV_PASSWORK || "",
    icorepay_secret_key: process.env.ICOREPAY_DEV_SECRET_KEY || "",
    icorepay_deposit_mode: process.env.ICOREPAY_DEV_DEPOSIT_MODE || "",
    icorepay_withdraw_mode: process.env.ICOREPAY_DEV_WITHDRAW_MODE || "",

    zoloz_client_id: process.env.ZOLOZ_DEV_CLIENT_ID || "",
    zoloz_base_url: process.env.ZOLOZ_DEV_BASE_URL || "",

    m360_app_key:  process.env.M360_APP_KEY || "",
    m360_secret:  process.env.M360_SECRET || "",
    m360_base_url: process.env.M360_BASE_URL || "",

    twilio_account_sid:  process.env.TWILIO_ACCOUNT_SID || "",
    twilio_auth_token:  process.env.TWILIO_AUTH_TOKEN || "",
    twilio_service_sid: process.env.TWILIO_SERVICE_SID || "",

    telesign_customer_id:  process.env.TELESIGN_CUSTOMER_ID || "",
    telesign_key_id:  process.env.TELESIGN_KEY_ID || "",
    telesign_api_key: process.env.TELESIGN_API_KEY || "",
    
    base_url: process.env.LOCAL_BASE_URL || "",
    frontend_url: process.env.LOCAL_FRONTEND_URL || "",
    // Other configurations for development...
  },
  development: {
    dialect: "mysql",
    host: process.env.DB_DEV_HOST,
    username: process.env.DB_DEV_USER,
    password: process.env.DB_DEV_PASS,
    database: process.env.DB_DEV_NAME,
    timezone: process.env.DB_DEV_IMEZONE || "+08:00",
    migrationStorageTableName: "migrations",
    port: 3306,

    stasher_url: process.env.STASHER_DEV_URL,
    stasher_token: process.env.STASHER_DEV_TOKEN,
    stasher_secret: process.env.STASHER_DEV_SECRET,

    megaxcess_api_id: process.env.MEGAXCESS_STAGING_API_ID || "",
    megaxcess_secret_key: process.env.MEGAXCESS_STAGING_SECRET_KEY || "",

    icorepay_url: process.env.ICOREPAY_DEV_URL || "",
    icorepay_service_id: process.env.ICOREPAY_DEV_SERVICE_ID || "",
    icorepay_passwork: process.env.ICOREPAY_DEV_PASSWORK || "",
    icorepay_secret_key: process.env.ICOREPAY_DEV_SECRET_KEY || "",
    icorepay_deposit_mode: process.env.ICOREPAY_DEV_DEPOSIT_MODE || "",
    icorepay_withdraw_mode: process.env.ICOREPAY_DEV_WITHDRAW_MODE || "",

    zoloz_client_id: process.env.ZOLOZ_DEV_CLIENT_ID || "",
    zoloz_base_url: process.env.ZOLOZ_DEV_BASE_URL || "",
    
    m360_app_key:  process.env.M360_APP_KEY || "",
    m360_secret:  process.env.M360_SECRET || "",
    m360_base_url: process.env.M360_BASE_URL || "",

    twilio_account_sid:  process.env.TWILIO_ACCOUNT_SID || "",
    twilio_auth_token:  process.env.TWILIO_AUTH_TOKEN || "",
    twilio_service_sid: process.env.TWILIO_SERVICE_SID || "",

    telesign_customer_id:  process.env.TELESIGN_CUSTOMER_ID || "",
    telesign_key_id:  process.env.TELESIGN_KEY_ID || "",
    telesign_api_key: process.env.TELESIGN_API_KEY || "",

    base_url: process.env.DEV_BASE_URL || "",
    frontend_url: process.env.DEV_FRONTEND_URL || "",
    // Other configurations for development...
  },
  staging: {
    dialect: "mysql",
    host: process.env.DB_STAGING_HOST,
    username: process.env.DB_STAGING_USER,
    password: process.env.DB_STAGING_PASS,
    database: process.env.DB_STAGING_NAME,
    timezone: process.env.DB_STAGING_TIMEZONE || "+08:00",
    migrationStorageTableName: "migrations",
    port: 3306,
    stasher_url: process.env.STASHER_DEV_URL,
    stasher_token: process.env.STASHER_DEV_TOKEN,
    stasher_secret: process.env.STASHER_DEV_SECRET,

    megaxcess_api_id: process.env.MEGAXCESS_STAGING_API_ID || "",
    megaxcess_secret_key: process.env.MEGAXCESS_STAGING_SECRET_KEY || "",

    icorepay_url: process.env.ICOREPAY_DEV_URL || "",
    icorepay_service_id: process.env.ICOREPAY_DEV_SERVICE_ID || "",
    icorepay_passwork: process.env.ICOREPAY_DEV_PASSWORK || "",
    icorepay_secret_key: process.env.ICOREPAY_DEV_SECRET_KEY || "",
    icorepay_deposit_mode: process.env.ICOREPAY_DEV_DEPOSIT_MODE || "",
    icorepay_withdraw_mode: process.env.ICOREPAY_DEV_WITHDRAW_MODE || "",

    zoloz_client_id: process.env.ZOLOZ_DEV_CLIENT_ID || "",
    zoloz_base_url: process.env.ZOLOZ_DEV_BASE_URL || "",
    
    m360_app_key:  process.env.M360_APP_KEY || "",
    m360_secret:  process.env.M360_SECRET || "",
    m360_base_url: process.env.M360_BASE_URL || "",

    twilio_account_sid:  process.env.TWILIO_ACCOUNT_SID || "",
    twilio_auth_token:  process.env.TWILIO_AUTH_TOKEN || "",
    twilio_service_sid: process.env.TWILIO_SERVICE_SID || "",

    telesign_customer_id:  process.env.TELESIGN_CUSTOMER_ID || "",
    telesign_key_id:  process.env.TELESIGN_KEY_ID || "",
    telesign_api_key: process.env.TELESIGN_API_KEY || "",

    base_url: process.env.STAGING_BASE_URL || "",
    frontend_url: process.env.STAGING_FRONTEND_URL || "",
    // Other configurations for development...
  },
  production: {
    dialect: "mysql",
    host: process.env.DB_PROD_HOST,
    username: process.env.DB_PROD_USER,
    password: process.env.DB_PROD_PASS,
    database: process.env.DB_PROD_NAME,
    timezone: process.env.DB_PROD_TIMEZONE || "+08:00",
    migrationStorageTableName: "migrations",
    port: 3306,

    stasher_url: process.env.STASHER_DEV_URL,
    stasher_token: process.env.STASHER_DEV_TOKEN,
    stasher_secret: process.env.STASHER_DEV_SECRET,

    megaxcess_api_id: process.env.MEGAXCESS_PRODUCTION_API_ID || "",
    megaxcess_secret_key: process.env.MEGAXCESS_PRODUCTION_SECRET_KEY || "",

    icorepay_url: process.env.ICOREPAY_PROD_URL || "",
    icorepay_service_id: process.env.ICOREPAY_PROD_SERVICE_ID || "",
    icorepay_passwork: process.env.ICOREPAY_PROD_PASSWORK || "",
    icorepay_secret_key: process.env.ICOREPAY_PROD_SECRET_KEY || "",
    icorepay_deposit_mode: process.env.ICOREPAY_PROD_DEPOSIT_MODE || "",
    icorepay_withdraw_mode: process.env.ICOREPAY_PROD_WITHDRAW_MODE || "",

    zoloz_client_id: process.env.ZOLOZ_PROD_CLIENT_ID || "",
    zoloz_base_url: process.env.ZOLOZ_PROD_BASE_URL || "",
    m360_app_key:  process.env.M360_APP_KEY || "",

    m360_secret:  process.env.M360_SECRET || "",
    m360_base_url: process.env.M360_BASE_URL || "",

    twilio_account_sid:  process.env.TWILIO_ACCOUNT_SID || "",
    twilio_auth_token:  process.env.TWILIO_AUTH_TOKEN || "",
    twilio_service_sid: process.env.TWILIO_SERVICE_SID || "",

    telesign_customer_id:  process.env.TELESIGN_CUSTOMER_ID || "",
    telesign_key_id:  process.env.TELESIGN_KEY_ID || "",
    telesign_api_key: process.env.TELESIGN_API_KEY || "",

    base_url: process.env.PROD_BASE_URL || "",
    frontend_url: process.env.PROD_FRONTEND_URL || "",
    // Other configurations for production...
  },
};

export default config;
