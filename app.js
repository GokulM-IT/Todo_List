const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const _ = require('lodash');
const date = require(__dirname + '/views/date.js');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', "ejs");

mongoose.connect('mongodb://127.0.0.1:27017/todoList')
    .then(() => {
        console.log('Database Connected.')
    })

const defaultSchema = {
    name: String
}

const Item = mongoose.model('Item', defaultSchema);

const listSchema = {
    name: String,
    item: [defaultSchema]
}
const List = new mongoose.model('List', listSchema);

const item_Arr = [
    { name: 'Prepare Food' },
    { name: 'Cook Food' },
    { name: 'Serve Food' }
];

app.get('/', function (req, res) {
    Item.find()
        .then(docs => {
            if (docs.length === 0) {
                Item.insertMany(item_Arr)
                    .then(() => {
                        res.redirect('/');
                    })
                    .catch(err => {
                        console.log(err);
                    })
            } else {
                res.render('list', { headTitle: 'Today', listItems: docs });
            }
        })
        .catch(err => {
            console.log(err);
        })
});

app.post('/', function (req, res) {
    const newItem = req.body.textValue;
    const btn = req.body.btn;

    const item = new Item({
        name: newItem
    });

    if (btn === "Today") {
        item.save()
            .then(() => {
                res.redirect('/');
            })
    } else {
        List.findOne({ name: btn })
            .then((matchedList) => {
                matchedList.item.push(item);
                matchedList.save();
                res.redirect('/' + btn);
            })
    }
});

app.post('/delete', (req, res) => {
    const itemID = req.body.checkbox;
    const itemTitle = req.body.itemTitle;

    if(itemTitle === 'Today') {
        Item.findByIdAndDelete(itemID)
        .then(() => {
            res.redirect('/');
        })
        .catch(err => {
            console.log(err);
        })
    } else {
        List.findOneAndUpdate({ name: itemTitle }, { $pull: { item: { _id: itemID } } })
            .then(found => {
                res.redirect('/' + itemTitle);
            })
            .catch(err => {
                console.log(err);
            });
    }
});

app.get('/:customList', (req, res) => {
    const customList = _.capitalize(req.params.customList);

    List.findOne({ name: customList })
        .then(foundMatch => {
            if (!foundMatch) {
                const list = new List({
                    name: customList,
                    item: item_Arr
                });
                list.save()
                    .then(() => {
                        res.redirect('/' + customList);
                    })
            } else {
                res.render('list', { headTitle: foundMatch.name, listItems: foundMatch.item })
            }
        })
        .catch(err => {
            console.log(err);
        })
});

const port = process.env.PORT || 3000;
app.listen(port, function () {
    console.log(`Running on port ${port}`);
});
