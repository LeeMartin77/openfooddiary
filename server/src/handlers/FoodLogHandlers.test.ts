import { addHandlers, createFoodLogHandler, getFoodLogHandler, updateFoodLogHandler } from './FoodLogHandlers'
import { Express, Request, Response} from 'express';
import crypto from 'node:crypto';
import { OFDLocals } from '../middlewares';
import { NotFoundError, ValidationError } from '../storage';
import { err, ok } from 'neverthrow';
import { CreateFoodLogEntry, EditFoodLogEntry } from '../storage/types/FoodLog';
import { FoodLogEntry } from '../types';

describe("Handler Registration", () => {
  it("Registers all functions on routes", () => {
    const fakeApp = {
      post: jest.fn(),
      get: jest.fn(),
      put: jest.fn(),
    } as unknown as Express;
    addHandlers(fakeApp);

    expect(fakeApp.post).toBeCalledWith('/logs', createFoodLogHandler)
    expect(fakeApp.get).toBeCalledWith('/logs/:logId', getFoodLogHandler)
    expect(fakeApp.put).toBeCalledWith('/logs/:logId', updateFoodLogHandler)
  })
})

describe("Create Food Log Handler", () => {
  test("Happy Path :: Passes to storage, success, returns id of log", async () => {
    const createdId = crypto.randomUUID();
    const mockStorage = jest.fn().mockResolvedValue(ok(createdId));
    const userId = crypto.randomUUID();
    const input: CreateFoodLogEntry = {
      name: 'My Log',
      labels: new Set<string>(),
      time: {
        start: new Date(),
        end: new Date()
      },
      metrics: {}
    }

    const fakeReq = {
      body: input,
    }

    const fakeRes = {
      send: jest.fn(),
      status: jest.fn().mockReturnThis(),
      locals: {
        userId: userId
      }
    }

    await createFoodLogHandler(fakeReq as Request, fakeRes as any as Response & { locals: OFDLocals }, jest.fn(), mockStorage)

    expect(mockStorage).toBeCalledTimes(1)
    expect(mockStorage).toBeCalledWith(userId, input)
    expect(fakeRes.send).toBeCalledWith(createdId)
  })

  test("Validation Error :: Returns error from storage with 400", async () => {
    const validationProblem = "Some Validation Problem";
    const mockStorage = jest.fn().mockResolvedValue(err(new ValidationError(validationProblem)));
    const userId = crypto.randomUUID();
    const input: CreateFoodLogEntry = {
      name: 'My Log',
      labels: new Set<string>(),
      time: {
        start: new Date(),
        end: new Date()
      },
      metrics: {}
    }

    const fakeReq = {
      body: input,
    }

    const fakeRes = {
      send: jest.fn(),
      status: jest.fn().mockReturnThis(),
      locals: {
        userId: userId
      }
    }

    await createFoodLogHandler(fakeReq as Request, fakeRes as unknown as Response & { locals: OFDLocals }, jest.fn(), mockStorage)

    expect(mockStorage).toBeCalledTimes(1)
    expect(mockStorage).toBeCalledWith(userId, input)
    expect(fakeRes.status).toBeCalledWith(400)
    expect(fakeRes.send).toBeCalledWith(validationProblem)
  })

  test("Generic Error :: Returns error from storage with 500", async () => {
    const errorMessage = "Some Serious Problem";
    const mockStorage = jest.fn().mockResolvedValue(err(new Error(errorMessage)));
    const userId = crypto.randomUUID();
    const input: CreateFoodLogEntry = {
      name: 'My Log',
      labels: new Set<string>(),
      time: {
        start: new Date(),
        end: new Date()
      },
      metrics: {}
    }

    const fakeReq = {
      body: input,
    }

    const fakeRes = {
      send: jest.fn(),
      status: jest.fn().mockReturnThis(),
      locals: {
        userId: userId
      }
    }

    await createFoodLogHandler(fakeReq as Request, fakeRes as unknown as Response & { locals: OFDLocals }, jest.fn(), mockStorage)

    expect(mockStorage).toBeCalledTimes(1)
    expect(mockStorage).toBeCalledWith(userId, input)
    expect(fakeRes.status).toBeCalledWith(500)
    expect(fakeRes.send).toBeCalledWith(errorMessage)
  })
})

describe("Get Food Log Handler", () => {
  test("Happy Path :: Passes to storage, success, returns log", async () => {
    const userId = crypto.randomUUID();
    const itemId = crypto.randomUUID();
    const foodLog: FoodLogEntry = {
      id: itemId,
      name: 'My Log',
      labels: new Set<string>(),
      time: {
        start: new Date(),
        end: new Date()
      },
      metrics: {}
    }


    const mockStorage = jest.fn().mockResolvedValue(ok(foodLog));

    const fakeReq: any = {
      params: {
        itemId: itemId
      }
    }

    const fakeRes = {
      send: jest.fn(),
      status: jest.fn().mockReturnThis(),
      locals: {
        userId: userId
      }
    }

    await getFoodLogHandler(fakeReq as Request, fakeRes as any as Response & { locals: OFDLocals }, jest.fn(), mockStorage)

    expect(mockStorage).toBeCalledTimes(1)
    expect(mockStorage).toBeCalledWith(userId, itemId)
    expect(fakeRes.send).toBeCalledWith(foodLog)
  })

  test("Not found :: returns 404 and message", async () => {
    const userId = crypto.randomUUID();
    const itemId = crypto.randomUUID();

    const errorMessage = "Food Log Not found"

    const mockStorage = jest.fn().mockResolvedValue(err(new NotFoundError(errorMessage)));

    const fakeReq: any = {
      params: {
        itemId: itemId
      }
    }

    const fakeRes = {
      send: jest.fn(),
      status: jest.fn().mockReturnThis(),
      locals: {
        userId: userId
      }
    }

    await getFoodLogHandler(fakeReq as Request, fakeRes as any as Response & { locals: OFDLocals }, jest.fn(), mockStorage)

    expect(mockStorage).toBeCalledTimes(1)
    expect(mockStorage).toBeCalledWith(userId, itemId)
    expect(fakeRes.status).toBeCalledWith(404)
    expect(fakeRes.send).toBeCalledWith(errorMessage)
  })
})


describe("Create Food Log Handler", () => {
  test("Happy Path :: Passes to storage, success, returns id of log", async () => {
    const itemId = crypto.randomUUID();
    const userId = crypto.randomUUID();
    const input: EditFoodLogEntry = {
      name: 'My Log',
      labels: new Set<string>(),
      time: {
        start: new Date(),
        end: new Date()
      },
      metrics: {}
    }

    const mockStorage = jest.fn().mockResolvedValue(ok({ id: itemId, ...input }));

    const fakeReq: any = {
      params: {
        itemId
      },
      body: input,
    }

    const fakeRes = {
      send: jest.fn(),
      status: jest.fn().mockReturnThis(),
      locals: {
        userId: userId
      }
    }

    await updateFoodLogHandler(fakeReq as Request, fakeRes as any as Response & { locals: OFDLocals }, jest.fn(), mockStorage)

    expect(mockStorage).toBeCalledTimes(1)
    expect(mockStorage).toBeCalledWith(userId, { id: itemId, ...input })
    expect(fakeRes.send).toBeCalledWith({ id: itemId, ...input })
  })
})