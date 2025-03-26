import {
  successResponse,
  errorResponse,
  makeLog,
  makeNotif,
  getNickname,
  mobilePH,
  invalidRoleAuth,
  findChangedValues,
  registrationViaQR,
  getRedirectByRole,
} from "../utils/logic";
import User from "../models/User";
import fastify from "../app";
import Session from "../models/Session";
import PlayerLog from "../models/PlayerLog";
import Address from "../models/Address";
import { Sequelize } from "sequelize";
import { mkdirSync, existsSync } from "fs";
import Referral from "../models/Referral";
import Province from "../models/Province";
import City from "../models/City";
import Barangay from "../models/Barangay";
import Wallet from "../models/Wallet";
import { LOCAL, MOBILE, OPERATOR_LOGIN, PASSWORD, PHONE, PRODUCTION, STAGING, USERNAME } from "../constants";
import Site from "../models/Site";
import argon2 from 'argon2';
import { isNull } from "lodash";
import path from "path";
import fs from "fs";
import { pipeline } from "stream";
import { promisify } from "util";
import OTP from "../api/otp";
import Setting from "../models/Setting";
import moment from "moment-timezone";
import PlayerBadge from "../models/PlayerBadge";
const environment = process.env.NODE_ENV || "local";
const crypto = require('crypto');
const UAParser = require('ua-parser-js');

const storage = `${environment !== LOCAL ? "./dist/server" : "."}`;
const pump = promisify(pipeline);

const expireKYC = (createdAt:any, isKYC:string) => {
  const threeDaysAgo = moment().subtract(3, 'days');
  const userCreatedAt = moment(createdAt);
  return isKYC === "notstarted" && userCreatedAt.isBefore(threeDaysAgo)
}

/*
  IMPORTANT NOTES:
  When you update functionality in verfyMobileOTPController (Mobile Registration Verify OTP)
  you need to update also verifyOTPController (Desktop Registration Verify OTP)
  but if you have specific functionaly only in desktop login, just leave a comment on that
  function stating that function only for mobile or desktop verifyOtp
*/

// Mobile | Login Page | Sending OTP via mobile or password || Tablet | Operator Login Page | Sending and Verify OTP
const loginMobileController = async (request, reply) => {
  const mobile = request.body.mobile;
  const password = request.body.password;
  const loginType = request.body.loginType;
  const username = request.body.username;
  const usernameType = request.body.usernameType;
  
  
  const otp = environment === PRODUCTION ? (crypto.randomBytes(3).readUIntBE(0, 3) % 1000000).toString().padStart(6, '0') : 
  environment === STAGING ? (crypto.randomBytes(3).readUIntBE(0, 3) % 1000000).toString().padStart(6, '0') : "111111";
  const otpExpiration = new Date(Date.now() + 1 * 68000); // OTP valid for 1 minute
  const otpMaxEntriesExpiration = new Date(Date.now() + 1444 * 60000); // OTP valid for 1440 minute = 1 day
  const mode = request.body.mode;

  const settings = await Setting.findOne({ where:{ id:1 }});
  const { ROLES } = require("../constants/permission");

  if(loginType === PASSWORD) {
    let whereConditions = {}
    let conditionMes1 = ""
    let conditionMes2 = ""
    if(usernameType === MOBILE){
      whereConditions = { mobile };
      conditionMes1 = "Your mobile no. is not registered, Please register your mobile no.";
      conditionMes2 = "Your mobile no. cannot be logged here.";
    }else if(usernameType === USERNAME){
      whereConditions = { username };
      conditionMes1 = "Your username is not registered, Please register your username";
      conditionMes2 = "Your username cannot be logged here.";
    }

    let user = await User.findOne({ where: whereConditions });
    const isKYCExpire = expireKYC(user?.createdAt, user?.isKYC)

    if (settings.isMaintenance) {
      if(!user?.isTester){
        const msgErr =
          "We're sorry, Karera.Live is temporarily closed for site enchancements.";
        return errorResponse(msgErr, reply, "custom");
      }
    }

    if (!user) {
      const msgErr = conditionMes1;
      return errorResponse(msgErr, reply, "custom");
    }

    if (!user.isMobileVerified && usernameType === MOBILE) {
      const msgErr =
        "Your mobile no. is not verified, go verify your mobile no. and submit the right otp for fully verification";
      return errorResponse(msgErr, reply, "custom");
    }

    if (user.status === "deactivated" && user.isKYC === "done") {
      const msgErr = "Your acount is deactivated";
      return errorResponse(msgErr, reply, "custom");
    }

    if(invalidRoleAuth(user.role, mode)){
      const msgErr = conditionMes2;
      return errorResponse(msgErr, reply, "custom");
    }

    const { uuid, id } = user;

    if (isNull(user.password)) {
      return errorResponse(`Invalid Credentials`, reply, "custom");
    }
    
    const isPasswordValid = await argon2.verify(user.password, password);
      
    if(!isPasswordValid){
      return errorResponse(`Invalid Credentials`, reply, "custom");
    }

    // await activatePromo(id)

    const { session } = request;
    const result = await verifyPasswordLoginController(request, uuid, session, mode)

    return successResponse(
      result,
      "Your credentials is Valid, You can login now.",
      reply
    );
  }else if(loginType === PHONE){
    let user = await User.findOne({ where: { mobile } });
    const isKYCExpire = expireKYC(user?.createdAt, user?.isKYC)
    if (settings.isMaintenance) {
      if(!user?.isTester){
        const msgErr =
          "We're sorry, Karera.Live is temporarily closed for site enchancements.";
        return errorResponse(msgErr, reply, "custom");
      }
    }

    if (!user) {
      const msgErr =
        "Your mobile no. is not registered, Please register your mobile no.";

      return errorResponse(msgErr, reply, "custom");
    }

    if (!user.isMobileVerified) {
      const msgErr =
        "Your mobile no. is not verified, go verify your mobile no. and submit the right otp for fully verification";
      return errorResponse(msgErr, reply, "custom");
    }
   
    if (user.status === "deactivated" && user.isKYC === "done") {
      const msgErr = "Your acount is deactivated";
      return errorResponse(msgErr, reply, "custom");
    }

    if(invalidRoleAuth(user.role, mode)){
      const msgErr =
      "Your mobile no. cannot be logged here.";
      return errorResponse(msgErr, reply, "custom");
    } 

    // await twillio.sendSMS(mobile, reply); 

    if (environment === PRODUCTION || environment === STAGING) {
      const otpInstance = new OTP();  
      await otpInstance.sendMsg(mobile, otp, reply);
    }

    const { id, uuid } = user;

    user.otp = otp;
    user.otpExpiration = otpExpiration;
    user.otpMaxEntriesExpiration = otpMaxEntriesExpiration;
    user = await user.save();

    await makeLog(
      `The user ID ${uuid} was login and an OTP No. ${otp} is sent`,
      "authentication",
      "info",
      id,
      "user",
      "login player"
    );

    const payload = {
      data: {
        id: uuid,
        mobile,
        countdownSeconds: 300,
      },
    };

    return successResponse(
      payload,
      "Mobile No. is now login, and here's the 1-minute OTP.",
      reply
    );
  }else if(loginType === OPERATOR_LOGIN){
    const username = request.body.username;
    let user = await User.findOne({ where: { username } });

    if (settings.isMaintenance) {
      if(!user?.isTester){
        const msgErr =
          "We're sorry, Karera.Live is temporarily closed for site enchancements.";
        return errorResponse(msgErr, reply, "custom");
      }
    }


    user.isActive = true;
    user = await user.save();
    const { id, uuid, role, firstName, lastName } = user;
    
    if (isNull(user.password)) {
      return errorResponse(`Invalid Credentials`, reply, "custom");
    }
    //console.log(await argon2.hash('testing'))
    const isPasswordValid = await argon2.verify(user.password, password);

    if(!isPasswordValid){
      return errorResponse(`Invalid Credentials`, reply, "custom");
    }
    
    const { session } = request;
    const token = fastify.jwt.sign({ uuid });

    await Session.create({
      userId: user.id,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      token,
    });

    await PlayerLog.create({
      userId: user.id,
      type: 'in',
      mode: "operator",
    });

    
    await makeLog(
      `${role === 'csr' ? (firstName + " " + lastName + " has successfully logged in.") : uuid + " User Login"}`,
      `${role === 'csr' ? "CSRActiveStatus" : "authentication"}`,
      "success",
      id,
      "user",
      `${role === 'csr' ? "CSR Login" : "User Login"}`
    );

    return successResponse(
      {data:{user,token}},
      "Your credentials is Valid, You can login now.",
      reply
    );
  };
};

// Mobile | Login Page | Verify OTP via mobile and password
const verifyPasswordLoginController = async (request:any, uuidaram:any, sessionParam:any, modeParam:any) => {
  const models = { User, Address, Province, City, Barangay };

  // Load associations
  // @ts-ignore
  User.associate && User.associate(models);
  // @ts-ignore
  Address.associate && Address.associate(models);
  // @ts-ignore
  Province.associate && Province.associate(models);
  // @ts-ignore
  City.associate && City.associate(models);
  // @ts-ignore
  Barangay.associate && Barangay.associate(models);
  // @ts-ignore
  Wallet.associate && Wallet.associate(models);

  const user = await User.findOne({
    attributes: [
      "id",
      "uuid",
      [
        Sequelize.fn(
          "CONCAT",
          Sequelize.col("firstName"),
          " ",
          Sequelize.col("lastName")
        ),
        "fullName",
      ],
      "firstName",
      "lastName",
      "nickName",
      "role",
      "email",
      "status",
      "birthdate",
      "placeOfBirth",
      "nationalities",
      "natureOfWork",
      "sourceOfIncome",
      "sourceOfIncomeId",
      "gender",
      "address",
      "profilePicture",
      "mobile",
      "accountId",
      "otp",
      "otpExpiration",
      "govtType",
      "govtId",
      "govtPicture",
      "govtIdPicture",
      "referralCodeForSA",
      "referralLinkForSA",
      "referralCodeForMA",
      "referralLinkForMA",
      "referralCodeForAgent",
      "referralLinkForAgent",
      "referralCodeForPlayer",
      "referralLinkForPlayer",
      "usePresentAddress",
      "isSupervisorApproved",
      "isVerifierApproved",
      "isDeactivated",
      "actionStatus",
      "isKYC",
      "passcode",
      "password",
      "createdAt"
    ],
    where: { uuid:uuidaram },
    include: [
      {
        model: Address,
        as: "currentAddress",
        attributes: ["street", "zipCode"],
        include: [
          { model: Province, as: "province", attributes: ["id", "name"] },
          { model: City, as: "city", attributes: ["id", "name"] },
          { model: Barangay, as: "barangay", attributes: ["id", "name"] },
        ],
      },
      {
        model: Address,
        as: "permanentAddress",
        attributes: ["street", "zipCode"],
        include: [
          { model: Province, as: "province", attributes: ["id", "name"] },
          { model: City, as: "city", attributes: ["id", "name"] },
          { model: Barangay, as: "barangay", attributes: ["id", "name"] },
        ],
      },
      {
        model: Wallet,
        attributes: ["balance"],
      },
      {
        model: Referral,
        as: "inviter",
        attributes: [],
      }
    ],
  });

  const {
    id,
    uuid,
    firstName,
    lastName,
    nickName,
    role,
    email,
    mobile,
    accountId,
    birthdate,
    placeOfBirth,
    nationalities,
    natureOfWork,
    sourceOfIncome,
    sourceOfIncomeId,
    gender,
    address,
    profilePicture,
    otp: userOtp,
    otpExpiration,
    //  @ts-ignore
    govtType,
    govtId,
    govtPicture,
    //  @ts-ignore
    govtIdPicture,
    referralCodeForSA,
    referralLinkForSA,
    referralCodeForMA,
    referralLinkForMA,
    referralCodeForAgent,
    referralLinkForAgent,
    referralCodeForPlayer,
    referralLinkForPlayer,
    //  @ts-ignore
    currentAddress,
    //  @ts-ignore
    permanentAddress,
    usePresentAddress,
    isSupervisorApproved,
    isVerifierApproved,
    isDeactivated,
    actionStatus,
    isKYC,
    //  @ts-ignore
    Wallet: wallet,
    Referral: referral,
    passcode,
    password,
    createdAt
  } = user;

  const auth = {
    id: uuid,
    firstName,
    lastName,
    nickName,
    role,
    email,
    mobile,
    accountId,
    birthdate,
    placeOfBirth,
    nationalities,
    natureOfWork,
    sourceOfIncome,
    sourceOfIncomeId,
    gender,
    address,
    profilePicture,
    govtType,
    govtId,
    govtPicture,
    govtIdPicture,
    referralCodeForSA,
    referralLinkForSA,
    referralCodeForMA,
    referralLinkForMA,
    referralCodeForAgent,
    referralLinkForAgent,
    referralCodeForPlayer,
    referralLinkForPlayer,
    currentAddress,
    permanentAddress,
    usePresentAddress,
    isSupervisorApproved,
    isVerifierApproved,
    isDeactivated,
    actionStatus,
    wallet,
    referral,
    isKYC,
    passcode,
    password,
  };


  const token = fastify.jwt.sign({ uuid });
  
  const isKYCExpire = expireKYC(createdAt, isKYC)
  const { session } = request;

   await Session.create({
      userId: id,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      token,
    });

   await PlayerLog.create({
    userId: id,
    type: 'in',
    mode:modeParam,
  });

  await makeLog(
    `The user ${uuid} mobile no. and password was entered correctly and successfully login.`,
    "authentication",
    "success",
    id,
    "user",
    "verify password login controller"
  );
  const payload = {
    data: {
      auth,
      mobile,
      token,
      isKYCExpire
    },
  };

 return payload;
}

// Desktop and Mobile | Login Page | Verify OTP via mobile login only
const verifyOTPLoginController = async (request, reply) => {
  const requestId = request.body.id;
  const otp = request.body.otp;
  const mode = request.body.mode;

  const models = { User, Address, Province, City, Barangay };

  // Load associations
  // @ts-ignore
  User.associate && User.associate(models);
  // @ts-ignore
  Address.associate && Address.associate(models);
  // @ts-ignore
  Province.associate && Province.associate(models);
  // @ts-ignore
  City.associate && City.associate(models);
  // @ts-ignore
  Barangay.associate && Barangay.associate(models);
  // @ts-ignore
  Wallet.associate && Wallet.associate(models);

  const user = await User.findOne({
    attributes: [
      "id",
      "uuid",
      [
        Sequelize.fn(
          "CONCAT",
          Sequelize.col("firstName"),
          " ",
          Sequelize.col("lastName")
        ),
        "fullName",
      ],
      "firstName",
      "lastName",
      "nickName",
      "role",
      "email",
      "status",
      "birthdate",
      "placeOfBirth",
      "nationalities",
      "natureOfWork",
      "sourceOfIncome",
      "sourceOfIncomeId",
      "gender",
      "address",
      "profilePicture",
      "mobile",
      "accountId",
      "otp",
      "otpExpiration",
      "govtType",
      "govtId",
      "govtPicture",
      "govtIdPicture",
      "referralCodeForSA",
      "referralLinkForSA",
      "referralCodeForMA",
      "referralLinkForMA",
      "referralCodeForAgent",
      "referralLinkForAgent",
      "referralCodeForPlayer",
      "referralLinkForPlayer",
      "usePresentAddress",
      "isSupervisorApproved",
      "isVerifierApproved",
      "isDeactivated",
      "actionStatus",
      "isKYC",
      "passcode",
      "password",
      "createdAt",
    ],
    where: { uuid: requestId },
    include: [
      {
        model: Address,
        as: "currentAddress",
        attributes: ["street", "zipCode"],
        include: [
          { model: Province, as: "province", attributes: ["id", "name"] },
          { model: City, as: "city", attributes: ["id", "name"] },
          { model: Barangay, as: "barangay", attributes: ["id", "name"] },
        ],
      },
      {
        model: Address,
        as: "permanentAddress",
        attributes: ["street", "zipCode"],
        include: [
          { model: Province, as: "province", attributes: ["id", "name"] },
          { model: City, as: "city", attributes: ["id", "name"] },
          { model: Barangay, as: "barangay", attributes: ["id", "name"] },
        ],
      },
      {
        model: Referral,
        as: "inviter",
      },
      {
        model: Wallet,
        attributes: ["balance"],
      },
    ],
  });

  const {
    id,
    uuid,
    firstName,
    lastName,
    nickName,
    role,
    email,
    mobile,
    accountId,
    birthdate,
    placeOfBirth,
    nationalities,
    natureOfWork,
    sourceOfIncome,
    sourceOfIncomeId,
    gender,
    address,
    profilePicture,
    otp: userOtp,
    otpExpiration,
    //  @ts-ignore
    govtType,
    govtId,
    govtPicture,
    //  @ts-ignore
    govtIdPicture,
    referralCodeForSA,
    referralLinkForSA,
    referralCodeForMA,
    referralLinkForMA,
    referralCodeForAgent,
    referralLinkForAgent,
    referralCodeForPlayer,
    referralLinkForPlayer,
    //  @ts-ignore
    currentAddress,
    //  @ts-ignore
    permanentAddress,
    usePresentAddress,
    isSupervisorApproved,
    isVerifierApproved,
    isDeactivated,
    actionStatus,
    isKYC,
    //  @ts-ignore
    Wallet: wallet,
    passcode,
    password,
    createdAt,
  } = user;

  // await twillio.verificationCheck(otp, mobile, reply)

  if (new Date() > new Date(otpExpiration)) {
    const msgErr = "OTP expired";
    return errorResponse(msgErr, reply, "custom");
  }

  if (!user || userOtp !== otp) {
    const msgErr = "Invalid OTP";
    return errorResponse(msgErr, reply, "custom");
  }

  const auth = {
    id: uuid,
    firstName,
    lastName,
    nickName,
    role,
    email,
    mobile,
    accountId,
    birthdate,
    placeOfBirth,
    nationalities,
    natureOfWork,
    sourceOfIncome,
    sourceOfIncomeId,
    gender,
    address,
    profilePicture,
    govtType,
    govtId,
    govtPicture,
    govtIdPicture,
    referralCodeForSA,
    referralLinkForSA,
    referralCodeForMA,
    referralLinkForMA,
    referralCodeForAgent,
    referralLinkForAgent,
    referralCodeForPlayer,
    referralLinkForPlayer,
    currentAddress,
    permanentAddress,
    usePresentAddress,
    isSupervisorApproved,
    isVerifierApproved,
    isDeactivated,
    actionStatus,
    Wallet:wallet,
    isKYC,
    passcode,
    password
  };

  const isKYCExpire = expireKYC(createdAt, isKYC)

  const token = fastify.jwt.sign({ uuid });
  const { session } = request;

   await Session.create({
      userId: id,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      token,
    });

   await PlayerLog.create({
    userId: id,
    type: 'in',
    mode,
  });

  await makeLog(
    `The OTP No. ${otp} was entered correctly and successfully login.`,
    "authentication",
    "success",
    id,
    "user",
    "verify otp login controller"
  );
  const payload = {
    data: {
      auth,
      mobile,
      token,
      isKYCExpire
    },
  };

  return successResponse(
    payload,
    "Your OTP is Valid, You can login now.",
    reply
  );
};

// Desktop and Mobile | Verify Page | Sending OTP
const verfyMobileController = async (request, reply) => {
  const mobile = request.body.mobile;
  const otp = environment === PRODUCTION ? (crypto.randomBytes(3).readUIntBE(0, 3) % 1000000).toString().padStart(6, '0') : 
  environment === STAGING ? (crypto.randomBytes(3).readUIntBE(0, 3) % 1000000).toString().padStart(6, '0') : "111111";
  const otpExpiration = new Date(Date.now() + 5 * 68000); // OTP valid for 5 minute
  const otpMaxEntriesExpiration = new Date(Date.now() + 2 * 60 * 60000); // OTP valid for 2 hours

  let user = await User.findOne({
    where: { mobile },
  });

  if (!user) {
    const msgErr =
      "Your mobile no. is not registered, Please register your mobile no.";

    return errorResponse(msgErr, reply, "custom");
  }

  if (environment === PRODUCTION || environment === STAGING) {
    const otpInstance = new OTP();  
    await otpInstance.sendMsg(mobile, otp, reply);
  }

  if (user) {
    user.update({
      otp,
      otpExpiration,
      otpMaxEntriesExpiration,
    });
  }

  const { uuid, id: userId } = user;

  const payload = {
    data: {
      id: uuid,
      mobile,
      countdownSeconds: 300,
    },
  };
  await makeLog(
    `The user ${uuid} is requesting for mobile verification and OTP No. ${otp} was sent`,
    "authentication",
    "info",
    userId,
    "user",
    "verfy Mobile Controller"
  );

  return successResponse(
    payload,
    "Mobile No. is now verified, and here's the 1-minute OTP.",
    reply
  );
};

// Desktop and Mobile | Registration Page | Sending OTP
const registerMobileController = async (request, reply) => {
  const firstName = request.body.firstName;
  const lastName = request.body.lastName;
  const birthdate = request.body.birthdate;
  const mobile = request.body.mobile;
  const siteId = request.body.siteId;
  const password = request.body.password;

  let user = await User.findOne({
    where: { mobile },
  });

  const settings = await Setting.findOne({ where:{ id:1 }});

  if (settings.isMaintenance) {
      const msgErr =
        "We're sorry, Karera.Live is temporarily closed for site enchancements.";
      return errorResponse(msgErr, reply, "custom");
  }

  const otp = environment === PRODUCTION ? (crypto.randomBytes(3).readUIntBE(0, 3) % 1000000).toString().padStart(6, '0') : 
  environment === STAGING ? (crypto.randomBytes(3).readUIntBE(0, 3) % 1000000).toString().padStart(6, '0') : "111111";

  const otpExpiration = new Date(Date.now() + 5 * 68000); // OTP valid for 1 minute
  const otpMaxEntriesExpiration = new Date(Date.now() + 2 * 60 * 60000); // OTP valid for 2 hours


  // if (user) {
  //   const msgErr = "Your mobile no. is already registered";
  //   return errorResponse(msgErr, reply, "custom");
  // }

  let phoneNumber = mobilePH(mobile);
  if (!user) {
    if (environment === PRODUCTION || environment === STAGING) {
      const otpInstance = new OTP();  
      await otpInstance.sendMsg(mobile, otp, reply);
    }

    // await twillio.sendSMS(mobile, reply);

    const hashedPassword = await argon2.hash(password);

    await User.create({
      firstName,
      lastName,
      mobile,
      birthdate,
      username: null,
      email: null,
      password: hashedPassword,
      otp,
      siteId,
      otpExpiration,
      otpMaxEntriesExpiration,
      supervisorWhoApprove: null,
      verifierWhoApprove: null,
      personWhoDeactivated: null,
      personWhoDenied: null,
    })
      .then(async ({ id: userId, uuid }) => {
        await Wallet.create({
          user_id: userId,
        });

        const payload = {
          data: {
            id: uuid,
            mobile,
            countdownSeconds: 300,
          },
        };

        // Update user
        const user = await User.findOne({
          where: { mobile },
        });

        if (user) {
          const nicknameUserId = user.id;
          const nickName = getNickname(
            firstName,
            lastName,
            birthdate,
            mobile,
            nicknameUserId
          );

  
          user.update({
            nickName,
          });
        }

        // Check if the folder exists, and create it if it doesn't
        let uploadsProfilePicFolderPath = ""
        if(environment !== LOCAL){
          uploadsProfilePicFolderPath = `./dist/server/public/uploads/images/profile-pictures/${uuid}` 
        }else{
          uploadsProfilePicFolderPath = `./public/uploads/images/profile-pictures/${uuid}`
        }

        let uploadsGovtPicFolderPath = ""
        if(environment !== LOCAL){
          uploadsGovtPicFolderPath = `./dist/server/public/uploads/images/govt-pictures/${uuid}` 
        }else{
          uploadsGovtPicFolderPath = `./public/uploads/images/govt-pictures/${uuid}`
        }

        if (!existsSync(uploadsProfilePicFolderPath)) {
          mkdirSync(uploadsProfilePicFolderPath, { recursive: true });
        }
        if (!existsSync(uploadsGovtPicFolderPath)) {
          mkdirSync(uploadsGovtPicFolderPath, { recursive: true });
        }

        await makeNotif(
          userId,
          "Welcome to Karera Live!",
          `We’re so happy that you’re here! You may now enjoy and Immerse Yourself in the Thrill of Live Betting 
          Game here at Karera Live! \n
          To access all features, especially for withdrawals, start the identity verification process (KYC) now. \n
          To complete your identity verification, you'll need:`,
          "welcome",
          "info",
          uuid
        );

        await makeLog(
          `The user ${uuid} is successfully registered and OTP No. ${otp} is sent`,
          "authentication",
          "info",
          userId,
          "user",
          "register Mobile Controller"
        );

        return successResponse(
          payload,
          "Mobile No. is now registered, and here's the 1-minute OTP.",
          reply
        );
      })
      .catch((err) => {
        // return errorResponse(err, reply);
        return errorResponse(err, reply, "custom");
      });
  }else{
    const payload = {
      data: {
        id: user?.uuid,
        mobile,
        countdownSeconds: 300,
      },
    };

    const hashedPassword = await argon2.hash(password);

    if (environment === PRODUCTION || environment === STAGING) {
      const otpInstance = new OTP();  
      await otpInstance.sendMsg(mobile, otp, reply);
    }

    const newOTPPayload = {
      otp,
      otpExpiration,
      otpMaxEntriesExpiration,
      password: hashedPassword
    }
    await User.update(newOTPPayload, { where: { uuid:user?.uuid } });

    //  if (user?.isMobileVerified) {
    //     const msgErr = "Your mobile no. is already registered and verified!";
    //     return errorResponse(msgErr, reply, "custom");
    //  }

    return successResponse(
      payload,
      "Mobile No. is now registered, and here's the 1-minute OTP.",
      reply
    );
  }
};

const getAuthtUser = async (userUUID:string) => {
  const models = { User, Address, Province, City, Barangay };

  // Load associations
  // @ts-ignore
  User.associate && User.associate(models);
  // @ts-ignore
  Address.associate && Address.associate(models);
  // @ts-ignore
  Province.associate && Province.associate(models);
  // @ts-ignore
  City.associate && City.associate(models);
  // @ts-ignore
  Barangay.associate && Barangay.associate(models);
  // @ts-ignore
  Wallet.associate && Wallet.associate(models);

  const user = await User.findOne({
    attributes: [
      "id",
      "uuid",
      [
        Sequelize.fn(
          "CONCAT",
          Sequelize.col("firstName"),
          " ",
          Sequelize.col("lastName")
        ),
        "fullName",
      ],
      "firstName",
      "lastName",
      "nickName",
      "role",
      "email",
      "status",
      "birthdate",
      "placeOfBirth",
      "nationalities",
      "natureOfWork",
      "sourceOfIncome",
      "sourceOfIncomeId",
      "gender",
      "address",
      "profilePicture",
      "mobile",
      "accountId",
      "otp",
      "otpExpiration",
      "govtType",
      "govtId",
      "govtPicture",
      "govtIdPicture",
      "referralCodeForSA",
      "referralLinkForSA",
      "referralCodeForMA",
      "referralLinkForMA",
      "referralCodeForAgent",
      "referralLinkForAgent",
      "referralCodeForPlayer",
      "referralLinkForPlayer",
      "usePresentAddress",
      "isSupervisorApproved",
      "isVerifierApproved",
      "isDeactivated",
      "actionStatus",
      "isKYC",
      "passcode",
      "password"
    ],
    where: { uuid: userUUID },
    include: [
      {
        model: Address,
        as: "currentAddress",
        attributes: ["street", "zipCode"],
        include: [
          { model: Province, as: "province", attributes: ["id", "name"] },
          { model: City, as: "city", attributes: ["id", "name"] },
          { model: Barangay, as: "barangay", attributes: ["id", "name"] },
        ],
      },
      {
        model: Address,
        as: "permanentAddress",
        attributes: ["street", "zipCode"],
        include: [
          { model: Province, as: "province", attributes: ["id", "name"] },
          { model: City, as: "city", attributes: ["id", "name"] },
          { model: Barangay, as: "barangay", attributes: ["id", "name"] },
        ],
      },
      {
        model: Referral,
        as: "inviter",
      },
      {
        model: Wallet,
        attributes: ["balance"],
      },
    ],
  });

  const {
    id,
    uuid,
    firstName,
    lastName,
    nickName,
    role,
    email,
    mobile,
    accountId,
    birthdate,
    placeOfBirth,
    nationalities,
    natureOfWork,
    sourceOfIncome,
    sourceOfIncomeId,
    gender,
    address,
    profilePicture,
    otp: userOtp,
    otpExpiration,
    //  @ts-ignore
    govtType,
    govtId,
    govtPicture,
    //  @ts-ignore
    govtIdPicture,
    referralCodeForSA,
    referralLinkForSA,
    referralCodeForMA,
    referralLinkForMA,
    referralCodeForAgent,
    referralLinkForAgent,
    referralCodeForPlayer,
    referralLinkForPlayer,
    //  @ts-ignore
    currentAddress,
    //  @ts-ignore
    permanentAddress,
    usePresentAddress,
    isSupervisorApproved,
    isVerifierApproved,
    isDeactivated,
    actionStatus,
    isKYC,
    //  @ts-ignore
    Wallet: wallet,
    passcode,
    password
  } = user;

  const auth = {
    id: uuid,
    firstName,
    lastName,
    nickName,
    role,
    email,
    mobile,
    accountId,
    birthdate,
    placeOfBirth,
    nationalities,
    natureOfWork,
    sourceOfIncome,
    sourceOfIncomeId,
    gender,
    address,
    profilePicture,
    govtType,
    govtId,
    govtPicture,
    govtIdPicture,
    referralCodeForSA,
    referralLinkForSA,
    referralCodeForMA,
    referralLinkForMA,
    referralCodeForAgent,
    referralLinkForAgent,
    referralCodeForPlayer,
    referralLinkForPlayer,
    currentAddress,
    permanentAddress,
    usePresentAddress,
    isSupervisorApproved,
    isVerifierApproved,
    isDeactivated,
    actionStatus,
    wallet,
    isKYC,
    passcode,
    password
  };

  return auth
};

// Desktop and Mobile | Verify Page | Verify OTP
const verifyPageMobileOTPController = async (request, reply) => {
  const id = request.body.id;
  const otp = request.body.otp;

 

  let user = await User.findOne({
    attributes: [
      "id",
      "uuid",
      "otp",
      "role",
      "isMobileVerified",
      "otpExpiration",
      "mobile",
      [
        Sequelize.fn(
          "CONCAT",
          Sequelize.col("firstName"),
          " ",
          Sequelize.col("lastName")
        ),
        "playerName",
      ],
    ],
    where: { uuid: id },
  });

  // await twillio.verificationCheck(otp, user?.mobile, reply)

  if (new Date() > new Date(user.otpExpiration)) {
    const msgErr = "OTP expired";

    return errorResponse(msgErr, reply, "custom");
  }

  if (!user || user.otp !== otp) {
    const msgErr = "Invalid OTP";

    return errorResponse(msgErr, reply, "custom");
  }

  const { id: userId, mobile, role } = user;

  const redirect = getRedirectByRole(role)

  user.otp = null;
  user.isMobileVerified = 1;
  user = await user.save();

  const payload = {
    data: {
      id: user.uuid,
      mobile,
      redirect
    },
  };
  await makeLog(
    `The OTP No. ${otp} was entered correctly and successfully registered.`,
    "authentication",
    "info",
    userId,
    "user",
    "verfy Mobile OTP Controller"
  );

  return successResponse(
    payload,
    "Your OTP is Valid, You can login now.",
    reply
  );
}

// Mobile | Registration Page | Verify OTP 
const verfyMobileOTPController = async (request, reply) => {
  const id = request.body.id;
  const otp = request.body.otp;
  const referralCode = request.body.referralCode;
  let typeRedirect = "game"

  let user = await User.findOne({
    attributes: [
      "id",
      "uuid",
      "otp",
      "isMobileVerified",
      "otpExpiration",
      "mobile",
      [
        Sequelize.fn(
          "CONCAT",
          Sequelize.col("firstName"),
          " ",
          Sequelize.col("lastName")
        ),
        "playerName",
      ],
    ],
    where: { uuid: id },
  });


  typeRedirect = await registrationViaQR(referralCode, user, reply)  

  if (new Date() > new Date(user.otpExpiration)) {
    const msgErr = "OTP expired";

    return errorResponse(msgErr, reply, "custom");
  }

  if (!user || user.otp !== otp) {
    const msgErr = "Invalid OTP";

    return errorResponse(msgErr, reply, "custom");
  }

  // await twillio.verificationCheck(otp, user?.mobile, reply)

  user.otp = null;
  user.isMobileVerified = 1;
  user = await user.save();

  const payload = {
    data: {
      id: user?.uuid,
      mobile:user?.mobile,
      typeRedirect
    },
  };
  await makeLog(
    `The OTP No. ${otp} was entered correctly and successfully registered.`,
    "authentication",
    "info",
    user?.id,
    "user",
    "verfy Mobile OTP Controller"
  );

  return successResponse(
    payload,
    "Your OTP is Valid, You can login now.",
    reply
  );
};

// Desktop | Registration Page | Verify OTP 
const verifyOTPController = async (request, reply) => {
  const id = request.body.id;
  const otp = request.body.otp;
  const mode = request.body.mode
  const referralCode = request.body.referralCode;
  let typeRedirect = ""
  let user = await User.findOne({
    attributes: [
      "id",
      "uuid",
      "otp",
      "isMobileVerified",
      "otpExpiration",
      "mobile",
      [
        Sequelize.fn(
          "CONCAT",
          Sequelize.col("firstName"),
          " ",
          Sequelize.col("lastName")
        ),
        "playerName",
      ],
    ],
    where: { uuid: id },
  });

  // @ts-ignore
  const { id: userId, mobile, uuid } = user;
  const playerName = user.get("playerName");
  // const wallet = await Wallet.count({ where: { user_id: userId } });
  // if (wallet === 0) {
  //   await Wallet.create({
  //     user_id: userId,
  //   });
  // }

  // On Referral Registration using QRCode Links
  typeRedirect = await registrationViaQR(referralCode, user, reply)
  if(typeRedirect === ""){
    typeRedirect = mode
  } 

  // await twillio.verificationCheck(otp, mobile, reply)
  
  if (new Date() > new Date(user.otpExpiration)) {
    const msgErr = "OTP expired";

    return errorResponse(msgErr, reply, "custom");
  }

  if (!user || user.otp !== otp) {
    const msgErr = "Invalid OTP";

    return errorResponse(msgErr, reply, "custom");
  }

  user.otp = null;
  user.isMobileVerified = 1;
  user = await user.save();

  const payload = {
    data: {
      id: user.uuid,
      typeRedirect,
      mobile,
    },
  };

  await makeLog(
    `The OTP No. ${otp} was entered correctly and successfully registered.`,
    "authentication",
    "info",
    userId,
    "user",
    'verifyOTPController'
  );

  return successResponse(
    payload,
    "Your OTP is Valid, You can login now.",
    reply
  );
};

// Desktop and Mobile | Resend OTP Page | Sending OTP 
const resendOTPController = async (request, reply) => {
  const id = request.body.id;

  // const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otp = environment === PRODUCTION ? (crypto.randomBytes(3).readUIntBE(0, 3) % 1000000).toString().padStart(6, '0') : 
  environment === STAGING ? (crypto.randomBytes(3).readUIntBE(0, 3) % 1000000).toString().padStart(6, '0') : "111111";

  const otpExpiration = new Date(Date.now() + 5 * 65000); // OTP valid for 5 minute

  let user = await User.findOne({ where: { uuid: id } });

  if (new Date() > new Date(user.otpMaxEntriesExpiration)) {
    const otpMaxEntriesExpiration = new Date(Date.now() + 2 * 60 * 60000); // OTP valid for 2 hours
    user.otpMaxEntries = process.env.MAX_OTP_REQUEST;
    user.otpMaxEntriesExpiration = otpMaxEntriesExpiration;
  }
  const { id: userId, mobile } = user;
  if (!user || user.otpMaxEntries === 0) {
    const msgErr = "You reach the maximum otp request, kindly wait for 2 hours to request new otp";

    await makeLog(
      `The OTP No. ${otp} is failed to re-sent`,
      "authentication",
      "info",
      userId,
      "user",
      'resend OTP Controller'
    );

    return errorResponse(msgErr, reply, "custom");
  }
  const otpMaxEntriesNew = user.otpMaxEntries - 1;

  // await twillio.sendSMS(mobile, reply);

  if (environment === PRODUCTION || environment === STAGING) {
    const otpInstance = new OTP();  
    await otpInstance.sendMsg(mobile, otp, reply);
  }
  
  user.otp = otp;
  user.otpExpiration = otpExpiration;
 // user.otpMaxEntries = otpMaxEntriesNew;
  user = await user.save();

  const payload = {
    data: {
      id: user.uuid,
      mobile,
      countdownSeconds: 300,
    },
  };

  await makeLog(
    `The OTP No. ${otp} is successfully re-sent`,
    "authentication",
    "info",
    userId,
    "user",
    'resend OTP Controller'
  );

  return successResponse(payload, "Resending OTP success", reply);
};

const getAllSites = async (request, reply) => {
  try {
    const sites = await Site.findAll({
      attributes: ["id", "name", "label"],
    });
    return successResponse(
      sites,
      "Get sites is successfully fetched!",
      reply
    );
  } catch (error) {
    return errorResponse(
      `Error on getting Sites: ${error}`,
      reply,
      "custom"
    );
  }
};

const logoutUser = async (request, reply) => { 
  const token = request.body.token;
  const mode = request.body.mode;

  const session = await Session.findOne({where:{ token }})
  const user = await User.findOne({where:{ id: session?.userId}})

  try {
      await PlayerLog.create({
        userId:session?.userId,
        mode,
        type: 'out',
      });

      await User.update({ isActive:false }, 
      {where:{ id: session?.userId }});

      await Session.destroy({
        where: { token }
      });

      await makeLog(
        `${user?.role === 'csr' ? (user?.firstName + " " + user?.lastName + " has successfully logged out.") : user?.uuid + " has successfully logged out."}`,
        `${user?.role === 'csr' ? "CSRActiveStatus" : "authentication"}`,
        "success",
        user?.id,
        "user",
        `${user?.role === 'csr' ? "CSR Logout" : "User Logout"}`
      );

      return successResponse({}, "Logout successful", reply);
    } catch (error) {
      return errorResponse(`Failed to logout: ${error}`, reply, "custom");
    }
};

const resetPasswordForgotPasswordSchema = async (request, reply) => {
  const mobile = request.body.mobile;
  const otpExpiration = new Date(Date.now() + 5 * 68000); // OTP valid for 5 minute
  const otpMaxEntriesExpiration = new Date(Date.now() + 2 * 60 * 60000); // OTP valid for 2 hours

  let user = await User.findOne({ where: { mobile } });

  if (!user) {
    return errorResponse("Your mobile no. is not registered", reply, "custom");
  }

  const { id, uuid } = user;
  const otp = environment === PRODUCTION ? (crypto.randomBytes(3).readUIntBE(0, 3) % 1000000).toString().padStart(6, '0') : 
  environment === STAGING ? (crypto.randomBytes(3).readUIntBE(0, 3) % 1000000).toString().padStart(6, '0') : "111111";

  if (environment === PRODUCTION || environment === STAGING) {
    const otpInstance = new OTP(); 
    await otpInstance.sendMsg(mobile, otp, reply);
  }

  // await twillio.sendSMS(mobile, reply);

  user.otp = otp;
  user.otpExpiration = otpExpiration;
  user.otpMaxEntriesExpiration = otpMaxEntriesExpiration;
  user = await user.save();

  await makeLog(
    `The user ${uuid} was login and an OTP No. ${otp} is sent`,
    "authentication",
    "info",
    id,
    "user",
    'reset Password Forgot Password Schema'
  );

  const payload = {
      id: uuid,
      mobile,
      countdownSeconds: 300,
  };

  return successResponse(
    payload,
    "Mobile No. is now reset, and here's the 1-minute OTP.",
    reply
  );
}

const validateOTPForgotPasswordSchema = async (request, reply) => {
  const id = request.body.id;
  const otp = request.body.otp;

  if (otp === "") {
    return errorResponse("The OTP Field is required!", reply, "custom");
  }
  
  let user = await User.findOne({ where: { uuid:id } });
  const { otp: userOtp, otpExpiration } = user

  // await twillio.verificationCheck(otp, user?.mobile, reply)

  if (!user || userOtp !== otp) {
    return errorResponse("Invalid OTP", reply, "custom");
  }

  if (new Date() > new Date(otpExpiration)) {
    return errorResponse("OTP expired", reply, "custom");
  }


  const payload = {
    password: user?.password
  }

  return successResponse(
    payload,
    "Your OTP is Valid, You can reset your password",
    reply
  );
}

const resendOTPForgotPasswordSchema = async (request, reply) => {
  const id = request.body.id;
  const otp = environment === PRODUCTION ? (crypto.randomBytes(3).readUIntBE(0, 3) % 1000000).toString().padStart(6, '0') : 
  environment === STAGING ? (crypto.randomBytes(3).readUIntBE(0, 3) % 1000000).toString().padStart(6, '0') : "111111";
  const otpExpiration = new Date(Date.now() + 5 * 65000); // OTP valid for 1 minute

  let user = await User.findOne({ where: { uuid:id } });
  if (new Date() > new Date(user.otpMaxEntriesExpiration)) {
    const otpMaxEntriesExpiration = new Date(Date.now() + 2 * 60 * 60000); // OTP valid for 2 hours
    user.otpMaxEntries = process.env.MAX_OTP_REQUEST;
    user.otpMaxEntriesExpiration = otpMaxEntriesExpiration;
  }

  const { id: userId, mobile } = user;
  if (!user || user.otpMaxEntries === 0) {
    const msgErr = "You reach the maximum otp request, kindly wait for 2 hours to request new otp";

    await makeLog(
      `The OTP No. ${otp} is successfully re-sent`,
      "authentication",
      "info",
      userId,
      "user",
      'resendOTPForgotPasswordSchema'
    );

    return errorResponse(msgErr, reply, "custom");
  }

  const otpMaxEntriesNew = user.otpMaxEntries - 1;

  if (environment === PRODUCTION || environment === STAGING) {
    const otpInstance = new OTP();  
    await otpInstance.sendMsg(mobile, otp, reply);
  }

  // await twillio.sendSMS(mobile, reply);

  user.otp = otp;
  user.otpExpiration = otpExpiration;
  // user.otpMaxEntries = otpMaxEntriesNew;
  user = await user.save();

  const payload = {
      id: user.uuid,
      mobile,
      countdownSeconds: 300,
  };

  await makeLog(
    `The OTP No. ${otp} is successfully re-sent`,
    "authentication",
    "info",
    userId,
    "user",
    'resend OTP Forgot Password Schema'
  );

  return successResponse(payload, "Resending OTP success", reply);
}

const newResetPasswordFP = async (request, reply) => {
  const id = request.body.id;
  const passwordReq = request.body.password;

  const hashedPassword = await argon2.hash(passwordReq);
  try {
    await User.update(
      { password:hashedPassword },
      { where: { uuid: id }, }
    );
    const user = await User.findOne({ attributes:["password"], where: { uuid:id } });
    const { password } = user
    return successResponse({ password },`Reset Password Successfully`, reply);
  } catch (error) {
    return errorResponse(`Failed to creating password: ${error}`, reply, "custom");
  }
}

const uploadUserImage = async (request, reply) => {
  const uuid = request.params.id;
  const type = request.params.type;
  const parts = request.files();
  const kycImageType = type === "user" ? "profile-pictures" : "govt-pictures"
  const uploadDir = path.join(storage, 'public', 'uploads', 'images', kycImageType, uuid);

  // Ensure the directory exists
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  
  const user = await User.findOne({
    attributes: ["id","profilePicture", "mobile", "govtPicture", "govtIdPicture"],
    where: { uuid },
  });

  const id = user?.id

  if (!user) {
    return errorResponse("User not found", reply, "custom");
  }

  const { govtIdPicture, govtPicture, profilePicture, mobile } = user;

  if (type === "user") {
    if (profilePicture) {
      const existingFilePath = path.join(uploadDir, profilePicture);

      if (fs.existsSync(existingFilePath)) {
        try {
          fs.unlinkSync(existingFilePath);
        } catch (err) {
          console.error('Error deleting file:', err);
          reply.status(500).send('Failed to delete old image');
          return;
        }
      }
    }

    for await (const part of parts) {
      if (part.file) {
        const fileExtension = part.filename.split(".").pop();

        if (fileExtension !== "jpg" && fileExtension !== "png") {
          return errorResponse("Accept only image", reply, "custom");
        }

        const uniqueFilename = `${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 15)}.${fileExtension}`;
      
        const filePath = path.join(uploadDir, uniqueFilename);

        try {
          await pump(
            part.file,
            fs.createWriteStream(filePath)
          );
        } catch (err) {
          console.error('Error writing file:', err);
          reply.status(500).send('Failed to upload image');
          return;
        }
       
        const payload = { profilePicture: uniqueFilename };
        const logs = findChangedValues({ profilePicture }, payload);

        await makeLog(
          `The user picture id with selfie of ${mobile} has been uploaded. ${logs}`,
          "profile",
          "info",
          id,
          "user"
        );

        await User.update(payload, { where: { uuid } });

        return successResponse(
          uniqueFilename,
          "User user picture uploaded successfully!",
          reply
        );
      }
    }
  } else if (type === "govt") {
    if (govtPicture) {
      const existingFilePath = path.join(uploadDir, govtPicture);

      if (fs.existsSync(existingFilePath)) {
        try {
          fs.unlinkSync(existingFilePath);
        } catch (err) {
          console.error('Error deleting file:', err);
          reply.status(500).send('Failed to delete old image');
          return;
        }
      }
    }

    for await (const part of parts) {
      if (part.file) {
        const fileExtension = part.filename.split(".").pop();
        const uniqueFilename = `${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 15)}.${fileExtension}`;
      
        const filePath = path.join(uploadDir, uniqueFilename);

        try {
          await pump(
            part.file,
            fs.createWriteStream(filePath)
          );
        } catch (err) {
          console.error('Error writing file:', err);
          reply.status(500).send('Failed to upload image');
          return;
        }
       
        const payload = { govtPicture: uniqueFilename };
        const logs = findChangedValues({ govtPicture }, payload);

        await makeLog(
          `The user government id with selfie of ${mobile} has been uploaded. ${logs}`,
          "profile",
          "info",
          id,
          "user"
        );

        await User.update(payload, { where: { uuid } });

        return successResponse(
          uniqueFilename,
          "User government id with selfie uploaded successfully!",
          reply
        );
      }
    }
  } else if (type === "govtIdPic") {
    if (govtIdPicture) {
      const existingFilePath = path.join(uploadDir, govtIdPicture);

      if (fs.existsSync(existingFilePath)) {
        try {
          fs.unlinkSync(existingFilePath);
        } catch (err) {
          console.error('Error deleting file:', err);
          reply.status(500).send('Failed to delete old image');
          return;
        }
      }
    }
 
    for await (const part of parts) {
      // Check if the part is a file
      if (part.file) {
        const fileExtension = part.filename.split(".").pop();
        const uniqueFilename = `${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 15)}.${fileExtension}`;
      
        const filePath = path.join(uploadDir, uniqueFilename);

        try {
          await pump(
            part.file,
            fs.createWriteStream(filePath)
          );
        } catch (err) {
          console.error('Error writing file:', err);
          reply.status(500).send('Failed to upload image');
          return;
        }
       
        const payload = { govtIdPicture: uniqueFilename };
        const logs = findChangedValues({ govtIdPicture }, payload);

        await makeLog(
          `The user government id of ${mobile} has been uploaded. ${logs}`,
          "profile",
          "info",
          id,
          "user"
        );

        await User.update(payload, { where: { uuid } });

        return successResponse(
          payload,
          "User Gov't. id is now uploaded successfully!",
          reply
        );
      }
    }
  }
};

const kycFinish = async (request, reply) => {
  const govtType = request.body.govtType;
  const uuid = request.params.id;
  const user = await User.findOne({
    attributes: ["id"],
    where: { uuid },
  });
  const id = user?.id
  try {
    await User.update(
      {
        govtType
      },
      {
        where: { id },
      }
    );

    const auth = await getAuthtUser(uuid)
    const { session } = request;
    const token = fastify.jwt.sign({ uuid });

    await Session.create({
      userId: user.id,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      token,
    });

    const payload = {
      auth,
      token
    }


    return successResponse(payload, `Finish KYC`, reply);
  } catch (error) {
    return errorResponse(
      `Error generating code and link: ${error}`,
      reply,
      "custom"
    );
  }
};

export default {
  loginMobileController,
  verifyOTPLoginController,
  registerMobileController,
  verfyMobileController,
  verfyMobileOTPController,
  verifyPageMobileOTPController,
  verifyOTPController,
  resendOTPController,
  getAllSites,
  logoutUser,
  resetPasswordForgotPasswordSchema,
  validateOTPForgotPasswordSchema,
  resendOTPForgotPasswordSchema,
  newResetPasswordFP,
  uploadUserImage,
  kycFinish,
};

/* Keep for updating OTP
  let user = await User.findOne({ where: { mobile } });

  // if (!user) {
  // } else {
  //   user.otp = otp;
  //   user.otpExpiration = otpExpiration;
  //   await user
  //     .save()
  //     .then(() => {
  //       //generateOtp(mobile, otp, reply);
  //       return successResponse(otp, "Here's the 1-minute OTP.", reply);
  //     })
  //     .catch((err: FastifyError) => {
  //       return errorResponse(err, reply);
  //     });
  // }

*/
