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
const connect = "\\s*(:|=>|=)\\s*";
const opt_quote = `${quote}?`;

const KEY_PATTERN = `(A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}`;
const SECRET_PATTERN = `${opt_quote}${aws}(SECRET|secret|Secret)?_?(ACCESS|access|Access)?_?(KEY|key|Key)${opt_quote}${connect}${opt_quote}[A-Za-z0-9/+=]{40}${opt_quote}`;

const patterns = [
  RegExp(KEY_PATTERN),
  RegExp(SECRET_PATTERN),
  RegExp(
    `${opt_quote}${aws}(ACCOUNT|account|Account)_?(ID|id|Id)?${opt_quote}${connect}${opt_quote}[0-9]{4}-?[0-9]{4}-?[0-9]{4}${opt_quote}`
  ),
];

exports.scan = () => {
  //staging状態のファイル一覧を取得する。
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
exports.checkResults = (results) => {
  return new Promise((resolve, reject) => {
    // console.log(`node-secrets : checking ${results.length} items...`);
    let promises = [];
    for (let result of results) {
      promises.push(exports.checkFile(result.filename));
    }
    Promise.all(promises).then((results) => {
      //console.log(`node-secrets : Done.`);
      resolve(results);
    });
  });
};

const isTargetFile = (filePath) => {
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
exports.checkFile = (path) => {
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

  const isBinary = istextorbinary.isBinarySync(path, data);
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

/**
 * バイナリデータを検査する
 * @param path 対象ファイルパス
 * @param data バッファー
 * @returns {*} パターンが存在した場合は配列、それ以外はnullが帰る
 */
exports.checkPatterns = (path, data) => {
  for (let regexp of patterns) {
    const result = regexp.exec(data);

    if (result != null) {
      console.warn("AWS key is found!");
      console.warn("  File Path :", path);
      console.warn(
        "  Line number :",
        getLineNumber(result.input, result.index)
      );
      console.warn(
        "  Matched :",
        getWarningLine(result.input, result.index, result[0])
      );

      return result;
    }
  }
  return null;
};

/**
 * 指定されたキャラクターインデックスの行数を取得する。
 * @private
 * @param str 検査を行う文字列
 * @param index 行数を確認するキャラクターインデックス
 * @returns {number} 行数
 */
const getLineNumber = (str, index) => {
  const tempString = str.substring(0, index);
  return tempString.split("\n").length;
};

/**
 * 指定されたキャラクターインデックスの行の内容を取得する。
 * @private
 * @param str
 * @param index
 * @returns {*|string}
 */
const getLineString = (str, index) => {
  const lineNum = getLineNumber(str, index);
  return str.split("\n")[lineNum - 1];
};

/**
 * 指定されたキャラクターインデックスとマッチ文字列から、
 * コンソール出力用のカラーリングされた文字列を生成する。
 *
 * @private
 * @param str
 * @param index
 * @param matched
 * @returns {string}
 */
const getWarningLine = (str, index, matched) => {
  const line = getLineString(str, index);
  return line.replace(matched, `\u001b[31m${matched}\u001b[0m`);
};
