import express from "express";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import stories from "./systems/stories.js";
import settings from "./systems/settings.js";
import session from "./systems/session.js";
import auth from "./controllers/auth.js";
import user from "./systems/user.js";

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
app.use(session.sessionHandler);

const settingsRouter = express.Router();
settingsRouter.use("/toggle-theme", settings.themeToggle);
settingsRouter.use("/accept-cookies", settings.acceptCookies);
settingsRouter.use("/decline-cookies", settings.declineCookies);
settingsRouter.use("/manage-cookies", settings.manageCookies);
app.use("/settings", settingsRouter);

const authRouter = express.Router();
authRouter.get("/signup", auth.signup_get);
authRouter.post("/signup", auth.signup_post);
authRouter.get("/login", auth.login_get);
authRouter.post("/login", auth.login_post);
authRouter.get("/logout", auth.logout);
app.use("/auth", authRouter);

app.get("/", (req, res) => {
  var last_viewed_storysets = null;
  if (res.locals.app.cookie_consent && req.signedCookies[LAST_VIEWED_COOKIE]) {
    let last_viewed = req.signedCookies[LAST_VIEWED_COOKIE] || [];
    last_viewed_storysets = last_viewed
      .map((x) => parseInt(x, 10))
      .filter((x) => !isNaN(x))
      .map((id) => stories.getStorysetSummary(id));
  }
  res.render("storysets", {
    title: "Zestawy historyjek",
    storysets: stories.getStorysetSummaries(),
    last_viewed_storysets,
  });
});

app.get("/view/:storyset_slug", (req, res) => {
  const storyset = stories.getStoryset(req.params.storyset_slug);
  storyset.author =user.getUser(storyset.author_id);
  if (storyset != null) {
    if (res.locals.app.cookie_consent) {
      let last_viewed_dirty = req.signedCookies[LAST_VIEWED_COOKIE] || [];
      let last_viewed = [
        storyset.storyset_slug,
        ...last_viewed_dirty
          .map((x) => parseInt(x, 10))
          .filter((x) => !isNaN(x) && x !== storyset.storyset_slug)
          .slice(0, 2),
      ];
      res.cookie(LAST_VIEWED_COOKIE, last_viewed, {
        httpOnly: true,
        secure: true,
        maxAge: ONE_MONTH,
        signed: true,
      });
    }
    res.render("storyset", {
      title: storyset.name,
      storyset,
    });
  } else {
    res.sendStatus(404);
  }
});

app.post("/add_story/:storyset_slug", auth.login_required, (req, res) => {
  const storyset_slug = req.params.storyset_slug;
  if (!stories.hasStoryset(storyset_slug)) {
    res.sendStatus(404);
  } else {
    if (!stories.canEdit(storyset_slug, res.locals.user)) {
          res.status(401);
          res.redirect("/");
    }
    else{
      let story_data = {
      title: req.body.title,
      desc: req.body.desc,
    };
      var errors = stories.validateStoryData(story_data);
      if (errors.length == 0) {
        stories.addStory(storyset_slug, story_data);
        res.redirect(`/view/${storyset_slug}`);
      } else {
        res.status(400);
        res.render("new_story", {
          errors,
          title: "Nowa historyjka",
          title: req.body.title,
          desc: req.body.desc,
          storyset: {
            id: storyset_slug,
          },
        });
      }
    }
  }
});

app.get("/add_story/:storyset_slug", auth.login_required, (req, res) => {
  res.redirect(`/view/${req.params.storyset_slug}`);
});

app.get("/new_storyset", auth.login_required, (req, res) => {
  res.render("storyset_new", {
    title: "Nowy zestaw",
  });
});

app.post("/new_storyset", auth.login_required, (req, res) => {
  const storyset_name = req.body.name;
  var storyset_slug = null;
  var errors = stories.validateStorysetName(storyset_name);
  if (errors.length == 0) {
    storyset_slug = stories.generateStorysetSlug(storyset_name);
    if (stories.hasStoryset(storyset_slug)) {
      errors.push("Storyset id is already taken");
    }
  }

  if (errors.length == 0) {
    stories.addStoryset(storyset_slug, storyset_name, res.locals.user);
    res.redirect(`/view/${storyset_slug}`);
  } else {
    res.status(400);
    res.render("storyset_new", {
      errors,
      title: "Nowy zestaw",
      name: storyset_name,
    });
  }
});

app.get("/edit/:storyset_slug", auth.login_required, (req, res) => {
  const storyset_slug = req.params.storyset_slug;
  const errors = [];
  var storyset = stories.getStoryset(storyset_slug);
  if (storyset != null) {
    if (!storyset.editableBy(res.locals.user)) {
      res.status(401);
      res.redirect("/");
    } else {
      res.render("storyset_edit", {
        errors,
        title: "Edycja zestawu",
        storyset,
      });
    }
  } else {
    res.sendStatus(404);
  }
});

app.post("/edit/:storyset_slug", auth.login_required, (req, res) => {
  const storyset_slug = req.params.storyset_slug;
  if (stories.hasStoryset(storyset_slug)) {
    if (!stories.canEdit(storyset_slug, res.locals.user)) {
          res.status(401);
          res.redirect("/");
    } else {
      const storyset_name = req.body.name;
      var new_storyset_slug = null;
      const errors = stories.validateStorysetName(storyset_name);
      if (errors.length == 0) {
        new_storyset_slug = stories.generateStorysetSlug(storyset_name);
        if (
          new_storyset_slug !== storyset_slug &&
          stories.hasStoryset(new_storyset_slug)
        ) {
          errors.push("Storyset id is already taken");
        }
      }
      if (errors.length == 0) {
        const storyset = stories.updateStoryset(
          storyset_slug,
          new_storyset_slug,
          storyset_name,
        );
        if (storyset != null) {
          res.redirect("/view/" + storyset.slug);
        } else {
          res.write("Unexpected error while updating storyset");
          res.sendStatus(500);
        }
      } else {
        const storyset = stories.getStoryset(storyset_slug);
        res.render("storyset_edit", {
          errors,
          title: "Edycja zestawu",
          storyset,
        });
      }
    }
  } else {
    res.sendStatus(404);
  }
});

app.post("/edit/:storyset_slug/:story_id", auth.login_required, (req, res) => {
  const storyset_slug = req.params.storyset_slug;
  const story_id = req.params.story_id;
  if (!stories.hasStoryset(storyset_slug) || !stories.hasStory(story_id)) {
    res.sendStatus(404);
  } else {
    if (!stories.canEdit(storyset_slug, res.locals.user)) {
          res.status(401);
          res.redirect("/");
    } else {
      const story = {
        title: req.body.title,
        desc: req.body.desc,
        id: story_id,
      };
      const errors = stories.validateStoryData(story);
      if (errors.length == 0) {
        stories.updateStory(story);
        res.redirect(`/edit/${storyset_slug}`);
      } else {
        let storyset = stories.getStoryset(storyset_slug);
        res.render("storyset_edit", {
          errors,
          title: "Edycja zestawu",
          storyset,
        });
      }
    }
  }
});

app.post("/edit/:storyset_slug/:story_id", auth.login_required, (req, res) => {
  res.redirect(`/edit/${req.params.storyset_slug}`);
});

app.post("/delete/:storyset_slug/:story_id", auth.login_required, (req, res) => {
  const storyset_slug = req.params.storyset_slug;
  const story_id = req.params.story_id;
  if (!stories.hasStoryset(storyset_slug) || !stories.hasStory(story_id)) {
    res.sendStatus(404);
  } else {
    if (!stories.canEdit(storyset_slug, res.locals.user)) {
          res.status(401);
          res.redirect("/");
    } else {
      stories.deleteStoryById(story_id);
      res.redirect(`/edit/${storyset_slug}`);
    }
  }
});

app.post("/edit/:storyset_slug/:story_id", auth.login_required, (req, res) => {
  res.redirect(`/edit/${req.params.storyset_slug}`);
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
