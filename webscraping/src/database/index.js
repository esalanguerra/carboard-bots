require("dotenv").config();
const mongoose = require("mongoose");

const dbURI = process.env.DATABASE_URL;

if (!dbURI) {
  console.error("A URL de conexão com o banco de dados não foi informada!");
  process.exit(1);
}

const connectDB = async () => {
  try {
    await mongoose.connect(dbURI);

    console.log("Conexão com o banco de dados estabelecida com sucesso!");
  } catch (err) {
    console.error("Erro ao conectar com o banco de dados:", err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
