import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [user, setUser] = useState(null);

  const [isRegistering, setIsRegistering] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");

  // --------------------------------
  // Checkout
  // --------------------------------

  const [showCheckout, setShowCheckout] = useState(false);
  const [shippingAddress, setShippingAddress] = useState("");
  const [orderMessage, setOrderMessage] = useState("");
  const [orderId, setOrderId] = useState(null);

  // --------------------------------
  // Orders
  // --------------------------------

  const [orders, setOrders] = useState([]);
  const [showOrders, setShowOrders] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetails, setOrderDetails] = useState([]);

  // --------------------------------
  // Admin
  // --------------------------------

  const [adminProducts, setAdminProducts] = useState([]);
  const [adminOrders, setAdminOrders] = useState([]);
  const [showAdmin, setShowAdmin] = useState(false);

  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productImage, setProductImage] = useState("");
  const [productCategory, setProductCategory] = useState("");
  const [productStock, setProductStock] = useState("");

  const [editingProductId, setEditingProductId] = useState(null);

  // --------------------------------
  // Get Products
  // --------------------------------

  useEffect(() => {
    fetch("http://127.0.0.1:5000/api/products")
      .then((response) => response.json())
      .then((data) => {
        setProducts(data.products);
      })
      .catch((error) => {
        console.error("Error fetching products:", error);
      });
  }, []);

  // --------------------------------
  // Get Cart
  // --------------------------------

  useEffect(() => {
    if (!user) {
      setCart([]);
      return;
    }

    fetch(`http://127.0.0.1:5000/api/cart/${user.id}`)
      .then((response) => response.json())
      .then((data) => {
        setCart(data.cart);
      })
      .catch((error) => {
        console.error("Error fetching cart:", error);
      });
  }, [user]);

  // --------------------------------
  // Login
  // --------------------------------

  function handleLogin(event) {
    event.preventDefault();

    setMessage("");

    fetch("http://127.0.0.1:5000/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email,
        password: password,
      }),
    })
      .then(async (response) => {
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message);
        }

        return data;
      })
      .then((data) => {
        setUser(data.user);

        setEmail("");
        setPassword("");

        setMessage("Login successful!");
      })
      .catch((error) => {
        setMessage(error.message);
      });
  }

  // --------------------------------
  // Register
  // --------------------------------

  function handleRegister(event) {
    event.preventDefault();

    setMessage("");

    fetch("http://127.0.0.1:5000/api/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: name,
        email: email,
        password: password,
      }),
    })
      .then(async (response) => {
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message);
        }

        return data;
      })
      .then(() => {
        setMessage("Registration successful! Please login.");

        setName("");
        setEmail("");
        setPassword("");

        setIsRegistering(false);
      })
      .catch((error) => {
        setMessage(error.message);
      });
  }

  // --------------------------------
  // Logout
  // --------------------------------

  function handleLogout() {
    setUser(null);
    setCart([]);
    setOrders([]);
    setSelectedOrder(null);
    setOrderDetails([]);

    setMessage("");
    setShowCheckout(false);
    setShippingAddress("");
    setOrderMessage("");
    setOrderId(null);
    setShowOrders(false);

    setShowAdmin(false);
    clearProductForm();
    setAdminProducts([]);
    setAdminOrders([]);
  }

  // --------------------------------
  // Refresh Cart
  // --------------------------------

  function refreshCart() {
    return fetch(
      `http://127.0.0.1:5000/api/cart/${user.id}`
    )
      .then((response) => response.json())
      .then((data) => {
        setCart(data.cart);
      });
  }

  // --------------------------------
  // Add To Cart
  // --------------------------------

  function addToCart(product) {
    if (!user) {
      alert("Please login first.");
      return;
    }

    fetch("http://127.0.0.1:5000/api/cart", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: user.id,
        product_id: product.id,
        quantity: 1,
      }),
    })
      .then(async (response) => {
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message);
        }

        return refreshCart();
      })
      .catch((error) => {
        alert(error.message);
      });
  }

  // --------------------------------
  // Increase Quantity
  // --------------------------------

  function increaseQuantity(item) {
    fetch("http://127.0.0.1:5000/api/cart", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: user.id,
        product_id: item.product_id,
        quantity: 1,
      }),
    })
      .then(async (response) => {
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message);
        }

        return refreshCart();
      })
      .catch((error) => {
        alert(error.message);
      });
  }

  // --------------------------------
  // Decrease Quantity
  // --------------------------------

  function decreaseQuantity(item) {
    if (item.quantity <= 1) {
      removeFromCart(item);
      return;
    }

    fetch(
      `http://127.0.0.1:5000/api/cart/${user.id}/${item.product_id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quantity: item.quantity - 1,
        }),
      }
    )
      .then(async (response) => {
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message);
        }

        return refreshCart();
      })
      .catch((error) => {
        alert(error.message);
      });
  }

  // --------------------------------
  // Remove From Cart
  // --------------------------------

  function removeFromCart(item) {
    fetch(
      `http://127.0.0.1:5000/api/cart/${user.id}/${item.product_id}`,
      {
        method: "DELETE",
      }
    )
      .then(async (response) => {
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message);
        }

        return refreshCart();
      })
      .catch((error) => {
        alert(error.message);
      });
  }

  // --------------------------------
  // Open Checkout
  // --------------------------------

  function openCheckout() {
    if (cart.length === 0) {
      alert("Your cart is empty.");
      return;
    }

    setOrderMessage("");
    setOrderId(null);
    setShippingAddress("");
    setShowCheckout(true);
  }

  // --------------------------------
  // Place Order
  // --------------------------------

  function handleCheckout(event) {
    event.preventDefault();

    if (!shippingAddress.trim()) {
      setOrderMessage("Please enter your shipping address.");
      return;
    }

    setOrderMessage("Placing your order...");

    fetch("http://127.0.0.1:5000/api/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: user.id,
        shipping_address: shippingAddress,
      }),
    })
      .then(async (response) => {
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message);
        }

        return data;
      })
      .then((data) => {
        setOrderId(data.order_id);

        setOrderMessage("Order placed successfully!");

        setShippingAddress("");
        setCart([]);
        setShowCheckout(false);

        getOrders();
      })
      .catch((error) => {
        setOrderMessage(error.message);
      });
  }

  // --------------------------------
  // Get My Orders
  // --------------------------------

  function getOrders() {
    if (!user) {
      return;
    }

    fetch(
      `http://127.0.0.1:5000/api/orders/${user.id}`
    )
      .then(async (response) => {
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message);
        }

        return data;
      })
      .then((data) => {
        setOrders(data.orders);
        setShowOrders(true);
      })
      .catch((error) => {
        alert(error.message);
      });
  }

  // --------------------------------
  // Get Order Details
  // --------------------------------

  function getOrderDetails(orderId) {
    fetch(
      `http://127.0.0.1:5000/api/orders/${orderId}/details`
    )
      .then(async (response) => {
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message);
        }

        return data;
      })
      .then((data) => {
        setSelectedOrder(data.order);
        setOrderDetails(data.items);
      })
      .catch((error) => {
        alert(error.message);
      });
  }

  // ================================================
  // ADMIN FUNCTIONS
  // ================================================

  function getAdminProducts() {
    fetch("http://127.0.0.1:5000/api/products")
      .then(async (response) => {
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message);
        }

        return data;
      })
      .then((data) => {
        setAdminProducts(data.products);
      })
      .catch((error) => {
        alert(error.message);
      });
  }

  function getAdminOrders() {
    if (!user) {
      return;
    }

    fetch(
      `http://127.0.0.1:5000/api/admin/orders?user_id=${user.id}`
    )
      .then(async (response) => {
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message);
        }

        return data;
      })
      .then((data) => {
        setAdminOrders(data.orders);
      })
      .catch((error) => {
        alert(error.message);
      });
  }

  // --------------------------------
  // Open Admin Dashboard + Auto Scroll
  // --------------------------------

  function openAdminDashboard() {
    setShowAdmin(true);

    getAdminProducts();
    getAdminOrders();

    setTimeout(() => {
      document
        .getElementById("admin-dashboard")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 100);
  }

  // --------------------------------
  // Clear Product Form
  // --------------------------------

  function clearProductForm() {
    setProductName("");
    setProductDescription("");
    setProductPrice("");
    setProductImage("");
    setProductCategory("");
    setProductStock("");
    setEditingProductId(null);
  }

  // --------------------------------
  // Add / Update Product
  // --------------------------------

  function handleProductSubmit(event) {
    event.preventDefault();

    const productData = {
      user_id: user.id,
      name: productName,
      description: productDescription,
      price: Number(productPrice),
      image: productImage,
      category: productCategory,
      stock: Number(productStock),
    };

    const url = editingProductId
      ? `http://127.0.0.1:5000/api/admin/products/${editingProductId}`
      : "http://127.0.0.1:5000/api/admin/products";

    const method = editingProductId ? "PUT" : "POST";

    fetch(url, {
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(productData),
    })
      .then(async (response) => {
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message);
        }

        return data;
      })
      .then(() => {
        alert(
          editingProductId
            ? "Product updated successfully!"
            : "Product added successfully!"
        );

        clearProductForm();

        getAdminProducts();

        fetch("http://127.0.0.1:5000/api/products")
          .then((response) => response.json())
          .then((data) => {
            setProducts(data.products);
          });
      })
      .catch((error) => {
        alert(error.message);
      });
  }

  // --------------------------------
  // Edit Product
  // --------------------------------

  function editProduct(product) {
    setEditingProductId(product.id);

    setProductName(product.name);
    setProductDescription(product.description || "");
    setProductPrice(product.price);
    setProductImage(product.image || "");
    setProductCategory(product.category || "");
    setProductStock(product.stock);
  }

  // --------------------------------
  // Delete Product
  // --------------------------------

  function deleteProduct(productId) {
    if (
      !window.confirm(
        "Are you sure you want to delete this product?"
      )
    ) {
      return;
    }

    fetch(
      `http://127.0.0.1:5000/api/admin/products/${productId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: user.id,
        }),
      }
    )
      .then(async (response) => {
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message);
        }

        return data;
      })
      .then(() => {
        alert("Product deleted successfully!");

        getAdminProducts();

        fetch("http://127.0.0.1:5000/api/products")
          .then((response) => response.json())
          .then((data) => {
            setProducts(data.products);
          });
      })
      .catch((error) => {
        alert(error.message);
      });
  }

  // --------------------------------
  // Update Order Status
  // --------------------------------

  function updateOrderStatus(orderId, status) {
    fetch(
      `http://127.0.0.1:5000/api/admin/orders/${orderId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: user.id,
          status: status,
        }),
      }
    )
      .then(async (response) => {
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message);
        }

        return data;
      })
      .then(() => {
        alert("Order status updated!");

        getAdminOrders();
      })
      .catch((error) => {
        alert(error.message);
      });
  }

  // --------------------------------
  // Cart Count
  // --------------------------------

  const cartCount = cart.reduce(
    (total, item) => total + item.quantity,
    0
  );

  // --------------------------------
  // Cart Total
  // --------------------------------

  const cartTotal = cart.reduce(
    (total, item) =>
      total + Number(item.price) * item.quantity,
    0
  );

  return (
    <div className="app">

      {/* =========================================
          HEADER
      ========================================= */}

      <header>
        <h1>🛍️ My E-Commerce Store</h1>

        <p>Find the products you love</p>

        {user ? (
          <>
            <p>
              Welcome, <strong>{user.name}</strong>
            </p>

            <p>
              Role: <strong>{user.role}</strong>
            </p>

            <button onClick={handleLogout}>
              Logout
            </button>

            <div className="cart-count">
              🛒 Cart: {cartCount}
            </div>

            <button onClick={getOrders}>
              📦 My Orders
            </button>

            {user.role === "admin" && (
              <button onClick={openAdminDashboard}>
                👨‍💼 Admin Dashboard
              </button>
            )}
          </>
        ) : (
          <p>
            Please login to add products to cart.
          </p>
        )}
      </header>

      {/* =========================================
          AUTHENTICATION
      ========================================= */}

      {!user && (
        <section className="login-section">

          {isRegistering ? (
            <>
              <h2>📝 Create Account</h2>

              <form onSubmit={handleRegister}>

                <input
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  required
                />

                <input
                  type="email"
                  placeholder="Enter email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  required
                />

                <input
                  type="password"
                  placeholder="Create password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  required
                />

                <button type="submit">
                  Register
                </button>

              </form>

              <p>{message}</p>

              <button
                onClick={() => {
                  setIsRegistering(false);
                  setMessage("");
                }}
              >
                Already have an account? Login
              </button>
            </>
          ) : (
            <>
              <h2>🔐 Login</h2>

              <form onSubmit={handleLogin}>

                <input
                  type="email"
                  placeholder="Enter email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  required
                />

                <input
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  required
                />

                <button type="submit">
                  Login
                </button>

              </form>

              <p>{message}</p>

              <button
                onClick={() => {
                  setIsRegistering(true);
                  setMessage("");
                }}
              >
                Don't have an account? Register
              </button>
            </>
          )}

        </section>
      )}

      {/* =========================================
          PRODUCTS
      ========================================= */}

      <main className="product-container">

        {products.map((product) => (
          <div
            className="product-card"
            key={product.id}
          >

            <div className="product-image">
              🛍️
            </div>

            <div className="product-info">

              <h2>{product.name}</h2>

              <p className="category">
                {product.category}
              </p>

              <p>{product.description}</p>

              <h3>₹{product.price}</h3>

              <p>Stock: {product.stock}</p>

              <button
                onClick={() =>
                  addToCart(product)
                }
              >
                Add to Cart
              </button>

            </div>

          </div>
        ))}

      </main>

      {/* =========================================
          CART
      ========================================= */}

      {user && (
        <section className="cart-section">

          <h2>🛒 Your Cart</h2>

          {cart.length === 0 ? (
            <p>Your cart is empty.</p>
          ) : (
            <>
              {cart.map((item) => (

                <div
                  className="cart-item"
                  key={item.id}
                >

                  <div>
                    <h3>{item.name}</h3>

                    <p>
                      ₹{item.price} ×{" "}
                      {item.quantity}
                    </p>
                  </div>

                  <div className="quantity-controls">

                    <button
                      onClick={() =>
                        decreaseQuantity(item)
                      }
                    >
                      -
                    </button>

                    <span>
                      {item.quantity}
                    </span>

                    <button
                      onClick={() =>
                        increaseQuantity(item)
                      }
                    >
                      +
                    </button>

                    <button
                      onClick={() =>
                        removeFromCart(item)
                      }
                    >
                      Remove
                    </button>

                  </div>

                  <strong>
                    ₹
                    {(
                      Number(item.price) *
                      item.quantity
                    ).toFixed(2)}
                  </strong>

                </div>

              ))}

              <div className="cart-total">

                <h2>
                  Total: ₹
                  {cartTotal.toFixed(2)}
                </h2>

                <button
                  className="checkout-button"
                  onClick={openCheckout}
                >
                  Proceed to Checkout
                </button>

              </div>
            </>
          )}

        </section>
      )}

      {/* =========================================
          CHECKOUT
      ========================================= */}

      {user && showCheckout && (
        <section className="checkout-section">

          <h2>🧾 Checkout</h2>

          <h3>
            Order Total: ₹
            {cartTotal.toFixed(2)}
          </h3>

          <form onSubmit={handleCheckout}>

            <textarea
              placeholder="Enter your shipping address"
              value={shippingAddress}
              onChange={(event) =>
                setShippingAddress(event.target.value)
              }
              rows="4"
              required
            />

            <button type="submit">
              Place Order
            </button>

            <button
              type="button"
              onClick={() => {
                setShowCheckout(false);
                setOrderMessage("");
              }}
            >
              Cancel
            </button>

          </form>

          <p>{orderMessage}</p>

        </section>
      )}

      {/* =========================================
          ORDER SUCCESS
      ========================================= */}

      {orderId && (
        <section className="order-success">

          <h2>
            🎉 Order Placed Successfully!
          </h2>

          <p>
            Your Order ID is:
            <strong> #{orderId}</strong>
          </p>

          <p>
            Thank you for shopping with us.
          </p>

        </section>
      )}

      {/* =========================================
          MY ORDERS
      ========================================= */}

      {user && showOrders && (
        <section className="orders-section">

          <h2>📦 My Orders</h2>

          {orders.length === 0 ? (
            <p>You have no orders yet.</p>
          ) : (
            orders.map((order) => (
              <div
                className="order-card"
                key={order.id}
              >

                <h3>
                  Order #{order.id}
                </h3>

                <p>
                  Total: ₹
                  {Number(
                    order.total_amount
                  ).toFixed(2)}
                </p>

                <p>
                  Status:{" "}
                  <strong>
                    {order.status}
                  </strong>
                </p>

                <p>
                  Shipping Address:{" "}
                  {order.shipping_address}
                </p>

                <p>
                  Date:{" "}
                  {new Date(
                    order.created_at
                  ).toLocaleString()}
                </p>

                <button
                  onClick={() =>
                    getOrderDetails(order.id)
                  }
                >
                  View Details
                </button>

              </div>
            ))
          )}

        </section>
      )}

      {/* =========================================
          ORDER DETAILS
      ========================================= */}

      {selectedOrder && (
        <section className="order-details">

          <h2>
            🧾 Order #{selectedOrder.id}
          </h2>

          <p>
            Status:{" "}
            <strong>
              {selectedOrder.status}
            </strong>
          </p>

          <h3>Products</h3>

          {orderDetails.map((item) => (
            <div
              className="order-detail-item"
              key={item.id}
            >

              <p>
                {item.product_name}
              </p>

              <p>
                Quantity: {item.quantity}
              </p>

              <p>
                Price: ₹
                {Number(
                  item.price
                ).toFixed(2)}
              </p>

            </div>
          ))}

          <button
            onClick={() => {
              setSelectedOrder(null);
              setOrderDetails([]);
            }}
          >
            Close
          </button>

        </section>
      )}

      {/* =========================================
          ADMIN DASHBOARD
      ========================================= */}

      {user &&
        user.role === "admin" &&
        showAdmin && (

        <section
          id="admin-dashboard"
          className="admin-dashboard"
        >

          <h2>👨‍💼 Admin Dashboard</h2>

          <button
            onClick={() => {
              setShowAdmin(false);
              clearProductForm();
            }}
          >
            Close Dashboard
          </button>

          {/* -------------------------------------
              ADD / EDIT PRODUCT
          ------------------------------------- */}

          <div className="admin-section">

            <h3>
              {editingProductId
                ? "✏️ Edit Product"
                : "➕ Add Product"}
            </h3>

            <form
              className="admin-product-form"
              onSubmit={handleProductSubmit}
            >

              <input
                type="text"
                placeholder="Product name"
                value={productName}
                onChange={(event) =>
                  setProductName(event.target.value)
                }
                required
              />

              <textarea
                placeholder="Product description"
                value={productDescription}
                onChange={(event) =>
                  setProductDescription(
                    event.target.value
                  )
                }
                rows="4"
                required
              />

              <input
                type="number"
                placeholder="Price"
                value={productPrice}
                onChange={(event) =>
                  setProductPrice(event.target.value)
                }
                min="0"
                step="0.01"
                required
              />

              <input
                type="text"
                placeholder="Image URL"
                value={productImage}
                onChange={(event) =>
                  setProductImage(event.target.value)
                }
              />

              <input
                type="text"
                placeholder="Category"
                value={productCategory}
                onChange={(event) =>
                  setProductCategory(
                    event.target.value
                  )
                }
                required
              />

              <input
                type="number"
                placeholder="Stock"
                value={productStock}
                onChange={(event) =>
                  setProductStock(event.target.value)
                }
                min="0"
                required
              />

              <button type="submit">
                {editingProductId
                  ? "Update Product"
                  : "Add Product"}
              </button>

              {editingProductId && (
                <button
                  type="button"
                  onClick={clearProductForm}
                >
                  Cancel Edit
                </button>
              )}

            </form>

          </div>

          {/* -------------------------------------
              MANAGE PRODUCTS
          ------------------------------------- */}

          <div className="admin-section">

            <h3>📦 Manage Products</h3>

            {adminProducts.length === 0 ? (
              <p>No products found.</p>
            ) : (
              <div className="admin-product-list">

                {adminProducts.map((product) => (

                  <div
                    className="admin-product-card"
                    key={product.id}
                  >

                    <h4>
                      {product.name}
                    </h4>

                    <p>
                      ₹
                      {Number(
                        product.price
                      ).toFixed(2)}
                    </p>

                    <p>
                      Stock: {product.stock}
                    </p>

                    <p>
                      Category: {product.category}
                    </p>

                    <div className="admin-buttons">

                      <button
                        onClick={() =>
                          editProduct(product)
                        }
                      >
                        ✏️ Edit
                      </button>

                      <button
                        onClick={() =>
                          deleteProduct(product.id)
                        }
                      >
                        🗑️ Delete
                      </button>

                    </div>

                  </div>

                ))}

              </div>
            )}

          </div>

          {/* -------------------------------------
              CUSTOMER ORDERS
          ------------------------------------- */}

          <div className="admin-section">

            <h3>📋 Customer Orders</h3>

            {adminOrders.length === 0 ? (
              <p>No orders found.</p>
            ) : (
              <div className="admin-orders">

                {adminOrders.map((order) => (

                  <div
                    className="admin-product-card"
                    key={order.id}
                  >

                    <h4>
                      Order #{order.id}
                    </h4>

                    <p>
                      User ID: {order.user_id}
                    </p>

                    <p>
                      Total: ₹
                      {Number(
                        order.total_amount
                      ).toFixed(2)}
                    </p>

                    <p>
                      Shipping:{" "}
                      {order.shipping_address}
                    </p>

                    <p>
                      Current Status:{" "}
                      <strong>
                        {order.status}
                      </strong>
                    </p>

                    <select
                      value={order.status}
                      onChange={(event) =>
                        updateOrderStatus(
                          order.id,
                          event.target.value
                        )
                      }
                    >

                      <option value="Pending">
                        Pending
                      </option>

                      <option value="Confirmed">
                        Confirmed
                      </option>

                      <option value="Shipped">
                        Shipped
                      </option>

                      <option value="Delivered">
                        Delivered
                      </option>

                      <option value="Cancelled">
                        Cancelled
                      </option>

                    </select>

                  </div>

                ))}

              </div>
            )}

          </div>

        </section>
      )}

    </div>
  );
}

export default App;