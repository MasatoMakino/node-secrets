const fs = require("fs");
const secrets = require("../bin/node-secrets.js");
import { describe, expect, test, vi } from "vitest";

const dummyKey = "AKIAIOSFODNN7EXAMPLE";
const dummySecretKey = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY";
const dummySecretKeySet = "key = " + dummySecretKey;

describe("文字列の検査", () => {
  test("空文字の場合はnull", () => {
    expect(secrets.checkPatterns("", "")).toBeNull();
  });

  test("2バイトコードは検査にかからない", () => {
    expect(secrets.checkPatterns("", "日本語のstring")).toBeNull();
  });

  test("アクセスキーはエラーを返す", () => {
    expect(secrets.checkPatterns("", dummyKey)).toContain(dummyKey, 0);
  });

  test("シークレットアクセスキー単体では検査にかからない", () => {
    expect(secrets.checkPatterns("", dummySecretKey)).toBeNull();
  });

  test("シークレットアクセスキーを変数keyに代入しようとするとエラーを返す", () => {
    expect(secrets.checkPatterns("", dummySecretKeySet)).toContain(
      dummySecretKeySet,
      0,
    );

    let key = "key=" + dummySecretKey;
    expect(secrets.checkPatterns("", key)).toContain(key, 0);
    key = "key:" + dummySecretKey;
    expect(secrets.checkPatterns("", key)).toContain(key, 0);
    key = "key=>" + dummySecretKey;
    expect(secrets.checkPatterns("", key)).toContain(key, 0);
    key = "KEY : " + dummySecretKey;
    expect(secrets.checkPatterns("", key)).toContain(key, 0);
  });

  test("ファイルパスは検査にかからない", () => {
    expect(
      secrets.checkPatterns(
        "",
        "/anything/path/to/file/too/long/long/over40.js",
      ),
    ).toBeNull();
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
    const exit = vi
      .spyOn(process, "exit")
      .mockImplementation((number) => number);
    secrets.checkBuffer("", null, dummySecretKeySet);
    expect(exit).toHaveBeenCalledWith(1);
  });
});

describe("ファイルの読み込み", () => {
  test("存在しないファイルは無視", async () => {
    await expect(secrets.checkFile("./spec/notexistfile")).resolves.toBe(
      "ENOENT",
    );
  });

  test("テキストファイルは検査の上でCHECKEDを返す", async () => {
    await expect(secrets.checkFile("./package.json")).resolves.toBe("CHECKED");
  });

  test("jpg画像は無視", async () => {
    await expect(secrets.checkFile("./spec/m0938.jpg")).resolves.toBe("BINARY");
  });

  test("png画像は無視", async () => {
    await expect(secrets.checkFile("spec/m0444.png")).resolves.toBe("BINARY");
  });

  test("svg画像は無視", async () => {
    await expect(secrets.checkFile("spec/icon.svg")).resolves.toBe("BINARY");
  });

  test("yarn.lockは無視", async () => {
    const path = "./any/yarn.lock";
    await expect(secrets.checkFile(path)).resolves.toBe("NOT TARGET");
  });

  test("package-lock.jsonは無視", async () => {
    const path = "./any/package-lock.json";
    await expect(secrets.checkFile(path)).resolves.toBe("NOT TARGET");
  });
});

describe("ファイルリストの読み込み", () => {
  test("ファイルリストの読み込みは結果の配列を返す", async () => {
    const list = [
      { filename: "./package.json" },
      { filename: "./spec/m0938.jpg" },
      { filename: "spec/icon.svg" },
      { filename: "./any/yarn.lock" },
      { filename: "./spec/notexistfile" },
    ];

    const result = await secrets.checkResults(list);
    expect(result).toEqual([
      "CHECKED",
      "BINARY",
      "BINARY",
      "NOT TARGET",
      "ENOENT",
    ]);
  });
});
