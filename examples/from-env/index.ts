import dotenv from "dotenv";
import express from "express";
import { createTrunker, fromEnv } from "../../src";

dotenv.config();

const app = express();
const trunker = createTrunker(fromEnv(process.env));

app.use(trunker.middleware());

// It can be accessed
app.get("/beta-feature1", trunker.restrict("betaFeature1"), (req, res) => {
  res.send("Hello, world! From /beta-feature1.");
});

// It cant be accessed
app.get("/beta-feature2", trunker.restrict("betaFeature2"), (req, res) => {
  res.send("Hello, world! From /beta-feature2.");
});

app.listen(3000, () => console.log("Listening on port 3000"));
