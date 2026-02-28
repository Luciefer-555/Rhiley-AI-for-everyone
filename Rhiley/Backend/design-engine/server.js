const express = require("express");
const cors = require("cors");
const generateRoute = require("./routes/generate");
const analyzeRoute = require("./routes/analyze");
const compileRoute = require("./routes/compile");
const compile3dRoute = require("./routes/compile3d");
const compileTemplateRoute = require("./routes/compileTemplate");
const chatRoute = require("./routes/chat");

const app = express();
const PORT = 3002;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));


app.use(cors());

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "design-engine" });
});

app.use("/analyze", analyzeRoute);
app.use("/generate", generateRoute);
app.use("/compile", compileRoute);
app.use("/compile3d", compile3dRoute);
app.use("/compileTemplate", compileTemplateRoute);
app.use("/chat", chatRoute);
app.use("/api/generateTitle", require("./routes/generateTitle"));

app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Design Engine running on http://localhost:${PORT}`);
});
