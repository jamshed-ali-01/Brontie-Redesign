const mongoose = require('mongoose');
const uri = "mongodb://jamshedgopang0002_db_user:roaSl0Mbl2mEIFzV@ac-wleqlh3-shard-00-00.0he06zz.mongodb.net:27017,ac-wleqlh3-shard-00-01.0he06zz.mongodb.net:27017,ac-wleqlh3-shard-00-02.0he06zz.mongodb.net:27017/one_five?ssl=true&replicaSet=atlas-t1j23z-shard-0&authSource=admin&retryWrites=true&w=majority";

mongoose.connect(uri)
  .then(() => {
    console.log("Successfully connected to MongoDB with direct URI!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Connection failed:", err);
    process.exit(1);
  });
