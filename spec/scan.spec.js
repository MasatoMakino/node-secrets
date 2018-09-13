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
  let data;
  let error;

  beforeEach(done => {
    fs.readFile("./spec/notexistfile", (err, buffer) => {
      error = err;
      data = buffer;
      done();
    });
  });

  it("存在しないファイルは無視", done => {
    expect(secrets.checkBuffer("spec/notexistfile", error, data)).toBe(
      "ENOENT"
    );
    done();
  });
});

describe("jpg", () => {
  const path = "./spec/m0938.jpg";
  let data;
  let error;

  beforeEach(done => {
    fs.readFile(path, (err, buffer) => {
      error = err;
      data = buffer;
      done();
    });
  });

  it("jpg画像は無視", done => {
    expect(secrets.checkBuffer(path, error, data)).toBe("BINARY");
    done();
  });
});

describe("png", () => {
  const path = "spec/m0444.png";
  let data;
  let error;

  beforeEach(done => {
    fs.readFile(path, (err, buffer) => {
      error = err;
      data = buffer;
      done();
    });
  });

  it("png画像は無視", done => {
    expect(secrets.checkBuffer(path, error, data)).toBe("BINARY");
    done();
  });
});

describe("svg", () => {
  const path = "spec/icon.svg";
  let data;
  let error;

  beforeEach(done => {
    fs.readFile(path, (err, buffer) => {
      error = err;
      data = buffer;
      done();
    });
  });

  it("svg画像は無視", done => {
    expect(secrets.checkBuffer(path, error, data)).toBe("BINARY");
    done();
  });
});

describe(".lockファイルの除外", () => {
  it("yarn.lockは無視", () => {
    expect(secrets.checkFile("./any/yarn.lock")).toBe(false);
  });

  it("package-lock.jsonは無視", () => {
    expect(secrets.checkFile("./any/package-lock.json")).toBe(false);
  });
});