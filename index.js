import express from "express";
import morgan from "morgan";
import stories from "./systems/stories.js";

const port = 8000;

const app = express();
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded());

app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.render("categories", {
    title: "Kategorie",
    categories: stories.getCategorySummaries(),
  });
});

app.get("/view/:category_id", (req, res) => {
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
        // category id may have changed due to name change
        res.redirect("/view/" + category.id);
      } else {
        // This should never happen
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
