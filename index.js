import express from "express";
import ejs from "ejs";

const port = 8000;
const categoriess = {
  "fantasy": {
    name: "fantasy",
    stores: [
      {title: "Miau", desc: "mia mia mia mia mia"},
      {title: "Miau", desc: "mia mia mia mia mia1"},
      {title: "Miau", desc: "mia mia mia mia mia2"},
      {title: "Miau", desc: "mia mia mia mia mia3"},
    ],
  },
  "science-fiction": {
    name: "science fiction",
    stories: [
      {title: "Miau1", desc: "mia mia mia mia mia"},
      {title: "Miau2", desc: "mia mia mia mia mia2"},
      {title: "Miau3", desc: "mia mia mia mia mi3a"},
      {title: "Miau4", desc: "mia mia mia mia mia4"},
    ],
  },
};

const app = express();

app.set("view engine", "ejs");

app.use(express.static("public"));

app.get("/", (req, res) => {
  res.render("categories", {
    title: "Kategorie",
    categories: Object.entries(categoriess).map(([id, category]) => {
      return { id, name: category.name };
    }),
  });
});

app.get("/:category_id", (req, res) => {
  if(categoriess.hasOwnProperty(req.params.category_id)){
    const category=categoriess[req.params.category_id];
    res.render("category", {
      title: category.name,
      category,
    });
  } else {
    res.sendStatus(404);
  }
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});



// import express from "express";
// import ejs from "ejs";

// const port = 8000;
// const card_categories = {
//   "j-angielski-food": {
//     name: "j. angielski - food",
//     cards: [
//       { front: "truskawka", back: "strawberry" },
//       { front: "gałka muszkatołowa", back: "nutmeg" },
//       { front: "jabłko", back: "apple" },
//       { front: "karczoch", back: "artichoke" },
//       { front: "cielęcina", back: "veal" },
//     ],
//   },
//   "stolice-europejskie": {
//     name: "stolice europejskie",
//     cards: [
//       { front: "Holandia", back: "Amsterdam" },
//       { front: "Włochy", back: "Rzym" },
//       { front: "Niemcy", back: "Berlin" },
//       { front: "Węgry", back: "Budapeszt" },
//       { front: "Rumunia", back: "Bukareszt" },
//     ],
//   },
// };

// const app = express();
// app.set("view engine", "ejs");
// app.use(express.static("public"));

// app.get("/cards", (req, res) => {
//   res.render("categories", {
//     title: "Kategorie",
//     categories: Object.entries(card_categories).map(([id, category]) => {
//       return { id, name: category.name };
//     }),
//   });
// });

// app.get("/cards/:category_id", (req, res) => {
//   if (card_categories.hasOwnProperty(req.params.category_id)) {
//     const category = card_categories[req.params.category_id];
//     res.render("category", {
//       title: category.name,
//       category,
//     });
//   } else {
//     res.sendStatus(404);
//   }
// });

// app.listen(port, () => {
//   console.log(`Server listening on http://localhost:${port}`);
// });
