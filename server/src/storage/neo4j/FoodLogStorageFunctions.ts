import {
  CreateFoodLogEntry,
  EditFoodLogEntry,
  FoodLogStorage,
  NotFoundError,
  StorageError,
  SystemError,
  ValidationError,
} from "../types";
import { Result, err, ok } from "neverthrow";
import { FoodLogEntry } from "../../types";
import {
  isValidCreateLogEntry,
  isValidEditLogEntry,
} from "../validation";
import { randomUUID } from "node:crypto";
import { NEO4J_DRIVER } from ".";


export const foodLog: FoodLogStorage = {
  storeFoodLog: async function (
    userId: string,
    logEntry: CreateFoodLogEntry
  ): Promise<Result<string, StorageError>> {
    if (!isValidCreateLogEntry(logEntry)) {
      return Promise.resolve(err(new ValidationError("Invalid Log Entry")));
    }

    const session = NEO4J_DRIVER.session();
    try {
      const labels = logEntry.labels.reduce((acc, lbl, i) => {
        return { ...acc, [`fll${i}`]: lbl };
      }, {});
      const id = randomUUID();
      await session.run(
        `MERGE (u:User {userid: $userid})
          MERGE (fl:FoodLog { 
            id: $id, 
            name: $name,
            metrics: $metrics,
            startTime: datetime($startDate),
            endTime: datetime($endDate)
          })
          MERGE (u)-[:ENTERED]->(fl)
          ${Object.keys(labels).map(fll => {
            return `MERGE (${fll}:FoodLogLabel { value: $${fll} })
            MERGE (fl)<-[:LABELED_WITH]-(${fll})`;
          }).join("\n")}
          RETURN fl.id`,
        {
          userid: userId,
          id: id,
          name: logEntry.name,
          metrics: JSON.stringify(logEntry.metrics),
          startDate: logEntry.time.start.toISOString(),
          endDate: logEntry.time.end.toISOString(),
          ...labels
        }
      );
      

      return ok(id);
    } catch (error: any) {
      console.error(error);
      return err(new SystemError(error.message));
    }
  },
  retrieveFoodLog: async function (
    userId: string,
    logId: string
  ): Promise<Result<FoodLogEntry, StorageError>> {
    const session = NEO4J_DRIVER.session();
    try {
      const res = await session.run<any>(
        `MATCH (:User {userid: $userid})-[r:ENTERED]-(fl:FoodLog {id:$logid})
         MATCH (fl)-[:LABELED_WITH]-(fll: FoodLogLabel)
          RETURN fl.id as id, 
            fl.name as name, 
            collect(fll.value) as labels, 
            fl.metrics as metrics,
            apoc.temporal.format(fl.startTime, "ISO_DATE_TIME") as startTime,
            apoc.temporal.format(fl.endTime, "ISO_DATE_TIME") as endTime`,
        {
          userid: userId,
          logid: logId,
        }
      );
      await session.close();
      if (res.records.length == 0) {
        return err(new NotFoundError("Not Found"));
      }

      return ok(
        res.records.map((rec) => {
          return {
            id: rec.get("id"),
            name: rec.get("name"),
            labels: rec.get("labels"),
            time: {
              start: new Date(rec.get("startTime")),
              end: new Date(rec.get("endTime")),
            },
            metrics: JSON.parse(rec.get("metrics")),
          };
        })[0]
      );
    } catch (error: any) {
      await session.close();
      console.error(error);
      return err(new SystemError(error.message));
    }
  },
  editFoodLog: function (
    userId: string,
    logEntry: EditFoodLogEntry
  ): Promise<Result<FoodLogEntry, StorageError>> {
    if (!isValidEditLogEntry(logEntry)) {
      return Promise.resolve(err(new ValidationError("Invalid Log Entry")));
    }
    throw new Error("Function not implemented.");
  },
  deleteFoodLog: function (
    userId: string,
    logId: string
  ): Promise<Result<boolean, StorageError>> {
    throw new Error("Function not implemented.");
  },
  queryFoodLogs: function (
    userId: string,
    dateStart: Date,
    dateEnd: Date
  ): Promise<Result<FoodLogEntry[], StorageError>> {
    if (dateEnd.getTime() < dateStart.getTime()) {
      return Promise.resolve(
        err(new ValidationError("startDate is after endDate"))
      );
    }
    throw new Error("Function not implemented.");
  },
  bulkExportFoodLogs: function (
    userId: string
  ): Promise<Result<string, StorageError>> {
    // lets not touch this...
    throw new Error("Function not implemented.");
  },
};