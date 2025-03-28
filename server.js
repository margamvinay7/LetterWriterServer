import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRouter from "./routes/authRouter.js";
import letterRouter from "./routes/letterRouter.js";
import draftRouter from "./routes/draftRoute.js";

dotenv.config();

const app = express();
const allowedOrigins = [
  "http://localhost:5173",
  "https://letter-writer-client.vercel.app",
];
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

app.use("/", authRouter);
app.use("/letter", letterRouter);
app.use("/draft", draftRouter);

app.listen(process.env.PORT || 3000, () => {
  console.log("server started", process.env.PORT);
});
