const getUsers = {
  querystring: {
    type: "object",
    properties: {
      page: { type: "integer", minimum: 0 },
      size: { type: "integer", minimum: 0 },
      sort: { type: "string", pattern: "^[a-zA-Z_]+,(asc|desc)$" },
      filter: { type: "string" },
      status: { type: "string", enum: ["active", "inactive"] },
    },
    required: ["page", "size", "sort"],
  },
  response: {
    200: {
      type: "array",
      items: {
        type: "object",
        properties: {
          uuid: { type: "string", format: "uuid" },
          mobile: { type: "string" },
          gender: { type: "string" },
          birthdate: { type: "string", format: "date" },
          email: { type: "string" },
          address: { type: "string" },
          role: { type: "string" },
          isMobileVerified: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
    },
  },
};

const getAllUsers = {
  querystring: {
    type: "object",
    properties: {
      filter: { type: "string" },
    },
  },
  response: {
    200: {
      type: "object",
      properties: {
        status: { type: "string", default: "API_SUCCESS" },
        data: { type: "object", default: {} },
        message: { type: "string", default: "All User fetch successfully!" },
      },
    },
  },
};

const addUser = {
  body: {
    type: "object",
    properties: {
      mobile: { type: "string" },
      firstName: { type: "string" },
      lastName: { type: "string" },
      gender: { type: "integer" },
      role: { type: "string" },
      username: {
        anyOf: [{ type: "string" }, { type: "null" }],
      },
      password:  {
        anyOf: [{ type: "string" }, { type: "null" }],
      },
      siteId: { type: "integer" },
      isOperatorWithSite:  {
        anyOf: [{ type: "boolean" }, { type: "null" }],
      },
      site: { type: "string" },
      operatorsWithSite:  {
        anyOf: [
        {
          type: "object",
          properties: {
            id: { type: "string" },
            label: { type: "string" },
          },
        }, 
        { type: "null" }
        ],
      },
      userGroups: {
        type: "array",
        items: {
          type: "object",
          properties: {
            fullName: { type: "string" },
            id: { type: "integer" },
          },
        },
      },
    },
    required: ["mobile", "firstName", "lastName", "role"],
  },
  response: {
    200: {
      type: "object",
      properties: {
        status: { type: "string", default: "API_SUCCESS" },
        data: { type: "object", default: {} },
        message: { type: "string", default: "User added successfully!" },
      },
    },
  },
};

const updateUser = {
  params: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" }, // Define id as a UUID string
    },
    required: ["id"],
  },
  body: {
    type: "object",
    properties: {
      mobile: { type: "string" },
      firstName: { type: "string" },
      lastName: { type: "string" },
      email: {
        anyOf: [{ type: "string", format: "email" }, { type: "null" }],
      },
      username: { type: "string" },
      role: { type: "string" },
      userGroups: {
        type: "array",
        items: {
          type: "object",
          properties: {
            fullName: { type: "string" },
            id: { type: "integer" },
          },
          required: ["fullName", "id"],
        },
      },
    },
    required: ["mobile"],
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

const uploadUserImage = {
  params: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" }, // Define id as a UUID string
    },
    required: ["id"],
  },
  body: {
    type: "object",
    properties: {
      image: { type: "string", format: "binary" }, // Use format: 'binary' for file uploads
    },
    required: ["image"],
  },
};

const deactivateUser = {
  params: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" }, // Define id as a UUID string
      adminId: { type: "string", format: "uuid" }, // Define id as a UUID string
      reason: { type: "string" }, // Define id as a UUID string,
      type: { type: "string" }, // Define id as a UUID string
    },
  },
  response: {
    200: {
      type: "object",
      properties: {
        status: { type: "string", default: "API_SUCCESS" },
        data: { type: "object", default: {} },
        message: { type: "string", default: "User deactivate successfully!" },
      },
    },
  },
};

const restoreUser = {
  params: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" }, // Define id as a UUID string
      adminId: { type: "string", format: "uuid" }, // Define id as a UUID string
      reason: { type: "string" }, // Define id as a UUID string,
      type: { type: "string" }, // Define id as a UUID string
    },
  },
  response: {
    200: {
      type: "object",
      properties: {
        status: { type: "string", default: "API_SUCCESS" },
        data: { type: "object", default: {} },
        message: { type: "string", default: "User restore successfully!" },
      },
    },
  },
};

const getUserProfile = {
  response: {
    200: {
      type: "object",
      properties: {
        firstName: { type: "string" },
        lastName: { type: "string" },
        gender: { type: "string" },
        birthdate: { type: "string", format: "date" },
        mobile: { type: "string" },
        email: { type: "string" },
        address: { type: "string" },
      },
    },
  },
};

const getKYCAttempts = {
  querystring: {
    type: "object",
    properties: {
      page: { type: "integer", minimum: 0 },
      size: { type: "integer", minimum: 0 },
      sort: { type: "string", pattern: "^[a-zA-Z_]+,(asc|desc)$" },
      filter: { type: "string" },
    },
    required: ["page", "size", "sort"],
  },
  response: {
    200: {
      type: "object",
      properties: {
        message: {
          type: "string",
          default: "KYC Attempts fetch successfully!",
        },
      },
    },
  },
};

const updateUserProfile = {
  body: {
    type: "object",
    properties: {
      mobile: { type: "string" },
      firstName: { type: "string" },
      lastName: { type: "string" },
      email: {
        anyOf: [{ type: "string", format: "email" }, { type: "null" }],
      },
      gender: {
        anyOf: [{ type: "string" }, { type: "null" }],
      },
      address: {
        anyOf: [{ type: "string" }, { type: "null" }],
      },
      govtType: { type: "string" },
      govtId: { type: "string" },
      sourceOfIncomeId: { type: "integer" },
    },
    required: ["mobile"],
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

const generateReferral = {
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

const kycFinish = {
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

const kycInitialize = {
  body: {
    type: "object",
    properties: {
      docId: { type: "string" },
      docType: { type: "string" },
    },
  },
  response: {
    200: {
      type: "object",
      properties: {
        status: { type: "string", default: "API_SUCCESS" },
        data: { type: "object", default: {} },
        message: { type: "string", default: "KYC initialize successfully!" },
      },
    },
  },
};

const checkResult = {
  body: {
    type: "object",
    properties: {
      bizId: { type: "string" },
    },
  },
  response: {
    200: {
      type: "object",
      properties: {
        status: { type: "string", default: "API_SUCCESS" },
        data: { type: "object", default: {} },
        message: { type: "string", default: "KYC checking result successfully!" },
      },
    },
  },
};

const approveOrDeactiveVerifier = {
  params: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" }, // Define id as a UUID string
    },
  },
  body: {
    type: "object",
    properties: {
      type: { type: "string" },
      reason: {
        anyOf: [{ type: "string" }, { type: "null" }],
      },
    },
    required: ["type"],
  },
  response: {
    200: {
      type: "object",
      properties: {
        status: { type: "string", default: "API_SUCCESS" },
        data: { type: "object", default: {} },
        message: {
          type: "string",
          default: "User Player is successfully approved!",
        },
      },
    },
  },
};

const checkUser = {
  params: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
    },
  },
};

const addCredit = {
  body: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      credit: { type: "string" },
    },
  },
  response: {
    200: {
      type: "object",
      properties: {
        status: { type: "string", default: "API_SUCCESS" },
        data: { type: "object", default: {} },
        message: {
          type: "string",
          default: "User add credit to ${playerName} (player)  successfully!",
        },
      },
    },
  },
};

const getPaymentCards = {
  querystring: {
    type: "object",
    properties: {
      transactionMethod: { type: "string" },
    },
  },
  response: {
    200: {
      type: "object",
      properties: {
        status: { type: "string", default: "API_SUCCESS" },
        data: { type: "object", default: {} },
        message: {
          type: "string",
          default: "The account info is successfuly fetched!",
        },
      },
    },
  },
};

const getOperatorsWithSite = {
  response: {
    200: {
      type: "object",
      properties: {
        status: { type: "string", default: "API_SUCCESS" },
        data: { type: "object", default: {} },
        message: {
          type: "string",
          default: "The operators with site is successfuly fetched!",
        },
      },
    },
  },
};

const getIntialTransaction = {
  response: {
    200: {
      type: "object",
      properties: {
        status: { type: "string", default: "API_SUCCESS" },
        data: { type: "object", default: {} },
        message: {
          type: "string",
          default: "Intial Transaction is successfuly fetched!",
        },
      },
    },
  },
};

const addPaymentCard = {
  body: {
    type: "object",
    properties: {
      paymentType: { type: "string" },
      mobile: { type: "string" },
    },
  },
  response: {
    200: {
      type: "object",
      properties: {
        status: { type: "string", default: "API_SUCCESS" },
        data: { type: "object", default: {} },
        message: {
          type: "string",
          default: "The card is successfuly added!",
        },
      },
    },
  },
};

const authPincode = {
  body: {
    type: "object",
    properties: {
      userId: { type: "string", format: "uuid" }, // Define id as a UUID string
      pincode: { type: "string" },
    },
  },
  response: {
    200: {
      type: "object",
      properties: {
        status: { type: "string", default: "API_SUCCESS" },
        data: { type: "object", default: {} },
        message: {
          type: "string",
          default: "The pincode is successfuly authenticated!",
        },
      },
    },
  },
};



const getBalance = {
  response: {
    200: {
      type: "object",
      properties: {
        balance: { type: "number" },
      },
    },
  },
};

const addBalance = {
  body: {
    type: "object",
    properties: {
      load: { type: "number" },
    },
  },
  response: {
    200: {
      type: "object",
      properties: {
        status: { type: "string", default: "API_SUCCESS" },
        data: { type: "object", default: {} },
        message: { type: "string", default: "User checked successfully!" },
      },
    },
  },
};

const getAllUserGroups = {
  body: {
    type: "object",
    properties: {
      supervisorId: { type: "string", format: "uuid" }, // Define id as a UUID string
    },
  },
  response: {
    200: {
      type: "object",
      properties: {
        fullname: { type: "string" },
        id: { type: "integer" },
        message: {
          type: "string",
          default: "User Options fetch successfully!",
        },
      },
    },
  },
};

const createPasscode = {
  body: {
    type: "object",
    properties: {
      passcode: { type: "string" },
    },
  },
  response: {
    200: {
      type: "object",
      properties: {
        status: { type: "string", default: "API_SUCCESS" },
        data: { type: "object", default: {} },
        message: { type: "string", default: "Creating Passcode successfully!" },
      },
    },
  },
}; 
const currentPasscode = {
  body: {
    type: "object",
    properties: {
      passcode: { type: "string" },
    },
  },
  response: {
    200: {
      type: "object",
      properties: {
        status: { type: "string", default: "API_SUCCESS" },
        data: { type: "object", default: {} },
        message: { type: "string", default: "Current Passcode successfully!" },
      },
    },
  },
}; 
const changePasscode = {
  body: {
    type: "object",
    properties: {
      passcode: { type: "string" },
    },
  },
  response: {
    200: {
      type: "object",
      properties: {
        status: { type: "string", default: "API_SUCCESS" },
        data: { type: "object", default: {} },
        message: { type: "string", default: "Updating Passcode successfully!" },
      },
    },
  },
}; 
const resetPasscode = {
  body: {
    type: "object",
    properties: {
      mobile: { type: "string" },
    },
    required: ["mobile"],
  },
}

const validateOTPPasscode = {
  body: {
    type: "object",
    properties: {
      otp: { type: "string" },
    },
    required: ["otp"],
  },
};

const newResetPasscode = {
  body: {
    type: "object",
    properties: {
      passcode: { type: "string" },
    },
  },
  response: {
    200: {
      type: "object",
      properties: {
        status: { type: "string", default: "API_SUCCESS" },
        data: { type: "object", default: {} },
        message: { type: "string", default: "Creating New Reset Passcode successfully!" },
      },
    },
  },
};

const resendResetPasscodeOtp = {
  response: {
    200: {
      type: "object",
      properties: {
        name: { type: "string" },
        id: { type: "integer" },
        message: {
          type: "string",
          default: "Resend Reset Passcode successfully!",
        },
      },
    },
  },
};

const getUserSessions = {
  querystring: {
    type: "object",
    properties: {
      page: { type: "integer", minimum: 0 },
      size: { type: "integer", minimum: 0 },
      sort: { type: "string", pattern: "^[a-zA-Z_]+,(asc|desc)$" },
      filter: { type: "string" },
    },
    required: ["page", "size", "sort"],
  },
  response: {
    200: {
      type: "object",
      properties: {
        message: {
          type: "string",
          default: "User Sessions fetch successfully!",
        },
      },
    },
  },
};

const getUserSites = {
  response: {
    200: {
      type: "object",
      properties: {
        site: { type: "string" },
        id: { type: "integer" },
        message: {
          type: "string",
          default: "User Sites Options fetch successfully!",
        },
      },
    },
  },
};

const getSourceOfIncome = {
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

const getAllActiveCsr = {
  response: {
    200: {
      type: "object",
      properties: {
        id: { type: 'integer' },
        isActive: {type: "boolean" },
        uuid: { type: "string", format: "uuid" },
        nickName: {type: 'string'},
        firstName: {type: 'string'},
        lastName: {type: 'string'},
        message: {
          type: "string",
          default: "All active users fetched successfully!",
        },
      },
    },
  },
};

const createOrUpdatePassword = {
  body: {
    type: "object",
    properties: {
      password: { type: "string" },
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
        message: { type: "string", default: "Creating New Password successfully!" },
      },
    },
  },
}; 

const resetPassword = {
  body: {
    type: "object",
    properties: {
      mobile: { type: "string" },
    },
    required: ["mobile"],
  },
};

const validateOTP = {
  body: {
    type: "object",
    properties: {
      otp: { type: "string" },
    },
    required: ["otp"],
  },
};

const newResetPassword = {
  body: {
    type: "object",
    properties: {
      password: { type: "string" },
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

const resetMobile = {
  body: {
    type: "object",
    properties: {
      mobile: { type: "string" },
    },
    required: ["mobile"],
  },
};

const validateMobileOTP = {
  body: {
    type: "object",
    properties: {
      otp: { type: "string" },
    },
    required: ["otp"],
  },
};

const newResetMobile = {
  body: {
    type: "object",
    properties: {
      mobile: { type: "string" },
      otp: { type: "string" },
    },
  },
};

const newMobile = {
  body: {
    type: "object",
    properties: {
      mobile: { type: "string" },
    },
  },
  response: {
    200: {
      type: "object",
      properties: {
        status: { type: "string", default: "API_SUCCESS" },
        data: { type: "object", default: {} },
        message: { type: "string", default: "Changing Mobile No. successfully!" },
      },
    },
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

const resendResetPasswordOtp = {
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

const resendNewMobileOTP = {
  response: {
    200: {
      type: "object",
      properties: {
        name: { type: "string" },
        id: { type: "integer" },
        message: {
          type: "string",
          default: "Resend New Mobile successfully!",
        },
      },
    },
  },
};

const getCSRMonitoring = {
  querystring: {
    type: "object",
    properties: {
      filter: { type: "string" },
      page: { type: "integer" },
      size: { type: "integer", minimum: 1 },
      sort: { type: "string" }, // Define 'sort' as a string parameter
    },
    required: ["page", "size"],
  },
  response: {
    200: {
      type: "object",
      properties: {
        status: { type: "string", default: "API_SUCCESS" },
        data: { type: "object", default: {} },
        message: {
          type: "string",
          default: "The CSR List is successfuly fetch!",
        },
      },
    },
  },
};

const getCSRMonitoringLogs = {
  querystring: {
    type: "object",
    properties: {
      filter: { type: "string" },
      page: { type: "integer" },
      size: { type: "integer", minimum: 1 },
      sort: { type: "string" }, // Define 'sort' as a string parameter
    },
    required: ["page", "size"],
  },
  response: {
    200: {
      type: "object",
      properties: {
        status: { type: "string", default: "API_SUCCESS" },
        data: { type: "object", default: {} },
        message: {
          type: "string",
          default: "The CSR Logs is successfuly fetch!",
        },
      },
    },
  },
};

export default {
  getUsers,
  getAllUsers,
  addUser,
  updateUser,
  uploadUserImage,
  deactivateUser,
  restoreUser,
  getUserProfile,
  getKYCAttempts,
  updateUserProfile,
  generateReferral,
  kycFinish,
  kycInitialize,
  checkResult,
  approveOrDeactiveVerifier,
  checkUser,
  getAllUserGroups,
  getBalance,
  addBalance,
  addCredit,
  getPaymentCards,
  getOperatorsWithSite,
  getIntialTransaction,
  addPaymentCard,
  authPincode,

  createPasscode,
  currentPasscode,
  changePasscode,
  resetPasscode,
  validateOTPPasscode,
  newResetPasscode,
  resendResetPasscodeOtp,

  createOrUpdatePassword,
  resetPassword,
  validateOTP,
  resendResetPasswordOtp,
  newResetPassword,

  resetMobile,
  validateMobileOTP,
  newResetMobile,
  newMobile,
  resendNewMobileOTP,
  
  getUserSessions,
  getUserSites,
  getSourceOfIncome,
  getAllActiveCsr,
  getCSRMonitoring,
  getCSRMonitoringLogs
};
