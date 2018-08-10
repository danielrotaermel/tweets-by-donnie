const Twit = require('twit');
const moment = require('moment');
// const _ = require('lodash');
const PersonalityInsightsV3 = require('watson-developer-cloud/personality-insights/v3');

const T = new Twit({
  consumer_key: process.env.consumer_key,
  consumer_secret: process.env.consumer_secret,
  access_token: process.env.access_token,
  access_token_secret: process.env.access_token_secret,
  timeout_ms: 60 * 1000, // optional HTTP request timeout to apply to all requests.
  strictSSL: true, // optional - requires SSL certificates to be valid.
});

const personalityInsights = new PersonalityInsightsV3({
  url: 'https://gateway.watsonplatform.net/personality-insights/api',
  version: '2016-10-19',
  username: process.env.p_insights_username,
  password: process.env.p_insights_password,
});

module.exports.hello = (event, context, callback) => {
  getTweets('realDonaldTrump');

  function getTweets(screenname) {
    const query = {
      screen_name: screenname,
      count: 200,
      tweet_mode: 'extended',
    };

    T.get('statuses/user_timeline', query, preProcessTweets);
  }

  function preProcessTweets(err, data) {
    // time range: 24h ago to now s
    const today = moment();
    const yesterday = moment(today.valueOf() - 7 * 24 * 60 * 60 * 1000);
    let relevantTweets = data.filter(
      word => moment(word.created_at, 'ddd MMM DD HH:mm:ss Z YYYY') >= yesterday,
    );

    // we only want original tweets, no retweets
    const regexRT = /^RT @/;
    relevantTweets = relevantTweets.filter(word => !regexRT.test(word.full_text));
    relevantTweets = relevantTweets.reverse();

    // concatenate data
    // if no punctuation, add a full stop to the end of the string.
    let tweets = relevantTweets.map(tweet => tweet.full_text).join('. ');

    // remove links from the text – maybe unneccesary if personality insights handles them
    const urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#/%?=~_|!:,.;]*[-A-Z0-9+&@#/%=~_|])/gi;
    tweets = tweets.replace(urlRegex, '');

    addEnrichments(tweets);
  }

  function addEnrichments(tweets) {
    const query = {
      content: tweets,
      content_type: 'text/plain',
      consumption_preferences: true,
    };

    personalityInsights.profile(query, (err, response) => {
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
    //     response: response
    //   })
    // };

    const res = {
      statusCode: 200,
      body: {
        message: 'Go Serverless!',
        input: event,
        twit: process.env.twit,
        response,
      },
    };

    callback(null, res);
    // callback(null, { message: 'Go Serverless v1.0! Your function executed successfully!', event });
  }
};
