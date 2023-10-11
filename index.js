import express from "express";
import mysql from "mysql";
import cors from "cors";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import bodyParser from "body-parser";

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors());

const db = mysql.createConnection({
  host: "127.0.0.1",
  user: "root",
  password: "",
  database: "inventory_management_db"
});

db.connect((err) => {
  if (err) {
    console.error("Error connecting to MySql database: ", err);
  } else {
    console.log("Connected to MySql Database");
  }
});

const secretKey = "qwerty789654";

// register endpoint
app.post("/register", async (req, res) => {
  try {
    let { name, email, password, confirmpassword } = req.body;
    const insertQuery =
      "INSERT INTO register (name, email, password, confirmpassword) VALUES (?, ?, ?, ?)";
    db.query(insertQuery, [name, email, password, confirmpassword], (err) => {
      if (err) {
        console.error("Error inserting data:", err);
        res.status(500).json({ error: "Error inserting data" });
      } else {
        res.status(200).json({ message: "Data inserted successfully" });
      }
    });
  } catch (e) {
    console.error("Error inserting data:", e);
  }
});


app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const query = "SELECT * FROM register WHERE email = ? AND password = ?";
  db.query(query, [email, password], (err, results) => {
    if (err) {
      console.error("Error querying the database:", err);
      res.status(500).json({ error: "Server error" });
      return;
    }

    if (results.length === 1) {
      const user = results[0];
      const token = jwt.sign({ user_id: user.user_id }, secretKey, {
        expiresIn: "1h",
      });
      res.cookie("jwt", token, { httpOnly: true });
      res.status(200).json({
        token,
        user_id: user.user_id,
        email: user.email,
        message: "Login successful"
      });
    } else {
      res.status(401).json({ error: "Invalid email or password" });
    }
  });
});


app.get("/api/getUsers", (req, res) => {
  db.query("SELECT * FROM register", (err, results) => {
    if (err) {
      console.error("Error Executing Mysql query", err);
      res.status(500).json({ error: "Internal Server Error" });
      return;
    }
    res.json(results);
  });
});

//categories table
app.get("/categorylist", (req, res) => {
  const q = "SELECT * FROM categories";
  db.query(q, (err, data) => {
    if (err) return res.json(err);
    return res.status(200).json(data);
  });
});


app.post("/addCategory", async (req, res) => {
  let { category_id, name } = req.body;
  const insertQuery =
    "INSERT INTO categories (category_id, name) VALUES (?, ?)";
  db.query(insertQuery, [category_id, name], (err) => {
    if (err) {
      console.error("Error inserting data:", err);
      res.status(500).json({ error: "Error inserting data" });
    } else {
      res.status(200).json({ message: "Data inserted successfully", category_id });
    }
  });
});


app.delete("/deleteCategory/:category_id", (req, res) => {
  const category_id = req.params.category_id;
  const deleteQuery = "DELETE FROM categories WHERE category_id = ?";

  db.query(deleteQuery, [category_id], (err, results) => {
    if (err) {
      console.error("Error deleting category:", err);
      res.status(500).json({ message: "Server Error" });
    } else {
      if (results.affectedRows === 0) {
        res.status(404).json({ message: "Category not found" });
      } else {
        console.log("Category Deleted");
        res.status(200).json({ message: "Category Deleted" });
      }
    }
  });
});

app.put("/updateCategory/:category_id", (req, res) => {
  const q =
    "UPDATE categories SET name = ? WHERE category_id = ?";
  const values = [
    req.body.name
  ];
  db.query(q, [...values, req.params.category_id], (err) => {
    if (err) return res.json(err);
    return res.status(200).json("success");
  });
});


//products table
app.get("/productlist", (req, res) => {
  const q = "SELECT * FROM products";
  db.query(q, (err, data) => {
    if (err) return res.json(err);
    return res.status(200).json(data);
  });
});


app.post("/addProduct", async (req, res) => {
  let { product_id, product_name, description, price, quantity, category_id } = req.body;
  const insertQuery =
    "INSERT INTO products  (product_id, product_name, description, price,  quantity,  category_id) VALUES (?, ?, ?,?,?,?)";
  db.query(insertQuery, [product_id, product_name, description, price, quantity, category_id], (err) => {
    if (err) {
      console.error("Error inserting data:", err);
      res.status(500).json({ error: "Error inserting data" });
    } else {
      res.status(200).json({ message: "Data inserted successfully", product_id });
    }
  });
});


app.delete("/deleteProduct/:product_id", (req, res) => {
  const product_id = req.params.product_id;
  const deleteProductQuery = "DELETE FROM products WHERE product_id = ?";
  db.query(deleteProductQuery, [product_id], (err, results) => {
    if (err) {
      console.error("Error deleting product:", err);
      res.status(500).json({ message: "Server Error" });
    } else {
      if (results.affectedRows === 0) {
        res.status(404).json({ message: "Product not found" });
      } else {
        console.log("Product Deleted");
        res.status(200).json({ message: "Product Deleted" });
      }
    }
  });
});


app.put("/updateProduct/:product_id", (req, res) => {
  const q =
    "UPDATE products SET product_name = ?, description = ?, price = ?, quantity = ?, category_id =? WHERE product_id = ?";
  const values = [
    req.body.product_name,
    req.body.description,
    req.body.price,
    req.body.quantity,
    req.body.category_id
  ];

  db.query(q, [...values, req.params.product_id], (err) => {
    if (err) return res.json(err);

    return res.status(200).json("success");
  });
});


//To list the products by using category
app.get("/productlists", (req, res) => {
  const q = "SELECT products.*, categories.* FROM products INNER JOIN categories ON products.category_id = categories.category_id";
  db.query(q, (err, data) => {
    if (err) return res.json(err);

    return res.status(200).json(data);
  });
});

//filter by category
app.get('/category/:name', async (req, res) => {
  const { name } = req.params;
  try {
    db.query('SELECT categories.*, products.* FROM categories INNER JOIN products ON categories.category_id = products.category_id WHERE categories.name = ?', [name], (error, results) => {
      if (error) {
        console.error('Error querying the database:', error);
        res.status(500).json('Something went wrong');
      } else {
        res.status(200).json(results);
      }
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json('Something went wrong');
  }
});



//orders table
app.get("/orderslist", (req, res) => {
  const q = "SELECT * FROM orders";
  db.query(q, (err, data) => {
    if (err) return res.json(err);
    return res.status(200).json(data);
  });
});


app.post("/addOrders", async (req, res) => {
  let { order_id, phoneno, status, order_date } = req.body;
  const insertQuery =
    "INSERT INTO orders  (order_id, phoneno,status,order_date) VALUES (?, ?, ?,?)";
  db.query(insertQuery, [order_id, phoneno, status, order_date], (err) => {
    if (err) {
      console.error("Error inserting data:", err);
      res.status(500).json({ error: "Error inserting data" });
    } else {
      res.status(200).json({ message: "Data inserted successfully", order_id });
    }
  });
});


app.delete("/deleteOrder/:order_id", (req, res) => {
  const order_id = req.params.order_id;
  const deleteQuery = "DELETE FROM orders WHERE order_id = ?";

  db.query(deleteQuery, [order_id], (err, results) => {
    if (err) {
      console.error("Error deleting order:", err);
      res.status(500).json({ message: "Server Error" });
    } else {
      if (results.affectedRows === 0) {
        res.status(404).json({ message: "order not found" });
      } else {
        console.log("order Deleted");
        res.status(200).json({ message: "order Deleted" });
      }
    }
  });
});


app.put("/updateOrder/:order_id", (req, res) => {
  const q =
    "UPDATE orders SET  phoneno =?, status =?, order_date =? WHERE order_id = ?";
  const values = [
    req.body.phoneno,
    req.body.status,
    req.body.order_date,
  ];

  db.query(q, [...values, req.params.order_id], (err) => {
    if (err) return res.json(err);

    return res.status(200).json("success");
  });
});


app.put('/orders/:orderId', async (req, res) => {
  try {
    const { status } = req.body;
    const { orderId } = req.params;

    const updateOrderStatusQuery = 'UPDATE orders SET status = ? WHERE order_id = ?';

    db.query(updateOrderStatusQuery, [status, orderId], (error, results) => {
      if (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ error: 'Error updating order status' });
      } else {
        res.status(200).json({ message: 'Order status updated successfully' });
      }
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Error updating order status' });
  }
});


//To decrease the count
app.put("/changeProductCount/:order_id", (req, res) => {
  const { order_id } = req.params;
  const countQuery = `SELECT product_id, quantity FROM order_items WHERE order_id = ?`;

  db.query(countQuery, [order_id], (err, data) => {
    if (err) {
      console.error("Error retrieving data from order_items:", err);
      res.status(500).json({ message: "Server Error" });
    } else {
      console.log("data", data);

      data.forEach((item) => {
        const { product_id, quantity } = item;
        const updateCount = `UPDATE products
          SET quantity = quantity - ?
          WHERE product_id = ?`;
        db.query(updateCount, [quantity, product_id], (err, result) => {
          if (err) {
            console.error("Error updating product quantity:", err);
          } else {
            console.log(`Product ${product_id} quantity updated.`);
          }
        });
      });
      res.status(200).json({ message: "Product quantities updated successfully" });
    }
  });
});



//orderItems table
app.get("/orderitemslist", (req, res) => {
  const q = "SELECT * FROM order_items";

  db.query(q, (err, data) => {
    if (err) return res.json(err);

    return res.status(200).json(data);
  });
});


app.post("/addOrderItem", async (req, res) => {
  let { order_item_id, order_id, product_id, quantity } = req.body;
  const insertQuery =
    "INSERT INTO order_items  ( order_item_id,  order_id, product_id, quantity) VALUES (?, ?, ?, ?)";
  db.query(insertQuery, [order_item_id, order_id, product_id, quantity], (err) => {
    if (err) {
      console.error("Error inserting data:", err);
      res.status(500).json({ error: "Error inserting data" });
    } else {
      res.status(200).json({ message: "Data inserted successfully", order_item_id });
    }
  });
});


app.delete("/deleteOrderItem/:order_item_id", (req, res) => {
  const order_item_id = req.params.order_item_id;
  const deleteQuery = "DELETE FROM order_items  WHERE order_item_id = ?";
  db.query(deleteQuery, [order_item_id], (err, results) => {
    if (err) {
      console.error("Error deleting order:", err);
      res.status(500).json({ message: "Server Error" });
    } else {
      if (results.affectedRows === 0) {
        res.status(404).json({ message: "order not found" });
      } else {
        console.log("order Deleted");
        res.status(200).json({ message: "order Deleted" });
      }
    }
  });
});


app.put("/updateOrderItem/:order_item_id", (req, res) => {
  const q =
    "UPDATE order_items SET  order_id = ?, product_id = ?, quantity= ? WHERE order_item_id = ?";
  const values = [
    req.body.order_id,
    req.body.product_id,
    req.body.quantity
  ];

  db.query(q, [...values, req.params.order_item_id], (err) => {
    if (err) return res.json(err);

    return res.status(200).json("success");
  });
});


app.get('/order-items/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const selectOrderItemsQuery = 'SELECT * FROM order_items WHERE order_id = ?';
    db.query(selectOrderItemsQuery, [orderId], (error, orderItems) => {
      if (error) {
        console.error('Error fetching order items:', error);
        return res.status(500).json({ error: 'Error fetching order items' });
      }
      res.status(200).json(orderItems);
    });
  } catch (error) {
    console.error('Error fetching order items:', error);
    res.status(500).json({ error: 'Error fetching order items' });
  }
});


//logout
app.get("/logout", (req, res) => {
  res.clearCookie("jwt");
  res.status(200).json({ message: "Logout successful" });
});

//server
app.listen(2001, () => {
  console.log("Listening in port 2001");
});

