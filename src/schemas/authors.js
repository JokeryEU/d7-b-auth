import mongoose from "mongoose";
import bcrypt from "bcrypt";
const { Schema, model } = mongoose;

const AuthorSchema = new Schema(
  {
    firstName: {
      type: String,
      trim: true,
      required: true,
    },
    lastName: {
      type: String,
      trim: true,
      required: true,
    },
    email: {
      type: String,
      trim: true,
      required: true,
    },
    password: {
      type: String,
      required: true,
      minlength: [8, "Minimum length must be 8 chars"],
      trim: true,
    },
    img: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      required: true,
      enum: ["Admin", "User"],
      default: "User",
    },
    articles: [{ type: Schema.Types.ObjectId, ref: "Article" }],
    refreshToken: { type: String },
  },
  { timestamps: true }
);

AuthorSchema.static("findAuthorWithArticles", async function (id) {
  const author = await this.findById(id).populate("articles");
  return author;
});

AuthorSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(
      this.password,
      parseInt(process.env.SALT_ROUNDS)
    );
  }
  next();
});

AuthorSchema.statics.checkCredentials = async function (email, pw) {
  const user = await this.findOne({ email });
  if (user) {
    const isMatch = await bcrypt.compare(pw, user.password);
    if (isMatch) return user;
    else return null;
  } else return null;
};

AuthorSchema.methods.toJSON = function () {
  const user = this;

  const userObject = user.toObject();

  delete userObject.password;
  delete userObject.__v;
  delete userObject.refreshToken;
  return userObject;
};

export default model("Author", AuthorSchema);
