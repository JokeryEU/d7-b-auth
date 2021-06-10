import express from "express";
import cors from "cors";
import passport from "passport";
import oauth from "./auth/oauth.js";
import articlesRoutes from "./articles/articles.js";
import authorsRoutes from "./articles/authors.js";
import authRouter from "./articles/auth.js";
import { jwtAuth } from "./auth/index.js";
import ErrorResponse from "./lib/errorResponse.js";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import {
  notFoundErrorHandler,
  badRequestErrorHandler,
  catchAllErrorHandler,
} from "./lib/errorHandlers.js";
import listEndpoints from "express-list-endpoints";

const app = express();

const whiteList = [process.env.FE_URL_DEV, process.env.FE_URL_PROD];

const corsOptions = {
  origin: function (origin, next) {
    if (whiteList.indexOf(origin) !== -1) {
      console.log("ORIGIN: ", origin);

      next(null, true);
    } else {
      next(new ErrorResponse(`NOT ALLOWED BY CORS`, 403));
    }
  },
};

app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

app.use("/", authRouter);
app.use("/articles", jwtAuth, articlesRoutes);
app.use("/authors", jwtAuth, authorsRoutes);

app.use(badRequestErrorHandler);
app.use(notFoundErrorHandler);
app.use(catchAllErrorHandler);

const port = process.env.PORT || 3005;
console.log(listEndpoints(app));

mongoose
  .connect(process.env.MONGODB_ADDRESS, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true,
  })
  .then(
    app.listen(port, () => {
      console.log("Running on port", port);
    })
  )
  .catch((err) => console.log(err));
