import express from "express";
import path from "path";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

// connecting to mongoDB
import mongoose, { model, mongo } from "mongoose";

mongoose.connect("mongodb://127.0.0.1:27017", {dbName: "sample"}).then(()=> {
    console.log("Connected to MongoDB Successfully");
}).catch((err)=> {
    console.log(err);
})

// creating schema for storing message data
const userSchema = new mongoose.Schema({ 
    name: String,
    email: String,
    password: String
});

// creating model is like a collection
const User = new mongoose.model("user", userSchema);

const app = express();
const port = 2000;

// using middleware
app.use(express.static(path.join(path.resolve(), "public")));
app.use(bodyParser.urlencoded({ extended: true })); // to access req.body
app.use(cookieParser());

// setting up view engine
app.set("view engine", "ejs");

// middleware
const isAuthenticated = async(req, res, next)=> {
    const { token } = req.cookies;

    if(token) {
        const decoded = jwt.verify(token, "djasfdsajfsa");
        req.user = await User.findById(decoded._id);

        next();
    } else {
        res.redirect("/login");
    }
};

app.get("/", isAuthenticated, (req, res)=> {
    res.render("logout", { name: req.user.name });

    // res.sendFile(path.join(path.resolve(), "index.html"));
});

app.get("/login", (req, res)=> {
    res.render("login");
});

app.get("/register", (req, res)=> {
    res.render("register");
});

app.post("/login", async(req, res)=> {
    const { email, password } = req.body;
    let user = await User.findOne({ email });

    if(!user) return res.render("register", { email });

    // decrypt passwrod and check password is mathched or not
    const isMatch = await bcrypt.compare(password, user.password);

    if(!isMatch) return res.render("login", { email, message: "Incorrect Password" });

    // agar password match hua toh
    const token = jwt.sign({_id: user._id}, "djasfdsajfsa")

    res.cookie("token", token, {
        httpOnly: true,
        expires: new Date(Date.now()+60*1000)
    });
    res.redirect("/");
});

app.post("/register", async(req, res)=> {
    const {name, email, password} = req.body;

    let user = await User.findOne({ email });
    if(user) {
        res.redirect("/login");
    } else {
        // password incryption
        const hashedPassword = await bcrypt.hash(password, 10);

        user = await User.create({ name, email, password:hashedPassword });
    
        const token = jwt.sign({_id: user._id}, "djasfdsajfsa");
    
        res.cookie("token", token, {
            httpOnly: true,
            expires: new Date(Date.now()+60*1000)
        });
        res.redirect("/");
    }

});

app.get("/logout", (req, res)=> {
    res.cookie("token", null, {
        httpOnly: true,
        expires: new Date(Date.now())
    });
    res.redirect("/");
});

app.listen(port, ()=> {
    console.log(`Server is running on https://localhost:${port}`);
});