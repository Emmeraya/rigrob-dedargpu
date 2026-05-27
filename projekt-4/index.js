import express from "express";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import stories from "./systems/stories.js";
import settings from "./systems/settings.js";
import session from "./systems/session.js";
import auth from "./controllers/auth.js";
import user from "./systems/user.js";

const port = process.env.PORT || 8000;
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

function renderForbidden(res) {
  return res.status(403).render("error", {
    title: "Brak uprawnień",
    message: "Nie możesz edytować ani usuwać rzeczy, których nie jesteś autorem.",
  });
}


app.get("/", (req, res) => {
  res.render("storysets", {
    title: "Zestawy historyjek",
    storysets: stories.getStorysetSummaries(),
  });
});

app.get("/view/:storyset_slug", (req, res) => {
  const storyset = stories.getStoryset(req.params.storyset_slug);

  if (storyset != null) {
    storyset.author = user.getUser(storyset.author_id);

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
          return renderForbidden(res);
    }
    else{
      let story_data = {
      tytul: req.body.tytul,
      opis: req.body.opis,
    };
      var errors = stories.validateStoryData(story_data);
      if (errors.length == 0) {
        stories.addStory(storyset_slug, story_data);
        res.redirect(`/view/${storyset_slug}`);
      } else {
        res.status(400);
        res.render("story_new", {
          errors,
          title: "Nowa historyjka",
          tytul: req.body.tytul,
          opis: req.body.opis,
          storyset: {
            slug: storyset_slug,
          },
        });
      }
    }
  }
});

app.get("/add_story/:storyset_slug", auth.login_required, (req, res) => {
  const storyset_slug = req.params.storyset_slug;
  if (!stories.hasStoryset(storyset_slug)) {
    return res.sendStatus(404);
  }
  if (!stories.canEdit(storyset_slug, res.locals.user)) {
    return res.redirect("/");
  }
  res.render("story_new", {
    errors: [],
    title: "Nowa historyjka",
    tytul: "",
    opis: "",
    storyset: {
      slug: storyset_slug,
    },
  });
});

app.get("/new_storyset", auth.login_required, (req, res) => {
  res.render("storyset_new", {
    title: "Nowy zestaw historyjek",
  });
});
app.get("/view/:storyset_slug/:story_id", (req, res) => {
  const storyset = stories.getStoryset(req.params.storyset_slug);
  if (storyset == null) {
    return res.sendStatus(404);
  }
  storyset.author = user.getUser(storyset.author_id);
  const storyId = parseInt(req.params.story_id, 10);
  if (isNaN(storyId)) {
    return res.sendStatus(404);
  }
  const story = storyset.stories.find((story) => story.id === storyId);
  if (story == null) {
    return res.sendStatus(404);
  }
  res.render("story", {
    title: story.tytul,
    storyset,
    story,
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
      return renderForbidden(res);
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
          return renderForbidden(res);
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

app.get("/edit/:storyset_slug/:story_id", auth.login_required, (req, res) => {
  const storyset_slug = req.params.storyset_slug;
  const story_id = parseInt(req.params.story_id, 10);

  const storyset = stories.getStoryset(storyset_slug);

  if (storyset == null || isNaN(story_id)) {
    return res.sendStatus(404);
  }

  if (!storyset.editableBy(res.locals.user)) {
    return renderForbidden(res);
  }

  storyset.author = user.getUser(storyset.author_id);

  const story = storyset.stories.find((story) => story.id === story_id);

  if (story == null) {
    return res.sendStatus(404);
  }

  res.render("story_edit", {
    errors: [],
    title: "Edycja historii",
    storyset,
    story,
  });
});

app.post("/edit/:storyset_slug/:story_id", auth.login_required, (req, res) => {
  const storyset_slug = req.params.storyset_slug;
  const story_id = req.params.story_id;
  if (!stories.hasStoryset(storyset_slug) || !stories.hasStory(story_id)) {
    res.sendStatus(404);
  } else {
    if (!stories.canEdit(storyset_slug, res.locals.user)) {
          return renderForbidden(res);
    } else {
      const story = {
        tytul: req.body.tytul,
        opis: req.body.opis,
        id: story_id,
      };
      const errors = stories.validateStoryData(story);
      if (errors.length == 0) {
        stories.updateStory(story);
        res.redirect(`/view/${storyset_slug}/${story_id}`);
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

app.post("/delete/:storyset_slug/:story_id", auth.login_required, (req, res) => {
  const storyset_slug = req.params.storyset_slug;
  const story_id = req.params.story_id;
  if (!stories.hasStoryset(storyset_slug) || !stories.hasStory(story_id)) {
    res.sendStatus(404);
  } else {
    if (!stories.canEdit(storyset_slug, res.locals.user)) {
          return renderForbidden(res);
    } else {
      stories.deleteStoryById(story_id);
      res.redirect(`/edit/${storyset_slug}`);
    }
  }
});

app.post("/delete/:storyset_slug", auth.login_required, (req, res) => {
  const storyset_slug = req.params.storyset_slug;
  if (!stories.hasStoryset(storyset_slug)) {
    return res.sendStatus(404);
  }
  if (!stories.canEdit(storyset_slug, res.locals.user)) {
    return renderForbidden(res);
  }
  stories.deleteStoryset(storyset_slug);
  res.redirect("/");
});


app.listen(port, () => {
  console.log("\nRemeber.\nThis site is a joke and should be thought of as one.\n");
  console.log(`Server listening on http://localhost:${port}`);
});
