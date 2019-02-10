const debug = require('debug')('gskse');

const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/gskse', {useNewUrlParser: true});
mongoose.set('useFindAndModify', false);
const ObjectId = mongoose.Schema.Types.ObjectId;

const DefaultAnnualRate = 0.06;
const InitialLoan = 10000;

const User = mongoose.model('User', {
  name: String,
  email: String,
  salt: String,
  hash: String,
  // cached
  cash: Number,
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

const UP_VOTE = 'UP_VOTE';
const DOWN_VOTE = 'DOWN_VOTE';
const LOVE = 'LOVE';
const VIEW = 'VIEW';
const Flag = mongoose.model('Flag', {
  intent: {type: String, enum: [UP_VOTE, DOWN_VOTE, LOVE, VIEW]},
  creatorId: ObjectId,
  targetId: ObjectId,
  date: Date,
});

const Loan = mongoose.model('Loan', {
  toId: ObjectId,
  annualRate: Number,
  amount: Number,
  date: Date,
  repaidAmount: Number,
  repaidDate: Date,
});

const LOAN = 'LOAN';
const REPAY = 'REPAY';
const TRANSFER = 'TRANSFER';
const Transaction = mongoose.model('Transaction', {
  intent: {type: String, enum: [LOAN, REPAY, TRANSFER]},
  fromId: ObjectId,
  toId: ObjectId,
  amount: Number,
  date: Date,
});

if (process.env.NODE_ENV === 'development') {
  const {articleMarkdown1, articleMarkdown2} = require('./mocks');

  (async function() {
    await User.deleteMany({});
    await Article.deleteMany({});
    await Comment.deleteMany({});
    await Transaction.deleteMany({});
    await Loan.deleteMany({});

    const user = await User.create({
      name: 'Kailang',
      email: 'kailangfu@gmail.com',
      salt: '5RyOpUlzGzKL6Bhv/gPpiOtiGmQX5qxF4PqbZvO60HaxwmAjLBcGV3RHUBV8nJ83UxiYjISFdqOxHPM8D1eGsNWs/mee7GQkppBz8j2o3cVseDF5j8cFcToglY70n7FrlmPhKP50T/1H2UZAczl/g4nXTcNeE/EUbAhL6gaY4Nq01LWS6B9k60z5VhYmnup4kAX4wwUG2k30TBwvvxRi4iTk9D66VK7tEyEv/JevAwvYUmMdVP1UKpmOCS7IRLZrv9cKnGbZF/F6i19uEWZpAkOriBtOu57CfP7RKUsjzTsZqE15H/63gREe2v2nldrOstqz6FEy2yzOeWi8vZvUAA==',
      hash: 'nlEDz8iDHQzTk75KpoQMF0+g1/KI89JDpR0Q4ciDG+oi2bMuhDOv3B48J7X1x085fEXFkvIS3b/PD+mRaow8zw==',
      cash: InitialLoan,
      debt: InitialLoan,
    });

    const loan = await Loan.create({
      toId: user._id,
      annualRate: DefaultAnnualRate,
      amount: InitialLoan,
      date: new Date(),
    });

    await Transaction.create({
      intent: LOAN,
      fromId: loan._id,
      toId: user._id,
      amount: InitialLoan,
      date: new Date(),
    });

    await Article.create({
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
      creatorName: user.name,
      voteCount: 3,
      upVoteCount: 4,
      downVoteCount: 1,
      loveCount: 2,
      commentCount: 0,
      viewCount: 5,
    });

    const article = await Article.create({
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
      creatorName: user.name,
      voteCount: 3,
      upVoteCount: 4,
      downVoteCount: 1,
      loveCount: 2,
      commentCount: 1,
      viewCount: 5,
    });

    const comment = await Comment.create({
      creatorId: user._id,
      targetId: article._id,
      text: 'Don\'t dream too far. Don\'t lose side of who you are.',
      date: new Date(),
      // cache
      creatorName: user.name,
      voteCount: 0,
      commentCount: 2,
    });

    await Comment.create([
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
  })();
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

function findByIdAndInc(collection, id, adjustment) {
  switch (collection) {
    case 'Article': return Article.findByIdAndUpdate(id, {$inc: adjustment}).exec();
    case 'Comment': return Comment.findByIdAndUpdate(id, {$inc: adjustment}).exec();
  }
}

function getLoanPeriodCount(date) {
  return 1 + new Date().getUTCFullYear() - date.getUTCFullYear();
}

function getLoanDebt(date, annualRate, amount) {
  return Math.ceil(amount * Math.pow(1 + annualRate, getLoanPeriodCount(date)));
}

server.on('connect', function(socket) {
  debug('connect', socket.id);
  let user = null;

  socket.on('disconnect', () => {
    debug('disconnect', socket.id);
  });

  socket.on('cl_register', async ({name, email, password}, done) => {
    debug('cl_register', name, email, password);

    let user = await User.findOne({$or: [{name}, {email}]});
    if (user) return done(error('existing name or email'));

    const salt = crypto.randomBytes(256).toString('base64');
    const hasher = crypto.createHash('sha512');
    hasher.update(password);
    hasher.update(salt);
    const hash = hasher.digest('base64');

    user = await User.create({name, email, salt, hash, cash: InitialLoan});
    const loan = await Loan.create({
      toId: user._id,
      annualRate: DefaultAnnualRate,
      amount: InitialLoan,
      date: new Date(),
    });

    await Transaction.create({
      intent: LOAN,
      fromId: loan._id,
      toId: user._id,
      amount: InitialLoan,
      date: new Date(),
    });

    done(success());
  });

  socket.on('cl_login', async ({nameOrEmail, password}, done) => {
    debug('cl_login', nameOrEmail, password);

    const users = await User.find({$or: [{name: nameOrEmail}, {email: nameOrEmail}]});
    for (let i = 0; i < users.length; i += 1) {
      const hasher = crypto.createHash('sha512');
      hasher.update(password);
      hasher.update(users[i].salt);
      const hash = hasher.digest('base64');

      if (hash === users[i].hash) { // matched
        user = users[i];
        return done(success({id: user.id, name: user.name, cash: user.cash}));
      }
    }

    done(error('no match found'));
  });

  socket.on('cl_logout', (done) => {
    debug('cl_logout');

    user = null;
    done(success());
  });

  socket.on('cl_get_profile', async (done) => {
    debug('cl_get_profile');

    if (!user) return done(error('forbidden'));

    const [transactions, loans] = await Promise.all([
      Transaction.find({$or: [{fromId: user._id}, {toId: user._id}]}),
      Loan.find({toId: user._id}),
    ]);

    const res = {cash: 0, debt: 0};
    res.transactions = transactions.map((transaction) => {
      const {intent, amount, date} = transaction;
      switch (intent) {
        case LOAN: {
          res.cash += amount;
          return {intent, amount, date, balance: res.cash};
        }
        case REPAY: {
          res.cash -= amount;
          return {intent, amount, date, balance: res.cash};
        }
      }
    });
    res.loans = loans.map((loan) => {
      const {id, annualRate, amount, date, repaidAmount, repaidDate} = loan;
      const periodCount = getLoanPeriodCount(date);
      const debt = getLoanDebt(date, annualRate, amount);
      if (!repaidDate) res.debt += debt;
      return {id, annualRate, amount, periodCount, debt, date, repaidAmount, repaidDate};
    });

    // Does not need recalculation normally
    // User.findByIdAndUpdate(user._id, {$set: {cash: res.cash, debt: res.debt}});

    done(success(res));
  });

  socket.on('cl_new_article', async ({title, excerpt, coverUrl, isOriginal, sourceName, sourceUrl, markdown}, done) => {
    debug('cl_new_article', title);

    if (!user) return done(error('forbidden'));

    let article = await Article.findOne({title});
    if (article) return done(error('duplicated title'));

    article = await Article.create({
      creatorId: user._id,
      title, excerpt, coverUrl, isOriginal, sourceName, sourceUrl, markdown,
      date: new Date(),
      // cache
      creatorName: user.name,
      voteCount: 0,
      upVoteCount: 0,
      downVoteCount: 0,
      loveCount: 0,
      commentCount: 0,
      viewCount: 0,
    });

    done(success());
  });

  socket.on('cl_get_articles', async (args, done) => {
    debug('cl_get_articles');

    const articles = await Article.find().sort({date: -1});
    const res = articles.map(({id, title, excerpt, coverUrl, sourceName, date}) => ({
      id, title, excerpt, coverUrl, sourceName, date,
    }));

    done(success(res));
  });

  socket.on('cl_get_article', async ({title}, done) => {
    debug('cl_get_article', title);

    const article = await Article.findOne({title});
    if (!article) return done(error('no article found'));

    const {id, excerpt, date, coverUrl, markdown, creatorName, viewCount, upVoteCount, downVoteCount, loveCount, commentCount, isOriginal, sourceName, sourceUrl} = article;
    const res = {id, title, excerpt, date, coverUrl, markdown, creatorName, viewCount, upVoteCount, downVoteCount, loveCount, commentCount, isOriginal, sourceName, sourceUrl};

    if (user) {
      res.viewCount += 1;
      Flag.create({intent: 'VIEW', creatorId: user._id, targetId: article._id, date: new Date()});
      Article.findByIdAndUpdate(article._id, {$inc: {viewCount: 1}}).exec();

      const flags = await Flag.find({targetId: article._id, creatorId: user._id});
      flags.forEach((flag) => { // user's flags
        if (flag.intent === UP_VOTE) res.didUpVote = true;
        if (flag.intent === DOWN_VOTE) res.didDownVote = true;
        if (flag.intent === LOVE) res.didLove = true;
      });
    }

    return done(success(res));
  });

  socket.on('cl_get_comments', async ({targetId}, done) => {
    debug('cl_get_comments', targetId);

    const comments = await Comment.find({targetId});
    if (comments.length === 0) return done(success([]));

    const dict = {};
    if (user) { // find user's flags for all comments
      const flags = await Flag.find({$or: comments.map((comment) => ({targetId: comment._id, creatorId: user._id}))});
      flags.forEach((flag) => {
        const id = flag.targetId.toString();
        if (!dict[id]) dict[id] = {};
        if (flag.intent === UP_VOTE) dict[id].didUpVote = true;
        if (flag.intent === DOWN_VOTE) dict[id].didDownVote = true;
      });
    }

    const res = comments.map((comment) => {
      const {id, text, date, creatorName, voteCount, commentCount} = comment;
      return {...dict[comment.id], id, text, date, creatorName, voteCount, commentCount};
    });

    return done(success(res));
  });

  socket.on('cl_post_comment', async ({collection, targetId, text}, done) => {
    debug('cl_post_comment', collection, targetId, text);

    if (!user) return done(error('forbidden'));

    findByIdAndInc(collection, targetId, {commentCount: 1});
    await Comment.create({
      creatorId: user._id,
      targetId: targetId,
      text: text,
      date: new Date(),
      // cache
      creatorName: user.name,
      voteCount: 0,
      commentCount: 0,
    });

    const comments = await Comment.find({targetId});
    if (comments.length === 0) return done(success([]));

    const res = comments.map((comment) => {
      const {id, text, date, creatorName, voteCount, commentCount} = comment;
      return {id, text, date, creatorName, voteCount, commentCount};
    });

    done(success(res));
  });

  socket.on('cl_flag', async ({collection, targetId, intent}, done) => {
    debug('cl_flag', collection, intent, targetId);

    if (!user) return done(error('forbidden'));
    switch (intent) {
      case UP_VOTE: {
        const adjustment = {didUpVote: false, didDownVote: false, voteCount: 0, upVoteCount: 0, downVoteCount: 0};
        let flag = await Flag.findOne({targetId, creatorId: user._id, intent: UP_VOTE});
        if (flag) { // un-vote
          adjustment.voteCount -= 1;
          adjustment.upVoteCount -= 1;
          Flag.deleteMany({targetId, creatorId: user._id, intent: UP_VOTE}).exec();
          findByIdAndInc(collection, targetId, adjustment);
          return done(success(adjustment));
        }

        adjustment.voteCount += 1;
        adjustment.upVoteCount += 1;
        adjustment.didUpVote = true;
        flag = await Flag.findOne({targetId, creatorId: user._id, intent: DOWN_VOTE});
        if (flag) { // originally voted down
          adjustment.voteCount += 1;
          adjustment.downVoteCount -= 1;
          Flag.deleteMany({targetId, creatorId: user._id, intent: DOWN_VOTE}).exec();
        }
        Flag.create({targetId, creatorId: user._id, intent: UP_VOTE});
        findByIdAndInc(collection, targetId, adjustment);
        return done(success(adjustment));
      }

      case DOWN_VOTE: {
        const adjustment = {didUpVote: false, didDownVote: false, voteCount: 0, upVoteCount: 0, downVoteCount: 0};
        let flag = await Flag.findOne({targetId, creatorId: user._id, intent: DOWN_VOTE});
        if (flag) { // un-vote
          adjustment.voteCount += 1;
          adjustment.downVoteCount -= 1;
          Flag.deleteMany({targetId, creatorId: user._id, intent: DOWN_VOTE}).exec();
          findByIdAndInc(collection, targetId, adjustment);
          return done(success(adjustment));
        }

        adjustment.voteCount -= 1;
        adjustment.downVoteCount += 1;
        adjustment.didDownVote = true;
        flag = await Flag.findOne({targetId, creatorId: user._id, intent: UP_VOTE});
        if (flag) { // originally voted up
          adjustment.voteCount -= 1;
          adjustment.upVoteCount -= 1;
          Flag.deleteMany({targetId, creatorId: user._id, intent: UP_VOTE}).exec();
        }
        Flag.create({targetId, creatorId: user._id, intent: DOWN_VOTE});
        findByIdAndInc(collection, targetId, adjustment);
        return done(success(adjustment));
      }

      case LOVE: {
        const adjustment = {didLove: false, loveCount: 0};
        const flag = await Flag.findOne({targetId, creatorId: user._id, intent: LOVE});
        if (flag) { // un-love
          adjustment.loveCount -= 1;
          Flag.deleteMany({targetId, creatorId: user._id, intent: LOVE}).exec();
          findByIdAndInc(collection, targetId, adjustment);
          return done(success(adjustment));
        }

        adjustment.loveCount += 1;
        adjustment.didLove = true;
        Flag.create({targetId, creatorId: user._id, intent: LOVE});
        findByIdAndInc(collection, targetId, adjustment);
        return done(success(adjustment));
      }

      default:
        return done(error('invalid flag'));
    }
  });

  socket.on('cl_repay_loan', async ({loanId}, done) => {
    debug('cl_repay_loan', loanId);

    if (!user) return done(error('forbidden'));
    const loan = await Loan.findOne({_id: loanId, repaidDate: null});
    if (!loan) return done(error('no loan found'));

    const debt = getLoanDebt(loan.date, loan.annualRate, loan.amount);
    user = await User.findById(user._id);
    if (user.cash < debt) return done(error('too poor'));

    await Transaction.create({
      intent: REPAY,
      fromId: user._id,
      toId: loan._id,
      amount: debt,
      date: new Date(),
    });

    await Loan.findByIdAndUpdate(loan._id, {$set: {repaidDate: new Date(), repaidAmount: debt}});
    await User.findByIdAndUpdate(user._id, {$inc: {cash: -debt}});
    user.cash -= debt;

    done(success({id: user.id, name: user.name, cash: user.cash}));
  });

  socket.on('cl_apply_loan', async ({amount}, done) => {
    debug('cl_apply_loan', amount);

    if (!user) return done(error('forbidden'));

    const loan = await Loan.create({
      toId: user._id,
      annualRate: DefaultAnnualRate,
      amount: amount,
      date: new Date(),
    });

    await Transaction.create({
      intent: LOAN,
      fromId: loan._id,
      toId: user._id,
      amount: amount,
      date: new Date(),
    });

    await User.findByIdAndUpdate(user._id, {$inc: {cash: amount}});
    user.cash += amount;
    debug(typeof amount);

    done(success({id: user.id, name: user.name, cash: user.cash}));
  });
});
