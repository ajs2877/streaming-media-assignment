const fs = require('fs');
const path = require('path');

const returnPositions = (request) => {
  let { range } = request.headers;
  if (!range) {
    range = 'bytes=0-';
  }

  return range.replace(/bytes=/, '').split('-');
};

const setStream = (response, file, start, end) => {
  const stream = fs.createReadStream(file, { start, end });

  stream.on('open', () => {
    stream.pipe(response);
  });

  stream.on('error', (streamErr) => {
    response.end(streamErr);
  });

  return stream;
};

const loadMedia = (request, response, filePath, fileType) => {
  const file = path.resolve(__dirname, filePath);

  fs.stat(file, (err, stats) => {
    if (err) {
      if (err.code === 'ENOENT') {
        response.writeHead(404);
      }
      return response.end(err);
    }

    const positions = returnPositions(request);
    const total = stats.size;
    const end = positions[1] ? parseInt(positions[1], 10) : total - 1;
    const start = parseInt(positions[0], 10) > end ? end - 1 : parseInt(positions[0], 10);
    const chunksize = (end - start) + 1;

    response.writeHead(206, {
      'Content-Range': `bytes  ${start}-${end}/${total}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': fileType,
    });

    return setStream(response, file, start, end);
  });
};

const getParty = (request, response) => {
  loadMedia(request, response, '../client/party.mp4', 'video/mp4');
};

const getBling = (request, response) => {
  loadMedia(request, response, '../client/bling.mp3', 'audio/mpeg');
};

const getBird = (request, response) => {
  loadMedia(request, response, '../client/bird.mp4', 'video/mp4');
};

module.exports.getParty = getParty;
module.exports.getBling = getBling;
module.exports.getBird = getBird;
