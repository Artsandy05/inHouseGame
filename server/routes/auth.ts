import schema from "../schema/auth";
import controllers from "../controller/auth";
import schema2 from "../schema/chatSupport";
import controllers2 from "../controller/chatSupport";

async function authRoutes(fastify) {
  // for login page sending otp in game and admin
  fastify.post("/login", {
    schema: schema2.loginSchema,
    handler: controllers2.login,
  });

  fastify.post("/loginV2", {
    schema: schema.loginMobileSchema,
    handler: controllers.loginMobileController,
  });

  // for login verify otp in game and admin
  fastify.post("/login/verifyOTP", {
    schema: schema.verifyOTPSchema,
    handler: controllers.verifyOTPLoginController,
  });

   // for register page sending otp in game and admin
  fastify.post("/register", {
    schema: schema.registerMobileSchema,
    handler: controllers.registerMobileController,
  });

  // for verification page sending otp in game and admin
  fastify.post("/verify", {
    schema: schema.verifyMobileSchema,
    handler: controllers.verfyMobileController,
  });

    // for user profile page verify otp in mobile
  fastify.post("/verifyMobileOTP", {
    schema: schema.verifyMobileOTPSchema,
    handler: controllers.verfyMobileOTPController,
  });

  // for verification page verify otp in game and admin
  fastify.post("/verifyPageMobileOTP", {
    schema: schema.verifyMobileOTPSchema,
    handler: controllers.verifyPageMobileOTPController,
  });

  // for registration verify otp game and admin
  fastify.post("/verifyOTP", {
    schema: schema.verifyOTPSchema,
    handler: controllers.verifyOTPController,
  });

  fastify.post("/resendOTP", {
    schema: schema.resendOTPSchema,
    handler: controllers.resendOTPController,
  });

  fastify.post("/reset-password", {
    schema: schema.resetPasswordForgotPasswordSchema,
    handler: controllers.resetPasswordForgotPasswordSchema,
  });

  fastify.post("/validate-otp-forgot-password", {
    schema: schema.validateOTPForgotPasswordSchema,
    handler: controllers.validateOTPForgotPasswordSchema,
  });

  fastify.post("/resend-otp-forgot-password", {
    schema: schema.resendOTPForgotPasswordSchema,
    handler: controllers.resendOTPForgotPasswordSchema,
  });

  fastify.post("/new-reset-password-fp", {
    schema: schema.newResetPasswordFP,
    handler: controllers.newResetPasswordFP,
  });

  fastify.get("/sites", {
    schema: schema.getAllSites,
    handler: controllers.getAllSites,
  });

  fastify.post("/logout", {
    schema: schema.logoutUser,
    handler: controllers.logoutUser,
  });

  fastify.post("/:id/upload-image/:type", {
    handler: controllers.uploadUserImage,
  });

  fastify.post("/:id/kyc/finish", {
    schema: schema.kycFinish,
    handler: controllers.kycFinish,
  });
}



export default authRoutes;
