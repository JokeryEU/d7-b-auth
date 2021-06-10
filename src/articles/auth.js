import express from "express";
import AuthorModel from "../schemas/authors.js";
import ErrorResponse from "../lib/errorResponse.js";
import { jwtAuth } from "../auth/index.js";
import { auth, refreshJWT } from "../auth/tools.js";
import passport from "passport";
const authRouter = express.Router();

authRouter.post("/register", async (req, res, next) => {
  try {
    const newAuthor = await AuthorModel.create(req.body);
    const { _id } = newAuthor;
    const user = await AuthorModel.checkCredentials(
      req.body.email,
      req.body.password
    );
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

authRouter.get(
  "/googleLogin",
  passport.authenticate("google", { scope: ["profile", "email"] })
);
authRouter.get(
  "/auth/google/test",
  passport.authenticate("google"),
  async (req, res, next) => {
    try {
      res.cookie("accessToken", req.user.tokens.accessToken, {
        sameSite: "lax",
        httpOnly: true,
      });

      res.cookie("refreshToken", req.user.tokens.refreshToken, {
        sameSite: "lax",
        httpOnly: true,
      });
      res.status(200).redirect("http://localhost:3000");
    } catch (error) {
      next(error);
    }
  }
);

export default authRouter;
