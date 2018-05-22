const glob = require('glob');
const mkdirp = require('mkdirp');
const { readFile, writeFile } = require('fs');
const { promisify } = require('util');
const { dirname, basename } = require('path');

const readFileAsync = promisify(readFile);
const writeFileAsync = promisify(writeFile);
const globAsync = promisify(glob);
const mkdirpAsync = promisify(mkdirp);

(async () => {
  console.log('[svg-sprite] start');

  const _symbols = [];
  const _svgData = [];

  const files = await globAsync('src/**/*.+(svg)');

  await Promise.all(
    files.map(file => {
      return new Promise(async resolve => {
        const _data = await readFileAsync(file, { encoding: 'utf-8' });

        const _str = _data.toString();

        if (!_str) return resolve();

        const _viewBoxStrs = _str.match(/viewBox="([^"]*)"/);

        if (!_viewBoxStrs || !('1' in _viewBoxStrs)) return resolve();

        const _viewBox = _viewBoxStrs[1];

        const _minStr = _str
          .replace(/^\s+/gm, '')
          .replace(/\n/gm, '')
          .replace(/<title.+\/title>/g, '');

        const _minStrs = _minStr.match(/<svg[^>]*>(.*)<\/svg>/);

        if (!_minStrs || !('1' in _minStrs)) return resolve();

        const _id = `svg-${basename(file, '.svg')}`;
        const _size = _viewBox.split(' ');
        const _width = _size[2] - _size[0];
        const _height = _size[3] - _size[1];

        _symbols.push(`<symbol id="${_id}" viewBox="${_viewBox}">${_minStrs[1]}</symbol>`);
        _svgData.push(`$${_id}:(width:${_width},height:${_height});`)

        resolve();
      });
    }),
  );

  // svg
  const _svgStr = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" style="display:none;">${_symbols.join('')}</svg>`;
  const _svgPath = 'ejs/_svg.ejs';
  await mkdirpAsync(dirname(_svgPath));
  await writeFileAsync(_svgPath, _svgStr);
  console.log(`[svg-sprite] create ${_svgPath}`);

  // scss
  const _svgScssStr = _svgData.join('');
  const _scssPath = 'sass/_svg.scss';
  await mkdirpAsync(dirname(_scssPath));
  await writeFileAsync(_scssPath, _svgScssStr);
  console.log(`[svg-sprite] create ${_scssPath}`);

  console.log('[svg-sprite] end');
})();
