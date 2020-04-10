'use strict';

const { normalize, dirname, join, relative, resolve } = require('path');
const { readFile, writeFile, ensureDir, remove, readJSON, writeJSON } = require('fs-extra');
const logSymbols = require('log-symbols');
const fg = require('fast-glob');
const postcss = require('postcss');
const { react } = require('@bem/sdk.naming.presets');
const createMatch = require('@bem/sdk.naming.cell.match');
const svgr = require('@svgr/core').default;

// TODO: https://github.com/bem/bem-sdk/issues/385
const enhancedReactNaming = {
  ...react,
  wordPattern: '[a-zA-Z0-9-]+',
};

const nestedModernMatch = createMatch(enhancedReactNaming);

const copyPackageJson = async (distPaths) => {
  const file = await readFile('package.json', 'utf8');
  const outPaths = `${distPaths}/package.json`;
  console.log(outPaths);
  await ensureDir(dirname(outPaths));
  await writeFile(outPaths, file);
};

const transformCSS = async (ignore, src, distPaths, options) => {
  const { postcss: postcssUserPlugins = [] } = options;
  const cssFiles = await fg([`${src}/**/*.{css,scss}`], { ignore });
  const firstDistPath = distPaths[0];
  // const { plugins: postcssDefaultPlugins } = getPostcssConf(namespace, naming);
  const postcssProcessor = postcss([
    // ...postcssDefaultPlugins,
    ...postcssUserPlugins,
  ]);

  cssFiles.forEach(async (fileName) => {
    const css = await readFile(fileName);
    const distFilename = resolve(firstDistPath, relative(src, fileName));
    const processedCss = await postcssProcessor.process(css, { from: fileName, to: distFilename });
    for (const distPath of distPaths) {
      const newPath = resolve(distPath, relative(src, fileName));
      await ensureDir(dirname(newPath));
      writeFile(newPath, processedCss);
    }
  });
};

const iconComponentIsValid = (obj) => {
  return !!(obj.m && obj.s && obj.xs);
};

const createIconStories = async (svgComponents, src) => {
  const templatePath = './builder/templates/Icon.stories.tsx.template';
  const template = await readFile(templatePath, 'utf8');

  let imports = '';
  let items = '';

  Object.keys(svgComponents).forEach(async (componentName) => {
    if (iconComponentIsValid(svgComponents[componentName])) {
      imports += `import { ${componentName} } from '../../${componentName}/${componentName}';\n`;
      items += `<IconsItem name="${componentName}" icon={${componentName}} {...defaultKnobs()} />\n`;
    }
  });

  const jsCode = template.replace(/#imports#/g, imports).replace(/#items#/g, items);
  const jsPatch = `${src}/icons/Icon/Icons.stories/Icons.stories.tsx`;
  await ensureDir(dirname(jsPatch));
  await writeFile(jsPatch, jsCode);
};

const iconsTransformed = async (ignore, src) => {
  const iconParse = async ({ componentName, path, pathOutdir }) => {
    const svg = await readFile(path, 'utf8');
    const jsCode = await svgr(
      svg,
      {
        plugins: ['@svgr/plugin-svgo', '@svgr/plugin-jsx', '@svgr/plugin-prettier'],
        typescript: true,
        dimensions: false,
        svgo: true,
      },
      { componentName }
    );
    const jsPatch = `${pathOutdir}/${componentName}.tsx`;
    await ensureDir(dirname(jsPatch));
    await writeFile(jsPatch, jsCode);
  };
  const createComponent = async ({ componentName, pathOutdir, templatePath }) => {
    const template = await readFile(templatePath, 'utf8');
    const jsCode = template.replace(/#componentName#/g, componentName);

    const jsPatch = `${pathOutdir}/${componentName}.tsx`;
    await ensureDir(dirname(jsPatch));
    await writeFile(jsPatch, jsCode);
  };

  const svgFiles = await fg([`${src}/icons/**/*.{svg}`], { ignore });

  const test = /.\/src\/icons\/(.+)\/(.+).svg/;
  const svgComponents = {};

  svgFiles.forEach((fileName) => {
    if (test.test(fileName)) {
      const [file, componentName, size] = test.exec(fileName);
      if (!svgComponents[componentName]) {
        svgComponents[componentName] = {};
      }
      svgComponents[componentName][size.toLowerCase()] = file;
    }
  });

  Object.keys(svgComponents).forEach(async (componentName) => {
    if (iconComponentIsValid(svgComponents[componentName])) {
      await iconParse({
        componentName: 'Xs',
        path: svgComponents[componentName].xs,
        pathOutdir: `./src/icons/${componentName}/`,
      });
      await iconParse({
        componentName: 'S',
        path: svgComponents[componentName].s,
        pathOutdir: `./src/icons/${componentName}/`,
      });
      await iconParse({
        componentName: 'M',
        path: svgComponents[componentName].m,
        pathOutdir: `./src/icons/${componentName}/`,
      });
      await createComponent({
        componentName,
        pathOutdir: `./src/icons/${componentName}/`,
        templatePath: './builder/templates/Icon.js.template',
      });
    }
  });
  await createIconStories(svgComponents, src);
};

const copyAssets = async (ignore, src, distPaths) => {
  const assetFiles = await fg([`${src}/**/*.{jpg,png,gif,md}`], { ignore });

  assetFiles.forEach(async (fileName) => {
    const asset = await readFile(fileName);
    for (const distPath of distPaths) {
      const newPath = resolve(distPath, relative(src, fileName));
      await ensureDir(dirname(newPath));
      writeFile(newPath, asset);
    }
  });
};

// TODO: make 'components' part of API
// const components = 'components';

// TODO: get it from bem-config
// const platforms = ['common', 'desktop', 'touch-phone', 'touch-pad'];
const platforms = ['common'];

const layerToPlatform = {
  common: ['common', 'desktop', 'touch-phone', 'touch-pad'],
  desktop: ['desktop'],
  deskpad: ['touch-pad', 'desktop'],
  touch: ['touch-phone', 'touch-pad'],
  'touch-pad': ['touch-pad'],
  'touch-phone': ['touch-phone'],
};

const getPackageTemplate = ({ name, version = '0.0.0' }) => `{
  "name": "${name}",
  "version": "${version}",
  "main": "index.js",
  "module": "es.js",
  "sideEffects": [
    "*.css"
  ]
}
`;

const getESMExportTemplate = ({ filePath }) => `export * from "${filePath}";`;
const getCJSExportTemplate = ({ filePath }) =>
  `tslib_1.__exportStar(require("${filePath}"), exports);`;

const indexEsTmpl = (blocks) => blocks.join('\n');

// TODO: https://st.yandex-team.ru/ISL-6234
const indexJsTmpl = (blocks) => `"use strict";
exports.__esModule = true;
var tslib_1 = require("tslib");
${blocks.join('\n')}
`;

const updateGitignore = async (allKeys, gitignorePath) => {
  let gitignore = await readFile(gitignorePath, { flag: 'a+', encoding: 'utf8' });

  gitignore = gitignore.split('\n').map((el) => el.trim());
  let startOfBuildPaths = gitignore.indexOf('# build');
  if (startOfBuildPaths === -1) {
    gitignore.unshift('# build');
    startOfBuildPaths = 0;
  }
  let endOfBuildPaths = gitignore.findIndex(
    (el, index) => index > startOfBuildPaths && el.startsWith('#')
  );
  if (endOfBuildPaths === -1) {
    endOfBuildPaths = gitignore.indexOf('', startOfBuildPaths + 1);
  }
  if (endOfBuildPaths === -1) {
    endOfBuildPaths = gitignore.length;
  }
  const neededAddEmptyLine =
    endOfBuildPaths < gitignore.length && gitignore[endOfBuildPaths] !== '';
  let buildPaths = gitignore
    .slice(startOfBuildPaths, endOfBuildPaths)
    .filter((el) => el)
    .sort();

  buildPaths = [...buildPaths, ...allKeys.map((k) => `/${k}`)].sort();

  buildPaths = buildPaths.reduce((acc, el) => {
    if (!acc.length || acc[acc.length - 1] !== el) {
      acc.push(el);
    }
    return acc;
  }, []);

  if (neededAddEmptyLine) {
    buildPaths.push('');
  }

  gitignore = [
    ...gitignore.slice(0, startOfBuildPaths),
    ...buildPaths,
    ...gitignore.slice(endOfBuildPaths),
  ];

  await writeFile(gitignorePath, gitignore.join('\n'));
};

const generateReExports = (
  ignore,
  src,
  [distSrc, distEsSrc],
  distPath,
  componentFolder = 'components'
) =>
  fg([join(src, componentFolder, '**')], { ignore }).then(async (files) => {
    const packPath = join(distPath, 'package.json');
    const pack = await readJSON(packPath);
    const components = new Map();

    // Collect components
    files
      .sort()
      .filter((fileName) => fileName.match(/\.tsx?$/))
      .forEach((fileName) => {
        const filePath = fileName.replace(normalize(src), '');
        const entityName = filePath.replace(`/${componentFolder}/`, '');

        const { cell } = nestedModernMatch(entityName);

        if (!cell) {
          // eslint-disable-next-line no-console
          console.log(logSymbols.warning, 'not exported:', entityName);
          return;
        }

        const { entity, layer, tech } = cell;

        if (tech.match(/^tsx?$/)) {
          if (!components.has(entity.block)) {
            components.set(entity.block, new Map(platforms.map((p) => [p, new Map()])));
          }
          if (layerToPlatform[layer]) {
            for (let platform of layerToPlatform[layer]) {
              // what we do with elements ?
              if (!entity.elem) {
                components.get(entity.block).get(platform);
                // .set(entity.id, { filePath });
              } else {
                // console.log(entity);
              }
            }
          }
        }
      });

    // Generate reExports for components
    for (let [componentName, platforms] of components) {
      const blockDir = join(distPath, componentName);

      await remove(blockDir); // how to clean ? we need to store blocks somewhere
      await ensureDir(blockDir);

      for (let [platform, entities] of platforms) {
        const platformDir = platform === 'common' ? blockDir : join(blockDir, platform);

        await ensureDir(platformDir);
        await writeFile(
          join(platformDir, 'package.json'),
          getPackageTemplate({
            name: `${componentName}/${platform}`,
            // version: pack.version,
          })
        );

        const reExportsES = [];
        const reExportsJS = [];

        // eslint-disable-next-line no-unused-vars
        // eslint-disable @typescript-eslint/no-unused-vars
        for (let [a, { filePath }] of entities) {
          console.log(a);
          const exportESMTemplate = getESMExportTemplate({
            filePath: relative(
              join(platformDir, 'index'),
              join(blockDir, distEsSrc, filePath.replace(/\.tsx?$/, ''))
            ),
          });
          const exportCJSTemplate = getCJSExportTemplate({
            filePath: relative(
              join(platformDir, 'index'),
              join(blockDir, distSrc, filePath.replace(/\.tsx?$/, ''))
            ),
          });

          reExportsES.push(exportESMTemplate);
          reExportsJS.push(exportCJSTemplate);
        }

        /*
         * Складываем bundle для платформы, если файл представлен
         */

        // const bundleFilesTest =`${src}/components/${componentName}/${componentName}.bundle/${platform}.{ts,tsx}`
        const bundleFilesTest = `${src}/${componentFolder}/${componentName}/${componentName}.{ts,tsx}`;

        const bundleFiles = await fg(bundleFilesTest);

        if (bundleFiles.length === 1) {
          const bundleDir = join(platformDir, '');
          await ensureDir(bundleDir);

          const platformPath = bundleFiles[0]
            .replace(/\.tsx?$/, '')
            .replace(`src/${componentFolder}`, componentFolder);
          const cjsFilePath = relative(
            join(bundleDir, 'index'),
            join(blockDir, distSrc, platformPath)
          );
          const esmFilePath = relative(
            join(bundleDir, 'index'),
            join(blockDir, distEsSrc, platformPath)
          );

          const bundleCJS = [];
          const bundleESM = [];

          bundleCJS.push(
            getCJSExportTemplate({
              filePath: cjsFilePath,
            })
          );
          writeFile(join(bundleDir, 'index.js'), indexJsTmpl(bundleCJS));

          bundleESM.push(
            getESMExportTemplate({
              filePath: esmFilePath,
            })
          );
          writeFile(join(bundleDir, 'es.js'), indexEsTmpl(bundleESM));

          writeFile(join(bundleDir, 'index.d.ts'), indexEsTmpl(bundleESM));

          writeFile(
            join(bundleDir, 'package.json'),
            getPackageTemplate({
              name: `${componentName}/${platform}/bundle`,
              // version: pack.version,
            })
          );
        }
        writeFile(join(platformDir, 'index.js'), indexJsTmpl(reExportsJS));
        writeFile(join(platformDir, 'index.d.ts'), indexEsTmpl(reExportsES));
        writeFile(join(platformDir, 'es.js'), indexEsTmpl(reExportsES));
      }
    }

    // TODO: internal забирать из общего места.
    const newKeys = ['__internal__', ...components.keys()];
    const allKeys = pack.files.concat(newKeys);

    const setKeys = new Set(allKeys.sort());
    pack.files = Array.from(setKeys);

    await writeJSON(packPath, pack, { spaces: 2 });

    // eslint-disable-next-line no-console
    console.log(logSymbols.success, 'Update', packPath);

    const gitignorePath = join(distPath, '.gitignore');
    await updateGitignore(newKeys, gitignorePath);
    // eslint-disable-next-line no-console
    // console.log(logSymbols.success, 'Update', gitignorePath);
  });

module.exports = {
  transformCSS,
  copyAssets,
  generateReExports,
  iconsTransformed,
  copyPackageJson,
};