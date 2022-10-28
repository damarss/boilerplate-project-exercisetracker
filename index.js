const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

try {
  mongoose.connect(process.env.MONGO_URI);
  console.log("Database connected successfully");
} catch (err) {
  console.error(err);
}

// user schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
});

// exercise schema
const exerciseSchema = new mongoose.Schema({
  username: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: Date, required: true },
  user_id: { type: String, required: true }
});

const User = mongoose.model("User", userSchema);
const Exercise = mongoose.model("Exercise", exerciseSchema);

app.use(cors());
app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app
  .route("/api/users")
  .get((req, res) => {
    User.find({}, (err, data) => {
      if (err) return res.json({ error: err });
      const result = [];
      data.map((user) => {
        result.push({ username: user.username, _id: user._id });
      });
      res.json(result);
    });
  })
  .post((req, res) => {
    const { username } = req.body;
    const newUser = new User({ username });
    newUser.save((err, data) => {
      if (err) return res.json({ error: err });
      res.json({ username: data.username, _id: data._id });
    });
  });

app.post("/api/users/:_id/exercises", async (req, res) => {
  const { _id } = req.params;
  let { description, duration, date } = req.body;
  try {
    const existedUser = await User.findById(_id);
    if (!date) date = new Date()
    else date = new Date(date);
    const newExercise = new Exercise({
      user_id: _id,
      username: existedUser.username,
      description,
      duration,
      date,
    });
    newExercise.save((err, data) => {
      if (err) {
        console.log(err);
        return res.json({ error: err });
      }
      res.json({
        username: data.username,
        description: data.description,
        duration: data.duration,
        date: data.date.toDateString(),
        _id: data.user_id,
      });
    });
  } catch (err) {
    console.error(err);
    res.json({ error: err });
  }
});

app.get("/api/users/:id/logs", async (req, res) => {
  const { id } = req.params;
  let { from, to, limit } = req.query;
  try {
    const user = await User.findById(id);
    let exercises = [];
    if (from && to) {
      if (limit) exercises = await Exercise.find({ user_id: id, date: {$gte: from,$lte: to}}).limit(limit)
      else exercises = await Exercise.find({ user_id: id, date: {$gte: from,$lte: to}});
    } else if (limit) {
      exercises = await Exercise.find({ user_id: id }).limit(limit);
    } else {
      exercises = await Exercise.find({ user_id: id });
    }
    const exerciseResult = [];
    exercises.map((exercise) => {
      exerciseResult.push({
        description: exercise.description,
        duration: exercise.duration,
        date: exercise.date.toDateString()
      });
    });
    console.log({
      username: user.username,
      count: exercises.length,
      _id: user._id.toString(),
      log: exerciseResult,
    })
    res.json({
      username: user.username,
      count: exercises.length,
      _id: user._id.toString(),
      log: exerciseResult,
    });
    
  } catch (err) {
    console.log(err);
    res.json({ error: err });
  }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
