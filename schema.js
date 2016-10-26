var Schema = {
  items: {
    ItemId: {type: 'string', maxlength: 254, nullable: false, primary: true},
    ItemName: {type: 'string', maxlength: 50, nullable: false},
    Description: {type: 'string', maxlength: 500, nullable: false},
    Price: {type: 'decimal', nullable: false},
    OnSale: {type: 'boolean', nullable: false},
    Discount: {type: 'decimal', nullable: true},
    Quantity: {type: 'integer', nullable: false}
  },
  categories: {
    CategoryId: {type: 'string', maxlength: 254, nullable: false, primary: true},
    CategoryName: {type: 'string', maxlength: 50, nullable: false}
  },
  itemCategory: {
    CategoryId: {type: 'string', maxlength: 254, nullable: false},
    ItemId: {type: 'string', maxlength: 254, nullable: false}
  }
};
module.exports = Schema;