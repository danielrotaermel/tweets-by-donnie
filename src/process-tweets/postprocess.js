const AWS = require('aws-sdk');
const ToneAnalyzerV3 = require('watson-developer-cloud/tone-analyzer/v3');

AWS.config.update({ region: 'us-east-1' });

const ddb = new AWS.DynamoDB.DocumentClient();

const toneAnalyzer = new ToneAnalyzerV3({
  url: process.env.toneAnalyzer_url,
  version: '2017-09-21',
  username: process.env.toneAnalyzer_username,
  password: process.env.toneAnalyzer_password,
});

module.exports.postprocess = (event, context, callback) => {
  console.log('got a tweet from trump');
  event.Records.forEach((record) => {
    console.log('Stream record: ', JSON.stringify(record, null, 2));
    if (record.eventName == 'INSERT') {
      console.log('INSERT');
      const tweet = AWS.DynamoDB.Converter.unmarshall(record.dynamodb.NewImage);
      console.log('twet: ', tweet);

      analyzeToneAsync(tweet.text)
        .then((res) => {
          // create params
          const enrichedTweet = tweet;
          enrichedTweet.enrichment = res;
          const params = {
            TableName: process.env.TRUMPS_ENRICHED_TWEETS_TABLE,
            Item: enrichedTweet,
          };
          return ddb.put(params).promise();
        })
        .then(res => console.log('written:', res))
        .catch(err => console.log('error:', err));
    }
  });
};

function analyzeToneAsync(text) {
  return new Promise((resolve, reject) => {
    toneAnalyzer.tone({ text }, (err, res) => {
      if (err) reject(err);
      else resolve(res);
    });
  });
}
