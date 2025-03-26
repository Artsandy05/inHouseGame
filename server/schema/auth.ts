const loginMobileSchema = {
  body: {
    type: "object",
    properties: {
      mobile: { type: "string" },
      password: { type: "string" },
      mode: { type: "string" },
      loginType: { type: "string" },
      username: { type: "string" },
    },
  },
};

const registerMobileSchema = {
  body: {
    type: "object",
    properties: {
      firstName: { type: "string" },
      lastName: { type: "string" },
      birthdate: { type: "string", format: "date" },
      mobile: { type: "string" },
      siteId: { type: "integer" },
    },
    required: ["mobile"],
  },
};

const verifyMobileSchema = {
  body: {
    type: "object",
    properties: {
      mobile: { type: "string" },
    },
    required: ["mobile"],
  },
};

const verifyOTPSchema = {
  body: {
    type: "object",
    properties: {
      id: { type: "string" },
      otp: { type: "string" },
      mode: { type: "string" },
    },
    required: ["id", "otp"],
  },
};

const verifyMobileOTPSchema = {
  body: {
    type: "object",
    properties: {
      id: { type: "string" },
      otp: { type: "string" },
    },
    required: ["id", "otp"],
  },
};

const resendOTPSchema = {
  body: {
    type: "object",
    properties: {
      id: { type: "string" },
    },
    required: ["id"],
  },
};

const getAllSites = {
  response: {
    200: {
      type: "object",
      properties: {
        name: { type: "string" },
        id: { type: "integer" },
        message: {
          type: "string",
          default: "Sites Options fetch successfully!",
        },
      },
    },
  },
};

const logoutUser = {
  body: {
    type: "object",
    properties: {
      mode: { type: "string" },
    },
  },
  response: {
    200: {
      type: "object",
      properties: {
        status: { type: "string", default: "API_SUCCESS" },
        data: { type: "object", default: {} },
        message: { type: "string", default: "User updated successfully!" },
      },
    },
  },
};

const resetPasswordForgotPasswordSchema = {
  body: {
    type: "object",
    properties: {
      mobile: { type: "string" },
    },
    required: ["mobile"],
  },
};

const validateOTPForgotPasswordSchema = {
  body: {
    type: "object",
    properties: {
      otp: { type: "string" },
    },
    required: ["otp"],
  },
};

const resendOTPForgotPasswordSchema = {
  response: {
    200: {
      type: "object",
      properties: {
        name: { type: "string" },
        id: { type: "integer" },
        message: {
          type: "string",
          default: "Resend Reset Password successfully!",
        },
      },
    },
  },
};

const newResetPasswordFP = {
  body: {
    type: "object",
    properties: {
      password: { type: "string" },
      confirm: { type: "string" },
      currentPassword: {
        anyOf: [{ type: "string" }, { type: "null" }],
      },
    },
  },
  response: {
    200: {
      type: "object",
      properties: {
        status: { type: "string", default: "API_SUCCESS" },
        data: { type: "object", default: {} },
        message: { type: "string", default: "Creating New Reset Password successfully!" },
      },
    },
  },
}; 

const kycFinish = {
  body: {
    type: "object",
    properties: {
      govtType: { type: "string" },
    },
    required: ["govtType"],
  },
  response: {
    200: {
      type: "object",
      properties: {
        status: { type: "string", default: "API_SUCCESS" },
        data: { type: "object", default: {} },
        message: { type: "string", default: "User updated kyc successfully!" },
      },
    },
  },
};

export default {
  loginMobileSchema,
  registerMobileSchema,
  verifyMobileSchema,
  verifyOTPSchema,
  verifyMobileOTPSchema,
  resendOTPSchema,
  getAllSites,
  logoutUser,
  resetPasswordForgotPasswordSchema,
  validateOTPForgotPasswordSchema,
  resendOTPForgotPasswordSchema,
  newResetPasswordFP,
  kycFinish
};
