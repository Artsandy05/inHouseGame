import { FindOptions, literal, Op } from "sequelize";
import Promo from "../models/Promo";
import { activatePromo, errorResponse, successResponse } from "../utils/logic";
import UserPromo from "../models/UserPromo";
import { KRLFDRV01, PROMO, UNCLAIMED, VOUCHER } from "../constants";
import User from "../models/User";
import Wallet from "../models/Wallet";
import Transaction from "../models/Transaction";

interface PromosModelAttributes {
    id: number;
    name: string;
    label: string;
    amount: number;
    turnOverMultiplyier: number;
    promoStartedDate: Date;
    promoEndedDate: Date; 
    createdAt: Date; 
    updatedAt: Date; 
}
type PromosAttributes = keyof PromosModelAttributes;

const getPromos = async (request: any, reply: any) => {
    const { page, size, sort, filter } = request.query;

    const [columnName, direction] = sort.split(",");
    const order = [];

    const whereConditions = {};
    const whereConditionUserPromo = {};
    let isUserPromoFiltered = false 
    let options: FindOptions = {};

    whereConditions["type"] = PROMO;

    // if (filter) {
    //   // Split the filter string by '&' to get individual filter conditions
    //   const filterConditions = filter.split("&");

    //   filterConditions.forEach(async (condition) => {
    //     const [columnFilter, valueFilter] = condition.split("=");
    //     const decodedValue = decodeURIComponent(valueFilter);

    //     if (columnFilter === "claimType") {
    //       if(decodedValue === UNCLAIMED){
    //         isUserPromoFiltered = false
    //       }else{
    //         isUserPromoFiltered = true
    //         whereConditionUserPromo["isDeposited"] = true
    //       }
    //     }

    //     if (columnFilter === "userId") {
    //         if(decodedValue === undefined){
    //           whereConditionUserPromo["userId"] = {}
    //         }else{
    //           const userModel = await User.findOne({ attributes:["id"], where: {uuid:decodedValue} })
    //           const { id } = userModel;
    //           if(userModel !== null){
    //             whereConditionUserPromo["userId"] = id
    //           }else{
    //             whereConditionUserPromo["userId"] = {}
    //           }
          
    //         }
    //     }
    //   });
    // }

    options = {
        // include: [
        //     {
        //         model: UserPromo,
        //         // required: isUserPromoFiltered,
        //         // where: whereConditionUserPromo
        //     },
        // ],
        where: whereConditions,
        order: [["id", "ASC"]],
        // offset,
        // limit: size,
        // group: ["id"], // Group by user role
    };  


    const promoModel = await Promo.findAll(options);
    const totalCount = await Promo.count(options);

    const payload = {
        content: promoModel,
        totalCount,
    };

    return successResponse(
        { ...payload },
        "Get Promos is successfuly fetch!",
        reply
    );
}

const getVouchers = async (request: any, reply: any) => {
  const { page, size, sort, filter } = request.query;

  const [columnName, direction] = sort.split(",");
  const order = [];

  let whereConditions = {};
  let options: FindOptions = {};


  if (filter) {
    // Split the filter string by '&' to get individual filter conditions
    const filterConditions = filter.split("&");

    filterConditions.forEach(async (condition) => {
      const [columnFilter, valueFilter] = condition.split("=");
      const decodedValue = decodeURIComponent(valueFilter);
      if (columnFilter === "voucherType") {
        whereConditions["type"] = decodedValue
      }

      if (columnFilter === "voucherName") {
        console.log("#############", decodedValue)
        whereConditions["name"] = literal(`BINARY name = '${decodedValue}'`);
      }
    });
  }

  options = {
    include: [{model: UserPromo}],
      where: whereConditions,
  };  


  const promoModel = await Promo.findAll(options);
  const totalCount = await Promo.count(options);

  const payload = {
      content: promoModel,
      totalCount,
  };

  return successResponse(
      { ...payload },
      "Get Voucher is successfuly fetch!",
      reply
  );
}

const claimPromo = async (request: any, reply: any) => {
  const uuid = request.body.id;
  const promoIdVar = request.body.promoId
  const userModel = await User.findOne({ where: {uuid} })
  const userId = userModel.id
  // const fullName = `${userModel?.firstName} ${userModel.lastName}`

  const promoModel = await UserPromo.findOne({ 
    include:[{
      model: Promo,
      where: { type: PROMO }
    }],
    where: { userId, promoId:promoIdVar, isDeposited:0 } 
  })
  const promo = promoModel?.dataValues
  const promoAmount = Number(promo?.Promo?.amount)

  const walletModel = await Wallet.findOne({ where: { user_id: userId } })

  const walletId = walletModel?.id
  const balance = walletModel?.balance

  if(promo){
    const transaction = await Transaction.new(walletId, null, promoAmount, PROMO, 0, null, balance);
    const updatedBalanceAgent = parseFloat((Number(balance) + Number(promoAmount)).toFixed(2));

    await walletModel.update({ 
      balance:updatedBalanceAgent
    })
    
    await promoModel.update({
      transactionId: transaction.id,
      isDeposited: 1
    })

    const userPromoModel = await UserPromo.findAll({ 
      where: { userId }, 
      include: [{
        model: Promo,
        where: { type: PROMO }
      }],
    })

    const wallet = await Wallet.findOne({ where:{ user_id: userId }})

    const payload = {
      Wallet: wallet,
      UserPromo: userPromoModel
    }

    return successResponse(
      payload,
      "The Promo is successfuly claim!",
      reply
    );
   
  }else{
    return errorResponse("The Promo is failed claim!", reply, "custom");
  }
}

const claimVoucher = async (request: any, reply: any) => {
  const uuid = request.body.id;
  const promoIdVar = request.body.promoId
  const userModel = await User.findOne({ where: {uuid} })
  const userId = userModel.id

  const promoModel = await UserPromo.findOne({ 
    include:[{
      model: Promo,
      where: { type: VOUCHER }
    }],
    where: { userId, promoId:promoIdVar, isDeposited:0 } 
  })

  if(!promoModel){
    await activatePromo(userId, KRLFDRV01)

    const promoModel = await UserPromo.findOne({ 
      include:[{
        model: Promo,
        where: { type: VOUCHER }
      }],
      where: { userId, promoId:promoIdVar } 
    })

    const promoAmount = Number(promoModel?.Promo?.amount)

    const walletModel = await Wallet.findOne({ where: { user_id: userId} })

    const walletId = walletModel?.id
    const balance = walletModel?.balance

    const transaction = await Transaction.new(walletId, null, promoAmount, PROMO, balance);
    const updatedBalanceAgent = parseFloat((Number(balance) + Number(promoAmount)).toFixed(2));

    await walletModel.update({ 
      balance:updatedBalanceAgent
    })
    
    await promoModel.update({
      transactionId: transaction.id,
      isDeposited: 1
    })


    const userPromoModel = await UserPromo.findOne({ 
      where: { userId, promoId: promoIdVar }, 
    })

    const wallet = await Wallet.findOne({ where:{ user_id: userId }})

    const payload = {
      Wallet: wallet,
      UserPromo: userPromoModel
    }

    return successResponse(
      payload,
      "The Voucher Promo is successfuly claim!",
      reply
    );
   
  }else{
    return errorResponse("The Promo is failed claim!", reply, "custom");
  }
}


export default { 
  getPromos,
  getVouchers,
  claimPromo,
  claimVoucher
};
