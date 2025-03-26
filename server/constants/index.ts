export const ALL = "all";
export const DEPOSIT = "deposit";
export const WITHDRAW = "withdraw";
export const WITHDRAWAL = "withdrawal";
export const BET = "bet";
export const WONPRIZE = "wonprize";
export const INITIAL = "initial";
export const PENDING = "pending";
export const SUCCESS = "success";
export const PAID = "paid";
export const FAIL = "fail";
export const COMPLETED = "completed";
export const FAILED = "failed";
export const DONE = "done";
export const NOT_STARTED = "notstarted";
export const FOR_APPROVAL = "forapproval";
export const GAME = "game";
export const ADMIN = "admin";
export const PLAYER = "player";
export const MODERATOR = "moderator";
export const BRAND = "Globalx";
export const REFERRAL = "referral";
export const IDLE = "idle";
export const AGENT = "agent";
export const MASTERAGENT = "masteragent";
export const UNCLAIMED = "unclaimed";
export const CLAIMED = "claimed";
export const PM_QRPH = "pm-qrph"
export const PM_GCASH = "pm-gcash"
export const XENDIT_PH_GCASH = "xendit_ph_gcash"
export const ZOLOZ_INITIALIZE_CALLBACK_BASEURL = `https://sg-production-cdn.zoloz.com/page/zoloz-realid-fe/index.html`
export const H5_REALIDLITE_KYC="H5_REALIDLITE_KYC"

export const SPECIALTY = "SPECIALTY";
export const OGP = "OGP";
export const GCASH = "GCASH";
export const PAYMAYA = "PAYMAYA";
export const BANKS = "BANKS";

export const QRPH = "QRPH";
export const KARERA_LIVE = "KARERA_LIVE"

export const DEVELOPMENT = "development";
export const STAGING = "staging";
export const PRODUCTION = "production";
export const LOCAL = "local";

export const SENDCREDITS = "sendcredits";
export const DEDUCTCREDITS = "deductcredits";

export const DAILY = "daily"
export const BYGAMES = "bygames"
export const BYBETS = "bybets"
export const PROMO = "promo"
export const VOUCHER = "voucher"

export const KYC = "KYC"
export const USER_PROFILE = "USER_PROFILE";
export const PASSWORD = "PASSWORD";
export const MOBILE = "MOBILE";
export const USERNAME = "USERNAME";
export const PHONE = "PHONE";
export const OPERATOR_LOGIN = "OPERATOR_LOGIN";

export const WELCOME_BONUS_PROMO = "WELCOME_BONUS_PROMO"
export const REFER_EARN_PROMO = "REFER_EARN_PROMO"
export const BITHRDAY_BENTE_PROMO = "BITHRDAY_BENTE_PROMO"
export const KRLFDRV01 = "KRLFDRV01"

export const COMPANY_NAME = "GLOBALX DIGITAL CORP.";

export const errorMessagesQRPH: { [key: number]: string } = {
    2005: 'Authentication Failed.',
    2041: 'Invalid Signature.',
    2043: 'Service ID not found.',
    3004: 'Payment not found.',
    3006: 'Provider not found.',
    3007: 'Bank not found.',
    3008: 'Method not found.',
    3012: 'Cannot process transaction because of error on the provider side.',
    6001: 'Payment amount limit exceeded.',
    6002: 'Payment amount less than minimal amount.',
    7008: 'Invalid Callback Token.',
    7009: 'Must be Alpha Numeric.'
};

export const ALLOWED_MIME_TYPES = [
    'application/msword',                            // .doc files
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx files
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',  // .pdf files
];

  
export const paymentStatusesQRPH: { [key: string]: string } = {
    awaiting_redirect: 'Payment is waiting to be redirected.',
    processing: 'Payment is processing.',
    success: 'Payment has been successfully paid.',
    fail: 'Payment has been failed by provider.',
    expired: 'Payment has expired.'
};

export const GAMES_LABEL = {
    ZODIAC: "ZODIAC",
    DOS_LETRA_KARERA: "DOS_LETRA_KARERA",
    TRES_LETRA_KARERA: "TRES_LETRA_KARERA",
};
