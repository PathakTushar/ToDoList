const express = require("express");
const https = require("https");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set('view engine', 'ejs');

mongoose.connect('mongodb+srv://tushar:2SkkHKAdbWln5U0i@cluster0.kxfeamy.mongodb.net/todolistDb');

const itemsSchema = {
    name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
    name: "Welcome to your todolist!"
});
const item2 = new Item({
    name: "Hit the + button to add a new item."
});
const item3 = new Item({
    name: "<--Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = {
    name: String,
    items: [itemsSchema]
}
const List = mongoose.model("List", listSchema);


app.get("/", (req, res) => {

    var today = new Date();
    // var day = ""
    // if (today.getTime() === 0 || today.getTime() === 6)
    //     day = "weekend day";
    // else
    //     day = "working day";

    var options = {
        weekday: "long",
        day: "numeric",
        month: "long"
    };

    var day = today.toLocaleDateString("en-US", options);

    Item.find({}, (err, items) => {
        if (items.length === 0) {
            Item.insertMany(defaultItems, (err) => {
                if (err) console.log(err);
                else console.log("added successfully!!");
            });
            res.redirect("/");
        }
        else res.render("list", { listTitle: "Today", newListItems: items });
    })
})
app.get("/:customListName", (req, res) => {
    // console.log(req.params.customListName);
    const customListName = _.capitalize(req.params.customListName);

    List.findOne({ name: customListName }, (err, foundList) => {
        if (!err) {
            if (!foundList) {
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });
                list.save();
                res.redirect("/" + customListName);
            }
            else {
                res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
            }
        }

    });


})

app.post("/", (req, res) => {
    const itemName = req.body.newItem;
    const listName = req.body.button;
    const item = new Item({
        name: itemName
    });
    if (listName === "Today") {
        item.save();
        res.redirect("/");
    }
    else {
        List.findOne({ name: listName }, (err, foundList) => {
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + listName);
        });
    }

})
app.post("/delete", (req, res) => {
    // console.log(req.body.checkbox);
    const id = req.body.checkbox;
    const listName = req.body.listName;

    if (listName === "Today") {
        Item.findByIdAndRemove(id, (err) => {
            if (err) console.log(err);
            else console.log("removed!!");
        });
        res.redirect("/");
    }
    else {
        List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: id } } }, (err, foundList) => {
            if (!err) {
                res.redirect("/" + listName);
            }
        });
    }


})

app.listen(process.env.PORT || 3000, () => {
    console.log("server is running on port 3000");
})