const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/gskse', {useNewUrlParser: true});

const User = mongoose.model('User', {
  name: String,
  email: String,
  salt: String,
  hash: String,
});

const io = require('socket.io');
const server = io.listen(3001);

const crypto = require('crypto');

function success(data) {
  return {status: 'success', data};
}

function error(err) {
  return {status: 'error', err};
}

function Err(message) {
  this.message = message;
}

server.on('connect', function(socket) {
  console.log('connect', socket.id);

  socket.on('cl_register', ({name, email, password}, done) => {
    console.log('cl_register', name, email, password);
    User.findOne({$or: [{name}, {email}]}).then((doc) => {
      if (doc) throw new Err('existing name or email');
      const salt = crypto.randomBytes(256).toString('base64');
      const hasher = crypto.createHash('sha512');
      hasher.update(password);
      hasher.update(salt);
      const hash = hasher.digest('base64');
      return User.create({name, email, salt, hash});
    }).then((doc) => {
      done(success({
        id: doc.id,
        name: doc.name,
      }));
    }).catch((err) => done(error(err)));
  });

  socket.on('cl_login', ({nameOrEmail, password}, done) => {
    console.log('cl_login', nameOrEmail, password);
    User.find({$or: [{name: nameOrEmail}, {email: nameOrEmail}]}).then((docs) => {
      for (let i = 0; i < docs.length; i += 1) {
        const doc = docs[i];
        const hasher = crypto.createHash('sha512');
        hasher.update(password);
        hasher.update(doc.salt);
        const hash = hasher.digest('base64');
        if (hash === doc.hash) { // matched
          return done(success({
            id: doc.id,
            name: doc.name,
          }));
        }
      }
      throw new Err('no match found');
    }).catch((err) => done(error(err)));
  });
});
