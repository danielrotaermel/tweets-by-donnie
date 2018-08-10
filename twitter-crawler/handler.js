'use strict';

var Twit = require('twit');
var moment = require('moment');
var _ = require('lodash');
var PersonalityInsightsV3 = require('watson-developer-cloud/personality-insights/v3');

var T = new Twit({
  consumer_key: process.env.consumer_key,
  consumer_secret: process.env.consumer_secret,
  access_token: process.env.access_token,
  access_token_secret: process.env.access_token_secret,
  timeout_ms: 60 * 1000, // optional HTTP request timeout to apply to all requests.
  strictSSL: true // optional - requires SSL certificates to be valid.
});

var personalityInsights = new PersonalityInsightsV3({
  url: 'https://gateway.watsonplatform.net/personality-insights/api',
  version: '2016-10-19',
  username: process.env.p_insights_username,
  password: process.env.p_insights_password
});

module.exports.hello = (event, context, callback) => {
  getTweets('realDonaldTrump');

  function getTweets(screenname) {
    const query = {
      screen_name: screenname,
      count: 200,
      tweet_mode: 'extended'
    };

    T.get('statuses/user_timeline', query, preProcessTweets);
  }

  function preProcessTweets(err, data, response) {
    // time range: 24h ago to now s
    const today = moment();
    const yesterday = moment(today.valueOf() - 7 * 24 * 60 * 60 * 1000);
    let relevantTweets = data.filter(
      word => moment(word.created_at, 'ddd MMM DD HH:mm:ss Z YYYY') >= yesterday
    );

    // we only want original tweets, no retweets
    const regexRT = /^RT @/;
    relevantTweets = relevantTweets.filter(
      word => !regexRT.test(word.full_text)
    );
    relevantTweets = relevantTweets.reverse();

    // concatenate data
    // if no punctuation, add a full stop to the end of the string.
    let tweets = relevantTweets.map(tweet => tweet.full_text).join('. ');

    // remove links from the text – maybe unneccesary if personality insights handles them
    var urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gi;
    tweets = tweets.replace(urlRegex, '');

    addEnrichments(tweets);
  }

  function addEnrichments(tweets) {
    const query = {
      content: tweets, // TODO: replace with tweets
      content_type: 'text/plain',
      consumption_preferences: true
    };

    personalityInsights.profile(query, function(err, response) {
      if (err) {
        console.log('error:', err);
      } else {
        console.log(JSON.stringify(response, null, 2));
        sendResponse(response);
      }
    });
  }

  function sendResponse(response) {
    // const res = {
    //   statusCode: 200,
    //   body: JSON.stringify({
    //     message: 'Go Serverless!',
    //     input: event,
    //     twit: process.env.twit,
    //     MY_VAR: process.env.MY_VAR,
    //     SECRET_VAR: process.env.SECRET_VAR,
    //     response: response
    //   })
    // };

    const res = {
      statusCode: 200,
      body: {
        message: 'Go Serverless!',
        input: event,
        twit: process.env.twit,
        MY_VAR: process.env.MY_VAR,
        SECRET_VAR: process.env.SECRET_VAR,
        response: response
      }
    };

    callback(null, res);
    // callback(null, { message: 'Go Serverless v1.0! Your function executed successfully!', event });
  }
};

// //
// //  tweet 'hello world!'
// //
// T.post('statuses/update', { status: 'hello world!' }, function(err, data, response) {
//   console.log(data)
// })

//
//  search twitter for all tweets containing the word 'banana' since July 11, 2011
//
// T.get('search/tweets', { q: 'banana since:2011-07-11', count: 100 }, function(err, data, response) {
//   console.log(data)
// })

//
//  get the list of user id's that follow @tolga_tezel
//
// T.get('followers/', { screen_name: 'paulfauthmayer' },  function (err, data, response) {
//   console.log(data)
// })

//
// Twit has promise support; you can use the callback API,
// promise API, or both at the same time.
//
// T.get('account/verify_credentials', { skip_status: true })
//   .catch(function (err) {
//     console.log('caught error', err.stack)
//   })
//   .then(function (result) {
//     // `result` is an Object with keys "data" and "resp".
//     // `data` and `resp` are the same objects as the ones passed
//     // to the callback.
//     // See https://github.com/ttezel/twit#tgetpath-params-callback
//     // for details.

//     console.log('data', result.data);
//   })

// //
// //  retweet a tweet with id '343360866131001345'
// //
// T.post('statuses/retweet/:id', { id: '343360866131001345' }, function (err, data, response) {
//   console.log(data)
// })

// //
// //  destroy a tweet with id '343360866131001345'
// //
// T.post('statuses/destroy/:id', { id: '343360866131001345' }, function (err, data, response) {
//   console.log(data)
// })

//
// get `funny` twitter users
//
// T.get('users/suggestions/:slug', { slug: 'funny' }, function (err, data, response) {
//   console.log(data)
// })

// //
// // post a tweet with media
// //
// var b64content = fs.readFileSync('/path/to/img', { encoding: 'base64' })

// // first we must post the media to Twitter
// T.post('media/upload', { media_data: b64content }, function (err, data, response) {
//   // now we can assign alt text to the media, for use by screen readers and
//   // other text-based presentations and interpreters
//   var mediaIdStr = data.media_id_string
//   var altText = "Small flowers in a planter on a sunny balcony, blossoming."
//   var meta_params = { media_id: mediaIdStr, alt_text: { text: altText } }

//   T.post('media/metadata/create', meta_params, function (err, data, response) {
//     if (!err) {
//       // now we can reference the media and post a tweet (media will attach to the tweet)
//       var params = { status: 'loving life #nofilter', media_ids: [mediaIdStr] }

//       T.post('statuses/update', params, function (err, data, response) {
//         console.log(data)
//       })
//     }
//   })
// })

// //
// // post media via the chunked media upload API.
// // You can then use POST statuses/update to post a tweet with the media attached as in the example above using `media_id_string`.
// // Note: You can also do this yourself manually using T.post() calls if you want more fine-grained
// // control over the streaming. Example: https://github.com/ttezel/twit/blob/master/tests/rest_chunked_upload.js#L20
// //
// var filePath = '/absolute/path/to/file.mp4'
// T.postMediaChunked({ file_path: filePath }, function (err, data, response) {
//   console.log(data)
// })

//
//  stream a sample of public statuses
//
// var stream = T.stream('statuses/sample')

// stream.on('tweet', function (tweet) {
//   console.log(tweet)
// })

// //
// //  filter the twitter public stream by the word 'mango'.
// //
// var stream = T.stream('statuses/filter', { track: 'mango' })

// stream.on('tweet', function (tweet) {
//   console.log(tweet)
// })

// //
// // filter the public stream by the latitude/longitude bounded box of San Francisco
// //
// var sanFrancisco = [ '-122.75', '36.8', '-121.75', '37.8' ]

// var stream = T.stream('statuses/filter', { locations: sanFrancisco })

// stream.on('tweet', function (tweet) {
//   console.log(tweet)
// })

// //
// // filter the public stream by english tweets containing `#apple`
// //
// var stream = T.stream('statuses/filter', { track: '#apple', language: 'en' })

// stream.on('tweet', function (tweet) {
//   console.log(tweet)
// })
