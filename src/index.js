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
  creatorId: ObjectId,
  title: String,
  excerpt: String,
  coverUrl: String,
  isOriginal: Boolean,
  sourceTitle: String,
  sourceName: String,
  sourceUrl: String,
  markdown: String,
  date: Date,
  // cache
  creatorName: String,
  voteCount: Number,
  upVoteCount: Number,
  downVoteCount: Number,
  loveCount: Number,
  commentCount: Number,
  viewCount: Number,
});

const Comment = mongoose.model('Comment', {
  authorId: ObjectId,
  targetId: ObjectId,
  text: String,
  date: Date,
  // cache
  authorName: String,
  voteCount: Number,
  replyCount: Number,
});

const Flag = mongoose.model('Flag', {
  intent: {type: String, enum: ['UpVote', 'DownVote', 'Love', 'View']},
  sourceId: ObjectId,
  targetId: ObjectId,
  date: Date,
});

if (process.env.NODE_ENV === 'development') {
  const {articleMarkdown2} = require('./mocks');

  let user;
  let article;
  let comment;

  User.remove({}).then(() => {
    return User.create({
      name: 'Kailang',
      email: 'kailangfu@gmail.com',
      salt: '5RyOpUlzGzKL6Bhv/gPpiOtiGmQX5qxF4PqbZvO60HaxwmAjLBcGV3RHUBV8nJ83UxiYjISFdqOxHPM8D1eGsNWs/mee7GQkppBz8j2o3cVseDF5j8cFcToglY70n7FrlmPhKP50T/1H2UZAczl/g4nXTcNeE/EUbAhL6gaY4Nq01LWS6B9k60z5VhYmnup4kAX4wwUG2k30TBwvvxRi4iTk9D66VK7tEyEv/JevAwvYUmMdVP1UKpmOCS7IRLZrv9cKnGbZF/F6i19uEWZpAkOriBtOu57CfP7RKUsjzTsZqE15H/63gREe2v2nldrOstqz6FEy2yzOeWi8vZvUAA==',
      hash: 'nlEDz8iDHQzTk75KpoQMF0+g1/KI89JDpR0Q4ciDG+oi2bMuhDOv3B48J7X1x085fEXFkvIS3b/PD+mRaow8zw==',
    });
  }).then((doc) => {
    user = doc;
    return Article.remove({}).then(() => {
      return Article.create({
        creatorId: user._id,
        title: 'Rimuru Tempest and Robinson Crusoe: How to Build a Civilization',
        excerpt: 'I remember reading The Swiss Family Robinson over and over when I was little. Washed ashore in a strange land, marooned away from everything comfortable and familiar, a family must learn to thrive in their new unfamiliar home. Unlike the post-disaster tales saturating our contemporary mediascape, where people must do drastic things to survive savage environs, The Swiss Family Robinson is a story where the land is not altogether hostile, and the characters are optimistic about their future, acting more cooperative than territorial and more curious than fearful.',
        coverUrl: 'https://cdn.animenewsnetwork.com/thumbnails/fit600x1000/cms/feature/142729/slime-reincarnation-fantasy-13.jpg',
        isOriginal: false,
        sourceName: 'Anime News Network',
        sourceUrl: 'https://www.animenewsnetwork.com/feature/2019-01-30/rimuru-tempest-and-robinson-crusoe-how-to-build-a-civilization/.142729',
        markdown: articleMarkdown2,
        date: new Date(),
        // cache
        creatorName: doc.name,
        voteCount: 0,
        upVoteCount: 0,
        downVoteCount: 0,
        loveCount: 0,
        commentCount: 1,
        viewCount: 0,
      });
    });
  }).then((doc) => {
    article = doc;
    return Comment.remove({}).then(() => {
      return Comment.create({
        authorId: user._id,
        targetId: article._id,
        text: 'lask dflkas dflkas dfklasjdflkas jflkas dfalskd jfaflksd d',
        date: new Date(),
        // cache
        authorName: user.name,
        voteCount: 0,
        replyCount: 1,
      });
    });
  }).then((doc) => {
    comment = doc;
    return Comment.create([
      {
        authorId: user._id,
        targetId: comment._id,
        text: 'lask as dfalskd jfafasdfas sad lksd d',
        date: new Date(),
        // cache
        authorName: user.name,
        voteCount: 0,
        replyCount: 0,
      },
      {
        authorId: user._id,
        targetId: comment._id,
        text: 'lask as dfalskd jfaflkas dads as dd fsd d',
        date: new Date(),
        // cache
        authorName: user.name,
        voteCount: 0,
        replyCount: 0,
      },
    ]);
  });
}

const io = require('socket.io');
const server = io.listen(6001);
debug('server start');

const crypto = require('crypto');

function success(data) {
  debug('    success');
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
        if (hash === doc.hash) { // matched
          user = doc;
          return done(success({
            id: doc.id,
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
        creatorId: user._id,
        title, excerpt, coverUrl, isOriginal, sourceTitle, sourceName, sourceUrl, markdown,
        date: new Date(),
      });
    }).then((doc) => {
      done(success());
    }).catch((err) => done(error(err)));
  });

  socket.on('cl_get_articles', ({creatorId}, done) => {
    debug('cl_get_articles', creatorId);
    Article.find({creatorId}).sort({date: -1}).then((docs) => {
      const data = docs.map(({id, title, excerpt, coverUrl, sourceName, date}) => ({
        id, title, excerpt, coverUrl, sourceName, date,
      }));
      done(success(data));
    }).catch((err) => done(error(err)));
  });

  socket.on('cl_get_article', ({title}, done) => {
    debug('cl_get_article', title);
    Article.findOne({title}).then((doc) => {
      if (!doc) throw new Err('no article found');
      const {title, excerpt, date, coverUrl, markdown, creatorName, viewCount, upVoteCount, downVoteCount, loveCount, commentCount} = doc;
      done(success({id: doc.id, title, excerpt, date, coverUrl, markdown, creatorName, viewCount, upVoteCount, downVoteCount, loveCount, commentCount}));
    }).catch((err) => done(error(err)));
  });

  socket.on('cl_get_comments', ({targetId}, done) => {
    debug('cl_get_comments', targetId);
    Comment.find({targetId}).then((docs) => {
      if (!docs) return done(success([]));
      return done(success(docs.map((doc) => {
        const {text, date, authorName, voteCount, replyCount} = doc;
        return {id: doc.id, text, date, authorName, voteCount, replyCount};
      })));
    });
  });

  socket.on('cl_post_comment', ({targetId, text}, done) => {
    debug('cl_post_comment', targetId, text);
    if (!user) return done(error('forbidden'));
    Article.findByIdAndUpdate(targetId, {$inc: {commentCount: 1}}).exec();
    Comment.findByIdAndUpdate(targetId, {$inc: {replyCount: 1}}).exec();
    Comment.create({
      authorId: user._id,
      targetId: targetId,
      text: text,
      date: new Date(),
      // cache
      authorName: user.name,
      voteCount: 0,
      replyCount: 0,
    }).then(() => {
      return Comment.find({targetId}).then((docs) => {
        if (!docs) return done(success([]));
        return done(success(docs.map((doc) => {
          const {text, date, authorName, voteCount, replyCount} = doc;
          return {id: doc.id, text, date, authorName, voteCount, replyCount};
        })));
      });
    });
  });

  socket.on('disconnect', () => {
    debug('disconnect', socket.id);
  });
});
