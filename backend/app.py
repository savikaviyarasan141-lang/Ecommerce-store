from dotenv import load_dotenv
import os

# Load environment variables from backend/.env
load_dotenv()

from flask import Flask, request
from flask_cors import CORS
from flask_mysqldb import MySQL
from werkzeug.security import generate_password_hash, check_password_hash


# ==========================================
# Flask App
# ==========================================

app = Flask(__name__)


# ==========================================
# CORS Configuration
# ==========================================

CORS(app, resources={
    r"/api/*": {
        "origins": "http://localhost:5173"
    }
})


# ==========================================
# MySQL Configuration
# ==========================================

app.config["MYSQL_HOST"] = os.getenv("MYSQL_HOST")
app.config["MYSQL_USER"] = os.getenv("MYSQL_USER")
app.config["MYSQL_PASSWORD"] = os.getenv("MYSQL_PASSWORD")
app.config["MYSQL_DB"] = os.getenv("MYSQL_DB")
app.config["MYSQL_CURSORCLASS"] = "DictCursor"

mysql = MySQL(app)


# ==========================================
# Home
# ==========================================

@app.route("/")
def home():
    return "E-Commerce Backend is Running!"


# ==========================================
# Test Database
# ==========================================

@app.route("/api/test-db")
def test_db():

    cursor = mysql.connection.cursor()

    cursor.execute("SELECT DATABASE()")
    result = cursor.fetchone()

    cursor.close()

    return {
        "message": "MySQL Connected Successfully!",
        "database": result["DATABASE()"]
    }


# ==========================================
# Get Products
# ==========================================

@app.route("/api/products", methods=["GET"])
def get_products():

    cursor = mysql.connection.cursor()

    cursor.execute("SELECT * FROM products")
    products = cursor.fetchall()

    cursor.close()

    return {
        "products": products
    }


# ==========================================
# Admin - Add Product
# ==========================================

@app.route("/api/admin/products", methods=["POST"])
def add_product():

    data = request.get_json()

    user_id = data.get("user_id")
    name = data.get("name")
    description = data.get("description")
    price = data.get("price")
    image = data.get("image")
    category = data.get("category")
    stock = data.get("stock")

    if not user_id:
        return {
            "message": "User ID is required"
        }, 400

    cursor = mysql.connection.cursor()

    # Check whether user is admin
    cursor.execute(
        "SELECT role FROM users WHERE id = %s",
        (user_id,)
    )

    user = cursor.fetchone()

    if not user:
        cursor.close()

        return {
            "message": "User not found"
        }, 404

    if user["role"] != "admin":
        cursor.close()

        return {
            "message": "Admin access required"
        }, 403

    # Validate product
    if not name or price is None or stock is None:
        cursor.close()

        return {
            "message": "Name, price and stock are required"
        }, 400

    # Insert product
    cursor.execute(
        """
        INSERT INTO products
        (name, description, price, image, category, stock)
        VALUES (%s, %s, %s, %s, %s, %s)
        """,
        (
            name,
            description,
            price,
            image,
            category,
            stock
        )
    )

    mysql.connection.commit()

    product_id = cursor.lastrowid

    cursor.close()

    return {
        "message": "Product added successfully",
        "product_id": product_id
    }, 201


# ==========================================
# Admin - Update Product
# ==========================================

@app.route("/api/admin/products/<int:product_id>", methods=["PUT"])
def update_product(product_id):

    data = request.get_json()

    user_id = data.get("user_id")
    name = data.get("name")
    description = data.get("description")
    price = data.get("price")
    image = data.get("image")
    category = data.get("category")
    stock = data.get("stock")

    if not user_id:
        return {
            "message": "User ID is required"
        }, 400

    cursor = mysql.connection.cursor()

    # Check admin
    cursor.execute(
        "SELECT role FROM users WHERE id = %s",
        (user_id,)
    )

    user = cursor.fetchone()

    if not user:
        cursor.close()

        return {
            "message": "User not found"
        }, 404

    if user["role"] != "admin":
        cursor.close()

        return {
            "message": "Admin access required"
        }, 403

    # Check product
    cursor.execute(
        "SELECT id FROM products WHERE id = %s",
        (product_id,)
    )

    product = cursor.fetchone()

    if not product:
        cursor.close()

        return {
            "message": "Product not found"
        }, 404

    # Update product
    cursor.execute(
        """
        UPDATE products
        SET name = %s,
            description = %s,
            price = %s,
            image = %s,
            category = %s,
            stock = %s
        WHERE id = %s
        """,
        (
            name,
            description,
            price,
            image,
            category,
            stock,
            product_id
        )
    )

    mysql.connection.commit()

    cursor.close()

    return {
        "message": "Product updated successfully"
    }, 200


# ==========================================
# Admin - Delete Product
# ==========================================

@app.route("/api/admin/products/<int:product_id>", methods=["DELETE"])
def delete_product(product_id):

    data = request.get_json()

    user_id = data.get("user_id")

    if not user_id:
        return {
            "message": "User ID is required"
        }, 400

    cursor = mysql.connection.cursor()

    # Check admin
    cursor.execute(
        "SELECT role FROM users WHERE id = %s",
        (user_id,)
    )

    user = cursor.fetchone()

    if not user:
        cursor.close()

        return {
            "message": "User not found"
        }, 404

    if user["role"] != "admin":
        cursor.close()

        return {
            "message": "Admin access required"
        }, 403

    # Check product
    cursor.execute(
        "SELECT id FROM products WHERE id = %s",
        (product_id,)
    )

    product = cursor.fetchone()

    if not product:
        cursor.close()

        return {
            "message": "Product not found"
        }, 404

    # Delete product
    cursor.execute(
        "DELETE FROM products WHERE id = %s",
        (product_id,)
    )

    mysql.connection.commit()

    cursor.close()

    return {
        "message": "Product deleted successfully"
    }, 200


# ==========================================
# User Registration
# ==========================================

@app.route("/api/register", methods=["POST"])
def register():

    data = request.get_json()

    name = data.get("name")
    email = data.get("email")
    password = data.get("password")

    if not name or not email or not password:
        return {
            "message": "Name, email and password are required"
        }, 400

    cursor = mysql.connection.cursor()

    # Check existing email
    cursor.execute(
        "SELECT id FROM users WHERE email = %s",
        (email,)
    )

    existing_user = cursor.fetchone()

    if existing_user:
        cursor.close()

        return {
            "message": "Email already registered"
        }, 409

    # Hash password
    hashed_password = generate_password_hash(password)

    # Insert user
    cursor.execute(
        """
        INSERT INTO users (name, email, password)
        VALUES (%s, %s, %s)
        """,
        (
            name,
            email,
            hashed_password
        )
    )

    mysql.connection.commit()

    user_id = cursor.lastrowid

    cursor.close()

    return {
        "message": "User registered successfully",
        "user_id": user_id
    }, 201


# ==========================================
# User Login
# ==========================================

@app.route("/api/login", methods=["POST"])
def login():

    data = request.get_json()

    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return {
            "message": "Email and password are required"
        }, 400

    cursor = mysql.connection.cursor()

    # Find user
    cursor.execute(
        """
        SELECT id, name, email, password, role
        FROM users
        WHERE email = %s
        """,
        (email,)
    )

    user = cursor.fetchone()

    cursor.close()

    if not user:
        return {
            "message": "Invalid email or password"
        }, 401

    # Check password
    if not check_password_hash(user["password"], password):
        return {
            "message": "Invalid email or password"
        }, 401

    return {
        "message": "Login successful",
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "role": user["role"]
        }
    }, 200


# ==========================================
# Add Product To Cart
# ==========================================

@app.route("/api/cart", methods=["POST"])
def add_to_cart():

    data = request.get_json()

    user_id = data.get("user_id")
    product_id = data.get("product_id")
    quantity = data.get("quantity", 1)

    if not user_id or not product_id:
        return {
            "message": "User ID and product ID are required"
        }, 400

    if quantity < 1:
        return {
            "message": "Quantity must be at least 1"
        }, 400

    cursor = mysql.connection.cursor()

    # Check product
    cursor.execute(
        """
        SELECT id, stock
        FROM products
        WHERE id = %s
        """,
        (product_id,)
    )

    product = cursor.fetchone()

    if not product:
        cursor.close()

        return {
            "message": "Product not found"
        }, 404

    # Check existing cart item
    cursor.execute(
        """
        SELECT id, quantity
        FROM cart
        WHERE user_id = %s AND product_id = %s
        """,
        (
            user_id,
            product_id
        )
    )

    existing_item = cursor.fetchone()

    if existing_item:

        new_quantity = existing_item["quantity"] + quantity

        if new_quantity > product["stock"]:
            cursor.close()

            return {
                "message": "Insufficient stock"
            }, 400

        cursor.execute(
            """
            UPDATE cart
            SET quantity = %s
            WHERE id = %s
            """,
            (
                new_quantity,
                existing_item["id"]
            )
        )

    else:

        if quantity > product["stock"]:
            cursor.close()

            return {
                "message": "Insufficient stock"
            }, 400

        cursor.execute(
            """
            INSERT INTO cart
            (user_id, product_id, quantity)
            VALUES (%s, %s, %s)
            """,
            (
                user_id,
                product_id,
                quantity
            )
        )

    mysql.connection.commit()

    cursor.close()

    return {
        "message": "Product added to cart successfully"
    }, 201


# ==========================================
# Get Cart
# ==========================================

@app.route("/api/cart/<int:user_id>", methods=["GET"])
def get_cart(user_id):

    cursor = mysql.connection.cursor()

    cursor.execute(
        """
        SELECT
            cart.id,
            cart.product_id,
            products.name,
            products.price,
            products.stock,
            cart.quantity,
            (products.price * cart.quantity) AS subtotal
        FROM cart
        JOIN products
            ON cart.product_id = products.id
        WHERE cart.user_id = %s
        """,
        (user_id,)
    )

    cart_items = cursor.fetchall()

    cursor.close()

    return {
        "user_id": user_id,
        "cart": cart_items
    }


# ==========================================
# Update Cart Quantity
# ==========================================

@app.route(
    "/api/cart/<int:user_id>/<int:product_id>",
    methods=["PUT"]
)
def update_cart_quantity(user_id, product_id):

    data = request.get_json()

    quantity = data.get("quantity")

    if quantity is None or quantity < 1:
        return {
            "message": "Quantity must be at least 1"
        }, 400

    cursor = mysql.connection.cursor()

    # Check product stock
    cursor.execute(
        """
        SELECT stock
        FROM products
        WHERE id = %s
        """,
        (product_id,)
    )

    product = cursor.fetchone()

    if not product:
        cursor.close()

        return {
            "message": "Product not found"
        }, 404

    if quantity > product["stock"]:
        cursor.close()

        return {
            "message": "Insufficient stock"
        }, 400

    # Check cart item
    cursor.execute(
        """
        SELECT id
        FROM cart
        WHERE user_id = %s AND product_id = %s
        """,
        (
            user_id,
            product_id
        )
    )

    cart_item = cursor.fetchone()

    if not cart_item:
        cursor.close()

        return {
            "message": "Product not found in cart"
        }, 404

    # Update quantity
    cursor.execute(
        """
        UPDATE cart
        SET quantity = %s
        WHERE user_id = %s AND product_id = %s
        """,
        (
            quantity,
            user_id,
            product_id
        )
    )

    mysql.connection.commit()

    cursor.close()

    return {
        "message": "Cart quantity updated successfully"
    }, 200


# ==========================================
# Remove Product From Cart
# ==========================================

@app.route(
    "/api/cart/<int:user_id>/<int:product_id>",
    methods=["DELETE"]
)
def remove_from_cart(user_id, product_id):

    cursor = mysql.connection.cursor()

    cursor.execute(
        """
        DELETE FROM cart
        WHERE user_id = %s AND product_id = %s
        """,
        (
            user_id,
            product_id
        )
    )

    if cursor.rowcount == 0:
        cursor.close()

        return {
            "message": "Product not found in cart"
        }, 404

    mysql.connection.commit()

    cursor.close()

    return {
        "message": "Product removed from cart successfully"
    }, 200


# ==========================================
# Checkout
# ==========================================

@app.route("/api/checkout", methods=["POST"])
def checkout():

    data = request.get_json()

    user_id = data.get("user_id")
    shipping_address = data.get("shipping_address")

    if not user_id:
        return {
            "message": "User ID is required"
        }, 400

    if not shipping_address:
        return {
            "message": "Shipping address is required"
        }, 400

    cursor = mysql.connection.cursor()

    try:

        # Get User Cart
        cursor.execute(
            """
            SELECT
                cart.product_id,
                cart.quantity,
                products.price,
                products.stock
            FROM cart
            JOIN products
                ON cart.product_id = products.id
            WHERE cart.user_id = %s
            """,
            (user_id,)
        )

        cart_items = cursor.fetchall()

        # Check empty cart
        if not cart_items:

            cursor.close()

            return {
                "message": "Cart is empty"
            }, 400

        # Calculate Total
        total_amount = 0

        for item in cart_items:

            if item["quantity"] > item["stock"]:

                cursor.close()

                return {
                    "message": "Insufficient stock for product",
                    "product_id": item["product_id"]
                }, 400

            total_amount += (
                item["price"] * item["quantity"]
            )

        # Create Order
        cursor.execute(
            """
            INSERT INTO orders
            (user_id, total_amount, shipping_address)
            VALUES (%s, %s, %s)
            """,
            (
                user_id,
                total_amount,
                shipping_address
            )
        )

        order_id = cursor.lastrowid

        # Create Order Items
        for item in cart_items:

            cursor.execute(
                """
                INSERT INTO order_items
                (order_id, product_id, quantity, price)
                VALUES (%s, %s, %s, %s)
                """,
                (
                    order_id,
                    item["product_id"],
                    item["quantity"],
                    item["price"]
                )
            )

            # Reduce stock
            cursor.execute(
                """
                UPDATE products
                SET stock = stock - %s
                WHERE id = %s
                """,
                (
                    item["quantity"],
                    item["product_id"]
                )
            )

        # Clear Cart
        cursor.execute(
            """
            DELETE FROM cart
            WHERE user_id = %s
            """,
            (user_id,)
        )

        # Save Transaction
        mysql.connection.commit()

        cursor.close()

        return {
            "message": "Order placed successfully",
            "order_id": order_id,
            "total_amount": float(total_amount),
            "shipping_address": shipping_address
        }, 201

    except Exception as e:

        mysql.connection.rollback()

        cursor.close()

        return {
            "message": "Checkout failed",
            "error": str(e)
        }, 500


# ==========================================
# Get User Orders
# ==========================================

@app.route("/api/orders/<int:user_id>", methods=["GET"])
def get_user_orders(user_id):

    cursor = mysql.connection.cursor()

    cursor.execute(
        """
        SELECT
            id,
            total_amount,
            status,
            shipping_address,
            created_at
        FROM orders
        WHERE user_id = %s
        ORDER BY created_at DESC
        """,
        (user_id,)
    )

    orders = cursor.fetchall()

    cursor.close()

    return {
        "orders": orders
    }, 200


# ==========================================
# Get Order Details
# ==========================================

@app.route("/api/orders/<int:order_id>/details", methods=["GET"])
def get_order_details(order_id):

    cursor = mysql.connection.cursor()

    # Get order
    cursor.execute(
        """
        SELECT
            id,
            user_id,
            total_amount,
            status,
            shipping_address,
            created_at
        FROM orders
        WHERE id = %s
        """,
        (order_id,)
    )

    order = cursor.fetchone()

    if not order:

        cursor.close()

        return {
            "message": "Order not found"
        }, 404

    # Get order items
    cursor.execute(
        """
        SELECT
            order_items.product_id,
            products.name,
            order_items.quantity,
            order_items.price,
            (order_items.quantity * order_items.price) AS subtotal
        FROM order_items
        JOIN products
            ON order_items.product_id = products.id
        WHERE order_items.order_id = %s
        """,
        (order_id,)
    )

    items = cursor.fetchall()

    cursor.close()

    return {
        "order": order,
        "items": items
    }, 200


# ==========================================
# Admin - Get All Orders
# ==========================================

@app.route("/api/admin/orders", methods=["GET"])
def get_all_orders():

    user_id = request.args.get("user_id")

    if not user_id:
        return {
            "message": "User ID is required"
        }, 400

    cursor = mysql.connection.cursor()

    # Check admin
    cursor.execute(
        "SELECT role FROM users WHERE id = %s",
        (user_id,)
    )

    user = cursor.fetchone()

    if not user:
        cursor.close()

        return {
            "message": "User not found"
        }, 404

    if user["role"] != "admin":
        cursor.close()

        return {
            "message": "Admin access required"
        }, 403

    # Get all orders
    cursor.execute(
        """
        SELECT
            orders.id,
            orders.user_id,
            users.name AS user_name,
            users.email,
            orders.total_amount,
            orders.status,
            orders.shipping_address,
            orders.created_at
        FROM orders
        JOIN users
            ON orders.user_id = users.id
        ORDER BY orders.created_at DESC
        """
    )

    orders = cursor.fetchall()

    cursor.close()

    return {
        "orders": orders
    }, 200


# ==========================================
# Admin - Update Order Status
# ==========================================

@app.route(
    "/api/admin/orders/<int:order_id>",
    methods=["PUT"]
)
def update_order_status(order_id):

    data = request.get_json()

    user_id = data.get("user_id")
    status = data.get("status")

    if not user_id:
        return {
            "message": "User ID is required"
        }, 400

    if not status:
        return {
            "message": "Status is required"
        }, 400

    allowed_statuses = [
        "Pending",
        "Confirmed",
        "Shipped",
        "Delivered",
        "Cancelled"
    ]

    if status not in allowed_statuses:
        return {
            "message": "Invalid order status"
        }, 400

    cursor = mysql.connection.cursor()

    # Check admin
    cursor.execute(
        "SELECT role FROM users WHERE id = %s",
        (user_id,)
    )

    user = cursor.fetchone()

    if not user:
        cursor.close()

        return {
            "message": "User not found"
        }, 404

    if user["role"] != "admin":
        cursor.close()

        return {
            "message": "Admin access required"
        }, 403

    # Check order
    cursor.execute(
        """
        SELECT id
        FROM orders
        WHERE id = %s
        """,
        (order_id,)
    )

    order = cursor.fetchone()

    if not order:
        cursor.close()

        return {
            "message": "Order not found"
        }, 404

    # Update status
    cursor.execute(
        """
        UPDATE orders
        SET status = %s
        WHERE id = %s
        """,
        (
            status,
            order_id
        )
    )

    mysql.connection.commit()

    cursor.close()

    return {
        "message": "Order status updated successfully",
        "order_id": order_id,
        "status": status
    }, 200


# ==========================================
# Debug Cart
# ==========================================

@app.route("/api/debug-cart")
def debug_cart():

    cursor = mysql.connection.cursor()

    cursor.execute("SELECT DATABASE()")
    database = cursor.fetchone()

    cursor.execute("SELECT * FROM cart")
    cart = cursor.fetchall()

    cursor.close()

    return {
        "database": database,
        "cart": cart
    }


# ==========================================
# Run Application
# ==========================================

if __name__ == "__main__":
    app.run(debug=True)