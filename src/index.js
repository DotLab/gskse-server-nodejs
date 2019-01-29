const debug = require('debug')('gskse');

const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/gskse', {useNewUrlParser: true});

const ObjectId = mongoose.Schema.Types.ObjectId;

const User = mongoose.model('User', {
  name: String,
  email: String,
  salt: String,
  hash: String,
});

const Article = mongoose.model('Article', {
  creator: ObjectId,
  title: String,
  excerpt: String,
  coverUrl: String,
  isOriginal: Boolean,
  sourceTitle: String,
  sourceName: String,
  sourceUrl: String,
  markdown: String,
  date: Date,
});

const io = require('socket.io');
const server = io.listen(3000);

const crypto = require('crypto');

function success(data) {
  debug('    success', data);
  return {status: 'success', data};
}

function error(err) {
  debug('    error', err);
  return {status: 'error', err};
}

function Err(message) {
  this.message = message;
}

server.on('connect', function(socket) {
  debug('connect', socket.id);
  let user = null;

  socket.on('cl_register', ({name, email, password}, done) => {
    debug('cl_register', name, email, password);
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
    debug('cl_login', nameOrEmail, password);
    User.find({$or: [{name: nameOrEmail}, {email: nameOrEmail}]}).then((docs) => {
      for (let i = 0; i < docs.length; i += 1) {
        const doc = docs[i];
        const hasher = crypto.createHash('sha512');
        hasher.update(password);
        hasher.update(doc.salt);
        const hash = hasher.digest('base64');
        user = doc;
        if (hash === doc.hash) { // matched
          return done(success({
            name: doc.name,
          }));
        }
      }
      throw new Err('no match found');
    }).catch((err) => done(error(err)));
  });

  socket.on('cl_logout', (done) => {
    debug('cl_logout');
    user = null;
    done(success());
  });

  socket.on('cl_new_article', ({title, excerpt, coverUrl, isOriginal, sourceTitle, sourceName, sourceUrl, markdown}, done) => {
    debug('cl_new_article', title);
    if (!user) return done(error('forbidden'));
    Article.findOne({title}).then((doc) => {
      if (doc) throw new Err('duplicated title');
      return Article.create({
        creator: user._id,
        title, excerpt, coverUrl, isOriginal, sourceTitle, sourceName, sourceUrl, markdown,
        date: new Date(),
      });
    }).then((doc) => {
      done(success());
    }).catch((err) => done(error(err)));
  });

  socket.on('disconnect', () => {
    debug('disconnect', socket.id);
  });
});
