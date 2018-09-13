const secrets = require("../bin/node-secrets.js");

describe("文字列の検査", () => {
  it("空文字の場合はnull", () => {
    expect(secrets.checkPatterns("", "")).toBeNull();
  });

  it("2バイトコードは検査にかからない", () => {
    expect(secrets.checkPatterns("", "日本語のstring")).toBeNull();
  });

  it("アクセスキーはエラーを返す", () => {
    const key = "AKIAIOSFODNN7EXAMPLE";
    const result = [];
    result[0] = key;
    result["index"] = 0;
    result["input"] = key;
    expect(secrets.checkPatterns("", key)).toEqual(result);
  });

  it("シークレットアクセスキーはエラーを返す", () => {
    const key = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY";
    const result = [];
    result[0] = key;
    result["index"] = 0;
    result["input"] = key;
    expect(secrets.checkPatterns("", key)).toEqual(result);
  });
});

describe("ファイルの検査", () => {
  it("jpg画像は無視", () => {
    expect(secrets.checkFile("./spec/m0938.jpg")).toBeFalsy();
  });

  it("png画像は無視", () => {
    expect(secrets.checkFile("spec/m0444.png")).toBeFalsy();
  });

  it("存在しないファイルは無視", () => {
    expect(secrets.checkFile("spec/notexistfile")).toBeFalsy();
  });
});
