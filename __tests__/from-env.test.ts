import dotenv from "dotenv";
import express, { Request, Response } from "express";
import request from "supertest";
import { createTrunker, fromEnv } from "../src";
import { Flags } from "../src/types/index";

declare module "express-serve-static-core" {
  interface Request {
    trunker: Flags;
  }
}

dotenv.config({ path: "__tests__/.env.test" });

describe("Trunker: fromEnv()", () => {
  it("should register Test route from env file", async () => {
    const app = express();

    const trunker = createTrunker(fromEnv(process.env));

    app.use(trunker.middleware());

    app.get("/test", (req: Request, res: Response) => {
      console.log(req.trunker);
      res.send({
        flags: req.trunker,
        message: "Test route",
      });
    });

    const response = await request(app).get("/test");
    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Test route");
    expect(response.body.flags).toStrictEqual({
      test1: { active: true },
      test2: { active: false },
    });
  });
});
