const AWS = require('aws-sdk');
const Jimp = require('jimp');
const path = require('path');
const fs = require('fs');

const s3 = new AWS.S3();

const PHRASES = ["such serverless","very lambda","so S3","much cloud","wow","very nodejs","so api","such deploy"];
const BACKGROUNDS = ["doge.jpg","doge1.jpg","doge2.jpg","doge3.jpg","doge4.jpg"];
const pick = arr => arr[Math.floor(Math.random() * arr.length)];

module.exports.create = async () => {
  try {
    const bgFile = pick(BACKGROUNDS);
    const bgPath = path.join(__dirname, bgFile);
    if (!fs.existsSync(bgPath)) throw new Error(`Background image not found: ${bgFile}`);

    const image = await Jimp.read(bgPath);
    const fonts = [Jimp.FONT_SANS_32_WHITE, Jimp.FONT_SANS_32_BLACK, Jimp.FONT_SANS_64_WHITE, Jimp.FONT_SANS_64_BLACK];
    const font = await Jimp.loadFont(pick(fonts));

    const numLines = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < numLines; i++) {
      const text = pick(PHRASES);
      const w = Jimp.measureText(font, text);
      const h = Jimp.measureTextHeight(font, text, image.bitmap.width);
      const x = Math.floor(Math.random() * Math.max(1, image.bitmap.width - w - 10)) + 5;
      const y = Math.floor(Math.random() * Math.max(1, image.bitmap.height - h - 10)) + 5;
      image.print(font, x + 2, y + 2, text);
      image.print(font, x, y, text);
    }

    const buffer = await image.quality(85).getBufferAsync(Jimp.MIME_JPEG);
    const key = `memes/${Date.now()}.jpg`;
    await s3.putObject({ Bucket: process.env.BUCKET, Key: key, Body: buffer, ContentType: 'image/jpeg' }).promise();

    return { statusCode: 200, body: JSON.stringify({ message: "Meme created!", key }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};