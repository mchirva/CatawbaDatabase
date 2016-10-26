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

app.get('/', function(req, res) {
    //var decoded = jwt.verify(req.body.token, JWTKEY);
      //if(decoded) {
        //knex.from('items')
          //  .then(function (collection) {
           //     res.render('pages/index', {error: false, collection});
           // })
            //.catch(function (err) {
              //  res.status(500).json({error: true, data: {message: err.message}});
            //});
        //  }else {
          //  res.json({error: true, data: {message: 'invalid token'}});
          //}
    res.render('pages/index');

});


app.get('/about', function(req, res) {
    res.render('pages/about');
});

app.listen(3000,function(){
  console.log("Live at Port 3000");
});