const dayjs = require("dayjs");
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid'); // Import the v4 method from uuid
const Site = require("../models/forSeederModel/Site")
const User = require("../models/forSeederModel/User")
const { 
  generateRandomNameWithGender,
  generateRandomNameWithGenderForHostProfile,
  generateRoles,
  generateRoleForHostProfile,
  generateMobileNo,
  generateMobileNoForHostProfile,
  generateEmails,
  generateEmailsForHostProfile,
  generateBirthdates,
  generateBirthdatesForHostProfile,
  generateRandomBoolean,
  generateHostProfile,
  generateHostHobbies,
  generateAssetsImagesWithUserId
 } = require("../utils/seedDataFields/index");
const HostProfile = require("../models/forSeederModel/HostProfile");
const argon2 = require('argon2');

const LOCAL = "local";
const environment = process.env.NODE_ENV || "local";
const storage = `${environment !== LOCAL ? "./dist/server" : "."}`;

const getSite = async () => {
  const site = await Site.findOne({
    attributes: ["id"],
    where: { id: 1 } 
  });
  const { id:siteId } = site
  return siteId
}

const generatingRecords = async () => {
  const siteId = await getSite()
  const roles = generateRoles();
  const mobileNos = generateMobileNo();
  const emails = generateEmails();
  const birthdates = generateBirthdates();

  const minLength = Math.min(roles.length, mobileNos.length);
  const records = [];

  const modLimit = 3; // Limit to 3 moderators
  let modCount = 0; // Moderator count tracker
  const hashedPassword = await argon2.hash("asdasdA1!");

  for (let i = 0; i < minLength; i++) {
    const { firstName, lastName, gender } = generateRandomNameWithGender();
    const boolean = generateRandomBoolean();

    let modUsername = null;
    let modPassword = null;

    if (roles[i] === "moderator" && modCount < modLimit) {
      modCount++; // Increment the count for each moderator

      // Assign specific usernames and passwords to the first 3 moderators
      modUsername = `testmod0${modCount}`; // Username will be testmod01, testmod02, etc.
      modPassword = hashedPassword; // Assign the predefined hashed password
    }

      records.push({
        uuid: uuidv4(),
        accountId: "",
        site:"",
        siteId: siteId || 0,
        mobile: mobileNos[i],
        status: "active",
        otp: "111111",
        passcode: null,

        firstName,
        lastName,
        nickName: `${firstName}${i}`,
        role: roles[i],

        referralCodeForSA: null,
        referralLinkForSA: null,
        referralCodeForMA: null,
        referralLinkForMA: null,
        referralCodeForAgent: null,
        referralLinkForAgent: null,

        username: modUsername,
        password: modPassword,
        email: emails[i],
        birthdate: birthdates[i],
        placeOfBirth: null,
        nationalities: null,
        natureOfWork: null,
        sourceOfIncome: null,
        sourceOfIncomeId: null,

        gender,
        address: null,

        usePresentAddress: 0,
        currentAddressId: null,
        permanentAddressId: null,

        profilePicture: null,
        govtType: 0,
        govtId: "",
        govtPicture: null,
        govtIdPicture: null,
        otpExpiration: dayjs().add(1, 'minute').format("YYYY-MM-DD HH:mm:ss"),
        otpMaxEntries: 25,
        otpMaxEntriesExpiration: dayjs().add(1, 'day').format("YYYY-MM-DD HH:mm:ss"),
        isMobileVerified: 1,
        isEmailVerified: Number(boolean),
        actionStatus: "new",
        isDenied: 0,
        isSupervisorApproved: 0,
        isVerifierApproved: 0,
        isKYC: "notstarted",
        isDeactivated: 0,
        supervisorWhoApprove: null,
        verifierWhoApprove: null,
        personWhoDeactivated: null,
        personWhoDenied: null,
        supervisorApprovedAt: null,
        verifierApprovedAt: null,
        deniedReason: null,
        deactivatedReason: null,
        deniedAt: null,
        deactivatedAt: null,
        commission: null,
        createdAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
        updatedAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
        deletedAt: null,
        createdBy: null,
        deactivatedReasonByAdmin: null,
        deactivatedAtByAdmin: null,
        adminWhoRestore: null,
        restoreReasonByAdmin: null,
        restoreAtByAdmin: null,
      });
  }
  return records;
};

const generatingRecordsHostProfileViaUser = async () => {
  const siteId = await getSite()
  const roles = generateRoleForHostProfile();
  const mobileNos = generateMobileNoForHostProfile();
  const emails = generateEmailsForHostProfile();
  const birthdates = generateBirthdatesForHostProfile();

  const minLength = Math.min(roles.length, mobileNos.length);
  const records = [];


  // Example usage within your loop
  for (let i = 0; i < minLength; i++) {
    const { firstName, lastName, gender } = generateRandomNameWithGenderForHostProfile();
    const boolean = generateRandomBoolean();

    records.push({
      uuid: uuidv4(),
      accountId: "",
      site: "",
      siteId: siteId || 0,
      mobile: mobileNos[i],
      status: "active",
      otp: "111111",
      passcode: null,

      firstName,
      lastName,
      nickName: `${firstName}${i}`,
      role: roles[i],

      referralCodeForSA: null,
      referralLinkForSA: null,
      referralCodeForMA: null,
      referralLinkForMA: null,
      referralCodeForAgent: null,
      referralLinkForAgent: null,

      username: null,
      email: emails[i],
      birthdate: birthdates[i],
      placeOfBirth: null,
      nationalities: null,
      natureOfWork: null,
      sourceOfIncome: null,
      sourceOfIncomeId: null,

      gender,
      address: null,

      usePresentAddress: 0,
      currentAddressId: null,
      permanentAddressId: null,

      profilePicture: null,
      govtType: 0,
      govtId: "",
      govtPicture: null,
      govtIdPicture: null,
      password: null,
      otpExpiration: dayjs().add(1, 'minute').format("YYYY-MM-DD HH:mm:ss"),
      otpMaxEntries: 25,
      otpMaxEntriesExpiration: dayjs().add(1, 'day').format("YYYY-MM-DD HH:mm:ss"),
      isMobileVerified: 1,
      isEmailVerified: Number(boolean),
      actionStatus: "new",
      isDenied: 0,
      isSupervisorApproved: 0,
      isVerifierApproved: 0,
      isKYC: "notstarted",
      isDeactivated: 0,
      supervisorWhoApprove: null,
      verifierWhoApprove: null,
      personWhoDeactivated: null,
      personWhoDenied: null,
      supervisorApprovedAt: null,
      verifierApprovedAt: null,
      deniedReason: null,
      deactivatedReason: null,
      deniedAt: null,
      deactivatedAt: null,
      commission: null,
      createdAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
      updatedAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
      deletedAt: null,
      createdBy: null,
      deactivatedReasonByAdmin: null,
      deactivatedAtByAdmin: null,
      adminWhoRestore: null,
      restoreReasonByAdmin: null,
      restoreAtByAdmin: null,
    });
  }

  
  return records;
};

const generatingRecordsHostProfile = async () => {
  try {
    const users = await User.findAll({
      attributes: ["id"], 
      where: {
        role: "host"
      },
      order: [["id", "ASC"]],
    });

    let hostProfile = [];

    const hostProfileStatic = generateHostProfile()
    // Create a map for static profiles for quick lookup
    const hostProfileMap = new Map(hostProfileStatic.map(profile => [profile.userId, profile]));

    for (const user of users) {
      const profile = hostProfileMap.get(user.id);
      if (profile) {
        hostProfile.push({ ...profile, userId: user.id });
      }
    }

    return hostProfile;
  } catch (error) {
    console.error("Error generating hostHobby records:", error);
    throw error;
  }
}

const generatingRecordsHostHobbies = async () => {
  try {
    const hostProfiles = await HostProfile.findAll({
      attributes: ["id"], 
      order: [["id", "ASC"]],
    });

    const hostProfileHobbiesStatic = generateHostHobbies()
    
    // Create a map for host profiles to easily find their IDs
    const hostProfileMap = new Map(hostProfiles.map((profile, index) => [index + 1, profile.id]));

    // Group hobbies by hostProfileId using the mapped host profile IDs
    const groupedHobbies = hostProfileHobbiesStatic.reduce((acc, { hostProfileId, hobbyId }) => {
      const profileId = hostProfileMap.get(hostProfileId);
      if (profileId) {
        const existingGroup = acc.find(item => item.hostProfileId === profileId);
        if (existingGroup) {
          existingGroup.hobbies.push(hobbyId);
        } else {
          acc.push({ hostProfileId: profileId, hobbies: [hobbyId] });
        }
      }
      return acc;
    }, []);

    // Flatten the result to match the desired output structure
    const hostHobbiest = groupedHobbies.flatMap(({ hostProfileId, hobbies }) =>
      hobbies.map(hobbyId => ({ hostProfileId, hobbyId }))
    );

    return hostHobbiest;
  } catch (error) {
    console.error("Error generating hostHobby records:", error);
    throw error;
  }
}

const generatingRecordsWallet = async () => {
  try {
    const users = await User.findAll();
    const wallets = users.map(user => ({
      user_id: user.id,
      balance: 0,
    }));
    return wallets;
  } catch (error) {
    console.error("Error generating wallet records:", error);
    throw error;
  }
}

const generatingRecordsHostProfilePicture = async () => {
  const assetsImagesWithUserId  = generateAssetsImagesWithUserId()
  const sourceDir = path.join(storage, 'assets', 'images');

  for (const asset of assetsImagesWithUserId) {
    const { userId, image } = asset;

    if (!image) continue;

    const user = await User.findOne({
      attributes: ["profilePicture", "mobile", "govtPicture", "govtIdPicture", "uuid"],
      where: { id: userId },
    });

    if (!user) {
      console.error(`User with ID ${userId} not found`);
      continue;
    }

    const { profilePicture, uuid } = user;

    const uploadDir = path.join(storage, 'public', 'uploads', 'images', "profile-pictures", uuid);

    // Ensure the directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Check if there's an existing file and remove it
    if (profilePicture) {
      const existingFilePath = path.join(uploadDir, profilePicture);
      if (fs.existsSync(existingFilePath)) {
        try {
          fs.unlinkSync(existingFilePath);
        } catch (err) {
          console.error('Error deleting file:', err);
          return null; // Handle the error as needed
        }
      }
    }

    const sourceFilePath = path.join(sourceDir, image);

    if (fs.existsSync(sourceFilePath)) {
      const uniqueFilename = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}${path.extname(image)}`;
      const destinationFilePath = path.join(uploadDir, uniqueFilename);
  
      // Check if the destination file already exists
      if (!fs.existsSync(destinationFilePath)) {
        try {
          fs.copyFileSync(sourceFilePath, destinationFilePath);
          
          const payload = { profilePicture: uniqueFilename };
          const updateResult = await User.update(payload, { where: { uuid } });
          console.log(`${userId} - ${uuid}`, payload, " | ", updateResult)

        } catch (err) {
          console.error('Error copying file:', err);
          return null; // Handle the error as needed
        }
      } else {
        console.error(`File ${uniqueFilename} already exists in the destination`);
        return null; // Or handle as needed
      }
    } else {
      console.error(`Source file ${sourceFilePath} not found for user ${userId}`);
    }
  }
}

module.exports = {
  generatingRecords,
  generatingRecordsHostProfileViaUser,
  generatingRecordsHostProfile,
  generatingRecordsHostHobbies,
  generatingRecordsWallet,
  generatingRecordsHostProfilePicture
};
