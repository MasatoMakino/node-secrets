#!/usr/bin/env node
"use strict";

const sgf = require("staged-git-files");
const fs = require("fs");
const path = require("path");
const istextorbinary = require("istextorbinary");
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

const scan = () => {
  /**
   * staging状態のファイル一覧を取得する。
   */
  sgf((err, results) => {
    if (err) {
      console.log(err);
      process.exit(1); // ensure git hooks abort
    }
    checkResults(results);
  });
};
scan();

/**
 * ファイル一覧を受け取って検査を開始する。
 * @param results{Array}
 */
const checkResults = results => {
  console.log(`node-secrets : checking ${results.length} items...`);

  for (let result of results) {
    //自分自身は検査の対象にならない。
    if (projectDir + result.filename === __filename) {
      continue;
    }
    //.lockファイルは検査対象外。
    let name = path.basename(result.filename);
    if (name === "yarn.lock" || name === "package-lock.json") {
      continue;
    }

    checkFile(result.filename);
  }
};

/**
 * 指定されたURLのファイルを検査する
 * @param path{string}
 */
const checkFile = path => {
  fs.readFile(projectDir + path, (err, data) => {
    if (err) {
      //ファイルが存在しない場合はチェックを中止。
      if (err.code === "ENOENT") {
        return;
      }
      throw err;
    }

    istextorbinary.isBinary("", data, (err, result) => {
      if (err) {
        throw err;
        process.exit(1); // ensure git hooks abort
      }
      if (result) return;

      for (let regexp of patterns) {
        checkPattern(path, data, regexp);
      }
    });
  });
};

/**
 * string内を検査する
 * @param path{string}
 * @param data{string}
 * @param regexp{RegExp}
 */
const checkPattern = (path, data, regexp) => {
  const result = regexp.exec(data);

  if (result != null) {
    console.warn("AWS key is found!");
    console.warn(path);
    console.warn(result);
    process.exit(1); // ensure git hooks abort
  }
};
