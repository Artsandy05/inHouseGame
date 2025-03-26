import { successResponse, errorResponse } from "../utils/logic";
import Log from "../models/Log";
import { Sequelize } from "sequelize";
import { Op, FindOptions } from "sequelize";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
dayjs.extend(utc);

type Filters = {
  keywords?: string;
};

interface LogsModelAttributes {
  id: number;
  functionality: string;
  message: string;
  level: string;
  associatedId: number;
  associatedType: string;
  updatedAt: Date;
  createdAt: Date;
}

type LogsAttributes = keyof LogsModelAttributes;

const getAllLogs = async (request: any, reply: any) => {
  const { page, size, sort, filter, status } = request.query;

  const [columnName, direction] = sort && sort.split(",");
  const order = [[columnName, direction.toUpperCase()]] as [
    LogsAttributes,
    string
  ][];

  const whereConditions = {};

  if (filter) {
    // Split the filter string by '&' to get individual filter conditions
    const filterConditions = filter.split("&");

    filterConditions.forEach((condition) => {
      const [column, value] = condition.split("=");
      const decodedValue = decodeURIComponent(value);
      

      if (column === "createdAt") {
        const [startDateTime, endDateTime] = decodedValue.split(",");
        whereConditions["createdAt"] = {
          [Op.between]: [startDateTime, endDateTime],
        };
      }else{
        whereConditions[column] = { [Op.like]: `%${decodedValue}%` };
      }

  
    });
  }

  const offset = page * size;
  const options: FindOptions = {
    //  @ts-ignore
    attributes: [
      "id",
      "functionality",
      "message",
      "level",
      "associatedId",
      "associatedType",
      "createdAt",
      "updatedAt",
    ] as LogsModelAttributes[],
    where: whereConditions,
    offset,
    limit: size,
  };

  // Now you can safely check if "updatedAt" is a valid attribute
  if (
    columnName === "updatedAt" &&
    ("updatedAt" as keyof LogsModelAttributes)
  ) {
    order.push(["updatedAt", direction.toUpperCase()]);
    order.push(["createdAt", direction.toUpperCase()]); // Secondary sort by createdAt
  }

  options.order = order;

  const logs = await Log.findAll(options);
  const totalCount = await Log.count(options);
  const payload = {
    content: logs,
    totalCount,
  };

  if (logs) {
    return successResponse(
      payload,
      "Get All Logs is successfully fetched!",
      reply
    );
  } else {
    return errorResponse("Logs not found", reply, "custom");
  }
};

export default { getAllLogs };
