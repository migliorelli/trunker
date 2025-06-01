import express from "express";
import { createTrunker, isFlagActive } from "../../src";
import { Flags } from "../../src/types/index";

declare module "express-serve-static-core" {
  interface Request {
    trunker: Flags;
  }
}

const app = express();
const trunker = createTrunker({
  flags: {
    betaFeature1: true,
    betaFeature2: false,
  },
});

app.use(trunker.middleware());

// It can be accessed
app.get("/beta-feature1", async (req, res) => {
  const isBetaFeature1Active = await isFlagActive(req, "betaFeature1");
  if (isBetaFeature1Active) {
    res.send("Hello, world! From /beta-feature1.");
  } else {
    res.status(403).send("Forbidden");
  }
});

// It cant be accessed
app.get("/beta-feature2", async (req, res) => {
  const isBetaFeature2Active = await isFlagActive(req, "betaFeature2");
  if (isBetaFeature2Active) {
    res.send("Hello, world! From /beta-feature2.");
  } else {
    res.status(403).send("Forbidden");
  }
});

app.listen(3000, () => console.log("Listening on port 3000"));
