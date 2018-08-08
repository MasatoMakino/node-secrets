const sgf = require("staged-git-files");
const fs = require("fs");
const istextorbinary = require("istextorbinary");
const projectDir = `${process.cwd()}/`;

const patterns = [
  "[A-Z0-9]{20}",
  "${opt_quote}${aws}(SECRET|secret|Secret)?_?(ACCESS|access|Access)?_?(KEY|key|Key)${opt_quote}${connect}${opt_quote}[A-Za-z0-9/+=]{40}${opt_quote}",
  "${opt_quote}${aws}(ACCOUNT|account|Account)_?(ID|id|Id)?${opt_quote}${connect}${opt_quote}[0-9]{4}-?[0-9]{4}-?[0-9]{4}${opt_quote}"
];

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

/**
 * ファイル一覧を受け取って検査を開始する。
 * @param results{Array}
 */
const checkResults = results => {
  console.log(`node-secrets : checking ${results.length} items...`);

  for (result of results) {
    //自分自身は検査の対象にならない。
    if (projectDir + result.filename === __filename) {
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
  istextorbinary.isBinary(projectDir + path, null, function(err, result) {
    if (err) {
      throw err;
      process.exit(1); // ensure git hooks abort
    }
    if (result) return;

    fs.readFile(projectDir + path, (err, data) => {
      if (err) throw err;

      for (pattern of patterns) {
        checkPattern(path, data, pattern);
      }
    });
  });
};

/**
 * string内を検査する
 * @param path{string}
 * @param data{string}
 * @param pattern{string}
 */
const checkPattern = (path, data, pattern) => {
  let regexp = RegExp(pattern);
  const result = regexp.exec(data);

  if (result != null) {
    console.warn("AWS key is found!");
    console.warn(projectDir + path);
    process.exit(1); // ensure git hooks abort
  }
};
