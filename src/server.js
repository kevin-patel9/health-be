const { connectDatabase } = require("./config/database");
const app = require("./index");

connectDatabase();

const port = process.env.PORT || 9000;

app.listen(port, () => {
    console.log(`Server running on port ${process.env.PORT} `);
});
