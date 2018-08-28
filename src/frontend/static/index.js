const api = 'https://b8vx5tovm3.execute-api.us-east-1.amazonaws.com/dev/';

function onload() {
  getReports(new Date())
    .then(data => data.json())
    .then((res) => {
      drawCloutChart(res.Items);
    })
    .catch(err => console.error(err));

  getEnrichedTweets(new Date())
    .then(data => data.json())
    .then((res) => {
      const latestTweet = res.Items[0];
      // console.log(latestTweet);
      // console.log(latestTweet.id_str);
      // console.log(latestTweet.id);
      displayTweet(String(latestTweet.id_str));
      drawTrumpsChart(latestTweet.enrichment.document_tone.tones);
    })
    .catch(err => console.error(err));
}

const default_id_str = '1031747927511916544';

function displayTweet(id_str) {
  // console.log('creating tweet');
  twttr.widgets.createTweet(id_str, document.getElementById('container'), {
    // theme: 'dark',
    cards: 'hidden',
    conversation: 'none',
    'link-color': '#55acee',
    dnt: true,
  });
  twttr.widgets.load();
}

function getReports(date) {
  const day = date.toISOString().substring(0, 10);
  const url = `${api}reports/${day}`;
  return fetch(url);
}

function getEnrichedTweets(date) {
  const day = date.toISOString().substring(0, 10);
  const url = `${api}enriched-tweets/${day}`;
  return fetch(url, {
    header: { 'Access-Control-Allow-Origin': '*' },
  });
}

function addEmojiMapping(tones) {
  tones.map((tone) => {
    tone.emoji = mapping[tone.tone_id];
    return tone;
  });
  return tones;
}

const mapping = {
  anger: '😡',
  joy: '🤗',
  sadness: '😔',
  confident: '😏',
  tentiative: '😶',
};

function drawTrumpsChart(tones) {
  const data = addEmojiMapping(tones);
  // console.log(data);

  new Morris.Bar({
    element: 'tweet-stats',
    data,
    xkey: 'emoji',
    ykeys: ['score'],
    labels: [],
    hideHover: 'always',
    grid: true,
    resize: true,
    // stacked: true,
    gridTextSize: 30,
    yLabelFormat(x) {
      return '';
    },
    barGap: 1,
    barSizeRatio: 0.2,
    xLabelMargin: 10,
    barColors(row, series, type) {
      // console.log(`--> ${row.label}`, series, type);
      if (false) return 'black';
      return '#1da1f2';
      // if (row.label == '😡') return '#ac2700';
      // if (row.label == '😨') return '#2585a3';
      // if (row.label == '😊') return '#c9ff4c';
      // if (row.label == '😢') return '#2dd5ff';
      // if (row.label == '🧐') return '#d5dfe1';
      // if (row.label == '🤗') return '#ff8e56';
      // return '#000';
    },
  });
}

function drawCloutChart(cloutReport) {
  // console.log(cloutReport);

  const labels = new Set();
  const ykeys = new Set();
  const data = [];

  cloutReport.forEach((entry) => {
    const tones = {};
    entry.document_tone.tones.forEach((tone) => {
      tones[tone.tone_id] = tone.score;
      labels.add(tone.tone_name);
      ykeys.add(tone.tone_id);
    });
    const dataEntry = tones;
    dataEntry.date = new Date(Number(entry.timestamp_ms)).toISOString();
    data.push(dataEntry);
  });

  // console.log(data);

  new Morris.Line({
    element: 'reply-stats',
    data,
    xkey: 'date',
    resize: true,
    yLabelFormat(x) {
      if (x === undefined) return '-';
      return Math.round(x * 100) / 100;
    },
    // hideHover: 'always',
    ykeys: Array.from(ykeys),
    labels: Array.from(labels),
    ymin: 'auto',
    // hoverCallback(index, options, content, row) {
    //   return `buh!`;
    // },
  });
}
