const AWS = require('aws-sdk');
const cleanDeep = require('clean-deep');
const ToneAnalyzerV3 = require('watson-developer-cloud/tone-analyzer/v3');

AWS.config.update({ region: 'us-east-1' });

const ddb = new AWS.DynamoDB.DocumentClient();

const toneAnalyzer = new ToneAnalyzerV3({
  url: process.env.toneAnalyzer_url,
  version: '2017-09-21',
  username: process.env.toneAnalyzer_username,
  password: process.env.toneAnalyzer_password,
});

module.exports.periodicReports = (event, context, callback) => {
  console.log('creating report');

  getLatestTweets(process.env.schedule)
    .then((res) => {
      console.log(`Query succeeded, got ${res.Items.length} tweets`);
      // concat text fields
      const allTweetsText = res.Items.map(tweet => tweet.text).join('.\n');
      return analyzeToneAsync(allTweetsText);
    })
    .then((res) => {
      // delete unneeded sentencestone
      delete res.sentences_tone;
      writeReport(res);
    })
    .then(() => console.log('written report'))
    .catch(err => console.error('Error:', JSON.stringify(err, null, 2)));
};

function getLatestTweets(periodInMinutes) {
  const today = new Date();
  const offset = periodInMinutes * 60 * 1000;
  const offsettedDate = today - offset;

  const queryParams = {
    TableName: process.env.OTHER_TWEETS_TABLE,
    KeyConditionExpression: '#d = :day AND #c >= :timestamp_ms',
    ExpressionAttributeNames: {
      '#d': 'day',
      '#c': 'timestamp_ms',
    },
    ExpressionAttributeValues: {
      ':day': today.toISOString().substring(0, 10),
      ':timestamp_ms': offsettedDate.toString(),
    },
    // Limit: 1,
  };

  return ddb.query(queryParams).promise();
}

function analyzeToneAsync(text) {
  return new Promise((resolve, reject) => {
    toneAnalyzer.tone({ text }, (err, res) => {
      if (err) reject(err);
      else resolve(res);
    });
  });
}

function writeReport(report) {
  const data = report;
  const now = new Date();
  data.day = now.toISOString().substring(0, 10);
  data.timestamp_ms = now.getTime().toString();
  data.created_at = now.toISOString();
  const params = {
    RequestItems: {
      [process.env.PERIODIC_CLOUT_REPORTS_TABLE]: [createPutRequestObject(data)],
    },
  };

  return ddb.batchWrite(params).promise();
}

function createPutRequestObject(payload) {
  return {
    PutRequest: {
      Item: cleanDeep(payload),
    },
  };
}
