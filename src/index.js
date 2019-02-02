const debug = require('debug')('gskse');

const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/gskse', {useNewUrlParser: true});
mongoose.set('useFindAndModify', false);
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
  creatorId: ObjectId,
  targetId: ObjectId,
  text: String,
  date: Date,
  // cache
  creatorName: String,
  voteCount: Number,
  commentCount: Number,
});

const UpVote = 'UpVote';
const DownVote = 'DownVote';
const Love = 'Love';
const View = 'View';

const Flag = mongoose.model('Flag', {
  intent: {type: String, enum: [UpVote, DownVote, Love, View]},
  creatorId: ObjectId,
  targetId: ObjectId,
  date: Date,
});

if (process.env.NODE_ENV === 'development') {
  const {articleMarkdown1, articleMarkdown2} = require('./mocks');

  let user;
  let article;
  let comment;

  User.deleteMany({}).then(() => {
    return User.create({
      name: 'Kailang',
      email: 'kailangfu@gmail.com',
      salt: '5RyOpUlzGzKL6Bhv/gPpiOtiGmQX5qxF4PqbZvO60HaxwmAjLBcGV3RHUBV8nJ83UxiYjISFdqOxHPM8D1eGsNWs/mee7GQkppBz8j2o3cVseDF5j8cFcToglY70n7FrlmPhKP50T/1H2UZAczl/g4nXTcNeE/EUbAhL6gaY4Nq01LWS6B9k60z5VhYmnup4kAX4wwUG2k30TBwvvxRi4iTk9D66VK7tEyEv/JevAwvYUmMdVP1UKpmOCS7IRLZrv9cKnGbZF/F6i19uEWZpAkOriBtOu57CfP7RKUsjzTsZqE15H/63gREe2v2nldrOstqz6FEy2yzOeWi8vZvUAA==',
      hash: 'nlEDz8iDHQzTk75KpoQMF0+g1/KI89JDpR0Q4ciDG+oi2bMuhDOv3B48J7X1x085fEXFkvIS3b/PD+mRaow8zw==',
    });
  }).then((doc) => {
    user = doc;
    return Article.deleteMany({}).then(() => {
      Article.create([
        {
          creatorId: user._id,
          title: 'Apple Entrepreneur Camp kicks off as app developer earnings hit new record',
          excerpt: 'Inaugural Session Provides Unprecedented Access to Apple Labs, Engineers, Business and Marketing Expertise',
          coverUrl: 'https://www.apple.com/newsroom/images/values/diversity-inclusion/Apple-Entrepreneur-camp-kicks-off-01282019_big.jpg.large.jpg',
          isOriginal: false,
          sourceName: 'Apple',
          sourceUrl: 'https://www.apple.com/newsroom/2019/01/apple-entrepreneur-camp-kicks-off-as-app-developer-earnings-hit-new-record/',
          markdown: articleMarkdown1,
          date: new Date(),
          // cache
          creatorName: doc.name,
          voteCount: 3,
          upVoteCount: 4,
          downVoteCount: 1,
          loveCount: 2,
          commentCount: 1,
          viewCount: 5,
        },
      ]);
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
        voteCount: 3,
        upVoteCount: 4,
        downVoteCount: 1,
        loveCount: 2,
        commentCount: 1,
        viewCount: 5,
      });
    });
  }).then((doc) => {
    article = doc;
    return Comment.deleteMany({}).then(() => {
      return Comment.create({
        creatorId: user._id,
        targetId: article._id,
        text: 'Don\'t dream too far. Don\'t lose side of who you are.',
        date: new Date(),
        // cache
        creatorName: user.name,
        voteCount: 0,
        commentCount: 2,
      });
    });
  }).then((doc) => {
    comment = doc;
    return Comment.create([
      {
        creatorId: user._id,
        targetId: comment._id,
        text: 'lask as dfalskd jfafasdfas sad lksd d',
        date: new Date(),
        // cache
        creatorName: user.name,
        voteCount: 0,
        commentCount: 0,
      },
      {
        creatorId: user._id,
        targetId: comment._id,
        text: 'lask as dfalskd jfaflkas dads as dd fsd d',
        date: new Date(),
        // cache
        creatorName: user.name,
        voteCount: 0,
        commentCount: 0,
      },
    ]);
  });
}

const io = require('socket.io');
const server = io.listen(6001);
debug('server start');

const crypto = require('crypto');

function success(data) {
  debug('    success', JSON.stringify(data));
  return {status: 'success', data};
}

function error(err) {
  debug('    error', JSON.stringify(err));
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

  socket.on('cl_new_article', ({title, excerpt, coverUrl, isOriginal, sourceName, sourceUrl, markdown}, done) => {
    debug('cl_new_article', title);
    if (!user) return done(error('forbidden'));
    Article.findOne({title}).then((doc) => {
      if (doc) throw new Err('duplicated title');
      return Article.create({
        creatorId: user._id,
        title, excerpt, coverUrl, isOriginal, sourceName, sourceUrl, markdown,
        date: new Date(),
      });
    }).then((doc) => {
      done(success());
    }).catch((err) => done(error(err)));
  });

  socket.on('cl_get_articles', (args, done) => {
    debug('cl_get_articles');
    Article.find().sort({date: -1}).then((docs) => {
      const data = docs.map(({id, title, excerpt, coverUrl, sourceName, date}) => ({
        id, title, excerpt, coverUrl, sourceName, date,
      }));
      done(success(data));
    }).catch((err) => done(error(err)));
  });

  socket.on('cl_get_article', async ({title}, done) => {
    debug('cl_get_article', title);
    const doc = await Article.findOne({title});
    if (!doc) return done(error('no article found'));
    const {excerpt, date, coverUrl, markdown, creatorName, viewCount, upVoteCount, downVoteCount, loveCount, commentCount, isOriginal, sourceName, sourceUrl} = doc;
    const res = {id: doc.id, title, excerpt, date, coverUrl, markdown, creatorName, viewCount, upVoteCount, downVoteCount, loveCount, commentCount, isOriginal, sourceName, sourceUrl};
    if (user) {
      res.viewCount += 1;
      Flag.create({intent: 'View', creatorId: user._id, targetId: doc._id, date: new Date()});
      Article.findByIdAndUpdate(doc._id, {$inc: {viewCount: 1}}).exec();
      const flags = await Flag.find({targetId: doc._id, creatorId: user._id});
      flags.forEach((flag) => {
        if (flag.intent === UpVote) res.didUpVote = true;
        if (flag.intent === DownVote) res.didDownVote = true;
        if (flag.intent === Love) res.didLove = true;
      });
    }
    return done(success(res));
  });

  socket.on('cl_get_comments', async ({targetId}, done) => {
    debug('cl_get_comments', targetId);
    const docs = await Comment.find({targetId});
    if (!docs) return done(success([]));

    const dict = {};
    if (user) {
      const flags = await Flag.find({$or: docs.map((doc) => ({targetId: doc._id, creatorId: user._id}))});
      flags.forEach((flag) => {
        const id = flag.targetId.toString();
        if (!dict[id]) dict[id] = {};
        if (flag.intent === UpVote) dict[id].didUpVote = true;
        if (flag.intent === DownVote) dict[id].didDownVote = true;
      });
    }

    const res = docs.map((doc) => {
      const {text, date, creatorName, voteCount, commentCount} = doc;
      return {...dict[doc.id], id: doc.id, text, date, creatorName, voteCount, commentCount};
    });

    return done(success(res));
  });

  socket.on('cl_post_comment', ({targetId, text}, done) => {
    debug('cl_post_comment', targetId, text);
    if (!user) return done(error('forbidden'));
    Article.findByIdAndUpdate(targetId, {$inc: {commentCount: 1}}).exec();
    Comment.findByIdAndUpdate(targetId, {$inc: {commentCount: 1}}).exec();
    Comment.create({
      creatorId: user._id,
      targetId: targetId,
      text: text,
      date: new Date(),
      // cache
      creatorName: user.name,
      voteCount: 0,
      commentCount: 0,
    }).then(() => {
      return Comment.find({targetId}).then((docs) => {
        if (!docs) return done(success([]));
        return done(success(docs.map((doc) => {
          const {text, date, creatorName, voteCount, commentCount} = doc;
          return {id: doc.id, text, date, creatorName, voteCount, commentCount};
        })));
      });
    });
  });

  socket.on('cl_flag', async ({targetId, intent}, done) => {
    debug('cl_flag', intent, targetId);
    if (!user) return done(error('forbidden'));
    switch (intent) {
      case UpVote: {
        const adjustment = {didUpVote: false, didDownVote: false, voteCount: 0, upVoteCount: 0, downVoteCount: 0};
        let flag = await Flag.findOne({targetId, intent: UpVote});
        if (flag) { // un-vote
          adjustment.voteCount -= 1;
          adjustment.upVoteCount -= 1;
          Flag.deleteMany({targetId, creatorId: user._id, intent: UpVote}).exec();
          return done(success(adjustment));
        }

        adjustment.voteCount += 1;
        adjustment.upVoteCount += 1;
        adjustment.didUpVote = true;
        flag = await Flag.findOne({targetId, creatorId: user._id, intent: DownVote});
        if (flag) { // originally voted down
          adjustment.voteCount += 1;
          adjustment.downVoteCount -= 1;
          Flag.deleteMany({targetId, creatorId: user._id, intent: DownVote}).exec();
        }
        Flag.create({targetId, creatorId: user._id, intent: UpVote});
        Article.findByIdAndUpdate(targetId, {$inc: adjustment}).exec();
        Comment.findByIdAndUpdate(targetId, {$inc: adjustment}).exec();
        return done(success(adjustment));
      }
      case DownVote: {
        const adjustment = {didUpVote: false, didDownVote: false, voteCount: 0, upVoteCount: 0, downVoteCount: 0};
        let flag = await Flag.findOne({targetId, creatorId: user._id, intent: DownVote});
        if (flag) { // un-vote
          adjustment.voteCount += 1;
          adjustment.downVoteCount -= 1;
          Flag.deleteMany({targetId, creatorId: user._id, intent: DownVote}).exec();
          return done(success(adjustment));
        }

        adjustment.voteCount -= 1;
        adjustment.downVoteCount += 1;
        adjustment.didDownVote = true;
        flag = await Flag.findOne({targetId, creatorId: user._id, intent: UpVote});
        if (flag) { // originally voted up
          adjustment.voteCount -= 1;
          adjustment.upVoteCount -= 1;
          Flag.deleteMany({targetId, creatorId: user._id, intent: UpVote}).exec();
        }
        Flag.create({targetId, creatorId: user._id, intent: DownVote});
        Article.findByIdAndUpdate(targetId, {$inc: adjustment}).exec();
        Comment.findByIdAndUpdate(targetId, {$inc: adjustment}).exec();
        return done(success(adjustment));
      }
      case Love: {
        const adjustment = {didLove: false, loveCount: 0};
        const flag = await Flag.findOne({targetId, creatorId: user._id, intent: Love});
        if (flag) { // un-love
          adjustment.loveCount -= 1;
          Flag.deleteMany({targetId, creatorId: user._id, intent: Love}).exec();
          return done(success(adjustment));
        }
        adjustment.loveCount += 1;
        adjustment.didLove = true;
        Flag.create({targetId, creatorId: user._id, intent: Love});
        Article.findByIdAndUpdate(targetId, {$inc: adjustment}).exec();
        Comment.findByIdAndUpdate(targetId, {$inc: adjustment}).exec();
        return done(success(adjustment));
      }
      default:
        return done(error('invalid flag'));
    }
  });

  socket.on('disconnect', () => {
    debug('disconnect', socket.id);
  });
});
