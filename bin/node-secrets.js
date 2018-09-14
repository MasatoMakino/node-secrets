#!/usr/bin/env node
"use strict";

const sgf = require("staged-git-files");
const fs = require("fs");
const path = require("path");
const istextorbinary = require("istextorbinary");
const isSvg = require("is-svg");
const projectDir = `${process.cwd()}/`;

const aws = "(AWS|aws|Aws)?_?";
const quote = "(\"|')";
const connect = "s*(:|=>|=)s*";
const opt_quote = `${quote}?`;

const patterns = [
  RegExp("[A-Z0-9]{20}"),
  RegExp("[A-Za-z0-9/+=]{40}"),
  RegExp(
    `${opt_quote}${aws}(ACCOUNT|account|Account)_?(ID|id|Id)?${opt_quote}${connect}${opt_quote}[0-9]{4}-?[0-9]{4}-?[0-9]{4}${opt_quote}`
  )
];

exports.scan = () => {
  /**
   * staging状態のファイル一覧を取得する。
   */
  sgf((err, results) => {
    if (err) {
      console.log(err);
      process.exit(1); // ensure git hooks abort
    }
    exports.checkResults(results);
  });
};
exports.scan();

/**
 * ファイル一覧を受け取って検査を開始する。
 * @param results{Array}
 */
exports.checkResults = results => {
  console.log(`node-secrets : checking ${results.length} items...`);
  return new Promise((resolve, reject) => {
    let promises = [];
    for (let result of results) {
      promises.push(exports.checkFile(result.filename));
    }
    Promise.all(promises).then(results => {
      resolve(results);
    });
  });
};

const isTargetFile = filePath => {
  //.lockファイルは検査対象外。
  let name = path.basename(filePath);
  if (name === "yarn.lock" || name === "package-lock.json") {
    return false;
  }
  return true;
};

/**
 * 指定されたURLのファイルを検査する
 * @param path{string}
 */
exports.checkFile = path => {
  console.log(`node-secrets : ${path}`);

  return new Promise((resolve, reject) => {
    if (!isTargetFile(path)) {
      resolve("NOT TARGET");
      return;
    }

    fs.readFile(projectDir + path, (err, data) => {
      const result = exports.checkBuffer(path, err, data);
      resolve(result);
    });
  });
};

/**
 * 読み込まれたバッファーを検査する
 * @param path
 * @param err
 * @param data
 * @returns {*}
 */
exports.checkBuffer = (path, err, data) => {
  if (err) {
    //ファイルが存在しない場合はチェックを中止。
    if (err.code === "ENOENT") {
      return err.code;
    }
    throw err;
  }

  const isBinary = istextorbinary.isBinarySync("", data);
  const isSVG = isSvg(data);
  if (isBinary === true || isSVG === true) {
    return "BINARY";
  }

  const execArray = exports.checkPatterns(path, data);
  if (execArray != null) {
    process.exit(1); // ensure git hooks abort
  }
  return "CHECKED";
};

exports.checkPatterns = (path, data) => {
  for (let regexp of patterns) {
    const result = checkPattern(path, data, regexp);
    if (result != null) {
      console.warn("AWS key is found!", path, result);
      return result;
    }
  }
  return null;
};

/**
 * string内を検査する
 * @param path{string}
 * @param data{string}
 * @param regexp{RegExp}
 */
const checkPattern = (path, data, regexp) => {
  return regexp.exec(data);
};
