// Setup
require("@dotenvx/dotenvx").config();
const express = require("express");
const swaggerUi = require("swagger-ui-express");
const openapiSpec = require("./openapi.json");

const { signUp, signIn, signOut, requireAuth } = require("./middleware/auth.js");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Start the server
try {

    app.listen(PORT, () => {
        console.log(`API running at http://localhost:${PORT}`);
        console.log(`Swagger UI available at http://localhost:${PORT}/docs`);
    });
}
catch (error) {
    console.error("Error initializing database:", error);
    process.exit(1);
};
// Root and health endpoints

// GET 
app.get("/", (req, res) => {
    res.status(200).json({
        name: "Task API",
        version: "1.0",
        endpoints: ["/auth/signup", "/auth/signin", "/auth/signout", "/public/info", "/protected/profile"],
    });
});

// GET /health 
app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok" });
});


//Stage 1 — signup and login routes

// POST /sign-up
app.post("/auth/signup", async (req, res) => {
    const { email, password } = req.body;
    const { data, error } = await signUp(email, password);

    if (error) {
        return res.status(400).json({ error: error.message });
    }

    res.status(201).json({ user: data.session.access_token });
});

// POST /sign-in
app.post("/auth/signin", async (req, res) => {
    const { email, password } = req.body;
    const { data, error } = await signIn(email, password);

    if (!email || !password) {
        return res.status(400).json({ error: "email and password are required" });
    }

    if (error) {
        return res.status(401).json({ error: "Invalid login credentials" });
    }
    res.status(200).json({ user: data.session.access_token });
});

// Stage 2 — Public & unverified protected routes
// Public info

app.get("/public/info", (req, res) => {
    res.status(200).json({
        message: "Welcome stranger! This info is public.",
    });
});

app.get("/protected/profile", requireAuth, (req, res) => {
    res.status(200).json({
        message: "This is a secret message for authenticated users.",
        user: req.user,
    });
});

// Stage 4 — Middleware + Logout
// POST /sign-out
app.post("/auth/signout", requireAuth, async (req, res) => {
    const { error } = await signOut();

    if (error) {
        return res.status(400).json({ error: error.message });
    }

    res.status(204).json({ message: "No Content" });
});

// Stage 5 — Swagger UI
app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapiSpec));