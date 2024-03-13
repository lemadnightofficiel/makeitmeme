const express = require("express");
const app = express(); //Création serveur
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const bcrypt = require("bcrypt");
const bodyParser = require('body-parser');

//Config
app.set('view engine', 'ejs');
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: true }));

//Démarrage
app.listen(3000, () => {
  console.log("Serveur démarré (http://localhost:3000/)");
});

//Routage Page Connexion
app.get("/", (req, res) => {
    res.render("login");
});

//Routage Page de création de compte
app.get("/register", (req, res) => {
  res.render("register");
});

//Routage Page Home
app.get("/home", (req, res) => {
    res.render("home");
});

// BDD
const db_name = path.join(__dirname, "data", "bdd.db");
const db = new sqlite3.Database(db_name, err => {
  if (err) {
    return console.error(err.message);
  }
});

//Table du compte user
const sql_create_users = 
    `CREATE TABLE IF NOT EXISTS users (
      user_ID INTEGER PRIMARY KEY AUTOINCREMENT,
      user_name VARCHAR(100) NOT NULL,
      email VARCHAR(100) NOT NULL UNIQUE,
      user_password VARCHAR(255) NOT NULL);`;
  
db.run(sql_create_users, err => {
    if (err) {
        return console.error(err.message);
    }
});

//Table des memes mis en favoris
const sql_create_favorites = 
    `CREATE TABLE IF NOT EXISTS favorites (
    favorite_ID INTEGER PRIMARY KEY AUTOINCREMENT,
    user_ID INTEGER,
    meme_ID INTEGER,
    FOREIGN KEY (user_ID) REFERENCES users(user_ID),
    FOREIGN KEY (meme_ID) REFERENCES memes(meme_ID));`;
  
db.run(sql_create_favorites, err => {
    if (err) {
        return console.error(err.message);
    }
});

// Traitement du formulaire de connexion
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const exists = await userExists(email);
    if (!exists) {
      // L'utilisateur existe déjà
      return res.redirect("/loginpage");
    }
    db.get("SELECT * FROM users WHERE email = ?", [email], (err, row) => {
      if (err) {
        console.error("4",err.message);
        return res.status(500).send("Erreur de serveur");
      }

      if (row) {
        bcrypt.compare(password, row.user_password, (err, result) => {
          if (err) {
            console.error("5",err.message);
            return res.status(500).send("Erreur de serveur");
          }
          if (result) {
            res.redirect("/home");
          } else {
            res.status(401).send("Mot de passe incorrect");
          }
        });
      } else {
        res.redirect("/register");
      }
    });
  } catch (err) {
    console.error("Erreur lors de la vérification de l'existence de l'utilisateur :", err);
    res.status(500).send("Erreur de serveur");
  }
});

// Traitement du formulaire de création du compte
app.post("/register", async (req, res) => {
  const { email, username, password, confirm_password} = req.body;
  if (password === confirm_password){
      try {
        const exists = await userExists(email);
        if (exists) {
          // L'utilisateur existe déjà
          return res.redirect("/registerpage");
        }
        bcrypt.hash(password, 10, (err, hash) => {
        if (err) {
          return console.error("6",err.message);
        }

        db.run("INSERT INTO users (user_name, email, user_password) VALUES (?, ?, ?)", [username, email, hash], (err) => {
          if (err) {
            return console.error("7",err.message);
          }
          console.log(`Utilisateur ${username} a bien été enregistré dans la base de données.`);
          res.redirect("/home");
        });
      });
    } catch (err) {
      console.error("Erreur lors de la vérification de l'existence de l'utilisateur :", err);
      res.status(500).send("Erreur de serveur");
    }
  } else {
    res.redirect("/registerpage");
  }
});

//Vérification de l'existence de l'utilisateur
const userExists = (email) => {
  return new Promise((resolve, reject) => {
    db.get("SELECT * FROM users WHERE email = ?", [email], (err, row) => {
      if (err) {
        reject(err);
      }
      resolve(row !== undefined);
    });
  });
};
