import schema from "../schema/user";
import controllers from "../controller/user";

function userRoutes(fastify) {
  fastify.get("/users", {
    schema: schema.getUsers,
    handler: controllers.getUsers,
  });
  fastify.get("/users/all", {
    schema: schema.getAllUsers,
    handler: controllers.getAllUsers,
  });
  fastify.post("/users/userGroups", {
    schema: schema.getAllUserGroups,
    handler: controllers.getAllUserGroups,
  });
  fastify.post("/users/register", {
    schema: schema.addUser,
    handler: controllers.addUser,
  });
  fastify.put("/users/update/:id", {
    schema: schema.updateUser,
    handler: controllers.updateUser,
  });
  fastify.post("/users/:id/upload-image/:type", {
    handler: controllers.uploadUserImage,
  });
  fastify.post("/users/deactivate", {
    schema: schema.deactivateUser,
    handler: controllers.deactivateUser,
  });
  fastify.post("/users/restore", {
    schema: schema.restoreUser,
    handler: controllers.restoreUser,
  });
  fastify.get("/user/admin-profile", {
    schema: schema.getUserProfile,
    handler: controllers.getUserAdminProfile,
  });
  fastify.get("/user/profile", {
    schema: schema.getUserProfile,
    handler: controllers.getUserProfile,
  });
  fastify.put("/user/profile", {
    schema: schema.updateUserProfile,
    handler: controllers.updateUserProfile,
  });
  fastify.get("/user/kyc-attempts", {
    schema: schema.getKYCAttempts,
    handler: controllers.getKYCAttempts,
  });
  fastify.post("/user/generate/referral", {
    schema: schema.generateReferral,
    handler: controllers.generateReferral,
  });
  fastify.post("/user/kyc/finish", {
    schema: schema.kycFinish,
    handler: controllers.kycFinish,
  });
  fastify.post("/user/kyc/initialize", {
    schema: schema.kycInitialize,
    handler: controllers.kycInitialize,
  });
  fastify.post("/user/kyc/checkResult", {
    schema: schema.checkResult,
    handler: controllers.checkResult,
  });
  
  fastify.delete("/user/remove/profile-picture", {
    handler: controllers.removeUserProfilePicture,
  });
  fastify.put("/users/verifier/actions/:id", {
    schema: schema.approveOrDeactiveVerifier,
    handler: controllers.approveOrDeactiveVerifier,
  });
  fastify.get("/users/check/:id", {
    schema: schema.checkUser,
    handler: controllers.checkUser,
  });
  // fastify.post("/users/credit", {
  //   schema: schema.addCredit,
  //   handler: controllers.addCredit,
  // });
  fastify.post("/users/credit-with-file", {
    handler: controllers.sendCreditsWithFile,
  });
  fastify.get("/user/payment/cards", {
    schema: schema.getPaymentCards,
    handler: controllers.getPaymentCards,
  });
  fastify.get("/user/intial/transaction", {
    schema: schema.getIntialTransaction,
    handler: controllers.getIntialTransaction,
  });
  fastify.post("/user/payment/card", {
    schema: schema.addPaymentCard,
    handler: controllers.addPaymentCard,
  });

  fastify.post("/user/payment/pincode", {
    schema: schema.authPincode,
    handler: controllers.authPincode,
  });
  /*
    All the transactions has to happen here
      So that security will just be concentrated here
      Transfer all the database change/transactions here
      As to make the plugin of payment gateway
  */

  // TODO: Create api to get balance
  fastify.get("/user/balance", {
    schema: schema.getBalance,
    handler: controllers.getBalance,
  });

  fastify.put("/user/balance", {
    schema: schema.addBalance,
    handler: controllers.addBalance,
  });
  fastify.post("/user/create/passcode", {
    schema: schema.createPasscode,
    handler: controllers.createPasscode,
  });
  fastify.post("/user/current/passcode", {
    schema: schema.currentPasscode,
    handler: controllers.currentPasscode,
  });
  fastify.put("/user/change/passcode", {
    schema: schema.changePasscode,
    handler: controllers.changePasscode,
  });
  fastify.post("/user/reset/passcode", {
    schema: schema.resetPasscode,
    handler: controllers.resetPasscode,
  });
  fastify.post("/user/validate-otp/passcode", {
    schema: schema.validateOTPPasscode,
    handler: controllers.validateOTPPasscode,
  });
  fastify.post("/user/new-reset-passcode", {
    schema: schema.newResetPasscode,
    handler: controllers.newResetPasscode,
  });
  fastify.post("/user/resend-reset-passcode-otp", {
    schema: schema.resendResetPasscodeOtp,
    handler: controllers.resendResetPasscodeOtp,
  });


  fastify.post("/user/password", {
    schema: schema.createOrUpdatePassword,
    handler: controllers.createOrUpdatePassword,
  });
  fastify.post("/user/reset-password", {
    schema: schema.resetPassword,
    handler: controllers.resetPassword,
  });
  fastify.post("/user/validate-otp", {
    schema: schema.validateOTP,
    handler: controllers.validateOTP,
  });
  fastify.post("/user/new-reset-password", {
    schema: schema.newResetPassword,
    handler: controllers.newResetPassword,
  });
  fastify.post("/user/resend-reset-password-otp", {
    schema: schema.resendResetPasswordOtp,
    handler: controllers.resendResetPasswordOtp,
  });
  
  fastify.post("/user/reset-mobile", {
    schema: schema.resetMobile,
    handler: controllers.resetMobile,
  });
  fastify.post("/user/validate-mobile-otp", {
    schema: schema.validateMobileOTP,
    handler: controllers.validateMobileOTP,
  });
  fastify.post("/user/resend-reset-mobile-otp", {
    schema: schema.resendNewMobileOTP,
    handler: controllers.resendNewMobileOTP,
  });

  fastify.post("/user/new-reset-mobile", {
    schema: schema.newResetMobile,
    handler: controllers.newResetMobile,
  });
  fastify.post("/user/new-mobile", {
    schema: schema.newMobile,
    handler: controllers.newMobile,
  });
  fastify.post("/user/resend-new-mobile-otp", {
    schema: schema.resendNewMobileOTP,
    handler: controllers.resendNewMobileOTP,
  });

  fastify.get("/user/sessions", {
    schema: schema.getUserSessions,
    handler: controllers.getUserSessions,
  });
  fastify.get("/user/sites", {
    schema: schema.getUserSites,
    handler: controllers.getUserSites,
  });

  fastify.get("/user/source-of-income", {
    schema: schema.getSourceOfIncome,
    handler: controllers.getSourceOfIncome,
  });

  fastify.get("/get-all-active-csr", {
    schema: schema.getAllActiveCsr,
    handler: controllers.getAllActiveCsr,
  });

  fastify.get("/user/operators-get-site", {
    schema: schema.getOperatorsWithSite,
    handler: controllers.getOperatorsWithSite,
  });
  fastify.get("/user/csr-monitoring", {
    schema: schema.getCSRMonitoring,
    handler: controllers.getCSRMonitoring,
  });
  fastify.get("/user/csr-monitoring-logs", {
    schema: schema.getCSRMonitoringLogs,
    handler: controllers.getCSRMonitoringLogs,
  });
}



export default userRoutes;
