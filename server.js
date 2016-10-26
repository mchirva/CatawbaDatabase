var knex = require('knex')({
    client: 'mysql',
    connection: {
        host     : 'localhost',
        user     : 'root',
        password : '',
        database : 'Catawba',
        charset  : 'utf8'
  }
});

var express = require("express");
var Bookshelf = require('bookshelf')(knex);
var bodyParser = require('body-parser');
var jwt    = require('jsonwebtoken');

var app = express();
var router = express.Router();

var JWTKEY = 'CatawbaDatabase'; // Key for Json Web Token

// body-parser middleware for handling request variables
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.set('view engine', 'ejs');

var Item = Bookshelf.Model.extend({
    tableName: 'items'
});

var Category = Bookshelf.Model.extend({
  tableName: 'categories'
});


var CategoryItem = Bookshelf.Model.extend({
  tableName: 'itemCategory',
    category: function() {
        return this.belongsTo(Category, "CategoryId");
    },
    item: function() {
        return this.belongsTo(Item, "ItemId");
    }
});

var Items = Bookshelf.Collection.extend({
  model: Item
});

var Categories = Bookshelf.Collection.extend({
  model: Category
});

var selectedCategoryId = "";
var categories = {};
app.get('/', function(req, res) {
    //var decoded = jwt.verify(req.body.token, JWTKEY);
      //if(decoded) {
        knex.from('categories')
          .then(function (categoriesCollection) {
              knex.from('items')
                .then(function (itemsCollection) {
                  categories = categoriesCollection;
                  res.render('pages/index', {error: false, items: itemsCollection, categories: categoriesCollection, categorySelected: 'None'});
                })
                .catch(function (err) {
                  res.status(500).json({error: true, data: {message: err.message}});
              });
          })
          .catch(function (err) {
               
          });
        
        //  }else {
          //  res.json({error: true, data: {message: 'invalid token'}});
          //}
});

app.post('/getCategory', function(req, res) {
    //  var decoded = jwt.verify(req.body.token, JWTKEY);
    //   if(decoded) {
        selectedCategoryId = req.body.categorySelectId;
        if(selectedCategoryId == 'all') {
          if(req.body.searchTerm == '') {
            knex.from('items').innerJoin('itemCategory', 'items.ItemId', 'itemCategory.ItemId')
              .then(function(categoryItems) {
                  res.render('pages/index', {error: false, items: categoryItems, categories: categories, categorySelected: selectedCategoryId});
              })
              .catch(function (err){
                  res.status(500).json({error: true, data: {message: err.message}});
            })
          }
          else {
            knex.from('items').innerJoin('itemCategory', 'items.ItemId', 'itemCategory.ItemId')
              .where('ItemName', 'LIKE', req.body.searchTerm)
              .then(function(categoryItems) {
                  res.render('pages/index', {error: false, items: categoryItems, categories: categories, categorySelected: selectedCategoryId});
              })
              .catch(function (err){
                  res.status(500).json({error: true, data: {message: err.message}});
            })
          }
        }
        else {
          if(req.body.searchTerm == '') {
            knex.from('items').innerJoin('itemCategory', 'items.ItemId', 'itemCategory.ItemId')
              .where('CategoryId',selectedCategoryId)
              .then(function(categoryItems) {
                  res.render('pages/index', {error: false, items: categoryItems, categories: categories, categorySelected: selectedCategoryId});
              })
              .catch(function (err){
                  res.status(500).json({error: true, data: {message: err.message}});
            })
          }
          else {
            knex.from('items').innerJoin('itemCategory', 'items.ItemId', 'itemCategory.ItemId')
              .where('CategoryId',selectedCategoryId)
              .andWhere('ItemName', 'LIKE', req.body.searchTerm)
              .then(function(categoryItems) {
                  res.render('pages/index', {error: false, items: categoryItems, categories: categories, categorySelected: selectedCategoryId});
              })
              .catch(function (err){
                  res.status(500).json({error: true, data: {message: err.message}});
            })
          }
        }
         
      // }else {
      //   res.json({error: true, data: {message: 'invalid token'}});
      // }
      console.log('Came in!');
      console.log(req.body);
    
});

app.get('/about', function(req, res) {
    res.render('pages/about');
});

app.listen(3000,function(){
  console.log("Live at Port 3000");
});