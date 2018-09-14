const secrets = require("../bin/node-secrets.js");
const fs = require("fs");

describe("文字列の検査", () => {
  it("空文字の場合はnull", () => {
    expect(secrets.checkPatterns("", "")).toBeNull();
  });

  it("2バイトコードは検査にかからない", () => {
    expect(secrets.checkPatterns("", "日本語のstring")).toBeNull();
  });

  it("アクセスキーはエラーを返す", () => {
    const key = "AKIAIOSFODNN7EXAMPLE";
    expect(secrets.checkPatterns("", key)).toContain(key, 0);
  });

  it("シークレットアクセスキーはエラーを返す", () => {
    const key = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY";
    expect(secrets.checkPatterns("", key)).toContain(key, 0);
  });
});

describe("存在しないファイル", () => {
  const path = "./spec/notexistfile";
  let resultString;
  beforeEach(done => {
    secrets.checkFile(path).then(result => {
      resultString = result;
      done();
    });
  });

  it("存在しないファイルは無視", done => {
    expect(resultString).toBe("ENOENT");
    done();
  });
});

describe("jpg", () => {
  const path = "./spec/m0938.jpg";
  let resultString;
  beforeEach(done => {
    secrets.checkFile(path).then(result => {
      resultString = result;
      done();
    });
  });

  it("jpg画像は無視", done => {
    expect(resultString).toBe("BINARY");
    done();
  });
});

describe("png", () => {
  const path = "spec/m0444.png";
  let resultString;
  beforeEach(done => {
    secrets.checkFile(path).then(result => {
      resultString = result;
      done();
    });
  });

  it("png画像は無視", done => {
    expect(resultString).toBe("BINARY");
    done();
  });
});

describe("svg", () => {
  const path = "spec/icon.svg";
  let resultString;
  beforeEach(done => {
    secrets.checkFile(path).then(result => {
      resultString = result;
      done();
    });
  });

  it("svg画像は無視", done => {
    expect(resultString).toBe("BINARY");
    done();
  });
});

describe(".lockファイルの除外", () => {
  const path = "./any/yarn.lock";
  let resultString;
  beforeEach(done => {
    secrets.checkFile(path).then(result => {
      resultString = result;
      done();
    });
  });

  it("yarn.lockは無視", done => {
    expect(resultString).toBe("NOT TARGET");
    done();
  });
});

describe(".lockファイルの除外", () => {
  const path = "./any/package-lock.json";
  let resultString;
  beforeEach(done => {
    secrets.checkFile(path).then(result => {
      resultString = result;
      done();
    });
  });

  it("package-lock.jsonは無視", done => {
    expect(resultString).toBe("NOT TARGET");
    done();
  });
});
