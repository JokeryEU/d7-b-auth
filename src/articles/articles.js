import express from "express";
import q2m from "query-to-mongo";
import mongoose from "mongoose";
import AuthorSchema from "../schemas/authors.js";
import ArticleSchema from "../schemas/articles.js";
// import { adminOnly } from "../auth/index.js";

const articleRouter = express.Router();

articleRouter.get("/", async (req, res, next) => {
  try {
    if (Object.keys(req.query).length > 0) {
      const { criteria, options, links } = q2m(req.query);

      const total = await ArticleSchema.countDocuments(criteria);

      const articles = await ArticleSchema.find(
        {
          headLine: {
            $regex: new RegExp(criteria.headLine, "i"),
          },
          subHead: {
            $regex: new RegExp(criteria.subHead, "i"),
          },
          category: {
            $regex: new RegExp(criteria.category, "i"),
          },
        },
        options.fields
      )
        .sort(options.sort)
        .skip(options.skip)
        .limit(options.limit);

      res.send({ links: links("/articles", total), data: articles });
    } else {
      next();
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
});

articleRouter.get("/", async (req, res, next) => {
  try {
    const articles = await ArticleSchema.find();
    res.status(200).send(articles);
  } catch (err) {
    next(err);
  }
});

articleRouter.get("/:id", async (req, res, next) => {
  try {
    const article = await ArticleSchema.findById(req.params.id);
    if (!article) {
      return next(new ErrorResponse(`ID ${req.params.id} not found`));
    }
    res.status(200).send({ article });
  } catch (error) {
    next(error);
  }
});

articleRouter.post("/", async (req, res, next) => {
  try {
    const newArticle = {
      ...req.body,
    };
    const savedArticle = await ArticleSchema.create(newArticle);
    const { authorId } = savedArticle;
    const { _id } = savedArticle;

    const author = await AuthorSchema.findById(authorId);
    const updatedAuthor = await AuthorSchema.findByIdAndUpdate(
      authorId,
      {
        $push: {
          articles: _id,
        },
      },
      { runValidators: true, new: true }
    );
    console.log(updatedAuthor);
    res.send({ _id });
  } catch (error) {
    console.log(error);
    next(error);
  }
});

articleRouter.put("/:id", async (req, res, next) => {
  try {
    const newArticle = { ...req.body };
    const article = await ArticleSchema.findByIdAndUpdate(
      req.params.id,
      newArticle,
      {
        runValidators: true,
        new: true,
      }
    );
    if (!article) {
      return next(new ErrorResponse(`resource not found with that id`, 404));
    }
    res.status(200).send({ article });
  } catch (error) {
    console.log(error);
    next(error);
  }
});

articleRouter.delete("/:id", async (req, res, next) => {
  try {
    const article = await ArticleSchema.findByIdAndDelete(req.params.id);
    console.log(article);
    if (!article) {
      return next(new ErrorResponse(`id: ${req.params.id} not found`, 404));
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

articleRouter.get("/:id/reviews", async (req, res, next) => {
  try {
    const id = req.params.id;

    const reviews = await ArticleSchema.findById(id, {
      reviews: 1,
      _id: 0,
    });
    if (!reviews) return next(new ErrorResponse(`id not found`, 404));
    res.status(200).send({ reviews });
  } catch (error) {
    next(error);
  }
});
articleRouter.get("/:id/reviews/:reviewId", async (req, res, next) => {
  try {
    const userId = req.params.id;
    const reviewId = req.params.reviewId;
    const { reviews } = await ArticleSchema.findOne(
      { _id: mongoose.Types.ObjectId(userId) },
      {
        reviews: {
          $elemMatch: { _id: mongoose.Types.ObjectId(reviewId) },
        },
      }
    );
    // console.log(reviews);
    if (reviews) {
      const data = reviews.length > 0 ? reviews[0] : reviews;
      return res.status(200).send({
        success: true,
        data,
      });
    } else {
      return next(new ErrorResponse(`id not found`, 404));
    }
  } catch (error) {
    next(error);
  }
});
articleRouter.post("/:id/reviews", async (req, res, next) => {
  try {
    const articleId = req.params.id;
    const addReview = req.body;

    const updatedArticles = await ArticleSchema.findByIdAndUpdate(
      articleId,
      {
        $push: {
          reviews: addReview,
        },
      },
      { runValidators: true, new: true, projection: { reviews: 1 } }
    );
    if (!updatedArticles)
      return next(new ErrorResponse(`article not found`, 404));

    res.status(201).send({ updatedArticles });
  } catch (error) {
    next(error);
  }
});
articleRouter.put("/:id/reviews/:reviewId", async (req, res, next) => {
  try {
    const userId = req.params.id;
    const reviewId = req.params.reviewId;
    const { reviews } = await ArticleSchema.findOneAndUpdate(
      {
        _id: mongoose.Types.ObjectId(userId),
        "reviews._id": mongoose.Types.ObjectId(reviewId),
      },
      { $set: { "reviews.$": { ...req.body, _id: reviewId } } },
      {
        runValidators: true,
        new: true,
        projection: { reviews: 1 },
        timestamps: true,
      }
    );
    res.status(200).send(reviews);
  } catch (error) {
    next(error);
  }
});
articleRouter.delete("/:id/reviews/:reviewId", async (req, res, next) => {
  try {
    const id = req.params.id;
    const reviewId = req.params.reviewId;
    const modified = await ArticleSchema.findByIdAndUpdate(
      id,
      {
        $pull: {
          reviews: { _id: mongoose.Types.ObjectId(reviewId) },
        },
      },
      { new: true }
    );
    res.status(204).send(modified);
  } catch (error) {
    next(error);
  }
});

export default articleRouter;
