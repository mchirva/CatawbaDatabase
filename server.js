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
var uuid = require('uuid');

var app = express();

app.use(require('morgan')('dev'));

var session = require('express-session');

var FileStore = require('session-file-store')(session);

app.use(session({
    name: 'server-session-cookie-id',
    secret: 'catawba secret',
    saveUninitialized: true,
    resave: true,
    store: new FileStore()
}));

var router = express.Router();


app.use(express.static(__dirname))

var JWTKEY = 'CatawbaDatabase'; // Key for Json Web Token

// body-parser middleware for handling request variables
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.set('view engine', 'ejs');

var ApprovedItem = Bookshelf.Model.extend({
    tableName: 'approveditems'
});

var CartItem = Bookshelf.Model.extend({
    tableName: 'cartitem'
});

var Category = Bookshelf.Model.extend({
  tableName: 'categories'
});

var User = Bookshelf.Model.extend({
    tableName: 'applicationuser'
});

var CategoryItem = Bookshelf.Model.extend({
  tableName: 'itemCategory',
    category: function() {
        return this.belongsTo(Category, "CategoryId");
    },
    approveditem: function() {
        return this.belongsTo(ApprovedItem, "ItemId");
    }
});

var Cart = Bookshelf.Collection.extend({
    model: 'cart'
});

var ApprovedItems = Bookshelf.Collection.extend({
  model: ApprovedItem
});

var Categories = Bookshelf.Collection.extend({
  model: Category
});

app.get('/', function(req, res) {
    //var decoded = jwt.verify(req.body.token, JWTKEY);
      //if(decoded) {
    console.log(__dirname + '/images');
        knex.from('categories')
          .then(function (categoriesCollection) {
              req.session.categories = categoriesCollection;
              req.session.loggedIn = false;
              knex.from('approveditems')
                .then(function (itemsCollection) {
                    req.session.items = itemsCollection;
                    res.render('pages/index', {error: false, items: itemsCollection, categories: categoriesCollection, categorySelected: 'None', loggedIn: req.session.loggedIn});
                })
                .catch(function (err) {
                    res.render('pages/index', {error: true, message: err.message});
              });
          })
          .catch(function (err) {
              res.status(500).json({error: true, message: err.message});
          });
        
        //  }else {
          //  res.json({error: true, data: {message: 'invalid token'}});
          //}
});

app.post('/login', function (req, res) {
    var email = req.body.email;
    var password = req.body.password;
    User.forge({EmailId: email, Password: password})
        .fetch()
        .then(function (user) {
            if (!user) {
                res.render('pages/index', {error: true, message: "Invalid user credentials", items: req.session.items, categories: req.session.categories, loggedIn: req.session.loggedIn, categorySelected: req.session.selectedCategoryId});
            } else {
                req.session.userId = user.attributes.UserId;
                req.session.loggedIn = true;
                res.render('pages/index', {error: false, items: req.session.items, categories: req.session.categories, categorySelected: req.session.selectedCategoryId, loggedIn: req.session.loggedIn, user: user.attributes});
            }
        })
        .catch(function (err) {
            res.render('pages/index', {error: true, message: err.message, items: req.session.items, categories: req.session.categories, loggedIn: req.session.loggedIn, categorySelected: req.session.selectedCategoryId});
        });
});

app.post('/register', function (req, res) {
    var userId = uuid.v1();
    var name = req.body.name;
    var email = req.body.email;
    var password = req.body.password;
    var repassword = req.body.repassword;
    var newsletter = (req.body.newsletter == "on") ? 1 : 0;
    if (password == repassword) {
        User.forge({
            UserId: userId,
            Name: name,
            EmailId: email,
            Password: password,
            IsSubscribed: newsletter,
            Role: 'User'
        })
            .save(null, {method: 'insert'})
            .then(function (user) {
                req.session.loggedIn = true;
                Cart.forge({
                    CartId: uuid.v1(),
                    UserId: userId
                })
                .save(null, {method: 'insert'})
                .then(function (cart) {
                    req.session.cartId = cart.attributes.CartId;
                    res.render('pages/index', {error: false, items: req.session.items, categories: req.session.categories, categorySelected: req.session.selectedCategoryId, loggedIn: req.session.loggedIn, user: user.attributes});
                })
                .catch(function (err) {
                    res.render('pages/index', {error: true, message: err.message, items: req.session.items, categories: req.session.categories, loggedIn: req.session.loggedIn, categorySelected: req.session.selectedCategoryId});
                });
            })
            .catch(function (err) {
                console.log(err.code == 'ER_DUP_ENTRY');
                if (err.code == 'ER_DUP_ENTRY') {
                    res.render('pages/index', {error: true, message: 'Email Address already exists! Try logging in.', items: req.session.items, categories: req.session.categories, loggedIn: req.session.loggedIn, categorySelected: req.session.selectedCategoryId});
                }
                else{
                    res.render('pages/index', {error: true, message: err.message, items: req.session.items, categories: req.session.categories, loggedIn: req.session.loggedIn, categorySelected: req.session.selectedCategoryId});
                }
            });
    }
    else{
        res.render('pages/index', {error: true, message: 'Passwords do not match! Please try again.', items: req.session.items, categories: req.session.categories, loggedIn: req.session.loggedIn, categorySelected: req.session.selectedCategoryId});
    }
});

app.post('/getCategory', function(req, res) {
    //  var decoded = jwt.verify(req.body.token, JWTKEY);
    //   if(decoded) {
        req.session.selectedCategoryId = req.body.categorySelectId;
        if(req.session.selectedCategoryId == 'all') {
          if(req.body.searchTerm == '') {
            knex.from('approveditems').innerJoin('itemcategory', 'items.ItemId', 'itemcategory.ItemId')
              .then(function(categoryItems) {
                  req.session.items = categoryItems;
                  res.render('pages/index', {error: false, items: categoryItems, categories: req.session.categories, categorySelected: req.session.selectedCategoryId, loggedIn: req.session.loggedIn});
              })
              .catch(function (err){
                  res.status(500).json({error: true, message: err.message});
            })
          }
          else {
            knex.from('approveditems').innerJoin('itemcategory', 'items.ItemId', 'itemcategory.ItemId')
              .where('ItemName', 'LIKE', '%'+req.body.searchTerm+'%')
              .then(function(categoryItems) {
                  req.session.items = categoryItems;
                  res.render('pages/index', {error: false, items: categoryItems, categories: req.session.categories, categorySelected: req.session.selectedCategoryId, loggedIn: req.session.loggedIn});
              })
              .catch(function (err){
                  res.status(500).json({error: true, message: err.message});
            })
          }
        }
        else {
          if(req.body.searchTerm == '') {
            knex.from('approveditems').innerJoin('itemcategory', 'items.ItemId', 'itemcategory.ItemId')
              .where('CategoryId',req.session.selectedCategoryId)
              .then(function(categoryItems) {
                  req.session.items = categoryItems;
                  res.render('pages/index', {error: false, items: categoryItems, categories: req.session.categories, categorySelected: req.session.selectedCategoryId, loggedIn: req.session.loggedIn});
              })
              .catch(function (err){
                  res.status(500).json({error: true, message: err.message});
            })
          }
          else {
            knex.from('approveditems').innerJoin('itemcategory', 'items.ItemId', 'itemcategory.ItemId')
              .where('CategoryId',req.session.selectedCategoryId)
              .andWhere('ItemName', 'LIKE', '%'+req.body.searchTerm+'%')
              .then(function(categoryItems) {
                  req.session.items = categoryItems;
                  res.render('pages/index', {error: false, items: categoryItems, categories: req.session.categories, categorySelected: req.session.selectedCategoryId, loggedIn: req.session.loggedIn});
              })
              .catch(function (err){
                  res.status(500).json({error: true, message: err.message});
            })
          }
        }

      // }else {
      //   res.json({error: true, data: {message: 'invalid token'}});
      // }
    
});

app.post('/getCart', function (req, res){
    if(!req.session.loggedIn) {
        if(!req.session.cartitems) {
            res.json()
        }
        else {

        }
    }
});

app.post('/addToCart', function(req,res){
    if (req.session.loggedIn) {
        var ItemId = req.body.itemid;
        var Cartid;
        knex('cart').where(
            'userid', req.session.userId
        ).select('CartId').then(function (cart) {
            Cartid = cart[0].CartId;
            console.log(cart[0].CartId);
            req.session.cartid = cart[0].CartId;
            var insert1 = {CartId: Cartid, ItemId: ItemId, quantity: "1"};
            knex.insert(insert1).into("cartitem").then(function (Item) {
                res.redirect(307, '/getCart');
            })
                .catch(function (err) {
                    if (err.code == 'ER_DUP_ENTRY') {
                        knex('cartitem')
                            .where('ItemId', req.body.itemid)
                            .andWhere('CartId', req.session.cartid)
                            .increment('quantity', 1)
                            .then(function (cartitem) {
                                res.redirect(307, '/getCart');
                            })
                    }
                    else {
                        console.log(err);
                        res.status(500).json({error: true, data: {message: err.message}});
                    }

                })
        });
    }
    else {
        console.log(req.session.cartitems);
        if (!req.session.cartitems) {
            console.log('initiated');
            var cartArray = [];
            cartArray.push(req.body.itemId);
            console.log(cartArray);
            req.session.cartitems = cartArray;
        }
        else {
            console.log('entered');
            console.log(req.session.cartitems);
            var cartArray = req.session.cartitems;
            cartArray.push(req.body.itemId);
            req.session.cartitems = cartArray;
        }
    }
});

app.get('/logout', function (req, res){
    req.session.destroy();
    res.redirect('/');
});


app.listen(3000,function(){
  console.log("Live at Port 3000");
});