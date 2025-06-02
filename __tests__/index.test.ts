import express, { Request, Response } from "express";
import request from "supertest";
import { createTrunker, isFlagActive } from "../src";

describe("Trunker: createTrunker()", () => {
  it("should REGISTER /test route", async () => {
    const app = express();

    const trunker = createTrunker({
      flags: {
        test: { active: true },
      },
    });

    app.use(trunker.middleware());
    app.get("/test", (_req: Request, res: Response) => {
      res.send("OK!");
    });

    const response = await request(app).get("/test");
    expect(response.status).toBe(200);
    expect(response.text).toBe("OK!");
  });

  it("should THROW error when trunker.restrict() is used but trunker.middleware() not", async () => {
    const app = express();

    const trunker = createTrunker({
      flags: {
        test: { active: true },
      },
    });

    // note: trunker.middleware() is NOT used here
    app.get(
      "/test",
      trunker.restrict("test"),
      (_req: Request, res: Response) => {
        res.send("OK!");
      },
    );

    const response = await request(app).get("/test");
    expect(response.status).toBe(500);
    expect(response.text).toContain(
      "TrunkerError: req.trunker not found. Did you `app.use(trunker.middleware)`?",
    );
  });

  it("should NOT throw error if trunker.middleware() and trunker.restrict() are used", async () => {
    const app = express();
    const trunker = createTrunker({
      flags: {
        test: { active: true },
      },
    });

    // note: now using trunker.middleware()
    app.use(trunker.middleware());

    app.get(
      "/test",
      trunker.restrict("test"),
      (_req: Request, res: Response) => {
        res.send("OK!");
      },
    );

    const response = await request(app).get("/test");

    expect(response.status).toBe(200);
    expect(response.text).toBe("OK!");
  });

  it("should ALLOW access to /test based on manual verification", async () => {
    const app = express();
    const trunker = createTrunker({
      flags: {
        test: { active: true },
      },
    });

    app.use(trunker.middleware());

    app.get("/test", async (req: Request, res: Response) => {
      const testIsActive = await isFlagActive(req, "test");
      if (testIsActive) {
        res.send("OK!");
      } else {
        res.status(403).send("Not available");
      }
    });

    const response = await request(app).get("/test");

    expect(response.status).toBe(200);
    expect(response.text).toBe(`OK!`);
  });

  it("should ALLOW access to /test based on target string", async () => {
    const app = express();
    const trunker = createTrunker({
      flags: {
        test: { active: true },
      },
    });

    app.use(trunker.middleware());

    app.get(
      "/test",
      trunker.restrict("test"),
      (_req: Request, res: Response) => {
        res.send("OK!");
      },
    );

    const response = await request(app).get("/test");

    expect(response.status).toBe(200);
    expect(response.text).toBe(`OK!`);
  });

  it("should ALLOW access to /test based on target string array", async () => {
    const app = express();
    const trunker = createTrunker({
      flags: {
        test1: { active: false },
        test2: { active: true },
        test3: { active: true },
        test4: { active: false },
      },
    });

    app.use(trunker.middleware());

    app.get(
      "/test",
      trunker.restrict(["test2", "test3"]),
      (_req: Request, res: Response) => {
        res.send("OK!");
      },
    );

    const response = await request(app).get("/test");

    expect(response.status).toBe(200);
    expect(response.text).toBe(`OK!`);
  });

  it("should ALLOW access to /test based on target string using DYNAMIC flag", async () => {
    const app = express();
    const trunker = createTrunker({
      flags: {
        test: {
          active: () => Promise.resolve(true),
        },
      },
    });

    app.use(trunker.middleware());

    app.get(
      "/test",
      trunker.restrict("test"),
      (_req: Request, res: Response) => {
        res.send("OK!");
      },
    );

    const response = await request(app).get("/test");

    expect(response.status).toBe(200);
    expect(response.text).toBe(`OK!`);
  });

  it("should ALLOW access to /test based on target string array using DYNAMIC flags", async () => {
    const app = express();
    const trunker = createTrunker({
      flags: {
        test1: {
          active: () => Promise.resolve(false),
        },
        test2: {
          active: () => Promise.resolve(true),
        },
        test3: {
          active: () => Promise.resolve(true),
        },
        test4: {
          active: () => Promise.resolve(false),
        },
      },
    });

    app.use(trunker.middleware());

    app.get(
      "/test",
      trunker.restrict(["test2", "test3"]),
      (_req: Request, res: Response) => {
        res.send("OK!");
      },
    );

    const response = await request(app).get("/test");

    expect(response.status).toBe(200);
    expect(response.text).toBe(`OK!`);
  });

  it("should RESTRICT access to /test based on target string with CUSTOM ERROR MESSAGE", async () => {
    const app = express();
    const trunker = createTrunker({
      flags: {
        test: { active: false },
      },
      error: {
        format: "json",
        template: "You are not allowed to access this route.",
      },
    });

    app.use(trunker.middleware());

    app.get(
      "/test",
      trunker.restrict("test"),
      (_req: Request, res: Response) => {
        res.send("OK!");
      },
    );

    const response = await request(app).get("/test");

    expect(response.status).toBe(403);
    expect(response.body.error).toBe(
      `You are not allowed to access this route.`,
    );
  });

  it("should RESTRICT access to /test based on target string", async () => {
    const app = express();
    const trunker = createTrunker({
      flags: {
        test: { active: false },
      },
    });

    app.use(trunker.middleware());

    app.get(
      "/test",
      trunker.restrict("test"),
      (_req: Request, res: Response) => {
        res.send("OK!");
      },
    );

    const response = await request(app).get("/test");

    expect(response.status).toBe(403);
    expect(response.body.error).toBe(`Flag test is not active`);
  });

  it("should RESTRICT access to /test based on target string array", async () => {
    const app = express();
    const trunker = createTrunker({
      flags: {
        test1: { active: true },
        test2: { active: false },
        test3: { active: true },
        test4: { active: false },
      },
    });

    app.use(trunker.middleware());

    app.get(
      "/test",
      trunker.restrict(["test2", "test3"]),
      (_req: Request, res: Response) => {
        res.send("OK!");
      },
    );

    const response = await request(app).get("/test");

    expect(response.status).toBe(403);
    expect(response.body.error).toBe(`Flag test2 is not active`);
  });

  it("should RESTRICT access to /test based on target string using DYNAMIC flag", async () => {
    const app = express();
    const trunker = createTrunker({
      flags: {
        test: {
          active: () => Promise.resolve(false),
        },
      },
    });

    app.use(trunker.middleware());

    app.get(
      "/test",
      trunker.restrict("test"),
      (_req: Request, res: Response) => {
        res.send("OK!");
      },
    );

    const response = await request(app).get("/test");

    expect(response.status).toBe(403);
    expect(response.body.error).toBe(`Flag test is not active`);
  });

  it("should RESTRICT access to /test based on target string array using DYNAMIC flags", async () => {
    const app = express();
    const trunker = createTrunker({
      flags: {
        test1: { active: () => Promise.resolve(true) },
        test2: { active: () => Promise.resolve(false) },
        test3: { active: () => Promise.resolve(true) },
        test4: { active: () => Promise.resolve(true) },
      },
    });

    app.use(trunker.middleware());

    app.get(
      "/test",
      trunker.restrict(["test2", "test3"]),
      (_req: Request, res: Response) => {
        res.send("OK!");
      },
    );

    const response = await request(app).get("/test");

    expect(response.status).toBe(403);
    expect(response.body.error).toBe(`Flag test2 is not active`);
  });
});
