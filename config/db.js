const mongoose = require('mongoose');

mongoose.connect("mongodb://127.0.0.1:27017/thakkartravels")
.then(() => console.log("MongoDB Connected ✅"))
.catch(err => console.log(err));
db.users.updateMany(
  {},
  { $set: { balance: 0 } }
)
module.exports = mongoose;