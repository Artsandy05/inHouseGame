'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable("users", {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      uuid: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      accountId: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "",
      },
      site: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "",
      },
      siteId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "sites",
          key: "id",
        },
        onUpdate: 'CASCADE', // Optional: specify behavior on update
        onDelete: 'SET NULL', // Optional: specify behavior on delete
      },
      mobile: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: {
          name: "mobile",
          msg: "This mobile is already taken",
        },
        defaultValue: "",
        validate: {
          isPhilippinePhoneNumber(value) {
            const phoneRegex = /^(09|\+639)\d{9}$/;
            if (!phoneRegex.test(value)) {
              throw new Error("Invalid phone number");
            }
          },
        },
      },
      status: {
        type: Sequelize.ENUM(
          "active",
          "deactivated",
        ),
        allowNull: false,
        defaultValue: "active",
      },
      otp: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      passcode: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      firstName: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "",
      },
      lastName: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "",
      },
      nickName: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: {
          name: "nickname",
          msg: "This nickname is already taken",
          ignoreEmpty: true,
        },
        defaultValue: "",
      },
      nickNameExpiration: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      role: {
        type: Sequelize.ENUM(
          "superadmin",
          "admin",
          "supervisor",
          "verifier",
          "superagent",
          "masteragent",
          "agent",
          "operator",
          "moderator",
          "accounting",
          "player",
          "host",
          "csr",
          "auditor",
          "cashier",
          "host_monitoring",
          "treasury"
        ),
        allowNull: false,
        defaultValue: "player",
      },
      referralCodeForSA: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      referralLinkForSA: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      referralCodeForMA: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      referralLinkForMA: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      referralCodeForAgent: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      referralLinkForAgent: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      referralCodeForPlayer: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      referralLinkForPlayer: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      username: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: {
          name: "username",
          msg: "This username is already taken",
          ignoreEmpty: true,
        },
        defaultValue: "",
      },
      email: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: {
          name: "email",
          msg: "This email is already taken",
          ignoreEmpty: true,
        },
        defaultValue: "",
      },
      birthdate: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      placeOfBirth: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      nationalities: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      natureOfWork: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      sourceOfIncome: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      sourceOfIncomeId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "source-of-income",
          key: "id",
        },
        onUpdate: 'CASCADE', // Optional: specify behavior on update
        onDelete: 'SET NULL', // Optional: specify behavior on delete
      },
      gender: {
        type: Sequelize.INTEGER,
        allowNull: false, // Allow null
        defaultValue: 0,
        validate: {
          isIn: [[0, 1, 2]], // Only allow 1 or 2
        },
      },
      address: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      usePresentAddress: {
        type: Sequelize.INTEGER,
        allowNull: false, // Allow null
        defaultValue: 0,
      },
      currentAddressId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "addresses",
          key: "id",
        },
      },
      permanentAddressId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "addresses",
          key: "id",
        },
      },
      profilePicture: Sequelize.STRING,
      govtType: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "0",
      },
      govtId: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "",
      },
      govtPicture: Sequelize.STRING,
      govtIdPicture: Sequelize.STRING,
      password: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      otpExpiration: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      otpMaxEntries: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: process.env.MAX_OTP_REQUEST,
      },
      otpMaxEntriesExpiration: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      isMobileVerified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      isEmailVerified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      actionStatus: {
        type: Sequelize.ENUM(
          "new",
          "forapproval",
          "fordeactive",
          "deactive",
          "approved",
          "deactivate",
          "denied"
        ),
        allowNull: false,
        defaultValue: "new",
      },
      isDenied: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      isSupervisorApproved: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      isVerifierApproved: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      isKYC: {
        type: Sequelize.ENUM(
          "notstarted",
          "forapproval",
          "pending",
          "done",
        ),
        allowNull: false,
        defaultValue: "notstarted",
      },
      isDeactivated: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      supervisorWhoApprove: {
        type: Sequelize.UUID,
        allowNull: true,
        defaultValue: Sequelize.UUIDV4,
      },
      verifierWhoApprove: {
        type: Sequelize.UUID,
        allowNull: true,
        defaultValue: Sequelize.UUIDV4,
      },
      personWhoDeactivated: {
        type: Sequelize.UUID,
        allowNull: true,
        defaultValue: Sequelize.UUIDV4,
      },
      personWhoDenied: {
        type: Sequelize.UUID,
        allowNull: true,
        defaultValue: Sequelize.UUIDV4,
      },
      adminWhoDeactivated: {
        type: Sequelize.UUID,
        allowNull: true,
        defaultValue: Sequelize.UUIDV4,
      },
      adminWhoRestore: {
        type: Sequelize.UUID,
        allowNull: true,
        defaultValue: Sequelize.UUIDV4,
      },
      supervisorApprovedAt: {
        type: Sequelize.DATE,
        defaultValue: null,
        allowNull: true,
      },
      verifierApprovedAt: {
        type: Sequelize.DATE,
        defaultValue: null,
        allowNull: true,
      },
      deniedReason: {
        type: Sequelize.TEXT, // Use TEXT type for long text
        defaultValue: null,
        allowNull: true, // Allow null if needed
      },
      deactivatedReason: {
        type: Sequelize.TEXT, // Use TEXT type for long text
        defaultValue: null,
        allowNull: true, // Allow null if needed
      },
      deactivatedReasonByAdmin: {
        type: Sequelize.TEXT, // Use TEXT type for long text
        defaultValue: null,
        allowNull: true, // Allow null if needed
      },
      restoreReasonByAdmin: {
        type: Sequelize.TEXT, // Use TEXT type for long text
        defaultValue: null,
        allowNull: true, // Allow null if needed
      },
      deniedAt: {
        type: Sequelize.DATE,
        defaultValue: null,
        allowNull: true,
      },
      deactivatedAt: {
        type: Sequelize.DATE,
        defaultValue: null,
        allowNull: true,
      },
      deactivatedAtByAdmin: {
        type: Sequelize.DATE,
        defaultValue: null,
        allowNull: true,
      },
      restoreAtByAdmin: {
        type: Sequelize.DATE,
        defaultValue: null,
        allowNull: true,
      },
      commission: {
        type: Sequelize.DECIMAL(5, 2), // Example: 999.99
        allowNull: true,
      },
      kycAt: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null, // Set default value to null
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: Sequelize.literal(
          "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
        ),
      },
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null, // Set default value to null
      },
      createdBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      isTester: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      isOperatorWithSite: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable("users");
  }
};
