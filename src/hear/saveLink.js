var moment = require('moment');
var debug = require('debug')('save-links');
var client = require('./../redis');
var msgUtils = require('./../msgUtils');
var urlUtils = require('./../urlUtils');
var _ = require('lodash');

function saveLink(msg){
  debug('msg received: ' + msg.envelope.message.text);
  var links = msgUtils.extractLinks(msg);
  var savelinksPromises = [];

  links.forEach(function(link) {
    var parsedUrl = urlUtils.createParsedUrl(link);
    var savelinksPromise = isUrlAlreadySaved(parsedUrl).then(function(parsedUrl) {
      if (parsedUrl.alreadySavedLink === undefined) {
        return persist(createUrlInfo(parsedUrl, msg));
      }

      return  parsedUrl.alreadySavedLink;
    });

    savelinksPromises.push(savelinksPromise);
  });

  Promise.all(savelinksPromises).then(function(alreadySavedUrls) {
    _.remove(alreadySavedUrls, _.isUndefined);

    if(process.env.OLD_ENABLED) {
      alreadySavedUrls.forEach(function(alreadySavedUrl){
        msg.send('#OLD! ' + alreadySavedUrl.link + ' was already posted on '  + moment(alreadySavedUrl.date).format('DD MMM YYYY HH:mm') + ' by ' + alreadySavedUrl.postedBy);
      });
    }
  });
}

function isUrlAlreadySaved(parsedUrl) {
  return new Promise(function(resolve, reject) {
    client.hget('hubot:links:hash', parsedUrl.href, function(err, result){
      if(err) {
        reject(err);
        return;
      }

      if(result) {
        debug(result);
        parsedUrl.alreadySavedLink = JSON.parse(result);
      }

      return resolve(parsedUrl);
    });
  });
}

function createUrlInfo(parsedUrl, msg) {
  return {
    link: parsedUrl.href,
    postedBy: msg.envelope.user.name,
    date: Date.now(),
    parsedUrl: parsedUrl,
    msg: msg.envelope,
    tags: msgUtils.extractTags(msg)
  };
}

function persist(linkInfo) {
  var linkInfoString = JSON.stringify(linkInfo);
  var multi = client.multi([
      ["hset", "hubot:links:hash", linkInfo.link, linkInfoString],
      ["lpush", "hubot:links:list", linkInfoString],
      ["zadd", "hubot:links:sorted-set", linkInfo.date, linkInfoString]
    ]
  );

  multi.exec(function (err, replies) {
    if(err) {
      debug(err);
    }
    debug('link ' + linkInfo.link + ' saved');
    debug('link info: ' + linkInfo);
  });
}

module.exports = saveLink;
