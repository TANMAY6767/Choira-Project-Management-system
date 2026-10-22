const express = require('express');
const cookieParser = require('cookie-parser');

const app = express();

app.use(express.urlencoded({extended:false}));
app.use(cookieParser);


app.listen(8000,()=>{
    console.log("server is running");
});