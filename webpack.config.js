/*  ============================================================================================  *\
    webpack config for static HTML & vanilla js. by sleepingkiwi
\*  ============================================================================================  */


/** Why is there not a separate dev/prod config?
 *  ------------------------------------------------------------------------------------------------
 *  Because there's a lot of shared overhead between dev/prod we're currently using one file
 *  for both and passing an env.production boolean which we use to change any required values
 *  it means we can keep our simple webpack config neatly in one file.
 *
 *  We mostly use conditionals like so:
 *  `devtool: isProduction ? 'source-map' : 'cheap-module-eval-source-map',`
 *  however in more complex situations we use self executing functions
 *  see the `devServer` entry for more info
**/

/** plugins and imports
 *  ------------------------------------------------------------------------------------------------
**/
const path = require('path');
const webpack = require('webpack');

// const ExtractTextPlugin = require('extract-text-webpack-plugin');
// extract text plugin doesn't play well with webpack 4... swapped out for MiniCssExtractPlugin
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

// used for injecting our scripts into our html...
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ScriptExtHtmlWebpackPlugin = require('script-ext-html-webpack-plugin');

// the `remove: false` rule stops autoprefixer from removing prefixes that we manually insert
// this gives us more granular control to support older browsers on a case-by-case basis.
const Autoprefixer = require('autoprefixer')({ remove: false });
const Stylelint = require('stylelint');


/** the config object - returned from function
 *  ------------------------------------------------------------------------------------------------
 *  This syntax, where module.exports is a function that takes an env object as an argument
 *  and returns the webpack config object, allows us to pass environment variables via the CLI
 *  or package.json scripts in format `webpack -p --env.production --env.platform=web --progress`
 *  ref: https://webpack.js.org/guides/environment-variables/
**/
module.exports = (env) => {
  /** isProduction
   *  ----------------------------------------------------------------------------------------------
   *  Used throughout this config to check whether we're building for production or development
  **/
  const isProduction = env.production === true;


  /** ASSET_PATH constant
   *  ----------------------------------------------------------------------------------------------
   *  defining this as a variable means we can pass the asset path (for public files)
   *  through the build command (--env.ASSET_PATH='https://some-cdn.cdn')
   *  '/' is fine for dev, may need to replace with CDN etc. for prod...
   *  ref: https://webpack.js.org/configuration/output/#output-publicpath
  **/
  const ASSET_PATH = env.ASSET_PATH || '/';


  /** Returning the config object
   *  ----------------------------------------------------------------------------------------------
  **/
  return {
    /** mode
     *  --------------------------------------------------------------------------------------------
     *  see https://webpack.js.org/concepts/mode/
    **/
    mode: isProduction ? 'production' : 'development',


    /** sourcemaps
     *  --------------------------------------------------------------------------------------------
     *  - full sourcemaps for production,
     *  - cheap/fast/no column numbers for dev
     *  ---
     *  FIREFOX ISSUES:
     *  firefox annoyingly can't handle the injected source maps from style loader very well.
     *  We don't get module names etc.
     *  issue here: https://github.com/webpack-contrib/style-loader/issues/303
    **/
    devtool: isProduction ? 'source-map' : 'cheap-module-eval-source-map',


    // client side gets web, server would need 'node'
    target: 'web',


    // we set context as root directory and then use shared/ or client/ as required
    context: __dirname,


    /** entry point/s
     *  --------------------------------------------------------------------------------------------
     *  the entry point(s) are where webpack starts bundling.
     *  for multiple pages you can use multiple entries, useful if you want different script to
     *  run on different pages of the site.
     *  https://webpack.js.org/configuration/entry-context/#root
    **/
    entry: {
      main: './src/js/main.js',
      // an example of a second entry - page specific javascript for the about page
      about: './src/js/pages/about.js',
    },


    // where and how we ouput our bundled files
    output: {
      /** where should we output?
       *  ------------------------------------------------------------------------------------------
       *  only relevant for prod because dev server compiles in memory...
      **/
      path: path.resolve(__dirname, 'dist'),


      /** filename format
       *  ------------------------------------------------------------------------------------------
       *  [name] is replaced by the key in the entry {} object
       *  [chunkhash] changes only when file content changes
       *  cannot use chunkhash in dev with hot reloading.
      **/
      filename: isProduction ? '[name].[chunkhash].js' : '[name].[hash].js',


      // see const definition above for more info on ASSET_PATH
      publicPath: ASSET_PATH,


      /** Debug comments in output?
       *  ------------------------------------------------------------------------------------------
       *  outputs comments in the bundled files with details of path/tree shaking
       *  should be false in production, true for development
      **/
      pathinfo: !isProduction,
    },


    // rules for how webpack should resolve/find file names.
    resolve: {
      /** import files without extensions
       *  ------------------------------------------------------------------------------------------
       *  these are the filetypes that we can import without their extensions if we want.
       *   i.e import Header from '../shared/components/Header/Header';
       *  the '*' allows us to also include an explicit extension if we want (i.e. .jpg)
       *  ref: https://webpack.js.org/configuration/resolve/#resolve-extensions
       *  ref: http://stackoverflow.com/questions/37529513/why-does-webpack-need-an-empty-extension
      **/
      extensions: ['.js', '.json', '*'],
    },


    // controls how much info we output. Only used in prod, webpack-dev-server has it's own!
    stats: 'normal',


    // performance hints for large file sizes
    performance: (() => {
      // see the devServer entry for explanation of this function syntax (() => {})()
      if (isProduction) {
        return {
          // could set to error for production...
          hints: 'warning',

          // each 'entry' bundle (250kb)
          maxEntrypointSize: 250000,

          // any individual assets (250kb)
          maxAssetSize: 250000,
        };
      }
      // development doesn't show performance hints currently
      return {};
    })(),


    /** webpack plugins
     *  --------------------------------------------------------------------------------------------
     *  Array of plugins used to expand webpack functionality
     *  we finish this array with [].filter(plugin => plugin != null),
     *  which removes any empty entries
     *  i.e. `[1,2,,4,5,6].filter(p => p != null)` -- would return --> [1, 2, 4, 5, 6]
     *  this allows us to conditionally include plugins based on the dev/production env.
    **/
    plugins: [
      /** define some global constants
       *  ------------------------------------------------------------------------------------------
       *  creates global constants - ref: https://webpack.js.org/plugins/define-plugin/
       *  for example we could call WEBPACK_ASSET_PATH anywhere in our bundled code
      **/
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': isProduction ? JSON.stringify('production') : JSON.stringify('development'),
        WEBPACK_ASSET_PATH: JSON.stringify(ASSET_PATH),
      }),


      /** outputting the HTML from our pug templates
       *  ------------------------------------------------------------------------------------------
       *  we need a separate instance of HtmlWebpackPlugin for each new page.
       *  we can manually include or exclude _chunks_ to make sure we get all the appropriate
       *  javascript and css in the HTML output.
      **/
      new HtmlWebpackPlugin({
        template: path.resolve(__dirname, 'src/pug/pages/index.pug'),
        filename: 'index.html',
        chunks: ['main'], // include the main js bundle
        inject: true, // inject the js at the bottom of body
        // this option seemed to consistently cause issues in production if true...
        cache: false,
      }),
      new HtmlWebpackPlugin({
        template: path.resolve(__dirname, 'src/pug/pages/about.pug'),
        filename: 'about/index.html',
        chunks: ['main', 'about'], // include the main js bundle and the about page specific one
        inject: true, // inject the js at the bottom of body
        // this option seemed to consistently cause issues in production if true...
        cache: false,
      }),


      /** make all scripts async/defered by default.
       *  ------------------------------------------------------------------------------------------
       *  https://github.com/numical/script-ext-html-webpack-plugin
       *  -
       *  sometimes it might make sense for the main script to be sync see example below.
      **/
      new ScriptExtHtmlWebpackPlugin({
        // add defer and async to all .js files
        defer: /\.js$/,
        async: /\.js$/,
        // if you want to make one or more scripts synchronous:
        // sync: ['main'],
      }),


      /** [DEV ONLY] hot module replacement
       *  ------------------------------------------------------------------------------------------
       *  we're not doing a whole lot with this right now but it acts as livereload replacement
       *  for our stylesheets. style-loader implements this behind the scenes!
       *  ref: https://webpack.js.org/guides/hot-module-replacement/#hmr-with-stylesheets
      **/
      (() => {
        if (!isProduction) {
          return new webpack.HotModuleReplacementPlugin(); // Enable HMR in dev...
        }
        // return null in production, this is then stripped away by our array filter.
        return null;
      })(),


      /** [production only] Extract Text Plugin
       *  ------------------------------------------------------------------------------------------
       *  writes our bundled css to a file with the given name!
       *  HtmlWebpackPlugin includes css for each chunk in it's output
       *  we _require_ css in the html files to expose it to webpack like:
       *  https://github.com/pugjs/pug-loader#embedded-resources
      **/
      (() => {
        if (isProduction) {
          // return new ExtractTextPlugin('[name].[contenthash].css');
          return new MiniCssExtractPlugin({
            filename: '[name].[contenthash].css',
          });
        }
        // return null in development, this is then stripped away by our array filter.
        return null;
      })(),
    ].filter(plugin => plugin != null), // see note at start for .filter explanation...


    /** Loaders to handle files
     *  --------------------------------------------------------------------------------------------
     *  loaders are used to tell webpack how to interpret different file types.
    **/
    module: {
      rules: [
        /** eslint
         *  ----------------------------------------------------------------------------------------
         *  eslint is configured in package.json
         *  this runs first, before babel has a chance to transpile
        **/
        {
          // make sure this happens first, before babel transpiles things
          enforce: 'pre',
          // .js or .jsx files
          test: /\.(js|jsx)$/,
          /** only lint our own code
           *  --------------------------------------------------------------------------------------
           *  (other js/jsx imports, for example from node_modules, will still be bundled
           *  but will not be linted by this loader)
          **/
          include: [
            path.resolve(__dirname, 'src/js'),
          ],
          // Run eslint on the .js and .jsx files that we've found
          use: 'eslint-loader',
        },


        /** babel
         *  ----------------------------------------------------------------------------------------
         *  Run all of our .js and .jsx files through babel.
         *  use ES6+ features that aren't widely supported and transpile them back to ES5...
        **/
        {
          // .js or .jsx files
          test: /\.(js|jsx)$/,
          // only transpile files in our own dirs
          include: [
            path.resolve(__dirname, 'src/js'),
          ],
          // Transpile all .js and .jsx files with babel
          use: 'babel-loader',
        },


        /** pug
         *  ----------------------------------------------------------------------------------------
         *  pug-loader is the one that actually handles our pug files
        **/
        {
          test: /\.pug$/,
          use: 'pug-loader',
        },


        /** loading static files with file-loader
         *  ----------------------------------------------------------------------------------------
         *  in javascript:
         *  - `import logo from './logo.png';`
         *  - `return <img src={logo} alt="Logo" />;`
         *
         *  in pug:
         *  - img(src=require("./my/image.png"))
         *  ref: https://github.com/pugjs/pug-loader#embedded-resources
         *
         *  - the examples above use images which are actually processed with urlloader below
         *    but the process is exactly the same!
         *
         *  For our purpose we want to avoid maintaining a list of all the filetypes that
         *  we might one day want to load through webpack `test: /\.(ico|jpg|jpeg|png.....`
         *  Instead we let file-loader load everything that we haven't explicitly excluded
         *
         *  We're running file-loader without a test, so it basically matches everything.
         *  we manually exclude files that are processed with the other loaders
         *  (because if they're processed by other loaders we don't need to load twice)
        **/
        {
          exclude: [
            /\.html$/,
            /\.ejs$/,
            /\.(js|jsx)$/,
            /\.css$/,
            /\.scss$/,
            /\.json$/,
            /\.bmp$/,
            /\.gif$/,
            /\.jpe?g$/,
            /\.png$/,
            /\.pug$/,
            path.resolve(__dirname, 'src/static/root'),
          ],
          use: [
            {
              loader: 'file-loader',
              options: {
                name: 'static/media/[name].[hash:8].[ext]',
              },
            },
          ],
        },


        /** static files served from root without name transformation
         *  ----------------------------------------------------------------------------------------
         *  The files in public/root don't have their names transformed and are served from
         *  the root. This covers things like favicon.ico and robots.txt
        **/
        {
          include: [
            path.resolve(__dirname, 'src/static/root'),
          ],
          // REQUIRED IN WEBPACK 4 - otherwise json is parsed rather than copied as a file...
          // see: https://github.com/webpack/webpack/issues/6586
          type: 'javascript/auto',
          use: [
            {
              loader: 'file-loader',
              options: {
                name: '[name].[ext]',
              },
            },
          ],
        },


        /** URL loader to potentially embed data URLs for small images
         *  ----------------------------------------------------------------------------------------
         *  url-loader works the same as file-loader unless the files are below a certain size
         *  threshold, in which case it embeds the file as a data-uri instead to save a request.
         *  clever thing.
         *  we could manually exluding the icon folder - this contains fallback pngs for icons
         *  used on the site and we may not want a data string for them because there can be loads
         *  on any given page.
        **/
        {
          test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
          /*
          // exclude icons optionally:
          // enable the file-loader config below if you enable this!
          exclude: [
            path.resolve(__dirname, 'src/static/icons'),
          ],
          */
          use: [
            {
              loader: 'url-loader',
              options: {
                // 6kb threshold for embedding
                limit: 6000,
                name: 'static/media/[name].[hash:8].[ext]',
              },
            },
          ],
        },


        /** excluded icon fallback images
         *  ----------------------------------------------------------------------------------------
         *  file loader specifically for the pngs in src/static/icons folder
         *  used if we exclude it above in the url-loader test!
        **/
        /*
        {
          include: [
            path.resolve(__dirname, 'src/static/icons'),
          ],
          use: [
            {
              loader: 'file-loader',
              options: {
                name: 'static/media/[name].[hash:8].[ext]',
              },
            },
          ],
        },
        */


        /** SCSS to CSS, with autoprefixer and stylelint
         *  ----------------------------------------------------------------------------------------
        **/
        {
          test: /\.scss/,
          /** LOADERS RUN BOTTOM TO TOP!
           *  --------------------------------------------------------------------------------------
           *  to get an idea of the process start with the last array item and work up!
          **/
          use: [
            /** finally we actually load the css!
             *  ------------------------------------------------------------------------------------
             *  in production MiniCssExtractPlugin loads the css as file/s
             *  in development the css is loaded through JS using style-loader
            **/
            {
              loader: isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
            },
            /** next parse import/url() rules
             *  ------------------------------------------------------------------------------------
            **/
            {
              loader: 'css-loader',
              options: {
                sourceMap: true,
              },
            },
            /** Third autoprefix the css
             *  ------------------------------------------------------------------------------------
             *  Autoprefixer uses the browserlist in package.json by default,
             *  we also pass extra options to it when we `require()` it at the top ^^
             *  this has to run after the sass is converted to css which is why there
             *  are two separate postcss-loader blocks. One to lint, one to prefix
            **/
            {
              loader: 'postcss-loader',
              options: {
                // need this all the way up, so successive loaders hang on to source maps!
                sourceMap: true,
                plugins: [
                  // we specify some rules for Autoprefixer where we `require` it
                  // at the top of this file...
                  Autoprefixer,
                ],
              },
            },
            /** Second convert our sass to standard css
             *  ------------------------------------------------------------------------------------
             *  this runs node-sass with the options we pass it!
            **/
            {
              loader: 'sass-loader',
              options: {
                sourceMap: true,
                outputStyle: 'compressed',
              },
            },
            /** First lint our non-transformed css
             *  ------------------------------------------------------------------------------------
             *  this runs first so that we lint before sass-loader compresses the code!
            **/
            {
              loader: 'postcss-loader',
              options: {
                // we install postcss-scss in package.json.
                // it is a parser that allows postcss to understand scss syntax
                // we're running stylelint on our .scss code, so we need this parser here
                parser: 'postcss-scss',
                plugins: [
                  // this const is brought in with `require()` at the top of this file
                  Stylelint,
                ],
              },
            },
          ],
        }, // .scss test
      ], // rules: [ ...
    }, // module: { ...

    // configuring webpack-dev-server in development only
    // ref: https://webpack.js.org/configuration/dev-server/#devserver
    devServer: (() => {
      /** using self executing functions as object literal property values
       *  ------------------------------------------------------------------------------------------
       *  ref: https://blog.flennik.com/the-fine-art-of-the-webpack-2-config-dc4d19d7f172
       *  this technique lets us use more complex conditionals
       *   to assign the values of properties right inside the body of the object literal.
       *   Neat trick!
      **/
      if (isProduction) {
        // no devServer in production...
        return {};
      }
      return {
        stats: 'normal',
        port: 9069,
        // Tell the dev-server we're using HMR (currently just for styling)
        hot: true,
        // renders client side routes when we don't have anything set up serverside
        historyApiFallback: true,
        // serving public files
        // contentBase: path.resolve(__dirname, 'public'),
      };
    })(),
  }; // client config object
};// module.exports = (env = {}) => {
