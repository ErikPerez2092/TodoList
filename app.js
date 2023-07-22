//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");

const mongoose = require('mongoose');
const _ = require("lodash");

const app = express();
 
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect(process.env.MONGO_URI, {useNewUrlParser:true});

const itemsSchema = {
  name: String
};

var Item = mongoose.model("Item",itemsSchema);

const item1 = new Item({
  name: "Welcome to your to do list"
});

const item2 = new Item({
  name: "Hit the + button to add a new item."
});

const item3 = new Item({
  name: "Hit this to delete an item"
});

const defaultItems = [item1,item2,item3];

const listSchema = {
  name: String,
  items : [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {
  Item.find().then(function (items) { 

    if(items.length === 0)
    {
      Item.insertMany(defaultItems).then(function () {
        console.log("Successfully saved all the items to DB");
      }).catch(function (err) {
        console.log(err);
      });
      res.redirect("/");
    } 
    else {
      res.render("list", {listTitle: "Today", newListItems: items});
    } 

   }).catch(function (err) { 
    console.log(err);
    });
});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item ({
    name: itemName
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}).then(function (foundList) { 
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    }).catch(function (foundList) {  })
  }

  
  
});


app.post("/delete", function(req, res){

  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId).then(function (param) { 
      console.log("successfully deleted");
     }).catch(function (err) { 
      console.log(err);
      });
  
      res.redirect("/");
  } else {
    List.findOneAndUpdate({name: listName},{$pull: {items: {_id: checkedItemId}}})
    .then(function (foundList) { 
       res.redirect("/" + listName);
     }).catch(function (err) { console.log(err) });
  }

  
  
});

app.get("/:customListName", function(req,res){
  const customListName = _.capitalize(req.params.customListName);

  

  List.findOne({name: customListName}).then(function (param) { 
    if (!param) {
      const list = new List({
        name: customListName,
        items: defaultItems
      });
      list.save();
      res.redirect("/" + customListName);
    } else{
      res.render("list", {listTitle: param.name, newListItems: param.items});
    } 
     
   }).catch(function (param) { 
    console.log(param);
    })
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
