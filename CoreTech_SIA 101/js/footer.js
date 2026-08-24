document.addEventListener("DOMContentLoaded", function () {

    const isAdmin = window.location.pathname.includes("/admin/");
    const root = isAdmin ? "../" : "";

    const footer = document.createElement("footer");

    footer.className = "site-footer";

    footer.innerHTML = `
        <div class="footer-container">

            <div class="footer-brand">
                <a href="${root}index.html" class="footer-logo">
                    Core<span>Tech</span>
                </a>

                <p>
                    Your student-friendly source for computer,
                    networking, electronics, and IT essentials.
                </p>

                <div class="footer-social">
                    <a href="#" aria-label="Facebook">f</a>
                    <a href="#" aria-label="Messenger">m</a>
                    <a href="#" aria-label="Instagram">◎</a>
                </div>
            </div>


            <div class="footer-column">
                <h3>Shop</h3>

                <a href="${root}products.html">All Products</a>
                <a href="${root}products.html?cat=Networking">Networking</a>
                <a href="${root}products.html?cat=Computer">Computer</a>
                <a href="${root}products.html?cat=Electronics">Electronics</a>
                <a href="${root}products.html?cat=Cables">Cables</a>
            </div>


            <div class="footer-column">
                <h3>Customer</h3>

                <a href="${root}orders.html">My Orders</a>
                <a href="${root}cart.html">Shopping Cart</a>
                <a href="${root}login.html">Login</a>
                <a href="${root}checkout.html">Checkout</a>
            </div>


            <div class="footer-column">
                <h3>Information</h3>

                <a href="#">About CoreTech</a>
                <a href="#">Contact Us</a>
                <a href="#">Privacy Policy</a>
                <a href="#">Terms & Conditions</a>
            </div>

        </div>


        <div class="footer-bottom">

            <p>
                © 2026 CoreTech. All rights reserved.
            </p>

            <p>
                ERP • CoreTech
            </p>

        </div>
    `;


    document.body.appendChild(footer);

});