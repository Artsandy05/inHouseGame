

const { DataTypes, Model } = require("sequelize");
const sequelize = require("../../config/forSeeder/database"); // assuming you have a database configuration module using CommonJS

class User extends Model {}

User.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
          },
          uuid: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4,
          },
          accountId: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "",
          },
          site: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "",
          },
          siteId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
              model: "sites",
              key: "id",
            },
          },
          mobile: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: {
              name: "mobile",
              msg: "This mobile is already taken",
            },
            defaultValue: "",
            // validate: {
            //   isPhilippinePhoneNumber(value) {
            //     const phoneRegex = /^(09|\+639)\d{9}$/;
            //     if (!phoneRegex.test(value)) {
            //       throw new Error("Invalid phone number");
            //     }
            //   },
            // },
          },
          status: {
            type: DataTypes.ENUM(
              "active",
              "deactivated",
            ),
            allowNull: false,
            defaultValue: "active",
          },
          otp: {
            type: DataTypes.STRING,
            allowNull: true,
          },
          passcode: {
            type: DataTypes.STRING,
            allowNull: true,
          },
          firstName: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "",
          },
          lastName: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "",
          },
          nickName: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: {
              name: "nickname",
              msg: "This nickname is already taken",
              ignoreEmpty: true,
            },
            defaultValue: "",
          },
          role: {
            type: DataTypes.ENUM(
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
              "player"
            ),
            allowNull: false,
            defaultValue: "player",
          },
          referralCodeForSA: {
            type: DataTypes.STRING,
            allowNull: true,
          },
          referralLinkForSA: {
            type: DataTypes.STRING,
            allowNull: true,
          },
          referralCodeForMA: {
            type: DataTypes.STRING,
            allowNull: true,
          },
          referralLinkForMA: {
            type: DataTypes.STRING,
            allowNull: true,
          },
          referralCodeForAgent: {
            type: DataTypes.STRING,
            allowNull: true,
          },
          referralLinkForAgent: {
            type: DataTypes.STRING,
            allowNull: true,
          },
          username: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: {
              name: "username",
              msg: "This username is already taken",
              ignoreEmpty: true,
            },
            defaultValue: "",
          },
          email: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: {
              name: "email",
              msg: "This email is already taken",
              ignoreEmpty: true,
            },
            defaultValue: "",
          },
          birthdate: {
            type: DataTypes.DATE,
            allowNull: true,
          },
          placeOfBirth: {
            type: DataTypes.STRING,
            allowNull: true,
          },
          nationalities: {
            type: DataTypes.STRING,
            allowNull: true,
          },
          natureOfWork: {
            type: DataTypes.STRING,
            allowNull: true,
          },
          sourceOfIncome: {
            type: DataTypes.STRING,
            allowNull: true,
          },
          sourceOfIncomeId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
              model: "source-of-income",
              key: "id",
            },
          },
          gender: {
            type: DataTypes.INTEGER,
            allowNull: false, // Allow null
            defaultValue: 0,
            validate: {
              isIn: [[0, 1, 2]], // Only allow 1 or 2
            },
          },
          address: {
            type: DataTypes.STRING,
            allowNull: true,
          },
          usePresentAddress: {
            type: DataTypes.INTEGER,
            allowNull: false, // Allow null
            defaultValue: 0,
          },
          currentAddressId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
              model: "addresses",
              key: "id",
            },
          },
          permanentAddressId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
              model: "addresses",
              key: "id",
            },
          },
          profilePicture: DataTypes.STRING,
          govtType: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "0",
          },
          govtId: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "",
          },
          govtPicture: DataTypes.STRING,
          govtIdPicture: DataTypes.STRING,
          password: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "",
          },
          otpExpiration: {
            type: DataTypes.DATE,
            allowNull: true,
          },
          otpMaxEntries: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: process.env.MAX_OTP_REQUEST,
          },
          otpMaxEntriesExpiration: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
          },
          isMobileVerified: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false,
          },
          isEmailVerified: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false,
          },
          actionStatus: {
            type: DataTypes.ENUM(
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
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false,
          },
          isSupervisorApproved: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false,
          },
          isVerifierApproved: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false,
          },
          isKYC: {
            type: DataTypes.ENUM(
              "notstarted",
              "forapproval",
              "pending",
              "done",
            ),
            allowNull: false,
            defaultValue: "notstarted",
          },
          isDeactivated: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false,
          },
          supervisorWhoApprove: {
            type: DataTypes.UUID,
            allowNull: true,
            defaultValue: DataTypes.UUIDV4,
          },
          verifierWhoApprove: {
            type: DataTypes.UUID,
            allowNull: true,
            defaultValue: DataTypes.UUIDV4,
          },
          personWhoDeactivated: {
            type: DataTypes.UUID,
            allowNull: true,
            defaultValue: DataTypes.UUIDV4,
          },
          personWhoDenied: {
            type: DataTypes.UUID,
            allowNull: true,
            defaultValue: DataTypes.UUIDV4,
          },
          adminWhoDeactivated: {
            type: DataTypes.UUID,
            allowNull: true,
            defaultValue: DataTypes.UUIDV4,
          },
          adminWhoRestore: {
            type: DataTypes.UUID,
            allowNull: true,
            defaultValue: DataTypes.UUIDV4,
          },
          supervisorApprovedAt: {
            type: DataTypes.DATE,
            defaultValue: null,
            allowNull: true,
          },
          verifierApprovedAt: {
            type: DataTypes.DATE,
            defaultValue: null,
            allowNull: true,
          },
          deniedReason: {
            type: DataTypes.TEXT, // Use TEXT type for long text
            defaultValue: null,
            allowNull: true, // Allow null if needed
          },
          deactivatedReason: {
            type: DataTypes.TEXT, // Use TEXT type for long text
            defaultValue: null,
            allowNull: true, // Allow null if needed
          },
          deactivatedReasonByAdmin: {
            type: DataTypes.TEXT, // Use TEXT type for long text
            defaultValue: null,
            allowNull: true, // Allow null if needed
          },
          restoreReasonByAdmin: {
            type: DataTypes.TEXT, // Use TEXT type for long text
            defaultValue: null,
            allowNull: true, // Allow null if needed
          },
          deniedAt: {
            type: DataTypes.DATE,
            defaultValue: null,
            allowNull: true,
          },
          deactivatedAt: {
            type: DataTypes.DATE,
            defaultValue: null,
            allowNull: true,
          },
          deactivatedAtByAdmin: {
            type: DataTypes.DATE,
            defaultValue: null,
            allowNull: true,
          },
          restoreAtByAdmin: {
            type: DataTypes.DATE,
            defaultValue: null,
            allowNull: true,
          },
          commission: {
            type: DataTypes.DECIMAL(5, 2), // Example: 999.99
            allowNull: true,
          },
          createdAt: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: null, // Set default value to null
          },
          kycAt: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: null, // Set default value to null
          },
          updatedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: null, // Set default value to null
          },
          deletedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: null, // Set default value to null
          },
          createdBy: {
            type: DataTypes.INTEGER,
            allowNull: true,
          },
      },
      {
        sequelize,
        modelName: "User",
        tableName: "users",
        timestamps: true,
      }
);

module.exports = User;
