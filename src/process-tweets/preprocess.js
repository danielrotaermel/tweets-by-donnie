const AWS = require('aws-sdk');
const bufferFrom = require('buffer-from');
const cleanDeep = require('clean-deep');
// const jsonToDynamo = require('json-to-dynamo');
// const uuid = require('uuid');
// const dynamodb = require('./dynamodb');

// Set the region
AWS.config.update({ region: 'us-east-1' });

// Create DynamoDB service object
const ddb = new AWS.DynamoDB.DocumentClient();

module.exports.preprocess = (event, context, callback) => {
  const POTUS = 822215679726100480;
  const REALDONALDTRUMP = 25073877;

  const trumpsTweets = [];
  const otherTweets = [];

  event.Records.forEach((record) => {
    // Kinesis data is base64 encoded so decode here
    const payload = JSON.parse(bufferFrom(record.kinesis.data, 'base64').toString('ascii'));

    // we don't want retweets!
    if (payload.retweeted_status) return;

    // we want the whole text
    let wholeText = payload.text;
    if (payload.full_text) wholeText = payload.full_text;
    if (payload.extended) wholeText = payload.extended.full_text;

    // we only want tweets that have text
    if (isBlank(wholeText)) return;

    const result = {
      day: new Date(payload.created_at).toISOString().substring(0, 10), // add primarykey ('day')
      timestamp_ms: payload.timestamp_ms,
      id: payload.id,
      user_screen_name: payload.user.screen_name,
      user_name: payload.user.name,
      user_id: payload.user.id,
      url: payload.url,
      expanded_url: payload.expanded_url,
      created_at: payload.created_at,
      lang: payload.lang,
      text: wholeText,
    };

    console.log(`userid:${result.user_id}`);

    // check if it's trumps tweet
    if (result.user_id === POTUS || result.user_id === REALDONALDTRUMP) {
      trumpsTweets.push(createPutRequestObject(result));
    } else {
      otherTweets.push(createPutRequestObject(result));
    }
  });

  // prepare write
  const params = {
    RequestItems: {},
  };

  if (trumpsTweets.length > 0) {
    params.RequestItems[process.env.TRUMPS_TWEETS_TABLE] = trumpsTweets;
  }
  if (otherTweets.length > 0) {
    params.RequestItems[process.env.OTHER_TWEETS_TABLE] = otherTweets;
  }

  // stop if theres nothiing to write
  if (isEmptyObject(params.RequestItems)) return;

  ddb.batchWrite(params, (err, data) => {
    if (err) {
      console.log('Error', err);
    } else {
      console.log('Success', JSON.stringify(data, null, 2));
    }
  });
};

function createPutRequestObject(payload) {
  return {
    PutRequest: {
      Item: cleanDeep(payload),
    },
  };
}

function isEmptyObject(obj) {
  return !Object.keys(obj).length;
}

function isBlank(str) {
  return !str || /^\s*$/.test(str);
}
