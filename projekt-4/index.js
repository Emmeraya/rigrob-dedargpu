import express from "express";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import settings from "./systems/settings.js";
import session from "./systems/session.js";
import authRouter from "./routes/auth.routes.js";
import settingsRouter from "./routes/settings.routes.js";
import storysetsRouter from "./routes/storysets.routes.js";
import storiesRouter from "./routes/stories.routes.js";

const port = process.env.PORT || 8000;
const SECRET = process.env.SECRET;

if (SECRET == null) {
  console.error(
    "SECRET environment variable missing.\nPlease create an env file or provide SECRET via environment variables."
  );
  process.exit(1);
}

const app = express();

app.set("view engine", "ejs");

app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));
app.use(morgan("dev"));
app.use(cookieParser(SECRET));
app.use(settings.settingsHandler);
app.use(session.sessionHandler);

function renderForbidden(res, message= "Nie możesz edytować ani usuwać rzeczy, których nie jesteś autorem.") {
  return res.status(403).render("error", {
    title: "Brak uprawnień",
    message,
  });
}

app.use((req, res, next) => {
  res.renderForbidden = (message) => {
    return renderForbidden(res, message);
  };

  next();
});

app.use("/settings", settingsRouter);
app.use("/auth", authRouter);
app.use("/", storysetsRouter);
app.use("/", storiesRouter);

app.listen(port, () => {
  console.log("\nRemember.\nThis site is a joke and should be thought of as one.\n");
  console.log(`Server listening on http://localhost:${port}`);
});