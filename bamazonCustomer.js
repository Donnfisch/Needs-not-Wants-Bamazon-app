var mysql = require("mysql");
var inquirer = require('inquirer');
var json_tb = require('json-table');
var sqlConnect = require('./connection.js'); 


checkIfDB();


// checks to see if database already exists

function checkIfDB() {
	
	sqlConnect.query(
		'SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = "bamazon"',

		function (err, res) {
			if (err) throw err;

			if (!res[0]) {
				createDB();
			}

			else {
				displayInventory();
			}
		}
	);
}

function createDB() {

  sqlConnect.query(
		'CREATE DATABASE IF NOT EXISTS bamazon',

		function (err, res) {
			if (err) throw err;
		}
	);

	useDatabase();

	sqlConnect.query(
		'CREATE TABLE IF NOT EXISTS products (' +
		  'item_id INT NOT NULL AUTO_INCREMENT,' +
		  'product_name VARCHAR(32) NOT NULL,' +
 		  'department_name VARCHAR(32) NOT NULL,' +
 		  'price DEC(10,2) NOT NULL DEFAULT 0,' +
 		  'stock_quantity INT(10) DEFAULT 0,' +
		 'PRIMARY KEY (item_id)' +
	  ')',

		function (err, res) {
			if (err) throw err;
		}
	);

	var values = [
		['Fat Replica Blob', 'Science Education', 23.10, 13],
		['Unicorn Mask', 'Costumes & Accessories', 8.99, 21],
		['Steel Storage Building 10 x 15', 'Outdoor Storage', 1,499.00, 46],
		['AK-47 Bullet Ice Cube Mold', 'Specialty Tools & Gadgets', 7.99, 7],
		['The Gutenberg Bible', 'Literature & Fiction', 111.67 , 1],
		['Giant Googly Eyes', 'Gag Toys', 9.99 , 59],
		['Cereal Marshmallows 8 Pounds', 'Heaven', 49.99, 100],
		['Thumb Piano', 'Musical Instrument', 17.75, 53],
		['Senior Woman with Asthma Wall Decal', 'Gag Toys', 24.96 , 29],
		['Yodelling Pickle', 'Gag Toys', 11.24, 11],
		['Car French Fry Holder', 'Cup Holders', 12.95, 12],
		['Corgi butt shoulder bag', 'Costumes & Accessories', 10.95, 30]
	];

	sqlConnect.query(
		'INSERT INTO products ' +
		'(product_name, department_name, price, stock_quantity) ' +
		'VALUES ?', [values],

		function (err, res) {
			if (err) throw err;
		}
	);

	displayInventory();
	itemArray.push(values); 
}

function useDatabase() {
	sqlConnect.query(
		'USE bamazon',

		function (err, res) {
			if (err) throw err;
		}
	);
}

function displayInventory() {
	console.log('\n Welcome to $$~Needs not Wants~$$ \n');

	useDatabase();

	sqlConnect.query(
		'SELECT item_id, product_name, department_name, price, stock_quantity FROM products',
		function (err, res) {
			if (err) throw err;

			if (res) {

				//prints JSON object into a table using npm json-table

				var json_tb_out = new json_tb(res, {
					chars: {
            'top': '═' , 'top-mid': '╤' , 'top-left': '╔' ,
            'top-right': '╗', 'bottom': '═' , 'bottom-mid': '╧' ,
            'bottom-left': '╚' , 'bottom-right': '╝', 'left': '║' ,
            'left-mid': '╟' , 'mid': '─' , 'mid-mid': '┼',
            'right': '║' , 'right-mid': '╢' , 'middle': '│'
					}
				},

				function(table) {
					table.show();
					confirmPurchase();
				});
			}
		}
	);
}

function confirmPurchase() {

	inquirer.prompt(
		{
			name: 'confirm',
			type: 'confirm',
			message: 'Would you like to order?',
			default: 'true'
		}
	)
	.then(function(answers) {
		if (answers.confirm) {
			purchasePrompt();
		}

		else {
			console.log('\n Have fun with your purchase. Later.\n');
			sqlConnect.end();
		}
	});
}

function purchasePrompt() {
	inquirer.prompt([
		{
			name: 'id',
			type: 'input',
			message: 'Which item_id would you like to buy?',
			validate: function(input) {
				pattern = '^[0-9]+$';
				isValid = input.match(pattern);

				if(isValid) {
					return true;
				}

				else {
					return 'Invalid input. Enter an integer item_id.';
				}
			}
		},
		{
			name: 'qty',
			type: 'input',
			message: 'How many of that item would you like to buy?',
			validate: function(input) {
				pattern = '^[0-9]+$';
				isValid = input.match(pattern);

				if(isValid) {
					return true;
				}

				else {
					return 'Invalid input. Enter an integer quantity.';
				}
			}
		}
	])

	.then(function checkStock(answers) {
		var buyQty = Number(answers.qty);
		var id = Number(answers.id);

		sqlConnect.query(
			'SELECT * FROM products WHERE ?',
			{item_id: id},

			function(err, res) {
				if (err) throw err;

				if (res[0]) {
					var stockQty = res[0].stock_quantity;

					if (buyQty > stockQty) {
						console.log(
							'\nThe store does not have ' +
							buyQty + ' of item_id ' + id +
							'. Please revise your selection.\n'
						);
						purchasePrompt();
					}

					else {
						purchase(buyQty, res[0]);
					}
				}

				else {
					console.log('\nThat item_id does not exist yet, try another.\n');
					purchasePrompt();
				}
			}
		);
	});
}

function purchase(buyQty, itemData) {
	var id = itemData.item_id;
	var price = itemData.price;
	var stockQty = itemData.stock_quantity;
	var newStockQty = stockQty - buyQty;
	var cost = (price * buyQty).toFixed(2);

	sqlConnect.query(
		'UPDATE products SET ? WHERE ?',
		[{
			stock_quantity: newStockQty
		},
		{
      item_id: id
		}],
		function(err, res) {
			if (err) throw err;

			else {
				console.log(
				  '\nPurchase complete for Qty(' +
				  buyQty + ') of item_id ' + id +
				  ' at a total cost of $' + cost + '.\n'
				);

				setTimeout(displayInventory, 5000);
			}
		}
	);
}
