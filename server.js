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
              if(!req.session.loggedIn) {
                  req.session.loggedIn = false;
              }
              knex.from('approveditems')
                .then(function (itemsCollection) {
                    req.session.items = itemsCollection;
                    res.render('pages/index', {error: false, items: itemsCollection, categories: categoriesCollection, categorySelected: 'None', loggedIn: req.session.loggedIn, alert: false, user: req.session.user});
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
                req.session.user = user.attributes;
                req.session.userId = user.attributes.UserId;
                req.session.loggedIn = true;
                res.render('pages/index', {error: false, alert: false, items: req.session.items, categories: req.session.categories, categorySelected: req.session.selectedCategoryId, loggedIn: req.session.loggedIn, user: req.session.user});
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
                req.session.user = user.attributes;
                req.session.userId = user.attributes.UserId;
                Cart.forge({
                    CartId: uuid.v1(),
                    UserId: userId
                })
                .save(null, {method: 'insert'})
                .then(function (cart) {
                    req.session.cartId = cart.attributes.CartId;
                    res.render('pages/index', {error: false, alert: false, items: req.session.items, categories: req.session.categories, categorySelected: req.session.selectedCategoryId, loggedIn: req.session.loggedIn, user: req.session.user});
                })
                .catch(function (err) {
                    res.render('pages/index', {error: true, message: err.message, items: req.session.items, categories: req.session.categories, loggedIn: req.session.loggedIn, categorySelected: req.session.selectedCategoryId, user: req.session.user});
                });
            })
            .catch(function (err) {
                console.log(err.code == 'ER_DUP_ENTRY');
                if (err.code == 'ER_DUP_ENTRY') {
                    res.render('pages/index', {error: true, alert: false, message: 'Email Address already exists! Try logging in.', items: req.session.items, categories: req.session.categories, loggedIn: req.session.loggedIn, categorySelected: req.session.selectedCategoryId});
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

app.get('/checkout', function (req, res) {
    if(req.session.loggedIn) {

    }
    else {
        for(var i = 0; i < req.session.cartitems.length; i++){

        }
    }
});

app.post('/getCategory', function(req, res) {
    //  var decoded = jwt.verify(req.body.token, JWTKEY);
    //   if(decoded) {
        req.session.selectedCategoryId = req.body.categorySelectId;
        if(req.session.selectedCategoryId == 'all') {
          if(req.body.searchTerm == '') {
            knex.from('approveditems').innerJoin('itemcategory', 'approveditems.ItemId', 'itemcategory.ItemId')
              .then(function(categoryItems) {
                  req.session.items = categoryItems;
                  res.render('pages/index', {error: false, alert: false, items: categoryItems, categories: req.session.categories, categorySelected: req.session.selectedCategoryId, loggedIn: req.session.loggedIn, user: req.session.user});
              })
              .catch(function (err){
                  res.status(500).json({error: true, message: err.message});
            })
          }
          else {
            knex.from('approveditems').innerJoin('itemcategory', 'approveditems.ItemId', 'itemcategory.ItemId')
              .where('ItemName', 'LIKE', '%'+req.body.searchTerm+'%')
              .then(function(categoryItems) {
                  req.session.items = categoryItems;
                  res.render('pages/index', {error: false, alert: false, items: categoryItems, categories: req.session.categories, categorySelected: req.session.selectedCategoryId, loggedIn: req.session.loggedIn, user: req.session.user});
              })
              .catch(function (err){
                  res.status(500).json({error: true, message: err.message});
            })
          }
        }
        else {
          if(req.body.searchTerm == '') {
            knex.from('approveditems').innerJoin('itemcategory', 'approveditems.ItemId', 'itemcategory.ItemId')
              .where('CategoryId',req.session.selectedCategoryId)
              .then(function(categoryItems) {
                  req.session.items = categoryItems;
                  res.render('pages/index', {error: false, alert: false, items: categoryItems, categories: req.session.categories, categorySelected: req.session.selectedCategoryId, loggedIn: req.session.loggedIn, user: req.session.user});

              })
              .catch(function (err){
                  res.status(500).json({error: true, message: err.message});
            })
          }
          else {
            knex.from('approveditems').innerJoin('itemcategory', 'approveditems.ItemId', 'itemcategory.ItemId')
              .where('CategoryId',req.session.selectedCategoryId)
              .andWhere('ItemName', 'LIKE', '%'+req.body.searchTerm+'%')
              .then(function(categoryItems) {
                  req.session.items = categoryItems;
                  res.render('pages/index', {error: false, alert: false, items: categoryItems, categories: req.session.categories, categorySelected: req.session.selectedCategoryId, loggedIn: req.session.loggedIn, user: req.session.user});
              })
              .catch(function (err){
                  res.render('pages/index', {error: true, message: err.message, user: req.session.user});
            })
          }
        }

      // }else {
      //   res.json({error: true, data: {message: 'invalid token'}});
      // }
    
});

app.post('/getCart', function (req, res){
    if(!req.session.loggedIn) {
        if(!req.session.cartitems || req.session.cartitems.length == 0) {
            res.render('pages/cart', {error: false, alert: false, cartitems: [], items: req.session.items, categories: req.session.categories, categorySelected: req.session.selectedCategoryId, loggedIn: req.session.loggedIn, user: req.session.user});
        }
        else {
            var itemIds = [];
            for (var j = 0; j < req.session.cartitems.length; j++) {
                itemIds.push(req.session.cartitems[j].item);
            }
            knex.select('ItemId', 'Quantity as totalQuantity', 'ItemName', 'Description', 'Price', 'Discount', 'OnSale').from('approveditems')
                .whereIn('ItemId', itemIds)
                .then(function (items) {
                    var approveditems =[];
                    for (var index = 0; index < items.length; index++) {
                        items[index].Quantity = req.session.cartitems[index]['quantity'];
                        approveditems.push(items[index]);
                        if(index == req.session.cartitems.length - 1) {
                            res.render('pages/cart', {
                                error: false,
                                alert: false,
                                cartitems: approveditems,
                                items: req.session.items,
                                categories: req.session.categories,
                                categorySelected: req.session.selectedCategoryId,
                                loggedIn: req.session.loggedIn
                            });
                        }
                    }
                })
                .catch(function (err) {
                    res.render('pages/cart', {
                        error: true,
                        message: err.message,
                        cartitems: [],
                        items: req.session.items,
                        categories: req.session.categories,
                        categorySelected: req.session.selectedCategoryId,
                        loggedIn: req.session.loggedIn
                    });
                });
            }
        } else {
            knex.select('cartItem.ItemId', 'cartitem.Quantity', 'approveditems.Quantity as totalQuantity', 'approveditems.ItemName', 'approveditems.Description', 'approveditems.Price', 'approveditems.Discount', 'approveditems.OnSale').from('cartitem').innerJoin('cart', 'cartitem.CartId', 'cart.CartId').innerJoin('approveditems', 'cartitem.ItemId', 'approveditems.ItemId')
                .where('cart.UserId', req.session.userId)
                .then(function (cartitems) {
                    console.log(cartitems);
                    res.render('pages/cart', {
                        error: false,
                        alert: false,
                        cartitems: cartitems,
                        categories: req.session.categories,
                        categorySelected: req.session.selectedCategoryId,
                        loggedIn: req.session.loggedIn,
                        user: req.session.user
                    });
                })
                .catch(function (err) {
                    console.log(err);
                    res.render('pages/cart', {
                        error: true,
                        message: err.message,
                        caritems: [],
                        totalPrice: 0,
                        items: req.session.items,
                        categories: req.session.categories,
                        categorySelected: req.session.selectedCategoryId,
                        loggedIn: req.session.loggedIn,
                        user: req.session.user
                    });
                });
        }
});

app.post('/deleteItem', function (req, res) {
   if(req.session.loggedIn) {
       knex.from('cart')
           .where('UserId', req.session.userId)
           .then( function (cart) {
               knex.from('cartitem')
                   .where('CartId', cart[0].CartId)
                   .andWhere('ItemId', req.body.itemId)
                   .del()
                   .then( function (count) {
                       res.redirect(307, '/getCart');
                   })
                   .catch( function (err) {
                       res.render('pages/cart', {
                           error: true,
                           message: err.message,
                           cartitems: [],
                           items: req.session.items,
                           categories: req.session.categories,
                           categorySelected: req.session.selectedCategoryId,
                           loggedIn: req.session.loggedIn,
                           user: req.session.user
                       });
                   })
           })
           .catch(function (err) {
               res.render('pages/cart', {
                   error: true,
                   message: err.message,
                   cartitems: [],
                   items: req.session.items,
                   categories: req.session.categories,
                   categorySelected: req.session.selectedCategoryId,
                   loggedIn: req.session.loggedIn,
                   user: req.session.user
               });
           });
   }
   else {
       var index = -1;
       for (var i = 0; i < req.session.cartitems.length; i++) {
           console.log(i);
           if (req.session.cartitems[i] == req.body.itemId) {
               index = i;
           }
       }
       req.session.cartitems.splice(index, 1);
       console.log(req.session.cartitems);
       res.redirect(307, '/getCart');
   }
});

app.post('/saveCart', function(req, res) {
    if(req.session.loggedIn) {
        console.log(req.session.userId+" "+req.body.itemId + " "+req.body.itemQuantity);
        knex.from('cartitem').innerJoin('cart', 'cart.CartId', 'cartitem.CartId')
            .where('cart.UserId', req.session.userId)
            .andWhere('cartitem.ItemId', req.body.itemId)
            .update({Quantity: req.body.itemQuantity})
            .then(function (cartItem) {
                res.redirect(307, '/getCart');
            })
            .catch(function (err) {
                res.render('pages/cart', {
                    error: true,
                    message: err.message,
                    cartitems: [],
                    items: req.session.items,
                    categories: req.session.categories,
                    categorySelected: req.session.selectedCategoryId,
                    loggedIn: req.session.loggedIn,
                    user: req.session.user
                });
            })
    }
    else  {
        for(var i = 0; i < req.session.cartitems.length; i++) {
            if (req.session.cartitems[i].item == req.body.itemId) {
                req.session.cartitems[i].quantity = req.body.itemQuantity;
                res.redirect(307, '/getCart');
            }
        }
    }
});

app.post('/addToCart', function(req,res){
    if (req.session.loggedIn) {
        knex('cartitem').innerJoin('cart', 'cart.CartId', 'cartItem.CartId')
            .where('cart.UserId', req.session.userId)
            .where('cartItem.ItemId', req.body.itemId)
            .then(function (items) {
                if(items.length > 0) {
                    var Cartid = items[0].CartId;
                    knex('approvedItems')
                        .where('ItemId', req.body.itemId)
                        .then( function (appItems) {
                            console.log(items[0].Quantity+" "+appItems[0].Quantity);
                            if (items[0].Quantity < appItems[0].Quantity) {
                                knex('cartitem')
                                    .where('ItemId', req.body.itemId)
                                    .andWhere('CartId', Cartid)
                                    .increment('Quantity', 1)
                                    .then(function (cartitem) {
                                        res.redirect(307, '/getCart');
                                    })
                                    .catch( function (err) {
                                        res.redirect(307, '/getCart');
                                    })
                            }
                            else {
                                res.redirect(307, '/getCart');
                            }
                        })
                }
                else{
                    knex('cart')
                        .where('UserId', req.session.userId)
                        .then( function (cart) {
                            CartItem.forge({
                                CartId: cart[0].CartId,
                                ItemId: req.body.itemId,
                                Quantity: 1
                            })
                                .save(null, {method: 'insert'})
                                .then(function (cartitem) {
                                    res.redirect(307, '/getCart');
                                })
                                .catch(function (err) {
                                    res.redirect(307, '/getCart');
                                });
                        })
                }
            })
            .catch( function (err) {

            });
    }
    else {
        if (!req.session.cartitems) {
            req.session.cartitems = [];
            knex.from('approveditems')
                .where('ItemId', req.body.itemId)
                .then( function(items) {
                    req.session.cartitems.push({item: req.body.itemId, quantity: 1, totalQuantity: items[0].Quantity});
                    res.redirect(307, '/getCart');
                })
                .catch(function (err) {

                });
        }
        else {
            var existing = 0;
            var index = -1;
            for (var i = 0; i < req.session.cartitems.length; i++) {
                if (req.session.cartitems[i].item == req.body.itemId) {
                    existing = 1;
                    index = i;
                    console.log('existing');
                }
            }
            if (existing == 0) {
                req.session.cartitems.push({item: req.body.itemId, quantity: 1});
                res.redirect(307, '/getCart');
            }
            else {
                knex.from('approveditems')
                    .where('ItemId',req.body.itemId)
                    .then( function (items) {
                        console.log('came in');
                        if (items[0].Quantity > req.session.cartitems[index].quantity) {
                            req.session.cartitems[index].quantity = req.session.cartitems[index].quantity + 1;
                            console.log(req.session.cartitems[index]);
                            res.redirect(307, '/getCart');
                        }
                        else {
                            res.redirect(307, '/getCart');
                        }
                    })
                    .catch(function (err) {
                        console.log(err);
                    });
            }
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