/*
 * @Author: hAo
 * @LastEditors  : hAo
 * @Date: 2020-01-16 20:54:52
 * @LastEditTime : 2020-05-12 16:32:52
 */
import fs from "fs";
import path from "path";
import ejs from "ejs";

const baseDir = path.resolve(__dirname, "../packages/");
const files = fs.readdirSync(baseDir);
const baseVersion = "0.0.0";

type createFileExcutorByJucierReturn = (
  tplPath: string,
  filename: string,
  tplData?: any
) => void;

function createFileExcutorByJucier(
  pkgPath: string
): createFileExcutorByJucierReturn {
  return (tplPath: string, filename: string, tplData?: any): void => {
    const template = fs.readFileSync(tplPath, { encoding: "utf-8" });
    const writeFile = `${pkgPath}/${filename}`;
    const content = JSON.parse(ejs.render(template, tplData || {}));
    fs.writeFileSync(writeFile, JSON.stringify(content, null, 2));
  };
}

function createFileExcutorByFs(pkgPath: string) {
  return (filename: string, tplData?: any): void => {
    const writeFile = `${pkgPath}/${filename}`;
    fs.writeFileSync(writeFile, tplData);
  };
}

function mapFilesByTarget(file: string, target: Array<string>): string[] {
  const basePath = path.join(baseDir, file);
  const findDir = target.find((it) => file.includes(it));
  return findDir
    ? fs.readdirSync(basePath).map((it) => `${findDir}/${it}`)
    : [];
}

function reduceFiles(
  total: Array<string>,
  curV: Array<string> | string
): Array<string> {
  Array.isArray(curV) ? total.push(...curV) : total.push(curV);
  return total;
}

if (files.length < 0) {
  process.exit(1);
}

const packageDir = files
  .map((file) =>
    mapFilesByTarget(file, ["@purepack-common", "@purepack-vue", "@common"])
  )
  .reduce(
    (total: Array<string>, curV: Array<string> | string) =>
      reduceFiles(total, curV),
    []
  );

packageDir.forEach((pkg) => {
  if (pkg.charAt(0) !== ".") {
    const pkgPath = path.join(baseDir, pkg);
    const stat = fs.statSync(pkgPath);
    const isDir = stat.isDirectory();
    if (isDir) {
      const pkgFile = fs.readdirSync(pkgPath);
      const hasPackageJson = pkgFile.includes("package.json");
      const hasNpmignore = pkgFile.includes(".npmignore");
      const hasTsConfig = pkgFile.includes("tsconfig.json");
      const createFileInsertPkgByEjs = createFileExcutorByJucier(pkgPath);
      const createFileInsertPkgByFs = createFileExcutorByFs(pkgPath);
      // if (!hasPackageJson) {
      const packageTemplatePath = path.resolve(
        __dirname,
        "../template/package.ejs"
      );
      const packageJson = {
        packagename: pkg,
        version: baseVersion,
        description: `构建purepack-cli生态`
      };
      createFileInsertPkgByEjs(
        packageTemplatePath,
        "package.json",
        packageJson
      );
      // }
      // if (!hasNpmignore) {
      createFileInsertPkgByFs(".npmignore", "src");
      // }

      // if (!hasTsConfig) {
      const tsconfigTemplatePath = path.resolve(
        __dirname,
        "../template/tsconfig.ejs"
      );
      createFileInsertPkgByEjs(tsconfigTemplatePath, "tsconfig.json");
      // }
    }
  }
});
