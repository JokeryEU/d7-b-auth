import express from "express";
import AuthorModel from "../schemas/authors.js";
import ErrorResponse from "../lib/errorResponse.js";
import { jwtAuth } from "../auth/index.js";
import { auth, refreshJWT } from "../auth/tools.js";

const authRouter = express.Router();

authRouter.post("/register", async (req, res, next) => {
  try {
    const newAuthor = await AuthorModel.create(req.body);
    const { _id } = newAuthor;
    const tokens = await auth(user);
    res.status(201).send({ _id, tokens });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await AuthorModel.checkCredentials(email, password);
    const tokens = await auth(user);
    res.send(tokens);
  } catch (error) {
    console.log(error);
    next(error);
  }
});

authRouter.post("/logout", jwtAuth, async (req, res, next) => {
  try {
    req.user.refreshToken = null;
    await req.user.save();
    res.send();
  } catch (error) {
    next(error);
  }
});

authRouter.post("/refreshToken", async (req, res, next) => {
  const oldRefreshToken = req.body.refreshToken;
  if (!oldRefreshToken)
    return next(new ErrorResponse("Refresh token is missing", 400));

  try {
    const newTokens = await refreshJWT(oldRefreshToken);
    res.send(newTokens);
  } catch (error) {
    console.log(error);
    next(new ErrorResponse(error, 401));
  }
});

export default authRouter;
