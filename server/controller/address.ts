import Barangay from "../models/Barangay";
import City from "../models/City";
import Province from "../models/Province";
import { successResponse, errorResponse } from "../utils/logic";

const getAllProvincesOptions = async (request, reply) => {
  try {
    const provinces = await Province.findAll({
      attributes: ["id", "name"],
    });
    return successResponse(
      provinces,
      "Get provinces is successfully fetched!",
      reply
    );
  } catch (error) {
    return errorResponse(
      `Error on getting Provinces: ${error}`,
      reply,
      "custom"
    );
  }
};

const getAllCitiesOptions = async (request, reply) => {
  const provinceId = request.query.provinceId;

  const whereConditions = {} as any;
  if (provinceId !== null && provinceId !== undefined) {
    whereConditions.id = provinceId;
  }

  try {
    const cities = await City.findAll({
      attributes: ["id", "name"],
      include: [
        {
          attributes: [],
          model: Province,
          as: "provinces", // Alias the Sessions association as "sessions"
          where: whereConditions,
        },
      ],
      //   where: { provinceId },
    });
    return successResponse(
      cities,
      "Get cities is successfully fetched!",
      reply
    );
  } catch (error) {
    return errorResponse(`Error on getting cities: ${error}`, reply, "custom");
  }
};

const getAllBarangaysOptions = async (request, reply) => {
  const cityId = request.query.cityId;
  const provinceId = request.query.provinceId;

  const whereConditionsBarangay = {} as any;
  const whereConditionsCity = {} as any;
  if (
    provinceId !== null &&
    provinceId !== undefined &&
    cityId !== null &&
    cityId !== undefined
  ) {
    whereConditionsBarangay.cityId = cityId;
    whereConditionsCity.provinceId = provinceId;
  }

  try {
    const baranagays = await Barangay.findAll({
      attributes: ["id", "name"],
      where: whereConditionsBarangay,
      include: [
        {
          attributes: [],
          model: City,
          as: "cities", // Alias the Sessions association as "sessions"
          where: whereConditionsCity,
        },
      ],
    });
    return successResponse(
      baranagays,
      "Get barangays is successfully fetched!",
      reply
    );
  } catch (error) {
    return errorResponse(
      `Error on getting barangays: ${error}`,
      reply,
      "custom"
    );
  }
};

export default {
  getAllProvincesOptions,
  getAllCitiesOptions,
  getAllBarangaysOptions,
};
