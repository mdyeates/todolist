const express = require("express");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();
app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// const items = ["Clean house", "Do dishes", "Collect shopping"];
// const workItems = ["Attend meeting"];

const USER_NAME = process.env.USER_NAME;
const PASSWORD = process.env.PASSWORD;

mongoose.connect(`mongodb+srv://${USER_NAME}:${PASSWORD}@cluster0.x5kber4.mongodb.net/todolistDB`);

const itemsSchema = new mongoose.Schema({
  item: String,
});

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema],
});

const Item = new mongoose.model("Item", itemsSchema);
const List = new mongoose.model("List", listSchema);

const item1 = new Item({
  item: "Welcome to your To Do list!",
});

const item2 = new Item({
  item: "Click the plus button to add a new task",
});

const item3 = new Item({
  item: "Click the checkbox to delete a task",
});

const defaultItems = [item1, item2, item3];
const currentDay = date.getDate();

app.get("/", (req, res) => {
  Item.find({})
    .then((foundItems) => {
      if (foundItems.length === 0) {
        Item.insertMany(defaultItems)
          .then(() => console.log("Added items to DB"))
          .catch((err) => console.log(err));

        res.redirect("/");
      } else {
        res.render("list", { listTitle: currentDay, newListItems: foundItems });
      }
    })
    .catch((err) => console.log(err));
});

app.get("/:customListName", (req, res) => {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName })
    .then((foundList) => {
      if (foundList) {
        // Show existing list
        res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
      } else {
        // Create new list
        const list = new List({
          name: customListName,
          items: defaultItems,
        });
        list.save();
        res.redirect("/" + customListName);
      }
    })
    .catch((err) => console.log(err));
});

app.post("/", (req, res) => {
  console.log(req.body.list);

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    item: itemName,
  });

  if (listName === currentDay) {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName })
      .then((foundList) => {
        foundList.items.push(item);
        foundList.save();
        res.redirect("/" + listName);
      })
      .catch((err) => console.log(err));
  }
});

app.post("/delete", (req, res) => {
  const checkedID = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === currentDay) {
    Item.findByIdAndRemove(checkedID)
      .then(() => console.log("Item Deleted"))
      .catch((err) => console.log(err));

    res.redirect("/");
  } else {
    List.findOne({ name: listName })
      .then((foundList) => {
        foundList.items.pull({ _id: checkedID });
        foundList.save();

        res.redirect("/" + listName);
      })
      .catch((err) => console.log(err));
  }
});

app.get("/about", (req, res) => {
  res.render("about");
});

app.listen(3000, () => {
  console.log("Server started on port 3000");
});
