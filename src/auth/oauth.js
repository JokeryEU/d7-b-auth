import passport from "passport";
import GoogleStrategy from "passport-google-oauth20";
import AuthorModel from "../schemas/authors.js";
import { auth } from "../auth/tools.js";
passport.use(
  "google",
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_SECRET,
      callbackURL: "http://localhost:3001/auth/google/test",
    },
    async (request, accessToken, refreshToken, profile, done) => {
      console.log(profile);
      try {
        const user = await AuthorModel.findOne({
          googleId: profile.id,
        });
        if (user) {
          const tokens = await auth(user);
          done(null, { user, tokens });
        } else {
          const newUser = {
            name: profile.given_name,
            surname: profile.family_name,
            email: profile.email,
            role: "User",
            googleId: profile.id,
          };
          const createdUser = new AuthorModel(newUser);
          const created = await createdUser.save();
          const tokens = await auth(created);
          done(null, { created, tokens });
        }
      } catch (error) {
        next(error);
      }
    }
  )
);

passport.serializeUser(function (user, done) {
  done(null, user);
});

export default {};
