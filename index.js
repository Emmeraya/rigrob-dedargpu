import express from "express";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import stories from "./systems/stories.js";
import settings from "./systems/settings.js";

const port = process.env.PORT || 8000;
const LAST_VIEWED_COOKIE = "__Host-story-last-viewed";
const ONE_DAY = 24 * 60 * 60 * 1000;
const ONE_MONTH = 30 * ONE_DAY;
const SECRET = process.env.SECRET;

if (SECRET == null) {
  console.error(
    "SECRET environment variable missing. Please create an env file or provide SECRET via environment variables."
  );
  process.exit(1);
}

const app = express();
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded());
app.use(morgan("dev"));
app.use(cookieParser(SECRET));

app.use(settings.settingsHandler);

const settingsRouter = express.Router();
settingsRouter.use("/toggle-theme", settings.themeToggle);
settingsRouter.use("/accept-cookies", settings.acceptCookies);
settingsRouter.use("/decline-cookies", settings.declineCookies);
settingsRouter.use("/manage-cookies", settings.manageCookies);
app.use("/settings", settingsRouter);

app.get("/", (req, res) => {
  var last_viewed_categories = null;
    if (res.locals.app.cookie_consent && req.cookies[LAST_VIEWED_COOKIE]) {
      let last_viewed = req.cookies[LAST_VIEWED_COOKIE]?.split(",") || [];
      last_viewed_categories = last_viewed
        .map((x) => parseInt(x, 10))
        .filter((x) => !isNaN(x))
        .map((id) => stories.getCategorySummary(id));
    }
  res.render("categories", {
    title: "Kategorie",
    categories: stories.getCategorySummaries(),
    last_viewed_categories,
  });
});

app.get("/view/:category_id", (req, res) => {
  if (res.locals.app.cookie_consent) {
      let last_viewed_dirty = req.cookies[LAST_VIEWED_COOKIE]?.split(",") || [];
      let last_viewed = [
        category.category_id,
        ...last_viewed_dirty
          .map((x) => parseInt(x, 10))
          .filter((x) => !isNaN(x) && x !== category.category_id)
          .slice(0, 2),
      ];
      res.cookie(LAST_VIEWED_COOKIE, last_viewed, {
        httpOnly: true,
        secure: true,
        maxAge: ONE_MONTH,
        signed: true,
      });
    }
  const category = stories.getCategory(req.params.category_id);
  if (category != null) {
    res.render("category", {
      title: category.name,
      category,
    });
  } else {
    res.sendStatus(404);
  }
});

app.post("/add_story/:category_id", (req, res) => {
  const category_id = req.params.category_id;
  if (!stories.hasCategory(category_id)) {
    res.sendStatus(404);
  } else {
    let story_data = {
      title: req.body.title,
      desc: req.body.desc,
    };
    var errors = stories.validateStoryData(story_data);
    if (errors.length == 0) {
      stories.addStory(category_id, story_data);
      res.redirect(`/view/${category_id}`);
    } else {
      res.status(400);
      res.render("new_story", {
        errors,
        title: "Nowa Historyjka",
        title: req.body.title,
        desc: req.body.desc,
        category: {
          id: category_id,
        },
      });
    }
  }
});

app.get("/new_category", (req, res) => {
  res.render("category_new", {
    title: "Nowa kategoria",
  });
});

app.post("/new_category", (req, res) => {
  const category_name = req.body.name;
  var category_id = null;
  var errors = stories.validateCategoryName(category_name);
  if (errors.length == 0) {
    category_id = stories.generateCategoryId(category_name);
    if (stories.hasCategory(category_id)) {
      errors.push("Category id is already taken");
    }
  }

  if (errors.length == 0) {
    stories.addCategory(category_id, category_name);
    res.redirect(`/view/${category_id}`);
  } else {
    res.status(400);
    res.render("category_new", {
      errors,
      title: "Nowa kategoria",
      name: category_name,
    });
  }
});

app.get("/edit/:category_id", (req, res) => {
  const category_id = req.params.category_id;
  const errors = [];
  var category = stories.getCategory(category_id);
  if (category != null) {
    res.render("category_edit", {
      errors,
      title: "Edycja kategorii",
      category,
    });
  } else {
    res.sendStatus(404);
  }
});

app.post("/edit/:category_id", (req, res) => {
  const category_id = req.params.category_id;
  if (stories.hasCategory(category_id)) {
    const category_name = req.body.name;
    var new_category_id = null;
    const errors = stories.validateCategoryName(category_name);
    if (errors.length == 0) {
      new_category_id = stories.generateCategoryId(category_name);
      if (
        new_category_id !== category_id &&
        stories.hasCategory(new_category_id)
      ) {
        errors.push("Category id is already taken");
      }
    }
    if (errors.length == 0) {
      const category = stories.updateCategory(
        category_id,
        new_category_id,
        category_name
      );
      if (category != null) {
        res.redirect("/view/" + category.id);
      } else {
        res.write("Unexpected error while updating category");
        res.sendStatus(500);
      }
    } else {
      const category = stories.getCategory(category_id);
      res.render("category_edit", {
        errors,
        title: "Edycja kategorii",
        category,
      });
    }
  } else {
    res.sendStatus(404);
  }
});

app.post("/edit/:category_id/:story_id", (req, res) => {
  const category_id = req.params.category_id;
  const story_id = req.params.story_id;
  if (!stories.hasCategory(category_id) || !stories.hasStory(story_id)) {
    res.sendStatus(404);
  } else {
    const story = {
      title: req.body.title,
      desc: req.body.desc,
      id: story_id,
    };
    const errors = stories.validateStoryData(story);
    if (errors.length == 0) {
      stories.updateStory(story);
      res.redirect(`/edit/${category_id}`);
    } else {
      let category = stories.getCategory(category_id);
      res.render("category_edit", {
        errors,
        title: "Edycja kategorii",
        category,
      });
    }
  }
});

app.post("/delete/:category_id/:story_id", (req, res) => {
  const category_id = req.params.category_id;
  const story_id = req.params.story_id;
  if (!stories.hasCategory(category_id) || !stories.hasStory(story_id)) {
    res.sendStatus(404);
  } else {
    stories.deleteStoryById(story_id);
    res.redirect(`/edit/${category_id}`);
  }
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
