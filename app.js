const express = require('express');
const router = require('./routes/user_routes');
const errorHandler = require('./utils/errorHandler');
const app = express();
app.use(express.json());

app.use("/api/user", router)

app.use(errorHandler);

const PORT = 5000;

app.listen(PORT, () => {
    console.log('server running on port ' + PORT);
})