import express from "express";
import cors from "cors";
import articlesRoutes from "./articles/articles.js";
import authorsRoutes from "./articles/authors.js";
import ErrorResponse from "./lib/errorResponse.js";
import mongoose from "mongoose";
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

app.use(cors());
app.use(express.json());

app.use("/articles", articlesRoutes);
app.use("/authors", authorsRoutes);

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
