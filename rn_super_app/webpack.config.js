const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const Repack = require('@callstack/repack');

/**
 * More documentation, installation, usage, motivation and differences with Metro is available at:
 * https://github.com/callstack/repack/blob/main/README.md
 *
 * The API documentation for the functions and plugins used in this file is available at:
 * https://re-pack.netlify.app/
 */

/**
 * Webpack configuration.
 * You can also export a static object or a function returning a Promise.
 *
 * @param env Environment options passed from either Webpack CLI or React Native CLI
 *            when running with `react-native start/bundle`.
 */
module.exports = env => {
  const {
    mode = 'development',
    context = __dirname,
    entry = './index.js',
    platform = process.env.PLATFORM,
    // platform,
    minimize = mode === 'production',
    devServer = undefined,
    bundleFilename = undefined,
    sourceMapFilename = undefined,
    assetsPath = undefined,
    reactNativePath = require.resolve('react-native'),
  } = env;

  if (!platform) {
    throw new Error('Missing platform');
  }

  /**
   * Using Module Federation might require disabling hmr.
   * Uncomment below to set `devServer.hmr` to `false`.
   *
   * Keep in mind that `devServer` object is not available
   * when running `webpack-bundle` command. Be sure
   * to check its value to avoid accessing undefined value,
   * otherwise an error might occur.
   */
  // if (devServer) {
  //   devServer.hmr = false;
  // }

  /**
   * Depending on your Babel configuration you might want to keep it.
   * If you don't use `env` in your Babel config, you can remove it.
   *
   * Keep in mind that if you remove it you should set `BABEL_ENV` or `NODE_ENV`
   * to `development` or `production`. Otherwise your production code might be compiled with
   * in development mode by Babel.
   */
  process.env.BABEL_ENV = mode;

  return {
    mode,
    /**
     * This should be always `false`, since the Source Map configuration is done
     * by `SourceMapDevToolPlugin`.
     */
    devtool: false,
    context,
    /**
     * `getInitializationEntries` will return necessary entries with setup and initialization code.
     * If you don't want to use Hot Module Replacement, set `hmr` option to `false`. By default,
     * HMR will be enabled in development mode.
     */
    entry: [
      ...Repack.getInitializationEntries(reactNativePath, {
        hmr: devServer && devServer.hmr,
      }),
      entry,
    ],
    resolve: {
      /**
       * `getResolveOptions` returns additional resolution configuration for React Native.
       * If it's removed, you won't be able to use `<file>.<platform>.<ext>` (eg: `file.ios.js`)
       * convention and some 3rd-party libraries that specify `react-native` field
       * in their `package.json` might not work correctly.
       */
      ...Repack.getResolveOptions(platform),
      conditionNames: ['default', 'exports'],

      /**
       * Uncomment this to ensure all `react-native*` imports will resolve to the same React Native
       * dependency. You might need it when using workspaces/monorepos or unconventional project
       * structure. For simple/typical project you won't need it.
       */
      // alias: {
      //   'react-native': reactNativePath,
      // },
      alias: {
        // // 'react-native': reactNativePath,@hookform/resolvers
        // immer: path.resolve(__dirname, 'node_modules/immer'),
        // // immer: path.resolve(__dirname, 'node_modules/immer'),
        // '@hookform/resolvers': path.resolve(__dirname, 'node_modules/@hookform/resolvers'),
        // zod: path.resolve(__dirname, 'node_modules/zod/lib'),
        // // zod: path.resolve(__dirname, 'node_modules/zod'),
        // entities: path.resolve(__dirname, 'node_modules/entities'),
        // domelementtype: path.resolve(__dirname, 'node_modules/domelementtype'),
        // 'dom-serializer': path.resolve(
        //   __dirname,
        //   'node_modules/dom-serializer',
        // ),
        // domhandler: path.resolve(__dirname, 'node_modules/domhandler'),
        // 'nth-check': path.resolve(__dirname, 'node_modules/nth-check'),
        // domutils: path.resolve(__dirname, 'node_modules/domutils'),
        // 'css-select': path.resolve(__dirname, 'node_modules/css-select'),
        // 'react-hook-form': path.resolve(
        //   __dirname,
        //   'node_modules/react-hook-form',
        // ),
        // /domhandler dom-serializer domelementtype
        // axios: new URL('./node_modules/axios/index.js', import.meta.url)
        //   .pathname,
        // axios: path.join(dirname, 'node_modules/axios/dist/axios.js'),
        // axios: path.join(__dirname, 'node_modules/axios/dist/esm/axios.js'),
      },
    },
    /**
     * Configures output.
     * It's recommended to leave it as it is unless you know what you're doing.
     * By default Webpack will emit files into the directory specified under `path`. In order for the
     * React Native app use them when bundling the `.ipa`/`.apk`, they need to be copied over with
     * `Repack.OutputPlugin`, which is configured by default inside `Repack.RepackPlugin`.
     */
    output: {
      clean: true,
      hashFunction: 'xxhash64',
      path: path.join(__dirname, 'build/generated', platform),
      filename: 'index.bundle',
      chunkFilename: '[name].chunk.bundle',
      publicPath: Repack.getPublicPath({platform, devServer}),
    },
    /**
     * Configures optimization of the built bundle.
     */
    optimization: {
      /** Enables minification based on values passed from React Native CLI or from fallback. */
      minimize,
      /** Configure minimizer to process the bundle. */
      minimizer: [
        new TerserPlugin({
          test: /\.(js)?bundle(\?.*)?$/i,
          /**
           * Prevents emitting text file with comments, licenses etc.
           * If you want to gather in-file licenses, feel free to remove this line or configure it
           * differently.
           */
          extractComments: false,
          terserOptions: {
            format: {
              comments: false,
            },
          },
        }),
      ],
      chunkIds: 'named',
    },
    module: {
      /**
       * This rule will process all React Native related dependencies with Babel.
       * If you have a 3rd-party dependency that you need to transpile, you can add it to the
       * `include` list.
       *
       * You can also enable persistent caching with `cacheDirectory` - please refer to:
       * https://github.com/babel/babel-loader#options
       */
      rules: [
        {
          test: /\.[jt]sx?$/,
          include: [
            /node_modules(.*[/\\])+react\//,
            /node_modules(.*[/\\])+react-native/,
            /node_modules(.*[/\\])+react-freeze/,
            /node_modules(.*[/\\])+@react-native/,
            /node_modules(.*[/\\])+@react-navigation/,
            /node_modules(.*[/\\])+@react-native-community/,
            /node_modules(.*[/\\])+@expo/,
            /node_modules(.*[/\\])+pretty-format/,
            /node_modules(.*[/\\])+metro/,
            /node_modules(.*[/\\])+abort-controller/,
            /node_modules(.*[/\\])+@callstack\/repack/,
          ],
          use: 'babel-loader',
        },
        // {
        //   test: /\.svg$/,
        //   use: [
        //     {
        //       loader: '@svgr/webpack',
        //       options: {
        //         native: true,
        //         dimensions: false,
        //       },
        //     },
        //   ],
        // },
        /**
         * Here you can adjust loader that will process your files.
         *
         * You can also enable persistent caching with `cacheDirectory` - please refer to:
         * https://github.com/babel/babel-loader#options
         */
        {
          test: /\.[jt]sx?$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              /** Add React Refresh transform only when HMR is enabled. */
              plugins:
                devServer && devServer.hmr
                  ? ['module:react-refresh/babel']
                  : undefined,
            },
          },
        },

        {
          test: /\.[jt]sx?$/,
          // include: [
          //   /node_modules(.*[/\\])+axios\//,
          // ],
          include: [/node_modules(.*[/\\])+(axios|redux-toolkit)\//],
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                [
                  'module:metro-react-native-babel-preset',
                  {disableImportExportTransform: true},
                ],
              ],
            },
          },
        },

        /**
         * This loader handles all static assets (images, video, audio and others), so that you can
         * use (reference) them inside your application.
         *
         * If you wan to handle specific asset type manually, filter out the extension
         * from `ASSET_EXTENSIONS`, for example:
         * ```
         * Repack.ASSET_EXTENSIONS.filter((ext) => ext !== 'svg')
         * ```
         */
        {
          test: Repack.getAssetExtensionsRegExp(
            Repack.ASSET_EXTENSIONS.filter(ext => ext !== 'svg'),
            // Repack.ASSET_EXTENSIONS
          ),
          use: {
            loader: '@callstack/repack/assets-loader',
            options: {
              platform,
              devServerEnabled: Boolean(devServer),
              /**
               * Defines which assets are scalable - which assets can have
               * scale suffixes: `@1x`, `@2x` and so on.
               * By default all images are scalable.
               */
              scalableAssetExtensions: Repack.SCALABLE_ASSETS,
            },
          },
        },
      ],
    },
    plugins: [
      /**
       * Configure other required and additional plugins to make the bundle
       * work in React Native and provide good development experience with
       * sensible defaults.
       *
       * `Repack.RepackPlugin` provides some degree of customization, but if you
       * need more control, you can replace `Repack.RepackPlugin` with plugins
       * from `Repack.plugins`.
       */
      new Repack.RepackPlugin({
        context,
        mode,
        platform,
        devServer,
        output: {
          bundleFilename,
          sourceMapFilename,
          assetsPath,
        },
      }),
      // src/EmptyScreen.tsx

      new Repack.plugins.ModuleFederationPlugin({
        name: 'new_pack',
        exposes: {
          './App': './App.tsx',
          // './src/base/App': './src/base/App.tsx',
          // 'src/EmptyScreen': './src/EmptyScreen.tsx'
        },
        shared: {
          react: {
            ...Repack.Federated.SHARED_REACT,
            requiredVersion: '18.2.0',
          },
          'react-native': {
            ...Repack.Federated.SHARED_REACT_NATIVE,
            // requiredVersion: '0.72.5',
            requiredVersion: '0.71.3',
          },
        },
      }),
    ],
  };
};
