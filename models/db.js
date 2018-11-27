const util = require('util')

//
// Table and Column Definitions
//

exports.db_table_definitions = function (table) {
    let t = {};

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

    return t[table];
}

//
//  tableProperties: Many-to-one options
//

exports.db_many_to_one_options = function(req, res, tableProperties) {
  return new Promise(function (resolve, reject) {

    if (tableProperties.hasOwnProperty('many_to_one') && Array.isArray(tableProperties['many_to_one'])) {
      let manyToOne = tableProperties['many_to_one'];

      resolve(Promise.all(manyToOne.map(function (conf) {
        return exports.db_column_options(req, res, conf, tableProperties);
      })));
    } else {
      resolve(tableProperties);
    }

  })

    .then(function (tableProperties) {
        let options = tableProperties;

        if (Array.isArray(options)) {
            tableProperties = options[0].tableProperties;

            for (i = 0; i < options.length; i++) {
                let field  = options[i]['field'];
                let o = options[i]['options'];

                tableProperties.columns[field].options = o;
            }
        }

        return tableProperties;
    })

}

exports.db_column_options = function(req, res, conf, tableProperties) {
    let parentTable = conf.foreign_table;
    let field = conf.local_key;
    let option_field = conf.option_field || 'name';

    return new Promise(function (resolve, reject) {
        req.getConnection(function (err, connection) {
            let parentTableQuery = connection.query(`SELECT * FROM ${parentTable}`, function (err, parentRows) {
                if (err) {
                    console.log("Error: ", err);
                    reject(err);
                } else {
                    let options = [];
                    for (j = 0; j < parentRows.length; j++) {
                        options.push({
                            "value": parentRows[j]['id'],
                            "option": parentRows[j][option_field]
                        })
                    }

                    resolve({
                        "tableProperties": tableProperties,
                        "field": field,
                        "options": options
                    });
                }
            });
        });
    });
}

//
//  tableProperties: One-to-many rows
//

exports.db_one_to_many_rows = function(req, res, tableProperties, id) {

    return new Promise(function (resolve, reject) {

        if (tableProperties.hasOwnProperty('one_to_many') &&
        Array.isArray(tableProperties['one_to_many'])) {

            let oneToMany = tableProperties['one_to_many'];

            resolve(Promise.all(oneToMany.map(function (conf) {
                conf.id = id;
                return exports.db_one_to_many_column_rows(req, res, conf, tableProperties);
            })));

        } else {
            resolve(tableProperties);
        }

    })

    .then(function (tableProperties) {
        let rows = tableProperties;

        if (Array.isArray(rows)) {
            tableProperties = rows[0].tableProperties;

            for (i = 0; i < rows.length; i++) {
                let foreign_table  = rows[i]['foreign_table'];
                let otm = tableProperties.one_to_many.find(x => x.foreign_table === foreign_table)

                otm.foreign_table_properties = rows[i]['foreign_table_properties'];
                otm.foreign_table_properties.rows = rows[i]['child_rows'];
                // otm.rows = rows[i]['child_rows'];
            }
        }

        return tableProperties;
    });

}

exports.db_one_to_many_column_rows = function(req, res, conf, tableProperties) {

    let foreignTable = conf.foreign_table;
    let foreignKey = conf.foreign_key || 'id';
    let id = conf.id;

    return new Promise(function (resolve, reject) {
      if(id != null) {
        req.getConnection(function (err, connection) {
            let childTableQuery = connection.query(`SELECT * FROM ${foreignTable} WHERE ${foreignKey} = ${id}`, function (err, childRows) {
                if (err) {
                    console.log("Error: ", err);
                    reject(err);
                } else {
                    resolve(childRows);
                }
            });
        });
      } else {
        resolve([]);
      }
    })

    .then(function (childRows) {
        return exports.db_get_table_properties(req, res, foreignTable, null)

        .then(function (foreignTableProperties) {
            return {
                "foreign_table": foreignTable,
                "foreign_table_properties": foreignTableProperties,
                "child_rows": childRows,
                "tableProperties": tableProperties
            }
        })

    });

}
//
//  tableProperties: Many-to-many rows
//

exports.db_many_to_many_rows = function(req, res, tableProperties, id) {

    return new Promise(function (resolve, reject) {

        if (tableProperties.hasOwnProperty('many_to_many') &&
        Array.isArray(tableProperties['many_to_many'])) {

            let manyToMany = tableProperties['many_to_many'];

            resolve(Promise.all(manyToMany.map(function (conf) {
                conf.id = id;
                return exports.db_many_to_many_column_rows(req, res, conf, tableProperties);
            })));

        } else {
            resolve(tableProperties);
        }

    })

    .then(function (tableProperties) {
        let rows = tableProperties;

        if (Array.isArray(rows)) {
            tableProperties = rows[0].tableProperties;

            for (i = 0; i < rows.length; i++) {
                let foreign_table  = rows[i]['foreign_table'];
                let mtm = tableProperties.many_to_many.find(x => x.foreign_table === foreign_table)

                mtm.foreign_table_properties = rows[i]['foreign_table_properties'];
                mtm.join_table_properties = rows[i]['join_table_properties'];
                mtm.join_table_properties.rows = rows[i]['child_rows'];
            }
        }
        // console.log(util.inspect(tableProperties, false, null, true /* enable colors */));

        return tableProperties;
    });

}

exports.db_many_to_many_column_rows = function(req, res, conf, tableProperties) {

    let localTable = tableProperties.table;
    let foreignTable = conf.foreign_table;
    let joinTable = conf.join_table;
    let localJoinKey = conf.local_join_key || localTable + '_id';
    let foreignJoinKey = conf.foreign_join_key || foreignTable + '_id';
    let foreignKey = conf.foreign_key || 'id';
    let id = conf.id;

    var returnObj = {
      "tableProperties": tableProperties,
      "foreign_table": foreignTable,
      "join_table": foreignTable
    }

    return new Promise(function (resolve, reject) {
      if(id != null) {
        req.getConnection(function (err, connection) {
            let childTableQuery = connection.query(`SELECT * FROM ${foreignTable}, ${joinTable} WHERE ${joinTable}.${localJoinKey} = ${id} AND ${joinTable}.${foreignJoinKey} = ${foreignTable}.${foreignKey}`, function (err, childRows) {
                if (err) {
                    console.log("Error: ", err);
                    reject(err);
                } else {
                    resolve(childRows);
                }
            });
        });
      } else {
        resolve([]);
      }
    })

    .then(function (childRows) {
      returnObj.child_rows = childRows;

      return exports.db_get_table_properties(req, res, foreignTable, null)
    })

    .then(function (foreignTableProperties) {
      returnObj.foreign_table_properties = foreignTableProperties;

      return exports.db_get_table_properties(req, res, joinTable, null)
    })

    .then(function (joinTableProperties) {
      returnObj.join_table_properties = joinTableProperties;

      return returnObj;
    })

}

//
// db_get_table_properties: Main function to get and set table & field properties
//

exports.db_get_table_properties = function (req, res, table, id) {

    //
    //  Initialise tableProperties
    //
    return new Promise(function (resolve, reject) {

        let t = {};

        t.table = table;
        t.rowItemTCPlural = exports.formatted_column_name(table, 'tc');
        t.rowItemUCPlural = exports.formatted_column_name(table, 'uc');
        t.rowItemUCFirstPlural = exports.formatted_column_name(table, 'ucfirst');
        t.rowItemLCPlural = exports.formatted_column_name(table, 'lc');

        t.rowItemTC = t.rowItemTCPlural.replace(/s$/ig, '');
        t.rowItemUC = t.rowItemUCPlural.replace(/s$/ig, '');
        t.rowItemUCFirst = t.rowItemUCFirstPlural.replace(/s$/ig, '');
        t.rowItemLC = t.rowItemLCPlural.replace(/s$/ig, '');

        t.schema = [];
        t.columns = {};
        t.inputValues = {};

        resolve(t);

    })

    //
    //  tableProperties: Add table schema
    //
    .then(function (tableProperties) {

        return new Promise(function (resolve, reject) {
            req.getConnection(function (err, connection) {
                let query = connection.query(`DESCRIBE ${table}`, function (err, rows) {
                    if (err) {
                        console.log("Error: ", err);
                        reject(err);
                    } else {
                        tableProperties.schema = rows;
                        resolve(tableProperties);
                    }
                });
            });
        });

    })

    //
    //  tableProperties: Set column properties
    //
    .then(function (tableProperties) {

        for (i = 0; i < tableProperties.schema.length; i++) {

            let schema = tableProperties.schema[i];
            let field = schema.Field;

            tableProperties.columns[field] = {};

            tableProperties.columns[field].label = exports.formatted_column_name(field, 'tc');
            tableProperties.columns[field].nameTC = exports.formatted_column_name(field, 'tc');
            tableProperties.columns[field].nameUC = exports.formatted_column_name(field, 'uc');
            tableProperties.columns[field].nameUCFirst = exports.formatted_column_name(field, 'ucfirst');
            tableProperties.columns[field].nameLC = exports.formatted_column_name(field, 'lc');

            // HTML form input types & attributes
            if (field == 'id') {
                tableProperties.columns[field].inputType = "hidden";
            } else if (schema.Type == 'date') {
                tableProperties.columns[field].inputType = "date";
            } else if (
                schema.Type.match(/^decimal\(\d+,\d+\)(| unsigned)$/) ||
                schema.Type.match(/^int\(\d+\)(| unsigned)$/) ||
                schema.Type.match(/^tinyint\(\d+\)(| unsigned)$/)
            ) {
                tableProperties.columns[field].inputType = "number";
            } else if (
                schema.Type.match(/^varchar\(\d+\)$/)
            ) {
                tableProperties.columns[field].inputType = "text";
            } else if (schema.Type.match(/^enum\((.+)\)$/)) {
                let options = RegExp.$1;

                options = options.replace(/'/g, '');
                options = options.split(",");

                for (j = 0; j < options.length; j++) {
                    options[j] = {
                        "value": options[j],
                        "option": options[j]
                    }
                }

                tableProperties.columns[field].options = options;
                tableProperties.columns[field].inputType = "radio";
            } else if (schema.Type == 'text') {
                tableProperties.columns[field].inputType = "textarea";
            } else {
                tableProperties.columns[field].inputType = null;
            }

            // Default values for HTML form input
            let inputValue = schema.Default != null ? schema.Default : '';
            tableProperties.inputValues[field] = inputValue;
            tableProperties.columns[field].required = '';
        }

        tableProperties = exports.merge_recursive(tableProperties, exports.db_table_definitions(table));

        return tableProperties;

    })

    //
    //  tableProperties: Set row values
    //
    .then(function (tableProperties) {

        if (id != null) {

            // Row is being edited:
            // Return tableProperties with inputValues for the given row id
            return new Promise(function (resolve, reject) {
                req.getConnection(function (err, connection) {
                    let valuesQuery = connection.query(`SELECT * FROM ${table} WHERE id = ${id} LIMIT 1`, function (err, rows) {
                        if (err) {
                            console.log("Error: ", err);
                            reject(err);
                        } else {
                            tableProperties.inputValues = rows[0];
                            resolve(tableProperties);
                        }
                    })
                })
            })

        } else {

            // Return tableProperties with default inputValues from the table schema
            return tableProperties;

        }
    })

}

//
// Utility Functions
//

// merge_recursive: Recursively merge properties of two objects

exports.merge_recursive = function (obj1, obj2) {
    for (let p in obj2) {
        try {
            // Property in destination object set; update its value.
            if (obj2[p].constructor == Object) {
                // console.log("Property in destination object set - Object: " + p);
                obj1[p] = exports.merge_recursive(obj1[p], obj2[p]);
            } else {
                obj1[p] = obj2[p];
                // console.log("Property in destination object set - Not object: " + p);
            }
        } catch (e) {
            // Property in destination object not set; create it and set its value.
            // console.log("Property in destination object not set: " + p);
            obj1[p] = obj2[p];
        }
    }

    return obj1;
}

// formatted_column_name: Turn field name into readable column name

exports.formatted_column_name = function (columnName, strCase) {
    String.prototype.toTitleCase = function () {
        let i, j, str, lowers, uppers;
        str = this.replace(/([^\W_]+[^\s-]*) */g, function (txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        });

        // Certain minor words should be left lowercase unless
        // they are the first or last words in the string
        lowers = ['A', 'An', 'The', 'And', 'But', 'Or', 'For', 'Nor', 'As', 'At',
            'By', 'For', 'From', 'In', 'Into', 'Near', 'Of', 'On', 'Onto', 'To', 'With'];
        for (i = 0, j = lowers.length; i < j; i++)
            str = str.replace(new RegExp('\\s' + lowers[i] + '\\s', 'g'),
                function (txt) {
                    return txt.toLowerCase();
                });

        // Certain words such as initialisms or acronyms should be left uppercase
        uppers = ['Id', 'Tv'];
        for (i = 0, j = uppers.length; i < j; i++)
            str = str.replace(new RegExp('\\b' + uppers[i] + '\\b', 'g'),
                uppers[i].toUpperCase());

        return str;
    }

    let formattedColumnName = columnName;

    switch (strCase) {
        case 'lc':
            formattedColumnName = formattedColumnName.replace(/_/g, ' ');
            formattedColumnName = formattedColumnName.toLowerCase();
            break;
        case 'uc':
            formattedColumnName = formattedColumnName.replace(/_/g, ' ');
            formattedColumnName = formattedColumnName.toUpperCase();
            break;
        case 'ucfirst':
            formattedColumnName = formattedColumnName.toTitleCase();
            formattedColumnName = formattedColumnName.replace(/_/g, ' ');
            break;
        case 'tc':
            formattedColumnName = formattedColumnName.replace(/_/g, ' ');
            formattedColumnName = formattedColumnName.toTitleCase();
            break;
    }

    return formattedColumnName;
};

//
// Database Functions
//

exports.db_list_query = function (req, res, tableProperties) {
  let table = tableProperties.table;
  let columns = [];
  let tables = [];
  let joins = [];

  tables.push(table)
  columns.push(table + ".*");

  return new Promise(function (resolve, reject) {

    if (tableProperties.hasOwnProperty('many_to_one') && Array.isArray(tableProperties['many_to_one'])) {
      let manyToOne = tableProperties['many_to_one'];

      resolve(Promise.all(manyToOne.map(function (conf) {
        return exports.db_get_table_properties(req, res, conf.foreign_table, null);
      })));
    } else {
      resolve(tableProperties);
    }

  })

  .then(function (mtoTableProperties) {
      if (Array.isArray(mtoTableProperties)) {
          for (i = 0; i < mtoTableProperties.length; i++) {
            let mto = tableProperties.many_to_one.find(x => x.foreign_table === mtoTableProperties[i].table)

            for (j = 0; j < mtoTableProperties[i].schema.length; j++) {
              columns.push(mto.foreign_table + "." + mtoTableProperties[i].schema[j].Field + " AS " + mto.foreign_table + "_" + mtoTableProperties[i].schema[j].Field);
            }

            joins.push(`LEFT JOIN ${mto.foreign_table} ON ${table}.${mto.local_key} = ${mtoTableProperties[i].table}.id`);
          }
      }

      columns = columns.join(', ');
      tables = tables.join(', ');
      joins = joins.join(' ');

      return `SELECT ${columns} FROM ${tables} ${joins}`;
  })

}

exports.db_list = function (req, res, cb) {
    let table = req.params.table;
    let tableProperties = {};
    let q = "";

    exports.db_get_table_properties(req, res, table, null)

    .then(function (tp) {
      tableProperties = tp;
      return exports.db_list_query(req, res, tableProperties);
    })

    .then(function (query) {
        q = query;

        return new Promise(function (resolve, reject) {
            req.getConnection(function (err, connection) {
              console.log(q);
              let query = connection.query(q, function (err, rows) {

                  if (err) {
                      console.log("Error Selecting : %s ", err + ' ' + query.sql);
                      reject(err);
                  } else {
                      tableProperties.rows = rows;
                      resolve(tableProperties);
                  }
              });

              // console.log(query.sql);
            });

        })
    })

    .then(function (tableProperties) {
        cb(tableProperties.rowItemTCPlural, tableProperties);
    });

};

exports.db_add = function (req, res, cb) {
    let table = req.params.table,
        id = null;

    exports.db_get_table_properties(req, res, table, id)

    // Many-to-one options
    .then(function (tableProperties) {
        return exports.db_many_to_one_options(req, res, tableProperties);
    })

    // One-to-many rows
    .then(function (tableProperties) {
        return exports.db_one_to_many_rows(req, res, tableProperties, id);
    })

    // Many-to-many rows
    .then(function (tableProperties) {
        return exports.db_many_to_many_rows(req, res, tableProperties, id);
    })

    .then(function (tableProperties) {
        cb("Add " + table, tableProperties);
    });
};

exports.db_add_save = function (req, res, cb) {
    let table = req.params.table;
    let post_data = JSON.parse(JSON.stringify(req.body));

    req.getConnection(function (err, connection) {
        let query = connection.query(`INSERT INTO ${table} SET ?`, [post_data], function (err, rows) {
            if (err)
                console.log("Error inserting : %s ", err);

            cb();
        });

        // console.log(query.sql);
    });
};

exports.db_edit = function (req, res, cb) {
    let table = req.params.table,
        id = req.params.id;

    exports.db_get_table_properties(req, res, table, id)

    // Many-to-one options
    .then(function (tableProperties) {
        return exports.db_many_to_one_options(req, res, tableProperties);
    })

    // One-to-many rows
    .then(function (tableProperties) {
        return exports.db_one_to_many_rows(req, res, tableProperties, id);
    })

    // Many-to-many rows
    .then(function (tableProperties) {
        return exports.db_many_to_many_rows(req, res, tableProperties, id);
    })

    .then(function (tableProperties) {
        cb("Edit " + table, tableProperties);
    });

};

exports.db_edit_save = function (req, res, cb) {
    let table = req.params.table,
        post_data = JSON.parse(JSON.stringify(req.body));

    req.getConnection(function (err, connection) {
        connection.query(`UPDATE ${table} SET ? WHERE id = ${post_data.id}`, [post_data], function (err, rows) {

            if (err)
                console.log("Error Updating : %s ", err);

            cb(table);

        });
    });
};

exports.db_delete = function (req, res, cb) {
    let table = req.params.table,
        id = req.params.id;

    req.getConnection(function (err, connection) {
        connection.query(`DELETE FROM ${table} WHERE id = ${id}`, function (err, rows) {
            if (err)
                console.log("Error deleting : %s ", err);

            cb(table);
        });
    });
};
