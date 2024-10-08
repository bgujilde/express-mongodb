require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const path = require('path');
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");

const _ = require("lodash");



const app = express();

app.set("view engine", "ejs");
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));

app.use(bodyParser.urlencoded({extended: true}));
app.use('/favicon.ico', (req, res) => res.status(204));


mongoose.connect(process.env.MONGODB_URI);

const itemSchema = new mongoose.Schema({
    name: String
});

const Item = mongoose.model("Item", itemSchema);

const item1 = new Item({
    name: "Learn Crypto"
});

const item2 = new Item({
    name: "Develop System"
});

const item3 = new Item({
    name: "Deploy System"
});

let defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
    name: String,
    items: [itemSchema]
});

const List = new mongoose.model("List", listSchema);




let currentDay = date.getDate();

app.get("/", function(req, res){
    



    async function findItems(){
        let items = await Item.find({});

        if(items.length === 0){
            async function addItems(){
                await Item.insertMany(defaultItems);
            }
            
            addItems();
            res.redirect("/");
        }else{
            res.render("list",{
                listTitle: currentDay,
                newListItems: items
            });
        }
        
    }
    
    findItems();
    
});

app.get("/:customListName", function(req, res){
    let customListName = _.capitalize(req.params.customListName);
    
    async function find(){
        let foundList = await List.findOne({name: customListName});
        if(foundList){
            res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
        }else{
            const list = new List({
                name: customListName,
                items: defaultItems
            });
            list.save();
            res.redirect("/" + customListName);
            
        }
    }
    find();
    
});

app.post("/", function(req, res){
    let itemName = req.body.newItem;
    let listName = req.body.list;
    const item = new Item({
        name: itemName
    });

    if(listName === currentDay){
        item.save();
        res.redirect("/");
    }else{
        async function find(){
            let list = await List.findOne({name: listName});
            list.items.push(item);
            list.save();
            res.redirect("/" + listName);
        }
        find();
    }

    
});

app.post("/delete", function(req, res){
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;
    if(listName === currentDay){
        async function deleteItem(){
            await Item.findByIdAndDelete(checkedItemId);
        }
        deleteItem();
        res.redirect("/");
    }else{
        async function update(){
            await List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}});
        }
        update();
        res.redirect("/" + listName);
    }
    
});

let PORT = 3000;

app.listen(process.env.PORT || PORT, function(){
    console.log("Server is running on port " + PORT);
});
