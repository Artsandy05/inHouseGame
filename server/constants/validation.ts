const VALIDATION_ERROR = "VALIDATION_ERROR";
const CUSTOM_ERROR = "CUSTOM_ERROR";

const SUCCESS = "SUCCESS";
const ERROR = "ERROR";

const API_SUCCESS = "API_SUCCESS";
const API_FAILURE = "API_FAILURE";

const REGEX_NAME =
  /^[a-zA-ZàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ∂ð ,.'-]+$/u;

const REGEX_MOBILE = /^(09|\+639)\d{9}$/;
export {
  SUCCESS,
  ERROR,
  API_FAILURE,
  API_SUCCESS,
  VALIDATION_ERROR,
  CUSTOM_ERROR,
  REGEX_NAME,
  REGEX_MOBILE,
};
