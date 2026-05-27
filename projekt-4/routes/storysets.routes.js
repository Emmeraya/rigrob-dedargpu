import express from "express";
import stories from "../systems/stories.js";
import user from "../systems/user.js";
import auth from "../controllers/auth.js";

const router = express.Router();

router.get("/", (req, res) => {
  res.render("storysets", {
    title: "Zestawy historyjek",
    storysets: stories.getStorysetSummaries(),
  });
});

router.get("/view/:storyset_slug", (req, res) => {
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

router.get("/new_storyset", auth.login_required, (req, res) => {
  res.render("storyset_new", {
    title: "Nowy zestaw historyjek",
  });
});

router.post("/new_storyset", auth.login_required, (req, res) => {
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

router.get("/edit/:storyset_slug", auth.login_required, (req, res) => {
  const storyset_slug = req.params.storyset_slug;
  const errors = [];
  var storyset = stories.getStoryset(storyset_slug);
  if (storyset != null) {
    if (!storyset.editableBy(res.locals.user)) {
      return res.renderForbidden();
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

router.post("/edit/:storyset_slug", auth.login_required, (req, res) => {
  const storyset_slug = req.params.storyset_slug;
  if (stories.hasStoryset(storyset_slug)) {
    if (!stories.canEdit(storyset_slug, res.locals.user)) {
          return res.renderForbidden();
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

router.post("/delete/:storyset_slug", auth.login_required, (req, res) => {
  const storyset_slug = req.params.storyset_slug;
  if (!stories.hasStoryset(storyset_slug)) {
    return res.sendStatus(404);
  }
  if (!stories.canEdit(storyset_slug, res.locals.user)) {
    return res.renderForbidden();
  }
  stories.deleteStoryset(storyset_slug);
  res.redirect("/");
});

export default router;