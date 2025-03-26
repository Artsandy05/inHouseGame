const { generateRandomNameWithGender, generateRandomNameWithGenderForHostProfile } = require("./nameDatas")
const { generateRoles, generateRoleForHostProfile } = require("./roleDatas")
const { generateMobileNo, generateMobileNoForHostProfile } = require("./mobileDatas")
const { generateEmails, generateEmailsForHostProfile } = require("./emailDatas")
const { generateBirthdates, generateBirthdatesForHostProfile } = require("./birthdateDatas")
const generateRandomBoolean = require("./booleanDatas")
const { generateHostProfile, generateHostHobbies, generateAssetsImagesWithUserId } = require("./hostDatas")



module.exports = {
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
}