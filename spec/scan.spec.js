const fs = require("fs");

const spyLog = jest.spyOn(console, "log").mockImplementation(x => x);
const spyWarn = jest.spyOn(console, "warn").mockImplementation(x => x);

const secrets = require("../bin/node-secrets.js");

describe("文字列の検査", () => {
  test("空文字の場合はnull", () => {
    expect(secrets.checkPatterns("", "")).toBeNull();
  });

  test("2バイトコードは検査にかからない", () => {
    expect(secrets.checkPatterns("", "日本語のstring")).toBeNull();
  });

  test("アクセスキーはエラーを返す", () => {
    const key = "AKIAIOSFODNN7EXAMPLE";
    expect(secrets.checkPatterns("", key)).toContain(key, 0);
  });

  test("シークレットアクセスキーはエラーを返す", () => {
    const key = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY";
    expect(secrets.checkPatterns("", key)).toContain(key, 0);
  });
});

describe("バッファの処理", () => {
  test("テキスト読み込みはCHECKEDを返す。", () => {
    const path = "./package.json";
    const buffer = fs.readFileSync(path);
    expect(secrets.checkBuffer(path, null, buffer)).toBe("CHECKED");
  });

  test("ENOENTエラーコードを渡された場合はENOENTを返して続行", () => {
    expect(secrets.checkBuffer(null, { code: "ENOENT" }, null)).toBe("ENOENT");
  });

  test("ENOENT以外のエラーコードを渡された場合はそのコードの例外をスロー", () => {
    const error = new Error("error code");
    expect(() => {
      secrets.checkBuffer(null, error, null);
    }).toThrow(error);
  });

  test("jepg読み込みはBINARYを返す。", () => {
    const path = "./spec/m0938.jpg";
    const buffer = fs.readFileSync(path);
    expect(secrets.checkBuffer(path, null, buffer)).toBe("BINARY");
  });

  test("svg読み込みはBINARYを返す。", () => {
    const path = "spec/icon.svg";
    const buffer = fs.readFileSync(path);
    expect(secrets.checkBuffer(path, null, buffer)).toBe("BINARY");
  });

  test("シークレットアクセスキーはexit(1)。", () => {
    const exit = jest
      .spyOn(process, "exit")
      .mockImplementation(number => number);
    secrets.checkBuffer("", null, "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY");
    expect(exit).toHaveBeenCalledWith(1);
  });
});

describe("ファイルの読み込み", () => {
  test("存在しないファイルは無視", () => {
    expect(secrets.checkFile("./spec/notexistfile")).resolves.toBe("ENOENT");
  });

  test("テキストファイルは検査の上でCHECKEDを返す", () => {
    expect(secrets.checkFile("./package.json")).resolves.toBe("CHECKED");
  });

  test("jpg画像は無視", () => {
    expect(secrets.checkFile("./spec/m0938.jpg")).resolves.toBe("BINARY");
  });

  test("png画像は無視", () => {
    expect(secrets.checkFile("spec/m0444.png")).resolves.toBe("BINARY");
  });

  test("svg画像は無視", () => {
    expect(secrets.checkFile("spec/icon.svg")).resolves.toBe("BINARY");
  });

  test("yarn.lockは無視", () => {
    const path = "./any/yarn.lock";
    expect(secrets.checkFile(path)).resolves.toBe("NOT TARGET");
  });

  test("package-lock.jsonは無視", () => {
    const path = "./any/package-lock.json";
    expect(secrets.checkFile(path)).resolves.toBe("NOT TARGET");
  });
});

describe("ファイルリストの読み込み", () => {
  test("ファイルリストの読み込みは結果の配列を返す", () => {
    const list = [
      { filename: "./package.json" },
      { filename: "./spec/m0938.jpg" },
      { filename: "spec/icon.svg" },
      { filename: "./any/yarn.lock" },
      { filename: "./spec/notexistfile" }
    ];
    expect(secrets.checkResults(list)).resolves.toEqual([
      "CHECKED",
      "BINARY",
      "BINARY",
      "NOT TARGET",
      "ENOENT"
    ]);
  });
});
