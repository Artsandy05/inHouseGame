import GameList from "../models/GameList";
import {
  activatePromo,
  capitalizeAll,
  displayMoney,
  errorResponse,
  makeLog,
  makeNotif,
  mobilePH,
  numWithS,
  successResponse
} from "../utils/logic";
import { Op, FindOptions, Sequelize, fn, col } from "sequelize";
import User from "../models/User";
import Transaction from "../models/Transaction";
import Wallet from "../models/Wallet";
import stasherAPI from "../api/stasher";
const moment = require('moment-timezone');

import {
  BANKS,
  BET,
  COMPANY_NAME,
  COMPLETED,
  DEPOSIT,
  errorMessagesQRPH,
  FAIL,
  FAILED,
  GAME,
  GCASH,
  INITIAL,
  KARERA_LIVE,
  PAID,
  PAYMAYA,
  paymentStatusesQRPH,
  PENDING,
  PRODUCTION,
  PROMO,
  QRPH,
  SUCCESS,
  WELCOME_BONUS_PROMO,
  WITHDRAW,
  WITHDRAWAL,
} from "../constants";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
dayjs.extend(utc);

import config from "../config/config";
import Cards from "../models/Cards";
import Game from "../models/Game";
import WinningBall from "../models/WinningBall";
import qrph from "../api/qrph";
import { DepositPaymentRequest, StatusPaymentRequest, WithdrawPaymentRequest } from "../config/types";
import Address from "../models/Address";
import Province from "../models/Province";
import City from "../models/City";
import Barangay from "../models/Barangay";
import TemporaryTransaction from "../models/TemporaryTransaction";
import Merchant from "../models/Merchant";
import UserPromo from "../models/UserPromo";
import MerchantTransaction from "../models/MerchantTransaction";
import Promo from "../models/Promo";
import WinningBets from "../models/WinningBets";
import LoadTransaction from "../models/LoadTransaction";
import LosingBets from "../models/LosingBets";
const environment = process.env.NODE_ENV;
const BASE_URL = config[environment].base_url;
const BE_BASE_URL = `${BASE_URL}/api/v1`;

interface TransactionsModelAttributes {
  id: number;
  wallet_id: number;
  game_id: number;
  amount: number;
  type: string;
  status: string;
  callbackId: string;
  merchantId: string;
  updatedAt: Date;
  createdAt: Date;
}

type TransactionsAttributes = keyof TransactionsModelAttributes;


const getGames = async (request: any, reply: any) => {
  const options: FindOptions = {
    attributes: ["id", "name", "label", "isActive", "isStreaming", "moderatorRoute", "gameRoute", "updatedAt", "createdAt"],
  };
  try {
    const gamesList = await GameList.findAll(options);
    const totalCount = await GameList.count();
    const payload = {
      content: gamesList,
      totalCount,
    };
    return successResponse(
      payload,
      "Get All Games is successfully fetched!",
      reply
    );
  } catch (error) {
    return errorResponse("Games not found", reply, "custom");
  }
};

const addGameDeposit = async (request, reply) => {
  const authid = request.user.id;
  const { credit, creditType, accountNumber } = request.body;
  const isFirstInitialDepositMin500 = credit < 500
  const ICOREPAY_DEPOSIT_MODE = config[environment].icorepay_deposit_mode;

  const transaction = await Transaction.findOne({ 
    attributes:["amount","type"],
    where:{ wallet_id: authid, type: DEPOSIT }, 
    limit:1, 
    order: [['createdAt', 'ASC']] 
  })

  if(!transaction && isFirstInitialDepositMin500){
    return errorResponse(`Minimum deposit amount is ₱500 (for first time deposit)`, reply, "custom");
  }

  const merchant = await Merchant.findOne({ where: { name: creditType }})

  const userModel = await User.findOne({ 
    include:[
      {
        model: Wallet
      },
      {
      model: Address,
      as: "currentAddress",
      attributes: ["street", "zipCode"],
      include: [
        { model: Province, as: "province", attributes: ["id", "name"] },
        { model: City, as: "city", attributes: ["id", "name"] },
        { model: Barangay, as: "barangay", attributes: ["id", "name"] },
      ],
    }
    ],
    where: { id: authid 
  }})

  const temptransaction = await TemporaryTransaction.create({
    wallet_id: userModel.Wallet.id,
    amount: credit,
    type: DEPOSIT,
    status: capitalizeAll(INITIAL),
    callbackId: "",
    merchantId: merchant.id
  });

  const { id, uuid, firstName, lastName, email, mobile, currentAddress, } = userModel
  const street = currentAddress?.street ? `${currentAddress?.street}, ` : ""
  const barangay = currentAddress?.barangay?.name ? `${currentAddress?.barangay?.name}, ` : ""
  const city = currentAddress?.city?.name ? `${currentAddress?.city?.name}, ` : ""
  const province = currentAddress?.province?.name ? `${currentAddress?.province?.name}, ` : ""
  const zipCode = currentAddress?.zipCode ? `${currentAddress?.zipCode} ` : ""

  const fullname = `${firstName} ${lastName}`
  const fulladdress = `${street}${barangay}${city}${province}${zipCode}`
  const fulladdressFiltered = fulladdress === "" ? "-" : fulladdress
  const temporaryTransactionId = temptransaction.id
  const ICOREPAY_PASSWORK = config[environment].icorepay_passwork;
  const ICOREPAY_SERVICE_ID = config[environment].icorepay_service_id;
  const formattedDate = moment(temptransaction.createdAt).unix();
  
  if (creditType === QRPH) {
      const newCredit = Number(credit) * 100

      const mobileTrim = mobilePH(mobile);
      const requestData: DepositPaymentRequest = {
        amount: `${newCredit}`,
        by_method: ICOREPAY_DEPOSIT_MODE,
        callback_url: `${BE_BASE_URL}/transaction/callback`,
        currency: 'PHP',
        customer: {
          account_number: mobileTrim,
          address: fulladdressFiltered,
          email: email || "-",
          name: fullname,
          phone_number: mobileTrim,
          remark: '-'
        },
        merchant: {
          name: COMPANY_NAME
        },
        operation_id: `TEMP${formattedDate}${temporaryTransactionId}`,
        passwork: ICOREPAY_PASSWORK,
        payment_id: `TEMP${formattedDate}${temporaryTransactionId}`,
        return_url: `${BASE_URL}/game/wallet`,
        service_id: ICOREPAY_SERVICE_ID
      };

      const qrphAPI = await qrph.depositQRPHAccount(requestData)
      if (qrphAPI.status === 200) {
        const status = qrphAPI.data?.status;
        const { trans_id, external_id, qr_content, redirect_url, signature, operation_id, operation, request } = qrphAPI.data;
        const merchantTransactionModel = await MerchantTransaction.create({
          temporaryId: temporaryTransactionId,
          operationId: operation_id,
          status: capitalizeAll(INITIAL),
          transId:trans_id,
          externalId:external_id,
          qrContent: qr_content,
          redirectURL: redirect_url,
          signature: signature,
          operation,
          request
        });
        
        if(merchantTransactionModel){
          // Handle different payment statuses
          const paymentStatusMessage = paymentStatusesQRPH[status] || 'Unknown payment status';

          await makeNotif(
            authid,
            `Your deposit request has been successfully submitted!`,
            `Your deposit request for ${displayMoney(credit)} PHP from your GCash account number ${accountNumber} to your Karera Live wallet has been successfully submitted.\n
            Upon approval of this transaction, the funds will be available in your Karera Live wallet balance.`,
            "kyc",
            "info",
            uuid
          );

          await makeLog(
            `User ${id} deposit request has been successfully submitted with a temporary transaction id of ${temporaryTransactionId}`,
            "deposit",
            "info",
            id,
            "transaction",
            'Deposit Successful Submitted'
          );

          const payload = {
            amount: credit,
            trans_id, 
            redirect_url, 
            qr_content, 
            by_method:ICOREPAY_DEPOSIT_MODE
          }
      
          return successResponse(
              { ...payload },
              paymentStatusMessage,
              reply
          );
      }
      
      return errorResponse("something wrong in the server", reply, "custom");
    } else {
      // Handle errors based on the error_code in response
      const errorMessage = errorMessagesQRPH[qrphAPI.error_code || 0] || 'Unknown error occurred';
      return errorResponse(errorMessage, reply, "custom");
    }
  }
};

const getGameTransactionStatus = async (request, reply) => {
  const operationId = request.body.operation_id;
  const ICOREPAY_PASSWORK = config[environment].icorepay_passwork;
  const ICOREPAY_SERVICE_ID = config[environment].icorepay_service_id;

  const requestData = {
    operation_id: operationId,
    passwork: ICOREPAY_PASSWORK,
    service_id: ICOREPAY_SERVICE_ID,
  };

  try {
    const qrphAPI = await qrph.statusQRPHAccount(requestData);
    
    // Check if the status is 200 and return the data
    if (qrphAPI.status === 200) {
      console.log("RESPONSE OF QRPH IN FETCHING STATUS: ", qrphAPI.data);
      
      return successResponse(
        { ...qrphAPI.data },
        "Trying to fetch transaction status",
        reply
      );
    } else {
      // If status is not 200, you can return a generic error message
      return errorResponse("Failed to fetch transaction status", reply, "custom");
    }
  } catch (error) {
    // In case of an error during the API call, return a safe error response
    console.error("Error in fetching QRPH status:", error);
    return errorResponse("An error occurred while fetching transaction status", reply, "custom");
  }
}


const addGameWithdraw = async (request, reply) => {
  const authid = request.user.id;
  const { credit, creditType } = request.body;
  const ICOREPAY_WITHDRAW_MODE = config[environment].icorepay_withdraw_mode;

  const userModel = await User.findOne({ 
    include:[
      {
        model: Wallet
      },
      {
      model: Address,
      as: "currentAddress",
      attributes: ["street", "zipCode"],
      include: [
        { model: Province, as: "province", attributes: ["id", "name"] },
        { model: City, as: "city", attributes: ["id", "name"] },
        { model: Barangay, as: "barangay", attributes: ["id", "name"] },
      ],
    }
    ],
    where: { id: authid 
  }})
  
  const userPromosModel = await UserPromo.findAll({
    where: { userId: authid },
    include: [{
      model: Promo,
      where: { type: PROMO }
    }],
  })

  const transactions = await Transaction.findAll({
    include:[
      { model: WinningBets },
      { model: LosingBets },
    ],
    where: {
      wallet_id: authid,
      type: {
        [Op.in]: ["wonprize", "losebet"],
      },
    }
  })

  let transactionSum = 0

  for (const transaction of transactions){
    if(transaction.type === "losebet"){
      transactionSum += transaction.LosingBet?.betAmount || 0
    }
    if(transaction.type === "wonprize"){
      transactionSum += transaction.WinningBet?.betAmount || 0
    } 
  }


  let getTotalAmount = 0; // Initialize variable to hold the total amount
  for (const userPromo of userPromosModel) {
    const amount = userPromo?.Promo?.amount;
    const turnOverMultiplyier = userPromo?.Promo?.turnOverMultiplyier;
    const turnOverAmount = (Number(amount) * turnOverMultiplyier)

    // this is for getting if there is promo turnover not yet finish
    if(Number(transactionSum) < Number(turnOverAmount)){
      if(userPromo?.isDeposited){
        getTotalAmount += Number(amount); // Shortened syntax
      }
    }
  }

  const balance = Number(userModel?.Wallet?.balance || 0)
  const activePromoAmount = Number(getTotalAmount || 0)
  const balanceNoPromo =  balance - Number(activePromoAmount)
  const isInsufficientBalance = (balance < credit)
  const isInsufficientBalanceNoPromo = activePromoAmount < credit
  const haveActivePromo = activePromoAmount > 0

  const balanceDisplay = displayMoney(balance || 0)

  const balanceNoPromoDisplay = displayMoney(balanceNoPromo || 0)

  if(credit < 200){
    return errorResponse(`Amount must be at least 200`, reply, "custom");
  }

  if(haveActivePromo){
    if(balanceNoPromo < credit){ // ex: balanceNoPromo = 500 | credit = 501 should be wrong
      return errorResponse(`Insufficient balance. You have still active promos that not merit the requirements, read the claimed promo turnover, You only have ₱${balanceNoPromoDisplay} without the promo/s.`, reply, "custom");
    }
  }
  if(isInsufficientBalance){
    return errorResponse(`Insufficient balance. You only have ${balanceDisplay} in your wallet.`, reply, "custom");
  }
  
  // if(isInsufficientBalanceNoPromo){
  //   return errorResponse(`Insufficient balance. You have still active promos that not merit the requirements, read the claimed promo turnover, You only have ₱${balanceNoPromoDisplay} without the promo/s.`, reply, "custom");
  // }else if(isInsufficientBalance){
  //   return errorResponse(`Insufficient balance. You only have ${balanceDisplay} in your wallet.`, reply, "custom");
  // }else{
  
  if (creditType === GCASH || creditType === PAYMAYA) {  
      const merchant = await Merchant.findOne({ where: { name: creditType }})

      const temptransaction = await TemporaryTransaction.create({
        wallet_id: userModel.Wallet.id,
        amount: credit,
        type: WITHDRAWAL,
        status: capitalizeAll(INITIAL),
        callbackId: "",
        merchantId: merchant.id
      });

      
      const { id, uuid, firstName, lastName, email, mobile, currentAddress, } = userModel
      const street = currentAddress?.street ? `${currentAddress?.street}, ` : ""
      const barangay = currentAddress?.barangay?.name ? `${currentAddress?.barangay?.name}, ` : ""
      const city = currentAddress?.city?.name ? `${currentAddress?.city?.name}, ` : ""
      const province = currentAddress?.province?.name ? `${currentAddress?.province?.name}, ` : ""
      const zipCode = currentAddress?.zipCode ? `${currentAddress?.zipCode} ` : ""

      const fullname = `${firstName} ${lastName}`
      const fulladdress = `${street}${barangay}${city}${province}${zipCode}`
      const fulladdressFiltered = fulladdress === "" ? "-" : fulladdress

      const temporaryTransactionId = temptransaction.id
      const ICOREPAY_PASSWORK = config[environment].icorepay_passwork;
      const ICOREPAY_SERVICE_ID = config[environment].icorepay_service_id;
      const formattedDate = moment(temptransaction.createdAt).unix();
      
      const newCredit = Number(credit) * 100

      const mobileTrim = mobilePH(mobile);
      const requestData: WithdrawPaymentRequest = {
        amount: `${newCredit}`,
        by_method: merchant.code,
        callback_url: `${BE_BASE_URL}/transaction/callback`,
        currency: 'PHP',
        customer: {
          account_number: mobileTrim,
          address: fulladdressFiltered,
          email: email || "-",
          // Conditionally set `account_customer_name` or `name`
          [environment === PRODUCTION ? 'name' : 'account_customer_name']: fullname,
          phone_number: mobileTrim,
          remark: '-'
        },
        operation_id: `TEMP${formattedDate}${temporaryTransactionId}`,
        passwork: ICOREPAY_PASSWORK,
        payment_id: `TEMP${formattedDate}${temporaryTransactionId}`,
        return_url: `${BASE_URL}/game/wallet`,
        service_id: ICOREPAY_SERVICE_ID
      };

      const qrphAPI = await qrph.withdrawQRPHAccount(requestData)

      if (qrphAPI.status === 200) {
        //console.log("RESPONSE OF QRPH IN WITHDRAW: ", qrphAPI.data);
        // Check the payment status or return success message
        const status = qrphAPI.data?.status;
        const { trans_id, external_id, qr_content, redirect_url, signature, operation_id, operation, request } = qrphAPI.data;
        const merchantTransactionModel = await MerchantTransaction.create({
            temporaryId: temporaryTransactionId,
            operationId: operation_id,
            status: capitalizeAll(INITIAL),
            transId:trans_id,
            externalId:external_id,
            qrContent: qr_content,
            redirectURL: redirect_url,
            signature: signature,
            operation,
            request
          });
  
        if(merchantTransactionModel){
            // Handle different payment statuses
            const paymentStatusMessage = paymentStatusesQRPH[status] || 'Unknown payment status';

            // Deduct to wallet
            const finalBalance = Number(userModel.Wallet?.balance) - Number(credit);
            await Wallet.update({ balance:finalBalance }, {where: { id: userModel.Wallet.id } })
  
            await makeNotif(
              authid,
              `Your withdrawal request has been successfully submitted!`,
              `Your withdrawal request for ${displayMoney(credit)} PHP from your Karera Live wallet to your GCash account number ${mobileTrim} has been successfully submitted. \n Upon approval of this transaction, the funds will be accessible in your GCash account.`,
              "kyc",
              "info",
              uuid
            );

            await makeLog(
              `User ${id} withdrawal request has been successfully submitted with a temporary transaction id of ${temporaryTransactionId}`,
              "withdrawal",
              "info",
              id,
              "transaction",
              'Withdrawal Successful Submitted'
            );
        
            const payload = {
              amount: credit,
              trans_id, 
              redirect_url, 
              qr_content, 
              by_method:ICOREPAY_WITHDRAW_MODE
            }
        
            return successResponse(
                { ...payload },
                paymentStatusMessage,
                reply
            );
        }
        
        return errorResponse("something wrong in the server", reply, "custom");
      } else {
        // Handle errors based on the error_code in response
        const errorMessage = errorMessagesQRPH[qrphAPI.error_code || 0] || 'Unknown error occurred';
        return errorResponse(errorMessage, reply, "custom");
      }
  } else if (creditType === BANKS) {
    return errorResponse(`Go to Karera Live Info to withdraw`, reply, "custom");
  }
 
};

const sendCredits = async (request, reply) => {
  const authid = request.user.id;
  const uuid = request.body.userId;
  const credit = request.body.credit;

  try {
    const authUser = await User.findOne({
      attributes: [
        "id",
        "uuid",
        "mobile",
        [
          Sequelize.fn(
            "CONCAT",
            Sequelize.col("firstName"),
            " ",
            Sequelize.col("lastName")
          ),
          "loaderName",
        ],
      ],
      include: [
        {
          model: Wallet,
          attributes: ["id", "balance"],
        },
      ],
      where: { id: authid },
    });

    // return successResponse({authbalance: authUser?.Wallet?.balance,credit }, "Balance Updated", reply);
    const user = await User.findOne({
      attributes: [
        "id",
        "uuid",
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
      include: [
        {
          model: Wallet,
          attributes: ["id", "balance"],
        },
      ],
      where: { uuid },
    });
    // @ts-ignore

    if(Number(authUser?.Wallet?.balance) < Number(credit)){
      return errorResponse(`Insufficient balance`, reply, "custom");
    }
    
    const balance:any = Number(user.Wallet.balance) + Number(credit);
    const authBalance:any = Number(authUser.Wallet.balance) - Number(credit);

    const loaderMobile = authUser.get("mobile");
    const playerMobile = user.get("mobile");

    const loaderName =
      authUser.get("loaderName") === " "
        ? loaderMobile
        : authUser.get("loaderName");

    const playerName =
      user.get("playerName") === " " ? playerMobile : user.get("playerName");
  
    await Wallet.update(
      { balance },
      {
        //  @ts-ignore
        attributes: ["balance"],
        where: { id: user.Wallet.id },
      }
    );

    await Wallet.update(
      { balance: authBalance },
      {
        //  @ts-ignore
        attributes: ["balance"],
        where: { id: authUser.Wallet.id },
      }
    );
    
    await LoadTransaction.create({
      transactionType: "load",
      personType: "user",
      targetUserId: user.id,
      sourceUserId: authUser.id,
    }).then(async ({ id: loadTransactionId }) => {
      await Transaction.create({
        wallet_id: user.Wallet.id,
        amount: credit,
        previousBalance: user.Wallet.balance,
        type: "load",
        loadTransactionId,
      })
    })

    await LoadTransaction.create({
      transactionType: "deduct",
      personType: "user",
      targetUserId: authUser.id,
      sourceUserId: authUser.id,
    }).then(async ({ id: deductTransactionId }) => {
      await Transaction.create({
        wallet_id: authUser.Wallet.id,
        amount: credit,
        previousBalance: authUser.Wallet.balance,
        type: "deduct",
        loadTransactionId: deductTransactionId,
      });
    })
   

    const creditsText = displayMoney(credit);

    await makeNotif(
      user.id,
      `You have successfully received ${creditsText}`,
      `${loaderName} has credited your account with ${creditsText}`,
      "transactions",
      "info",
      user.uuid
    );

    await makeNotif(
      authUser.id,
      `You have successfully sent ${creditsText}`,
      `You have successfully credited ${playerName} with ${creditsText}`,
      "transactions",
      "info",
      authUser.uuid
    );

    await makeLog(
      `${loaderName} has successfully sent ${playerName} with ${creditsText}`,
      "user-management",
      "info",
      user.id,
      "user"
    );

    const wallet = await Wallet.findOne({ attributes:["balance"], where:{ id: authUser.Wallet.id}})

    return successResponse(wallet, "Balance Updated", reply);
  } catch (err) {
    return errorResponse(`Error updating balance: ${err}`, reply, "custom");
  }
}

const deductCredits = async (request, reply) => {
  const authid = request.user.id;
  const uuid = request.body.userId;
  const credit = request.body.credit;

  try {
    const authUser = await User.findOne({
      attributes: [
        "id",
        "uuid",
        "mobile",
        [
          Sequelize.fn(
            "CONCAT",
            Sequelize.col("firstName"),
            " ",
            Sequelize.col("lastName")
          ),
          "loaderName",
        ],
      ],
      include: [
        {
          model: Wallet,
          attributes: ["id", "balance"],
        },
      ],
      where: { id: authid },
    });

    const user = await User.findOne({
      attributes: [
        "id",
        "uuid",
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
      include: [
        {
          model: Wallet,
          attributes: ["id", "balance"],
        },
      ],
      where: { uuid },
    });
  // const payload = {
  //   balance:user.Wallet.balance,
  //   credit,
  //   isHigherThanBalance: Number(user.Wallet.balance) < Number(credit)
  // }
  //   return successResponse(payload, "Balance Updated", reply);
    if(Number(user.Wallet.balance) < Number(credit)){
      return errorResponse(`Insufficient balance`, reply, "custom");
    }
    const balance:any = Number(user.Wallet.balance) - Number(credit);

    const loaderMobile = authUser.get("mobile");
    const playerMobile = user.get("mobile");

    const loaderName =
      authUser.get("loaderName") === " "
        ? loaderMobile
        : authUser.get("loaderName");

    const playerName =
      user.get("playerName") === " " ? playerMobile : user.get("playerName");

    await Wallet.update(
      { balance },
      {
        //  @ts-ignore
        attributes: ["balance"],
        where: { id: user.Wallet.id },
      }
    );

    await LoadTransaction.create({
      transactionType: "deduct",
      personType: "user",
      targetUserId: user.id,
      sourceUserId: authUser.id,
    }).then(async ({ id: deductTransactionId }) => {
      await Transaction.create({
        wallet_id: user.id,
        amount: credit,
        previousBalance: user.Wallet.balance,
        type: "deduct",
        loadTransactionId: deductTransactionId,
      });
    })
  
    const creditsText = displayMoney(credit);

    await makeNotif(
      user.id,
      `You have successfully deducted ${creditsText}`,
      `You have successfully deducted ${playerName} with ${creditsText}`,
      "transactions",
      "info",
      user.uuid
    );

    await makeLog(
      `${loaderName} has deducted ${playerName} with ${creditsText}`,
      "transactions",
      "info",
      user.id,
      "user"
    );

    const wallet = await Wallet.findOne({ attributes:["balance"], where:{ id: user.Wallet.id}})

    return successResponse(wallet, "Balance Updated", reply);
  } catch (err) {
    return errorResponse(`Error updating balance: ${err}`, reply, "custom");
  }
}

const getGameTransactions = async (request, reply) => {
  const id = request.user.id;
  //   const userRole = request.userRole;

  const { page, size, sort, filter, status } = request.query;

  const [columnName, direction] = sort && sort.split(",");
  const order = [[columnName, direction.toUpperCase()]] as [
    TransactionsAttributes,
    string
  ][];

  const whereConditions = {};
  const whereWalletConditions = {};

  if (filter) {
    // Split the filter string by '&' to get individual filter conditions
    const filterConditions = filter.split("&");

    filterConditions.forEach((condition) => {
      const [columnFilter, valueFilter] = condition.split("=");
      const decodedValue = decodeURIComponent(valueFilter);

      if (columnFilter === "type") {
        if (decodedValue === GAME) {
          whereConditions[columnFilter] = {
            [Op.or]: [{ [Op.eq]: "bet" }, { [Op.eq]: "wonprize" }],
          };
        } else if (decodedValue === DEPOSIT) {
          whereConditions[columnFilter] = { [Op.eq]: `deposit` };
        } else if (decodedValue === WITHDRAW) {
          whereConditions[columnFilter] = { [Op.eq]: `withdrawal` };
        }
      } else if (columnFilter === "status") {
        if (decodedValue === COMPLETED) {
          whereConditions[columnFilter] = { [Op.like]: `%${SUCCESS}%` };
        } else if (decodedValue === PENDING) {
          const bigCaps = INITIAL.toUpperCase();
          whereConditions[columnFilter] = { [Op.like]: `%${bigCaps}%` };
        } else if (decodedValue === FAILED) {
          const bigCaps = decodedValue.toUpperCase();
          whereConditions[columnFilter] = { [Op.like]: `%${bigCaps}%` };
        }
      } else if (columnFilter === "filterRangeDate") {
        const [startDate, endDate] = decodedValue.split(",");
        const startDateTime = `${startDate} 00:00:00`;
        const endDateDateTime = `${endDate} 23:59:59`;
        whereConditions["createdAt"] = {
          [Op.between]: [startDateTime, endDateDateTime],
        };
      } else if (columnFilter === "last30days") {
        if (decodedValue === "1") {
          const startDate = dayjs()
            .subtract(30, "day")
            .startOf("day")
            .format("YYYY-MM-DD");

          const endDate = dayjs().format("YYYY-MM-DD");

          const startDateTime = `${startDate} 00:00:00`;
          const endDateDateTime = `${endDate} 23:59:59`;

          whereConditions["createdAt"] = {
            [Op.between]: [startDateTime, endDateDateTime],
          };
        }
      } else if (columnFilter === "last7days") {
        if (decodedValue === "1") {
          const startDate = dayjs()
            .subtract(7, "day")
            .startOf("day")
            .format("YYYY-MM-DD");

          const endDate = dayjs().format("YYYY-MM-DD");

          const startDateTime = `${startDate} 00:00:00`;
          const endDateDateTime = `${endDate} 23:59:59`;

          whereConditions["createdAt"] = {
            [Op.between]: [startDateTime, endDateDateTime],
          };
        }
      } else {
        whereConditions[columnFilter] = { [Op.like]: `%${decodedValue}%` };
      }
    });
  }

  //  @ts-ignore
  whereWalletConditions["user_id"] = id;
  const newPage = page === 1 ? 0 : page > 1 ? page - 1 : page;
  const offset = newPage * size;
  const options: FindOptions = {
    //  @ts-ignore
    attributes: [
      "id",
      "uuid",
      "wallet_id",
      [
        Sequelize.literal(
          `(SELECT zodiac FROM bets AS Bets WHERE Bets.game_id = Transaction.game_id and Bets.transaction_id = Transaction.id)`
        ),
        "betOn",
      ],
      "game_id",
      "amount",
      "type",
      "status",
      "previousBalance",
      "callbackId",
      "merchantId",
      "createdAt",
      "updatedAt",
    ] as TransactionsAttributes[],
    include: [
      {
        model: Wallet,
        attributes: ["user_id", "balance"],
        include: [
          {
            model: User,
            attributes: ["uuid"],
          }
        ],
        where: whereWalletConditions,
      },
      {
        model: Merchant,
        attributes: ["label"],
      },
      {
        model: TemporaryTransaction,
        attributes: ["id"],
        include: [
          {
            model: MerchantTransaction,
            attributes: ["id","providerMethod"],
            required: false,
            where: { status: "SUCCESS" }
          },
        ]
      },
      {
        model: Game,
        attributes: ["name"], // Fetch the game name
        as: 'game', // This alias should match the association name
        include: [
          {
            model: WinningBall,
            attributes: ["gamesId","zodiac"],
          }
        ],
      },
      {
        model: WinningBets,
        attributes: ["ball", "betAmount"],
      },
      {
        model: LosingBets,
        attributes: ["ball", "betAmount"],
      }
    ],
    where: whereConditions,
    offset,
    limit: size,
  };

  // Now you can safely check if "updatedAt" is a valid attribute
  if (
    columnName === "updatedAt" &&
    ("updatedAt" as keyof TransactionsModelAttributes)
  ) {
    order.push(["updatedAt", direction.toUpperCase()]);
    order.push(["createdAt", direction.toUpperCase()]); // Secondary sort by createdAt
  }

  options.order = order;
  const transactions = await Transaction.findAll(options);
  const totalCount = await Transaction.count(options);
  const payload = {
    content: transactions,
    totalCount,
  };

  if (transactions) {
    return successResponse(
      payload,
      "Get All Transactions is successfully fetched!",
      reply
    );
  } else {
    return errorResponse("Transactions not found", reply, "custom");
  }
};

const getTransactionCallback = async (request, reply) => {
  const requestBody = request.body;
  // writeFile("payment-callback-response.txt", JSON.stringify(requestBody));
  if (!requestBody) {
    reply.code(500).send({ message: "The request transaction is invalid" });
  }

  const {
    trans_id, external_id, provider_id, provider_name, 
    operation_id, payment_method, currency, fee_amount,
    signature, operation, request: requestParam, amount:merchantAmount, customer
  } = requestBody;

  const merchantTransaction = await MerchantTransaction.findOne({
    where: { operationId: operation_id },
  });

  const existingTransaction = await TemporaryTransaction.findOne({
    attributes: ["id","wallet_id", "amount", "type", "merchantId", "status"],
    where: { id: merchantTransaction.temporaryId },
  });

  /* Old 
  try {
    const decodedToken = app.jwt.verify(clientNotes);

    if (!decodedToken) {
      reply.code(401).send({ message: "Invalid token" });
    }
  End Old */


  // Updated 
  const { id:tempId, wallet_id, amount, type, merchantId, status } = existingTransaction;

  if(status === capitalizeAll(SUCCESS) || status === capitalizeAll(FAIL)){
    reply.code(500).send({ message: "The transaction is already executed" });
  }else{
    if (type === DEPOSIT) {
      const userWallet = await Wallet.findOne({
        include:[{
          model:User
        }],
        attributes: ["balance"],
        where: { id: wallet_id },
      });

      const { balance } = userWallet;

      const mobile = userWallet.User.mobile
      const phoneNumber = mobilePH(mobile);
      const uuid = userWallet.User.uuid 
      const userId = userWallet.User.id 

      if(operation.status === PAID){
        await MerchantTransaction.create({
          temporaryId:tempId,
          amount:merchantAmount,
          status: capitalizeAll(SUCCESS),
          operationId:operation_id,
          transId:trans_id,
          externalId:external_id,
          providerId:provider_id,
          providerName:provider_name,
          providerMethod:payment_method,
          currency,
          fee_amount,
          signature,
          operation,
          request:requestParam
        });
        

        const transactionModel = await Transaction.create({
          wallet_id,
          amount,
          type,
          status: capitalizeAll(SUCCESS),
          merchantId,
          callbackId: "",
          temporaryId:tempId,
          previousBalance:balance
        });
        const transactionId = transactionModel?.id

        existingTransaction.update({
          status: capitalizeAll(SUCCESS),
        }) 

        const finalBalance = Number(balance) + Number(amount);

        const [affectedCount] = await Wallet.update(
          { balance: finalBalance },
          { where: { id: wallet_id } }
        );
  
        if (affectedCount > 0) {
          await makeNotif(
            userId,
            `Your deposit request has been successfully processed!`,
            `You have deposited an amount of ${displayMoney(amount)} from your GCash account number ${phoneNumber} to your Karera Live wallet.
            \n This transaction has been completed successfully, and the funds should be added to your Karera Live wallet shortly.
            \n Pulsuhan na ang bola mo! Baka ikaw na ang susunod na manalo ng limpak-limpak na papremyo!`,
            "transactions",
            "info",
            uuid
          );

          await makeLog(
            `User ${userId} deposit request has been successfully processed with a transaction id of  ${transactionId}`,
            "deposit",
            "info",
            userId,
            "transaction",
            'Deposit Successful Processed!'
          );
          
          const transactionModel = await Transaction.findOne({
            where: { wallet_id, type: DEPOSIT }, 
            order: [['createdAt', 'ASC']] 
          });

          const transFirst = transactionModel?.amount
          if(Number(transFirst) >= 500){
             await activatePromo(userId, WELCOME_BONUS_PROMO)
          }
        } 
      }

    } else if (type === WITHDRAWAL) {
      const userWallet = await Wallet.findOne({
        include:[{
          model:User
        }],
        attributes: ["balance"],
        where: { id: wallet_id },
      });

      const balance = userWallet?.balance

      const mobile = userWallet.User.mobile
      const phoneNumber = mobilePH(mobile);
      const uuid = userWallet.User.uuid 
      const userId = userWallet.User.id 

      if(operation.status === PAID){
        await MerchantTransaction.create({
          temporaryId:tempId,
          amount:merchantAmount,
          status: capitalizeAll(SUCCESS),
          operationId:operation_id,
          transId:trans_id,
          externalId:external_id,
          providerId:provider_id,
          providerName:provider_name,
          providerMethod:payment_method,
          currency,
          fee_amount: fee_amount ? fee_amount : 0,
          signature,
          operation,
          request:requestParam
        });

        const transactionModel = await Transaction.create({
          wallet_id,
          amount,
          type,
          status: capitalizeAll(SUCCESS),
          merchantId,
          callbackId: "",
          temporaryId:tempId,
          previousBalance:balance
        });
        const transactionId = transactionModel?.id

        existingTransaction.update({
          status: capitalizeAll(SUCCESS),
        }) 

        // const finalBalance = Number(balance) - Number(amount);

        // const [affectedCount] = await Wallet.update(
        //   { balance: finalBalance },
        //   { where: { id: wallet_id } }
        // );

        if (transactionModel) {
          await makeNotif(
            userId,
            `Your withdrawal request has been successfully processed!`,
            `You have withdrawn ${displayMoney(amount)} from your Karera Live wallet and transferred it to your GCash account number ${phoneNumber} \n\n The transaction has been completed successfully, and the funds should soon be available in your GCash account shorty.
            \n Subukan ang swerto mo.
            \n Mag-Bet at manalo.`,
            "transactions",
            "info",
            uuid
          );

          await makeLog(
            `User ${userId} withdrawal request has been successfully processed with a transaction id of  ${transactionId}`,
            "withdrawal",
            "info",
            userId,
            "transaction",
            'Withdrawal Successfull Processed!'
          );
        }
      }else if(operation.status === FAIL){
        await MerchantTransaction.create({
          temporaryId:tempId,
          amount:merchantAmount,
          status: capitalizeAll(FAIL),
          operationId:operation_id,
          transId:trans_id,
          externalId:external_id,
          providerId:provider_id,
          providerName:provider_name,
          providerMethod:payment_method,
          currency,
          fee_amount: fee_amount ? fee_amount : 0,
          signature,
          operation,
          request:customer
        });

        const transactionModel = await Transaction.create({
          wallet_id,
          amount,
          type,
          status: capitalizeAll(FAIL),
          merchantId,
          callbackId: "",
          temporaryId:tempId,
          previousBalance:balance
        });
        const transactionId = transactionModel?.id

         await Transaction.create({
          wallet_id,
          amount,
          type:"refund",
          status: capitalizeAll(SUCCESS),
          callbackId: "",
          temporaryId:tempId,
          previousBalance:balance
        });

        existingTransaction.update({
          status: capitalizeAll(FAIL),
        }) 

        const finalBalance = Number(balance) + Number(amount);

        const [affectedCount] = await Wallet.update(
          { balance: finalBalance },
          { where: { id: wallet_id } }
        );

        if (transactionModel) {
          await makeNotif(
            userId,
            `Your withdrawal request has been failed!`,
            `We had an issue processing your withdrawal, but don't worry your credit wallet is safe,
             We refunded your ${displayMoney(amount)} credit to your wallet.
            \n Check your wallet balance, If the refund proccess is successful.
            \n If you encounter an issue, contact our customer support. and we will gladly to assist you`,
            "transactions",
            "info",
            uuid
          );

          await makeLog(
            `User ${userId} withdrawal request has been fail to processed with a transaction id of  ${transactionId}`,
            "withdrawal",
            "info",
            userId,
            "transaction",
            'Withdrawal Fail Processed!'
          );
        }
      }
    }
  }

 
  // End Updated

   
};


const getGameOffering = async (request: any, reply: any) => {
  const { page, size, sort, filter, status } = request.query;

  type Filters = {
    keywords?: string;
  };
  
  interface GameOfferingModelAttributes {
    id: number;
    name : string;
    label: string;
    isActive: boolean;
    banner: string;
    updatedAt: Date;
    createdAt: Date;
  }
  
  type GameOfferingAttributes = keyof GameOfferingModelAttributes;
    // Default sort order
    let order: [GameOfferingAttributes, string][] = [];

    if (sort) {
      const [columnName, direction] = sort.split(",");
      if (columnName && direction) {
        order.push([columnName as GameOfferingAttributes, direction.toUpperCase()]);
      }
    }
    
    const whereConditions: { [key: string]: any } = {};

    if (filter) {
    const filterConditions = filter.split("&");

    filterConditions.forEach((condition) => {
      const [column, value] = condition.split("=");
      const decodedValue = decodeURIComponent(value);
      
      if (column === "createdAt") {
        const [startDateTime, endDateTime] = decodedValue.split(",");
        whereConditions["createdAt"] = {
          [Op.between]: [startDateTime, endDateTime],
        };
      } else {
        whereConditions[column] = { [Op.like]: `%${decodedValue}%` };
      }
    });
  }

    const offset = Number(page) * Number(size);
    const options: FindOptions = {
      //  @ts-ignore
      attributes: [
        "id",
        "name",
        "label",
        "isActive",
        "banner",
        "createdAt",
        "updatedAt",
      ] as GameOfferingModelAttributes[],
      where: whereConditions,
      offset,
      limit: size,
    };

    // Add ordering for 'updatedAt' if needed
    if (order.some(([column]) => column === "updatedAt")) {
      order.push(["createdAt", "ASC"]); // Secondary sort by createdAt
    }

    options.order = order;

    try {
      const gamesList = await GameList.findAll(options);
      const totalCount = await GameList.count(options);

      const payload = {
        content: gamesList,
        totalCount,
      };

      return successResponse(
        payload,
        "Get All Game offering is successfully fetched!",
        reply
      );
    
    } catch (error) {
      return errorResponse("Failed to fetch game offerings", reply, "custom");
    }
  }


  const updateGameOffering = async (request, reply) => {
    const id = request.params.id; // Get user ID from URL params
    const { isActive, label } = request.body;

    try {
      await GameList.update({ isActive, label }, { where: { id } })

        const gameOffering = await GameList.findOne({
          attributes: [
              "id",
              "name",
              "label",
              "isActive",
              "banner",
              "createdAt",
              "updatedAt"
            ],
          where: { id },
        });
      
      return successResponse(gameOffering, "Game  updated successfully!", reply);
    } catch (error) {
      return errorResponse("Failed to fetch game offerings", reply, "custom");
    }
};



export default {
  getGames,
  addGameDeposit,
  addGameWithdraw,
  sendCredits,
  deductCredits,
  getGameTransactionStatus,
  getGameTransactions,
  getTransactionCallback,
  getGameOffering,
  updateGameOffering,
};
