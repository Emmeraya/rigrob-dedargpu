import express from "express";
import stories from "../systems/stories.js";
import user from "../systems/user.js";
import auth from "../controllers/auth.js";

const router = express.Router();

router.get("/view/:storyset_slug/:story_id", (req, res) => {
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

router.post("/add_story/:storyset_slug", auth.login_required, (req, res) => {
  const storyset_slug = req.params.storyset_slug;
  if (!stories.hasStoryset(storyset_slug)) {
    res.sendStatus(404);
  } else {
    if (!stories.canEdit(storyset_slug, res.locals.user)) {
          return res.renderForbidden();
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

router.get("/add_story/:storyset_slug", auth.login_required, (req, res) => {
  const storyset_slug = req.params.storyset_slug;
  if (!stories.hasStoryset(storyset_slug)) {
    return res.sendStatus(404);
  }
  if (!stories.canEdit(storyset_slug, res.locals.user)) {
    return res.renderForbidden();
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

router.get("/edit/:storyset_slug/:story_id", auth.login_required, (req, res) => {
  const storyset_slug = req.params.storyset_slug;
  const story_id = parseInt(req.params.story_id, 10);

  const storyset = stories.getStoryset(storyset_slug);

  if (storyset == null || isNaN(story_id)) {
    return res.sendStatus(404);
  }

  if (!storyset.editableBy(res.locals.user)) {
    return res.renderForbidden();
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

router.post("/edit/:storyset_slug/:story_id", auth.login_required, (req, res) => {
  const storyset_slug = req.params.storyset_slug;
  const story_id = req.params.story_id;
  if (!stories.hasStoryset(storyset_slug) || !stories.hasStory(story_id)) {
    res.sendStatus(404);
  } else {
    if (!stories.canEdit(storyset_slug, res.locals.user)) {
          return res.renderForbidden();
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

router.post("/delete/:storyset_slug/:story_id", auth.login_required, (req, res) => {
  const storyset_slug = req.params.storyset_slug;
  const story_id = parseInt(req.params.story_id, 10);
  if (isNaN(story_id)) {
    return res.sendStatus(404);
  }
  const storyset = stories.getStoryset(storyset_slug);
  if (storyset == null) {
    return res.sendStatus(404);
  }
  if (!storyset.editableBy(res.locals.user)) {
    return res.renderForbidden("Nie możesz usunąć tej historii, ponieważ nie jesteś autorem zestawu.");
  }
  const story = storyset.stories.find((story) => story.id === story_id);
  if (story == null) {
    return res.sendStatus(404);
  }
  stories.deleteStoryById(story_id);
  res.redirect(`/edit/${storyset_slug}`);
});

export default router;