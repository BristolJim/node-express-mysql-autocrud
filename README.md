# Node.js, Express, EJS, MySQL AutoCRUD

AutoCRUD is a *basic* (not at all fully-featured) framework for the simplification of Create, Read, Update, Delete database functionality. It's aim is to automate the laborious task of manually creating HTML forms and tables for every table you need to manage in a given database.

It does this by reading the table schema(s), making some best-guess choices about HTML labels, form inputs etc., and then optionally overriding them with a user-supplied, table properties JSON object.

## Example

### MySQL

```mysql
CREATE TABLE `grocery_types` (
  `id` int(10) UNSIGNED NOT NULL,
  `grocery_type` varchar(255) NOT NULL DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `grocery_types` (`id`, `grocery_type`) VALUES
(1, 'Fresh Fruit'),
(2, 'Fresh Vegetables');

CREATE TABLE `groceries` (
  `id` int(10) UNSIGNED NOT NULL,
  `grocery_types_id` int(10) UNSIGNED NOT NULL DEFAULT '0',
  `name` varchar(255) NOT NULL DEFAULT '',
  `price` decimal(4,2) UNSIGNED NOT NULL DEFAULT '0.00',
  `discount` tinyint(3) UNSIGNED NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `groceries` (`id`, `grocery_types_id`, `name`, `price`, `discount`) VALUES
(1, 1, 'Apples', '0.75', 10),
(2, 1, 'Pears', '0.80', 0),
(3, 2, 'Courgettes', '1.40', 5),
(4, 2, 'Carrots', '1.05', 2);
```
### User-supplied table properties

```javascript
t['groceries'] = {
    "rowItem": "grocery",
    "rowItemTC": "Grocery",
    "many_to_one": [{
        "foreign_table": "grocery_types",
        "local_key": "grocery_types_id",
        "option_field": "grocery_type"
    }],
    "columns": {
        "grocery_types_id": {
            "label": "Grocery Type",
            "inputType": "select"
        },
        "price": {
            "label": "Price/kg",
            "prepend": "£"
        },
        "discount": {
            "append": "%"
        }
    }
}

t['grocery_types'] = {
    "one_to_many": [{
        "foreign_table": "groceries",
        "foreign_key": "grocery_types_id"
    }]
}
```

### Live example based on the above

https://autocrud.jamesevans.net/db/grocery_types/
