import app from "./app.js";
const port = Number(process.env.PORT || 5173);
app.listen(port, () => console.log(`[dev] API listening on http://localhost:${port}`));
